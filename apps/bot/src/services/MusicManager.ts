import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
  type AudioResource,
} from '@discordjs/voice';
import { EventEmitter } from 'node:events';
import type { GuildTextBasedChannel, VoiceBasedChannel, Message, Guild, GuildBasedChannel } from 'discord.js';
import type { TrackMetadata } from '../extractors/BaseExtractor.js';
import { AudioStreamer } from './AudioStreamer.js';
import { createNowPlayingEmbed, createErrorEmbed } from '../ui/embeds.js';
import { createPlayerComponents } from '../ui/buttons.js';
import { guildLanguageStore } from './GuildLanguageStore.js';

export type LoopMode = 'off' | 'track' | 'queue';

export class MusicManager extends EventEmitter {
  public readonly guildId: string;
  public voiceConnection: VoiceConnection | null = null;
  public readonly audioPlayer: AudioPlayer;
  public queue: TrackMetadata[] = [];
  public currentTrack: TrackMetadata | null = null;
  public previousTrack: TrackMetadata | null = null;  // DESIGN-07: Lưu bài trước
  public volume: number = 100;
  public loopMode: LoopMode = 'off';
  public isShuffle: boolean = false;
  public textChannel: GuildTextBasedChannel | null = null;
  public lastVoiceChannel: VoiceBasedChannel | null = null;
  public nowPlayingMessage: Message | null = null;
  public isDestroyed: boolean = false;

  private streamer: AudioStreamer;
  private currentResource: AudioResource<TrackMetadata> | null = null;
  private activeCleanup: (() => void) | null = null;
  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  // BUG-A2 FIX: Đếm số lần playNext() thất bại liên tiếp để ngăn đệ quy vô hạn
  private consecutiveFailures: number = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  // IMP-B7 FIX: Debounce timer cho updateNowPlayingMessage để ngăn dính Discord rate limit 429
  private nowPlayingDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(guildId: string, cookiesPath?: string) {
    super();
    this.guildId = guildId;
    this.streamer = new AudioStreamer(cookiesPath);

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        // IMP-B2 FIX: Dùng Stop thay vì Pause để khi VoiceConnection bị drop tạm thời,
        // AudioPlayer phát Idle event → handleTrackEnd() tự retry, tránh bot bị đóng băng
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    this.setupAudioPlayerListeners();
  }

  public notifyStateChange(): void {
    this.emit('stateChange');
    this.updateNowPlayingMessage(false).catch(() => {});
  }

  public ensureVoiceConnection(guild?: Guild): boolean {
    if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      return true;
    }

    if (this.lastVoiceChannel && this.lastVoiceChannel.guild) {
      try {
        this.join(this.lastVoiceChannel);
        return true;
      } catch (err) {
        console.warn(`[MusicManager ${this.guildId}] Không thể tham gia lại kênh voice cũ:`, err);
      }
    }

    if (guild) {
      // BUG-02 FIX: Filter to VoiceBasedChannel trước để tránh runtime error trên CategoryChannel
      const voiceChannels = guild.channels.cache.filter((c: GuildBasedChannel) => c.isVoiceBased());
      const activeChannel =
        voiceChannels.find((c) => c.isVoiceBased() && c.members.size > 0) ||
        voiceChannels.first();
      if (activeChannel && activeChannel.isVoiceBased()) {
        this.join(activeChannel);
        return true;
      }
    }

    return false;
  }

  private setupAudioPlayerListeners() {
    this.audioPlayer.on('debug', (message) => {
      console.log(`[AudioPlayer Debug ${this.guildId}]`, message);
    });

    this.audioPlayer.on('stateChange', (oldState, newState) => {
      console.log(`[AudioPlayer ${this.guildId}] State: ${oldState.status} -> ${newState.status}`);
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      // BUG-06 FIX: Không xử lý track end nếu manager đã bị destroy
      if (this.isDestroyed) return;
      this.handleTrackEnd();
    });

    this.audioPlayer.on('error', (error) => {
      console.error(`[MusicManager Guild ${this.guildId}] AudioPlayer Error:`, error.message);
      if (this.textChannel) {
        this.textChannel.send({
          embeds: [createErrorEmbed(`Lỗi phát âm thanh: ${error.message}`)],
        }).catch(() => { });
      }
      this.handleTrackEnd();
    });
  }

  public join(voiceChannel: VoiceBasedChannel, textChannel?: GuildTextBasedChannel): VoiceConnection {
    this.isDestroyed = false;
    if (textChannel) {
      this.textChannel = textChannel;
    }

    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      if (this.voiceConnection.joinConfig.channelId !== voiceChannel.id) {
        this.voiceConnection.rejoin({
          channelId: voiceChannel.id,
          selfDeaf: false,
          selfMute: false,
        });
      }
      return this.voiceConnection;
    }

    this.voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
      debug: false,
    });

    this.voiceConnection.subscribe(this.audioPlayer);

    this.voiceConnection.on('debug', (message) => {
      console.log(`[Voice Debug ${this.guildId}]`, message);
    });

    this.voiceConnection.on('stateChange', (oldState, newState) => {
      console.log(`[VoiceConnection ${this.guildId}] State: ${oldState.status} -> ${newState.status}`);
    });

    this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      // BUG-A1 FIX: Pattern chính thức discord.js v14 — chủ động rejoin trước rồi chờ Ready
      // Thay vì Promise.race 2 transitional states (sai logic) với timeout 5s quá ngắn
      if (this.isDestroyed) return;
      try {
        this.voiceConnection!.rejoin();
        await entersState(this.voiceConnection!, VoiceConnectionStatus.Ready, 20_000);
      } catch (_error) {
        console.warn(`[MusicManager ${this.guildId}] VoiceConnection không thể reconnect trong 20s. Đang hủy.`);
        this.destroy();
      }
    });

    return this.voiceConnection;
  }

  public async enqueue(tracks: TrackMetadata | TrackMetadata[], textChannel?: GuildTextBasedChannel) {
    this.isDestroyed = false;
    if (textChannel) {
      this.textChannel = textChannel;
    }

    const items = Array.isArray(tracks) ? tracks : [tracks];
    this.queue.push(...items);

    if (this.isShuffle && this.queue.length > 1) {
      this.shuffleQueueInternal();
    }

    this.notifyStateChange();

    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      await this.playNext();
    }
  }

  public async playNext(): Promise<boolean> {
    // BUG-06 FIX: Guard chống race condition khi destroy() đã được gọi
    if (this.isDestroyed) return false;
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }

    // Disable buttons on previous message when changing tracks
    if (this.nowPlayingMessage) {
      this.nowPlayingMessage.edit({ components: [] }).catch(() => { });
      this.nowPlayingMessage = null;
    }

    if (this.queue.length === 0) {
      this.currentTrack = null;
      this.currentResource = null;
      this.scheduleDisconnect();
      this.notifyStateChange();
      return false;
    }

    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    // Đảm bảo VoiceConnection đã kết nối thành công trước khi bắt đầu stream
    if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Ready) {
      try {
        await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 10_000);
      } catch (connErr) {
        console.warn(`[MusicManager ${this.guildId}] Chờ VoiceConnection Ready quá thời gian:`, connErr);
      }
    }

    let nextTrack: TrackMetadata;
    // Ưu tiên Lặp 1 Bài (loopMode === 'track') hơn Shuffle
    if (this.loopMode !== 'track' && this.isShuffle && this.queue.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.queue.length);
      nextTrack = this.queue.splice(randomIndex, 1)[0];
    } else {
      nextTrack = this.queue.shift()!;
    }
    this.previousTrack = this.currentTrack;  // DESIGN-07: Lưu lại bài hiện tại trước khi sang bài mới
    this.currentTrack = nextTrack;

    try {
      const { resource, cleanup } = await this.streamer.createAudioResource(nextTrack, {
        volume: this.volume,
      });

      this.currentResource = resource;
      this.activeCleanup = cleanup;

      this.audioPlayer.play(resource);

      // Gửi Now Playing Embed và lưu reference tin nhắn
      const lang = guildLanguageStore.getLanguage(this.guildId);
      if (this.textChannel) {
        const sentMsg = await this.textChannel.send({
          embeds: [createNowPlayingEmbed(nextTrack, this.volume, this.loopMode, this.isShuffle, this.queue.length, lang)],
          components: createPlayerComponents(false, this.loopMode, this.isShuffle, lang),
        }).catch(() => null);

        if (sentMsg) {
          this.nowPlayingMessage = sentMsg;
        }
      }

      // BUG-A2 FIX: Reset counter khi phát thành công
      this.consecutiveFailures = 0;
      this.notifyStateChange();
      return true;
    } catch (err) {
      let msg = err instanceof Error ? err.message : String(err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as { errors: unknown[] }).errors)) {
        const subMsgs = (err as { errors: Error[] }).errors.map((e) => e?.message || String(e)).filter(Boolean);
        if (subMsgs.length > 0) {
          msg = subMsgs.join('; ');
        }
      }
      console.error(`[MusicManager] Failed to play track "${nextTrack.title}":`, msg);

      const lang = guildLanguageStore.getLanguage(this.guildId);
      if (this.textChannel) {
        this.textChannel.send({
          embeds: [createErrorEmbed(`Failed to play "${nextTrack.title}": ${msg}`, lang)],
        }).catch(() => { });
      }

      // BUG-A2 FIX: Giới hạn số lần đệ quy liên tiếp để ngăn crash Node.js
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        console.error(`[MusicManager ${this.guildId}] ${this.MAX_CONSECUTIVE_FAILURES} lần thất bại liên tiếp. Dừng phát và lên lịch ngắt kết nối.`);
        if (this.textChannel) {
          this.textChannel.send({
            embeds: [createErrorEmbed(`Đã bỏ qua ${this.MAX_CONSECUTIVE_FAILURES} bài liên tiếp do lỗi. Hàng đợi bị tạm dừng.`)],
          }).catch(() => {});
        }
        this.consecutiveFailures = 0;
        this.scheduleDisconnect();
        return false;
      }
      return this.playNext();
    }
  }

  public async updateNowPlayingMessage(immediate: boolean = true): Promise<void> {
    if (!this.nowPlayingMessage || !this.currentTrack) return;

    // IMP-B7 FIX: Nếu không phải immediate (ví dụ từ volume slider, toggle button liên tiếp),
    // debounce 500ms để không vượt quá giới hạn 5 edits / 5s của Discord API
    if (!immediate) {
      if (this.nowPlayingDebounceTimer) {
        clearTimeout(this.nowPlayingDebounceTimer);
      }
      this.nowPlayingDebounceTimer = setTimeout(() => {
        this.nowPlayingDebounceTimer = null;
        this.updateNowPlayingMessage(true).catch(() => {});
      }, 500);
      return;
    }

    if (this.nowPlayingDebounceTimer) {
      clearTimeout(this.nowPlayingDebounceTimer);
      this.nowPlayingDebounceTimer = null;
    }

    const lang = guildLanguageStore.getLanguage(this.guildId);
    const isPaused = this.audioPlayer.state.status === 'paused';
    await this.nowPlayingMessage.edit({
      embeds: [createNowPlayingEmbed(this.currentTrack, this.volume, this.loopMode, this.isShuffle, this.queue.length, lang)],
      components: createPlayerComponents(isPaused, this.loopMode, this.isShuffle, lang),
    }).catch(() => { });
  }

  private handleTrackEnd() {
    if (!this.currentTrack) return;

    if (this.loopMode === 'track') {
      this.queue.unshift(this.currentTrack);
    } else if (this.loopMode === 'queue') {
      this.queue.push(this.currentTrack);
    }

    this.playNext();
  }

  public pause(): boolean {
    const ok = this.audioPlayer.pause();
    if (ok) {
      this.scheduleDisconnect(); // Lên lịch ngắt kết nối nếu pause quá 3 phút không ai resume
      this.notifyStateChange();
    }
    return ok;
  }

  public resume(): boolean {
    const ok = this.audioPlayer.unpause();
    if (ok) {
      if (this.disconnectTimeout) {
        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = null;
      }
      this.notifyStateChange();
    }
    return ok;
  }

  public skip(): boolean {
    if (!this.currentTrack) return false;
    this.audioPlayer.stop();
    this.notifyStateChange();
    return true;
  }

  public stop(): void {
    if (this.nowPlayingMessage) {
      this.nowPlayingMessage.edit({ components: [] }).catch(() => { });
      this.nowPlayingMessage = null;
    }
    this.queue = [];
    this.currentTrack = null;
    this.isShuffle = false;
    this.audioPlayer.stop(true);
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }
    this.scheduleDisconnect();
    this.notifyStateChange();
  }

  public setVolume(vol: number): boolean {
    this.volume = Math.max(0, Math.min(150, vol));
    let success = false;
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(this.volume / 100);
      success = true;
    }
    this.notifyStateChange();
    return success;
  }

  public getPlaybackPosition(): number {
    return Math.floor((this.currentResource?.playbackDuration || 0) / 1000);
  }

  // DESIGN-07: Phát lại bài trước (Prev Track)
  public async playPrev(): Promise<boolean> {
    if (!this.previousTrack) return false;
    // Đưa bài hiện tại và bài trước trở lại queue đầu
    if (this.currentTrack) {
      this.queue.unshift(this.currentTrack);
    }
    this.queue.unshift(this.previousTrack);
    this.previousTrack = null;
    this.audioPlayer.stop();
    this.notifyStateChange();
    return true;
  }

  // DESIGN-06: Seek đến vị trí cụ thể trong bài (tính bằng giây)
  // Lưu ý: @discordjs/voice không hỗ trợ seek native — cách duy nhất là tạo lại stream từ seek position
  public async seekTo(seconds: number): Promise<boolean> {
    if (!this.currentTrack) return false;

    // Dừng stream hiện tại
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }

    try {
      const { resource, cleanup } = await this.streamer.createAudioResource(this.currentTrack, {
        volume: this.volume,
        seek: seconds,
      });
      this.currentResource = resource;
      this.activeCleanup = cleanup;
      this.audioPlayer.play(resource);
      this.notifyStateChange();
      return true;
    } catch (err) {
      console.error(`[MusicManager] seekTo failed:`, err);
      return false;
    }
  }

  public setLoop(mode: LoopMode): LoopMode {
    this.loopMode = mode;
    this.notifyStateChange();
    return this.loopMode;
  }

  public toggleShuffle(): boolean {
    this.isShuffle = !this.isShuffle;
    if (this.isShuffle && this.queue.length > 0) {
      this.shuffleQueueInternal();
    }
    this.notifyStateChange();
    return this.isShuffle;
  }

  private shuffleQueueInternal(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  public shuffle(): number {
    this.isShuffle = true;
    this.shuffleQueueInternal();
    this.notifyStateChange();
    return this.queue.length;
  }

  private scheduleDisconnect() {
    if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);
    // Tự động ngắt kết nối sau 3 phút không hoạt động để giải phóng tài nguyên
    this.disconnectTimeout = setTimeout(() => {
      this.destroy();
    }, 3 * 60 * 1000);
  }

  public destroy(): void {
    // BUG-01 FIX: KHÔNG gọi stop() để tránh vòng lặp setTimeout vô hạn
    // stop() → scheduleDisconnect() → setTimeout(destroy) → destroy() → stop() → ...
    this.isDestroyed = true;

    // Hủy disconnect timeout trước
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    // IMP-B7 FIX: Hủy debounce timer nếu đang chờ
    if (this.nowPlayingDebounceTimer) {
      clearTimeout(this.nowPlayingDebounceTimer);
      this.nowPlayingDebounceTimer = null;
    }

    // Dọn Now Playing message
    if (this.nowPlayingMessage) {
      this.nowPlayingMessage.edit({ components: [] }).catch(() => { });
      this.nowPlayingMessage = null;
    }

    // Dọn stream cleanup
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }

    // Dừng audio player
    this.audioPlayer.stop(true);

    // Reset state
    this.queue = [];
    this.currentTrack = null;
    this.currentResource = null;

    // Ngắt kết nối voice
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = null;
    }

    this.emit('stateChange');
    this.emit('destroy');
  }
}

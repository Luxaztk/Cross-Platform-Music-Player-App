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
import type { GuildTextBasedChannel, VoiceBasedChannel, Message } from 'discord.js';
import type { TrackMetadata } from '../extractors/BaseExtractor.js';
import { AudioStreamer } from './AudioStreamer.js';
import { createNowPlayingEmbed, createErrorEmbed } from '../ui/embeds.js';
import { createPlayerComponents } from '../ui/buttons.js';
import { guildLanguageStore } from './GuildLanguageStore.js';

export type LoopMode = 'off' | 'track' | 'queue';

export class MusicManager {
  public readonly guildId: string;
  public voiceConnection: VoiceConnection | null = null;
  public readonly audioPlayer: AudioPlayer;
  public queue: TrackMetadata[] = [];
  public currentTrack: TrackMetadata | null = null;
  public volume: number = 100;
  public loopMode: LoopMode = 'off';
  public isShuffle: boolean = false;
  public textChannel: GuildTextBasedChannel | null = null;
  public nowPlayingMessage: Message | null = null;

  private streamer: AudioStreamer;
  private currentResource: AudioResource<TrackMetadata> | null = null;
  private activeCleanup: (() => void) | null = null;
  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(guildId: string, cookiesPath?: string) {
    this.guildId = guildId;
    this.streamer = new AudioStreamer(cookiesPath);

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    this.setupAudioPlayerListeners();
  }

  private setupAudioPlayerListeners() {
    this.audioPlayer.on('debug', (message) => {
      console.log(`[AudioPlayer Debug ${this.guildId}]`, message);
    });

    this.audioPlayer.on('stateChange', (oldState, newState) => {
      console.log(`[AudioPlayer ${this.guildId}] State: ${oldState.status} -> ${newState.status}`);
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.handleTrackEnd();
    });

    this.audioPlayer.on('error', (error) => {
      console.error(`[MusicManager Guild ${this.guildId}] AudioPlayer Error:`, error.message);
      if (this.textChannel) {
        this.textChannel.send({
          embeds: [createErrorEmbed(`Lỗi phát âm thanh: ${error.message}`)],
        }).catch(() => {});
      }
      this.handleTrackEnd();
    });
  }

  public join(voiceChannel: VoiceBasedChannel, textChannel?: GuildTextBasedChannel): VoiceConnection {
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
      try {
        await Promise.race([
          entersState(this.voiceConnection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.voiceConnection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (_error) {
        this.destroy();
      }
    });

    return this.voiceConnection;
  }

  public async enqueue(tracks: TrackMetadata | TrackMetadata[], textChannel?: GuildTextBasedChannel) {
    if (textChannel) {
      this.textChannel = textChannel;
    }

    const items = Array.isArray(tracks) ? tracks : [tracks];
    this.queue.push(...items);

    if (this.isShuffle && this.queue.length > 1) {
      this.shuffleQueueInternal();
    }

    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      await this.playNext();
    }
  }

  public async playNext(): Promise<boolean> {
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }

    // Disable buttons on previous message when changing tracks
    if (this.nowPlayingMessage) {
      this.nowPlayingMessage.edit({ components: [] }).catch(() => {});
      this.nowPlayingMessage = null;
    }

    if (this.queue.length === 0) {
      this.currentTrack = null;
      this.currentResource = null;
      this.scheduleDisconnect();
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
        }).catch(() => {});
      }

      // Thử phát bài tiếp theo
      return this.playNext();
    }
  }

  public async updateNowPlayingMessage(): Promise<void> {
    if (!this.nowPlayingMessage || !this.currentTrack) return;
    const lang = guildLanguageStore.getLanguage(this.guildId);
    const isPaused = this.audioPlayer.state.status === 'paused';
    await this.nowPlayingMessage.edit({
      embeds: [createNowPlayingEmbed(this.currentTrack, this.volume, this.loopMode, this.isShuffle, this.queue.length, lang)],
      components: createPlayerComponents(isPaused, this.loopMode, this.isShuffle, lang),
    }).catch(() => {});
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
    return this.audioPlayer.pause();
  }

  public resume(): boolean {
    return this.audioPlayer.unpause();
  }

  public skip(): boolean {
    if (!this.currentTrack) return false;
    this.audioPlayer.stop();
    return true;
  }

  public stop(): void {
    if (this.nowPlayingMessage) {
      this.nowPlayingMessage.edit({ components: [] }).catch(() => {});
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
  }

  public setVolume(vol: number): boolean {
    this.volume = Math.max(0, Math.min(150, vol));
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(this.volume / 100);
      return true;
    }
    return false;
  }

  public setLoop(mode: LoopMode): LoopMode {
    this.loopMode = mode;
    return this.loopMode;
  }

  public toggleShuffle(): boolean {
    this.isShuffle = !this.isShuffle;
    if (this.isShuffle && this.queue.length > 0) {
      this.shuffleQueueInternal();
    }
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
    this.stop();
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = null;
    }
  }
}

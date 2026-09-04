import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
  type Guild,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { loadConfig, type BotConfig } from '../config/env.js';
import { VoiceConnectionStatus } from '@discordjs/voice';
import { MusicManager } from './MusicManager.js';
import { AudioStreamer } from './AudioStreamer.js';

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommand {
  data: SlashCommandData;
  execute: (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<void>;
}

export class BotClient extends Client {
  public config: BotConfig;
  public commands: Collection<string, SlashCommand> = new Collection();
  public musicManagers: Map<string, MusicManager> = new Map();
  public streamer: AudioStreamer;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        // DESIGN-02: MessageContent intent không được bật vì bot chỉ dùng
        // Slash Commands — không cần đọc nội dung tin nhắn thô. Nếu tương lai
        // cần prefix commands, thêm GatewayIntentBits.MessageContent TẠI ĐÂY
        // và bật Privileged Intent trong Discord Developer Portal.
      ],
    });

    this.config = loadConfig();
    this.streamer = new AudioStreamer(this.config.cookiesPath);

    // DESIGN-01 FIX: Tự động dọn MusicManager khi bot bị kick/ban khỏi server
    // Ngăn chặn memory leak do các instance MusicManager zombie tích lũy
    this.on(Events.GuildDelete, (guild: Guild) => {
      const manager = this.musicManagers.get(guild.id);
      if (manager) {
        console.log(`[BotClient] Bot bị xóa khỏi server "${guild.name}" (${guild.id}). Đang dọn MusicManager...`);
        manager.destroy();
        this.musicManagers.delete(guild.id);
      }
    });

    // DEP-C4 FIX: Tự động kết nối lại Voice sau khi Discord Gateway reconnect (ShardResume)
    this.on(Events.ShardResume, (shardId: number) => {
      console.log(`[BotClient] Shard ${shardId} đã phục hồi kết nối. Đang kiểm tra và auto-rejoin voice...`);
      for (const [guildId, manager] of this.musicManagers.entries()) {
        if (!manager.isDestroyed && manager.currentTrack && manager.lastVoiceChannel) {
          const status = manager.voiceConnection?.state.status;
          if (
            !manager.voiceConnection ||
            status === VoiceConnectionStatus.Destroyed ||
            status === VoiceConnectionStatus.Disconnected
          ) {
            console.log(`[BotClient] Đang tự động kết nối lại Voice cho guild ${guildId}...`);
            manager.ensureVoiceConnection();
          }
        }
      }
    });

    // DEP-C4 FIX: Theo dõi voiceStateUpdate để phát hiện bot bị ngắt voice ngoài ý muốn
    this.on(Events.VoiceStateUpdate, (oldState, newState) => {
      if (oldState.member?.id !== this.user?.id) return;
      if (oldState.channelId && !newState.channelId) {
        const manager = this.musicManagers.get(oldState.guild.id);
        if (manager && !manager.isDestroyed && manager.currentTrack) {
          console.warn(`[BotClient] Bot bị ngắt kết nối voice tại "${oldState.guild.name}". Giữ manager để chờ reconnect.`);
        }
      }
    });
  }

  public getMusicManager(guildId: string): MusicManager {
    const existing = this.musicManagers.get(guildId);
    // IMP-B1 FIX: Không gọi destroy() lần 2 trên manager đã isDestroyed = true
    // GC sẽ tự dọn instance cũ sau khi Map reference bị thay thế
    if (!existing || existing.isDestroyed) {
      const manager = new MusicManager(guildId, this.config.cookiesPath);
      this.musicManagers.set(guildId, manager);
      return manager;
    }
    return existing;
  }

  // DESIGN-09 FIX: Xóa MusicManager khỏi Map sau khi destroy để tránh zombie instances
  public removeMusicManager(guildId: string): void {
    const manager = this.musicManagers.get(guildId);
    if (manager) {
      manager.destroy();
      this.musicManagers.delete(guildId);
      console.log(`[BotClient] MusicManager cho guild ${guildId} đã được dọn dẹp.`);
    }
  }
}


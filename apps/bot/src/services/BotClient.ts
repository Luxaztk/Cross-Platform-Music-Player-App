import {
  Client,
  Collection,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { loadConfig, type BotConfig } from '../config/env.js';
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
      ],
    });

    this.config = loadConfig();
    this.streamer = new AudioStreamer(this.config.cookiesPath);
  }

  public getMusicManager(guildId: string): MusicManager {
    let manager = this.musicManagers.get(guildId);
    if (!manager) {
      manager = new MusicManager(guildId, this.config.cookiesPath);
      this.musicManagers.set(guildId, manager);
    }
    return manager;
  }
}

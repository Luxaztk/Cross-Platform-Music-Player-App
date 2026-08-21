import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed, createErrorEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';
import type { LoopMode } from '../services/MusicManager.js';

export const loopCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription(botT('en', 'cmd.loop.description'))
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode: off | track | queue')
        .setRequired(true)
        .addChoices(
          { name: 'Off — Không lặp', value: 'off' },
          { name: '🔂 Track — Lặp 1 bài', value: 'track' },
          { name: '🔁 Queue — Lặp toàn bộ', value: 'queue' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = guildLanguageStore.getLanguage(interaction.guildId);
    const mode = interaction.options.getString('mode', true) as LoopMode;
    const musicManager = client.getMusicManager(interaction.guildId!);

    if (!musicManager.currentTrack && musicManager.queue.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.pause.no_track'), lang)],
        ephemeral: true,
      });
      return;
    }

    musicManager.setLoop(mode);
    musicManager.updateNowPlayingMessage();

    const successKey =
      mode === 'track' ? 'cmd.loop.success_track'
      : mode === 'queue' ? 'cmd.loop.success_queue'
      : 'cmd.loop.success_off';

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'common.success'), botT(lang, successKey), lang)],
    });
  },
};

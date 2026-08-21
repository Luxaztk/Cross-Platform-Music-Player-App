import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed, createErrorEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const stopCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription(botT('en', 'cmd.stop.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const musicManager = client.getMusicManager(interaction.guildId!);
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    if (!musicManager.currentTrack && musicManager.queue.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.pause.no_track'), lang)],
        ephemeral: true,
      });
      return;
    }

    musicManager.stop();

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'btn.stop'), botT(lang, 'cmd.stop.success'), lang)],
    });
  },
};

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const skipCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription(botT('en', 'cmd.skip.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const musicManager = client.getMusicManager(interaction.guildId!);
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    if (!musicManager.currentTrack) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.skip.no_track'), lang)],
        ephemeral: true,
      });
      return;
    }

    const skippedTitle = musicManager.currentTrack.title;
    musicManager.skip();

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'btn.skip'), `**${skippedTitle}**`, lang)],
    });
  },
};

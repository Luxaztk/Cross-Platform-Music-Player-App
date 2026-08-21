import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const resumeCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription(botT('en', 'cmd.resume.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const musicManager = client.getMusicManager(interaction.guildId!);
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    if (!musicManager.currentTrack) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.pause.no_track'), lang)],
        ephemeral: true,
      });
      return;
    }

    const isPaused = musicManager.audioPlayer.state.status === 'paused';

    if (!isPaused) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.resume.already_playing'), lang)],
        ephemeral: true,
      });
      return;
    }

    musicManager.resume();
    musicManager.updateNowPlayingMessage();

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'btn.resume'), botT(lang, 'cmd.resume.success'), lang)],
    });
  },
};

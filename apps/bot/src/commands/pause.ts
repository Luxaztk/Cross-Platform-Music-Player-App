import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const pauseCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription(botT('en', 'cmd.pause.description')),

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

    if (isPaused) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.pause.already_paused'), lang)],
        ephemeral: true,
      });
      return;
    }

    musicManager.pause();
    musicManager.updateNowPlayingMessage();

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'btn.pause'), botT(lang, 'cmd.pause.paused'), lang)],
    });
  },
};

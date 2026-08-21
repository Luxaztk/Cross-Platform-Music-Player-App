import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const volumeCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription(botT('en', 'cmd.volume.description'))
    .addIntegerOption((option) =>
      option
        .setName('percent')
        .setDescription('Volume percentage (0 to 150)')
        .setMinValue(0)
        .setMaxValue(150)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const musicManager = client.getMusicManager(interaction.guildId!);
    const percent = interaction.options.getInteger('percent', true);
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    musicManager.setVolume(percent);
    musicManager.updateNowPlayingMessage();

    await interaction.reply({
      embeds: [createSuccessEmbed('Volume', botT(lang, 'cmd.volume.success', { volume: percent }), lang)],
    });
  },
};

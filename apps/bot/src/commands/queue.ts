import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createQueueEmbed } from '../ui/embeds.js';
import { createQueuePaginationComponents } from '../ui/buttons.js';
import { botT } from '@music/i18n';

export const queueCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription(botT('en', 'cmd.queue.description'))
    .addIntegerOption((option) =>
      option
        .setName('page')
        .setDescription('Queue page number (default: 1)')
        .setMinValue(1)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const musicManager = client.getMusicManager(interaction.guildId!);
    const page = interaction.options.getInteger('page') || 1;
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    const embed = createQueueEmbed(
      musicManager.currentTrack,
      musicManager.queue,
      page,
      lang
    );

    const totalPages = Math.max(1, Math.ceil(musicManager.queue.length / 10));
    const components = createQueuePaginationComponents(page, totalPages, lang);

    await interaction.reply({ embeds: [embed], components });
  },
};

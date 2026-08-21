import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed, createErrorEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const shuffleCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription(botT('en', 'cmd.shuffle.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = guildLanguageStore.getLanguage(interaction.guildId);
    const musicManager = client.getMusicManager(interaction.guildId!);

    if (!musicManager.currentTrack && musicManager.queue.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.shuffle.empty'), lang)],
        ephemeral: true,
      });
      return;
    }

    const isShuffleNow = musicManager.toggleShuffle();
    musicManager.updateNowPlayingMessage();
    const msgKey = isShuffleNow ? 'cmd.shuffle.enabled' : 'cmd.shuffle.disabled';

    await interaction.reply({
      embeds: [createSuccessEmbed(
        botT(lang, 'common.success'),
        botT(lang, msgKey),
        lang
      )],
    });
  },
};

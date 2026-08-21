import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed } from '../ui/embeds.js';
import { botT, type BotLanguage } from '@music/i18n';

export const languageCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription(botT('en', 'cmd.language.description'))
    .addStringOption((option) =>
      option
        .setName('lang')
        .setDescription('Select bot display language for this server')
        .setRequired(true)
        .addChoices(
          { name: 'Tiếng Việt 🇻🇳', value: 'vi' },
          { name: 'English 🇺🇸', value: 'en' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const guildId = interaction.guildId;
    const selectedLang = interaction.options.getString('lang', true) as BotLanguage;

    if (guildId) {
      guildLanguageStore.setLanguage(guildId, selectedLang);
    }

    const successMsg = botT(selectedLang, 'cmd.language.success');

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(selectedLang, 'common.success'), successMsg, selectedLang)],
    });
  },
};

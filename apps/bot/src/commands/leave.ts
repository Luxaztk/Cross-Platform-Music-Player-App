import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const leaveCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription(botT('en', 'cmd.leave.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const musicManager = client.getMusicManager(interaction.guildId!);
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    if (!musicManager.voiceConnection) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'cmd.leave.success'), lang)],
        ephemeral: true,
      });
      return;
    }

    // DESIGN-09 FIX: Dùng removeMusicManager thay vì destroy() trực tiếp
    // để xóa instance khỏi Map, tránh zombie instance tích lũy trong memory
    client.removeMusicManager(interaction.guildId!);

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'common.success'), botT(lang, 'cmd.leave.success'), lang)],
    });
  },
};

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const appCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('app')
    .setDescription('Launch MeloVista Embedded Activity Player UI'),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = guildLanguageStore.getLanguage(interaction.guildId);
    const clientId = client.user?.id || process.env.DISCORD_CLIENT_ID || '';
    const activityUrl = `https://discord.com/activities/${clientId}`;

    const embed = createSuccessEmbed(
      '🎮 MeloVista Player UI & Activity Launcher',
      'Chọn phương thức mở Giao diện MeloVista (Spotify-style):\n\n' +
        '• **🌐 Open Web Player**: Mở giao diện ngay trên Trình duyệt Web.\n' +
        '• **🚀 Launch Activity**: Khởi chạy ứng dụng đồ họa ngay trong Discord Voice Channel.',
      lang
    );

    const tunnelUrl = process.env.ACTIVITY_PUBLIC_URL || 'https://appreciation-proprietary-tsunami-brands.trycloudflare.com';

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Open Web Player (Browser)')
        .setStyle(ButtonStyle.Link)
        .setURL(tunnelUrl),
      new ButtonBuilder()
        .setLabel('🚀 Launch Activity in Discord')
        .setStyle(ButtonStyle.Link)
        .setURL(activityUrl)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};

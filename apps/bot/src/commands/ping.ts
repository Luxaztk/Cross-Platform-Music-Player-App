import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription(botT('en', 'cmd.ping.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    const response = await interaction.reply({
      content: botT(lang, 'common.measuring'),
      withResponse: true,
    });

    const sentTimestamp = response.resource?.message?.createdTimestamp ?? Date.now();
    const latency = sentTimestamp - interaction.createdTimestamp;
    const wsPing = client.ws.ping;

    const buildEmbed = (pingVal: number) => {
      const pingText = pingVal >= 0 ? `${pingVal}ms` : botT(lang, 'cmd.ping.initializing');
      return createSuccessEmbed(
        botT(lang, 'cmd.ping.title'),
        `${botT(lang, 'cmd.ping.roundtrip')}: \`${latency}ms\`\n${botT(lang, 'cmd.ping.websocket')}: \`${pingText}\``,
        lang
      );
    };

    await interaction.editReply({ content: '', embeds: [buildEmbed(wsPing)] });

    if (wsPing < 0) {
      const interval = setInterval(() => {
        if (client.ws.ping >= 0) {
          clearInterval(interval);
          interaction.editReply({ embeds: [buildEmbed(client.ws.ping)] }).catch(() => {});
        }
      }, 1000);

      setTimeout(() => clearInterval(interval), 45000);
    }
  },
};

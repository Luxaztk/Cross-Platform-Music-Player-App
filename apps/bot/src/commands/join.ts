import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember, type GuildTextBasedChannel } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createSuccessEmbed } from '../ui/embeds.js';
import { botT } from '@music/i18n';

export const joinCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription(botT('en', 'cmd.join.description')),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    const lang = guildLanguageStore.getLanguage(interaction.guildId);

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [createErrorEmbed(botT(lang, 'common.must_be_in_voice'), lang)],
        ephemeral: true,
      });
      return;
    }

    const musicManager = client.getMusicManager(interaction.guildId!);
    musicManager.join(voiceChannel, (interaction.channel as GuildTextBasedChannel) ?? undefined);

    await interaction.reply({
      embeds: [createSuccessEmbed(botT(lang, 'common.success'), botT(lang, 'cmd.join.success', { channel: voiceChannel.name }), lang)],
    });
  },
};

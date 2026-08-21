import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember, type GuildTextBasedChannel } from 'discord.js';
import type { SlashCommand, BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createSuccessEmbed } from '../ui/embeds.js';
import { formatTime } from '@music/utils';
import { botT } from '@music/i18n';

export const playCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(botT('en', 'cmd.play.description'))
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Track title, YouTube link, Playlist, or Local PC file path')
        .setRequired(true)
    ),

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

    const query = interaction.options.getString('query', true).trim();

    await interaction.deferReply();

    const musicManager = client.getMusicManager(interaction.guildId!);
    const textChannel = (interaction.channel as GuildTextBasedChannel) ?? undefined;

    // Kết nối vào voice channel nếu chưa tham gia
    if (!musicManager.voiceConnection) {
      musicManager.join(voiceChannel, textChannel);
    }

    try {
      const result = await client.streamer.getTrackInfo(query, member.user.username);

      if (!result.tracks || result.tracks.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed(botT(lang, 'common.no_tracks_found', { query }), lang)],
        });
        return;
      }

      if (result.tracks.length === 1) {
        const track = result.tracks[0];
        const durationStr = track.duration > 0 ? formatTime(track.duration) : botT(lang, 'common.lossless');
        const isWeb = track.url && (track.url.startsWith('http://') || track.url.startsWith('https://'));
        const trackTitle = isWeb ? `[${track.title}](${track.url})` : track.title;

        const embed = createSuccessEmbed(
          botT(lang, 'common.added_to_queue'),
          `**${trackTitle}** — ${track.artist} (\`${durationStr}\`)`,
          lang
        );

        if (isWeb && track.thumbnail) {
          embed.setThumbnail(track.thumbnail);
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createSuccessEmbed(
          botT(lang, 'common.playlist_added'),
          `Added **${result.tracks.length} ${botT(lang, 'common.tracks')}** from **${result.playlistTitle || query}**`,
          lang
        );
        await interaction.editReply({ embeds: [embed] });
      }

      // Đưa bài hát vào hàng đợi và kích hoạt phát nhạc
      await musicManager.enqueue(result.tracks, textChannel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Command /play Error]', msg);
      await interaction.editReply({
        embeds: [createErrorEmbed(`${botT(lang, 'common.error')}: ${msg}`, lang)],
      });
    }
  },
};

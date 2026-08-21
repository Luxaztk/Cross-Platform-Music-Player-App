import { EmbedBuilder } from 'discord.js';
import type { TrackMetadata } from '../extractors/BaseExtractor.js';
import type { LoopMode } from '../services/MusicManager.js';
import { formatTime } from '@music/utils';
import { botT, type BotLanguage } from '@music/i18n';

const EMBED_COLOR = 0x10b981;
const ERROR_COLOR = 0xef4444;

function isWebUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

function formatTrackTitle(title: string, url?: string): string {
  return isWebUrl(url) ? `[${title}](${url})` : title;
}

export function createNowPlayingEmbed(
  track: TrackMetadata,
  volume: number,
  loopMode: LoopMode,
  isShuffle: boolean = false,
  queueLength: number = 0,
  lang: BotLanguage = 'vi'
): EmbedBuilder {
  const durationStr = track.duration > 0 ? formatTime(track.duration) : botT(lang, 'common.lossless');
  const loopStr = loopMode === 'off' ? 'Off' : loopMode === 'track' ? 'Track' : 'Queue';
  const shuffleStr = isShuffle ? 'On' : 'Off';
  const titleFormatted = formatTrackTitle(track.title, track.url);

  const description = [
    `**${titleFormatted}**`,
    `${track.artist} • \`${durationStr}\``,
    '',
    `Vol: \`${volume}%\`  •  Loop: \`${loopStr}\`  •  Shuffle: \`${shuffleStr}\`  •  Queue: \`${queueLength} ${botT(lang, 'common.tracks')}\``,
  ].join('\n');

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setAuthor({ name: 'MELOVISTA PLAYER' })
    .setDescription(description)
    .setTimestamp();

  if (track.requestedBy) {
    embed.setFooter({ text: botT(lang, 'common.requested_by', { user: track.requestedBy }) });
  }

  if (isWebUrl(track.url)) {
    embed.setURL(track.url);
  }

  if (isWebUrl(track.thumbnail)) {
    embed.setThumbnail(track.thumbnail!);
  }

  return embed;
}

export function createQueueEmbed(
  currentTrack: TrackMetadata | null,
  queue: TrackMetadata[],
  page: number = 1,
  lang: BotLanguage = 'vi'
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setAuthor({ name: 'MELOVISTA QUEUE' });

  let description = '';

  if (currentTrack) {
    const titleLink = formatTrackTitle(currentTrack.title, currentTrack.url);
    const durationStr = currentTrack.duration > 0 ? formatTime(currentTrack.duration) : botT(lang, 'common.lossless');
    description += `**${botT(lang, 'common.now_playing')}:**\n${titleLink} • \`${durationStr}\`\n\n`;
  } else {
    description += `*${botT(lang, 'common.queue_empty')}*\n\n`;
  }

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(queue.length / itemsPerPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * itemsPerPage;
  const currentItems = queue.slice(start, start + itemsPerPage);

  if (currentItems.length > 0) {
    description += `**${botT(lang, 'common.up_next')} (${queue.length} ${botT(lang, 'common.tracks')}):**\n`;
    currentItems.forEach((track, idx) => {
      const num = start + idx + 1;
      const durationStr = track.duration > 0 ? formatTime(track.duration) : 'Local';
      const titleLink = formatTrackTitle(track.title, track.url);
      description += `\`${num}.\` ${titleLink} — ${track.artist} (\`${durationStr}\`)\n`;
    });
  }

  embed.setDescription(description);
  embed.setFooter({ text: botT(lang, 'common.page', { current: currentPage, total: totalPages }) });

  return embed;
}

export function createSuccessEmbed(
  title: string,
  message?: string,
  _lang: BotLanguage = 'vi'
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setTitle(title);
  if (message) {
    embed.setDescription(message);
  }
  return embed;
}

export function createErrorEmbed(message: string, lang: BotLanguage = 'vi'): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle(botT(lang, 'common.error'))
    .setDescription(message);
}

export function createInfoEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setDescription(message);
}

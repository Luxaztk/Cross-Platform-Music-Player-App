import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { botT, type BotLanguage } from '@music/i18n';
import type { LoopMode } from '../services/MusicManager.js';

/**
 * Phân bổ cân bằng 6 nút bấm vào 2 hàng (mỗi hàng 3 nút).
 * Nút Shuffle và Loop sáng màu Xanh (Primary) khi đang BẬT.
 * Row 1: [ ⏸ Pause / ▶ Resume ] [ ⏭ Next ] [ ■ Stop ]
 * Row 2: [ ☰ Queue ] [ ↺ Loop ] [ ⤮ Shuffle ]
 */
export function createPlayerComponents(
  isPaused: boolean = false,
  loopMode: LoopMode = 'off',
  isShuffle: boolean = false,
  lang: BotLanguage = 'vi'
): ActionRowBuilder<ButtonBuilder>[] {
  // Row 1: Điều khiển phát (3 nút)
  const pauseResumeBtn = new ButtonBuilder()
    .setCustomId('btn_pause_resume')
    .setLabel(isPaused ? `▶  ${botT(lang, 'btn.resume')}` : `⏸  ${botT(lang, 'btn.pause')}`)
    .setStyle(ButtonStyle.Secondary);

  const skipBtn = new ButtonBuilder()
    .setCustomId('btn_skip')
    .setLabel(`⏭  ${botT(lang, 'btn.skip')}`)
    .setStyle(ButtonStyle.Secondary);

  const stopBtn = new ButtonBuilder()
    .setCustomId('btn_stop')
    .setLabel(`■  ${botT(lang, 'btn.stop')}`)
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    pauseResumeBtn,
    skipBtn,
    stopBtn
  );

  // Row 2: Chế độ & Thông tin (3 nút)
  const queueBtn = new ButtonBuilder()
    .setCustomId('btn_queue')
    .setLabel(`☰  ${botT(lang, 'btn.queue')}`)
    .setStyle(ButtonStyle.Secondary);

  const loopLabelKey =
    loopMode === 'track' ? 'btn.loop_track'
    : loopMode === 'queue' ? 'btn.loop_queue'
    : 'btn.loop_off';

  const loopBtn = new ButtonBuilder()
    .setCustomId('btn_loop')
    .setLabel(botT(lang, loopLabelKey))
    .setStyle(loopMode === 'off' ? ButtonStyle.Secondary : ButtonStyle.Primary);

  const shuffleLabelKey = isShuffle ? 'btn.shuffle_on' : 'btn.shuffle_off';

  const shuffleBtn = new ButtonBuilder()
    .setCustomId('btn_shuffle')
    .setLabel(botT(lang, shuffleLabelKey))
    .setStyle(isShuffle ? ButtonStyle.Primary : ButtonStyle.Secondary);

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    queueBtn,
    loopBtn,
    shuffleBtn
  );

  return [row1, row2];
}

// Backward compatibility helpers
export function createPlayerActionRow(
  isPaused: boolean = false,
  lang: BotLanguage = 'vi'
): ActionRowBuilder<ButtonBuilder> {
  return createPlayerComponents(isPaused, 'off', false, lang)[0];
}

export function createControlActionRow(
  loopMode: LoopMode = 'off',
  lang: BotLanguage = 'vi'
): ActionRowBuilder<ButtonBuilder> {
  return createPlayerComponents(false, loopMode, false, lang)[1];
}

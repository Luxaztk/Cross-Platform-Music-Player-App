import type { Interaction } from 'discord.js';
import type { BotClient } from '../services/BotClient.js';
import { guildLanguageStore } from '../services/GuildLanguageStore.js';
import { createErrorEmbed, createQueueEmbed, createSuccessEmbed, createNowPlayingEmbed } from '../ui/embeds.js';
import { createPlayerComponents } from '../ui/buttons.js';
import { botT } from '@music/i18n';
import type { LoopMode } from '../services/MusicManager.js';

export async function onInteractionCreate(interaction: Interaction, client: BotClient) {
  const lang = guildLanguageStore.getLanguage(interaction.guildId);

  // 1. Xử lý Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`[MeloVista Bot] Không tìm thấy handler cho lệnh: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`[MeloVista Bot] Lỗi khi thực thi lệnh /${interaction.commandName}:`, error);
      const errMsg = error instanceof Error ? error.message : botT(lang, 'common.error');
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          embeds: [createErrorEmbed(errMsg, lang)],
          ephemeral: true,
        }).catch(() => {});
      } else {
        await interaction.reply({
          embeds: [createErrorEmbed(errMsg, lang)],
          ephemeral: true,
        }).catch(() => {});
      }
    }
    return;
  }

  // 2. Xử lý Button Clicks (Cập nhật trực tiếp tại chỗ trên Player Embed)
  if (interaction.isButton()) {
    if (!interaction.guildId) return;
    const musicManager = client.getMusicManager(interaction.guildId);

    switch (interaction.customId) {
      case 'btn_pause_resume': {
        if (!musicManager.currentTrack) {
          await interaction.reply({ content: botT(lang, 'cmd.pause.no_track'), ephemeral: true });
          return;
        }
        const isPaused = musicManager.audioPlayer.state.status === 'paused';
        if (isPaused) {
          musicManager.resume();
        } else {
          musicManager.pause();
        }
        const newIsPaused = musicManager.audioPlayer.state.status === 'paused';

        await interaction.update({
          embeds: [
            createNowPlayingEmbed(
              musicManager.currentTrack,
              musicManager.volume,
              musicManager.loopMode,
              musicManager.isShuffle,
              musicManager.queue.length,
              lang
            ),
          ],
          components: createPlayerComponents(newIsPaused, musicManager.loopMode, musicManager.isShuffle, lang),
        });
        break;
      }

      case 'btn_skip': {
        if (!musicManager.currentTrack) {
          await interaction.reply({ content: botT(lang, 'cmd.skip.no_track'), ephemeral: true });
          return;
        }
        // Vô hiệu hóa nút bấm trên tin nhắn hiện tại
        await interaction.update({ components: [] });
        musicManager.skip();
        break;
      }

      case 'btn_stop': {
        await interaction.update({
          embeds: [createSuccessEmbed(botT(lang, 'btn.stop'), botT(lang, 'cmd.stop.success'), lang)],
          components: [],
        });
        musicManager.stop();
        break;
      }

      case 'btn_queue': {
        const embed = createQueueEmbed(musicManager.currentTrack, musicManager.queue, 1, lang);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      case 'btn_loop': {
        if (!musicManager.currentTrack) {
          await interaction.reply({ content: botT(lang, 'cmd.pause.no_track'), ephemeral: true });
          return;
        }
        // Xoay vòng: off → track → queue → off
        const nextMode: LoopMode =
          musicManager.loopMode === 'off' ? 'track'
          : musicManager.loopMode === 'track' ? 'queue'
          : 'off';

        musicManager.setLoop(nextMode);
        const isPaused = musicManager.audioPlayer.state.status === 'paused';

        await interaction.update({
          embeds: [
            createNowPlayingEmbed(
              musicManager.currentTrack,
              musicManager.volume,
              nextMode,
              musicManager.isShuffle,
              musicManager.queue.length,
              lang
            ),
          ],
          components: createPlayerComponents(isPaused, nextMode, musicManager.isShuffle, lang),
        });
        break;
      }

      case 'btn_shuffle': {
        if (!musicManager.currentTrack && musicManager.queue.length === 0) {
          await interaction.reply({ content: botT(lang, 'cmd.shuffle.empty'), ephemeral: true });
          return;
        }
        const isShuffleNow = musicManager.toggleShuffle();
        const isPaused = musicManager.audioPlayer.state.status === 'paused';

        await interaction.update({
          embeds: [
            createNowPlayingEmbed(
              musicManager.currentTrack!,
              musicManager.volume,
              musicManager.loopMode,
              isShuffleNow,
              musicManager.queue.length,
              lang
            ),
          ],
          components: createPlayerComponents(isPaused, musicManager.loopMode, isShuffleNow, lang),
        });
        break;
      }

      default:
        break;
    }
  }
}

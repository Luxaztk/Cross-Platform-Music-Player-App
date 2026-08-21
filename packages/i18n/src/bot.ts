export type BotLanguage = 'vi' | 'en';

export const botTranslations: Record<BotLanguage, Record<string, string>> = {
  vi: {
    'common.requested_by': 'Yêu cầu bởi @{user}',
    'common.now_playing': 'Đang phát',
    'common.up_next': 'Tiếp theo',
    'common.queue_empty': 'Hàng đợi đang trống. Sử dụng lệnh /play để thêm nhạc!',
    'common.added_to_queue': 'Đã thêm vào hàng đợi',
    'common.playlist_added': 'Đã nạp Playlist',
    'common.error': 'Lỗi',
    'common.success': 'Thành công',
    'common.page': 'Trang {current}/{total}',
    'common.tracks': 'bài hát',
    'common.lossless': 'Lossless / Cục bộ',
    'common.live': 'Stream trực tiếp',
    'common.measuring': 'Đang đo độ trễ...',
    'common.must_be_in_voice': 'Bạn phải tham gia vào một Kênh Thoại (Voice Channel) để phát nhạc!',
    'common.no_tracks_found': 'Không tìm thấy bài hát nào khớp với: `{query}`',

    'btn.pause': 'Tạm dừng',
    'btn.resume': 'Tiếp tục',
    'btn.skip': 'Tiếp theo',
    'btn.stop': 'Dừng',
    'btn.queue': 'Hàng đợi',
    'btn.loop_off': '↺ Lặp: Tắt',
    'btn.loop_track': '↺¹ Lặp: 1 Bài',
    'btn.loop_queue': '⟳ Lặp: Queue',
    'btn.shuffle_off': '⦿ Ngẫu nhiên: Tắt',
    'btn.shuffle_on': '⤮ Ngẫu nhiên: Bật',

    'cmd.language.description': 'Cấu hình ngôn ngữ hiển thị của Bot cho Server (Tiếng Việt / English)',
    'cmd.language.success': 'Đã chuyển đổi ngôn ngữ hiển thị sang **Tiếng Việt 🇻🇳**',

    'cmd.ping.description': 'Kiểm tra độ trễ kết nối của MeloVista Bot',
    'cmd.ping.title': 'Thông số độ trễ',
    'cmd.ping.roundtrip': 'Độ trễ phản hồi (Roundtrip)',
    'cmd.ping.websocket': 'Độ trễ Gateway (WebSocket)',
    'cmd.ping.initializing': 'Đang khởi tạo...',

    'cmd.play.description': 'Phát nhạc từ YouTube, Playlist hoặc File cục bộ trên PC',

    'cmd.pause.description': 'Tạm dừng phát nhạc',
    'cmd.pause.paused': 'Đã tạm dừng phát nhạc. Sử dụng `/resume` để tiếp tục.',
    'cmd.pause.already_paused': 'Phát nhạc đã được tạm dừng từ trước!',
    'cmd.pause.no_track': 'Hiện không có bài hát nào đang phát!',

    'cmd.resume.description': 'Tiếp tục phát nhạc đang tạm dừng',
    'cmd.resume.already_playing': 'Nhạc đang phát bình thường!',
    'cmd.resume.success': 'Đã tiếp tục phát nhạc.',

    'cmd.skip.description': 'Bỏ qua bài hát hiện tại',
    'cmd.skip.success': 'Đã bỏ qua bài hát hiện tại.',
    'cmd.skip.no_track': 'Không có bài hát nào đang phát để bỏ qua!',

    'cmd.stop.description': 'Dừng phát nhạc và xóa sạch hàng đợi',
    'cmd.stop.success': 'Đã dừng phát nhạc và làm trống danh sách hàng đợi.',

    'cmd.queue.description': 'Hiển thị danh sách hàng đợi phát nhạc',

    'cmd.volume.description': 'Điều chỉnh âm lượng phát nhạc (0% - 150%)',
    'cmd.volume.success': 'Đã đặt âm lượng phát thành: **{volume}%**',

    'cmd.join.description': 'Tham gia vào phòng thoại của bạn',
    'cmd.join.success': 'Đã tham gia phòng thoại **{channel}**',

    'cmd.leave.description': 'Rời khỏi phòng thoại hiện tại',
    'cmd.leave.success': 'Đã rời khỏi phòng thoại.',

    'cmd.loop.description': 'Cài đặt chế độ phát lặp',
    'cmd.loop.success_off': 'Đã tắt chế độ lặp.',
    'cmd.loop.success_track': 'Đã bật Lặp 1 Bài (↺¹)',
    'cmd.loop.success_queue': 'Đã bật Lặp Toàn Bộ Queue (⟳)',

    'cmd.shuffle.description': 'Bật/Tắt chế độ phát ngẫu nhiên hàng đợi',
    'cmd.shuffle.enabled': 'Đã bật phát ngẫu nhiên (⤮)',
    'cmd.shuffle.disabled': 'Đã tắt phát ngẫu nhiên (⦿)',
  },
  en: {
    'common.requested_by': 'Requested by @{user}',
    'common.now_playing': 'Now Playing',
    'common.up_next': 'Up Next',
    'common.queue_empty': 'Queue is empty. Use /play to add tracks!',
    'common.added_to_queue': 'Added to Queue',
    'common.playlist_added': 'Playlist Added',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.page': 'Page {current}/{total}',
    'common.tracks': 'tracks',
    'common.lossless': 'Lossless / Local',
    'common.live': 'Live Stream',
    'common.measuring': 'Measuring latency...',
    'common.must_be_in_voice': 'You must be in a Voice Channel to play music!',
    'common.no_tracks_found': 'No tracks found matching: `{query}`',

    'btn.pause': 'Pause',
    'btn.resume': 'Resume',
    'btn.skip': 'Next',
    'btn.stop': 'Stop',
    'btn.queue': 'Queue',
    'btn.loop_off': '↺ Loop: Off',
    'btn.loop_track': '↺¹ Loop: 1 Track',
    'btn.loop_queue': '⟳ Loop: Queue',
    'btn.shuffle_off': '⦿ Shuffle: Off',
    'btn.shuffle_on': '⤮ Shuffle: On',

    'cmd.language.description': 'Configure Bot display language for this server (English / Tiếng Việt)',
    'cmd.language.success': 'Bot language changed to **English 🇺🇸**',

    'cmd.ping.description': 'Check connection latency metrics for MeloVista Bot',
    'cmd.ping.title': 'Latency Metrics',
    'cmd.ping.roundtrip': 'Roundtrip',
    'cmd.ping.websocket': 'WebSocket',
    'cmd.ping.initializing': 'Initializing...',

    'cmd.play.description': 'Play music from YouTube, Playlist, or Local PC file',

    'cmd.pause.description': 'Pause audio playback',
    'cmd.pause.paused': 'Audio playback paused. Use `/resume` to continue.',
    'cmd.pause.already_paused': 'Audio playback is already paused!',
    'cmd.pause.no_track': 'No track currently playing!',

    'cmd.resume.description': 'Resume paused audio playback',
    'cmd.resume.already_playing': 'Audio playback is already active!',
    'cmd.resume.success': 'Resumed audio playback.',

    'cmd.skip.description': 'Skip the current playing track',
    'cmd.skip.success': 'Skipped the current track.',
    'cmd.skip.no_track': 'No track currently playing to skip!',

    'cmd.stop.description': 'Stop playback and clear the queue',
    'cmd.stop.success': 'Stopped playback and cleared the queue.',

    'cmd.queue.description': 'Display the music playback queue',

    'cmd.volume.description': 'Adjust playback volume (0% - 150%)',
    'cmd.volume.success': 'Volume set to **{volume}%**',

    'cmd.join.description': 'Join your current voice channel',
    'cmd.join.success': 'Joined voice channel **{channel}**',

    'cmd.leave.description': 'Leave the current voice channel',
    'cmd.leave.success': 'Left the voice channel.',

    'cmd.loop.description': 'Set the playback loop mode',
    'cmd.loop.success_off': 'Loop mode disabled.',
    'cmd.loop.success_track': 'Now looping the current track (↺¹)',
    'cmd.loop.success_queue': 'Now looping the entire queue (⟳)',

    'cmd.shuffle.description': 'Toggle random shuffle mode',
    'cmd.shuffle.enabled': 'Shuffle mode enabled (⤮)',
    'cmd.shuffle.disabled': 'Shuffle mode disabled (⦿)',
  },
};

export function botT(
  lang: BotLanguage = 'vi',
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = botTranslations[lang] || botTranslations.vi;
  let text = dict[key] || botTranslations.vi[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

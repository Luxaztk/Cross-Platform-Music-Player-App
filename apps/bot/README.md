# 🤖 MeloVista Discord Music Bot (`@music/bot`)

Phân hệ Discord Music Bot chất lượng cao trong hệ sinh thái đa nền tảng **MeloVista**.

---

## ✨ Tính Năng Nổi Bật
- **Discord DAVE Protocol E2EE**: Tích hợp chuẩn mã hóa đầu cuối mới nhất của Discord (`@discordjs/voice@0.19.2` + `@snazzah/davey@0.1.12`).
- **YouTube & Local File Streaming**: Hỗ trợ phát nhạc từ YouTube (với cơ chế cookies bypass 403) và phát nhạc Lossless cục bộ từ PC.
- **Audio Pipeline Zero-Latency**: FFmpeg `s16le` 48kHz Stereo ➔ Opus 20ms Frame.
- **Rich Embeds & Buttons**: Giao diện điều khiển trực quan với các nút tương tác Play/Pause, Skip, Stop, Queue.

---

## 🚀 Khởi Động Nhanh

1. Điền thông tin cấu hình vào file `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_test_guild_id_here
   ```

2. Chạy bot từ thư mục gốc Monorepo:
   - **Chạy sản phẩm**: `npm run bot`
   - **Chạy chế độ Lập trình (Hot Reload tự động)**: `npm run bot:dev`

3. Chạy kiểm thử:
   ```bash
   npm run test --workspace=apps/bot
   ```

---

*Tài liệu chi tiết xem tại [docs/bot/__BOT_FINAL_REPORT.md](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_FINAL_REPORT.md).*

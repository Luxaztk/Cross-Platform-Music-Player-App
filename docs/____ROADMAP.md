# Melovista Project Roadmap & Task Tracker 🎵

Bản kế hoạch tổng thể và theo dõi tiến độ đa nền tảng cho dự án **MeloVista** (Desktop • Mobile • Discord Bot • Cloud Sync).

---

## 📑 Mục Lục Điều Hướng Nhanh

1. [🖥️ MeloVista Desktop App (Electron)](#-1-melovista-desktop-app-electron)
2. [📱 MeloVista Mobile App (Expo / React Native)](#-2-melovista-mobile-app-expo--react-native)
3. [🤖 MeloVista Discord Music Bot (`apps/bot`)](#-3-melovista-discord-music-bot-appsbot)
4. [☁️ MeloVista Cloud (Google Drive Sync)](#-4-melovista-cloud-google-drive-sync)
5. [🧪 Hệ Thống Kiểm Thử (Testing Suite)](#-5-hệ-thống-kiểm-thử-testing-suite)
6. [📚 Cấu Trúc Tài Liệu Chi Tiết (`docs/`)](#-6-cấu-trúc-tài-liệu-chi-tiết-docs)

---

## 🖥️ 1. MeloVista Desktop App (Electron)

### ✅ Đã Hoàn Thành (Accomplishments)

- [x] **Kiến Trúc & Core Monorepo:**
  - [x] Thiết lập cấu trúc Monorepo (`apps/*`, `packages/*`).
  - [x] Tích hợp Electron + Vite + React + TypeScript.
  - [x] Hệ thống IPC Bridge bảo mật hai chiều giữa Main Process và Renderer.
  - [x] Đa ngôn ngữ (i18n) toàn diện: Tiếng Anh & Tiếng Việt (100% UI Coverage, Zero Ghost Keys).
  - [x] Kiến trúc phân tách nghiêm ngặt: Tách biệt React Hooks, Providers và Presentation UI.
  - [x] Dynamic Content Security Policy (CSP) và Global Notifications (`AppNotification`).
- [x] **Trình Phát Nhạc & Audio Engine:**
  - [x] Giải mã âm thanh hiệu năng cao với `howler.js` và custom protocol `melovista://`.
  - [x] Nhận diện vân tay âm thanh **Perceptual Audio Fingerprinting (Guard 3 - v2)** với Energy-Envelope (16kHz Mono) và Fuzzy Sliding Window Matching.
  - [x] Tự động nhúng tag `TXXX` (`origin_id`, `source_url`) vào MP3 khi tải về.
  - [x] Global `PlayerProvider`: Quản lý Queue, Lịch sử (16 bài), Shuffle, Repeat, Volume & Seek bar mượt mà.
  - [x] Audio FX: Đo cường độ sóng âm thời gian thực theo chuẩn dBFS (Peak Meter) và công cụ Test Sound.
- [x] **Quản Lý Thư Viện, File & Playlist:**
  - [x] Quét đệ quy thư mục nhạc cục bộ, trích xuất ID3 Metadata & Artwork.
  - [x] CRUD Playlist, Re-order hàng đợi kéo thả và Context Menu chuyên sâu.
  - [x] Xử lý file mồ côi (Orphaned Files Cleanup Tool & Auto-skip).
  - [x] Ghi đè ID3 Tags trực tiếp vào tệp vật lý (.mp3, .flac).
  - [x] Theo dõi lịch sử đồng bộ (`SyncHistoryService`).
- [x] **Tải Xuống Trực Tuyến (Online Downloader V5):**
  - [x] Tích hợp `yt-dlp` & `FFmpeg` binary độc lập chạy không cần Python.
  - [x] Kill Switch (20s Timeout), chống deadlock buffer và tự động xử lý URL chứa `&` và khoảng trắng.
  - [x] Hỗ trợ tải Video đơn, Playlist hàng loạt (Batch Processing) và đăng nhập YouTube (`YouTubeAuthService` / Cookies).
  - [x] Bulk Metadata Edit: Tự động điền và chỉnh sửa đồng loạt Album/Nghệ sĩ khi tải playlist.
- [x] **Giao Diện Người Dùng Hiện Đại (Spotify-style UI/UX):**
  - [x] Layout Spotify-style, Sidebar cố định (280px, React.memo), Edge-to-edge layout, Sticky Header.
  - [x] Hệ thống biến màu Semantic: Hỗ trợ 6 chủ đề (Midnight, Amoled, Nord, Rose, Ocean, Tame Snow).
  - [x] Search Overlay thông minh: Smart Intent (phân biệt có dấu / không dấu tiếng Việt) và Fuse.js Location-Agnostic Scoring.
  - [x] Synchronized Lyrics: Điều chỉnh offset đa cấp (±1s, ±5s), One-click Sync Now và lưu persistent offset.
  - [x] Window Virtualization Engine: Cuộn mượt mà 60fps với danh sách 5.000+ bài hát.
  - [x] Multi-level Profile Menu (Drill-down UI) và phím tắt toàn cục (Global Hotkeys).
- [x] **Release Pipeline:** Tự động hóa đóng gói phát hành bản build Windows EXE (`npm run deploy`).

### ⏳ Hạng Mục Mở Rộng

- [ ] **Bộ Chỉnh Âm Nâng Cao (Advanced Equalizer):** Bộ cân bằng âm thanh Graphic EQ 10-band đa dải tần.
- [ ] **Hồ Sơ Nghệ Sĩ (Artist Profile Page):** Trang tổng quan hiển thị toàn bộ bài hát, album và thông tin nghệ sĩ.

### 🐛 Bug Fixes

- [x] **Fix lỗi YouTubeAuthService - "Couldn't sign you in" (Google OAuth Block) & Chrome 127+ App-Bound Encryption:**
  - Bỏ toàn bộ Electron `BrowserWindow` cho luồng đăng nhập (Google phát hiện webview qua nhiều fingerprint không thể giả mạo).
  - Thay thế bằng flow kết hợp:
    1. Tự động: Mở YouTube trên trình duyệt hệ thống → `yt-dlp --cookies-from-browser` (hỗ trợ Firefox/Brave).
    2. Thủ công (Chrome/Edge 127+): Hỗ trợ nút `Nhập file cookies.txt` trực tiếp qua dialog chọn file (tương thích extension "Get cookies.txt LOCALLY").
  - Thêm 3 IPC channels mới: `open-youtube-browser`, `extract-youtube-cookies`, `import-youtube-cookies-file`.
  - Đồng bộ UI modal xác nhận theo chuẩn hệ thống chung (`var(--bg-modal)`, `var(--radius-lg)`).
  - Kết quả: **304/304 tests Green, Zero TypeScript errors**.

---

## 📱 2. MeloVista Mobile App (Expo / React Native)

### ✅ Đã Hoàn Thành (Accomplishments)

- [x] **Core & Architecture:** Khởi tạo Expo app, tích hợp chung `@music/core`, TypeScript và ESLint.
- [x] **App Shell Parity:** Hệ thống Navigation đa tầng (Bottom Bar + Sidebar), đồng bộ Theme system (Dark/Light) và i18n.
- [x] **Data Persistence:** Triển khai `MobileStorageAdapter` lưu trữ dữ liệu Library, Playlists, PlayerState qua `AsyncStorage`.
- [x] **Audio Engine Di Động:** Trừu tượng hóa `PlayerEngine` và tích hợp `expo-audio` phát nhạc mượt mà.
- [x] **Quản Lý Thư Viện:** Document Picker import file MP3, loại bỏ trùng lặp và CRUD Playlist.
- [x] **Màn Hình Chức Năng:** Library A-Z, Playlist List/Detail, Global Search màn hình nhỏ.
- [x] **Mobile Hardening:** Xử lý hiệu năng danh sách lớn và bỏ qua file hỏng.

### 🚀 Kế Hoạch Tiếp Theo

- [ ] **Phát Nhạc Dưới Nền (Background Audio):** Cấu hình EAS build duy trì phát âm thanh khi ẩn app.
- [ ] **Lock Screen Media Controls:** Đồng bộ thanh điều khiển nhạc trên màn hình khóa của iOS và Android.

---

## 🤖 3. MeloVista Discord Music Bot (`apps/bot`)

> **Tài liệu kỹ thuật:** [docs/bot/__BOT_architecture_report.md](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_architecture_report.md) • [docs/bot/__BOT_audio_pipeline.md](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_audio_pipeline.md)

Mục tiêu: Đưa trải nghiệm nghe nhạc chất lượng cao của MeloVista lên Discord cho nhu cầu cá nhân & bạn bè, tích hợp Monorepo, phát nhạc YouTube & Local Lossless 0đ, bypass 100% lỗi YouTube 403.

- [x] **Pha 1: Khởi Tạo Workspace & Gateway Kết Nối**
  - [x] Khởi tạo package `apps/bot` với TypeScript, `discord.js` (v14) và `@discordjs/voice`.
  - [x] Thiết lập hệ thống nạp cấu hình môi trường (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`).
  - [x] Xây dựng Handler tự động đăng ký và dispatch Slash Commands (`/ping`, `/join`, `/leave`).

- [x] **Pha 2: Voice Audio Streaming Pipeline (yt-dlp + Local File)**
  - [x] Tích hợp `@discordjs/voice` + `prism-media` + `opusscript`.
  - [x] Xây dựng bộ Stream Extractor kế thừa `yt-dlp` pipe stdout trực tiếp vào FFmpeg (phát tức thì < 1s).
  - [x] Tích hợp nạp file `youtube_cookies.txt` từ cấu hình cá nhân để triệt tiêu lỗi YouTube 403 / Bot Detection.
  - [x] Hỗ trợ phát trực tiếp kho nhạc Local trên PC (`.mp3`, `.flac`, `.wav`, `.m4a`) qua Voice Channel.

- [x] **Pha 3: Queue Management & Interactive UI Controls**
  - [x] **Xây dựng Discord Music Bot (`apps/bot`)**:
  - Hỗ trợ đầy đủ 13 lệnh Slash Commands: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/volume`, `/loop`, `/shuffle`, `/language`, `/ping`, `/join`, `/leave`.
  - Tích hợp pipeline âm thanh PCM `s16le` 48kHz Stereo ➔ Mã hóa Opus với FFmpeg streaming trực tiếp.
  - Tích hợp giao thức mã hóa đầu cuối **Discord DAVE E2EE** (`@discordjs/voice@0.19.2` + `@snazzah/davey@0.1.12` + `@noble/ciphers` + `@stablelib/xchacha20poly1305`) vượt qua mã lỗi Discord `4017`.
  - Giao diện Discord Rich Embeds & Action Rows Buttons điều khiển trực quan theo MeloVista Emerald Style:
    - **In-Place UI Updates (`interaction.update`)**: Cập nhật trạng thái trực tiếp trên Player Embed cũ mà không spam tin nhắn phụ.
    - **Bố cục 2 Hàng Cân Bằng (3 + 3)**: `[ ⏸ Pause ] [ ⏭ Next ] [ ■ Stop ]` và `[ ☰ Queue ] [ ↺ Loop ] [ ⤮ Shuffle ]`.
    - **100% Monochrome Text Symbols**: Chuẩn hóa biểu tượng đơn sắc đồng điệu thẩm mỹ.
    - **Chế độ Lặp 3 Cấp Độ (`LoopMode`)**: Off, Track (↺¹), Queue (⟳).
    - **Chế độ Phát Ngẫu Nhiên (`ShuffleMode`)**: Bật (⤮ / Bright Blue) / Tắt (⦿ / Secondary).
    - **System State Guards**: Phủ kín guard clauses kiểm soát trạng thái phát cho 100% lệnh Slash Commands và nút bấm.
  - Tích hợp tính năng **Đa Ngôn Ngữ (i18n)** qua lệnh `/language` với cơ chế lưu vĩnh viễn vào file JSON (`guild_settings.json`).
  - Đọc 100% ID3/FLAC/M4A metadata & Cover Art từ file local qua `music-metadata` kèm fallback theo tên file.
  - Tải Playlist siêu tốc với cờ `--flat-playlist` (phát bài đầu tiên trong < 0.8s).
  - Đạt 100% kiểm thử Unit Test (87/87 monorepo test cases Green ✅).
  - [ ] Tính năng Autocomplete Search cho lệnh `/play` (gợi ý nhanh từ YouTube & thư viện cục bộ).
  - [ ] Tích hợp bộ lọc âm thanh thời gian thực (DSP Filters): Bass Boost, Nightcore, 8D Audio, Volume Normalization.

- [x] **Pha 5: Discord Embedded Activity App & Bot Hardening (Tích hợp 100% trong `apps/bot`)**
  - [x] **Tích hợp Activity Server & Webview vào `apps/bot`**: Khởi chạy HTTP Web Server + WebSocket RPC Server trong `apps/bot` phục vụ giao diện Web App Spotify-style trực tiếp cho Discord Embedded Activity SDK.
  - [x] **Tái sử dụng 100% Desktop React UI Components (DRY Protocol)**: Tích hợp Vite React bundle cho `apps/bot`, dùng lại trực tiếp các React Components chuẩn từ Desktop (`Sidebar`, `Header`, `PlayerBar`, `LyricsPanel`, `ThemeProvider`, `App.scss`).
  - [x] **WebSocket RPC Protocol Engine**: Đồng bộ hai chiều trạng thái phát nhạc (seek, volume, queue, lyrics) thời gian thực giữa Bot Voice Service và Embedded Webview UI.
  - [x] **Real-time Multi-user Sync**: Đồng bộ tương tác đa người dùng trực quan trong Voice Channel (100% tests Green).
  - [x] **Bot Deep Audit & Resiliency Hardening (24/24 Items Hoàn Tất)**:
    - Triệt tiêu lỗi vòng lặp `destroy()` timeout vô hạn và chống memory leak trên `MusicManager` & `BotClient`.
    - Bảo vệ lỗ hổng SSRF trên endpoint Proxy Image với hostname whitelist.
    - Hỗ trợ đầy đủ lệnh `SEEK` (FFmpeg `-ss`), `PREV_TRACK` (Previous Track History), và chu kỳ Repeat 3 nấc trên Activity UI.
    - Bổ sung Interactive Queue Side Panel, WebSocket Auto-Reconnect (Exponential Backoff), và Floating Error Toast.
    - Nâng cấp điều hướng phân trang tương tác cho lệnh `/queue` trên Discord (`createQueuePaginationComponents`).

---

## ☁️ 4. MeloVista Cloud (Google Drive Sync)

Mục tiêu: Sử dụng Google Drive làm kho lưu trữ và cơ sở dữ liệu serverless đồng bộ nhạc xuyên nền tảng không giới hạn mạng LAN.

- [ ] **Giai đoạn 1: Thiết lập Cầu nối (Google Cloud Console):** Khởi tạo Project, kích hoạt Google Drive API và tạo OAuth 2.0 Client IDs riêng biệt cho Desktop và Mobile.
- [ ] **Desktop Auth & Quản lý File:** Tích hợp Google OAuth 2.0. Xây dựng cơ chế Upload file âm thanh & ảnh bìa lên thư mục `MeloVista_Data` và lưu trữ `fileId`.
- [ ] **Desktop DB Serverless (`database.json`):** Chuyển đổi dữ liệu (Song, Playlist) thành `database.json` chứa `fileId`. Đồng bộ cục bộ và ghi đè file này lên Drive mỗi khi có thay đổi.
- [ ] **Bảo vệ Rate Limit (Desktop):** Tích hợp kỹ thuật Hàng đợi (Queue) với delay 1-2s giữa mỗi lần upload file để tránh lỗi 429 Too Many Requests từ Google.
- [ ] **Mobile Silent Login & Fetch DB:** Tích hợp Google Sign-in để âm thầm cấp lại Access_Token (Silent Login). Kéo `database.json` vào RAM để render UI tức thì.
- [ ] **Mobile Cloud Streaming:** Cấu hình `expo-audio` gắn Header `Authorization: Bearer <Access_Token>` vào URL stream API của Google để nghe nhạc trực tiếp (hỗ trợ Range Requests).
- [ ] **Xử lý Token Expiration (Mobile):** Triển khai logic sử dụng `Refresh_Token` âm thầm xin cấp mới Access_Token trước hạn 1 giờ, đảm bảo trải nghiệm nghe nhạc không bị đứt đoạn.

---

## 🧪 5. Hệ Thống Kiểm Thử (Testing Suite)

Mục tiêu: Đạt 100% Coverage và duy trì trạng thái Clean Build cho toàn bộ Monorepo.

### 1. `@music/core` (Logic Nghiệp Vụ Lõi)

- [x] **Mutex:** Quản lý hàng đợi và an toàn ghi dữ liệu (100% Coverage).
- [x] **LibraryService:** Quản lý bài hát, phát hiện trùng lặp 4 lớp (Path, Hash, Metadata, URL), quản lý Playlist (100% Coverage).
- [x] **UseCases:** Các lớp nghiệp vụ bọc ngoài LibraryService (100% Coverage).
- [x] **Library Stability V3 & Deduplication V4:** Chống trùng lặp ảo và lọc thời lượng động 2% (100% Coverage).

### 2. `@music/utils` (Tiện Ích Dùng Chung)

- [x] **formatTime:** Định dạng chuỗi mm:ss (100% Coverage).
- [x] **splitArtists:** Phân rã danh sách nghệ sĩ kết hợp (100% Coverage).
- [x] **youtube:** Phân tích cú pháp và trích xuất URL/ID YouTube (100% Coverage).

### 3. `@music/player` (Trình Phát Nhạc)

- [x] **AudioEngine:** Điều khiển trạng thái phát & Queue management (100% Coverage).

### 4. `@music/hooks` (React State & Downloader Logic)

- [x] **YoutubeDownloader:** Logic trích xuất thông tin, xử lý binary và download queue (100% Coverage).
- [x] **LibraryProvider & PlayerProvider:** Đồng bộ trạng thái UI (100% Coverage).

### 5. Presentations (Giao Diện UI Components)

- [x] **CustomDropdown Component:** Portal + ARIA Accessibility (100% Coverage).
- [x] **Settings Page Ecosystem:** General, Appearance, Audio, Downloads, About, Fallback Avatar (100% Coverage).
- [x] **Search System TDD:** Smart Intent (dấu tiếng Việt), SearchOverlay và SongPickerModal (100% Coverage).
- [x] **Centralized Testing Architecture:** 100% Unit test đặt tại `src/tests/` tập trung.

### 6. `@music/bot` (Discord Bot Test Suite - Sắp Thực Hiện)

- [ ] **Command Dispatcher:** Kiểm thử parse và điều hướng Slash Commands.
- [ ] **Stream Extractor Pipe:** Kiểm thử pipe luồng âm thanh từ `yt-dlp` và file Local vào FFmpeg.
- [ ] **Voice Connection Resilience:** Kiểm thử khả năng chịu lỗi và auto-reconnect của voice channel.

---

## 📚 6. Cấu Trúc Tài Liệu Chi Tiết (`docs/`)

- [📁 docs/desktop/](file:///k:/cross-platform-music-player-app/docs/desktop): Báo cáo kiến trúc, phân tích kỹ thuật và tài liệu báo cáo của bản Desktop.
- [📁 docs/mobile/](file:///k:/cross-platform-music-player-app/docs/mobile): Thiết kế UI, luồng phát nhạc, schema lưu trữ và kế hoạch cải tiến âm thanh di động.
- [📁 docs/bot/](file:///k:/cross-platform-music-player-app/docs/bot): Báo cáo kiến trúc bot ([`__BOT_architecture_report.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_architecture_report.md)) và đặc tả kỹ thuật Audio Pipeline ([`__BOT_audio_pipeline.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_audio_pipeline.md)).

---

> [!TIP]
> Tài liệu này là **Single Source of Truth** về tiến độ dự án. Mọi tác vụ khi thực hiện đều phải được đối chiếu và cập nhật trạng thái trực tiếp tại đây.

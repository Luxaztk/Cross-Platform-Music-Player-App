# Melovista Project Roadmap & Task Tracker 🎵

Bản kế hoạch tổng thể và theo dõi tiến độ đa nền tảng cho dự án **MeloVista** (Desktop • Mobile • Discord Bot • Cloud Sync).

---

## 📑 Mục Lục Điều Hướng Nhanh

1. [🖥️ MeloVista Desktop App (Electron)](#-1-melovista-desktop-app-electron)
2. [📱 MeloVista Mobile App (Expo / React Native)](#-2-melovista-mobile-app-expo--react-native)
3. [🤖 MeloVista Discord Music Bot (`apps/bot`)](#-3-melovista-discord-music-bot-appsbot)
4. [☁️ MeloVista Cloud (Google Drive Sync)](#-4-melovista-cloud-google-drive-sync)
5. [📡 MeloVista Homelab & Streaming Engine (Desktop • Mobile • Server)](#-5-melovista-homelab--streaming-engine-desktop--mobile--server)
6. [🧪 Hệ Thống Kiểm Thử (Testing Suite)](#-6-hệ-thống-kiểm-thử-testing-suite)
7. [📚 Cấu Trúc Tài Liệu Chi Tiết (`docs/`)](#-7-cấu-trúc-tài-liệu-chi-tiết-docs)

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

### 🐛 Bug Fixes & Cải Tiến

- [x] **Tự động mở Full Size (Maximized) và đồng bộ màu nền khởi động theo Theme User:**
  - Cấu hình Electron `BrowserWindow` mở ở trạng thái `win.maximize()` tức thì (Zero-Latency), không cần bấm nút phóng to thủ công.
  - Thiết lập `ThemeProvider.scss` làm Single Source of Truth (SSOT) duy nhất: Dùng Vite Raw Import (`?raw`) và parser tiện ích trích xuất trực tiếp `--bg-primary` theo từng theme (không hardcode mã màu).
  - Tự động gán `backgroundColor` cho `BrowserWindow` theo theme người dùng đã lưu trong `electron-store`, triệt tiêu hoàn toàn hiện tượng nháy/lệch màu nền khi mở app.
  - Đồng bộ ngược cấu hình theme từ `ThemeProvider` trong Renderer Process về `electron-store` qua `window.electronAPI.saveSettings`.
  - Kết quả: **318/318 Desktop tests Green (42/42 test files), Clean Build, Zero TypeScript errors**.

- [x] **Sửa lỗi đa luồng phát nhạc đè lên nhau khi phối hợp phím Space, UI Play và Nút tai nghe:**
  - Khắc phục xung đột double dispatch giữa `navigator.mediaSession` và `MediaPlayPause` trong `useGlobalHotkeys` (hardware debounce 300ms).
  - Triệt tiêu lỗi "Autoplay Double-Play" trong `AudioEngine.load()` (loại bỏ lệnh gọi thừa `this.howl.play()`).
  - Xử lý race condition trong `PlayerProvider.play()` khi audio đang ở trạng thái `'loading'` (ngăn nạp lặp lại cùng một nguồn âm thanh).
  - Bổ sung Monophonic Playback Lock & dọn dẹp vật lý `HTMLMediaElement` ngầm trong `AudioEngine.stop()` để ngăn chặn Howler sinh nhiều sound node song song.
  - Xử lý focus trap trên nút Play UI (`type="button"`, `blur()` ngay khi click) triệt tiêu hoàn toàn xung đột phím Space kích hoạt `click` mặc định.
  - Kết quả: **315/315 Desktop tests Green, 13/13 Player tests Green, 19/19 Hooks tests Green, Clean Build, Zero TypeScript errors**.

- [x] **Đồng bộ Hardware Media Keys & Nút điều khiển Tai nghe (MediaSession API & OS SMTC):**
  - Tích hợp chuẩn W3C MediaSession API (`navigator.mediaSession`) xử lý tương tác nút tai nghe (Play/Pause, Next, Prev, Stop, Seek) cả khi app chạy dưới nền.
  - Đồng bộ `MediaMetadata` (Tên bài, Ca sĩ, Album, Ảnh bìa coverArt) và `playbackState` lên Windows SMTC / Volume Overlay / Lock Screen.
  - Bổ sung lưới an toàn hai chiều (Bi-directional sync) trong `AudioEngine` gắn trực tiếp native event listeners (`pause`, `play`) lên node `HTMLMediaElement` ngầm của Howler.
  - Bổ sung các mã phím `MediaPlayPause`, `MediaTrackNext`, `MediaTrackPrevious`, `MediaStop` vào `useGlobalHotkeys` (hoạt động ngay cả khi focus input).
  - Cấu hình `setAppUserModelId` trên Windows trong Electron Main Process để nhận diện đúng danh tính app.
  - Kết quả: **314/314 tests Green, Clean Build, Zero TypeScript errors**.

- [x] **Fix lỗi YouTubeAuthService - "Couldn't sign you in" (Google OAuth Block) & Chrome 127+ App-Bound Encryption:**
  - Bỏ toàn bộ Electron `BrowserWindow` cho luồng đăng nhập (Google phát hiện webview qua nhiều fingerprint không thể giả mạo).
  - Thay thế bằng flow kết hợp:
    1. Tự động: Mở YouTube trên trình duyệt hệ thống → `yt-dlp --cookies-from-browser` (hỗ trợ Firefox/Brave).
    2. Thủ công (Chrome/Edge 127+): Hỗ trợ nút `Nhập file cookies.txt` trực tiếp qua dialog chọn file (tương thích extension "Get cookies.txt LOCALLY").
  - Thêm 3 IPC channels mới: `open-youtube-browser`, `extract-youtube-cookies`, `import-youtube-cookies-file`.
  - Đồng bộ UI modal xác nhận theo chuẩn hệ thống chung (`var(--bg-modal)`, `var(--radius-lg)`).
  - Kết quả: **304/304 tests Green, Zero TypeScript errors**.

- [x] **Kiểm toán & Khắc phục rủi ro Memory Leak / Resource Leak toàn dự án:**
  - Khắc phục 2 điểm rò rỉ Web Audio API (`AudioSection.tsx`, `useHeader.tsx`): Đóng an toàn `AudioContext` sau khi phát xong beep, tự động reset `isPlayingTest = false` để kết thúc vòng lặp RAF giả lập Peak Meter và mở khóa nút test sound.
  - Khắc phục rủi ro rò rỉ File Descriptor trong `melovista://` protocol (`main.ts`): Bọc `fileHandle` trong khối `try...finally` đảm bảo tệp luôn được đóng ngay cả khi phát sinh lỗi IO.
  - Bổ sung 15s Timeout Kill Switch cho tiến trình FFmpeg trích xuất vân tay âm thanh (`MainMetadataService.ts`) ngăn ngừa Zombie Child Process.
  - Bổ sung cờ `isMounted` cho `useLyrics.ts` chống cập nhật state trên unmounted component khi chuyển bài nhanh.
  - Kết quả: **318/318 Desktop tests Green (42/42 test files), 19/19 Hooks tests Green, Clean Production Build, Zero TypeScript errors**.
  - Chi tiết tại báo cáo kiểm toán chuyên sâu: [`memory_leak_audit_report.md`](file:///C:/Users/Luxaztk/.gemini/antigravity-ide/brain/a8a3c06a-e37e-4259-a3a1-18aff735bbba/memory_leak_audit_report.md).

- [x] **Sửa lỗi treo vĩnh viễn Loading danh sách bài hát khi điều hướng từ SettingsPage về PlaylistDetailPage:**
  - **Nguyên nhân gốc rễ:** Trong `usePlaylistData.ts`, logic so khớp thay đổi state dựa trên `prevDeps` (`useState({ id, library, playlists, songs })`). Khi điều hướng từ SettingsPage về Playlist (ví dụ `/playlist/0`), dữ liệu `library`, `playlists` và `songs` trong `LibraryContext` đã có sẵn trong RAM. Khi hook khởi tạo, `prevDeps` lưu chính các đối tượng này dẫn đến điều kiện so sánh khác biệt (`id !== prevDeps.id || library !== prevDeps.library...`) đánh giá thành `false`. Kết quả là `setIsLoading(false)` không bao giờ được kích hoạt, `playlist` giữ giá trị `null`, làm giao diện hiển thị vĩnh viễn trạng thái loading. Khi người dùng click sang playlist khác, `id !== prevDeps.id` kích hoạt thì mới thoát khỏi trạng thái treo.
  - **Giải pháp triệt để:**
    - Tách hàm thuần túy `getPlaylistState(id, library, playlists, songs)` để tính toán đồng bộ trạng thái `playlist`, `localSongs`, `isLoading`.
    - Sử dụng lazy initializer (`useState(() => getPlaylistState(...))`) cho `playlist`, `localSongs` và `isLoading`. Nhờ vậy, ngay khi component mount, nếu dữ liệu thư viện đã có sẵn trong context, hook tính toán và trả về dữ liệu bài hát ngay trong render đầu tiên (Zero-flicker, `isLoading = false` tức thì).
    - Cập nhật `useEffect` lắng nghe dependency `[id, library, playlists, songs]` với các bộ lọc shallow equality guard chống re-render thừa.
    - Bổ sung bộ kiểm thử tự động tại `src/tests/presentations/pages/PlaylistDetailPage/hooks/usePlaylistData.test.ts` bao phủ luồng điều hướng giữa các trang và chuyển đổi playlist.
  - **Kết quả:** **344/344 Desktop tests Green (46/46 test files), Clean Build, Zero TypeScript errors**.

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

- [x] **Phase 1: Khởi Tạo Workspace & Gateway Kết Nối**
  - [x] Khởi tạo package `apps/bot` với TypeScript, `discord.js` (v14) và `@discordjs/voice`.
  - [x] Thiết lập hệ thống nạp cấu hình môi trường (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`).
  - [x] Xây dựng Handler tự động đăng ký và dispatch Slash Commands (`/ping`, `/join`, `/leave`).

- [x] **Phase 2: Voice Audio Streaming Pipeline (yt-dlp + Local File)**
  - [x] Tích hợp `@discordjs/voice` + `prism-media` + `opusscript`.
  - [x] Xây dựng bộ Stream Extractor kế thừa `yt-dlp` pipe stdout trực tiếp vào FFmpeg (phát tức thì < 1s).
  - [x] Tích hợp nạp file `youtube_cookies.txt` từ cấu hình cá nhân để triệt tiêu lỗi YouTube 403 / Bot Detection.
  - [x] Hỗ trợ phát trực tiếp kho nhạc Local trên PC (`.mp3`, `.flac`, `.wav`, `.m4a`) qua Voice Channel.

- [x] **Phase 3: Queue Management & Interactive UI Controls**
  - [x] Hỗ trợ đầy đủ 13 lệnh Slash Commands: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/volume`, `/loop`, `/shuffle`, `/language`, `/ping`, `/join`, `/leave`.
  - [x] Tích hợp pipeline âm thanh PCM `s16le` 48kHz Stereo ➔ Mã hóa Opus với FFmpeg streaming trực tiếp.
  - [x] Tích hợp giao thức mã hóa đầu cuối **Discord DAVE E2EE** (`@discordjs/voice@0.19.2` + `@snazzah/davey@0.1.12` + `@noble/ciphers` + `@stablelib/xchacha20poly1305`) vượt qua mã lỗi Discord `4017`.
  - [x] Giao diện Discord Rich Embeds & Action Rows Buttons điều khiển trực quan theo MeloVista Emerald Style.

- [x] **Phase 4: Discord Embedded Activity App & Bot Hardening**
  - [x] **Tích hợp Activity Server & Webview vào `apps/bot`**: Khởi chạy HTTP Web Server + WebSocket RPC Server trong `apps/bot`.
  - [x] **Tái sử dụng 100% Desktop React UI Components**: Tích hợp Vite React bundle cho `apps/bot`.
  - [x] **WebSocket RPC Protocol Engine**: Đồng bộ hai chiều trạng thái phát nhạc (seek, volume, queue, lyrics) thời gian thực giữa Bot Voice Service và Embedded Webview UI.
  - [x] **Real-time Multi-user Sync**: Đồng bộ tương tác đa người dùng trực quan trong Voice Channel (100% tests Green).
  - [x] **Bot Deep Audit & Resiliency Hardening**: Triệt tiêu lỗi vòng lặp `destroy()`, chống memory leak, bảo vệ SSRF, hỗ trợ đầy đủ `SEEK`, `PREV_TRACK`, Repeat 3 nấc.
  - [x] **Tài Liệu Hướng Dẫn Triển Khai Bot UI**: Cập nhật `apps/bot/README.md` với hướng dẫn chi tiết về Web Dashboard, Discord Embedded Activity (Cloudflare Tunnel/Ngrok + URL Mapping), và hướng dẫn triển khai Production.
  - [x] **Critical Bug Fix Sprint (P0+P1)** *(04/09/2026)*: Vá 8 lỗi nghiêm trọng qua 5 files, tsc Zero errors, 18/18 Tests Green.
    - `BUG-A1` VoiceConnection reconnect race condition (`Promise.race` sai → `rejoin()` + 20s Ready)
    - `BUG-A2` `playNext()` đệ quy không giới hạn → `consecutiveFailures` counter MAX=5
    - `BUG-A3` `sendStateToClient()` thiếu try/catch → Unhandled WebSocket exception
    - `BUG-A4` FFmpeg `-af` filter vị trí sai → DSP filters silently fail (tách `inputArgs/outputArgs`)
    - `BUG-A5` Playlist flat-mode URL `undefined` → validate + skip invalid entries
    - `IMP-B1` Double `destroy()` redundant trong `BotClient.getMusicManager()`
    - `IMP-B2` `NoSubscriberBehavior.Pause` → `Stop` (ngăn bot freeze khi voice drop)
    - `IMP-B3` yt-dlp zombie process khi skip → override `stdout.destroy()` kill `SIGKILL`
    - `DEP-C2` Queue không giới hạn → `MAX_QUEUE_SIZE = 500` guard trong `PLAY_TRACK`
  - [x] **Remaining Points & Production Hardening Sprint (P2+P3)** *(04/09/2026)*: Triển khai toàn bộ 8 điểm audit còn lại, tsc Zero errors, 19/19 Tests Green.
    - `BUG-A6` Triệt tiêu Ticker 1s Broadcast Storm: Chỉ broadcast khi có WebSocket client kết nối thực tế tới guild; chuyển sang event-driven `stateChange` listener; bọc `ws.send` try/catch dọn dead connections.
    - `IMP-B7` Debounce 500ms cho `updateNowPlayingMessage()`: Ngăn chặn triệt để mã lỗi rate limit `429 Too Many Requests` của Discord API khi kéo volume hoặc bấm nút liên tiếp.
    - `DEP-C3` Netscape Cookies Expiration & Validity Check trong `YoutubeExtractor`: Kiểm tra epoch expiration của cookies đăng nhập (`LOGIN_INFO`, `SAPISID`...) và cảnh báo sớm.
    - `DEP-C4` Auto-rejoin Voice Connection khi Discord Gateway reconnect (`Events.ShardResume` & `Events.VoiceStateUpdate`).
    - `IMP-B4` Button Prefix Guard (`btn_`) trong `interactionCreate`: Ngăn chặn khởi tạo dư thừa `MusicManager` instance từ các button tương tác ngoài.
    - `IMP-B8` Slash Commands SHA-256 Hash Caching (`ready.ts`): Bỏ qua `rest.put(...)` nếu commands không thay đổi khi bot khởi động lại (tránh rate limit đăng ký lệnh).
    - `IMP-B5` SPA Fallback Header `Content-Type: text/html; charset=utf-8` trong `ActivityServer`.
    - `DEP-C1` Bổ sung metrics giám sát hệ thống (`activeGuilds`, `wsClients`, `uptime`, `memoryUsage` heap/rss) vào `/api/health` cho server Pentium N6000 4GB RAM.

- [ ] **Phase 5: Bộ Lọc Âm Thanh Nâng Cao & Tối Ưu Tìm Kiếm (DSP & Search Expansion)**
  - [ ] Tính năng Autocomplete Search cho lệnh `/play` (gợi ý nhanh từ YouTube & thư viện cục bộ).
  - [ ] Tích hợp bộ lọc âm thanh thời gian thực (DSP Filters): Bass Boost, Nightcore, 8D Audio, Volume Normalization.

- [ ] **Phase 6: Đóng Gói Docker, CI/CD & Triển Khai Hosting 24/7 (Packaging & Cloud Hosting)**
  - [ ] Tạo Multi-Stage Dockerfile tối ưu dung lượng (< 250MB) kèm `yt-dlp` và `ffmpeg`.
  - [ ] Thiết lập `docker-compose.yml` với volume persistence cho Data, Cookies & Local Music.
  - [ ] Cấu hình PM2 Process Manager (`ecosystem.config.cjs`) cho môi trường Non-Docker.
  - [ ] Tích hợp Cloudflare Tunnel (HTTPS/WSS 0đ) cho Discord Activity Webview.
  - [ ] Tạo tài liệu hướng dẫn triển khai hoàn chỉnh từ A-Z (`docs/bot/__BOT_deployment_guide.md`).

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

## 📡 5. MeloVista Homelab & Streaming Engine (Desktop • Mobile • Server)

Mục tiêu: Xây dựng hệ sinh thái phát nhạc trực tuyến độ trễ thấp (< 300ms) kết nối MeloVista Desktop, Mobile với máy chủ Homelab (`luxaztk-server` Intel Pentium N6000 440GB FLAC/MP3) và phát trực tiếp qua mạng LAN.

- [x] **Phase 1: Tháo Gỡ Rào Cản Client Engine & Mở Rộng Data Model (P0 - Song Song)** *(Hoàn thành 04/09/2026)*
  - [x] Mở rộng interface `Song` trong `@music/types`: Thêm `sourceType?: 'local' | 'stream' | 'cloud'` và `streamUrl?: string`.
  - [x] Nâng cấp `AudioEngine.ts` (`packages/player`): Hỗ trợ trực tiếp URL HTTP/HTTPS/Blob, kích hoạt `crossOrigin: 'anonymous'`, giữ nguyên tương thích ngược với `melovista://app/*` (14/14 tests Green).
  - [x] Cập nhật CSP trong `apps/desktop/electron/main.ts`: Mở rộng `media-src` và `connect-src` hỗ trợ stream từ xa (318/318 tests Green).
  - [x] Tháo gỡ nút thắt `new File(uri)` trong `ExpoAudioEngine.ts` (`apps/mobile`): Cho phép nhận thẳng Remote URL vào `expo-audio`.
  - [x] Vá lỗi bất đồng bộ trong `MobileAudioAdapter.test.ts` (12/12 mobile tests Green).

- [x] **Phase 2: Xây Dựng Standalone Streaming Server (`apps/server`) (P0 - Song Song)** *(Hoàn thành 04/09/2026)*
  - [x] Thiết lập backend Express + TypeScript tối ưu cho máy chủ cá nhân Pentium N6000 6W (RAM < 80MB).
  - [x] Triển khai 100% **Direct Stream HTTP 206 Partial Content** (Zero-copy Range Requests) không transcode, bảo tồn âm thanh Lossless và 0% CPU (`StreamController.ts`).
  - [x] Bộ quét thư mục nhạc cục bộ (Music Scanner) đọc metadata ID3 và Album Art phục vụ qua REST API JSON (`MusicScanner.ts`).
  - [x] Cung cấp 3 API cốt lõi: `GET /api/songs`, `GET /api/stream/:songId`, `GET /api/cover/:songId` (10/10 tests Green, zero TS errors).
  - [x] Đóng gói & cấu hình triển khai Homelab (`apps/server/ecosystem.config.cjs`, root `ecosystem.config.cjs`, `apps/server/.env.example`, `scripts/deploy-homelab.sh`) quản lý tiến trình bằng PM2 chạy 24/7 trên node `luxaztk-server` (Pentium N6000). Hướng dẫn triển khai chi tiết: [`homelab_dual_deployment_guide.md`](file:///C:/Users/Luxaztk/.gemini/antigravity-ide/brain/44800a45-f90e-4c8b-8c82-b696295c68f0/homelab_dual_deployment_guide.md).

- [x] **Phase 3: Kết Nối Máy Chủ & Phát Nhạc Độc Lập (Desktop & Mobile) (P1)** *(Hoàn thành 04/09/2026)*
  - [x] Desktop: Nhập Server URL trong `SettingsPage/sections/ServerSection.tsx`, kiểm tra kết nối (`ServerClient.checkHealth`), đồng bộ bài hát (`ServerClient.fetchSongs` + `handleAddSongs`) và phát trực tiếp bài hát từ máy chủ Homelab (7/7 tests Green).
  - [x] **Fix Desktop ServerSection i18n keys & CSS styling:** Bổ sung từ điển đa ngôn ngữ (vi/en) cho tab cài đặt Server trong `packages/i18n/src/desktop.ts`, khắc phục class CSS `.setting-group` -> `.settings-group` trong `ServerSection.tsx`, chuẩn hóa theme semantic variables trong `SettingsPage.scss` và hoàn thiện cơ chế fallback i18n `defaultValue` trong `LanguageProvider.tsx` (100% tests Green).
  - [x] **Fix Desktop Server URL Persistence & Quick Sync Visibility:** Khắc phục lỗi lọc bỏ trường `server` trong `SettingsProvider.tsx`, bổ sung deep-merge fallback `server` trong `MainStorageAdapter.ts` (Electron Main process), đồng bộ hai chiều `inputUrl` trong `ServerSection.tsx` và bổ sung unit test tập trung `SettingsProvider.test.tsx` (100% Green).
  - [x] Mobile: Nhập Server URL trong `app/(tabs)/settings.tsx`, đồng bộ dữ liệu vào `AsyncStorage` qua `MobileServerSyncService.ts`, kiểm tra kết nối và nạp danh sách bài hát vào thư viện qua `useLibraryContext()` (8/8 tests Green).
  - [x] Trình phát hiển thị badge `STREAM` đồng nhất trên Desktop (`SongRow`, `NowPlaying`) và Mobile (`SongRow`, `PlayerBar`, `NowPlayingScreen`).
  - [x] Kiểm thử toàn diện: **44/44 desktop suites pass (330 tests)**, 20/20 mobile tests pass, Zero TS errors trên toàn bộ Monorepo.

- [x] **Phase 3.5: Đẩy Kho Nhạc Từ Desktop Lên Server (1-Click Push & Auto-Sync - P1)** *(Hoàn thành 05/09/2026)*:
  - [x] **Phía Server (`apps/server`)**:
    - Endpoint `POST /api/library/diff`: So khớp 2 tầng (Tầng 1: Audio Fingerprint `hash` / `p2:...` với Perceptual Similarity >= 0.85 chống trùng khi sửa tag ID3; Tầng 2: Title + Artist + Duration ± 3s).
    - Endpoint `POST /api/upload`: Stream trực tiếp file từ request pipe xuống đĩa cứng (`MUSIC_DIR/{Artist}/{Album}/{Filename}`) và index tức thì vào RAM scanner (12/12 tests Green).
    - Hỗ trợ reverse proxy / Cloudflare Tunnel qua `trust proxy` và tự động phân giải `BASE_URL`.
  - [x] **Phía Electron Main (`apps/desktop/electron`)**:
    - IPC handler `server:uploadSong`: Đọc file stream từ ổ đĩa (`fs.createReadStream`) truyền thẳng qua HTTP POST (Node fetch `duplex: 'half'`), phát event `server:uploadProgress` với tốc độ MB/s.
    - Preload bridge `uploadSongToServer` và `onUploadProgress`.
  - [x] **Phía Desktop Core & Service (`@music/core` & `apps/desktop`)**:
    - `ServerClient.checkLibraryDiff()` (72/72 tests Green).
    - `ServerUploadService`: Quản lý batch diffing, stream uploading, tính toán tốc độ MB/s, quản lý hủy (AbortSignal) và `uploadSingleSong()`.
  - [x] **Giao diện Desktop (`ServerSection.tsx` & `SettingsPage.scss`)**:
    - Thẻ thống kê số lượng bài hát cục bộ (`HardDrive`) và số lượng bài trên Server (`Server`).
    - Nút **"Đẩy kho nhạc lên Server"** (`UploadCloud`) kèm thanh tiến trình trực quan (% hoàn thành, tên bài đang đẩy, tốc độ MB/s, nút Hủy).
    - Tự động kiểm tra sức khỏe máy chủ khi tải trang (`checkHealth` background).
    - Checkbox toggle **"Tự động đẩy khi tải nhạc mới"** (`autoPushOnDownload`).
  - [x] **Auto-Push On Download (`DownloadProvider.tsx`)**:
    - Tự động đẩy file copy lên Homelab Server ngay khi tải xong từ YouTube nếu bật `autoPushOnDownload`.
  - [x] **Kiểm thử toàn diện**: **45/45 suites passing (340/340 tests Green)** trên desktop, 12/12 server tests passing, 72/72 core tests passing, Zero TypeScript errors trên toàn bộ Monorepo.

- [x] **Phase 4: Caching Cục Bộ & Trải Nghiệm Offline Cho Mobile (P2)** *(Hoàn thành 04/09/2026)*
  - [x] **Engine LRU Cache High/Low Watermark (100% / 80%)**: Xây dựng `MobileAudioCacheService.ts` quản lý bộ nhớ đệm `Paths.cache/melovista/audio_cache/`, thuật toán High/Low Watermark (mặc định 500MB / 400MB) theo chuẩn Spotify và ExoPlayer, cơ chế Atomic Write (`.tmp` -> `.mp3`) chống hỏng file và Touch-on-read cập nhật timestamp (9/9 tests Green).
  - [x] **Pinned Offline Storage**: Xây dựng `MobileOfflineService.ts` quản lý tải về vĩnh viễn vào `Paths.document/melovista/offline/`, bảo vệ độc lập 100% không bị xóa bởi thuật toán LRU, tải đồng bộ Cover Art và cập nhật flag `isOffline` (6/6 tests Green).
  - [x] **Audio Cascade & Auto-Caching**: Nâng cấp `MobileAudioAdapter.ts` ưu tiên phát nhạc theo tầng `Offline` -> `LRU Cache` -> `Remote Stream`, tự động background caching cho luồng stream từ xa không làm gián đoạn độ trễ phát (5/5 tests Green).
  - [x] **Predictive Pre-caching Hook**: Xây dựng `usePrecacheNextTrack.ts` và tích hợp vào `PlayerWithLibrary.tsx`, tự động tải trước bài hát tiếp theo trong hàng đợi khi bài hiện tại chạy vượt 50% thời lượng (4/4 tests Green).
  - [x] **Mobile UI Integration**:
    - `SongActions.tsx`: Nút "Tải về nghe Offline" / "Xóa bản tải Offline" trực quan.
    - `now-playing.tsx`: Nút Quick Action tải về trên Header với ActivityIndicator, badge `OFFLINE` xanh dương.
    - `library.tsx` & `playlist/[id].tsx`: Hiển thị badge `OFFLINE` / `STREAM` trên từng dòng bài hát.
    - `settings.tsx`: Thẻ "Bộ Nhớ Đệm & Offline" hiển thị dung lượng đệm LRU, số bài offline, nút xóa cache và bộ chọn hạn mức (250MB, 500MB, 1GB).
  - [x] **Kiểm thử toàn diện**: 40/40 mobile tests pass (7 test files), 324/324 desktop tests pass (43 suites), 69/69 core tests pass, 10/10 server tests pass, Zero TypeScript errors trên toàn bộ Monorepo.

- [ ] **Phase 5 (Future / Mở Rộng Sau Nếu Cần): Đồng Bộ Đa Nền Tảng & Remote Control**
  - [ ] WebSocket Remote Control: Điều khiển phát nhạc trên PC từ điện thoại và ngược lại.
  - [ ] Tính năng "Listen Together": Nghe cùng một bài hát trên nhiều thiết bị với độ trễ < 50ms.

---

## 🧪 6. Hệ Thống Kiểm Thử (Testing Suite)

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
- [📁 docs/bot/](file:///k:/cross-platform-music-player-app/docs/bot): Báo cáo kiến trúc ([`__BOT_architecture_report.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_architecture_report.md)), đặc tả Audio Pipeline ([`__BOT_audio_pipeline.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_audio_pipeline.md)), hướng dẫn thiết lập VPS ([`__BOT_vps_setup_guide.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_vps_setup_guide.md)), báo cáo kiểm tra tương tác ([`__BOT_interaction_logic_audit.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_interaction_logic_audit.md)), và bộ kịch bản test thủ công ([`__BOT_manual_test_cases.md`](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_manual_test_cases.md)).
- [📁 docs/server/](file:///k:/cross-platform-music-player-app/docs/server): Thông số kỹ thuật máy chủ Homelab và định hướng kiến trúc Streaming ([`SERVER_SPECIFICATIONS.md`](file:///k:/cross-platform-music-player-app/docs/server/SERVER_SPECIFICATIONS.md)).

---

> [!TIP]
> Tài liệu này là **Single Source of Truth** về tiến độ dự án. Mọi tác vụ khi thực hiện đều phải được đối chiếu và cập nhật trạng thái trực tiếp tại đây.

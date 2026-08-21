# MeloVista - Cross-Platform Music Ecosystem 🎵✨

MeloVista là hệ sinh thái quản lý và phát nhạc đa nền tảng (**Desktop • Mobile • Discord Bot • Cloud Sync**) tốc độ cao với kiến trúc **Offline-First**. Ứng dụng giải quyết triệt để bài toán tổ chức, phát và đồng bộ kho nhạc cá nhân hàng chục ngàn bài hát chất lượng cao (FLAC, WAV, MP3) mà không gây giật lag nhờ cơ chế quét thư mục tối ưu và bộ ảo hóa danh sách (Window Virtualization Engine).

---

## 🌟 Tính Năng Nổi Bật

- 🖥️ **Desktop App (Electron + Vite + React):**
  - Quản lý và phát nhạc offline không giới hạn với `howler.js` và custom protocol `melovista://`.
  - Bộ nhận diện vân tay âm thanh **Perceptual Audio Fingerprinting (Guard 3 - v2)** chống trùng lặp dữ liệu tuyệt đối.
  - Tích hợp công cụ tải nhạc trực tuyến thông minh (`yt-dlp` & `FFmpeg` standalone) không cần Python.
  - Lời bài hát đồng bộ (Synchronized Lyrics) với tính năng One-click Sync Now và tinh chỉnh offset.
  - Hệ thống 6 giao diện màu Semantic (Midnight, Amoled, Nord, Rose, Ocean, Tame Snow).
  - Tìm kiếm thông minh Smart Intent Search Engine (tự động phân biệt tiếng Việt có dấu / không dấu).
- 📱 **Mobile App (React Native / Expo):**
  - Trải nghiệm di động đồng bộ với giao diện trực quan và `expo-audio` engine.
  - Quản lý thư viện cục bộ độc lập, nhập file tức thì và hỗ trợ danh sách phát tùy biến.
- 🤖 **Discord Music Bot (`apps/bot`):**
  - Bot phát nhạc cá nhân chất lượng cao cho Discord Voice Channel.
  - Stream nhạc trực tiếp từ YouTube (Bypass triệt để lỗi 403 / Bot Detection với cookie cá nhân) và kho nhạc Local/FLAC trên máy tính.
  - Bộ lọc âm thanh thời gian thực (Real-time DSP Filters: Bass Boost, Nightcore, 8D Audio) và điều khiển qua nút bấm (Action Row Buttons).
- ☁️ **MeloVista Cloud Sync (Đang phát triển):**
  - Đồng bộ thư viện và phát nhạc xuyên nền tảng qua Google Drive Serverless Database.

---

## 🏗️ Kiến Trúc Hệ Thống & Cấu Trúc Monorepo

Dự án áp dụng mô hình **Monorepo** (thông qua npm workspaces) để chia sẻ và tái sử dụng 100% logic nghiệp vụ lõi giữa các nền tảng:

```text
cross-platform-music-player-app/
├── apps/
│   ├── desktop/          # Ứng dụng Desktop (Electron + Vite + React)
│   ├── mobile/           # Ứng dụng Mobile (React Native / Expo)
│   └── bot/              # Discord Music Bot (discord.js v14 + @discordjs/voice)
├── packages/
│   ├── core/             # Logic nghiệp vụ lõi (Library, Track, Playlist, Mutex)
│   ├── player/           # Trình phát nhạc, Audio State & Queue logic
│   ├── types/            # TypeScript interfaces & types dùng chung
│   ├── utils/            # Tiện ích định dạng thời gian, YouTube extractor, split artists
│   ├── hooks/            # React Hooks & Downloader state logic
│   ├── brand/            # Nhận diện thương hiệu & Logo assets
│   ├── i18n/             # Hệ thống đa ngôn ngữ toàn cục (Tiếng Việt & English)
│   └── ui/               # Thành phần UI dùng chung
└── docs/                 # Tài liệu thiết kế kiến trúc và lộ trình phát triển
    ├── desktop/          # Tài liệu chi tiết nền tảng Desktop
    ├── mobile/           # Tài liệu chi tiết nền tảng Mobile
    ├── bot/              # Tài liệu & Audio Pipeline của Discord Bot
    └── ____ROADMAP.md    # Lộ trình & task tracker toàn diện của dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Môi Trường
- **Node.js:** `v22.x` (khuyên dùng `v22.22.1` như trong `.nvmrc`).
- **Package Manager:** `npm` (v9+).

### 1. Cài đặt toàn bộ dependencies (Monorepo)
```bash
# Clone repository
git clone https://github.com/Luxaztk/Cross-Platform-Music-Player-App.git
cd Cross-Platform-Music-Player-App

# Cài đặt toàn bộ packages và workspaces
npm install
```

### 2. Khởi chạy từng ứng dụng

```bash
# Khởi chạy Desktop App (Electron Development)
npm run desktop

# Khởi chạy Mobile App (Expo Metro Bundler)
npm run mobile

# Khởi chạy Discord Bot (sau khi cấu hình .env)
npm run bot --workspace=apps/bot
```

---

## 🧪 Hệ Thống Kiểm Thử (Testing Suite)

Dự án tuân thủ nghiêm ngặt chuẩn **Test-Driven Development (TDD)** với 100% test coverage trên các package nghiệp vụ lõi:

```bash
# Chạy toàn bộ Unit Tests trên toàn bộ Monorepo
npm run test

# Chạy kiểm thử kèm báo cáo Coverage chi tiết
npm run test:coverage
```

---

## 📖 Tài Liệu Chi Tiết

- 🖥️ **[Hướng dẫn Desktop App](file:///k:/cross-platform-music-player-app/apps/desktop/README.md)**
- 📱 **[Hướng dẫn Mobile App](file:///k:/cross-platform-music-player-app/apps/mobile/README.md)**
- 🤖 **[Báo cáo Kiến trúc Discord Bot](file:///k:/cross-platform-music-player-app/docs/bot/__BOT_architecture_report.md)**
- 🗺️ **[Lộ trình Phát triển Tổng thể (ROADMAP)](file:///k:/cross-platform-music-player-app/docs/____ROADMAP.md)**

---

## 📜 Giấy Phép & Tác Quyền

Dự án được phát triển và duy trì độc lập bởi **Luxaztk**. Phát hành dưới giấy phép [ISC License](file:///k:/cross-platform-music-player-app/package.json).

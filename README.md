<div align="center">

# 🎵 MeloVista

**The Next-Generation Cross-Platform Music Player**

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast-purple.svg)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-Supported-black.svg)](https://www.electronjs.org/)
[![Expo](https://img.shields.io/badge/Expo-Mobile-black.svg)](https://expo.dev/)

</div>

MeloVista là một trình phát nhạc đa nền tảng (Cross-Platform) hiệu năng cao, được thiết kế theo tư tưởng **Clean Architecture** và tuân thủ các nguyên tắc thiết kế **SOLID**, **TDD (Test-Driven Development)** khắt khe. Dự án được triển khai dưới dạng **Monorepo**, hỗ trợ cả Desktop (Electron) và Mobile (React Native / Expo) sử dụng chung một lõi logic chia sẻ.

---

## ✨ Tính năng nổi bật

### 🌍 Kiến trúc Lõi dùng chung (Shared Core)

- **Đa nền tảng thực sự**: Kiến trúc lõi (`@music/core`) hoạt động mượt mà trên cả trình duyệt Web, Desktop (Electron) và Mobile (React Native) mà không phụ thuộc vào framework.
- **Nhận diện trùng lặp thông minh**: Kiểm tra bài hát theo Perceptual Hash và siêu dữ liệu trước khi tải/nhập, đảm bảo thư viện nhạc luôn sạch sẽ.
- **Đa ngôn ngữ (i18n)**: Hỗ trợ tiếng Việt và tiếng Anh, chuyển đổi ngôn ngữ không độ trễ nhờ kiến trúc Reactive Provider.

### 💻 Nền tảng Desktop (Electron + React)

- **Xử lý danh sách khổng lồ (Virtualization)**: Sử dụng kỹ thuật ảo hóa Windowing trên DOM, render hàng ngàn bài hát cùng lúc mà không gây giật lag (100% 60FPS).
- **Hỗ trợ tải từ YouTube (Downloader)**: Trình phân tích URL thông minh tải cả video và playlist với cơ chế hàng đợi đa luồng. Tự động bóc tách Audio và gán ID3 Tags (Ảnh bìa, Lời bài hát, Nghệ sĩ) bằng sức mạnh FFmpeg của PC.
- **Audio Engine chuyên sâu**: Hệ thống peak-meter đo sóng âm thời gian thực, test-sound kiểm tra phần cứng và các cấu hình âm thanh nâng cao.
- **Giao diện hiện đại (Glassmorphism)**: Tận dụng sức mạnh GPU trên máy tính để xử lý các hiệu ứng blur mượt mà, phản hồi siêu nhạy.

### 📱 Nền tảng Mobile (React Native / Expo)

- **Trải nghiệm Native-like**: Giao diện được tối ưu hóa riêng biệt cho thao tác vuốt chạm trên màn hình cảm ứng di động.
- **Mobile Audio Engine**: Tích hợp các thư viện native (`expo-av`) để phát nhạc trên thiết bị di động thay vì dùng Web Audio.
- **Quản lý Thư viện Cơ bản**: Hỗ trợ xem danh sách phát, đọc cấu hình ngôn ngữ/giao diện một cách nhẹ nhàng nhất có thể.
- _(Đang phát triển)_: Hệ thống phát nhạc nền (Background Playback) và Download Manager riêng cho thiết bị di động.

---

## 🏗️ Kiến trúc Monorepo

Dự án được tổ chức thành các Workspaces (packages) độc lập để tối đa hóa khả năng tái sử dụng mã nguồn.

```bash
📦 cross-platform-music-player-app
 ┣ 📂 apps/             # Các ứng dụng frontend
 ┃ ┣ 📂 desktop/        # Electron + React + Vite
 ┃ ┗ 📂 mobile/         # React Native + Expo
 ┣ 📂 packages/         # Thư viện dùng chung
 ┃ ┣ 📂 brand/          # Brand styles
 ┃ ┣ 📂 core/           # Business Logic (UseCases, Repositories, Domain Models)
 ┃ ┣ 📂 hooks/          # React Custom Hooks (LibraryProvider, SettingsProvider...)
 ┃ ┣ 📂 i18n/           # Từ điển đa ngôn ngữ
 ┃ ┣ 📂 player/         # Audio Engine Interface dùng chung
 ┃ ┣ 📂 types/          # TypeScript Interfaces (Song, Playlist, SyncOptions...)
 ┃ ┗ 📂 utils/          # Công cụ hỗ trợ, Parser (YouTube, Lyrics...)
 ┗ 📂 docs/             # Tài liệu, MVP Draft, Roadmap
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án

### 1. Yêu cầu hệ thống

- **Node.js**: Phiên bản 18.x trở lên.
- **Git**: Để clone repo.

### 2. Cài đặt

```bash
# Clone dự án
git clone https://github.com/Luxaztk/Cross-Platform-Music-Player-App.git

# Di chuyển vào thư mục dự án
cd Cross-Platform-Music-Player-App

# Cài đặt toàn bộ dependencies (Workspaces)
npm install
```

### 3. Chạy môi trường Desktop (Electron)

Lệnh này sẽ khởi động Vite dev server và cửa sổ ứng dụng Electron.

```bash
npm run desktop
```

### 4. Chạy môi trường Mobile (React Native / Expo)

Lệnh này sẽ khởi động Expo Metro Bundler.

```bash
npm run mobile
```

#### Trải nghiệm trên thiết bị thật (Expo Go)

1. Cài đặt ứng dụng **Expo Go** trên thiết bị iOS / Android của bạn (Yêu cầu SDK 55).
2. Đảm bảo thiết bị kết nối cùng mạng Wi-Fi với máy tính.
3. Mở Expo Go và chọn "Scan QR Code".
4. Nếu màn hình terminal hiển thị `Using development build...`, nhấn phím `s` trên bàn phím để chuyển sang chế độ Expo Go.
5. Quét mã QR xuất hiện trên màn hình terminal của máy tính.

#### Trải nghiệm bằng Development Build

1. Tải bản build APK (Development Build) trên Android [tại đây](https://github.com/Luxaztk/Cross-Platform-Music-Player-App/releases/download/mobile-v.0.0.0/application-1ee841f8-dde3-4f8d-9057-02608c881720.apk) và cài đặt (Tên ứng dụng là `mobile`).
2. Mở ứng dụng `mobile` > Chọn "Scan QR Code".
3. Nếu màn hình terminal hiển thị `Using Expo Go...`, nhấn phím `d` trên bàn phím để đổi chế độ sang Development Build.
4. Quét mã QR xuất hiện trên màn hình terminal của máy tính.

---

## 🧪 Hệ thống Kiểm thử (Testing)

MeloVista áp dụng quy tắc **Zero Red-squiggles** và **Truthful TDD** (Không sửa test để đối phó với code hỏng). Tất cả kiểm thử UI Unit Test đều mô phỏng thực tế DOM bằng `@testing-library/user-event`.

```bash
# Chạy toàn bộ Unit Tests trên các package
npm run test

# Chạy Test kèm báo cáo Coverage (Mức độ bao phủ)
npm run test:coverage
```

Các bài kiểm thử (Tests) cho UI được tập trung toàn bộ tại thư mục `apps/desktop/src/tests/...` thay vì nằm lộn xộn trong Source Code.

---

## 📚 Tài liệu & Lộ trình (Documentation)

- **`docs/____ROADMAP.md`**: Kế hoạch phát triển và danh sách các tính năng đã hoàn thiện của dự án.
- **`docs/Bao_Cao_MVP_Draft.md`**: Báo cáo tổng quan về quá trình phát triển phiên bản MVP, kiến trúc hệ thống và danh sách Unit Test cốt lõi.
- **`AI_RULES.md`**: Bộ quy tắc kiến trúc khắt khe (Enterprise Architecture Guidelines) dành riêng cho việc duy trì chất lượng mã nguồn dự án.

> Các tài liệu khác lưu trữ trong thư mục `docs/`. Quy tắc đặt tên:
>
> - `__BTL_*`: Tài liệu cho bài tập lớn.
> - `__PROJECT_*`: Tài liệu chung cho toàn bộ dự án đa nền tảng.
> - `__DESKTOP_*` / `__MOBILE_*`: Tài liệu dành riêng cho từng nhánh Client.

---

<div align="center">
  <i>Được phát triển với niềm đam mê âm nhạc và sự hoàn hảo trong kiến trúc.</i>
</div>

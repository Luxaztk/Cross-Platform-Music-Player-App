# MeloVista - Cross-Platform Music Player

## 1. Thông tin nhóm

- Môn học: AC3030 – Phát triển ứng dụng
- Học kỳ: 2025.2
- Nhóm: Nhóm 9
- Thành viên:
  - Chử Văn Lộc (20221860) - Tech Lead
  - Nguyễn Hồng Vân (20231649) - Developer
  - Trần Công Minh (20231611) - Developer
  - Đỗ Nguyễn Việt Hoàng (20231590) - Developer

## 2. Mô tả ngắn

MeloVista là một ứng dụng quản lý và phát nhạc ngoại tuyến tốc độ cao, đa nền tảng (Desktop & Mobile). Ứng dụng giải quyết bài toán tải và quản lý thư viện hàng ngàn bài hát cục bộ (local) mà không gây giật lag nhờ cơ chế quét thư mục tối ưu và ảo hóa danh sách (Virtualization). Người dùng hướng tới là người dùng cá nhân có kho nhạc Offline lớn. Chức năng chính: Import thư mục nhạc, Playback với Audio Engine chuyên sâu, Quản lý danh sách phát và Hàng đợi.

## 3. Công nghệ sử dụng

- Language: TypeScript, SCSS
- Framework: React 18, Electron (Desktop), React Native / Expo (Mobile)
- Database: Hệ thống File System (Local JSON Storage qua IPC)
- Test framework: Vitest, React Testing Library
- Build/deploy: Vite, Electron-Builder

## 4. Cách chạy bản deploy

### 4.1. Yêu cầu môi trường

- OS: Windows 10/11 (Để chạy file `.exe`)
- Runtime: Không yêu cầu Node.js (App đã được đóng gói độc lập)
- Database: Không yêu cầu cấu hình (Sử dụng Local Storage)

### 4.2. Các bước chạy

```bash
1. Tải file MeloVista_Setup.exe từ bản Release hoặc thư mục deploy.
2. Click đúp vào file để cài đặt (quá trình tự động diễn ra trong 10 giây).
3. Ứng dụng sẽ tự động mở lên sau khi cài đặt.
```

### 4.3. Dữ liệu demo

- Ứng dụng không yêu cầu tài khoản đăng nhập (Offline First).
- Dữ liệu âm thanh: Nhóm cung cấp sẵn thư mục `demo-data/` đính kèm source code chứa các file `.mp3` mẫu.
- Để nạp dữ liệu: Mở App -> Click `Import Folder` ở Library Header -> Trỏ đến thư mục `demo-data`.

## 5. Cách chạy từ source

> **Ghi chú môi trường:** Dự án chạy ổn định và tốt nhất trên chính xác Node.js phiên bản **v22.22.1** (như đã cấu hình trong file `.nvmrc`). Vui lòng sử dụng lệnh `nvm use` nếu bạn có Node Version Manager.

```bash
# Clone dự án & di chuyển vào thư mục
git clone https://github.com/Luxaztk/Cross-Platform-Music-Player-App.git
cd Cross-Platform-Music-Player-App

# Cài đặt tất cả dependencies (Monorepo)
npm install

# Khởi chạy ứng dụng Desktop (Vite Dev Server + Electron)
npm run desktop
```

## 6. Cách chạy test

```bash
# Chạy toàn bộ 62 Unit Tests trên các package
npm run test

# Chạy Test kèm báo cáo Coverage
npm run test:coverage
```

## 7. Cấu trúc thư mục

```text
apps/           # Các ứng dụng frontend (desktop, mobile)
packages/       # Các module logic dùng chung (core, player, infra, i18n)
docs/           # Tài liệu môn học, biểu đồ, báo cáo
demo-data/      # Dữ liệu mp3 dùng để demo
```

## 8. Ghi chú lỗi thường gặp

| Lỗi                                                       | Cách xử lý                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Báo lỗi`Cannot find module 'music-metadata'` khi chạy dev | Chạy lại`npm install` tại thư mục gốc vì đây là Monorepo dùng npm workspaces.                    |
| Màn hình ứng dụng trắng xóa hoặc DevTools báo lỗi CSP     | Kiểm tra xem cổng Vite (5173) có đang bị ứng dụng khác chiếm dụng không.                         |
| Import nhạc thành công nhưng không có âm thanh phát ra    | Đảm bảo máy tính đang không bị Mute hoặc chưa chọn đúng Sink Audio Device trong Cài đặt (Audio). |

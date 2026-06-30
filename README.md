# MeloVista - Cross-Platform Music Player

MeloVista là một ứng dụng quản lý và phát nhạc ngoại tuyến tốc độ cao, đa nền tảng (Desktop & Mobile). Ứng dụng giải quyết bài toán tải và quản lý thư viện hàng ngàn bài hát cục bộ (local) mà không gây giật lag nhờ cơ chế quét thư mục tối ưu và ảo hóa danh sách (Virtualization).

Người dùng hướng tới là người dùng cá nhân có kho nhạc Offline lớn. Chức năng chính: Import thư mục nhạc, Playback với Audio Engine chuyên sâu, Quản lý danh sách phát và Hàng đợi.

## 1. Thông tin nhóm

- Môn học: AC3030 – Phát triển ứng dụng
- Học kỳ: 2025.2
- Nhóm: Nhóm 9
- Thành viên:
  - Chử Văn Lộc (20221860) - Tech Lead
  - Nguyễn Hồng Vân (20231649) - Developer
  - Trần Công Minh (20231611) - Developer
  - Đỗ Nguyễn Việt Hoàng (20231590) - Developer

## 2. Kiến trúc hệ thống & Dữ liệu

Ứng dụng được thiết kế theo tư tưởng **Offline-First**, không yêu cầu đăng nhập hay máy chủ backend để hoạt động:

- **Kiến trúc mã nguồn:** Sử dụng **Monorepo** (thông qua npm workspaces) để chia sẻ chung core logic giữa hai nền tảng Desktop và Mobile, giúp đảm bảo tính nhất quán.
- **Lưu trữ dữ liệu (Database):** Hoàn toàn sử dụng Local Storage.
  - **Trên Desktop:** Sử dụng hệ thống file JSON cục bộ lưu tại thư mục hệ thống (AppData). Các thao tác đọc/ghi file từ Frontend React được thực hiện an toàn thông qua **Electron IPC**.
  - **Trên Mobile:** Dữ liệu thư viện được lưu trữ an toàn bằng `expo-file-system` kết hợp với `AsyncStorage`.

## 3. Cấu trúc thư mục

```text
apps/           # Các ứng dụng frontend (desktop, mobile)
packages/       # Các module logic dùng chung (core, player, infra, i18n)
docs/           # Tài liệu thiết kế, biểu đồ, báo cáo
```

## 4. Hướng dẫn cài đặt chung

> **Ghi chú môi trường:** Dự án chạy ổn định và tốt nhất trên Node.js phiên bản **v22.22.1** (như đã cấu hình trong file `.nvmrc`). Vui lòng sử dụng lệnh `nvm use` nếu bạn có Node Version Manager.

Để bắt đầu làm việc với dự án, bạn cần clone và cài đặt toàn bộ dependencies ở thư mục gốc:

```bash
# Clone dự án & di chuyển vào thư mục
git clone https://github.com/Luxaztk/Cross-Platform-Music-Player-App.git
cd Cross-Platform-Music-Player-App

# Cài đặt tất cả dependencies (Monorepo)
npm install
```

## 5. Hướng dẫn sử dụng chi tiết từng nền tảng

Vì đây là Monorepo với hai nền tảng riêng biệt, cách chạy và cấu hình của Desktop và Mobile là khác nhau.

👉 **Xem chi tiết cách cài đặt, chạy dev và đóng gói ứng dụng tại:**

- **[Hướng dẫn cho Desktop (Electron)](./apps/desktop/README.md)**
- **[Hướng dẫn cho Mobile (React Native / Expo)](./apps/mobile/README.md)**

## 6. Testing

Để đảm bảo chất lượng, dự án sử dụng Vitest và React Testing Library:

```bash
# Chạy toàn bộ Unit Tests trên các package
npm run test

# Chạy Test kèm báo cáo Coverage
npm run test:coverage
```

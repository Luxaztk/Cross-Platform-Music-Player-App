# MeloVista - Desktop App (Electron)

Đây là mã nguồn của ứng dụng MeloVista dành cho nền tảng Desktop (Windows). Ứng dụng được xây dựng bằng React kết hợp với Electron để tương tác trực tiếp với File System của hệ điều hành.

## Công nghệ sử dụng

- **Frontend:** React 18, TypeScript, SCSS.
- **Desktop Runtime:** Electron.
- **Build Tool:** Vite, Electron-Builder.
- **Kiến trúc dữ liệu:** Giao tiếp qua Electron IPC (Inter-Process Communication) để đọc/ghi file `.json` trực tiếp vào thư mục hệ thống cục bộ.

## Cách chạy môi trường Development

Từ thư mục gốc (root) của dự án Monorepo, bạn chạy lệnh:

```bash
npm run desktop
```
*(Lệnh này sẽ gọi `npm run dev --workspace=apps/desktop`, khởi chạy cùng lúc Vite server cho UI và Electron cho main process).*

## Cách Build ra file thực thi (.exe)

Để đóng gói ứng dụng thành file `.exe` cài đặt cho người dùng cuối:

```bash
# Đứng tại thư mục gốc, hoặc di chuyển vào apps/desktop
cd apps/desktop
npm run build
```

Quá trình build sẽ tạo ra thư mục `release/` chứa file `MeloVista_Setup.exe`. Bạn có thể gửi file này cho bất kỳ ai dùng Windows để cài đặt.

## Ghi chú lỗi thường gặp trên Desktop

| Lỗi | Cách xử lý |
|---|---|
| Màn hình ứng dụng trắng xóa hoặc DevTools báo lỗi CSP | Kiểm tra xem cổng Vite (5173) có đang bị ứng dụng khác chiếm dụng không. |
| Import nhạc thành công nhưng không có âm thanh phát ra | Đảm bảo máy tính đang không bị Mute hoặc chưa chọn đúng thiết bị âm thanh đầu ra (Sink Audio Device) trong Cài đặt Windows. |
| Báo lỗi `Cannot find module 'music-metadata'` | Chạy lại `npm install` ở thư mục gốc để tải lại các module dùng chung (packages). |

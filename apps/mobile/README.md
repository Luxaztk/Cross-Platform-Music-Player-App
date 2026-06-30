# MeloVista - Mobile App (React Native)

Đây là mã nguồn của ứng dụng MeloVista dành cho nền tảng Mobile (Android/iOS). Ứng dụng được xây dựng bằng React Native và quản lý qua hệ sinh thái Expo.

## Công nghệ sử dụng

- **Mã nguồn:** React Native, Expo, Expo Router (chuyển trang).
- **Kiến trúc dữ liệu (Offline-First):** Sử dụng hệ thống tệp cục bộ (`expo-file-system`) kết hợp với `AsyncStorage` để lưu trữ dữ liệu thư viện. Không yêu cầu backend server.
- **Audio Engine:** `expo-audio` (Hỗ trợ phát nhạc dưới nền / Background Playback).

## Yêu cầu môi trường

Để có thể chạy được dự án này một cách hoàn chỉnh (do có sử dụng các gói native tuỳ chỉnh như Background Playback), bạn cần:
1. **Node.js** v22.22.1 (khuyên dùng).
2. **Java 17 (JDK 17)** để biên dịch Android (Gradle yêu cầu).
3. **Android Studio** (đã cài đặt Android SDK 33/34) để khởi chạy máy ảo (AVD).

## Cách chạy môi trường Development

Từ thư mục gốc (root) của dự án Monorepo, hãy cài đặt các dependencies:
```bash
npm install
```

Sau đó, di chuyển vào thư mục `apps/mobile` và tiến hành biên dịch ứng dụng:
```bash
cd apps/mobile
npx expo run:android
```
*(Lệnh này sẽ tải các thư viện native, biên dịch ra một bản "Development Build" tùy chỉnh và cài thẳng vào máy ảo Android hoặc điện thoại Android đang cắm cáp của bạn. Lần chạy đầu sẽ hơi lâu).*

Từ những lần chạy sau, bạn chỉ cần gọi lệnh:
```bash
# Ở thư mục root
npm run mobile
```
Terminal sẽ khởi chạy Expo Metro Bundler, và tự động kết nối với Development Build đã được cài trên máy bạn.

## Cách Build ra file (.apk) bằng EAS

Nếu máy tính bạn không cài đủ Android Studio, bạn có thể build trên đám mây của Expo:

```bash
# Đăng nhập Expo
eas login

# Build file APK
eas build --profile development --platform android
```
Tải file `.apk` trả về sau khi build xong và cài vào điện thoại/máy ảo để chạy.

---

## Tiến độ hiện tại (Tracking UI)

- Đã mô tả UI mong muốn tại `docs/__MOBILE_UI_desc.md`
- Đang thực hiện thay đổi UI
    - Kế hoạch + tiến độ: `docs/__MOBILE_UI_implementation_plan.md`

- **Công việc chưa hoàn thiện:**
    - Hoàn thành thay đổi UI.
    - Làm UI trong Figma để dễ hình dung.
    - Chỉnh sửa giao diện của trình phát nhạc trong màn hình khóa (chỉ xem được ở bản Development Build).
    - Xử lý mâu thuẫn trình phát nhạc: Nếu đang bật âm thanh ở một ứng dụng khác rồi lại bật nhạc trong Melovista thì cả 2 âm thanh sẽ đều phát => Xử lý để chỉ 1 âm thanh được bật.

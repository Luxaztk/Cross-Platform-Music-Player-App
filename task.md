# Melovista Project Roadmap & Task Tracker 🎵

Bản kế hoạch tổng thể cho dự án Melovista - Ưu tiên hoàn thiện Desktop App (MVP -> Tối ưu -> Làm đẹp -> Mobile).

---

## ✅ Đã Hoàn Thành (Accomplishments)

### 1. Kiến Trúc Cốt Lõi (Core Architecture)
- [x] Thiết lập cấu trúc Monorepo (`/apps`, `/packages`).
- [x] Tích hợp Electron + Vite + React (Desktop).
- [x] Hệ thống IPC Bridge bảo mật giữa Process chính và Renderer.
- [x] Đa ngôn ngữ (i18n) - Tiếng Anh & Tiếng Việt.
- [x] Hệ thống thông báo (Global Notifications).
- [x] Quản lý Bảo mật (Dynamic CSP) điều khiển bởi Main Process.

### 2. Trình Phát Nhạc & Audio Engine
- [x] Tích hợp `howler.js` cho việc giải mã âm thanh hiệu năng cao.
- [x] Protocol tùy chỉnh `melovista://` để stream file nội bộ an toàn.
- [x] Global `PlayerProvider` quản lý trạng thái phát nhạc toàn cục.
- [x] Logic nâng cao: **Hàng đợi (Queue)**, **Lịch sử (History 16 bài)**, **Trộn bài (Shuffle)**, **Lặp bài (Repeat)**.
- [x] Điều khiển Native: Thanh Progress và Volume sử dụng input range mượt mà.

### 3. Quản Lý Thư Viện & Playlist
- [x] Quét file và thư mục nhạc cục bộ.
- [x] Trích xuất Metadata (Tiêu đề, Nghệ sĩ, Album, Ảnh bìa).
- [x] Playlist CRUD: Tạo, Sửa tên, Xóa playlist.
- [x] Tương tác danh sách: Click bài hát để phát, Menu ngữ cảnh chuyên sâu.

### 4. Giao diện Desktop (UI/UX)
- [x] Layout Spotify-style (Sidebar + Main Content).
- [x] Sidebar co giãn (Collapsible) và Responsive.
- [x] Thanh PlayerBar với giao diện Queue Panel nổi (Popover).
- [x] Chuyển đổi toàn bộ sang SCSS với hệ thống Design Tokens.

---

## 🚀 Kế Hoạch Tiếp Theo (Sắp xếp theo Thứ tự Ưu tiên)

### 🔴 GIAI ĐOẠN 1: Hoàn thiện MVP (Mức độ ưu tiên CAO)
Mục tiêu: Đảm bảo người dùng có thể sử dụng hàng ngày ổn định.
- [ ] **Tìm kiếm toàn cục (Global Search)**: Tìm kiếm nhanh Song, Artist, Album.
- [ ] **Lưu trữ trạng thái (Persistence)**: Tự động lưu lại Queue và History khi tắt/mở app.
- [ ] **Bộ lọc & Sắp xếp (Filter/Sort)**: Sắp xếp danh sách theo tên, ngày thêm, thời lượng.

### 🟡 GIAI ĐOẠN 2: Tối ưu & Chức năng Phụ (Mức độ ưu tiên TRUNG BÌNH)
Mục tiêu: Tăng tính tiện dụng và khả năng tùy biến.
- [ ] **Cài đặt hệ thống (Settings)**: Thay đổi ngôn ngữ UI, lựa chọn thiết bị đầu ra âm thanh.
- [ ] **Biên tập Metadata (ID3 Editor)**: Cho phép sửa trực tiếp thông tin bài hát (Title, Artist...) ngay trong app.
- [ ] **Quản lý Hàng đợi nâng cao**: Kéo thả để thay đổi thứ tự ngay trong Queue Panel.

### 🟢 GIAI ĐOẠN 3: Làm đẹp & Trải nghiệm Nâng cao (Mức độ ưu tiên THẤP)
Mục tiêu: "Wow" người dùng bằng các tính năng cao cấp.
- [ ] **Chủ đề (Themes)**: Chế độ Dark/Light và System auto-switch.
- [ ] **Lời bài hát (Lyrics)**: Tự động tìm kiếm và hiển thị lời bài hát (Local hoặc Online).
- [ ] **Hiệu ứng âm thanh (Audio FX)**: Bộ chỉnh âm (Equalizer), Visualizer (Sóng nhạc).

### 🔵 GIAI ĐOẠN 4: Triển khai Mobile (Transform)
Mục tiêu: Đưa trải nghiệm lên các nền tảng di động.
- [ ] **React Native Mobile App**: Xây dựng ứng dụng mobile dựa trên các UseCases/Hooks đã có.
- [ ] **Đồng bộ hóa (Sync)**: (Tùy chọn) Đồng bộ playlist và sở thích giữa Desktop & Mobile.

---

> [!TIP]
> File này sẽ được cập nhật thường xuyên để theo dõi tiến độ dự án. Hãy tham khảo `README.md` để biết thêm chi tiết kỹ thuật.

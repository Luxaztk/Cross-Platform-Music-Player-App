# Melovista Project Roadmap & Task Tracker 🎵

Bản kế hoạch tổng thể cho dự án Melovista - Ưu tiên hoàn thiện Desktop App (MVP -> Tối ưu -> Làm đẹp -> Mobile).

---

## ✅ Đã Hoàn Thành (Accomplishments)

### 1. Kiến Trúc Cốt Lõi (Core Architecture)

- [X] Thiết lập cấu trúc Monorepo (`/apps`, `/packages`).
- [X] Tích hợp Electron + Vite + React (Desktop).
- [X] Hệ thống IPC Bridge bảo mật giữa Process chính và Renderer.
- [X] Đa ngôn ngữ (i18n) - Tiếng Anh & Tiếng Việt.
- [X] Hệ thống thông báo (Global Notifications).
- [X] Quản lý Bảo mật (Dynamic CSP) điều khiển bởi Main Process.

### 2. Trình Phát Nhạc & Audio Engine

- [X] Tích hợp `howler.js` cho việc giải mã âm thanh hiệu năng cao.
- [X] Protocol tùy chỉnh `melovista://` để stream file nội bộ an toàn.
  - [X] **Vân tay âm thanh Perceptual (Guard 3 - v2)**:
    - [X] Nâng cấp thuật toán Hashing dựa trên **Energy-Envelope (16kHz, Mono)**, giúp nhận diện bài hát chính xác bất chấp sự khác biệt về bitrate (128kbps vs 320kbps).
    - [X] Triển khai cơ chế **Smart Fingerprinting**: Kết hợp độ tương đồng Hash (>=75%) và sai lệch thời lượng (<0.5s) để chặn đứng các bản thu trùng lặp từ nhiều nguồn khác nhau (YouTube, CD, Local).
    - [X] Hoàn tất tiến trình **Background Migration** để nâng cấp toàn bộ thư viện cũ sang chuẩn mã Hash v2 một cách tự động.
  - [X] **Xác minh & Tài liệu hóa**:
    - [X] Nhúng metadata định danh (`origin_id`, `source_url`) trực tiếp vào tag `TXXX` của file MP3 khi tải về.
    - [X] Xây dựng bộ sưu tập 13+ script kiểm thử thủ công tại `tests/manual-verification/` phục vụ cho việc báo cáo và bảo trì.
- [X] Global `PlayerProvider` quản lý trạng thái phát nhạc toàn cục.
- [X] Logic nâng cao: **Hàng đợi (Queue)**, **Lịch sử (History 16 bài)**, **Trộn bài (Shuffle)**, **Lặp bài (Repeat)**.
- [X] Điều khiển Native: Thanh Progress và Volume sử dụng input range mượt mà.

### 3. Quản Lý Thư Viện & Playlist

- [X] Quét file và thư mục nhạc cục bộ.
- [X] Trích xuất Metadata (Tiêu đề, Nghệ sĩ, Album, Ảnh bìa).
- [X] Playlist CRUD: Tạo, Sửa tên, Xóa playlist.
- [X] Tương tác danh sách: Click bài hát để phát, Menu ngữ cảnh chuyên sâu.

### 4. Giao diện Desktop (UI/UX)

- [X] Layout Spotify-style (Sidebar + Main Content).
- [X] Sidebar co giãn (Collapsible) và Responsive.
- [X] **Độ ổn định Sidebar**: Cố định kích thước (280px) và tối ưu hiệu năng (React.memo) để triệt tiêu hiện tượng giật lag khi chuyển trang.
- [X] Thanh PlayerBar với giao diện Queue Panel nổi (Popover).
- [X] Chuyển đổi toàn bộ sang SCSS với hệ thống Design Tokens.
- [X] **Bộ lọc nghệ sĩ cao cấp**: Hỗ trợ lọc đa lựa chọn (AND logic), bóc tách chính xác nghệ sĩ kết hợp (ft, feat...) và nhấn để lọc (Click-to-filter).
- [X] **Giao diện Filter Tag**: Thiết kế Glassmorphism hiện đại với hệ thống thẻ tag thông minh.
- [X] **Hệ thống màu Semantic (Semantic Color System)**: Loại bỏ hoàn toàn màu hard-code, chuyển sang hệ thống biến trung tâm giúp hỗ trợ 6 chủ đề (Midnight, Amoled, Nord, Rose, Ocean, Tame Snow) một cách đồng bộ.
- [X] **Tải xuống trực tuyến (Online Download)**: Tích hợp yt-dlp & FFmpeg, hỗ trợ tự động import, kiểm tra trùng lặp và dọn dẹp file rác.
- [X] **Standalone yt-dlp Integration**: Loại bỏ hoàn toàn phụ thuộc vào Python bằng binary độc lập và cơ chế tự động tìm đường dẫn trong môi trường asar/unpacked.
- [X] **Xử lý tệp mồ côi (Orphaned Files Handling)**: Tự động bỏ qua bài hát mất file (Auto-skip) và công cụ quét/dọn dẹp thư viện (Library Cleanup Tool).
- [X] **Biên tập Metadata (ID3 Tags)**: Hỗ trợ ghi đè thông tin bài hát (Tags) trực tiếp vào file vật lý (.mp3...).
- [X] **Kiến trúc Context Splitting (Surgical Re-renders)**: Tái cấu trúc `LibraryProvider` thành mô hình Đa ngữ cảnh, triệt tiêu re-render dư thừa, tối ưu CPU/RAM khi xử lý thư viện lớn.
- [X] **Optimistic Metadata Sync (Zero Latency)**: Cơ chế cập nhật lạc quan kèm Auto-Rollback giúp UI phản hồi tức thì (<16ms) khi chỉnh sửa lyricId/metadata.
- [X] **Window Virtualization Engine**: Nâng cấp ảo hóa danh sách dựa trên Window scroll, hỗ trợ cuộn mượt mà 60fps với Playlist 5000+ bài hát.
- [X] **Premium UI/UX Polish**: Thiết kế trà viền (Edge-to-edge), Sticky Header với hiệu ứng Elevation (Shadow/Border) và Opacity solid chuyên nghiệp.

---

## 🚀 Kế Hoạch Tiếp Theo (Sắp xếp theo Thứ tự Ưu tiên)

### 🔴 GIAI ĐOẠN 1: Hoàn thiện MVP (Mức độ ưu tiên CAO)

Mục tiêu: Đảm bảo người dùng có thể sử dụng hàng ngày ổn định.

- [X] **Tìm kiếm toàn cục (Global Search Overlay)**: Thanh công cụ ở Header để tìm kiếm nhanh Song, Artist, Album với giao diện Pop-up.
- [X] **Lọc & Sắp xếp Playlist (Sidebar)**: Một nút duy nhất mở Pop-up quản lý tìm kiếm và sắp xếp Playlist (A-Z, Z-A, Default).
- [X] **Lưu trữ trạng thái (Persistence)**: Tự động lưu lại Queue và History khi tắt/mở app (Đã tích hợp AsyncStorage/ElectronStore).
- [X] **Sắp xếp mặc định (A-Z Sort)**: Danh sách bài hát luôn được sắp xếp theo bảng chữ cái từ A-Z.
- [X] **Bộ lọc & Sắp xếp nâng cao (Filter/Sort)**: (Tùy chọn) Thêm bộ lọc theo thời lượng hoặc ngày thêm trong tương lai.

### 🟡 GIAI ĐOẠN 2: Tối ưu & Chức năng Phụ (Mức độ ưu tiên TRUNG BÌNH)

Mục tiêu: Tăng tính tiện dụng và khả năng tùy biến.

- [X] **Cài đặt hệ thống (Settings)**: Lựa chọn thiết bị đầu ra âm thanh (Ngôn ngữ đã có trong Profile).
- [X] **Quản lý Hàng đợi nâng cao**: Kéo thả để thay đổi thứ tự ngay trong Queue Panel.
- [X] **Global Hotkeys**: Tích hợp hệ thống phím tắt điều hướng toàn cục (Space, Mũi tên, Shift+N/P, /, Esc). Xây dựng cơ chế Guard Clause bảo vệ các ô input/textarea khỏi tình trạng nhận nhầm phím.
- [X] Multi-level Profile Menu (Sub-menus support)

### 3. Debugging & QA

- [X] **Debug Playback Mapping**: Đồng bộ index của PlayListDetailPage với PlayerProvider. (Đã sửa lỗi chọn sai bài hát khi dùng danh sách đã sắp xếp).
- [X] **Hydration Synchronization**: Khắc phục lỗi không phát được nhạc khi khôi phục bài hát từ app khởi động thông qua cơ chế Just-in-Time Loading.
- [X] **Volume Control**: Khắc phục lỗi mất giá trị âm lượng khi Tắt/Mở tiếng (Mute/Unmute).
- [X] **Metadata Cover Fix**: Khắc phục lỗi không hiển thị ảnh bìa song trong PlayerBar khi đọc từ Metadata phức tạp.

### 🟢 GIAI ĐOẠN 3: Làm đẹp & Trải nghiệm Nâng cao (Mức độ ưu tiên THẤP)

Mục tiêu: "Wow" người dùng bằng các tính năng cao cấp.

- [X] **Chủ đề (Themes)**: Hệ thống 6 chủ đề cao cấp (Dark/Light/Nature) với cơ chế Semantic Variable hoàn chỉnh.
- [X] **Chủ đề (Themes)**: Hệ thống 6 chủ đề cao cấp (Dark/Light/Nature) với cơ chế Semantic Variable hoàn chỉnh.
- [X] **Lịch sử tìm kiếm (Recent Searches)**: Lưu và hiển thị các tìm kiếm gần đây (Query & Entities).

### 🟣 GIAI ĐOẠN 4: Chuyên sâu & Cá nhân hóa (Quản lý File)

Mục tiêu: Cung cấp các công cụ mạnh mẽ để quản lý và thưởng thức nhạc.

- [X] **Tải xuống trực tuyến (Online Download)**: Hỗ trợ tải nhạc từ các nguồn online để sử dụng offline.
- [X] **Lời bài hát (Lyrics)**: Tự động tìm kiếm và hiển thị lời bài hát (Local hoặc Online).
- [X] **Biên tập Metadata (Ghi vào file nhạc)**: Hỗ trợ ghi đè trực tiếp ID3 tags vào file vật lý (.mp3, .flac...).
- [X] **Multi-level Profile Menu**: Nâng cấp Header Profile Menu sang kiến trúc Drill-down (đa cấp). Khắc phục triệt để lỗi tràn layout (text wrap, overflow icon) và tối ưu chiều cao động (dynamic height), tuân thủ 100% hệ thống CSS Variables.

### 🔵 GIAI ĐOẠN 5: Triển khai Mobile (Transform)

Mục tiêu: Đưa trải nghiệm lên các nền tảng di động.

- [/] **React Native Mobile App**: Xây dựng ứng dụng mobile dựa trên các UseCases/Hooks đã có (Đã xong Core Integration & Layout).

- [ ] **Hiệu ứng âm thanh (Audio FX)**: Bộ chỉnh âm (Equalizer), Visualizer (Sóng nhạc).
- [ ] **Đồng bộ hóa (Sync)**: (Tùy chọn) Đồng bộ playlist và sở thích giữa Desktop & Mobile.

---

### ⚪ HẠNG MỤC MỞ RỘNG (Optional - Thấp nhất)

- [ ] **Trang Hồ sơ Nghệ sĩ (Artist Profile)**: Hiển thị các bài hát, album và thông tin chi tiết của từng nghệ sĩ.

---

## 🧪 Hệ Thống Kiểm Thử (Testing - NEW)

Mục tiêu: Bảo vệ logic dự án bằng Unit Test toàn diện (Full Coverage).

### 1. @music/core (Logic Lõi)

- [X] **Mutex**: Quản lý hàng đợi và an toàn ghi dữ liệu (100% Coverage)
- [X] **LibraryService**:
  - [X] Phát hiện trùng lặp (Path, Hash, Metadata, URL)
  - [X] Quản lý bài hát (Thêm, Xóa, Cập nhật)
  - [X] Quản lý Playlist (Tạo, Xóa, Thêm/Bớt bài hát)
- [X] **UseCases**: Các lớp nghiệp vụ bọc ngoài LibraryService (100% Coverage)

### 2. @music/utils (Tiện ích dùng chung)

- [X] **formatTime**: Định dạng mm:ss (100% Coverage)
- [X] **splitArtists**: Tách danh sách nghệ sĩ (100% Coverage)
- [X] **youtube**: Trích xuất ID & URL YouTube (100% Coverage)

### 3. @music/player (Trình phát nhạc)

- [X] **AudioEngine**: Logic điều khiển âm thanh & Queue management (100% Coverage)

### 4. @music/hooks (React Hooks & State)

- [X] **YoutubeDownloader**: Logic trích xuất thông tin, tải audio và phân giải đường dẫn binary (100% Coverage)
- [X] **LibraryProvider** & **PlayerProvider**: Đồng bộ trạng thái UI (100% Coverage)

---

> [!TIP]
> File này sẽ được cập nhật thường xuyên để theo dõi tiến độ dự án. Hãy tham khảo `README.md` để biết thêm chi tiết kỹ thuật.

# Melovista Project Roadmap & Task Tracker 🎵

Bản kế hoạch tổng thể cho dự án Melovista - Ưu tiên hoàn thiện Desktop App (MVP -> Tối ưu -> Làm đẹp -> Mobile).

---

## ✅ Đã Hoàn Thành (Accomplishments)

### 1. Kiến Trúc Cốt Lõi (Core Architecture)

- [x] Thiết lập cấu trúc Monorepo (`/apps`, `/packages`).
- [x] Tích hợp Electron + Vite + React (Desktop).
- [x] Hệ thống IPC Bridge bảo mật giữa Process chính và Renderer.
- [x] Đa ngôn ngữ (i18n) toàn diện: Tiếng Anh & Tiếng Việt (100% UI Coverage).
- [x] Phân tách kiến trúc rõ ràng (Separation of Concerns): Sử dụng Barrel files (`index.ts`) và cô lập React Hooks ra khỏi Presentation UI.
- [x] Hệ thống thông báo (Global Notifications).
- [x] Quản lý Bảo mật (Dynamic CSP) điều khiển bởi Main Process.

### 2. Trình Phát Nhạc & Audio Engine

- [x] Tích hợp `howler.js` cho việc giải mã âm thanh hiệu năng cao.
- [x] Protocol tùy chỉnh `melovista://` để stream file nội bộ an toàn.
  - [x] **Vân tay âm thanh Perceptual (Guard 3 - v2)**:
    - [x] Nâng cấp thuật toán Hashing dựa trên **Energy-Envelope (16kHz, Mono)**, giúp nhận diện bài hát chính xác bất chấp sự khác biệt về bitrate (128kbps vs 320kbps).
    - [x] Triển khai **Fuzzy Sliding Window Matching**: Kết hợp thuật toán trượt (-10 to +10) và đối chiếu khoảng cách **ASCII Fuzzy** để tolerate sai lệch do nén audio (compression jitter).
    - [x] Hoàn tất tiến trình **Background Migration** để nâng cấp toàn bộ thư viện cũ sang chuẩn mã Hash v2 một cách tự động.
  - [x] **Xác minh & Tài liệu hóa**:
    - [x] Nhúng metadata định danh (`origin_id`, `source_url`) trực tiếp vào tag `TXXX` của file MP3 khi tải về.
    - [x] Xây dựng bộ sưu tập 13+ script kiểm thử thủ công tại `tests/manual-verification/` phục vụ cho việc báo cáo và bảo trì.
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
- [x] **Độ ổn định Sidebar**: Cố định kích thước (280px) và tối ưu hiệu năng (React.memo) để triệt tiêu hiện tượng giật lag khi chuyển trang.
- [x] Thanh PlayerBar với giao diện Queue Panel nổi (Popover).
- [x] Chuyển đổi toàn bộ sang SCSS với hệ thống Design Tokens.
- [x] **Bộ lọc nghệ sĩ cao cấp**: Hỗ trợ lọc đa lựa chọn (AND logic), bóc tách chính xác nghệ sĩ kết hợp (ft, feat...) và nhấn để lọc (Click-to-filter).
- [x] **Giao diện Filter Tag**: Thiết kế Glassmorphism hiện đại với hệ thống thẻ tag thông minh.
- [x] **Hệ thống màu Semantic (Semantic Color System)**: Loại bỏ hoàn toàn màu hard-code, chuyển sang hệ thống biến trung tâm giúp hỗ trợ 6 chủ đề (Midnight, Amoled, Nord, Rose, Ocean, Tame Snow) một cách đồng bộ.
- [x] **Tải xuống trực tuyến (Online Download)**: Tích hợp yt-dlp & FFmpeg, hỗ trợ tự động import, kiểm tra trùng lặp và dọn dẹp file rác.
- [x] **Standalone yt-dlp Integration**: Loại bỏ hoàn toàn phụ thuộc vào Python bằng binary độc lập và cơ chế tự động tìm đường dẫn trong môi trường asar/unpacked.
- [x] **Xử lý tệp mồ côi (Orphaned Files Handling)**: Tự động bỏ qua bài hát mất file (Auto-skip) và công cụ quét/dọn dẹp thư viện (Library Cleanup Tool).
- [x] **Biên tập Metadata (ID3 Tags)**: Hỗ trợ ghi đè thông tin bài hát (Tags) trực tiếp vào file vật lý (.mp3...).
- [x] **Kiến trúc Context Splitting (Surgical Re-renders)**: Tái cấu trúc `LibraryProvider` thành mô hình Đa ngữ cảnh, triệt tiêu re-render dư thừa, tối ưu CPU/RAM khi xử lý thư viện lớn.
- [x] **Optimistic Metadata Sync (Zero Latency)**: Cơ chế cập nhật lạc quan kèm Auto-Rollback giúp UI phản hồi tức thì (<16ms) khi chỉnh sửa lyricId/metadata.
- [x] **Window Virtualization Engine**: Nâng cấp ảo hóa danh sách dựa trên Window scroll, hỗ trợ cuộn mượt mà 60fps với Playlist 5000+ bài hát.
- [x] **Premium UI/UX Polish**: Thiết kế trà viền (Edge-to-edge), Sticky Header với hiệu ứng Elevation (Shadow/Border) và Opacity solid chuyên nghiệp.
- [x] Hệ thống **Logging & Diagnostic Tracing**:
  - [x] Kết nối `electron-log` toàn cục cho cả Downloader và Updater.
  - [x] Hợp nhất thư mục log vào chung thư mục dữ liệu hệ thống (`%AppData%/melovista-desktop/logs/main.log`).
  - [x] Kích hoạt ghi log file trong Production (`info` level) và cơ chế tự động bắt lỗi toàn cục (`log.errorHandler`).
  - [x] Cơ chế **Production Log Stripping**: Sử dụng Oxc/Rolldown để loại bỏ hoàn toàn `console.log` trong bản build chính thức.
- [x] **Architectural Refactor (V2)**: Chuyển đổi sang kiến trúc Context/Provider tách biệt, bóc tách logic vào các hooks chuyên biệt và tối ưu hóa vòng đời state.
- [x] **Hợp nhất Utility (Core Consolidation)**: Tập trung hóa các logic nghiệp vụ lõi (YouTube, Artists, Lyrics) vào `@music/core` và chuẩn hóa export cho toàn bộ monorepo.
- [x] **Theo dõi lịch sử đồng bộ (Sync History)**: Triển khai `SyncHistoryService` và giao diện Modal tra cứu lịch sử giúp minh bạch hóa các sự kiện và lỗi khi quét thư viện.
- [x] **Production-Ready Downloader (V3 Architecture)**:
  - [x] Loại bỏ hoàn toàn wrapper `youtube-dl-exec` để sử dụng `spawn` thuần túy, triệt tiêu lỗi treo bộ đệm (deadlock).
  - [x] Triển khai **Kill Switch (20s Timeout)** cho tiến trình trích xuất thông tin nhạc.
  - [x] Fix lỗi Shell Lexer (cắt chuỗi URL có ký tự `&`) và xử lý đường dẫn chứa khoảng trắng an toàn.
  - [x] Đảm bảo binary `yt-dlp` và `ffmpeg` luôn được phân giải đúng đường dẫn `asar.unpacked`.
- [x] **Auto-Update Stabilization**:
  - [x] Chuyển đổi sang cơ chế **Broadcast** sự kiện cập nhật đến tất cả cửa sổ thay vì phụ thuộc vào một window reference duy nhất.
  - [x] Bổ sung log vết chi tiết cho toàn bộ vòng đời cập nhật ứng dụng.
- [x] **Release Pipeline Hardening**: Cập nhật script `deploy.js` với cơ chế `taskkill` triệt để, ngăn chặn lỗi "Access is denied" do file bị khóa khi đóng gói.
- [x] **Concurrency Protection**: Cơ chế khóa đường dẫn đang xử lý (Locking Path) với thời gian chờ 5 giây để bảo vệ tính toàn vẹn của thư viện trong các thao tác nạp dữ liệu song song.
- [x] **SongRow UX Refactoring**: Đồng bộ hóa logic click (Title/Index) cho việc phát nhạc tiêu chuẩn và Click Row cho chế độ chọn multi-select chuyên nghiệp.
- [x] **Bulk Actions Stability (Zero-Shift Architecture)**: Triển khai thanh tác vụ hàng loạt thông qua React Portal và Flexbox Wrapper (Scrollbar-trap safe), triệt tiêu hoàn toàn hiện tượng "nhảy" layout khi hiển thị.
- [x] **Visual Ordering Engine**: Cơ chế bóc tách và sắp xếp bài hát theo thứ tự hiển thị (Top-to-bottom) khi thực hiện các thao tác hàng loạt (Add to Queue), bất kể thứ tự người dùng click chọn.
- [x] **Ephemeral Hint (Lyrics Panel)**: Cơ chế hiển thị tạm thời (5 giây) cho các nút chức năng ẩn để tăng khả năng khám phá tính năng cho người dùng mới.
- [x] **Downloader & Cleanup Hardening (V4)**:
  - [x] Đồng bộ cấu trúc Settings Downloads: Chuyển đổi sang `downloadPath`, `bitrate` và `autoImportPaths` chuẩn theo kiến trúc hệ thống.
  - [x] Nâng cấp **Library Cleanup**: Tích hợp API `scanMissingFiles` chuyên dụng, hỗ trợ quét file lỗi nhanh và giao diện dọn dẹp hàng loạt chuyên nghiệp qua `CleanupResolutionModal`.
  - [x] Khắc phục xung đột CSS: Loại bỏ các định dạng trùng lặp, đảm bảo giao diện "pixel-perfect" cho mục Online Downloader trong Settings.
  - [x] Sửa lỗi TypeScript nghiêm trọng liên quan đến kiểu dữ liệu `duration` (number | undefined) trong `DownloaderModal`.
- [x] **Notification System Refactoring (AppNotification)**: Chuyển đổi sang kiến trúc `AppNotification` để triệt tiêu xung đột với Browser API, tích hợp cơ chế cập nhật thông báo theo ID và hỗ trợ Actionable Toasts (Click-to-action).
- [x] **Delayed Library Sync (Silent Startup)**: Tự động quét và sửa lỗi thư viện sau 60 giây khởi động (Startup Delay) thông qua thông báo tương tác, không gây gián đoạn trải nghiệm người dùng ban đầu.
- [x] **Theme System Hardening (Zero-Ghost Architecture)**: Loại bỏ hoàn toàn 62+ biến CSS "ma" (Ghost Variables), chuẩn hóa hệ thống biến RGB cho tất cả 6 chủ đề, đảm bảo tính nhất quán tuyệt đối cho các hiệu ứng Glassmorphism.
- [x] **Smart Intent Search Engine (V5 Hardening)**:
  - [x] Triển khai **Smart Intent Detection**: Tự động phân biệt tìm kiếm có dấu (nghiêm ngặt) và không dấu (mờ), giải quyết triệt để lỗi gõ "nơi" ra "nói".
  - [x] **Fuse.js Location-Agnostic Scoring**: Tắt hình phạt vị trí (ignoreLocation) giúp tìm kiếm chính xác các bài hát có tiêu đề dài từ YouTube.
  - [x] **React Key Collision Guard**: Chuẩn hóa logic tạo ID thực thể (Album/Artist) dựa trên cặp Name-Artist, triệt tiêu lỗi trùng lặp key trong Search Overlay.
  - [x] **Search Observability**: Tiêm hệ thống Trace Logs (`[DEBUG-SEARCH]`) giúp theo dõi luồng dữ liệu tìm kiếm thời gian thực.
  - [x] **UX Search Hardening**: Tích hợp trạng thái `isSearching` vào `useDebounce` để xử lý Race Condition, hiển thị Spinner và Empty State ("Không tìm thấy") một cách minh bạch.
- [x] **Lyric Synchronization & Precision Control**:
  - [x] Hệ thống điều chỉnh offset đa cấp (±1s, ±5s) với giao diện Soft UI toolbar.
  - [x] Tính năng **Sync Now (One-click Alignment)**: Tự động tính toán và khớp tức thì câu hát được chọn với thời điểm bài hát đang phát.
  - [x] Cơ chế **Persistent Lyric Offset**: Tự động lưu và khôi phục độ lệch lời bài hát theo `youtubeId` (`originId`) thông qua `localStorage`.
  - [x] Tối ưu hiển thị: Ẩn bảng điều khiển khi không tương tác (Hover-only) và cơ chế Slide-in giúp không chiếm dụng không gian hiển thị của lời bài hát.
- [x] **Downloader Modal UX Hardening**:
  - [x] Khắc phục lỗi "Premature Reset": Sử dụng `useRef` (`prevIsOpen`) để đảm bảo modal chỉ làm mới dữ liệu khi thực sự được mở lại bởi người dùng.
  - [x] Cơ chế **Auto-Cleanup on Edit**: Tự động dọn dẹp trạng thái lỗi/cũ ngay khi người dùng chỉnh sửa URL trong ô nhập liệu.
- [x] **Downloader UI Standardization (V5)**:
  - [x] Đồng bộ hóa giao diện thẻ xem trước (`DownloadPreviewCard`) trên toàn bộ ứng dụng, bổ sung thanh tiến trình và các chỉ báo trạng thái trực quan (Check, Spinner, Clock).
  - [x] Bổ sung đầy đủ các khóa đa ngôn ngữ (i18n) cho trạng thái tải (`success`, `downloading`), khắc phục triệt để lỗi hiển thị Literal Key trên UI.
  - [x] Triển khai chế độ **Bulk Metadata Edit**: Hỗ trợ chỉnh sửa đồng loạt Nghệ sĩ và Album cho danh sách phát, tự động điền dữ liệu thông minh và tối ưu hóa diện tích hiển thị.
  - [x] Khóa tương tác chỉnh sửa khi đang tải để đảm bảo an toàn dữ liệu và tính nhất quán của ID3 Tags.
- [x] **i18n & Developer Experience Hardening**:
  - [x] Loại bỏ hoàn toàn các **Ghost i18n Keys** (enqueued, viewHistory...) và đạt trạng thái "Zero Ghost Key" cho toàn bộ Renderer Process.
  - [x] Xây dựng bộ công cụ Diagnostic: Viết mới `check-i18n-keys.js` và nâng cấp `ghost-css-variables.js` với giao diện báo cáo chuyên nghiệp, hỗ trợ phát hiện tài nguyên dư thừa (Unused detection).
  - [x] Nâng cấp Translation Sync Checker: Cấu hình tương thích Monorepo cho script i18n và phát triển thuật toán đối chiếu chéo (Cross-matching) để triệt tiêu lỗi lệch pha ngôn ngữ giữa Tiếng Việt và Tiếng Anh.
- [x] **UI/UX Polish & Stability (Zero-Flash Architecture)**:
  - [x] Triệt tiêu lỗi **UI Flash** tại `LyricsPanel`: Thay thế animation `fadeIn` bằng `transition` mượt mà và mặc định ẩn các phím chức năng khi mount.
  - [x] Tối ưu khởi động: Loại bỏ dòng chữ "Loading Settings..." gây chớp màn hình, mang lại trải nghiệm mở app tức thì.
  - [x] **Download UI Polishing**: Tự động mở rộng tag album khi không có badge trạng thái, rút gọn tiêu đề modal quá dài và chuẩn hóa vị trí các mục cài đặt.
  - [x] **i18n Coverage Audit**: Rà soát và chuyển đổi 100% các đoạn text thuần sang hàm `t()`, đảm bảo tính đa ngôn ngữ tuyệt đối.
  - [x] **Full Test & Build Stabilization**: Khắc phục triệt để lỗi logic trong bộ test Sidebar/PlayerBar và giải quyết các lỗi biên dịch TS nghiêm trọng, đảm bảo dự án luôn trong trạng thái "Build-Ready".
- [x] **Hiệu ứng & Phân tích Âm thanh (Audio FX)**: Triển khai hệ thống Peak Meter (đo cường độ sóng âm thời gian thực theo chuẩn dBFS) và công cụ Test Sound trực tiếp trong Cài đặt.
- [x] **Hệ thống Xác thực (Hybrid Auth)**: Tích hợp luồng đăng nhập YouTube (`YouTubeAuthService`) để xử lý và tải các luồng âm thanh bị giới hạn độ tuổi.
- [x] **Cơ chế Hàng đợi Tải xuống (Queue-based Download)**: Tích hợp xử lý tải đồng thời (Concurrent Processing) và batch processing tải hàng loạt bài hát từ Playlist.
- [x] **Tách Bạch Logic Tải Video vs Danh Sách Phát (Mode Selection)**: Tái cấu trúc cơ chế phân tích URL dựa trên `URLSearchParams`, tự động phát hiện đường dẫn hỗn hợp (v+list). Cung cấp giao diện Action Buttons liền mạch (Inline UX) ngay tại `DownloaderModal` và `SettingsSection` mà không gây nghẽn luồng người dùng.
- [x] **Tách God Components**: Phân rã triệt để kiến trúc của `Header` và `SearchOverlay` thành các Modular Hooks và UI sub-components tách biệt theo chuẩn TDD.
- [x] **Quản trị Hệ thống Cập nhật (Updater UI)**: Tích hợp giao diện quản lý Cập nhật tự động (Toggle Auto-Update) và kiểm tra thủ công (Manual Check) với hiệu ứng phản hồi trực quan ngay trong trang Cài đặt Chung.

---

## 🚀 Kế Hoạch Tiếp Theo (Sắp xếp theo Thứ tự Ưu tiên)

### 🔴 GIAI ĐOẠN 1: Hoàn thiện MVP (Mức độ ưu tiên CAO)

Mục tiêu: Đảm bảo người dùng có thể sử dụng hàng ngày ổn định.

- [x] **Tìm kiếm toàn cục (Global Search Overlay)**: Thanh công cụ ở Header để tìm kiếm nhanh Song, Artist, Album với giao diện Pop-up.
- [x] **Lọc & Sắp xếp Playlist (Sidebar)**: Một nút duy nhất mở Pop-up quản lý tìm kiếm và sắp xếp Playlist (A-Z, Z-A, Default).
- [x] **Lưu trữ trạng thái (Persistence)**: Tự động lưu lại Queue và History khi tắt/mở app (Đã tích hợp AsyncStorage/ElectronStore).
- [x] **Sắp xếp mặc định (A-Z Sort)**: Danh sách bài hát luôn được sắp xếp theo bảng chữ cái từ A-Z.
- [x] **Tuyệt đối ổn định IPC**: Các backend adapter lưu trữ (Cài đặt, Cấu hình) đã được route an toàn ra frontend.
- [x] **Chuẩn bị Build (Release Candidate 1)**: Đóng băng thay đổi UI, dọn dẹp import / refactor codebase sẵn sàng cho quá trình đóng gói bản build đầu tiên.
- [x] **Đóng gói Phát hành (Phiên bản 1.0.1)**: Khắc phục triệt để lỗi biên dịch TypeScript đa module, định cấu hình chuẩn `electron-builder` (`author`, `description`, loại bỏ carets versioning) đảm bảo đóng gói thành công file EXE trên Windows.

### 🟡 GIAI ĐOẠN 2: Tối ưu & Chức năng Phụ (Mức độ ưu tiên TRUNG BÌNH)

Mục tiêu: Tăng tính tiện dụng và khả năng tùy biến.

- [x] **Cài đặt hệ thống toàn diện (Settings)**: Giao diện trực quan tích hợp đa ngôn ngữ mạnh mẽ (General, Appearance, Audio, Downloads). Backend lưu trữ trạng thái tự động và an toàn.
- [x] **Quản lý Hàng đợi nâng cao**: Kéo thả để thay đổi thứ tự ngay trong Queue Panel.
- [x] **Global Hotkeys**: Tích hợp hệ thống phím tắt điều hướng toàn cục (Space, Mũi tên, Shift+N/P, /, Esc). Xây dựng cơ chế Guard Clause bảo vệ các ô input/textarea khỏi tình trạng nhận nhầm phím.
- [x] Multi-level Profile Menu (Sub-menus support)
- [x] **Release Pipeline (Automated Deploy)**: Tích hợp script `deploy.js` giúp tự động tăng version, commit code và kích hoạt tiến trình đóng gói bản release chỉ với một lệnh `npm run deploy`.

### 3. Debugging & QA

- [x] **Debug Playback Mapping**: Đồng bộ index của PlayListDetailPage với PlayerProvider. (Đã sửa lỗi chọn sai bài hát khi dùng danh sách đã sắp xếp).
- [x] **Hydration Synchronization**: Khắc phục lỗi không phát được nhạc khi khôi phục bài hát từ app khởi động thông qua cơ chế Just-in-Time Loading.
- [x] **Volume Control**: Khắc phục lỗi mất giá trị âm lượng khi Tắt/Mở tiếng (Mute/Unmute).
- [x] **Metadata Cover Fix**: Khắc phục lỗi không hiển thị ảnh bìa song trong PlayerBar khi đọc từ Metadata phức tạp.
- [x] **FFmpeg ASAR Unpack Fix**: Giải quyết triệt để lỗi `ENOENT` khi thực thi FFmpeg trong bản build bằng cách giải nén binary ra `app.asar.unpacked` và đồng bộ hóa logic phân giải đường dẫn đa môi trường (Main/Worker).

### 🟢 GIAI ĐOẠN 3: Làm đẹp & Trải nghiệm Nâng cao (Mức độ ưu tiên THẤP)

Mục tiêu: "Wow" người dùng bằng các tính năng cao cấp.

- [x] **Chủ đề (Themes)**: Hệ thống 6 chủ đề cao cấp (Dark/Light/Nature) với cơ chế Semantic Variable hoàn chỉnh.
- [x] **Chủ đề (Themes)**: Hệ thống 6 chủ đề cao cấp (Dark/Light/Nature) với cơ chế Semantic Variable hoàn chỉnh.
- [x] **Lịch sử tìm kiếm (Recent Searches)**: Lưu và hiển thị các tìm kiếm gần đây (Query & Entities).

### 🟣 GIAI ĐOẠN 4: Chuyên sâu & Cá nhân hóa (Quản lý File)

Mục tiêu: Cung cấp các công cụ mạnh mẽ để quản lý và thưởng thức nhạc.

- [x] **Tải xuống trực tuyến (Online Download)**: Hỗ trợ tải nhạc từ các nguồn online để sử dụng offline.
- [x] **Lời bài hát (Lyrics)**: Tự động tìm kiếm và hiển thị lời bài hát (Local hoặc Online).
- [x] **Biên tập Metadata (Ghi vào file nhạc)**: Hỗ trợ ghi đè trực tiếp ID3 tags vào file vật lý (.mp3, .flac...).
- [x] **Multi-level Profile Menu**: Nâng cấp Header Profile Menu sang kiến trúc Drill-down (đa cấp). Khắc phục triệt để lỗi tràn layout (text wrap, overflow icon), tối ưu chiều cao động (dynamic height) và tích hợp chức năng Thoát an toàn (Quit) thông qua cầu nối IPC.

### 🔵 GIAI ĐOẠN 5: Tính Năng Mở Rộng (Future)

Mục tiêu: Bổ sung các trải nghiệm nâng cao và liên kết đám mây.

- [ ] **Bộ chỉnh âm nâng cao (Advanced Equalizer)**: Tính năng Equalizer và Visualizer chuyên sâu (Đã hoàn thành Peak Meter & Test Sound ở Phase trước).
- [ ] **Đồng bộ hóa (Sync)**: Đồng bộ hóa thư viện Playlist và cấu hình sở thích người dùng qua mạng/cloud.

### 📱 GIAI ĐOẠN 6: Melovista Mobile App (Expo)

Mục tiêu: Đưa trải nghiệm Melovista lên nền tảng di động (Offline-first).

- [x] **Core & Architecture**: Khởi tạo Expo app, cấu trúc Monorepo để tái sử dụng `@music/core`, cấu hình TypeScript/ESLint chặt chẽ.
- [x] **App Shell Parity**: Hệ thống Navigation đa tầng (Bottom Bar + Sidebar), đồng bộ Theme system (Dark/Light) và i18n với Desktop.
- [x] **Data Persistence**: Triển khai `MobileStorageAdapter` với `AsyncStorage` cho dữ liệu Library, Playlists, PlayerState.
- [x] **Trình phát Audio Engine**: Trừu tượng hóa `PlayerEngine` và triển khai tích hợp `expo-audio` để phát nhạc offline trơn tru.
- [x] **Quản lý Thư viện**: Tích hợp Document Picker cho phép người dùng import file MP3, quản lý Playlist (Tạo/Sửa/Xóa).
- [x] **Mobile UI/UX Refinement**: Giao diện Bottom Bar navigation, màn hình Search dạng Top Bar, Toggle Language dạng segmented animated, và các tinh chỉnh "pixel-perfect" giống hệ thống Desktop.
- [ ] **Phát nhạc dưới nền (Background Audio)**: Thiết lập EAS dev build để duy trì âm thanh khi đưa app vào Background.
- [ ] **Lock Screen Controls**: Cấu hình Media controls trực tiếp vào giao diện màn hình khóa (System UI) của thiết bị.

---

### ⚪ HẠNG MỤC MỞ RỘNG (Optional - Thấp nhất)

- [ ] **Trang Hồ sơ Nghệ sĩ (Artist Profile)**: Hiển thị các bài hát, album và thông tin chi tiết của từng nghệ sĩ.

---

## 🧪 Hệ Thống Kiểm Thử (Testing - NEW)

Mục tiêu: Bảo vệ logic dự án bằng Unit Test toàn diện (Full Coverage).

### 1. @music/core (Logic Lõi)

- [x] **Mutex**: Quản lý hàng đợi và an toàn ghi dữ liệu (100% Coverage)
- [x] **LibraryService**:
  - [x] Phát hiện trùng lặp (Path, Hash, Metadata, URL)
  - [x] Quản lý bài hát (Thêm, Xóa, Cập nhật)
  - [x] Quản lý Playlist (Tạo, Xóa, Thêm/Bớt bài hát)
- [x] **UseCases**: Các lớp nghiệp vụ bọc ngoài LibraryService (100% Coverage)
- [x] **Library Stability V3**: Triển khai cơ chế Mutex lock-out 5s và bỏ qua hash lỗi trong Guard 3, triệt tiêu hoàn toàn hiện tượng trùng lặp ảo (Ghost Duplication).
- [x] **Deduplication Engine V4**: Chuẩn hóa URL YouTube (loại bỏ tracking params) và triển khai bộ lọc thời lượng động (Proportional Tolerance 2%) giúp nhận diện chính xác các bản thu dài/mixtapes.
- [x] **Test Suite Stabilization**: Đồng bộ hóa bộ test core với logic ID động và dữ liệu kiểm thử chuẩn hóa, đạt 100% pass rate.

### 2. @music/utils (Tiện ích dùng chung)

- [x] **formatTime**: Định dạng mm:ss (100% Coverage)
- [x] **splitArtists**: Tách danh sách nghệ sĩ (100% Coverage)
- [x] **youtube**: Trích xuất ID & URL YouTube (100% Coverage)

### 3. @music/player (Trình phát nhạc)

- [x] **AudioEngine**: Logic điều khiển âm thanh & Queue management (100% Coverage)

### 4. @music/hooks (React Hooks & State)

- [x] **YoutubeDownloader**: Logic trích xuất thông tin, tải audio và phân giải đường dẫn binary (Đã sửa lỗi Production ENOENT & Shell Lexer) (100% Coverage)
- [x] **LibraryProvider** & **PlayerProvider**: Đồng bộ trạng thái UI (100% Coverage)

### 5. Presentations (Giao diện & Thành phần)

- [x] **CustomDropdown Component**: Thay thế toàn bộ `<select>` nguyên bản bằng kiến trúc Portal + ARIA accessibility (100% Coverage).
- [x] **Settings Page Ecosystem**: Chuẩn hóa toàn bộ logic và giao diện các mục General, Appearance, Audio, Downloads. Nâng cấp thiết kế màn hình About (tích hợp thực tế dữ liệu Môn học/Nhóm, gom nhóm tab Semester/Group thông minh), cơ chế Fallback Avatar và hoàn thiện đa ngôn ngữ (i18n).
- [x] **Centralized Testing Architecture**: Di chuyển toàn bộ Unit Test sang thư mục `src/tests/` tập trung, gương mẫu kiến trúc production.
- [x] **Search System TDD**:
  - [x] `searchUtils.test.ts`: Kiểm thử Smart Intent (Dấu tiếng Việt) và phân cụm bài hát.
  - [x] `SearchOverlay.test.tsx`: Kiểm thử giao diện hiển thị kết quả và trạng thái Empty State.
  - [x] `SongPickerModal.test.tsx` (Drafted): Đảm bảo logic lọc bài hát trong Modal.
- [x] **Linter & Code Smell Elimination**: Cấu hình lại `eslint.config.js` với `projectService` để sửa 200+ lỗi parsing ảo, khắc phục các vấn đề vi phạm React Hooks (`useLyricSync`, `TopBar`, `SidebarMenu`) và loại bỏ hoàn toàn các kiểu dữ liệu `any` nguy hiểm.

---

> [!TIP]
> File này sẽ được cập nhật thường xuyên để theo dõi tiến độ dự án. Hãy tham khảo `README.md` để biết thêm chi tiết kỹ thuật.

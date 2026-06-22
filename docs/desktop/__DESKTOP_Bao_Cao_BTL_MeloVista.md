# BÁO CÁO BÀI TẬP LỚN

*Dự án: MeloVista (Cross-Platform Music Player)*

## Sơ đồ kiến trúc

Nhóm phát triển đã thiết lập cấu trúc Monorepo (`/apps`, `/packages`) phân tách rõ ràng giữa Electron Main Process và Renderer Process. Hai tiến trình này giao tiếp an toàn thông qua hệ thống **IPC Bridge**. 

[CẦN CHÈN SƠ ĐỒ KIẾN TRÚC TỔNG THỂ TẠI ĐÂY]

Trong quá trình phát triển, dự án đã thay đổi định hướng kiến trúc so với kế hoạch ban đầu để tối ưu hóa hiệu năng, cụ thể:
- **Kiến trúc Downloader (Native Node.js):** Thay vì phụ thuộc vào thư viện wrapper `youtube-dl-exec` (đòi hỏi Python), dự án đã chuyển sang kiến trúc gọi trực tiếp tiến trình con (Child Process) thông qua `spawn` kết hợp với binary độc lập `yt-dlp`. Điều này giúp triệt tiêu hiện tượng deadlock (treo bộ đệm) và hỗ trợ xử lý đa luồng (Concurrent Processing) qua **Cơ chế hàng đợi Queue-based Download**.
- **Window Virtualization Engine:** Để xử lý thư viện lớn hơn 5000 bài hát, hệ thống chuyển từ việc render DOM tĩnh sang ảo hóa danh sách (Virtualization), giúp giao diện luôn duy trì ở 60fps.
- **Hệ thống Xác thực Hybrid (Hybrid Auth):** Triển khai luồng đăng nhập YouTube (`YouTubeAuthService`) trực tiếp tại Main Process để lấy credential, giúp ứng dụng vượt qua giới hạn độ tuổi và tải luồng âm thanh bị hạn chế mà không vi phạm chính sách bảo mật của Electron.
- **Tách "God Components":** Từ bỏ kiến trúc UI nguyên khối (như `Header` và `PlayerBar`), hệ thống áp dụng Context Splitting và Modular Hooks để phân rã giao diện thành các sub-components cực nhỏ, giảm thiểu Re-render diện rộng.

## Mô tả pattern

Dự án đã linh hoạt áp dụng nhiều Design Pattern nhằm giải quyết các bài toán nghiệp vụ phức tạp:

- **Command Pattern & Observer Pattern (Cơ chế Queue-based Download):** Được áp dụng trong `DownloadProvider`. Mỗi yêu cầu tải bài hát được đóng gói như một Command, đưa vào hàng đợi quản lý tiến trình đồng thời (max concurrent). Trạng thái tải về (Progress, Success, Error) được theo dõi (Observer) qua IPC Event và tự động cập nhật lên UI theo thời gian thực.
- **Strategy Pattern (Kiến trúc Downloader):** Quá trình trích xuất thông tin nhạc đối mặt với sự đa dạng của đầu vào (URL bài hát đơn lẻ hoặc URL danh sách phát Playlist). Thay vì sử dụng khối lệnh `if-else` phức tạp để bóc tách dữ liệu, dự án áp dụng Strategy Pattern:
  - **Context:** Hàm `fetchInfo` đóng vai trò làm bối cảnh (Context), chịu trách nhiệm phân tích nhanh cấu trúc URL đầu vào (ví dụ: tìm tham số `list=`).
  - **Hoán đổi Chiến lược (Strategy Selection):** Nếu phát hiện Playlist, Context tự động ủy quyền cho chiến lược `fetchPlaylistInfo` (sử dụng cờ `--flat-playlist` để quét siêu tốc hàng chục bài hát mà không tốn băng thông tải nội dung). Nếu là bài hát đơn, hệ thống chuyển sang chiến lược `fetchYtInfo` (tập trung trích xuất sâu metadata và thực hiện đối chiếu kiểm tra trùng lặp cục bộ).
  - Kiến trúc này giúp mã nguồn tuân thủ chặt chẽ nguyên tắc OCP. Trong tương lai, việc hỗ trợ nền tảng mới (SoundCloud, Spotify) chỉ đơn giản là tạo ra các class/function Chiến lược mới mà không làm thay đổi hay phá vỡ luồng cốt lõi.
- **State Pattern (Quản lý Trạng thái Ứng dụng):** Mẫu thiết kế này cho phép hệ thống thay đổi hành vi khi trạng thái nội bộ thay đổi. Trong hệ sinh thái React/Electron của dự án, State Pattern đóng vai trò cốt lõi và được áp dụng ở nhiều cụm tính năng tiêu biểu:
  - **Hiệu ứng Âm thanh (Audio FX - Peak Meter):** Hành vi đo lường và hiển thị cường độ âm thanh thay đổi dựa vào State. Nếu `isPlaying` là true, Peak Meter phân tích tần số thực tế của bài hát. Nếu `isPlayingTest` là true, hệ thống kích hoạt Oscillator để tạo dải âm thanh kiểm thử giả lập. Nếu cường độ chạm ngưỡng (state `isClipping` = true), giao diện lập tức chuyển sang màu cảnh báo (đỏ).
  - **Máy trạng thái Downloader (Downloader State Machine):** Luồng tải xuống được kiểm soát nghiêm ngặt qua các State: `IDLE` -> `FETCHING` -> `PREVIEW` -> `DOWNLOADING` -> `SUCCESS`/`ERROR`. Dựa vào trạng thái hiện tại, giao diện sẽ quyết định hiển thị gì (Spinner, thẻ Preview, thanh Progress) và khóa/mở các quyền tương tác (ví dụ: cấm người dùng sửa đổi ID3 Tags khi state đang là `DOWNLOADING`).
  - **Audio Engine (Trình phát nhạc):** Các trạng thái `PLAYING`, `PAUSED`, `BUFFERING` không chỉ làm thay đổi icon trên thanh PlayerBar mà còn điều khiển cách lõi thư viện `howler.js` cấp phát hay giải phóng bộ nhớ (suspend/resume AudioContext).
- **Factory/Builder Pattern (Hệ thống Theme Engine):** Ứng dụng hỗ trợ 6 chủ đề giao diện đa dạng (Midnight, Amoled, Nord, Rose, Ocean, Tame Snow) với độ phức tạp cao do sử dụng hiệu ứng Glassmorphism (kính mờ). Để quản lý, hệ thống áp dụng mẫu Factory/Builder:
  - **Khởi tạo tập trung (Factory):** Thay vì để các UI Component tự quy định màu sắc bằng CSS tĩnh (điều thường gây ra lỗi "Ghost Variables"), `ThemeProvider` đóng vai trò như một "nhà máy" (Factory). Dựa trên tham số đầu vào (ví dụ: "Nord"), Factory sẽ tự động sản xuất và trả về toàn bộ bộ sưu tập các biến màu ngữ nghĩa (Semantic Color Variables) tương ứng.
  - **Lắp ráp đối tượng phức tạp (Builder):** Một chủ đề (Theme) không chỉ là một màu duy nhất, mà là một tập hợp hàng chục thông số gắn kết chặt chẽ (độ trong suốt của nền, màu bóng đổ shadow, viền border nổi). Mẫu thiết kế này đảm bảo toàn bộ các "token" thiết kế được cấu trúc chính xác trước khi tiêm (inject) đồng loạt vào thẻ `:root` của cây DOM.
  - Việc áp dụng mẫu này giúp các Component trở nên hoàn toàn "mù màu" (chỉ sử dụng biến số trung gian như `var(--bg-surface)`). Kiến trúc này tuân thủ tuyệt đối nguyên tắc Open/Closed Principle (OCP) – hệ thống có thể mở rộng thêm vô hạn chủ đề mới mà không phải sửa đổi bất kỳ dòng code UI nào.

## SOLID

Mã nguồn của MeloVista tuân thủ chặt chẽ nguyên tắc SOLID, đặc biệt trong việc tái cấu trúc các cụm chức năng cốt lõi:

- **Single Responsibility Principle (SRP - Nguyên tắc Đơn trách nhiệm):** Việc tách các "God Components" (như `Header`, `SearchOverlay`) là minh chứng rõ rệt nhất. Các UI được chia nhỏ với trách nhiệm duy nhất (VD: `DownloadPreviewCard` chỉ lo hiển thị giao diện xem trước, trong khi `YoutubeDownloader` hook chỉ tập trung xử lý trích xuất thông tin URL).
- **Open/Closed Principle (OCP - Nguyên tắc Đóng/Mở):** Hệ thống `AudioEngine` và `LibraryService` (core) được thiết kế mở để dễ dàng bổ sung các tính năng mới (như Bộ chỉnh âm nâng cao - Advanced Equalizer trong tương lai) mà không cần can thiệp vào logic phát nhạc cốt lõi hiện tại.
- **Dependency Inversion Principle (DIP - Nguyên tắc Đảo ngược Phụ thuộc):** Các lớp giao diện (Presentation) không phụ thuộc trực tiếp vào logic thao tác file (I/O, SQLite/JSON) mà phụ thuộc vào các Abstraction (Interface) được cung cấp thông qua Context và IPC Bridge (`window.electronAPI`).

## Test cases

[CẦN CHÈN BẢNG DANH SÁCH 15-25 TEST CASES TẠI ĐÂY]

Dự án chú trọng kiểm thử các phần lõi (Core Logic) với độ bao phủ (Coverage) cao, bao gồm:
- **Kiểm thử Service/Domain:** `LibraryService` (phát hiện trùng lặp hash/metadata/URL, quản lý bài hát, playlist) và `AudioEngine` đều được kiểm thử với Mock cho các truy xuất File I/O và Electron Storage.
- **Hệ thống Tooling/Diagnostic:** Kiểm thử các script dọn dẹp i18n keys rác và xóa file nhạc mồ côi (Orphaned Files).
- **Mock & TDD (Test-Driven Development):** Quá trình phân tách God Components được thực hiện nghiêm ngặt theo vòng lặp TDD (Test-Driven Development), đảm bảo kiến trúc mới chạy ổn định mà không phá vỡ logic cũ.

## Ảnh giao diện

[CẦN CHÈN CÁC ẢNH GIAO DIỆN CHÍNH TẠI ĐÂY]
- Ảnh Giao diện Danh sách phát nhạc (Sidebar, Playlist với Window Virtualization).
- Ảnh Giao diện Tải xuống (Downloader Modal với Queue-based Download).
- Ảnh Giao diện Cài đặt Âm thanh (Audio FX: Peak Meter & Test Sound).
- Ảnh Giao diện Hệ thống xác thực YouTube (Hybrid Auth).

## Hướng dẫn chạy dự án

1. **Yêu cầu môi trường:** 
   - Node.js (phiên bản phù hợp với Electron).
   - Package manager: `npm` hoặc `pnpm`.
2. **Cài đặt thư viện:**
   Chạy lệnh `npm install` tại thư mục gốc của monorepo.
3. **Khởi chạy Development:**
   Chạy lệnh `npm run dev` để khởi động đồng thời cả Electron Main Process và Vite Renderer.
4. **Đóng gói (Production):**
   Chạy lệnh `npm run build` (hoặc `deploy`) để đóng gói ứng dụng thành file `.exe` sử dụng `electron-builder`.

*Lưu ý: Môi trường yêu cầu tải xuống `yt-dlp` và `ffmpeg` (đã được tự động hóa qua script cục bộ của dự án) để đảm bảo tính năng Downloader hoạt động hoàn chỉnh.*

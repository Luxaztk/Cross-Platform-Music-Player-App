# Báo Cáo Phát Triển Ứng Dụng (Draft) - Dự Án MeloVista (MVP)

> **Lưu ý**: Dữ liệu được trích xuất hoàn toàn dựa trên thực tế từ mã nguồn (source code) của dự án. Không bao gồm các tính năng ngoài lề MVP.

---

## 1. Phân chia công việc chi tiết

### Bảng 1.2 & 13. Phân công công việc

| Thành viên | Vai trò | Module phụ trách (MVP) | Phạm vi Test Case phụ trách |
| :--- | :--- | :--- | :--- |
| **Thành viên A** | Lead Developer | - Tương tác Electron API (Infrastructure: `ElectronStorageAdapter`).<br>- Core logic Audio Player (`AudioEngine`).<br>- Tải/ghi metadata YouTube (`youtube.ts`, `YoutubeDownloader`).<br>- Tối ưu Virtualization cho Playlist lớn (`VirtualSongList.tsx`).<br>- Xử lý phục hồi UI (`ErrorBoundary`). | Đảm nhiệm phần lớn các test case logic phức tạp (10-15 cases) ở Core, Infrastructure, AudioEngine và Library Duplicate Detection. |
| **Thành viên B** | Developer | - Dựng UI Component Cấu hình (`SettingsPage`, `AudioSection`, `DownloadSection`).<br>- Quản lý state ngôn ngữ (`LanguageProvider`). | 3-5 cases (UI Settings render, Language context). |
| **Thành viên C** | Developer | - Dựng UI Overlay/Notification (`SearchOverlay`, `NotificationProvider`).<br>- Quản lý Hotkeys (`HotkeysModal`). | 3-5 cases (Trạng thái Empty của Search, Notification Queue). |
| **Thành viên D** | Developer | - Dựng Lyrics View (`LyricsPanel`).<br>- Quản lý logic chuỗi bài hát (`lyrics.ts`).<br>- CRUD danh sách phát (`PlaylistUseCases`, `SongUseCases`). | 3-5 cases (Use Cases cơ bản, parse/normalize ký tự Lyrics). |

---

## 2. Danh sách Test Case (Application/Infrastructure Layer)

### Bảng 9.3. Danh sách Test Case MVP

| TC ID | Tên test case | Layer | Hàm/Lớp được test | Kết quả mong đợi | Người phụ trách |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC01 | Extract ID from standard URLs | Infrastructure | `extractYoutubeId` | Lấy đúng ID 11 ký tự từ link chuẩn. | Thành viên A |
| TC02 | Return canonical URL for valid input | Infrastructure | `getCanonicalYoutubeUrl` | Trả về format link watch chuẩn. | Thành viên A |
| TC03 | Add a new song if no duplicates exist | Application | `LibraryService.processAndAddSongs` | Bài hát mới được lưu vào database. | Thành viên A |
| TC04 | Detect duplicate by Source URL | Application | `LibraryService` | Bỏ qua bài hát nếu URL đã tồn tại. | Thành viên A |
| TC05 | Detect duplicate by Title + Artist | Application | `LibraryService` | Phát hiện trùng bằng metadata cơ bản. | Thành viên A |
| TC06 | Match Vietnamese titles with accents | Application | `LibraryService` | Xử lý nhận dạng đúng tiếng Việt có dấu/chuẩn hóa. | Thành viên A |
| TC07 | Self-Match Guard for same File Path | Application | `LibraryService` | Cập nhật metadata thay vì xóa báo lỗi trùng lặp. | Thành viên A |
| TC08 | UpdateSongUseCase calls repository.updateSong | Application | `UpdateSongUseCase` | Gọi đúng phương thức update ở DB. | Thành viên D |
| TC09 | DeleteSongUseCase calls repository.deleteSong | Application | `DeleteSongUseCase` | Gọi đúng phương thức xóa ở DB. | Thành viên D |
| TC10 | CreatePlaylistUseCase calls repository | Application | `CreatePlaylistUseCase` | Gọi đúng phương thức tạo ở DB. | Thành viên D |
| TC11 | Core Functionality Tracking | Infrastructure | `AudioEngine` | Cập nhật chính xác tiến trình phát audio. | Thành viên A |
| TC12 | Normalize Vietnamese characters to NFC | Application | `lyrics.ts / normalizeNFC` | Trả về chuỗi NFC chuẩn cho Unicode tiếng Việt. | Thành viên D |
| TC13 | Replace feat. and ft. with & | Application | `lyrics.ts / formatLyricsSearchQuery` | Tách đúng chuẩn tên ca sĩ khi tìm lời. | Thành viên D |
| TC14 | SearchOverlay Empty State Test | Application | `SearchOverlay` | Hiển thị thông báo khi không có text/kết quả. | Thành viên C |
| TC15 | NotificationProvider render and state | Application | `NotificationProvider` | Hiển thị và tự động ẩn theo timeout. | Thành viên C |
| TC16 | GeneralSection Hardened Reactivity | Application | `GeneralSection` | Lắng nghe event update phiên bản từ main process. | Thành viên B |
| TC17 | AudioSection render and update | Application | `AudioSection` | State cấu hình âm thanh cập nhật tức thì. | Thành viên B |
| TC18 | DownloadSection behavior | Application | `DownloadSection` | Chọn đúng thư mục download qua electron API. | Thành viên B |

---

## 3. Code Smell & Refactoring

### Bảng 10.1 & 10.2. Refactoring & Code Smells

| Code smell / Vấn đề cũ | Vị trí file | Cách Refactoring | Kỹ thuật áp dụng |
| :--- | :--- | :--- | :--- |
| **Giật lag UI & Lỗi cuộn (Sticky Header)**: Khi Playlist có >5000 bài, render trực tiếp thẻ div gây quá tải DOM, giật lag, hỏng hiệu ứng cuộn. | `VirtualSongList.tsx`<br>`usePlaylistVirtualization.ts` | Triển khai Window Virtualization Engine. Chỉ render các item nằm trong viewport bằng toán học (transform translateY dựa vào scroll offset). | List Virtualization (Kỹ thuật Windowing / ảo hóa danh sách). |
| **Tight Coupling (Gắn chặt Framework)**: Gọi trực tiếp `window.electronAPI` dải rác khắp ứng dụng, khó viết mock test và không thể tái sử dụng core cho Web/Mobile. | `ElectronStorageAdapter.ts`<br>`SettingsProvider.tsx` | Đóng gói các lời gọi global object vào một Adapter class (`ElectronStorageAdapter`) triển khai interface `IStorageAdapter`. | Adapter Pattern / Dependency Injection (DI). |
| **Logic lặp lại (Duplication)**: Regex phân tích URL YouTube và tách ID rải rác nhiều nơi gây khó bảo trì khi YouTube đổi format. | `packages/core/src/utils/youtube.ts` | Gom các hàm xử lý regex chuỗi (e.g. `extractYoutubeId`) vào một file Utils riêng biệt (`youtube.ts`). | Extract Method / DRY (Don't Repeat Yourself). |

---

## 4. Thiết kế lớp / Module (SOLID)

Trích xuất 3 lớp/module trong hệ thống thể hiện rõ các nguyên lý thiết kế:

1. **SRP (Single Responsibility Principle) - Nguyên lý Đơn trách nhiệm**:
   - **Lớp/Module**: `packages/core/src/utils/youtube.ts` (các hàm như `extractYoutubeId`, `getCanonicalYoutubeUrl`).
   - **Mô tả hoạt động**: Module này chỉ có một lý do duy nhất để thay đổi: Cấu trúc URL của YouTube thay đổi. Nó hoàn toàn không quan tâm đến UI, cách lưu trữ DB hay mạng mẽo. Việc tách bạch logic xử lý regex này giúp test độc lập 100%.

2. **OCP (Open/Closed Principle) - Nguyên lý Đóng/Mở**:
   - **Lớp/Module**: `packages/core/src/usecases/SongUseCases.ts` & `PlaylistUseCases.ts`.
   - **Mô tả hoạt động**: Các Use Case đại diện cho business logic được cô lập. Khi có một tính năng mới (ví dụ: `ImportFolderUseCase`), ta chỉ cần viết thêm một class/hàm mới chứ không cần sửa đổi các hàm xử lý đã có trước đó (như `UpdateSongUseCase`). Mã nguồn mở rộng thoải mái nhưng đóng lại với các sửa đổi phá vỡ (breaking changes).

3. **DIP (Dependency Inversion Principle) - Nguyên lý Đảo ngược phụ thuộc**:
   - **Lớp/Module**: `apps/desktop/src/infrastructure/services/ElectronStorageAdapter.ts`.
   - **Mô tả hoạt động**: Core logic (ở `packages/core`) không trực tiếp gọi API của Electron hay localStorage. Thay vào đó, nó dựa vào một bản hợp đồng Interface là `IStorageAdapter`. Tầng Infrastructure (`ElectronStorageAdapter`) sẽ implement interface này. Nhờ vậy, core player không bị trói buộc với Desktop, hoàn toàn có thể chạy trên trình duyệt nếu ta viết một `WebStorageAdapter` khác.

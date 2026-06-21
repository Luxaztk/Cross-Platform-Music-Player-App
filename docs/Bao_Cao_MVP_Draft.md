# Báo Cáo Phát Triển Ứng Dụng (Draft) - Dự Án MeloVista (MVP)

> **Lưu ý**: Dữ liệu được trích xuất hoàn toàn dựa trên thực tế từ mã nguồn (source code) của dự án. Không bao gồm các tính năng ngoài lề MVP.
> Bản báo cáo này đã được cập nhật với trạng thái mới nhất của dự án, phản ánh đầy đủ quy trình Test-Driven Development (TDD) khắt khe và hệ thống kiến trúc Clean Architecture được áp dụng.

---

## 1. Phân chia công việc chi tiết

### Bảng 1.2 & 13. Phân công công việc

| Thành viên | Vai trò | Module phụ trách (MVP) | Phạm vi Test Case phụ trách |
| :--- | :--- | :--- | :--- |
| **Thành viên A** | Lead Developer | - Tương tác Electron API (`ElectronStorageAdapter`).<br>- Core logic Audio Player (`AudioEngine`).<br>- Tải/ghi metadata YouTube (`youtube.ts`).<br>- Xử lý phát hiện trùng lặp nâng cao (Duplicate Detection).<br>- Tối ưu Virtualization cho Playlist lớn. | Hơn 20 test cases logic cốt lõi tại `core` và `player`, đảm bảo tính ổn định của hệ thống nhận diện file, bắt lỗi audio và đồng bộ tiến trình. |
| **Thành viên B** | Developer | - Dựng UI Component Cấu hình (`SettingsPage`, `AppearanceSection`, `AudioSection`, `DownloadSection`, `GeneralSection`).<br>- Tích hợp màn hình About với hiệu ứng Glassmorphism & đa ngôn ngữ (i18n).<br>- Quản lý state ngôn ngữ và giao diện (`LanguageProvider`). | Phụ trách vòng lặp TDD (Test-Driven Development) khắt khe cho UI Settings, Reactivity Check và Language Context, bao phủ UI components. |
| **Thành viên C** | Developer | - Dựng UI Overlay/Notification (`SearchOverlay`, `Notification`, `DuplicateResolutionModal`).<br>- Quản lý Header, PlayerBar, và Sidebar. | Đảm nhận UI/UX Test Cases (Trạng thái Empty của Search, Notification Queue, PlayerBar interaction). |
| **Thành viên D** | Developer | - Dựng Lyrics View (`LyricsPanel`) & CRUD danh sách phát (`PlaylistUseCases`, `SongUseCases`).<br>- Components tương tác trực tiếp danh sách (`SongRow`, Modal Xóa/Sửa). | UI Component Tests và Unit Tests cho Lyrics, Use Cases cơ bản, parse/normalize ký tự tiếng Việt. |

---

## 2. Hệ Thống Kiểm Thử Khắt Khe (Vitest & React Testing Library)

Dự án áp dụng nguyên tắc **"Không Thỏa Hiệp" (Unforgiving Assertions)** trong Unit Testing. Bất kỳ UI Component hay Logic Module nào cũng phải tuân thủ chuẩn 100% Green Test không có lỗi TypeScript (Zero Red-squiggles).

### Bảng 9.3. Trích xuất Danh sách Test Case MVP (Core & UI)

| TC ID | Tên test case | Layer | Component / Hàm được test | Kết quả đạt được | Người phụ trách |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC01 | Detect duplicate by Perceptual Hash - Tiered Logic | Application | `LibraryService` | Phát hiện trùng lặp file âm thanh dựa trên thuật toán Hash và thời lượng (Dynamic Tolerance). | Thành viên A |
| TC02 | Match Vietnamese titles with accents | Application | `LibraryService` | Xử lý nhận dạng đúng metadata Tiếng Việt có dấu và chuẩn hóa Unicode. | Thành viên A |
| TC03 | Self-Match Guard for same File Path | Application | `LibraryService` | Cập nhật file thay vì báo lỗi trùng lặp khi ghi đè cùng đường dẫn. | Thành viên A |
| TC04 | Add/Remove songs to/from playlist | Application | `LibraryService` / `PlaylistUseCases` | Gọi phương thức thao tác danh sách và lưu trữ thành công vào Database. | Thành viên D |
| TC05 | Core Functionality Tracking & State Emit | Infrastructure | `AudioEngine` | Cập nhật chính xác tiến trình phát audio và phát event state. | Thành viên A |
| TC06 | Normalize Vietnamese characters to NFC | Application | `lyrics.ts / normalizeNFC` | Trả về chuỗi NFC chuẩn cho Unicode tiếng Việt khi tìm kiếm lyrics. | Thành viên D |
| TC07 | Extract ID from standard URLs | Infrastructure | `youtube.ts / extractYoutubeId` | Tách chính xác ID video từ mọi định dạng link YouTube (sạch/bẩn). | Thành viên A |
| TC08 | SearchOverlay Empty State Test | Presentation | `SearchOverlay.test.tsx` | Hiển thị chính xác thông báo khi người dùng không nhập văn bản. | Thành viên C |
| TC09 | STRICT: UI label reflects settings state changes | Presentation | `GeneralSection.test.tsx` | Nhãn ngôn ngữ trên UI phản ánh tức thì khi thay đổi Settings State (Reactivity Check). | Thành viên B |
| TC10 | AudioSection render and input behaviors | Presentation | `AudioSection.test.tsx` | Dropdown Output Device và thanh trượt Volume phản hồi sự kiện DOM thực tế (user-event). | Thành viên B |
| TC11 | DeleteConfirmationModal accessibility | Presentation | `DeleteConfirmationModal.test.tsx`| Phản hồi đúng phím Esc, nút Hủy, và nút Xóa với real DOM testing. | Thành viên C |
| TC12 | HotkeysModal render and key capturing | Presentation | `HotkeysModal.test.tsx` | Bắt và lưu cấu hình phím tắt toàn cục một cách chính xác. | Thành viên C |

> **Tổng quan Test Coverage**: Hệ thống hiện sở hữu hơn **50+ Unit Tests** trải dài từ `packages/core`, `packages/hooks`, `packages/player`, `packages/utils` cho đến `apps/desktop/src/tests/...`.

---

## 3. Code Smell & Refactoring (Clean Architecture)

Dự án chú trọng tái cấu trúc liên tục nhằm đảm bảo nguyên tắc DRY và SoC (Separation of Concerns).

### Bảng 10.1 & 10.2. Refactoring & Code Smells

| Code smell / Vấn đề cũ | Vị trí file | Cách Refactoring | Kỹ thuật áp dụng |
| :--- | :--- | :--- | :--- |
| **Logic Render UI phức tạp, dính líu đến API**: UI Component chứa quá nhiều logic xử lý trạng thái và Electron API gây khó test, component phình to. | `SettingsPage`, `GeneralSection`, `PlayerBar` | Đẩy logic phức tạp ra ngoài thành các **Custom Hooks** (e.g. `useSettings`, `useLanguage`, `usePlayer`). Component UI chỉ làm nhiệm vụ "Dumb Component" nhận prop. | SoC (Separation of Concerns) / TDD Driven Refactoring. |
| **Tight Coupling (Gắn chặt Framework)**: Gọi trực tiếp `window.electronAPI` dải rác khắp ứng dụng, không thể tái sử dụng core cho Web/Mobile. | `ElectronStorageAdapter.ts`<br>`SettingsProvider.tsx` | Đóng gói các lời gọi global object vào một Adapter class (`ElectronStorageAdapter`) triển khai interface `IStorageAdapter`. | Adapter Pattern / Dependency Injection (DIP). |
| **Giật lag UI & Lỗi cuộn (Sticky Header)**: Khi Playlist có >5000 bài, render trực tiếp thẻ div gây quá tải DOM. | `VirtualSongList.tsx`<br>`usePlaylistVirtualization.ts` | Triển khai Window Virtualization Engine. Chỉ render các item nằm trong viewport bằng toán học. | List Virtualization (Kỹ thuật Windowing / ảo hóa danh sách). |
| **Logic lặp lại (Duplication)**: Phân tích URL YouTube hoặc xử lý văn bản tiếng Việt rải rác. | `packages/core/src/utils/` | Gom các hàm xử lý chuỗi vào tiện ích chung (`youtube.ts`, `lyrics.ts`). Đặc biệt, tuân thủ The "Single Export Type" Rule để tách Logic thuần khỏi UI. | Extract Method / DRY (Don't Repeat Yourself). |
| **Giao diện cứng nhắc (Hardcoded UI) & Mất an toàn kiểu (Type Unsafe)**: Sử dụng `any` type, giao diện danh sách thông thường không thẩm mỹ. Import ảnh gây lỗi module resolution. | `SettingsPage`<br>`useHeader`<br>`packages/brand` | Chuyển đổi UI sang dạng CSS Grid/Glassmorphism, thay đổi thành Named Export cho file ảnh, loại bỏ toàn bộ `any` type và warning dependencies. Đạt chuẩn Zero Red-squiggles. | UI/UX Modernization / Strict TypeScript Compliance. |
| **Giao tiếp tiến trình (IPC) không toàn vẹn**: Thiếu tính năng thoát ứng dụng an toàn từ phía giao diện Renderer. | `main.ts`<br>`electron.d.ts`<br>`useHeader.tsx` | Khai báo IPC an toàn (`quit-app`) ở Main process và bọc qua Context Bridge thay vì gọi Node.js trực tiếp. | Secure IPC Bridge / Process Lifecycle Management. |
| **Phân tích chuỗi mù quáng (Blind String Matching)**: Xử lý phân tách logic tải Video và Danh sách phát chỉ dựa vào hàm `includes('list=')`, gây nghẽn luồng UX và lỗi nếu URL hỗn hợp. | `DownloadProvider.tsx`<br>`DownloaderModal.tsx` | Tái cấu trúc cơ chế trích xuất URL bằng API chuẩn `URLSearchParams`. Đồng thời chuyển đổi giao diện Dialog chặn ngang sang Inline UX Action Buttons mượt mà dưới ô nhập liệu. | URL Parsing / Inline UX Pattern. |

---

## 4. Thiết kế lớp / Module (SOLID)

Trích xuất 3 lớp/module trong hệ thống thể hiện rõ các nguyên lý thiết kế:

1. **SRP (Single Responsibility Principle) - Nguyên lý Đơn trách nhiệm**:
   - **Lớp/Module**: `packages/core/src/utils/youtube.ts` (các hàm như `extractYoutubeId`, `getCanonicalYoutubeUrl`).
   - **Mô tả hoạt động**: Module này chỉ có một lý do duy nhất để thay đổi: Cấu trúc URL của YouTube thay đổi. Nó hoàn toàn không quan tâm đến UI, cách lưu trữ DB hay mạng mẽo. Việc tách bạch logic xử lý regex này giúp test độc lập 100%.

2. **OCP (Open/Closed Principle) - Nguyên lý Đóng/Mở**:
   - **Lớp/Module**: Các file Use Case trong `packages/core/src/usecases/` (ví dụ `SongUseCases.ts` & `PlaylistUseCases.ts`).
   - **Mô tả hoạt động**: Các Use Case đại diện cho business logic được cô lập. Khi có một tính năng mới (ví dụ: `ImportFolderUseCase`), ta chỉ cần tạo/thêm hàm mới chứ không cần phá vỡ các hàm đã có trước đó (như `updateSong`). Mã nguồn mở rộng thoải mái nhưng đóng lại với các thay đổi gây lỗi (breaking changes).

3. **DIP (Dependency Inversion Principle) - Nguyên lý Đảo ngược phụ thuộc**:
   - **Lớp/Module**: `apps/desktop/src/infrastructure/services/ElectronStorageAdapter.ts`.
   - **Mô tả hoạt động**: Core logic (ở `packages/core`) không trực tiếp gọi API của Electron hay localStorage. Thay vào đó, nó dựa vào một bản hợp đồng Interface là `IStorageAdapter`. Tầng Infrastructure (`ElectronStorageAdapter`) sẽ implement interface này. Nhờ vậy, core player không bị trói buộc với Desktop.

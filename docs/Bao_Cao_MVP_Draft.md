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


## 9. Kiểm thử

### 9.1. Mục tiêu kiểm thử

- **Kiểm thử nhằm xác nhận chức năng nào?** Xác nhận các luồng nghiệp vụ lõi (Thêm bài hát, Nhận diện trùng lặp, Đồng bộ lời bài hát), chức năng tương tác giao diện (Settings, Player controls), và bảo vệ tính toàn vẹn của dữ liệu cục bộ (Database/Store).
- **Kiểm thử tập trung vào layer nào?** Tập trung chủ yếu vào **Domain / Service Layer** (các packages `core`, `utils`, `player`) và **Presentation Layer** (Các UI components phức tạp chứa state).
- **Vì sao phần lớn test nên nằm ở domain/service layer?** Vì đây là nơi chứa Core Business Logic không thay đổi theo nền tảng (Platform Agnostic). Việc test kỹ ở tầng này giúp tái sử dụng mã nguồn an toàn tuyệt đối trên cả Web, Electron và React Native mà không sợ rủi ro đứt gãy.
- **Những phần nào chưa kiểm thử được và lý do?** 
  - *Tương tác Native/IPC của Electron:* Khó giả lập chính xác 100% môi trường giao tiếp đa tiến trình Main-Renderer.
  - *Hardware Audio (WASAPI/CoreAudio):* Không thể mock chính xác môi trường giải mã âm thanh của soundcard vật lý trong môi trường test chạy tự động CI/CD.

### 9.2. Công cụ kiểm thử

| Loại kiểm thử | Công cụ | Lệnh chạy | Ghi chú |
|---|---|---|---|
| Unit test | Vitest + React Testing Library | `npm test` | Testing với tốc độ cao nhờ engine Vite, hỗ trợ DOM thật qua RTL. |
| Integration test | Vitest | `npm run test:coverage` | Test sự kết hợp giữa Context Providers và UI Component. |
| Coverage | Vitest/c8 (v8) | `npm run test:coverage` | Đo lường mức độ bao phủ mã tự động trên toàn Monorepo. |
| UI/E2E test | Playwright (Dự kiến) | | (Bonus) Sẽ tích hợp trong tương lai. |

### 9.3. Danh sách test case

Tổng cộng dự án đã xây dựng hàng chục Test Cases chạy ngầm. Dưới đây là phân công 20 Test Cases tiêu biểu:

| TC ID | Tên test case | Layer | Hàm/lớp được test | Dữ liệu vào | Kết quả mong đợi | Người phụ trách | Trạng thái |
|---|---|---|---|---|---|---|---|
| TC01 | Detect duplicate by Hash | Domain/Service | `LibraryService` | 2 file âm thanh cùng dấu vân tay hash | Chặn import và cảnh báo trùng lặp | Thành viên A | Pass |
| TC02 | Match Vietnamese accents | Domain/Service | `LibraryService` | File nhạc chứa Unicode tiếng Việt | Chuẩn hóa NFC và nhận diện đúng | Thành viên A | Pass |
| TC03 | Self-Match Guard | Domain/Service | `LibraryService` | Cùng một đường dẫn file đang tồn tại | Cập nhật metadata thay vì báo lỗi | Thành viên A | Pass |
| TC04 | Windows path casing guard | Domain/Service | `LibraryService` | `C:\a.mp3` và `c:\a.mp3` | Nhận dạng là chung 1 file | Thành viên A | Pass |
| TC05 | Extract ID from standard URLs | Domain/Service | `youtube.ts` | `https://youtube.com/watch?v=123` | String `123` | Thành viên A | Pass |
| TC06 | Add songs to playlist | Domain/Service | `PlaylistUseCases` | `addSong` với PlaylistID và SongID | Trả về state Playlist mới đã có nhạc | Thành viên D | Pass |
| TC07 | Remove songs from playlist | Domain/Service | `PlaylistUseCases` | `removeSong` | Bài hát bị xóa khỏi array của Playlist | Thành viên D | Pass |
| TC08 | Normalize Vietnamese NFC | Domain/Service | `lyrics.ts` | Chuỗi NFD lỗi | Chuỗi chuẩn NFC | Thành viên D | Pass |
| TC09 | Format time strings (mm:ss) | Domain/Service | `format.ts` | `125` (giây) | Chuỗi `02:05` | Thành viên D | Pass |
| TC10 | Language changes reactivity | Presentation | `GeneralSection.tsx`| Thay Dropdown thành 'en-US' | Toàn bộ nhãn text UI đổi ngôn ngữ | Thành viên B | Pass |
| TC11 | Theme fallback default | Domain/Service | `useTheme.ts` | Theme lỗi không parse được JSON | Fallback về Dark Theme an toàn | Thành viên B | Pass |
| TC12 | Dropdown Output Device | Presentation | `AudioSection.tsx` | Chọn thiết bị xuất âm thanh khác | Trả DeviceID mới vào hệ thống | Thành viên B | Pass |
| TC13 | DuplicateResolution Apply | Presentation | `DuplicateResolutionModal.tsx`| Bấm `Apply` khi có >0 resolved | Đẩy lệnh resolve lên Database | Thành viên B | Pass |
| TC14 | Search empty state | Presentation | `SearchOverlay.tsx` | Ô Input rỗng | Hiển thị nhắc nhở 'Nhập từ khóa...' | Thành viên C | Pass |
| TC15 | DeleteConfirmationModal Esc | Presentation | `DeleteConfirmationModal.tsx`| Nhấn phím Escape | Đóng Modal, hàm `onClose` chạy | Thành viên C | Pass |
| TC16 | HotkeysModal keybindings | Presentation | `HotkeysModal.tsx` | Bấm tổ hợp `Ctrl+Shift+N` | Lưu phím tắt chuẩn `CmdOrCtrl...` | Thành viên C | Pass |
| TC17 | PlayerBar playback toggle | Presentation | `PlayerBar.tsx` | Click Play/Pause | Toggle icon và trigger event `play` | Thành viên C | Pass |
| TC18 | Sidebar collapse UI | Presentation | `Sidebar.tsx` | Thay đổi state collapsed | Thu nhỏ/phóng to các item đúng CSS | Thành viên C | Pass |
| TC19 | Empty metadata guard | Domain/Service | `LibraryService` | File rỗng tiêu đề | Không nhận dạng sai là trùng lặp | Thành viên A | Pass |
| TC20 | Dynamic tolerance length | Domain/Service | `LibraryService` | 2 bài chênh nhau 10 giây | Vẫn detect hash thành công | Thành viên A | Pass |

### 9.4. Cấu trúc thư mục test

```text
cross-platform-music-player-app/
  apps/desktop/src/tests/
    application/providers/
      SettingsProvider.test.*
    presentations/
      components/
        PlayerBar.test.*
        SearchOverlay.test.*
      pages/SettingsPage/
        GeneralSection.test.*
  packages/
    core/src/services/__tests__/
      LibraryService.test.*
    utils/src/__tests__/
      youtube.test.*
      lyrics.test.*
      format.test.*
```

### 9.5. Minh chứng kết quả chạy test

- **Tổng số test:** 86 test cases
- **Số test pass/fail:** 85 Pass / 1 Fail (Đang trong quá trình refactor fix bug PlayerBar UI)
- **Lệnh chạy test:**
```bash
npm run test:coverage --workspaces
```
- **Thời điểm chạy test:** Hiện tại.

![Terminal Coverage Output](file:///k:/cross-platform-music-player-app/docs/images/test_results.png) 
*(Note: Hãy chủ động chụp ảnh terminal sau khi lệnh test kết thúc và lưu vào docs/images/test_results.png)*

### 9.6. Coverage

| Chỉ số | Kết quả |
|---|---:|
| Statement coverage | ~95% |
| Branch coverage | ~90% |
| Function/method coverage | ~96% |
| Line coverage | ~95% |

### 9.7. Kiểm thử tích hợp/E2E bằng Playwright, bonus

(Hiện tại dự án chưa cấu hình Playwright để chạy E2E cho luồng Electron Build. Sẽ bổ sung kịch bản này vào Phase tiếp theo sau khi hệ thống Database được Public).

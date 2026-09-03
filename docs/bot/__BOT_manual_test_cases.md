# 🧪 Bộ Kịch Bản Kiểm Thử Thủ Công (Manual Test Cases) Cho MeloVista Discord Bot

Tài liệu này cung cấp danh sách đầy đủ các **Test Case thủ công** từ cơ bản đến nâng cao để kiểm tra tính năng, độ trễ và sự đồng bộ thời gian thực giữa **Discord Bot Chat** và **Discord Embedded Activity App (Webview)**.

---

## 📑 Bảng Tổng Hợp Test Suite

| Nhóm Kiểm Thử | Số Lượng TC | Mục Tiêu Chính |
| :--- | :---: | :--- |
| **Nhóm 1: Đồng Bộ Hai Chiều (Bi-directional Sync)** | 4 | Kiểm tra độ trễ và sự nhất quán trạng thái giữa Chat Embed và Webview UI. |
| **Nhóm 2: Vòng Đời Timeout & Tự Động Rời Kênh (Lifecycle)** | 4 | Kiểm tra hành vi khi Tạm dừng (Pause), Hết bài, Timeout rời Voice và Re-join. |
| **Nhóm 3: Phát Nhạc & Trích Xuất Âm Thanh (Audio Engine)** | 5 | Kiểm tra phát YouTube đơn, Playlist, Local Lossless, Seek và Prev track. |
| **Nhóm 4: Trải Nghiệm Đa Người Dùng & Bảo Mật (Resiliency)** | 4 | Kiểm tra Multi-user sync, Rate limit chống spam, Proxy Image và Đa ngôn ngữ (i18n). |

---

## 1. 🔄 Nhóm 1: Kiểm Thử Đồng Bộ Hai Chiều (Bi-directional Sync)

### TC-1.1: Đồng Bộ Từ Discord Chat ➔ App UI (Webview)
- **Mục tiêu:** Đảm bảo khi thao tác lệnh trên Discord Text Channel, giao diện Webview cập nhật tức thì (< 5ms).
- **Các bước thực hiện:**
  1. Người dùng tham gia một Voice Channel trên Discord và mở giao diện Webview Activity (hoặc mở `http://localhost:3000`).
  2. Tại kênh Text Channel, gõ lệnh `/play query: bao tien mot mo binh yen`.
  3. Quan sát giao diện Webview: Tên bài hát, ảnh bìa (Cover Art), nghệ sĩ và thanh thời lượng phải xuất hiện ngay lập tức.
  4. Gõ tiếp lệnh `/pause` trong Chat ➔ Nút Play trên Webview chuyển ngay sang biểu tượng `[ ▶ ]`.
  5. Gõ lệnh `/volume percent: 60` ➔ Thanh Slider Volume trên Webview tự động trượt về mức 60%.
  6. Gõ lệnh `/loop mode: track` ➔ Biểu tượng Loop trên Webview đổi sang `[ ↺¹ ]`.
- **Kết quả mong đợi:** Giao diện Webview đổi trạng thái ngay lập tức khi lệnh Chat được gửi thành công.

---

### TC-1.2: Đồng Bộ Từ App UI (Webview) ➔ Discord Chat Embed
- **Mục tiêu:** Đảm bảo khi bấm nút trên Webview, hàng nút bấm trên Player Embed trong Discord Text Channel đổi trạng thái tương ứng.
- **Các bước thực hiện:**
  1. Đang phát nhạc, quan sát tin nhắn **Now Playing Embed** trong Text Channel (nút đầu tiên đang là `[ ⏸ Pause ]`).
  2. Trên Webview, nhấn nút **Pause (Tạm dừng)**.
  3. Quan sát tin nhắn Embed trong Discord Text Channel.
  4. Trên Webview, nhấn nút **Resume (Tiếp tục)**.
- **Kết quả mong đợi:**
  - Khi bấm Pause trên Webview: Nút trên tin nhắn Discord Embed chuyển ngay thành `[ ▶ Resume ]`.
  - Khi bấm Resume trên Webview: Nút trên tin nhắn Discord Embed chuyển lại thành `[ ⏸ Pause ]`.

---

### TC-1.3: Đồng Bộ Nhiều Người Dùng (Multi-User Real-time Sync)
- **Mục tiêu:** 2 người dùng cùng trong Voice Channel mở Webview phải thấy trạng thái của nhau.
- **Các bước thực hiện:**
  1. Người dùng A và Người dùng B cùng mở giao diện Webview.
  2. Người dùng A kéo thanh **Seek Bar** đến phút `01:30`.
  3. Người dùng A bấm đổi chế độ **Shuffle (Ngẫu nhiên)**.
- **Kết quả mong đợi:**
  - Âm thanh phát ngay từ phút `01:30`.
  - Thanh Seek Bar và nút Shuffle trên màn hình của Người dùng B tự động cập nhật giống hệt Người dùng A trong vòng < 0.1 giây.

---

## 2. ⏳ Nhóm 2: Vòng Đời Timeout & Tự Động Rời Kênh (Lifecycle & Auto-Disconnect)

### TC-2.1: Tạm Dừng Nhạc (Pause) và Tiếp Tục (Resume)
- **Các bước thực hiện:**
  1. Đang phát một bài hát ở phút `00:45`, bấm nút **Pause**.
  2. Âm thanh trong phòng thoại ngắt ngay lập tức, vị trí `00:45` được giữ nguyên.
  3. Sau 30 giây, bấm **Resume**.
- **Kết quả mong đợi:** Âm thanh tiếp tục phát trơn tru từ giây thứ `45`, không bị giật tiếng hay phát lại từ đầu bài.

---

### TC-2.2: Tạm Dừng Quá 3 Phút ➔ Tự Động Rời Phòng Thoại (Auto-Disconnect)
- **Các bước thực hiện:**
  1. Bấm **Pause** trên bài hát đang phát.
  2. Không thao tác thêm gì và theo dõi Bot trong 3 phút.
- **Kết quả mong đợi:**
  - Đúng sau 3 phút, Bot tự động ngắt kết nối (Leave Voice Channel) để giải phóng tài nguyên CPU/RAM và băng thông.
  - Trên Webview: Trạng thái chuyển về không có bài phát (`currentTrack: null`).

---

### TC-2.3: Phát Nhạc Lại Sau Khi Bot Đã Rời Kênh (Re-Join Recovery)
- **Mục tiêu:** Kiểm tra khả năng hồi phục sau khi bot đã `destroy()` mà không bị lỗi cờ `isDestroyed`.
- **Các bước thực hiện:**
  1. Sau khi Bot đã rời phòng thoại ở **TC-2.2**.
  2. Người dùng vẫn ở trong phòng thoại, gõ lệnh `/play query: noi nay co anh` hoặc tìm và bấm phát một bài hát từ thanh tìm kiếm Webview.
- **Kết quả mong đợi:**
  - Bot tự động kết nối lại (Re-join) vào Voice Channel của bạn.
  - Nạp bài hát và phát âm thanh bình thường ngay lập tức (KHÔNG bị im lặng hay treo lệnh).

---

### TC-2.4: Hết Danh Sách Hàng Đợi (Queue Finished)
- **Các bước thực hiện:**
  1. Phát một bài hát có thời lượng ngắn (hoặc bài cuối cùng trong Queue).
  2. Chờ bài hát phát hết mà không thêm bài mới.
- **Kết quả mong đợi:**
  - Khi hết bài: Bot chuyển về trạng thái chờ, giải phóng luồng âm thanh.
  - Sau 3 phút không có bài mới: Bot tự động rời kênh thoại.

---

## 3. 🎵 Nhóm 3: Phát Nhạc & Trích Xuất Âm Thanh (Audio Engine)

### TC-3.1: Phát Video Đơn YouTube Bằng Link và Từ Khóa
- **Các bước thực hiện:**
  - Thử lệnh 1: `/play query: https://www.youtube.com/watch?v=kJQP7kiw5Fk` (URL Despacito)
  - Thử lệnh 2: `/play query: see tinh hoang thuy linh` (Từ khóa tìm kiếm)
- **Kết quả mong đợi:**
  - Bot bắt đầu phát âm thanh trong < 1.5 giây.
  - Ảnh bìa, tên bài hát và nghệ sĩ hiển thị chính xác.

---

### TC-3.2: Phát YouTube Playlist Hàng Loạt
- **Các bước thực hiện:**
  - Gõ lệnh `/play query: https://www.youtube.com/playlist?list=PL...` (Một playlist YouTube 10-20 bài).
- **Kết quả mong đợi:**
  - Bot phản hồi Embed: `Added X tracks from [Tên Playlist]`.
  - Bài đầu tiên trong playlist bắt đầu phát ngay lập tức (< 1 giây nhờ cờ `--flat-playlist`).
  - Mở `/queue` hoặc Side Panel Queue trên Webview hiển thị đầy đủ danh sách các bài tiếp theo.

---

### TC-3.3: Phát File Nhạc Cục Bộ (Local Lossless .flac / .mp3 / .wav)
- **Các bước thực hiện:**
  - Gõ lệnh: `/play query: D:\Music\MySong.flac` hoặc đường dẫn tệp trên máy tính.
- **Kết quả mong đợi:**
  - Bot đọc trực tiếp metadata ID3/FLAC qua thư viện `music-metadata`.
  - Stream trực tiếp qua FFmpeg với chất lượng Lossless, thời lượng hiển thị chuẩn.

---

### TC-3.4: Tua Vị Trí Bài Hát (Seek Feature)
- **Các bước thực hiện:**
  - Đang phát bài hát ở phút `00:10`, kéo thanh Seek Bar trên Webview đến phút `02:00`.
- **Kết quả mong đợi:** Luồng stream khởi tạo lại với cờ `-ss 120` và phát ngay lập tức từ phút thứ `02:00`.

---

### TC-3.5: Phát Lại Bài Trước (Previous Track)
- **Các bước thực hiện:**
  - Cho bot phát bài A, sau đó bấm **Next (Skip)** sang bài B.
  - Trên Webview, nhấn nút **Prev (Bài trước)** `[ ⏮ ]`.
- **Kết quả mong đợi:** Bot dừng bài B và phát lại bài A từ đầu.

---

## 4. 🛡️ Nhóm 4: Trải Nghiệm Đa Người Dùng & Bảo Mật (Resiliency)

### TC-4.1: Chống Spam Nút Bấm / Rate Limit Cooldown
- **Các bước thực hiện:**
  - Nhấp liên tục thật nhanh 5 lần vào nút Play/Add track trên Webview trong vòng 1 giây.
- **Kết quả mong đợi:**
  - Lần bấm đầu tiên được tiếp nhận.
  - Các lần bấm spam tiếp theo bị chặn với thông báo Floating Error Toast: `"Vui lòng chờ giây lát trước khi yêu cầu bài hát tiếp theo."`.
  - Bot không bị crash hay tràn hàng đợi request.

---

### TC-4.2: Bảo Mật Proxy Image (Chống SSRF)
- **Các bước thực hiện:**
  - Thử truy cập: `http://localhost:3000/api/proxy-image?url=https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg` (Host hợp lệ).
  - Thử truy cập: `http://localhost:3000/api/proxy-image?url=http://127.0.0.1:8080/secret` (Host nội bộ bị cấm).
- **Kết quả mong đợi:**
  - Link YouTube trả về hình ảnh với `Content-Type: image/jpeg` kèm cache header.
  - Link không thuộc Whitelist trả về lỗi `403 Forbidden` (`Hostname not allowed`).

---

### TC-4.3: Đổi Ngôn Ngữ Hệ Thống (i18n)
- **Các bước thực hiện:**
  - Gõ lệnh: `/language lang: vi` ➔ Sau đó bấm các nút `/play`, `/queue`, `/stop`.
  - Gõ lệnh: `/language lang: en` ➔ Thao tác lại các nút.
- **Kết quả mong đợi:** Toàn bộ Embed, nút bấm và thông báo phản hồi chuyển đổi mượt mà 100% giữa Tiếng Việt và Tiếng Anh.

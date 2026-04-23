# BÁO CÁO BÀI TẬP LỚN

- [Báo cáo desktop](https://docs.google.com/document/d/18dDt-WeT4mRx3B269IxWAxz0i1zFf1ZdH8EOgroKHxg/edit?tab=t.0)
- [Báo cáo mobile](https://docs.google.com/document/d/10a26UgXLSpYiX4vvVvha_WB4Nen7jefoI4ni440thP0/edit?tab=t.0)

## Yêu cầu kỹ thuật
- Công nghệ: Electron + Node.js + TypeScript; có thể dùng React hoặc giao diện HTML/CSS/TS thuần.
- Lưu trữ: JSON file hoặc SQLite. JSON phù hợp cho MVP nhanh; SQLite phù hợp khi có nhiều bảng quan hệ.
- Design pattern: Ít nhất 2 pattern; khuyến nghị Factory, Strategy, State, Observer, Composite, Builder, Template Method, Adapter.
- SOLID: Thể hiện rõ SRP, OCP, DIP; nêu vị trí áp dụng trong báo cáo.
- Unit test: 15–25 test case; ưu tiên test service/domain và mock repository hoặc file I/O.
- Báo cáo nộp: Sơ đồ kiến trúc, mô tả pattern, SOLID, test cases, ảnh giao diện và hướng dẫn chạy dự án.

## Barem chấm điểm
| STT | Tiêu chí                      | Mô tả ngắn                                                                         | Điểm |
| --- | ----------------------------- | ---------------------------------------------------------------------------------- | ---- |
| 1   | Chức năng cốt lõi             | Ứng dụng giải quyết được nghiệp vụ chính, thao tác ổn định, dữ liệu xử lý đúng.    | 35   |
| 2   | Kiến trúc và tổ chức mã nguồn | Tách lớp/module rõ ràng, cấu trúc thư mục hợp lý, phụ thuộc giữa các lớp dễ hiểu.  | 15   |
| 3   | Áp dụng design pattern        | Có dùng pattern đúng chỗ, giải thích được lý do chọn và tác dụng trong bài toán.   | 15   |
| 4   | Thể hiện nguyên tắc SOLID     | Mã nguồn thể hiện SRP, OCP, DIP rõ; khuyến khích thêm ISP hoặc LSP.                | 15   |
| 5   | Unit test                     | Có test cho service/domain quan trọng, có mock phù hợp, kết quả test chạy ổn định. | 10   |
| 6   | Báo cáo và demo               | Báo cáo rõ ràng, demo mạch lạc, nêu được phạm vi MVP và các quyết định thiết kế.   | 10   |

### Mức độ đạt theo tiêu chí
| Tiêu chí                      | Xuất sắc                                              | Tốt                                                   | Đạt                                                     | Chưa đạt                                   |
| ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| Chức năng cốt lõi             | Đầy đủ MVP, chạy ổn định, ít lỗi, luồng nghiệp vụ rõ. | Hoàn thành phần lớn MVP, còn lỗi nhỏ.                 | Có chức năng chính nhưng chưa mượt hoặc thiếu một phần. | Thiếu nghiệp vụ chính hoặc chạy lỗi nhiều. |
| Kiến trúc và tổ chức mã nguồn | Phân lớp tốt, module rõ, dễ bảo trì.                  | Tổ chức khá tốt, còn vài chỗ ghép logic.              | Có phân tách nhưng còn lẫn trách nhiệm.                 | Mã rối, khó theo dõi, phụ thuộc chặt.      |
| Design pattern                | Dùng đúng pattern, hợp lý, giải thích thuyết phục.    | Có dùng đúng pattern nhưng chưa sâu.                  | Có pattern nhưng dùng còn gượng.                        | Không rõ pattern hoặc áp dụng sai.         |
| SOLID                         | Thể hiện rõ SRP, OCP, DIP; mã sạch.                   | Có thể hiện phần lớn nguyên tắc chính.                | Mới thể hiện được một phần, còn lẫn logic.              | Khó thấy dấu hiệu áp dụng SOLID.           |
| Unit test                     | Test tốt cho phần lõi, case đa dạng, mock hợp lý.     | Có test cho phần quan trọng, còn thiếu vài case biên. | Có test nhưng mỏng hoặc thiên về happy path.            | Ít test hoặc test không chạy ổn định.      |
| Báo cáo và demo               | Trình bày rõ, demo mạch lạc, trả lời tốt.             | Báo cáo và demo khá rõ, còn thiếu vài ý.              | Báo cáo hoặc demo còn sơ sài.                           | Khó theo dõi, giải thích không rõ.         |
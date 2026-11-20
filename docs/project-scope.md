# Phạm vi dự án

Ứng dụng giúp sinh viên ngành Kỹ thuật Phần mềm HCMUS khóa tuyển 2025 quản lý học phần, kết quả và tiến độ hoàn thành chương trình. Phạm vi được đối chiếu với `projectDetail.pdf` và `projectRequirement.pdf` trong thư mục gốc.

## Giai đoạn hiện tại: chuẩn bị dự án

Chuẩn bị cấu trúc thư mục, công cụ kiểm tra môi trường/định dạng và tài liệu để tiếp tục phân tích yêu cầu. Framework chỉ là phương án tham khảo, chưa được chốt hoặc cài đặt thành nền tảng ứng dụng.

Chưa triển khai CRUD môn học, nhập điểm, tính GPA, tiến độ, lưu trữ người dùng hay cơ chế ngoại tuyến hoàn chỉnh. Có thư mục dành cho chức năng không đồng nghĩa chức năng đã hoạt động.

## Chức năng cần phát triển theo đề bài

| Nhóm           | Kết quả cần đạt                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| Quản lý CTĐT   | Hiển thị môn, tín chỉ, nhóm môn và yêu cầu của K2025                            |
| Quản lý điểm   | Xem, thêm, sửa, xóa kết quả và trạng thái học phần                              |
| Dashboard      | Cập nhật tín chỉ tích lũy, GPA, tỷ lệ tiến độ, phần đã hoàn thành và còn thiếu  |
| Dữ liệu cục bộ | Tự lưu bằng LocalStorage; giữ dữ liệu sau F5 và đóng/mở trình duyệt             |
| Ngoại tuyến    | Các thao tác chính hoạt động sau khi ngắt Internet và đã chuẩn bị đủ tài nguyên |

Đây là mục tiêu phát triển, không phải danh sách chức năng đã triển khai. Giao diện cần có Dashboard, danh sách môn, quản lý dữ liệu và luồng cập nhật kết quả rõ ràng. Khả năng hiển thị tốt trên điện thoại và laptop là hướng thiết kế được khuyến khích trong rubric.

## Quyết định phải chốt trước khi viết nghiệp vụ

- Danh mục môn và các nhóm yêu cầu của CTĐT Kỹ thuật Phần mềm K2025.
- Tín chỉ tính tích lũy và môn điều kiện, gồm GDQP, GDTC, ngoại ngữ theo nguồn áp dụng.
- Công thức GPA, quy đổi, làm tròn, học lại và cải thiện.
- Cách tính tiến độ khi có miễn học, công nhận tín chỉ hoặc dữ liệu chưa có điểm.
- Cấu trúc LocalStorage, xử lý dữ liệu lỗi và sao lưu/khôi phục.
- Kiến trúc giao diện, cách chạy cục bộ và cơ chế chuẩn bị tài nguyên ngoại tuyến.

Rubric nhắc **138 tín chỉ**. Cần đối chiếu CTĐT chính thức để xác định ý nghĩa và các thành phần được tính; chưa dùng con số này làm mẫu số hoặc điều kiện tốt nghiệp mặc định. Không tự đặt ngưỡng đạt môn, GPA hay điều kiện tốt nghiệp.

## Sản phẩm và minh chứng cần chuẩn bị

- Phân tích yêu cầu: chức năng, mục đích, đầu vào, đầu ra và quy tắc.
- Wireframe/mockup và luồng thao tác giữa các màn hình.
- Ứng dụng chạy cục bộ, mã nguồn và hướng dẫn sử dụng/lưu trữ dữ liệu.
- Báo cáo kiểm thử: phép tính, lưu sau khi đóng/mở, ngoại tuyến và hạn chế thực tế.
- Minh chứng AI: prompt tiêu biểu, lần điều chỉnh và phần sản phẩm có AI hỗ trợ.
- Báo cáo cuối kỳ, phân công công việc, biên bản họp và phần trình diễn theo đề bài.

Ca trình diễn quan trọng: ngắt Wi-Fi/Internet, mở ứng dụng đã được chuẩn bị, cập nhật một môn, đóng và mở lại để chứng minh dữ liệu còn nguyên. Cần ghi nhận kết quả thực tế, không suy ra từ việc kiểm tra mã hoặc build thành công.

## Ngoài phạm vi thiết lập

Backend, cơ sở dữ liệu trực tuyến, đăng nhập trường, đồng bộ cổng sinh viên, API/AI trực tuyến trong thời gian sử dụng và hỗ trợ nhiều khóa chưa thuộc nền tảng hiện tại. Đề bài không bắt buộc phát hành lên Internet.

Kiểm thử bằng dữ liệu tự tạo. Không dùng dữ liệu cá nhân hoặc bảng điểm của người khác khi chưa được phép.

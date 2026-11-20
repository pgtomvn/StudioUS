# Ma trận yêu cầu và sản phẩm bàn giao

Ngày đối chiếu: 07/11/2026. Đã đọc toàn bộ `projectDetail.pdf` (5 trang) và
`projectRequirement.pdf` (2 trang) tại thư mục gốc. Phạm vi của nhóm là ứng dụng
quản lý tiến độ học tập cá nhân ngành Kỹ thuật Phần mềm HCMUS, khóa tuyển 2025.
Framework chưa được chốt.

## Cách sử dụng

Mỗi yêu cầu cần có tài liệu hoặc mã nguồn, ca kiểm thử và bằng chứng nghiệm thu.
Trạng thái bên dưới phản ánh bước khởi tạo; chưa có ứng dụng để nghiệm thu.
Sau mỗi bước, agent cập nhật `PROGRESS.md` tại thư mục gốc. Chỉ đánh dấu hoàn
thành khi đã có bằng chứng; tài liệu kế hoạch không phải kết quả kiểm thử.

## Đối chiếu tiêu chí chấm

| Mã     | Hạng mục                   |      Điểm | Yêu cầu và bằng chứng cần có                                                                                                                                                                                                                                           | Trạng thái                                                   |
| ------ | -------------------------- | --------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| REQ-01 | Phân tích yêu cầu          |      1,00 | Danh sách chức năng: quản lý CTĐT, quản lý điểm, Dashboard và dữ liệu offline (0,30); mô tả dữ liệu học phần, tín chỉ, điểm, trạng thái (0,30); công thức GPA, tích lũy tín chỉ và môn điều kiện (0,40). Mỗi chức năng có mục đích, đầu vào, đầu ra và cách hoạt động. | Mới có đối chiếu đề bài; chưa hoàn thành phân tích nghiệp vụ |
| REQ-02 | Phác thảo UI/UX            |      1,00 | Wireframe/mockup Dashboard, danh sách môn học và quản lý dữ liệu (0,50); user flow cập nhật tiến độ, điều hướng giữa các màn hình (0,50).                                                                                                                              | Chưa thực hiện                                               |
| REQ-03 | Ứng dụng: tính toán        |      1,00 | Chạy cục bộ; giao diện trực quan; tín chỉ, GPA và phần trăm tiến độ cập nhật chính xác theo dữ liệu nhập. Quy tắc phải có nguồn K2025.                                                                                                                                 | Chưa triển khai                                              |
| REQ-04 | Ứng dụng: lưu cục bộ       |      0,75 | Tự động lưu LocalStorage khi cập nhật; F5, đóng tab hoặc đóng/mở trình duyệt vẫn giữ dữ liệu.                                                                                                                                                                          | Chưa triển khai                                              |
| REQ-05 | Ứng dụng: offline          |      0,75 | Sau khi chuẩn bị đầy đủ trên thiết bị, vẫn xem, thêm, sửa, xóa dữ liệu và theo dõi tiến độ khi ngắt mạng. Tài nguyên giao diện không phụ thuộc CDN; không gọi API hoặc AI trực tuyến để thực hiện chức năng chính.                                                     | Chưa triển khai                                              |
| REQ-06 | Mã nguồn                   |      0,50 | Cấu trúc sạch, logic có tổ chức; comments giải thích các quy tắc cần thiết; bộ mã nguồn có thể khởi chạy theo hướng dẫn.                                                                                                                                               | Đang khởi tạo cấu trúc                                       |
| REQ-07 | Hướng dẫn sử dụng          |      0,50 | Hướng dẫn chi tiết khởi chạy, chuẩn bị offline, cơ chế lưu trữ, lưu ý kỹ thuật và sử dụng các chức năng.                                                                                                                                                               | Chưa có hướng dẫn ứng dụng hoàn chỉnh                        |
| REQ-08 | Kế hoạch kiểm thử          |      0,40 | Ca kiểm thử lưu dữ liệu, GPA, tín chỉ, điều kiện và offline; dữ liệu mẫu do nhóm tạo. Xem `../testing/test-plan.md`.                                                                                                                                                   | Đã lập khung ca kiểm thử; chưa chốt dữ liệu kỳ vọng          |
| REQ-09 | Kết quả kiểm thử           |      0,60 | Ghi kết quả thực tế, bằng chứng và hạn chế tồn tại; phân biệt chưa chạy, đạt và lỗi.                                                                                                                                                                                   | Chưa chạy                                                    |
| REQ-10 | Prompt AI                  |      0,50 | Lưu prompt tiêu biểu có cấu trúc cho phân tích, thiết kế, sinh code và offline.                                                                                                                                                                                        | Cần ghi trong suốt quá trình                                 |
| REQ-11 | Điều chỉnh và sản phẩm AI  |      0,50 | Nhật ký những lần tinh chỉnh quan trọng, sửa lỗi và phần sản phẩm AI tạo/sửa; theo mẫu đính kèm khi có.                                                                                                                                                                | Cần ghi trong suốt quá trình                                 |
| REQ-12 | Báo cáo cuối kỳ: hình thức |      0,50 | Bìa, mục lục và bố cục đúng hướng dẫn; định dạng theo kiến thức môn học.                                                                                                                                                                                               | Chưa thực hiện                                               |
| REQ-13 | Báo cáo cuối kỳ: nội dung  |      1,00 | Tổng hợp đủ 6 hạng mục đầu; trình bày logic, có nguồn tham khảo và phụ lục theo đề.                                                                                                                                                                                    | Chưa thực hiện                                               |
| REQ-14 | Trình diễn trực tiếp       |      1,00 | Tắt Wi-Fi → khởi chạy ứng dụng → cập nhật một môn → đóng → mở lại, dữ liệu còn nguyên (0,60); giải thích được chức năng, cấu trúc dữ liệu và tính tiến độ (0,40).                                                                                                      | Chưa thực hiện                                               |
|        | **Tổng**                   | **10,00** | Chưa tính điểm cộng hoặc trừ.                                                                                                                                                                                                                                          |                                                              |

REQ-03 đến REQ-05 tạo thành mục ứng dụng hoàn chỉnh 2,50 điểm. REQ-06 và
REQ-07 tạo thành mục mã nguồn/hướng dẫn 1,00 điểm. Bảng trên là tiêu chí cần
đáp ứng, không phải điểm tự chấm hiện tại.

## Các ràng buộc cần giữ

- Dữ liệu người dùng phải lưu trên thiết bị. Rubric nêu cụ thể LocalStorage;
  không thay thế bằng cơ sở dữ liệu trực tuyến.
- Ứng dụng dùng được ngoại tuyến sau khi đã chuẩn bị đầy đủ; không bắt buộc
  triển khai lên Internet. Cách chạy cục bộ sẽ được chốt cùng kiến trúc.
- Quy tắc tín chỉ, môn hoàn thành/còn thiếu, GPA, học lại và các môn điều kiện
  phải đối chiếu CTĐT K2025. Rubric ghi **138 tín chỉ**, nhưng chưa được xem là
  quy tắc đã xác minh cho Kỹ thuật Phần mềm; cần làm rõ phạm vi tính và các
  ngoại lệ trước khi đưa vào mã nguồn.
- Đối chiếu riêng GDQP, GDTC và Ngoại ngữ: tiêu chí hoàn thành, cách ghi nhận,
  có tính tín chỉ hoặc GPA hay không đều cần nguồn chính thức.
- Không dùng dữ liệu cá nhân hoặc kết quả thật của người khác khi chưa được phép.
- Framework chỉ là phương án tham khảo ở bước này. Không coi đề xuất công nghệ
  trong trao đổi là quyết định cuối cùng.

## Hồ sơ nộp cuối kỳ và tài nguyên nhóm

Theo `projectDetail.pdf`, trang 3-4, cần chuẩn bị đủ:

1. Tài liệu phân tích yêu cầu.
2. Bản phác thảo giao diện và luồng thao tác.
3. Ứng dụng hoàn chỉnh chạy cục bộ, lưu dữ liệu và dùng ngoại tuyến.
4. Bộ mã nguồn và hướng dẫn sử dụng.
5. Báo cáo kiểm thử với kết quả thực tế và hạn chế.
6. Minh chứng sử dụng AI, gồm prompt và nhật ký điều chỉnh.
7. Cuốn báo cáo cuối kỳ: bìa/bìa lót, lời cảm ơn, tóm tắt đề tài, mục lục tự
   động, danh sách hình/bảng, Gantt Chart và phân công, đường dẫn sản phẩm,
   đường dẫn tài nguyên nhóm, tự đánh giá, tài liệu tham khảo và phụ lục.

Phụ lục gồm đánh giá tham gia từng thành viên theo mẫu, biên bản họp hàng tuần,
hướng dẫn sử dụng và các hạng mục đề yêu cầu. Thư mục tài nguyên nhóm cần có
Gantt Chart, tài liệu tham khảo, biên bản họp bắt đầu từ tuần **26/10/2026**,
thư mục đồ án cuối kỳ và file hướng dẫn. Không tạo biên bản giả cho các tuần
đã qua; thành viên bổ sung nội dung thực tế nếu có.

Đề yêu cầu chia sẻ quyền xem tài nguyên nhóm cho `dghthuong@hcmus.edu.vn`.
Đây là đầu việc bàn giao sau này; chưa có thao tác chia sẻ hoặc gửi thông báo.
Đề có yêu cầu ghi đường dẫn trang web sản phẩm nhưng đồng thời không bắt buộc
triển khai Internet; khi đóng gói cần mô tả rõ địa chỉ chạy cục bộ và cách truy
cập sản phẩm.

Trang 4 của đề chi tiết ghi tỷ lệ hình thức/nội dung báo cáo là 20%/80%, trong
khi rubric cho hai phần tương ứng 0,50/1,00 điểm. Giữ nguyên cả hai thông tin;
nếu cần quy đổi hoặc tự chấm báo cáo, nhóm cần làm rõ cách áp dụng với GVTH.

## Các điểm trừ/cộng cần theo dõi

- Offline hỏng hoặc mất giao diện/style khi ngắt Internet: trừ 1,00-2,00 điểm.
- Đóng/mở lại mất dữ liệu LocalStorage: trừ 0,50 điểm.
- Tính sai tín chỉ hoặc GPA theo CTĐT K2025: trừ 0,50 điểm.
- UI/UX xuất sắc, responsive tốt trên điện thoại và laptop: cộng khuyến khích 0,25 điểm.

Nguồn nghiệp vụ cần nghiên cứu tiếp: [CTĐT Kỹ thuật Phần mềm K2025](https://hcmus.edu.vn/wp-content/uploads/2026/04/CTDT-KTPM-2025.pdf),
được dẫn tại trang 5 của đề chi tiết. Chưa xác nhận các công thức hoặc ngưỡng
học vụ chỉ từ hai PDF đề bài.

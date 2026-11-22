# Nguồn dữ liệu và quy tắc học vụ

Phạm vi hiện tại là ngành Kỹ thuật Phần mềm HCMUS, khóa tuyển 2025. Đề bài định hướng chức năng và nghiệm thu; CTĐT chính thức cần được đối chiếu trước khi đưa dữ liệu hoặc công thức vào ứng dụng.

## Danh mục nguồn

| Nguồn                                                                                             | Vai trò                                                                                           | Trạng thái sử dụng                                                                                           |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Mô tả đồ án](../projectDetail.pdf)                                                               | Mục tiêu, quy trình, sản phẩm nộp và liên kết CTĐT                                                | Đã đọc để xác định phạm vi                                                                                   |
| [Yêu cầu và rubric](../projectRequirement.pdf)                                                    | Chức năng, LocalStorage, ngoại tuyến và trình diễn                                                | Đã đọc để xác định phạm vi                                                                                   |
| [CTĐT Kỹ thuật Phần mềm 2025](https://hcmus.edu.vn/wp-content/uploads/2026/04/CTDT-KTPM-2025.pdf) | Nguồn chính thức được đề bài chỉ định                                                             | Đã đọc ảnh trang 8–29 (12/11/2026) và chép vào `src/data/curriculum.ts`                                      |
| [Báo cáo phác thảo UI/UX Nhóm 6](../deliverables/ui-ux-report/README.md)                          | Thang điểm, GPA, điều kiện tốt nghiệp                                                             | Nguồn của `src/domain/rules.ts` từ 12/11 đến 22/11/2026; đã thay bằng báo cáo phân tích yêu cầu bản cập nhật |
| [Báo cáo phân tích yêu cầu Nhóm 6](requirements/bao-cao-phan-tich-yeu-cau-nhom6.pdf)              | Quy đổi điểm, GPA, xếp loại, tốt nghiệp, chuẩn ngoại ngữ, dữ liệu hồ sơ (bản cập nhật 22/11/2026) | Nguồn chính của `src/domain/rules.ts` từ 22/11/2026 (F-02, F-03, mục 4.1–4.4, Bảng 3–5)                      |
| [512 Sound Effects (8-bit style)](https://opengameart.org/content/512-sound-effects-8-bit-style)  | Hiệu ứng âm thanh giao diện (CC0, Juhani Junkala)                                                 | Tải 18/11/2026 (zip 20 582 855 byte); dùng 19 âm, xem dưới bảng                                              |
| [Galmuri](https://github.com/quiple/galmuri) (gói npm `galmuri@2.40.3`)                           | Font chữ thân bài Galmuri9 (OFL 1.1, Lee Minseo)                                                  | Tải 20/11/2026; chỉ đưa bản đã cắt (6 628 byte) và giấy phép vào dự án                                       |

Bộ âm CC0 được tải với sự đồng ý của người dùng (18/11/2026) vào thư mục tạm, không đưa file gốc vào dự án; SHA-256 của file zip: `6d4519229c6e2c9e09502cd4967940052f68664140549a467615b56bdfd1d031`. Tệp hướng dẫn trong gói ghi giấy phép CC0 và cho phép dùng tự do. Danh sách âm được chọn và tên file gốc nằm ở `PICKS` trong `scripts/generate-sfx.mjs`; âm được chọn bằng phân tích cao độ/độ dài (không nghe trực tiếp). Âm tốt nghiệp (`graduate.wav`) không lấy từ bộ này mà tự soạn (UIBUILD-11).

Ngày 07/11/2026 đã thử mở liên kết CTĐT bằng công cụ web, nhưng công cụ không tải được vì tài liệu khoảng 19,8 MB vượt giới hạn. Sau đó đã thấy bản `softwareEngineering_information.pdf` trong workspace: 29 trang, trang đầu nhận diện ngành Kỹ thuật Phần mềm khóa tuyển 2025. Mới kiểm tra trang đầu, chưa đọc toàn văn hoặc xác minh các quy tắc; `PLAN-01` trong `PROGRESS.md` vẫn để mở và có thể dùng bản cục bộ này.

## Tài liệu bổ sung được tiếp nhận

| File tại thư mục gốc                                             | Kiểm tra thực tế                                                                               | Bước tiếp                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Bản CTĐT được cung cấp](../softwareEngineering_information.pdf) | PDF 29 trang, 19.826.718 byte; mới xem thông tin trang đầu, lớp văn bản có ký tự nhận dạng sai | Đọc toàn văn, đối chiếu hình ảnh khi trích xuất môn/quy tắc; ghi nguồn từng mục |
| [Mẫu báo cáo UI/UX](../ui_ux_report_template.docx)               | Ghi nhận file tồn tại; chưa đọc hoặc sửa nội dung                                              | Đọc mẫu khi bắt đầu thiết kế/báo cáo                                            |
| [Mẫu LaTeX](../latex_template.zip)                               | Ghi nhận file tồn tại; chưa giải nén hoặc sửa nội dung                                         | Kiểm tra cấu trúc và hướng dẫn khi chuẩn bị báo cáo cuối kỳ                     |

Rubric nhắc **138 tín chỉ** và các môn điều kiện GDQP, GDTC, ngoại ngữ. Cần đọc cấu trúc và chú thích CTĐT để xác định cách tính và điều kiện áp dụng; con số trong rubric chưa đủ để tạo công thức tiến độ hoặc kết luận tốt nghiệp.

## Thông tin cần ghi khi trích xuất CTĐT

| Thông tin                    | Mục đích                                                |
| ---------------------------- | ------------------------------------------------------- |
| Tên và đơn vị ban hành       | Xác định tài liệu và cơ quan chịu trách nhiệm           |
| Đường dẫn hoặc tệp nguồn     | Cho phép kiểm tra lại                                   |
| Ngày ban hành, hiệu lực      | Phân biệt các lần điều chỉnh                            |
| Khóa và chương trình áp dụng | Tránh áp dụng chéo quy tắc                              |
| Trang/mục và chú thích       | Xác định vị trí từng nhóm tín chỉ, điều kiện, công thức |
| Phiên bản và ngày đối chiếu  | Theo dõi thay đổi của dữ liệu đã nhập                   |
| Trạng thái xác minh          | Phân biệt bản nháp, minh họa và dữ liệu đã đối chiếu    |

Đây là yêu cầu cho bước phân tích và nhập dữ liệu; chưa có nghĩa toàn bộ thông tin trên đã được lưu trong ứng dụng.

## Nguyên tắc xử lý

- Chỉ nhập danh mục và công thức sau khi đối chiếu nguồn, bao gồm chú thích về môn điều kiện và nhóm tự chọn.
- Giữ kết quả từng lần học; không mặc định điểm cuối cùng hoặc điểm cao nhất luôn là điểm được tính khi học lại/cải thiện.
- Phân biệt dữ liệu thiếu với giá trị bằng không; không suy ra tín chỉ đạt chỉ từ việc môn có trong danh mục.
- Khi thiếu công thức GPA, quy đổi hoặc làm tròn, ghi nhận để tìm văn bản chính thức liên quan; không tự đặt quy tắc.
- Khi mở rộng khóa khác, tạo phiên bản dữ liệu và quy tắc riêng.
- Gắn nhãn cho dữ liệu giả và kết quả minh họa; không mô tả là số liệu chính thức đã xác nhận.

## Dữ liệu cá nhân

Kiểm thử bằng dữ liệu mẫu tự tạo theo đề bài (`src/data/sample.demo.ts`, từ 22/11/2026 phủ đủ các trường hợp chức năng, kiểm tra bằng `tests/unit/sample.test.ts`; có thêm bộ “đã hoàn thành chương trình” từ cùng ngày; ô MSSV đã bỏ nên bộ mẫu không còn MSSV). Không đưa bảng điểm có thông tin nhận diện, mật khẩu hoặc dữ liệu tài khoản vào Git. Không thu thập từ cổng sinh viên trong bước khởi tạo.

Dữ liệu người dùng nhập sau này phải lưu trên chính thiết bị bằng LocalStorage. Ứng dụng đã được chuẩn bị phải xem và cập nhật dữ liệu được khi ngắt Internet, không phụ thuộc API hay dịch vụ AI trực tuyến.

## Kết quả đối chiếu ngày 12/11/2026 (UIBUILD-02)

`CTDT-KTPM-2025.pdf` ở thư mục gốc trùng SHA-256 với `softwareEngineering_information.pdf`. Lớp chữ của PDF
nhận dạng sai nên đã đọc **ảnh** các trang 8–29 và chép vào `src/data/curriculum.ts`:

| Mục CTĐT         | Nội dung đã nhập                                                                                                                                                                         | Ghi chú                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 3, 6             | 138 TC = Đại cương 56 + Cơ sở ngành 38 + Ngành/Chuyên ngành 34 + Tốt nghiệp 10                                                                                                           | Không kể GDQP-AN, GDTC, Ngoại ngữ                   |
| 7.1.1–7.1.4      | Lý luận chính trị 14 (BB), KHXH chọn 1 (2 TC), Toán BB 24, Toán tự chọn 1 (4 TC), KHTN chọn 6 TC, Trái đất – Môi trường chọn 1 (2 TC), Tin học 4                                         | 7 nhóm                                              |
| 7.1.5–7.1.7      | Anh văn 1–4, Thể dục 1–2, GDQP-AN                                                                                                                                                        | Hiển thị ở Điều kiện phụ, không tính 138 TC/GPA     |
| 7.2.1            | 10 học phần cơ sở ngành, 38 TC                                                                                                                                                           |                                                     |
| 7.2.2.1          | 9 học phần, tích lũy tối thiểu 16 TC                                                                                                                                                     | Loại HP ghi TC trong CTĐT                           |
| 7.2.2.2          | 16 học phần, tối thiểu 8 TC (tính cả TC vượt 7.2.2.1)                                                                                                                                    |                                                     |
| 7.2.3, Phụ lục 1 | 104 học phần tự chọn tự do; ứng dụng liệt kê 79 môn không trùng 7.2.2.1/7.2.2.2                                                                                                          | Ghi nguồn CTĐT HTTT/TTNT/KHMT/CNTT                  |
| 7.2.4            | 3 phương án: Khóa luận 10, Thực tập TN 10, Thực tập dự án 6 + chọn 1 trong 4 học phần 4 TC                                                                                               |                                                     |
| 7.1.3            | Tên mục “Toán – Khoa học tự nhiên – Công nghệ – Môi trường”, 36 TC = 24 BB + chọn 4 TC toán + 6 TC khoa học tự nhiên + 2 TC Trái đất – Môi trường (trang 9–10, đối chiếu lại 22/11/2026) | Ứng dụng hiện thành mục 3 có phần con 3.1–3.4       |
| 8                | Học kỳ dự kiến của từng học phần (dùng để sắp thứ tự; dòng “CTĐT: HKx” dưới tên môn đã bỏ ngày 20/11/2026)                                                                               | Trang 22 ghi “Tổng cộng HK5” cho HK7, xem là lỗi in |

**Cập nhật 22/11/2026:** người dùng gửi báo cáo phân tích yêu cầu bản mới và `feedback.pdf` (tester báo nhập 5.0 ra D+, 3.1 ra F là sai), giao điều chỉnh theo báo cáo. `src/domain/rules.ts` chuyển sang F-02: A+ ≥ 9.0 (4.0), A ≥ 8.0 (3.5), B+ ≥ 7.0 (3.0), B ≥ 6.0 (2.5), C ≥ 5.0 (2.0), D+ ≥ 4.0 (1.5), D ≥ 3.0 (1.0), F < 3.0 (0.0); đạt ≥ 5.0; GPA tích lũy = Σ(TC × điểm hệ 10) / TC tích lũy (chỉ môn đạt, F-03 và mục 4.2); xếp loại Bảng 4 (thêm Trung bình khá 6.0–<7.0; dưới 4.0 báo cáo không ghi, ứng dụng hiện “Kém”); điểm nhập tối đa một chữ số thập phân (Điều 11 trong ảnh feedback). Bảng quy đổi trùng ảnh Điều 11 Quy chế đào tạo 2026 do tester chụp; Quy chế gốc (liên kết Google Drive trong báo cáo) chưa được mở để đối chiếu. Đoạn dưới đây là lịch sử, không còn áp dụng.

Ngày 12/11/2026 người dùng chốt **báo cáo phác thảo UI/UX là nguồn đúng nhất** cho quy tắc điểm (thay cho
phương án theo báo cáo phân tích yêu cầu dùng trước đó): học phần Đạt khi điểm hệ 10 ≥ 5.0; điểm chữ A, B+, B,
C+, C, D+, D, F tương ứng hệ 4 = 4.0/3.5/3.0/2.5/2.0/1.5/1.0/0.0, chỉ để xem; GPA tính từ điểm hệ 10, trung
bình theo TC; điều kiện tốt nghiệp GPA (hệ 10) từ 5.0 trở lên. Báo cáo UI/UX không có bảng chuẩn ngoại ngữ
(chỉ ví dụ IELTS tối thiểu 4.5) nên mức tối thiểu lấy từ Bảng 5 của báo cáo phân tích yêu cầu. Chưa đối chiếu
trực tiếp với Quy chế 1175/QĐ-KHTN mà CTĐT dẫn chiếu.

Lựa chọn của nhóm phát triển (báo cáo UI/UX chưa ghi): ngưỡng từng bậc chữ theo thang quy đổi thường dùng
(A ≥ 8.5, B+ ≥ 8.0, B ≥ 7.0, C+ ≥ 6.5, C ≥ 5.5, D+ ≥ 5.0, D ≥ 4.0, F < 4.0); xếp loại theo GPA hệ 10 (Xuất sắc ≥ 9.0,
Giỏi ≥ 8.0, Khá ≥ 7.0, Trung bình ≥ 5.0, Yếu ≥ 4.0, Kém < 4.0); mỗi nhóm tự chọn chỉ tính tối đa số TC yêu cầu vào
138 TC; năm học hiển thị tính từ năm nhập học 2026 của K26. Lưu ý: ví dụ trong bảng luồng của báo cáo UI/UX
(“nhập 8.5 → A, hệ 4 là 3.5”, “nhập 8.0 → A, hệ 4 là 3.5”) không khớp danh sách A = 4.0, B+ = 3.5 của chính báo cáo;
ứng dụng theo danh sách.

Gói font Galmuri được tải bằng `npm pack galmuri@2.40.3` vào thư mục tạm khi người dùng yêu cầu thử font pixel tiếng Việt dễ đọc hơn (20/11/2026); SHA-256 của gói: `7d6b2b8534d157dd5e4eb8e01145f7388c0383bed8a96f5ec719eaacf1f86816`, của file đã cắt `src/assets/fonts/galmuri9-vi.woff2`: `a0811e19edb2d7a6ecddcffc536e20255fcf1ac3af92ead5b57bd4db05612f09`. Mô tả gói ghi font dựa trên thiết kế font của Nintendo DS; giấy phép kèm gói là SIL OFL 1.1. Cách cắt và kiểm tra độ phủ ở `src/assets/fonts/README.md`.

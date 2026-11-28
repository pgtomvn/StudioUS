# Minh chứng sử dụng AI

Ghi lại các tương tác có ảnh hưởng đến sản phẩm, kiểm tra đầu ra trước khi chấp nhận. Không đưa dữ liệu cá nhân hoặc thông tin bí mật vào prompt.

## Nhật ký thực tế

| Ngày       | Yêu cầu / prompt                                                                        | Phần AI hỗ trợ                                                                 | Điều chỉnh và kiểm tra                                                                                                        | Trạng thái                |
| ---------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 07/11/2026 | Thiết lập môi trường và thư mục cho dự án theo dõi tiến độ học tập ngành KTPM HCMUS.    | Bộ khung thư mục, hướng dẫn và công cụ chung.                                  | Ban đầu xem xét full-stack; đọc đề bài cho thấy yêu cầu lưu LocalStorage và ngoại tuyến. Chỉ cài Prettier; npm run check đạt. | Hoàn tất thiết lập        |
| 07/11/2026 | Đọc đầy đủ projectDetail và projectRequirement; tạo file tiến độ để các agent phối hợp. | Đọc 7 trang PDF; tài liệu đối chiếu, PROGRESS.md, AGENTS.md, công cụ cập nhật. | Giữ nguyên PDF; helper cập nhật đã kiểm tra dry-run, đầu vào lỗi và cập nhật bảng/nhật ký. Chưa kiểm thử app.                 | Hoàn tất phạm vi bước này |
| 07/11/2026 | Framework hiện chỉ là tham khảo, chưa chốt 100%.                                        | Điều chỉnh toàn bộ cấu trúc và tài liệu thành độc lập framework.               | Chỉ dùng Node/npm cho công cụ chung, chưa tạo ứng dụng hoặc DB.                                                               | Đã áp dụng ràng buộc      |

## Báo cáo UI/UX ngày 08/11/2026

- Người thực hiện: root (Codex), công việc `UIREPORT-01`.
- Prompt: “Đọc file full_four_screens.docx ... trình bày đầy đủ báo cáo phác
  thảo giao diện (UI/UX) theo mẫu bố cục nội dung trong file
  ui_ux_report_template.docx. Trình bày bằng latex theo mẫu template source
  trong file latex_template.zip ... nội dung đầy đủ, không bỏ chỗ nào”.
- Thông tin bổ sung của người dùng: giảng viên Đặng Hoài Thương; Nhóm 6 gồm
  26120006 Đào Quỳnh Anh, 26120013 Phạm Đức Anh, 26120058 Trần Tiến Đạt,
  26120209 Đoàn Ngọc Thiên Kim. Đã đưa đúng thông tin lên trang bìa.
- File tạo: `deliverables/ui-ux-report/main.tex`, ba file trong `sections/`,
  logo từ mẫu, `build.ps1`, `README.md`, `CONTENT-CHECK.md`, PDF và gói nguồn
  ZIP. File cập nhật: README gốc, README thiết kế/bàn giao, nhật ký AI và
  `PROGRESS.md`. Trích xuất, ánh xạ nội dung, log biên dịch và ảnh QA ở
  `tmp/ui-ux-report/`.
- Điều chỉnh thực tế: ưu tiên đặc tả Game Pixel 2D và đủ bốn màn hình của
  nguồn chi tiết, dùng mẫu Word cho ba mục 2.1/2.2/2.3. Chuyển user flow sang
  mục 2.3; cập nhật dẫn chiếu nội bộ. Giữ các ví dụ K2026/k2026 và A/3.5,
  ghi chú mâu thuẫn cùng các ngưỡng học vụ chưa xác minh. Không tự suy ra
  quy tắc tốt nghiệp hoặc tự tạo ảnh phác thảo.
- Kiểm tra nội dung: 479/479 đoạn không rỗng đã ánh xạ, gồm 55 tiêu đề;
  424/424 đoạn thân bài và ô bảng khớp văn bản PDF sau chuẩn hóa. Đủ 11 bảng
  nội dung, D1–D4, T1–T6, luồng nhập điểm bảy bước và ba luồng dữ liệu A–C.
- Kiểm tra trình bày: chạy `build.ps1` ba lượt pdfLaTeX; xuất PDF 29 trang và
  đã xem toàn bộ 29 ảnh trang. Không có lỗi biên dịch, tràn khung, thiếu ký tự
  hoặc tham chiếu chưa xác định. MiKTeX có cảnh báo thiếu mẫu ngắt từ tiếng
  Việt trong format; không ghi nhận lỗi hiển thị. Đã sửa ngắt trang bảng Reset
  để bước cuối không bị lẻ sang trang mới.
- Xử lý môi trường: sửa đầu ra Python sang UTF-8; MiKTeX cần quyền đọc cấu
  hình ngoài sandbox và tải các gói LaTeX còn thiếu. Không cài framework hay
  công nghệ ứng dụng. Đối chiếu SHA-256 xác nhận ba đầu vào Word/ZIP và hai
  PDF đề/rubric giữ nguyên.
- Còn mở: người dùng bổ sung ảnh; nhóm đối chiếu các điểm G1–G5 trước khi
  triển khai. Chưa có kiểm thử GPA, LocalStorage hoặc ngoại tuyến của app.
- Kiểm tra công cụ và gói bàn giao: `npm run check` đạt; ZIP nguồn có 8 file,
  kiểm tra CRC và so sánh từng file với nguồn bàn giao đều đạt.

## Chỉnh báo cáo và chèn ảnh ngày 08/11/2026

- Công việc: `UIREPORT-02`, root thực hiện. Người dùng yêu cầu bảy thay đổi:
  sửa bìa và cách ghi thành viên; bỏ 2.1.2/2.1.3 và Tài liệu sử dụng; đổi
  K2026 thành K26; bỏ mục lục, danh sách hình/bảng; bỏ câu đầu 2.1.1; chèn ảnh
  từ thư mục Drive đã chỉ định; thêm dòng “Hình ảnh mang tính chất minh họa
  cấu trúc cơ bản của giao diện”.
- Đã dùng kết nối Google Drive để liệt kê và tải 9 PNG: bốn màn hình máy tính,
  bốn popup lịch và một sơ đồ tổng hợp. Đã xem từng ảnh trước khi chèn. Các
  ảnh được giữ nguyên byte, đổi tên cục bộ và ghi đối chiếu tại
  `deliverables/ui-ux-report/IMAGE-SOURCES.md`.
- File sửa: `main.tex`, ba file `sections/*.tex`, README và CONTENT-CHECK của
  báo cáo, PDF/ZIP; README gốc, README bàn giao/thiết kế, PROGRESS và nhật ký AI.
  Thêm 9 ảnh vào `figures/`. Bản trước được sao lưu ở
  `tmp/ui-ux-report/revision-02/previous-report/`.
- Đã bỏ cả mục lục lẫn danh sách hình/bảng theo cách hiểu đã báo với người dùng;
  giữ chú thích hình/bảng trong nội dung. Gỡ các ghi chú G1–G5 và tham chiếu
  đến mục bị xóa; mô tả thiết kế, mobile và toàn bộ user flow còn lại vẫn đủ.
  Các ghi chú học vụ chưa xác minh vẫn được theo dõi trong hồ sơ dự án.
- Xử lý thực tế: Node tải ảnh bị lỗi DNS trong sandbox; chuyển sang Python
  với quyền mạng và đọc UTF-8, tải đủ 9 file. Sau khi nhận ảnh đã xóa manifest
  tải có URL tạm thời; gói nguồn chỉ ghi các liên kết Drive thông thường.
- Biên dịch bằng `build.ps1` ba lượt; bản cuối 25 trang, 11 bảng và 7 nhóm hình.
  Đối chiếu đủ 420/420 đoạn thân bài/ô bảng còn phải giữ; không còn K2026,
  các mục đã yêu cầu bỏ hoặc tham chiếu lỗi. PDF có đủ 9 ảnh và logo.
- Kiểm tra trực quan: đã xem 25 ảnh trang bản đầu; chỉnh các tiêu đề và nhãn
  bảng bị lẻ ở cuối trang. Bản cuối có 9 trang thay đổi đã xem lại, 16 trang
  còn lại so sánh ảnh xác nhận giống từng pixel với bản đã xem. Không phát
  hiện tràn khung, mất chữ, méo ảnh hoặc lỗi tham chiếu.
- SHA-256 xác nhận ảnh PNG và ba đầu vào Word/ZIP, hai PDF đề/rubric giữ nguyên.
  Chưa có kiểm thử ứng dụng; công việc này chỉ sửa và kiểm tra tài liệu.
- `npm run check` đạt; ZIP nguồn mới có 18 file gồm 10 PNG (logo và 9 ảnh),
  kiểm tra CRC và đối chiếu từng file với nguồn bàn giao đều đạt.

## Chỉnh tóm tắt báo cáo ngày 08/11/2026

- Công việc `UIREPORT-03`, root. Yêu cầu: bỏ CTĐT khóa tuyển 2025 trong Tóm
  tắt bước 2; bỏ lời dẫn về bố cục mẫu và bắt đầu bằng “Mục 2.1 trình bày...”;
  bỏ dòng Phạm vi mô tả.
- Khi nhận việc, `main.tex` đã có hai phần xóa sẵn nhưng PDF còn nội dung cũ.
  Giữ thay đổi hiện có, sửa riêng lời dẫn, biên dịch lại và đồng bộ gói nguồn.
- File cập nhật: `deliverables/ui-ux-report/main.tex`, PDF, ZIP, README,
  CONTENT-CHECK, nhật ký AI và PROGRESS. Bản trước và bằng chứng kiểm tra ở
  `tmp/ui-ux-report/revision-03/`.
- Chạy `build.ps1` ba lượt; PDF 25 trang, không lỗi biên dịch, tràn khung,
  thiếu ký tự hoặc tham chiếu. Kiểm tra văn bản đạt đủ ba yêu cầu; đã xem
  ảnh trang 2 sau sửa. 24 trang khác có văn bản và ảnh giống bản đã kiểm tra.
  SHA-256 xác nhận ba file nội dung màn hình/luồng và toàn bộ ảnh giữ nguyên.
- `npm run check` đạt. Đã cập nhật ZIP nguồn 18 file, kiểm tra CRC và so sánh
  từng file với nguồn bàn giao đều đạt.

## Chỉnh đề mục vị trí ảnh và bảng ngày 08/11/2026

- Công việc `UIREPORT-04`, root. Người dùng yêu cầu đổi năm nhất/2/3/4 thành
  năm 1/2/3/4; đánh số các đề mục in đậm; đưa ảnh lên trước mô tả. Trong lúc
  làm, người dùng bổ sung yêu cầu kẻ ngang giữa các hàng bảng; đã gộp vào cùng bước.
- File sửa: `main.tex`, `sections/02-screens.tex`, `sections/03-flows.tex`, PDF,
  ZIP và README/CONTENT-CHECK của báo cáo; README gốc, README thiết kế/bàn giao,
  nhật ký AI và PROGRESS. Bản trước và bằng chứng ở
  `tmp/ui-ux-report/revision-04/`.
- Dùng đánh số tự động đến cấp paragraph/subparagraph, gồm 57 đề mục. Đổi các
  nhãn a/b/f/g cũ sang số và dẫn chiếu LaTeX; giữ các mã flow D1–D4, T1–T6,
  A–C. Đồng bộ cả mô tả năm 1 đến năm 4.
- Chuyển bảy nhóm hình về đầu màn hình hoặc phần luồng, dùng khối hình cố
  định để ảnh luôn đứng trước mô tả. Giữ đủ 9 PNG, không chỉnh nội dung ảnh.
- Thêm 51 đường kẻ ngang trong 11 bảng và khoảng đệm ô; không thay nội dung ô.
  Dùng gói needspace đã có sẵn để giữ tiêu đề, nhãn nhánh rẽ và bảng cùng nội dung.
- Biên dịch ba lượt bằng `build.ps1`, bản cuối 26 trang. Kiểm tra 420/420 đoạn
  thân bài/ô bảng còn lại khớp nguồn sau chuẩn hóa các thay đổi được yêu cầu;
  đủ 57 số đề mục, 7 nhóm hình đúng thứ tự, 51 đường kẻ, 11 bảng và 10 ảnh nhúng
  gồm logo. Không lỗi biên dịch, tràn khung, ký tự hoặc tham chiếu.
- Đã xem 24 trang nội dung; bìa/tóm tắt so sánh ảnh xác nhận giống bản đã xem.
  Sau chỉnh ngắt trang, bốn trang thay đổi được xem lại và 22 trang còn lại
  giống từng pixel. Đã giữ bảng khôi phục nguyên khối và tiêu đề luồng học
  phần cùng bảng. SHA-256 xác nhận các tài liệu đầu vào và PNG giữ nguyên.
- Đây là kiểm tra tài liệu, chưa phải kiểm thử ứng dụng.
- `npm run check` đạt; gói ZIP nguồn cuối có 18 file, CRC hợp lệ và nội dung
  từng file trùng với nguồn bàn giao hiện tại.

## Chỉnh đề mục mô tả và user flow ngày 08/11/2026

- Công việc `UIREPORT-05`, root. Các yêu cầu được gộp trong lần chỉnh này:
  “các đề mục như thẻ hồ sơ sinh viên thì vẫn cứ để đề mục bằng abc đi”;
  chuyển các bảng mô tả màn hình thành dòng như 2.2.1; “Còn phần userflow
  thì trình bày bằng bảng nhé giống luồng thao tác màn hình 4”.
- File sửa: `main.tex`, `sections/02-screens.tex`, `sections/03-flows.tex`,
  PDF/ZIP và README/CONTENT-CHECK của báo cáo; README gốc, README bàn giao/
  thiết kế, nhật ký AI và PROGRESS. Bản trước và bằng chứng kiểm tra ở
  `tmp/ui-ux-report/revision-05/`.
- Giữ số cho đề mục chính; dùng a), b), c) cho đề mục thành phần, cập nhật
  dẫn chiếu LaTeX đến Thẻ hồ sơ sinh viên và hai cửa sổ chi tiết/chỉnh sửa lịch.
  Bản cuối có 43 đề mục số và 26 đề mục chữ cái.
- Chuyển bảy bảng mô tả sang đề mục/gạch đầu dòng, giữ đủ tên vùng, vị trí,
  trường, loại nhập, tính bắt buộc, mô tả, ví dụ và phản hồi kiểm tra. Các mã
  vùng A/B/B2/C/D/E/F vẫn giữ trong tiêu đề khi có ở nguồn.
- Thêm bảng cho D1–D4 và T1–T6, giữ bốn bảng user flow cũ: tổng 14 bảng ba
  cột như màn hình 4, có 56 đường kẻ ngang. Giữ bước, nhánh rẽ, điểm bắt đầu
  và kết quả; thêm phản hồi hiển thị trung tính ở các bước nguồn chỉ mô tả
  hành động người dùng để hoàn chỉnh cột, không thêm quy tắc học vụ.
- Giữ bảy nhóm hình trước mô tả và đủ 9 PNG. Không thay nội dung ảnh.
  Sửa khoảng trắng trước dấu chấm ở các dòng ví dụ chuyển từ bảng.
- Biên dịch ba lượt bằng `build.ps1`; kiểm tra 398/398 đoạn nội dung/dữ liệu
  khớp PDF sau các chuẩn hóa được yêu cầu. 22 ô tiêu đề cột của bảy bảng mô
  tả không còn được đếm như đoạn độc lập sau chuyển sang dòng; các thuộc
  tính tương ứng vẫn có trong đề mục và nhãn. Không thiếu nội dung cần giữ.
- Bản đầu 26 trang, kiểm tra ảnh cho thấy T5 và sao lưu bị tách ngắn qua
  trang. Đã chỉnh ngắt trang; bản cuối 27 trang, giữ liền các bảng ngắn.
  Đã xem lại sáu trang thay đổi/thêm, 21 trang khác giống từng pixel với bản
  đã xem. Các trang bìa/tóm tắt và hai trang ảnh lịch giống bản đã kiểm tra
  trước. Không lỗi LaTeX, tràn khung, ký tự hoặc tham chiếu.
- SHA-256 xác nhận các tài liệu đầu vào và PNG không đổi. Đây là kiểm tra
  tài liệu, chưa phải kiểm thử ứng dụng.
- `npm run check` đạt. ZIP nguồn có 18 file, gồm logo và đủ 9 PNG; CRC hợp lệ
  và nội dung từng file khớp nguồn bàn giao. PDF và ZIP đã cập nhật tại
  `deliverables/ui-ux-report/`.

## Bổ sung mockup mobile ngày 08/11/2026

- Công việc UIREPORT-06, root. Người dùng cung cấp thư mục Drive mới và yêu
  cầu “Có ảnh mockup mobile rùi nè chèn vô luôn nha”. Đã liệt kê và tải đủ
  13 PNG bằng công cụ Google Drive; tải tham chiếu file bằng Python cần
  quyền mạng do DNS sandbox, sau đó thành công. Không tải lên/chia sẻ bên ngoài.
- Đã sao lưu bản trước, lưu manifest nguồn tại tmp/ui-ux-report/revision-06.
  Chèn 13 PNG trong chín nhóm trước nội dung Mobile của bốn màn hình;
  ảnh dài đặt riêng, các popup liên quan đặt cạnh nhau, giữ tỷ lệ và byte PNG.
- File sửa: main.tex, sections/02-screens.tex, figures, PDF/ZIP, hướng dẫn
  báo cáo; README gốc, README bàn giao/thiết kế, nhật ký AI và PROGRESS.
  Nội dung phần nguyên tắc và toàn bộ user flow giữ nguyên file nguồn.
- Đối chiếu đủ 398/398 đoạn dữ liệu/nội dung, 69 đề mục, 14 bảng/56 đường kẻ;
  PDF nhúng đủ 23 ảnh gồm logo và 22 mockup/sơ đồ. Đầu vào và ảnh cũ nguyên vẹn.
  Biên dịch ba lượt thành 37 trang, không lỗi LaTeX/layout/tham chiếu.
- Đã xem ảnh trang toàn bộ báo cáo và kiểm tra các trang mockup; chỉnh mô tả
  Tổng quan mobile để các gạch đầu dòng liền nhau sau hình. Kiểm tra tài liệu,
  chưa phải kiểm thử chức năng ứng dụng.

- `npm run check` đạt. Gói ZIP mới có 31 file, gồm 23 PNG tính cả logo;
  CRC và nội dung từng file khớp nguồn. Kiểm tra byte đủ 13 ảnh mới, file
  nguyên tắc và user flow không đổi, các nhóm ảnh trước mô tả mobile đạt.

## Khôi phục bảng f g h ngày 09/11/2026

- Công việc UIREPORT-07, root. Yêu cầu: “2.2.3.2 f) g) h) chuyển về lại
  bảng như cũ trong file Muc_32_06(archived) á”. Đã tìm thấy PDF archived
  tại thư mục báo cáo và đọc/xem trang 10–12, giữ nguyên file tham chiếu.
- Khôi phục bốn bảng: Thông tin/Ví dụ ở f), các trường Chỉnh sửa môn học ở
  g), các trường của hai tab Lịch học/Lịch thi ở h). Dùng nguồn LaTeX cũ
  tương ứng, đối chiếu đủ 26 hàng và 90 ô dữ liệu khớp archived và PDF mới.
- File sửa: sections/02-screens.tex, PDF/ZIP, README/CONTENT-CHECK của báo
  cáo, README gốc, README bàn giao/thiết kế, nhật ký AI và PROGRESS. Bản
  trước và minh chứng ở tmp/ui-ux-report/revision-07.
- Giữ nguyên ảnh, nhãn f/g/h, phần giải thích/phạm vi/quy tắc chung, trang
  bìa/tóm tắt, file nguyên tắc và user flow. Giữ 22 đường kẻ phân cách mới
  trong bốn bảng theo yêu cầu kẻ ngang trước đó; toàn báo cáo có 18 bảng,
  gồm 14 user flow, tổng 78 đường kẻ.
- Kiểm tra đủ 412/412 đoạn/ô nguồn, gồm 14 ô tiêu đề cột được khôi phục;
  không thiếu dữ liệu. Đủ 69 đề mục, 16 nhóm hình, 22 ảnh và logo; SHA-256
  xác nhận đầu vào, hai PDF tham chiếu và PNG không đổi.
- Sau lần biên dịch đầu, bảng f) bị tách ngắn qua trang. Đã giữ bảng f)
  liền trang và thu khoảng cách ngoài bốn bảng để tránh gạch đầu dòng lẻ.
  Biên dịch ba lượt, bản cuối 37 trang, không lỗi LaTeX/tràn khung/tham chiếu.
  Đã xem các trang bảng thay đổi và các trang đổi số bảng user flow; sau
  chỉnh phân trang xem lại bốn trang, 33 trang còn lại giống từng pixel với
  bản đã xem. Đây là kiểm tra tài liệu, chưa kiểm thử ứng dụng.

- `npm run check` đạt. Đã cập nhật ZIP nguồn 31 file; kiểm tra CRC và nội
  dung từng file khớp nguồn bàn giao. PDF/ZIP đã đồng bộ bản khôi phục bảng.

## Đổi danh sách một ý ngày 09/11/2026

- Công việc UIREPORT-08, root. Yêu cầu: “Đối với những mục nào mà chỉ có 1 ý
  thì đừng dùng bullet point mà thay vào đó thụt vô đầu dòng đi”.
- Rà toàn bộ nguồn LaTeX, xác định và đổi đủ 14 danh sách một ý trong
  sections/02-screens.tex thành đoạn có lệnh indent rõ ràng, dùng parindent
  1 cm đang có. Không đổi danh sách nhiều ý hoặc nội dung câu.
- File sửa: sections/02-screens.tex, PDF/ZIP, README/CONTENT-CHECK của báo
  cáo, nhật ký AI và PROGRESS. Bản trước và minh chứng được lưu tại
  tmp/ui-ux-report/revision-08.
- Biên dịch ba lượt; PDF 37 trang, không lỗi LaTeX/tràn khung/tham chiếu.
  Rà nguồn xác nhận không còn danh sách một ý. So sánh nguồn sau khi loại
  ký hiệu danh sách/đoạn cho kết quả nội dung giữ nguyên.
- Đối chiếu đủ 412/412 đoạn/ô nguồn. Đoạn bộ lọc đi qua trang nên phép kiểm
  tra đã loại đầu/chân trang lặp trước khi so sánh; không bỏ qua nội dung.
  Giữ đủ 18 bảng/78 đường kẻ, 69 đề mục, 16 nhóm hình, 22 ảnh và logo.
- Đã xem bảy trang thay đổi (4, 8, 9, 10, 18, 23, 24); 30 trang khác giống
  từng pixel với bản trước. SHA-256 xác nhận bìa/tóm tắt, nguồn nguyên tắc/
  user flow, ảnh và PDF tham chiếu không đổi. Đây là kiểm tra tài liệu.

- `npm run check` đạt. ZIP nguồn đã cập nhật đủ 31 file; kiểm tra CRC và
  nội dung từng file đều khớp nguồn bàn giao. PDF/ZIP đã đồng bộ định dạng mới.

## Đồng bộ tên luồng ngày 09/11/2026

- Công việc UIREPORT-09, root. Yêu cầu: “Những cái luồng flow của từng màn
  hình á, thành Luồng A,B,C.... hết đi cho đồng bộ”. Đã thông báo quy ước
  bắt đầu lại từ A trong mỗi màn hình trước khi chỉnh.
- Ánh xạ: Tổng quan D1–D4 thành A–D; Học phần có Luồng A; Lịch T1–T6 thành
  A–F; Dữ liệu giữ A–C. Đổi đủ 14 đề mục/chú thích; thêm đề mục Luồng A cho
  màn hình Học phần, cập nhật hai dẫn chiếu và dùng từ luồng trong lời dẫn.
- File sửa: sections/03-flows.tex, PDF/ZIP, README/CONTENT-CHECK báo cáo,
  nhật ký AI và PROGRESS. Bản trước và minh chứng lưu tại
  tmp/ui-ux-report/revision-09.
- Kiểm tra độc lập 14 phần thân bảng giữ nguyên từng ký tự, trừ hai tên
  dẫn chiếu và từ “flow” được Việt hóa. Chuỗi đề mục/chú thích theo từng
  màn hình đúng ABCD / A / ABCDEF / ABC, không còn tên hiển thị D1/T1/Flow.
- Biên dịch ba lượt, PDF 37 trang; đủ 412/412 đoạn/ô nguồn sau chuẩn hóa
  tên, 70 đề mục (44 số, 26 chữ cái), 18 bảng/78 đường kẻ, 22 ảnh và logo.
  Không lỗi LaTeX/tràn khung/tham chiếu. Đã xem chín trang luồng thay đổi;
  28 trang khác giống từng pixel. SHA-256 xác nhận bìa/tóm tắt, phần nguyên
  tắc, mô tả màn hình, PNG và PDF tham chiếu không đổi. Chưa kiểm thử app.

- `npm run check` đạt. ZIP nguồn cập nhật đủ 31 file, CRC hợp lệ và nội dung
  từng file khớp bản bàn giao. PDF/ZIP đã đồng bộ cách gọi Luồng A/B/C.

## Đổi tên vùng theo chức năng ngày 09/11/2026

- Công việc UIREPORT-10, root. Yêu cầu: “Cái phần bố cục tổng thể á ở mỗi
  mục có ghi là Vùng A, vùng B đồ, giờ ghi thẳng luôn ví dụ vùng E là điều
  kiện phụ thì ghi vùng điều kiện Phụ”.
- Đổi 12 đề mục vùng bố cục thành tên chức năng trực tiếp, giữ nhãn a/b/c;
  đổi đề mục các cột học phần và ba câu dẫn chiếu mobile: tổng 16 vị trí.
  Giữ tên đầy đủ và thông tin vị trí trái/phải; vùng nguy hiểm ghi rõ
  Đặt lại dữ liệu (Reset). Không đổi các mã Luồng A/B/C.
- File sửa: sections/02-screens.tex, PDF/ZIP, README/CONTENT-CHECK báo cáo,
  nhật ký AI và PROGRESS. Bản trước, ánh xạ tên và minh chứng lưu tại
  tmp/ui-ux-report/revision-10.
- Kiểm tra nguồn xác nhận chỉ thay các tên/dẫn chiếu được yêu cầu, không
  còn mã vùng A/B/B2/C/D/E/F trong phần chữ. Đối chiếu đủ 412/412 đoạn/ô
  nguồn sau chuẩn hóa tên, gồm B2 thành Vùng Hồ sơ sinh viên và tên Reset.
- Biên dịch ba lượt, PDF 37 trang, không lỗi LaTeX/tràn khung/tham chiếu.
  Đủ 70 đề mục, 18 bảng/78 đường kẻ, 16 nhóm hình, 22 ảnh và logo. Đã xem
  sáu trang thay đổi (8, 9, 12, 23, 24, 27); 31 trang khác giống từng pixel.
  SHA-256 xác nhận bìa/tóm tắt, nguồn nguyên tắc/user flow, PNG và PDF tham
  chiếu không đổi. Đây là kiểm tra tài liệu, chưa kiểm thử ứng dụng.

- `npm run check` đạt. Gói nguồn cập nhật 31 file, CRC hợp lệ và nội dung
  từng file khớp nguồn bàn giao; PDF/ZIP đã đồng bộ tên vùng chức năng.

## Cập nhật theo Word và mockup Drive ngày 09/11/2026

- UIREPORT-11, root. Người dùng gửi Word tại Downloads và yêu cầu cập nhật
  nội dung LaTeX theo phần bổ sung, đồng thời rà ảnh mới trong thư mục Drive.
- Đã đọc 735 đoạn/ô, 19 bảng trong Word; so với PDF trước, xác định bổ sung
  khối Tốt nghiệp (ba hình thức), các trạng thái/mobile và Luồng B. Cập nhật
  cách tách bố cục/thành phần/trạng thái, nhãn Dashboard tiếng Việt và ngày bìa.
- Chuẩn hóa lỗi ký tự từ chuyển PDF, số mục lặp, số bảng tiếp sai và sơ đồ
  lặp. Dẫn chiếu mục 7 không tồn tại được đổi thành liên kết tới Cảnh báo còn
  thiếu của Tổng quan. Giữ Họ tên (MSSV) và ký hiệu HK trống theo bản đã chốt.
  Bỏ dòng Bắt đầu/Kết quả riêng như Word, giữ 14 bảng luồng cũ nguyên vẹn.
- Đã liệt kê thư mục desktop và mobile qua Google Drive, tải đủ 22 PNG từ
  tham chiếu file của connector. So sánh byte xác định 19 ảnh thay đổi,
  ba không đổi; giữ nguyên byte khi đưa vào gói nguồn. Không tải lên Drive.
- File sửa: main.tex, ba file sections, 19 PNG thay đổi, PDF/ZIP, hướng dẫn
  và danh mục ảnh; README gốc/bàn giao/thiết kế, nhật ký AI và PROGRESS.
  Word đầu vào giữ nguyên. Bản trước và chứng cứ ở tmp/ui-ux-report/revision-11.
- Đối chiếu 695/695 mảnh nội dung Word và 35/35 tiêu đề hình/bảng đạt; 40 mảnh
  cấu trúc được xử lý bằng caption/đánh số tự động hoặc bỏ lặp sơ đồ.
  Bốn bảng f/g/h và 14 bảng luồng trước giữ nguyên; bảng mới đủ tám hàng.
- Biên dịch ba lượt thành PDF 38 trang; 71 đề mục, 19 bảng/85 đường kẻ,
  16 nhóm hình, 22 ảnh và logo. Không lỗi LaTeX/tràn khung/ký tự/tham chiếu.
  Đã xem bố cục 38 trang và kiểm tra chi tiết phần thêm, ảnh và bảng.
- Kiểm tra SHA-256 xác nhận Word mới, các đầu vào gốc, PDF tham chiếu, logo
  nguyên vẹn; PNG hiện tại khớp Drive. Chưa kiểm thử ứng dụng.

- `npm run check` đạt. Gói ZIP nguồn 31 file có đủ ảnh mới, CRC hợp lệ và
  từng file khớp nguồn bàn giao. PDF/ZIP đã cập nhật đồng bộ.

## Dựng khung giao diện pixel ngày 11/11/2026

- UIBUILD-01, root (Claude Code, mô hình Claude Fable 5.2). Prompt của người dùng (kèm ba ảnh mẫu
  giao diện game pixel và một ảnh thú bông linh vật): “Đọc bản báo cáo về phác thảo giao diện sau đó chọn
  techstacks phù hợp và dựng hoàn chỉnh cấu trúc của giao diện, lưu ý có thể chạy 100% offline và lưu
  localStorage được. Trong giao diện có nút để chỉnh màu của giao diện. Giao diện pixel style sẽ giống
  những template mà mình gửi. Tạo ảnh các element mà giao diện có sử dụng, đối với những chỗ nào không
  tạo thì để demo chỗ đó rồi sau này sẽ bổ sung sau. Và trong giao diện thì sẽ có kiểu 1 con pixel art 2d
  nhỏ xinh cute tạo ảnh dựa trên hình mình gửi, có thể tùy biến trang phục theo từng màu sắc của mỗi giao
  diện. Sử dụng skills thiết kế phù hợp với tác vụ.”
- AI đã đọc ba file `sections/*.tex` của báo cáo và năm mockup; chọn Vite + React + TypeScript + CSS thuần,
  build một file. Kiểm tra gói Fontsource để chọn font pixel có tập ký tự tiếng Việt: chỉ VT323 và
  Handjet đạt trong 17 font thử.
- File AI tạo: `index.html`, `vite.config.ts`, `tsconfig.json`, toàn bộ `src/` (app, components, styles,
  domain, data, features, lib, types), `scripts/generate-pixel-assets.mjs`, 25 PNG trong
  `src/assets/pixel/`, 9 file font và giấy phép trong `src/assets/fonts/`, `tests/unit/*.test.ts`,
  `.claude/launch.json`. File AI sửa: `package.json`, `package-lock.json`, `README.md`, `AGENTS.md`,
  `docs/architecture.md`, `docs/testing/test-plan.md`, `docs/design/README.md`, file này và `PROGRESS.md`.
- Ảnh không do mô hình tạo ảnh sinh ra: AI viết mã vẽ từng điểm ảnh rồi tự xem tờ xem trước và chỉnh
  (sửa tỉ lệ mũ/thân linh vật, vẽ lại phụ kiện vương miện, lá, nơ, ngôi sao). Ảnh mẫu của người dùng chỉ
  dùng làm tham chiếu phong cách; bố cục và hình vẽ là mới.
- Điều chỉnh sau khi tự xem trên trình duyệt: ô “Kho dữ liệu” tràn ngang, tiêu đề “Lưu ý” xếp sai, thẻ
  học phần trên điện thoại bị chồng ô, linh vật bị cắt trong khung ảnh mobile, bộ đếm ngược hẹp, favicon
  chưa nhúng vào file build.
- Phần AI không tự quyết: danh mục học phần, mốc 138 TC, ngưỡng đạt, bảng quy đổi chữ/hệ 4, xếp loại,
  chuẩn ngoại ngữ đều gắn nhãn minh họa (`RULES_VERIFIED = false`, `CURRICULUM_IS_DEMO = true`) và hiện
  ghi chú trên giao diện; chờ PLAN-01/PLAN-02.
- Kiểm tra thực tế: `npm run check` đạt (13/13 ca đơn vị), `npm run build` ra một file ~471 kB không có
  liên kết ngoài; trên `localhost:5173` đã thử nhập điểm sai/đúng, tự lưu và tải lại trang. Chi tiết và
  phần chưa kiểm ở cuối `docs/testing/test-plan.md`.

## Tinh chỉnh giao diện theo CTĐT ngày 12/11/2026

- UIBUILD-02, root (Claude Code, mô hình Claude Opus 5.5). Người dùng yêu cầu 6 ý: đổi tên StudioUS và
  dòng mô tả “Quản lí tiến độ học tập”; đọc CTĐT và báo cáo phân tích yêu cầu, thêm tick chọn môn tự chọn
  (K2026 theo CTĐT K2025); thứ tự Học kỳ → Trạng thái → Điểm và cảnh báo “Học kì bạn chọn đang vượt quá
  học kì hiện tại của bạn”; lịch không hiện tuần 0/âm và có nút chọn học kỳ (Tất cả = tới học kỳ hiện
  tại); trang Dữ liệu nhập thông tin đủ các học kỳ tới học kỳ hiện tại; xóa ba dòng ghi chú minh họa.
- AI đọc ảnh trang 8–29 của CTĐT (lớp chữ PDF lỗi nhận dạng) và báo cáo phân tích yêu cầu
  (`Muc_31_06.pdf` ở thư mục Downloads của người dùng, đã chép vào
  `docs/requirements/bao-cao-phan-tich-yeu-cau-nhom6.pdf`).
- File AI tạo: `src/data/curriculum.ts` (thay `curriculum.demo.ts`). File AI sửa: `src/types`,
  `src/domain/rules.ts`, `src/domain/progress.ts`, `src/lib/storage/storage.ts`, `src/lib/store.ts`,
  `src/lib/time.ts`, `src/lib/files.ts`, `src/data/sample.demo.ts`, bốn màn hình, `src/app/*`,
  `src/components/ui.tsx`, `src/styles/app.css`, `index.html`, `tests/unit/*`, `.claude/launch.json`,
  README, AGENTS, `docs/architecture.md`, `docs/data-sources.md`, `docs/testing/test-plan.md`,
  `docs/design/README.md`, file này và PROGRESS.
- Điều chỉnh sau khi tự xem trên trình duyệt: tên bị chuyển chữ in hoa thành “STUDIOUS” (bỏ
  text-transform), dòng GPA hệ 4 xuống dòng, ô Họ tên không cập nhật sau khi nạp dữ liệu mẫu, dòng môn tự
  chọn chưa tick quá dài trên điện thoại.
- Điểm AI tự quyết và đã ghi lại: theo báo cáo phân tích (đạt ≥ 4.0) thay vì báo cáo UI/UX (5.0); giới hạn
  TC tính vào 138 theo từng nhóm; xếp loại theo ngưỡng Bảng 4; năm học tính từ 2026.
- Kiểm tra thực tế: `npm run check` đạt (27/27), `npm run build` đạt; thao tác thử trên localhost ghi ở
  cuối `docs/testing/test-plan.md`.

## Đổi quy tắc điểm theo báo cáo UI/UX ngày 12/11/2026

- UIBUILD-03, root (Claude Code, mô hình Claude Opus 5.5). AI hỏi nên theo ngưỡng 4.0 (báo cáo phân tích yêu
  cầu) hay 5.0 (báo cáo UI/UX); người dùng trả lời: “Theo báo cáo UI/UX là chính xác nhất nhé”.
- AI đọc lại `deliverables/ui-ux-report/sections/02-screens.tex` và `03-flows.tex`, đổi `src/domain/rules.ts`
  (đạt ≥ 5.0, 8 bậc chữ, xếp loại), `src/domain/progress.ts` (bỏ GPA hệ 4, checklist GPA hệ 10 ≥ 5.0),
  Tổng quan (bỏ dòng hệ 4), huy hiệu ngoại ngữ “Chưa đạt (tối thiểu X)”, `tests/unit/progress.test.ts`.
- Khi xem lại ở khung trình duyệt rộng ~900 px, AI phát hiện bảng học phần, ô ngoại ngữ và thanh lọc tràn
  ngang ở cỡ máy tính bảng; đã chuyển bảng học phần sang dạng thẻ và cho thanh lọc xuống dòng ở ≤ 1100 px.
- Ngưỡng từng bậc chữ và xếp loại không có trong báo cáo UI/UX: AI dùng thang quy đổi thường dùng và ghi rõ
  là lựa chọn trong `docs/data-sources.md`. Phát hiện ví dụ trong bảng luồng (8.5/8.0 → A, hệ 4 3.5) mâu thuẫn
  với danh sách A = 4.0 của chính báo cáo.
- Kiểm tra: `npm run check` 28/28, `npm run build` đạt, thao tác thử trên localhost ghi ở cuối kế hoạch kiểm thử.

## Đánh số nhóm và nhãn khóa ngày 12/11/2026

- UIBUILD-04, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Ở phần quản lí học phần, các số đánh
  mục đầu trong cùng 1 khối giáo dục thì đánh từ 1,2,3... Ở phần dữ liệu, phần chọn khóa để là K26 được rồi
  bỏ chữ CTDT khóa tuyển 2025”.
- Sửa `src/features/curriculum/CoursesScreen.tsx`: nhãn đầu mỗi nhóm đổi từ số mục CTĐT (7.1.1…) sang số thứ
  tự trong khối, không đổi khi đang lọc; số mục CTĐT chuyển vào chú thích khi rê chuột. Sửa
  `src/features/data-management/DataScreen.tsx`: lựa chọn khóa chỉ còn “K26”.
- Kiểm tra: trên localhost đọc lại nhãn – Đại cương 1–7, Cơ sở ngành 1, Ngành 1–3; ô Khóa hiện “K26”.
  `npm run check` 28/28, `npm run build` đạt; bản build mới được demo `npm run preview` (DEMO-02) phục vụ.

## Đổi dẫn chiếu mục trong mô tả nhóm ngày 12/11/2026

- UIBUILD-05, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Tích lũy tối thiểu 08 TC (được tính cả
  TC vượt của mục 7.2.2.1): Sửa luôn cả dòng này thành mục 1 chứ”.
- Sửa `src/data/curriculum.ts` (mô tả nhóm Tự chọn ngành: “… TC vượt của mục 1”) và, cùng lý do, câu giới
  thiệu trong hộp chọn tự chọn tự do ở `src/features/curriculum/CoursesScreen.tsx` (“mục 1 và mục 2” thay cho
  “mục 7.2.2.1 và 7.2.2.2”).
- Kiểm tra: đọc lại hai câu trên localhost; `npm run check` 28/28, `npm run build` đạt.

## Sửa báo trùng ca thi và ẩn thanh cuộn ngày 17/11/2026

- UIBUILD-06, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Phần lịch thi á, khi mình cho hai lịch
  khác ngày khác môn nhưng cùng giờ thì lại hiện nhắc nhở trùng ca thi dù đã khác ngày. Phần thanh scroll bên
  phải ẩn đi cho đẹp giao diện”, sau đó gửi ảnh: Nhập môn 20/11 07:30 bị báo trùng “Vi tích phân 1
  (2026-11-20, 07:30)” trong khi danh sách ghi Vi tích phân 1 ngày 17/11.
- AI không tái hiện được khi chỉ có hai lịch; dựa vào ảnh, tái hiện được khi có thêm một lịch Vi tích phân 1
  ngày 20/11 gắn HK2 trong lúc học kỳ hiện tại là HK1. Nguyên nhân: lịch thuộc học kỳ lớn hơn học kỳ hiện tại
  bị ẩn khỏi trang TKB & Thi (kể cả “Tất cả”) nhưng vẫn dùng để kiểm tra trùng và đếm ngược. Ứng dụng không
  sửa ngày của lịch Vi tích phân nào.
- File sửa: `src/lib/time.ts` (thêm `findExamClash`, `semestersAhead`), `ScheduleScreen.tsx` (nút “⚠ HKx”,
  thanh cảnh báo, lời báo trùng có học kỳ/ngày/phòng), `DashboardScreen.tsx` (nhắc lịch thuộc học kỳ vượt
  quá), `app.css` (ẩn mọi thanh cuộn, kiểu nút học kỳ vượt quá), `tests/unit/progress.test.ts` (2 ca mới).
- Kiểm tra: `npm run check` 30/30, `npm run build` đạt; lặp lại tình huống trên localhost (chi tiết trong kế
  hoạch kiểm thử).

## Tương tác linh vật và logo ngày 17/11/2026

- UIBUILD-07, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Cập nhật thêm nhiều tương tác thú vị, hay ho với
  linh vật đi”. AI tự chọn bộ tương tác (không hỏi lại): 7 nét mặt, phản ứng theo sự kiện học tập, xoa đầu có cấp
  thân thiết, bấm liên tục/bấm đúp, ngủ gật khi để lâu, lời chào theo giờ, mật mã bí mật, linh vật nổi trên điện
  thoại.
- File tạo: `src/lib/mascot.ts` (kho phản ứng, ngủ gật, hàm thuần), `src/components/Pet.tsx` (linh vật tương tác,
  hiệu ứng hạt, “bộ não”). File sửa: `scripts/generate-pixel-assets.mjs` (7 khung nét mặt, icon nốt nhạc),
  `src/assets/pixel/*` (sinh lại), `src/components/ui.tsx` (Mascot có nét mặt/động tác/`live`), `src/lib/store.ts`
  (phát phản ứng ở các thao tác), `src/types`, `src/lib/storage/storage.ts` (`petCount` trong cài đặt),
  `src/app/App.tsx`, `DashboardScreen.tsx`, `src/styles/app.css`, `tests/unit/progress.test.ts`,
  `scripts/check-environment.mjs` (bỏ câu cũ “Framework: chưa chốt”), README.
- Điều chỉnh sau khi thử: mật mã không nhận khi sự kiện phím đến từ `window` (sửa kiểm tra phần tử); linh vật không
  tỉnh khi có sự kiện lúc đang ngủ (mọi phản ứng giờ đánh thức); linh vật ở khung ảnh đại diện ngủ cùng lúc;
  khoảng đệm cuối trang và thông báo trên điện thoại dời lên để không bị linh vật nổi che.
- UIBUILD-08 (chen giữa lượt, kèm ảnh): “Cái này để cái logo bên trái cái tên StudioUS, bỏ cái dòng quản lí tiến
  độ học tập đi” → sửa `App.tsx`, `app.css`; đo được logo và tên cùng hàng, không tràn.
- Kiểm tra: `npm run check` 33/33, `npm run build` đạt; thao tác thử trên localhost ghi trong kế hoạch kiểm thử.

## Bỏ chữ “(bắt buộc)” ở tên nhóm ngày 17/11/2026

- UIBUILD-09, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Sao chỉ có mỗi chỗ Toán – Khoa học tự nhiên
  (bắt buộc) là có chữ bắt buộc, vậy bỏ chữ bắt buộc ở đây đi ha”.
- Sửa tên nhóm trong `src/data/curriculum.ts` thành “Toán – Khoa học tự nhiên”; nhãn quy tắc “Bắt buộc 24 TC” giữ
  nguyên như các nhóm bắt buộc khác.
- Kiểm tra: tìm trên trang Học phần (localhost) chỉ còn tên mới, không còn “(bắt buộc)”; `npm run check` 33/33,
  `npm run build` đạt.

## Âm thanh ngày 18/11/2026

- UIBUILD-10, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Tìm kiếm hoặc tạo và tải sound effect để làm cho
  dự án thêm phần sinh động về phần nghe lẫn phần nhìn. Lưu ý cần có nút setting để giảm, tắt âm,...”; người dùng
  nhắn thêm giữa chừng: “Mình nghĩ nếu tìm kiếm mà bạn thấy có âm nào hợp thì vẫn có thể tải nhe”.
- AI tìm trên web, chọn bộ CC0 “512 Sound Effects (8-bit style)” (Juhani Junkala, OpenGameArt), tải zip 20,6 MB vào
  thư mục tạm, chỉ giải nén file WAV. Vì không nghe được, AI chọn 19 âm bằng phân tích cao độ (đi lên/đi xuống), độ
  dài, độ lớn; tự tạo thêm 4 âm (nói, xoa đầu, nhảy múa, ngáy) và nhạc nền 5 bài theo chủ đề (hợp âm + rải hợp âm,
  tự soạn bằng thuật toán).
- File tạo: `scripts/generate-sfx.mjs`, `src/assets/sfx/*.wav` (23 file), `src/lib/sound.ts`, `src/lib/music.ts`,
  `src/components/SoundPanel.tsx`, `tests/unit/sound.test.ts`. File sửa: `src/types/index.ts`,
  `src/lib/storage/storage.ts`, `src/lib/store.ts`, `src/lib/mascot.ts`, `src/components/ui.tsx`,
  `src/components/Pet.tsx`, `src/app/App.tsx`, `src/styles/app.css`, `scripts/generate-pixel-assets.mjs` (icon loa,
  loa tắt), `src/assets/pixel/*` (sinh lại), `package.json` (lệnh `sfx`), `.claude/launch.json` (cấu hình xem bản
  build), README và tài liệu.
- Điều chỉnh sau khi thử: bảng cài đặt lúc đầu nằm trong thanh bên nên bị nội dung trang che → chuyển lên cấp ứng dụng
  (giống bảng chọn màu); kiểm thử đọc file bằng API Node không qua được kiểm tra kiểu (dự án không có `@types/node`)
  → đọc file qua `import.meta.glob(..., { query: "?inline" })`.
- Kiểm tra: `npm run check` 42/42, `npm run build` đạt; thử trên localhost và bản build ghi trong kế hoạch kiểm thử.

## Lý thuyết/Thực hành và chỉnh âm thanh ngày 18/11/2026

- UIBUILD-11, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Về phần lịch học, thì các môn đều có chia ra môn
  lý thuyết và thực hành, nên mục chọn bạn cho chọn thêm thực hành và lý thuyết nhé / Bỏ hiệu ứng khi click vào các
  element nha / Trong setting âm thanh á, bỏ mục nghe thử đi, với lại cái sound cho tốt nghiệp thì sao cho nó vui tươi
  phấn khởi chứ, bỏ cả dòng Hiệu ứng: bộ... / Với cả dòng mà chỗ nhạc nền: Bỏ dòng bài "...", rồi đổi nhạc khi đổi nền
  đồ”; nhắn thêm giữa chừng: “Text Lý Thuyết / Thực hành để dưới tên môn giống như cái thời gian và số phòng học ý”.
- Lúc đầu AI đặt nhãn “LT/TH” trước tên môn; sau tin nhắn thêm đã đổi thành một dòng chữ đầy đủ dưới tên môn và bỏ
  nhãn. Nhạc đổi theo chủ đề màu đã có từ UIBUILD-10; AI kiểm tra lại trên trình duyệt (đổi Thảo nguyên → Arcade) và
  chỉ bỏ dòng tên bài. Âm tốt nghiệp mới do AI tự soạn (rải hợp âm Đô trưởng đi lên, giai điệu có bè, trống dồn,
  chũm chọe, nốt lấp lánh), không dùng giai điệu có sẵn.
- File sửa: `src/types/index.ts` (`ClassKind`, `ClassEntry.kind`), `src/lib/storage/storage.ts`, `src/data/sample.demo.ts`,
  `src/lib/files.ts` (tên sự kiện .ics ghi Lý thuyết/Thực hành), `src/features/schedule/ScheduleScreen.tsx`,
  `src/lib/sound.ts`, `src/components/SoundPanel.tsx`, `src/components/Pet.tsx`, `src/styles/app.css`,
  `scripts/generate-sfx.mjs`, `src/assets/sfx/graduate.wav` (mới), `tests/unit/storage.test.ts`,
  `tests/unit/progress.test.ts`, README và tài liệu.
- Kiểm tra: `npm run check` 42/42, `npm run build` đạt; thử trên localhost ghi trong kế hoạch kiểm thử.

## Giáo dục thể chất và nút logo ngày 18/11/2026

- UIBUILD-12, root (Claude Code, mô hình Claude Opus 5.5). Prompt (nhắn giữa lượt UIBUILD-11): “À cập nhật thêm cái
  mục thể dục nha, vẫn có môn học thể dục á, phần thể chất đó có mục thể chất luôn, rồi điều kiện phụ vẫn để thể chất
  đó, nếu người học học xong thể chất 1 2 thì đạt, còn ở mục trên chọn miễn thì chọn miễn, hoặc đang học thì là chưa”
  và “Và cái nút có logo + chữ StudioUS khi click vào thì tự quay lại trang Tổng quan”.
- AI tự quyết định: mục Thể chất đặt ngay trên Điều kiện phụ; “học xong” hiểu là Đã hoàn thành với điểm đạt (≥ 5.0)
  như các môn khác; Thể dục không cộng TC (HUD, linh vật không báo “+TC”); bỏ giá trị “Đạt” bấm tay cũ.
- File sửa: `src/data/curriculum.ts` (`PE_GROUP`), `src/domain/progress.ts` (`peCourses`, `peState`,
  `scheduleCourses`, điều kiện tốt nghiệp, cảnh báo học kỳ), `src/lib/store.ts`, `src/data/sample.demo.ts`,
  `src/features/curriculum/CoursesScreen.tsx`, `src/features/schedule/ScheduleScreen.tsx`, `src/app/App.tsx`,
  `src/styles/app.css`, `tests/unit/progress.test.ts`, README và tài liệu.
- Điều chỉnh sau khi thử: trình duyệt chưa nhận CSS mới qua HMR nên nút logo hiện nền xám mặc định; tải lại trang thì
  đúng (nền trong suốt).
- Kiểm tra: `npm run check` 45/45, `npm run build` đạt; thử trên localhost ghi trong kế hoạch kiểm thử.

## Khối Giáo dục thể chất ngày 18/11/2026

- UIBUILD-13, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm ảnh thanh khối “Tốt nghiệp 0 / 10 TC”: “Phần
  giáo dục thể chất cũng thiết kế như vậy đi cho đồng bộ”.
- Đổi mục Giáo dục thể chất từ khung riêng sang khối thu gọn dùng lại kiểu `.block`/`.block-head` (nhãn “x / 4 TC”,
  “Miễn” khi được miễn, thanh tiến độ theo TC Thể dục đã đạt); ô tìm/bộ
  lọc áp dụng cho cả Thể dục, khối ẩn khi lọc theo một khối CTĐT cụ thể.
- Người dùng nhắn thêm: “Bỏ nút "Tới mục thể chất"” → đã bỏ nút này ở mục Điều kiện phụ (khối mở bằng thanh đầu
  khối như các khối khác).
- File sửa: `src/features/curriculum/CoursesScreen.tsx`, `src/styles/app.css`, README và tài liệu.
- Kiểm tra: `npm run check` 45/45, `npm run build` đạt; thử trên localhost ghi trong kế hoạch kiểm thử.

## Bỏ dòng ghi chú ngày học kỳ ngày 18/11/2026

- UIBUILD-14, root (Claude Code, mô hình Claude Opus 5.5). Prompt: trích dòng “Ngày bắt đầu dùng để đánh số tuần học
  (Tuần 1 bắt đầu từ thứ Hai của tuần đó); ngày kết thúc dùng để biết học kỳ có bao nhiêu tuần ở trang TKB & Thi.” và
  “Bỏ dòng này đi”.
- File sửa: `src/features/data-management/DataScreen.tsx` (bỏ đoạn `field-hint` dưới bảng học kỳ). Cách đánh số tuần
  không đổi.
- Kiểm tra: `npm run check` 45/45, `npm run build` đạt; xem trên bản build ở localhost:4173.

## Thanh thông tin, font Galmuri9, tiếng linh vật, ô chọn ngày 20/11/2026

- UIBUILD-15, root (Claude Code, mô hình Claude Opus 5.5). Prompt (kèm ảnh thanh thông tin): thanh thông tin cố định
  khi cuộn; bỏ dòng “CTĐT:…” dưới tên môn; giãn dòng trên điện thoại; tắt âm rồi mà bấm linh vật vẫn kêu; tìm font
  pixel tiếng Việt dễ nhìn cho chữ thân bài và thử thay. Nhắn thêm giữa lượt: “Phần thanh thông tin kéo lên thì nó
  stick vị trí này luôn chứ đừng kéo lên sát lề trên”. Lượt sau (kèm 3 ảnh): ô “Chọn HK” không hiện hết chữ; khung
  xanh Kho dữ liệu và ghi chú Điều kiện phụ cần giãn ra.
- Tìm font: tra Fontsource API và web; tải `galmuri@2.40.3`, Fusion Pixel 10/12 px vào thư mục tạm; viết script Node
  đọc bảng cmap (WOFF2 giải nén bằng brotli của Node) để đếm chữ có dấu. Cài fontTools vào thư mục tạm (không cài vào
  dự án; lệnh cài vào Python của người dùng bị chặn nên không dùng) để cắt Galmuri9.
- AI tự quyết định: chọn Galmuri9 thay VT323 (Galmuri11 bị nhòe vì tỉ lệ lẻ); `size-adjust: 80%` để giữ bố cục; lỗi
  linh vật được hiểu là công tắc “tiếng bấm” không áp dụng cho linh vật (nút Tắt âm tổng đã chặn đúng khi thử) nên
  đánh dấu `touch` cho phản ứng do chạm linh vật và đổi nhãn công tắc; giữ ghi chú khác trên dòng phụ của tên môn;
  bảng học phần dùng dạng thẻ tới 1280 px vì phát hiện cột cuối bị cắt ở 1101–1279 px.
- File sửa: `src/styles/themes.css`, `src/styles/app.css`, `src/assets/fonts/` (thêm `galmuri9-vi.woff2`,
  `LICENSE-Galmuri.txt`, README), `src/lib/sound.ts`, `src/lib/mascot.ts`, `src/lib/store.ts`,
  `src/components/Pet.tsx`, `src/components/SoundPanel.tsx`, `src/features/curriculum/CoursesScreen.tsx`,
  `tests/unit/sound.test.ts`, README và tài liệu.
- Điều chỉnh sau khi thử: lần đầu HUD dính ở 4 px (sát lề) → người dùng yêu cầu giữ chỗ cũ → 24 px và che khoảng trống
  bằng ảnh nền; trên điện thoại HUD bị thanh trên che → cố định thanh trên 64 px, HUD dính ở 82 px; Galmuri9 cỡ gốc làm
  nút “Xuất lên Google Calendar” tràn → thêm `size-adjust`.
- Kiểm tra: `npm run check` 46/46, `npm run build` đạt; thử trên bản build ghi trong kế hoạch kiểm thử.

## Lưu ý của tester ngày 21/11/2026

- UIBUILD-16, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm 4 ảnh lưu ý của tester (chữ “Học kì” chìm ở
  giao diện Thảo nguyên; dấu X thông báo ngày thi lệch; chữ bị ngắt dòng giữa từ; viết hoa “Khối Ngành / Chuyên
  ngành” không đồng bộ; ô thông tin sinh viên trống; gợi ý thêm “Hoàn tác” 10 giây thay cho hỏi xác nhận): “Xem và thử
  lại những lưu ý này từ tester, nếu có thì fix lại những chỗ đó”.
- Nhắn thêm giữa lượt: “Cần đang học và buổi học tới được rồi”; “Mình muốn khối bên trái bằng độ cao của hai khối bên
  phải và bố cục chỗ hành trang thiết kế cho thẩm mỹ hơn…”; “À thôi mình nghĩ là trang trí gì thêm chỗ đó được rồi…”;
  “Thôi bỏ trang trí luôn đi, nhìn không hợp”. Kết quả cuối: không thêm nội dung vào thẻ hồ sơ, chỉ giữ việc cân đáy
  hai cột (khối Kỹ năng giãn).
- AI tự quyết định: nhãn nằm thẳng trên ảnh nền dùng ô màu thanh bên; danh sách Nhiệm vụ gộp khối vào dòng phụ dưới
  tên; danh sách từ ghép dùng khi hiển thị (`src/lib/text.ts`) vì CSS không tách từ tiếng Việt; “Đặt lại toàn bộ” vẫn
  giữ bước gõ RESET rồi thêm Hoàn tác; hoàn tác có phạm vi để không xóa thay đổi khác; thêm hoàn tác cho nạp dữ liệu
  mẫu và khôi phục từ file vì cũng ghi đè dữ liệu.
- File sửa: `src/components/ui.tsx`, `src/lib/store.ts`, `src/lib/text.ts` (mới), `src/data/curriculum.ts`,
  `src/domain/progress.ts`, `src/features/curriculum/CoursesScreen.tsx`, `src/features/dashboard/DashboardScreen.tsx`,
  `src/features/data-management/DataScreen.tsx`, `src/features/schedule/ScheduleScreen.tsx`, `src/styles/app.css`,
  `tests/unit/text.test.ts`, `tests/unit/undo.test.ts` (mới), README và tài liệu.
- Điều chỉnh sau khi thử: `text-wrap: balance` vẫn tách giữa từ ở 1120 px → thêm `keepWords`; ô thời khóa biểu hẹp bị
  “Vi tích phâ / n 2” khi giữ từ ghép → bỏ `keepWords` ở ô lưới; thẻ hồ sơ qua ba phương án (bốn dòng thông tin, hai
  dòng, túi đồ trang trí) rồi bỏ theo yêu cầu người dùng, xóa luôn hàm tính buổi học tới không còn dùng.
- Kiểm tra: `npm run check` 54/54, `npm run build` đạt; thử trên bản build ghi trong kế hoạch kiểm thử.

## Góp ý feedback.pdf và báo cáo phân tích yêu cầu cập nhật ngày 22/11/2026

- UIBUILD-17, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Mình vừa thêm file feedback.pdf vào dự án, bạn xem
  qua rồi cùng thảo luận chỉnh sửa lại như vậy để sản phẩm ổn hơn, bản báo cáo phân tích yêu cầu mình cũng vừa update
  lại bạn đọc qua rồi điều chỉnh nhé”. Nhắn thêm giữa lượt: “Tạo icon khác cho chỗ môn phái nhé”, “Tạo icon mới chỗ Hồ
  sơ sinh viên luôn nhé”.
- AI đọc `feedback.pdf` (4 trang, 13 ý) và báo cáo (7 trang), đối chiếu CTĐT trang 9–10 cho mục 7.1.3, rồi hỏi người
  dùng 4 điểm cần quyết định. Người dùng chọn: “Môn phái: Kỹ thuật phần mềm”; nhắc thi giữ 4 ô pixel; thêm MSSV + ngành
  (chưa thêm “lần học”); chia cột buổi học trùng giờ.
- AI tự quyết định: bảng quy đổi và GPA theo F-02/F-03 của báo cáo mới; xếp loại dưới 4.0 vẫn “Kém” (báo cáo không
  ghi); điểm nhập tối đa một chữ số thập phân; tên file sao lưu `student_k2026.json` theo F-06; thêm chọn màu vào cả
  cửa sổ sửa lịch học; màu chữ trên lịch tự đổi theo nền; icon “faction” (cờ môn phái có dấu nhắc lệnh “>_”) và
  “student” (thẻ sinh viên) vẽ thêm trong `scripts/generate-pixel-assets.mjs`.
- File sửa: `src/domain/rules.ts`, `src/domain/progress.ts`, `src/data/curriculum.ts`, `src/types/index.ts`,
  `src/lib/storage/storage.ts`, `src/lib/time.ts`, `src/lib/color.ts` (mới), `src/components/ui.tsx`,
  `src/features/*`, `src/styles/app.css`, `scripts/generate-pixel-assets.mjs`, `src/assets/pixel/icon-faction.png`,
  `src/assets/pixel/icon-student.png`, `tests/unit/*` (thêm `schedule.test.ts`), AGENTS.md, README và tài liệu.
- Điều chỉnh sau khi thử: “8.7% hoàn thành” gãy dòng trong cột Kinh nghiệm → chuyển % lên dòng số TC; icon cờ 20 px khó
  nhìn → 24 px; ô chọn màu tự do lộ khung mặc định → ẩn ô chọn của trình duyệt trong ô cầu vồng; trang Học phần 375 px
  tràn ngang (nhãn Giáo dục thể chất không xuống dòng, lỗi có từ trước) và ô tick đè mã môn → sửa.
- Kiểm tra: `npm run check` 59/59, `npm run build` đạt; thử trên bản build ghi trong kế hoạch kiểm thử.

## Bộ dữ liệu mẫu đủ chức năng ngày 22/11/2026

- UIBUILD-18, root (Claude Code, mô hình Claude Opus 5.5). Prompt: “Bộ dữ liệu mẫu là đầy đủ để test các chức năng
  nhé”. Nhắn thêm giữa lượt: “Chỗ icon này cho cùng size với các icon như hồ sơ sinh viên nè, rồi dòng lưu trên…. thì
  ngang luôn cũng được” (ảnh khung Kho dữ liệu) và “Chỗ này để Dùng rồi xuống dòng Linh vật á” (ảnh nút “Dùng linh
  vật” xuống 3 dòng).
- AI liệt kê các trường hợp cần phủ theo F-01 – F-06 và các tính năng đã làm, viết lại `src/data/sample.demo.ts` (sinh
  viên giả HK2, MSSV giả 26120000) và thêm `tests/unit/sample.test.ts` kiểm tra độ phủ; khung Kho dữ liệu dùng phần đầu
  khung chung (icon cỡ mặc định, nhãn ở hàng tiêu đề, rút gọn chữ để vừa ở 1024 px); thêm “linh vật” vào danh sách từ
  ghép; ô Ngành đổi sang ô chữ chỉ xem để xuống dòng trên điện thoại (phát hiện khi thử ở 375 px).
- File sửa: `src/data/sample.demo.ts`, `tests/unit/sample.test.ts` (mới), `tests/unit/text.test.ts`, `src/lib/text.ts`,
  `src/features/data-management/DataScreen.tsx`, `src/styles/app.css`, README và tài liệu.
- Kiểm tra: `npm run check` 66/66, `npm run build` đạt; thử trên bản build ghi trong kế hoạch kiểm thử.

## Lịch học kỳ sau không hiện ngày 22/11/2026

- UIBUILD-19, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm ảnh cảnh báo HK3: “Thông báo cảnh báo có lịch học
  vào HK3 nhưng HK3 không có lịch nào, kiểm tra lại nhé. Dữ liệu bộ kiểm mẫu á”.
- Nguyên nhân: thời khóa biểu chỉ dựng tuần cho học kỳ đã có ngày bắt đầu; ngày của học kỳ sau học kỳ hiện tại không nhập
  được, nên lịch HK3 không bao giờ hiện (không riêng bộ mẫu). Sửa: `classesWithoutWeeks` (`src/lib/time.ts`) lấy lịch
  của học kỳ chưa có ngày bắt đầu để hiện theo thứ trong tuần, kèm nhãn giải thích; lời nhắc “nhập thông tin học kỳ”
  chỉ còn khi không có lịch nào để hiện.
- File sửa: `src/lib/time.ts`, `src/features/schedule/ScheduleScreen.tsx`, `src/styles/app.css`,
  `tests/unit/sample.test.ts`, tài liệu.
- Kiểm tra: `npm run check` 67/67, `npm run build` đạt; thử trên bản build ghi trong kế hoạch kiểm thử.

## Góp ý vòng tiếp và bộ mẫu đã hoàn thành ngày 22/11/2026

- UIBUILD-20, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm 6 ảnh: tên “Sinh viên mẫu” xuống dòng ở màn hình
  < 1293 px cần giãn dòng; giãn chữ ô Hạng; “Test trường hợp như trên ảnh” (vượt 138 TC: thanh đầy, số thực tế, còn lại
  0, đổi màu hoàn thành); kiểm tra công thức GPA; bỏ “xem ở trang…” và xuống dòng ở cảnh báo; bỏ đánh số khi khối chỉ có
  một nhóm; bỏ nhập MSSV; thẻ môn < 1365 px tách Chữ, Hệ 4, Kết quả thành ô có nhãn, thu nhỏ ô Học kỳ, Trạng thái. Nhắn
  thêm giữa lượt: “Tạo 2 bộ dữ liệu mẫu nhé, 1 bộ như hiện tại và 1 bộ khi mà đã hoàn thành full môn học nhé”.
- AI phát hiện TC tích lũy hiển thị (giới hạn theo khối) khác tập môn ở mẫu số GPA; tách `earned` (thực tế) và `counted`
  (tính vào yêu cầu); GPA hiện 2 chữ số thập phân để khớp ngưỡng xếp loại; bộ mẫu đã hoàn thành sinh từ danh mục CTĐT (điểm
  cố định theo mã học phần); hai nút chọn bộ mẫu ở Tổng quan và Dữ liệu; khối ô của thẻ môn dùng `display: contents` ở
  bảng rộng và hàng tự xuống dòng ở dạng thẻ; cột GPA/Hạng rộng theo nội dung sau khi GPA dài hơn.
- File sửa: `src/domain/progress.ts`, `src/data/sample.demo.ts`, `src/features/dashboard/DashboardScreen.tsx`,
  `src/features/curriculum/CoursesScreen.tsx`, `src/features/data-management/DataScreen.tsx`, `src/types/index.ts`,
  `src/lib/storage/storage.ts`, `src/styles/app.css`, `tests/unit/*`, README và tài liệu.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; thử trên bản build ghi trong kế hoạch kiểm thử.

## Sửa bản điện thoại ngày 22/11/2026

- UIBUILD-21, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm 4 ảnh chụp điện thoại: ngày học kỳ lòi khỏi khung;
  cửa sổ Đặt lại nằm thấp bị bàn phím che; ô ngày/giờ trong Thêm lịch dài hơn ô khác và có thanh cuộn ngang; nút
  Sửa/Xóa sát ô “Còn x ngày”. “Giờ là fix ở bản mobile nhé”.
- Nguyên nhân chung: ô ngày/giờ trên Safari iOS có bề rộng tối thiểu theo chữ; cửa sổ trên điện thoại được thiết kế
  trượt từ đáy. Sửa: ô ngày/giờ co theo cột (`min-width: 0`, riêng iOS bỏ giao diện mặc định), lưới `minmax(0, 1fr)`,
  ô ngày học kỳ có nhãn và mỗi ô một hàng trên điện thoại, cửa sổ sát phía trên, giãn nút Sửa/Xóa; phát hiện thêm thanh
  nhắc thi trên điện thoại mất ngày giờ nên hiện lại dạng chữ.
- File sửa: `src/styles/app.css`, `src/features/data-management/DataScreen.tsx`,
  `src/features/schedule/ScheduleScreen.tsx`, tài liệu.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; thử bằng Chrome giả lập 375 px; chưa thử trên iPhone thật.

## Thẻ hồ sơ và thẻ môn bớt chen chúc ngày 22/11/2026

- UIBUILD-22, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm 2 ảnh: “Chỗ thông tin này bị chen chúc quá trong
  khi phía trên thì trống. Để GPA và Hạng chung 1 hàng, cái Kinh nghiệm 1 hàng. Màn hình <1365 px Giãn dòng, giãn khoảng
  cách giữa các phần (HK, Trạng thái…) xíu cho nó đỡ chen chúc. Cái Kết quả cho to ra miếng để nổi bật hơn. Còn cái 3 TC
  thì để gần lại cho đỡ lạc lõng nhé”.
- Sửa CSS: lưới chỉ số 2 cột với Kinh nghiệm cả hàng; thẻ môn giãn dòng và khoảng cách, nhãn Kết quả to hơn, số TC đặt
  ngay sau mã. Phát hiện và sửa thêm: ô chứng chỉ TOEIC làm trang Học phần tràn ngang ở 1200 px.
- File sửa: `src/styles/app.css`, tài liệu.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; thử bản build ở 1200 px và 375 px.

## Số 0 dễ nhầm với 8 ngày 22/11/2026

- UIBUILD-23, root (Claude Code, mô hình Claude Opus 5.5). Prompt kèm ảnh thẻ hồ sơ: “Chỗ GPA đang dễ nhầm lẫn số 0 với 8
  nè có cách nào fix hong”.
- Nguyên nhân: số lớn dùng font tiêu đề Handjet, số 0 có chấm giữa. Sửa: lớp `.num` (font thân bài Galmuri9, làm đậm
  bằng bóng cùng màu) cho GPA, ô đếm ngược lịch thi và ba ô số ở trang Học phần. Prompt tiếp: “đổi font chỗ hạng luôn
  được không” → chữ xếp loại cũng dùng `.num` (giữ in hoa); tiêu đề vẫn giữ Handjet. Prompt tiếp: “Chỗ này cùng để in hoa chữ
  CHƯA CÓ đi” → ô GPA cũng in hoa.
- File sửa: `src/styles/app.css`, `src/features/dashboard/DashboardScreen.tsx`,
  `src/features/curriculum/CoursesScreen.tsx`, tài liệu.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; xem trên bản build với hai bộ mẫu.

## Mẫu cho các bước tiếp theo

- Ngày, người thực hiện, công cụ/mô hình nếu có:
- Prompt nguyên văn hoặc trích đoạn đủ ngữ cảnh:
- File/chức năng AI tạo hoặc sửa:
- Vấn đề phát hiện, prompt điều chỉnh và thay đổi thực tế:
- Cách kiểm tra và kết quả thực tế:
- Link/file minh chứng được phép chia sẻ:

Trước khi nộp: bổ sung prompt tiêu biểu cho phân tích, thiết kế UI, sinh mã và ngoại tuyến; mô tả phần nhóm tự kiểm tra/chỉnh sửa. Chỉ ghi những lần đã thực hiện.

## LOCAL-01 — Mở localhost (11/11/2026, root)

- Prompt: “Local host để mình xem dự án”.
- Phạm vi sửa: `PROGRESS.md`, `docs/ai/usage-log.md`; không sửa mã nguồn ứng dụng.
- Đã đọc README, PROGRESS, AGENTS, package.json, cấu hình Vite và kiểm tra Git.
- Lần chạy Vite trong sandbox có listener nhưng HTTP không phản hồi; đã dừng đúng tiến trình vừa tạo và chạy lại `npm run dev -- --host 127.0.0.1` ngoài sandbox.
- Kiểm tra trực tiếp bằng curl bỏ proxy: `http://127.0.0.1:5173/` trả HTTP 200. Đã yêu cầu mở tab localhost trong Codex (công cụ trả trạng thái queued).
- Đây là kiểm tra máy chủ phục vụ trang, không phải nghiệm thu chức năng hoặc ngoại tuyến. Máy chủ giữ chạy cho người dùng xem.

## DEMO-01 — Mở lại ngrok (11/11/2026, root)

- Prompt: “Chạy ngrok để mình mở public cho mọi người xem thử”.
- File tạo/sửa: bản build `dist/index.html`, `PROGRESS.md`, nhật ký này; phản hồi dùng đối chiếu tại `tmp/ngrok-demo/public-response.html`. Không sửa mã ứng dụng.
- `npm run build` đạt, một file HTML 470,85 kB. Chạy `npm run preview -- --host 127.0.0.1` và `ngrok http http://127.0.0.1:4173 --host-header=rewrite --log=stdout --log-format=json`; giữ dev cổng 5173.
- URL: https://bea-empathic-caringly.ngrok-free.dev . Kiểm tra public bằng curl với header bỏ trang cảnh báo ngrok: HTTP 200, tiêu đề FIT Quest, SHA-256 HTML trùng bản build.
- Tunnel tạm thời được mở theo yêu cầu người dùng; cần giữ máy và các tiến trình preview/ngrok chạy. Khách có thể phải bấm Visit Site ở trang cảnh báo của ngrok. Đây là kiểm tra phục vụ bản demo, không phải nghiệm thu toàn bộ chức năng.

## DEMO-01 / LOCAL-01 — Tắt demo và server (12/11/2026, root)

- Prompt: “Tắt ngrok tắt server”.
- Chỉ sửa `PROGRESS.md` và nhật ký này; không sửa mã ứng dụng.
- Đã xác minh tiến trình theo cổng và dòng lệnh dự án trước khi dừng: Vite dev PID 67924 (5173), Vite preview PID 88880 (4173), ngrok PID 67816 (4040).
- Kiểm tra sau dừng: ba cổng không còn listener, không còn tiến trình ngrok; URL public trả HTTP 404. Không chạy lại server hoặc tunnel.

## LOCAL-01 — Mở lại localhost (12/11/2026, root)

- Prompt: “Mở local host”.
- Chỉ cập nhật `PROGRESS.md` và nhật ký này; không sửa mã ứng dụng.
- Khởi động `npm run dev -- --host 127.0.0.1` tại cổng 5173 (session 29651). Curl trực tiếp trả HTTP 200; đã yêu cầu mở trang trong Codex, công cụ trả queued.
- Giữ server chạy cho người dùng xem tại http://127.0.0.1:5173/ . Không mở lại ngrok; đây là kiểm tra phục vụ trang, không phải nghiệm thu chức năng.

## LOCAL-01 — Mở localhost StudioUS (13/11/2026, root)

- Prompt: “Mở local host”.
- Chỉ cập nhật `PROGRESS.md` và nhật ký này; giữ nguyên mã ứng dụng và thay đổi hiện có.
- Khởi động `npm run dev -- --host 127.0.0.1` ở cổng 5173 (session 27493). Curl trực tiếp trả HTTP 200, tiêu đề StudioUS · Quản lí tiến độ học tập.
- Đã yêu cầu mở http://127.0.0.1:5173/ trong Codex; công cụ trả queued. Giữ server chạy để người dùng xem, không khởi động ngrok. Kiểm tra này xác nhận phục vụ trang, không nghiệm thu toàn bộ chức năng.

## LOCAL-01 — Mở lại localhost (14/11/2026, root)

- Prompt: “Mở lại local host”.
- Phạm vi sửa: `PROGRESS.md`, nhật ký này; không sửa mã ứng dụng.
- Cổng 5173 chưa có listener; đã khởi động `npm run dev -- --host 127.0.0.1` (session 56785). Curl trả HTTP 200, tiêu đề StudioUS · Quản lí tiến độ học tập.
- Đã yêu cầu mở http://127.0.0.1:5173/ trong Codex (queued). Giữ server chạy cho người dùng xem; không khởi động ngrok. Đây là kiểm tra phục vụ trang, không nghiệm thu chức năng.

## LOCAL-01 — Tắt server (14/11/2026, root)

- Prompt: “Tắt server”.
- Chỉ sửa `PROGRESS.md` và nhật ký này; không sửa mã ứng dụng.
- Đã xác minh tiến trình Node/Vite của D:\NMCNTT trên cổng 5173, dừng PID 116164; kiểm tra sau dừng không còn listener tại cổng 5173. Không khởi động lại server.

## GIT-01 — Banner README và đưa dự án lên GitHub (20/11/2026, root)

- Prompt: “Commit dự án lên Github của mình. Link repo: https://github.com/pgtomvn/StudioUS”; bổ sung: “Phần README đầu repo có thể thiết kế ảnh banner ngang của dự án để tăng tính thẩm mỹ”, sau đó “Bỏ hai cái này đi” (dòng mô tả và hàng nhãn trên banner).
- Tạo `docs/assets/readme-banner.html` (chỉ dùng ảnh pixel và font cục bộ của dự án) và xuất `docs/assets/readme-banner.png` 2560x640 bằng Edge headless; chèn banner vào đầu `README.md`.
- Repo đích là public; người dùng chọn không đưa lên các PDF/DOCX/ZIP, báo cáo LaTeX (`deliverables/`) và file không liên quan (`.claude/`). Đã thêm vào `.gitignore`, sửa `scripts/check-environment.mjs` để thiếu tài liệu gốc chỉ cảnh báo, ghi rõ trong README.
- Kiểm tra: `npm run check` đạt (doctor, Prettier, tsc, 46/46 ca Vitest). Không chạy lại build vì không đổi mã ứng dụng.

## GIT-01 — README tiếng Anh và commit lại (20/11/2026, root)

- Prompt: “Return commit vừa rồi và commit lại bản mới. Phần README là tiếng Anh nhé. Mấy cái thông tin lời văn liên quan đến báo cáo đồ án thì bỏ hết. Phần trạng thái chỉ nhiêu đây thôi: … Bỏ mục quy trình làm việc”.
- Sửa `README.md`: dịch toàn bộ sang tiếng Anh; bỏ đoạn mô tả báo cáo UI/UX, ghi chú file chỉ giữ ở máy và mục Quy trình làm việc; phần Status giữ đúng nội dung người dùng đưa.
- Gỡ hai commit đã push và tạo lại một commit gốc mới, force push lên `main`. Kiểm tra: `npm run check` đạt (46/46).

## SRCREPORT-01 — Rà soát báo cáo Bộ mã nguồn & HDSD và chụp ảnh giao diện (22/11/2026, root)

- Prompt: “Bạn review và xem lại bản báo cáo như vậy là chi tiết và đúng chưa, và có thể kèm theo một tệp zip các ảnh giao diện để chèn vào bản báo cáo nhé” (kèm `Bao_cao_Bo_ma_nguon_va_Huong_dan_su_dung_Nhom6.docx`).
- Đọc báo cáo bằng script Python trích XML (máy không có pandoc); không sửa file Word gốc.
- Đối chiếu với `src/lib/storage/storage.ts`, `src/data/curriculum.ts`, `src/data/sample.demo.ts`, các màn hình, `package.json`, `docs/data-sources.md`; chạy `npm run check` (54/54) và `npm run build` (852 kB).
- Chụp 19 ảnh từ `dist/index.html` qua `file://` bằng Edge headless điều khiển qua DevTools Protocol (script trong scratchpad, không thêm dependency); ẩn lời thoại linh vật vì đổi theo giờ. Đã xem lại từng nhóm ảnh, chụp lại một lần để bỏ thông báo thừa và đổi định dạng ngày sang vi-VN.
- Kết quả: `deliverables/StudioUS_anh-giao-dien_Nhom6.zip` (19 PNG + danh sách chú thích). Nhận xét báo cáo gửi người dùng trong chat; không sửa mã ứng dụng, không commit/push.

## PKG-01 — Đóng gói bản dùng thử một file HTML (22/11/2026, root)

- Prompt: “Giờ mình muốn gửi sản phẩm thử thì khi mà mở click đúng 1 file html hay gì đó thì giao diện đầy đủ á hoặc đóng thành exe hay sao, bạn thử đề xuất nhé”; sau đề xuất, người dùng chọn “Package the HTML file”.
- AI đề xuất gửi một file HTML (bản build đã tự chứa mọi tài nguyên) thay cho exe (Electron nặng, trái quyết định công nghệ; exe không ký số dễ bị SmartScreen/antivirus chặn, không chạy trên macOS); GitHub Pages để làm phương án phụ, chưa bật.
- Tạo `deliverables/StudioUS-ban-thu/` (`StudioUS.html`, `HUONG-DAN.txt`) và `deliverables/StudioUS-ban-thu.zip`; không sửa mã ứng dụng.
- Điều chỉnh: lệnh sed thêm dòng hướng dẫn không khớp do ký tự xuống dòng → ghi lại file bằng Node (UTF-8 BOM, CRLF) rồi nén lại.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; giải nén zip và mở qua `file://` bằng Edge headless, giao diện hiển thị đủ. Chưa thử trên máy khác.

## PKG-02 và GIT-05 — Bản final và commit (22/11/2026, root)

- Prompt: “Commit mới lên Github và đóng zip file html final nhé. File hướng dẫn bỏ dòng góp ý”.
- Tạo `deliverables/StudioUS-final/` (`StudioUS.html`, `HUONG-DAN.txt` không còn mục GÓP Ý và chữ “bản dùng thử”) và `deliverables/StudioUS-final.zip`; không sửa mã ứng dụng.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; giải nén zip, so hash với `dist/index.html`, mở qua `file://` bằng Edge headless hiển thị đủ.
- Commit thường các thay đổi UIBUILD-21/22/23 và push lên `main`.

## UIBUILD-24 — Tên file sao lưu theo ngày (22/11/2026, root)

- Yêu cầu người dùng: đổi tên file sao lưu từ `student_k2026.json` (F-06 trong báo cáo) về `student_k26_YYYY-MM-DD.json` theo ngày xuất file.
- File sửa: `src/lib/storage/storage.ts` (`exportFileName(date)` thay hằng `EXPORT_FILE_NAME`), `src/features/data-management/DataScreen.tsx`, `tests/unit/storage.test.ts`, `tests/unit/sample.test.ts`, README, `docs/architecture.md`, kế hoạch kiểm thử.
- Kiểm tra: `npm run check` 72/72, `npm run build` đạt; màn Dữ liệu trên bản build hiện `student_k26_2026-11-22.json`.

## PKG-03 và GIT-06 — Đóng gói lại bản final và commit (22/11/2026, root)

- Prompt: “Commit lại mã nguồn và đóng gói lại file zip với file html mới sửa nhé để vào source-report và xóa file zip cũ để file zip mới thành StudioUS-final.zip nhé”.
- Build lại từ mã có UIBUILD-23 (GPA in hoa “CHƯA CÓ”) và UIBUILD-24; cập nhật `deliverables/StudioUS-final/StudioUS.html`, xóa `deliverables/source-report/StudioUS-final.zip` cũ và nén lại cùng tên; `HUONG-DAN.txt` giữ nguyên.
- Commit thường và push lên `main`.

## UIBUILD-25 — Góp ý vòng 28/11/2026 (28/11/2026, root)

- Yêu cầu người dùng (tóm tắt): Tổng quan thêm GPA học kỳ hiện tại, sửa lỗi Nhiệm vụ không cập nhật khi đổi lại môn sau khi đã đủ điều kiện; Học phần thêm lọc Đạt/Chưa đạt, công cụ tính điểm (trọng số Lý thuyết/Thực hành, thành phần, điểm cộng), trạng thái Học lại có lịch sử học lại; TKB đổi chữ nút Google Calendar có chú thích, “gần nhất trước” → “gần nhất”; Dữ liệu thêm khóa K25, xuất JSON/CSV/Excel, thêm học kỳ, đổi chữ Sao lưu/Khôi phục; cập nhật bộ mẫu. Bổ sung giữa chừng: bỏ điểm chữ ở trang Học phần; icon khác cho GPA học kỳ, ghi “GPA tổng”; “(thang 10)” cùng hàng nhãn, bỏ “/ 10.0”, chia đều 3 ô; điểm cộng 0–1, báo lỗi ngay dưới ô khi nhập ngoài khoảng, sửa giao diện công cụ; đổi tên thành “Công cụ tính điểm học phần”.
- Nguyên nhân lỗi Nhiệm vụ: danh sách chỉ gồm học phần thuộc 138 TC; Thể dục, GDQP-AN, chuẩn ngoại ngữ không có nên vẫn hiện “đã hoàn thành” dù Trùm cuối đã đổi.
- Quyết định của agent, cần người dùng xem lại: GPA học kỳ tính mọi học phần có điểm trong học kỳ (kể cả chưa đạt và lần học trước); học lại thì lần gần nhất được tính vào TC và GPA tổng. Báo cáo yêu cầu có trường “lần học” nhưng không nêu hai công thức này; chưa đối chiếu Quy chế. Giới hạn 16 học kỳ là giới hạn của ứng dụng. Khóa K25 dùng cùng CTĐT khóa tuyển 2025 đang có. File Excel tự tạo (ZIP không nén + XML), không thêm thư viện.
- File: `src/domain/progress.ts`, `src/domain/rules.ts`, `src/types/index.ts`, `src/lib/{store,time,files,export,xlsx}.ts`, `src/lib/storage/storage.ts`, `src/features/curriculum/{CoursesScreen,ScoreTools}.tsx`, `src/features/dashboard/DashboardScreen.tsx`, `src/features/schedule/ScheduleScreen.tsx`, `src/features/data-management/DataScreen.tsx`, `src/components/ui.tsx`, `src/styles/app.css`, `scripts/generate-pixel-assets.mjs` (icon `calculator`, `heartTerm`), `src/data/sample.demo.ts`, `tests/unit/{sample,feedback-28-11}.test.ts`.
- Bổ sung theo yêu cầu “Phiên bản dữ liệu lên V3 nha sau đó commit các thay đổi”: `DATA_VERSION = 3`, thêm `migrateV2` (v2 → v3), khôi phục nhận v1, v2, v3; thêm ca kiểm thử file v2.
- Kiểm tra: `npm run check` 97/97, `npm run build` đạt; xem bản build ở 375–1920 px; file .xlsx/.csv do ứng dụng tạo mở được bằng openpyxl. Chưa thử Microsoft Excel và iPhone thật.

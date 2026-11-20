# Thiết kế giao diện

Đã soạn [báo cáo phác thảo UI/UX Nhóm 6](../../deliverables/ui-ux-report/README.md)
từ `full_four_screens.docx`, cập nhật ngày 09/11/2026 theo bản Word mới
`bao_cao_ui_ux_nhom6.docx` người dùng gửi, theo bố cục
`ui_ux_report_template.docx` và cách trình bày trong `latex_template.zip`.

Báo cáo gồm Tổng quan, Quản lý Học phần và Điểm, Thời khóa biểu và Lịch thi,
Nhập xuất Dữ liệu; mô tả desktop/mobile, trạng thái, biểu mẫu và đầy đủ user
flow. Bản chỉnh sửa cuối có 38 trang, đề mục chính đánh số và đề mục thành
phần dùng a/b/c. Mô tả màn hình trình bày bằng dòng, riêng 2.2.3.2 f/g/h dùng
bốn bảng đã khôi phục theo bản archived ngày 09/11/2026; toàn bộ 15 luồng thao tác
trình bày bằng bảng có kẻ ngang giữa hàng. Ảnh được đặt trước phần mô tả tương ứng. Mã nguồn LaTeX,
script biên dịch, bản PDF và hướng dẫn chèn ảnh nằm trong
`deliverables/ui-ux-report/`.

Đã chèn đủ 22 PNG người dùng cung cấp: 9 ảnh desktop/sơ đồ từ thư mục cũ và
13 mockup mobile từ thư mục mới, gồm bốn màn hình và các popup/bộ lọc.
Các ảnh lưu cục bộ trong gói nguồn, giữ nguyên nội dung và tỷ lệ; đặt trước
mô tả tương ứng. Đã rà cả hai thư mục Drive ngày 09/11/2026, thay 19 ảnh
được cập nhật và xác nhận ba ảnh còn lại không đổi.

Theo yêu cầu mới, đã chỉnh bìa, đổi K2026 thành K26, bỏ mục lục/danh sách
hình/bảng, mục 2.1.2/2.1.3 và phần Tài liệu sử dụng. Kiểm tra nghiệp vụ còn
mở ở PLAN-01/PLAN-02; việc bỏ phần ghi chú khỏi báo cáo không xác nhận các
ví dụ điểm và ngưỡng học vụ là quy tắc chính thức.

Thiết kế không đồng nghĩa đã chọn framework hoặc đã kiểm thử ứng dụng.

## Giao diện đã dựng (11/11/2026)

Khung giao diện pixel của bốn màn hình nằm ở `src/`. Ảnh nền, linh vật và icon do
`scripts/generate-pixel-assets.mjs` vẽ và ghi vào `src/assets/pixel/`; chạy `npm run assets` để sinh lại
(kèm tờ xem trước ở `tmp/pixel-preview.png`). Tên ứng dụng: StudioUS (12/11/2026). Ba ghi chú “minh họa” trên giao diện đã được gỡ theo yêu cầu.

# Hướng dẫn phối hợp agent

## Đọc trước khi làm

1. Đọc `README.md`, `PROGRESS.md` và kiểm tra các thay đổi hiện có.
2. Đọc `projectDetail.pdf` và `projectRequirement.pdf` khi cần quyết định phạm vi; xem đối chiếu tại `docs/requirements/traceability.md`.
3. Đọc tài liệu liên quan đến nhiệm vụ. Hai PDF gốc phải được giữ nguyên.

## Các quyết định hiện tại

- Không triển khai chức năng ngoài công việc được giao.
- **Công nghệ đã chốt ngày 11/11/2026 (người dùng giao chọn): Vite + React + TypeScript + CSS thuần, build một file `dist/index.html`.** Chi tiết ở `docs/architecture.md`. Không thêm backend, ORM, thư viện UI hoặc dependency runtime mới khi chưa có quyết định của người dùng.
- Tên ứng dụng: **StudioUS**, dành cho sinh viên K26 theo CTĐT khóa tuyển 2025. Thanh bên chỉ có logo bên trái tên (người dùng bỏ dòng mô tả ngày 17/11/2026); “Quản lí tiến độ học tập” chỉ còn ở tiêu đề tab.
- Danh mục học phần `src/data/curriculum.ts` chép từ CTĐT chính thức (`CTDT-KTPM-2025.pdf`, đối chiếu bằng ảnh trang). Quy tắc điểm `src/domain/rules.ts` theo **báo cáo phác thảo UI/UX** – người dùng chốt ngày 12/11/2026 là nguồn đúng nhất (đạt ≥ 5.0, điểm chữ A/B+/B/C+/C/D+/D/F, hệ 4 chỉ để xem, GPA hệ 10, tốt nghiệp GPA hệ 10 ≥ 5.0). Mức tối thiểu chuẩn ngoại ngữ lấy từ Bảng 5 của báo cáo phân tích yêu cầu (`docs/requirements/bao-cao-phan-tich-yeu-cau-nhom6.pdf`). Chưa đối chiếu Quy chế 1175/QĐ-KHTN – ghi rõ trạng thái này khi báo cáo.
- Điều kiện Giáo dục thể chất (người dùng chốt 18/11/2026): suy ra từ mục Thể dục 1, 2 ở trang Học phần – đạt cả hai môn → Đạt, chọn Miễn → Miễn, còn lại → Chưa; Thể dục không tính vào 138 TC và GPA.
- Đối tượng: ngành Kỹ thuật Phần mềm HCMUS, CTĐT khóa tuyển 2025.
- Dữ liệu cá nhân lưu LocalStorage; sản phẩm cần hoạt động ngoại tuyến, tài nguyên cục bộ, không phụ thuộc CDN/API/AI trực tuyến khi sử dụng.
- Phải kiểm chứng quy tắc học tập bằng nguồn chính thức. Con số trong rubric không thay cho việc đọc CTĐT. Chưa xác minh thì ghi rõ trạng thái, không đoán công thức.
- Không sử dụng kết quả học tập thật của người khác khi chưa được phép.

## Nhận việc và chia file

- Ghi mã công việc, người/agent phụ trách, phạm vi file và trạng thái trước khi sửa.
- Mỗi file có một người sửa tại một thời điểm. Chia tác vụ độc lập theo file/thư mục; không ghi đè thay đổi của người dùng hoặc agent khác.
- Agent điều phối sở hữu `PROGRESS.md` khi nhiều agent chạy song song. Agent con gửi kết quả sau từng bước cho điều phối để cập nhật ngay; không sửa file này cùng lúc.
- Nếu agent làm độc lập, tự cập nhật `PROGRESS.md` sau mỗi bước. Công cụ cập nhật không có khóa đồng thời: phải tuân thủ một người ghi.
- Không khởi tạo commit, push, xuất bản hay gửi tài liệu cho bên ngoài nếu chưa được giao việc đó.

## Bắt buộc cập nhật sau mỗi bước

`PROGRESS.md` là nguồn chung về trạng thái, không chỉ là nhật ký cuối phiên. Mỗi bước có ý nghĩa (đọc đầu vào, tạo bộ khung, cài công cụ, chạy kiểm tra, xử lý lỗi, bàn giao) phải được ghi lại. Không đánh dấu xong chỉ vì đã tạo file.

```powershell
npm run progress -- --step SETUP-03 --status in_progress --agent root --message "Đang tạo cấu trúc; đã kiểm tra các file hiện có."
```

Trạng thái hợp lệ: `todo`, `in_progress`, `blocked`, `done`. Công cụ cập nhật dòng công việc đã có và thêm nhật ký có thời gian Việt Nam. Với việc mới, thêm dòng vào bảng trước; không đổi mã công việc cũ. Khi cần sửa bảng hoặc bàn giao, giữ nguyên nhật ký cũ.

Một cập nhật phải cho người tiếp theo biết: đã làm gì, file nào đổi, đã kiểm tra gì, có vướng mắc gì. Ghi kết quả thực tế; phân biệt kiểm tra môi trường với kiểm thử ứng dụng. Đánh dấu `blocked` phải nêu điều kiện để tiếp tục.

## Kiểm tra và bàn giao

- Với tài liệu/công cụ chung và mã ứng dụng: `npm run check` (doctor, định dạng, kiểu, kiểm thử đơn vị); đổi giao diện thì chạy thêm `npm run build` và xem trên trình duyệt.
- Khi chưa có ứng dụng, không ghi rằng GPA, LocalStorage hoặc ngoại tuyến đã vượt kiểm thử.
- Khi bổ sung ứng dụng, bổ sung lệnh chạy/build và kiểm thử phù hợp vào `package.json`, README, kế hoạch kiểm thử.
- Mọi thay đổi công nghệ cần cập nhật quyết định trong `docs/architecture.md` và `PROGRESS.md`.
- Minh chứng AI ghi tại `docs/ai/usage-log.md`: prompt, file được tạo/sửa, kiểm tra và điều chỉnh thực tế. Không bịa lịch sử họp, phân công hay kết quả.
- Kết thúc bước hoặc phiên: ghi công việc đang mở, chủ sở hữu, kết quả kiểm tra và hành động tiếp theo vào `PROGRESS.md`.

# Kiến trúc

Ứng dụng hỗ trợ sinh viên ngành Kỹ thuật Phần mềm HCMUS khóa tuyển 2025 theo dõi học tập. Yêu cầu đã xác định là lưu trên thiết bị bằng LocalStorage và hoạt động ngoại tuyến sau khi được chuẩn bị đầy đủ.

## Quyết định công nghệ (11/11/2026, UIBUILD-01)

Người dùng giao việc chọn công nghệ khi yêu cầu dựng giao diện. Đã chốt:

| Hạng mục            | Lựa chọn                                                                            | Lý do                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ngôn ngữ, giao diện | TypeScript 7 + React 19                                                             | Bốn màn hình có nhiều trạng thái phụ thuộc nhau (HUD, thanh tiến độ, cảnh báo cập nhật cùng lúc); kiểu tĩnh giúp giữ đúng cấu trúc dữ liệu lưu trữ. |
| Công cụ build       | Vite 8 + `vite-plugin-singlefile`                                                   | Gom JS, CSS, font, ảnh vào một file `dist/index.html`, mở trực tiếp hoặc qua localhost, không cần mạng.                                             |
| Kiểu dáng           | CSS thuần với biến màu theo `data-theme`                                            | Phong cách pixel cần kiểm soát từng điểm ảnh (viền bậc thang bằng box-shadow, `image-rendering: pixelated`); không thêm thư viện UI.                |
| Trạng thái          | Kho nhỏ tự viết (`useSyncExternalStore`)                                            | Mọi thay đổi đi qua một chỗ và tự ghi LocalStorage; không cần thư viện quản lý trạng thái.                                                          |
| Điều hướng          | Hash (`#/dashboard`…) tự viết                                                       | Chạy được cả khi mở bằng `file://`.                                                                                                                 |
| Font                | Galmuri9 (thân bài, từ 20/11/2026), Handjet (tiêu đề), VT323 dự phòng; nhúng cục bộ | Font pixel có đủ dấu tiếng Việt; giấy phép OFL. Galmuri9 thay VT323 vì nét rõ, chữ không dính (người dùng yêu cầu font dễ đọc hơn).                 |
| Ảnh                 | PNG sinh bằng `scripts/generate-pixel-assets.mjs`                                   | Không phụ thuộc nguồn ngoài, tái tạo được, đổi trang phục linh vật theo chủ đề.                                                                     |
| Kiểm thử            | Vitest (đơn vị)                                                                     | Dùng chung cấu hình Vite; lớp lưu trữ nhận kho giả nên không cần trình duyệt.                                                                       |
| Âm thanh (18/11)    | Web Audio API của trình duyệt + WAV 8-bit nhúng                                     | Không thêm thư viện; hiệu ứng là file WAV sinh bằng `scripts/generate-sfx.mjs` (bộ CC0 + âm tự tạo), nhạc nền tổng hợp trực tiếp từ nốt nhạc.       |

Chưa dùng service worker/PWA: bản một-file đã đáp ứng chạy ngoại tuyến. Nếu sau này phát hành trên web thì cân nhắc bổ sung và kiểm thử riêng.

LocalStorage dùng hai khóa: `studious:data` (dữ liệu học tập, `version` 2) và `studious:settings` (chủ đề màu…). Khi dữ liệu đọc lên bị hỏng, ứng dụng mở trạng thái trống và giữ bản hỏng ở `studious:data:corrupt`. Dữ liệu của bản dựng đầu (khóa `fitquest:*`, phiên bản 1) được tự chuyển sang khóa mới và nâng lên phiên bản 2 khi mở ứng dụng.

`conditions.pe` (18/11/2026, UIBUILD-12) chỉ còn dùng để ghi **Miễn** (`exempt`); trạng thái Đạt/Chưa của Giáo dục thể chất được suy ra từ kết quả Thể dục 1, 2 (`peState` trong `src/domain/progress.ts`). Giá trị `pass` bấm tay ở bản cũ không còn được dùng, nên dữ liệu cũ cần nhập kết quả Thể dục 1, 2 để điều kiện này chuyển Đạt. Thể dục 1, 2 nằm trong `PE_GROUP` (không thuộc `GROUPS`) nên không ảnh hưởng tổng TC, GPA và tiến độ các khối.

Lịch học có thêm trường `kind` (`theory` = Lý thuyết, `lab` = Thực hành; 18/11/2026, UIBUILD-11). Dữ liệu vẫn là phiên bản 2: lịch cũ hoặc file sao lưu cũ thiếu trường này được coi là Lý thuyết khi đọc.

`studious:settings` có thêm mục `sound` (18/11/2026, UIBUILD-10): `muted`, `master`, `effects`, `music` (0–1), `musicOn`, `ui`. Cài đặt cũ thiếu mục này được điền mặc định (hiệu ứng bật, nhạc nền tắt); giá trị sai kiểu bị thay bằng mặc định, âm lượng được kẹp 0–1.

Phiên bản 2 (12/11/2026) thêm: `selections` (môn tự chọn đã tick theo nhóm), `profile.semesters` (ngày bắt đầu/kết thúc từng học kỳ), `semester` cho từng lịch học/lịch thi, `conditions.langScore2` (TOEIC Nói–Viết).

## Trạng thái khởi tạo

Đã có giao diện bốn màn hình chạy được (bảng học phần chuyển sang dạng thẻ ở màn hình ≤ 1365 px, vì bảng 11 cột cần hàng rộng khoảng 962 px và cột tên ≥ 230 px), lưu LocalStorage và build một-file. Danh mục học phần (`src/data/curriculum.ts`) chép từ CTĐT chính thức; quy tắc điểm (`src/domain/rules.ts`) theo báo cáo phác thảo UI/UX (người dùng chốt 12/11/2026), chưa đối chiếu trực tiếp quy chế đào tạo. Khối ngành/chuyên ngành dùng cách dồn TC vượt của mục 7.2.2.1 sang 7.2.2.2 và tự chọn tự do (CTĐT mục 7.2.2.2, 7.2.3). Chưa có bằng chứng nghiệm thu ngoại tuyến trên máy thật (ngắt mạng, đóng/mở trình duyệt).

## Tổ chức thư mục

| Đường dẫn                                         | Trách nhiệm dự kiến                                     |
| ------------------------------------------------- | ------------------------------------------------------- |
| `src/domain/`                                     | Quy tắc GPA, tín chỉ, tiến độ độc lập giao diện         |
| `src/features/dashboard/`                         | Tổng hợp tiến độ và kết quả                             |
| `src/features/curriculum/`                        | Danh sách môn và yêu cầu CTĐT                           |
| `src/features/academic-records/`                  | Ghi nhận kết quả học tập                                |
| `src/features/data-management/`                   | Quản lý dữ liệu trên thiết bị                           |
| `src/lib/storage/`                                | Đọc, ghi và kiểm tra dữ liệu LocalStorage               |
| `src/types/`                                      | Mô tả kiểu/cấu trúc dữ liệu sau khi chọn công nghệ      |
| `src/assets/`, `public/data/`, `public/icons/`    | Tài nguyên được đóng gói cục bộ                         |
| `tests/unit/`, `tests/integration/`, `tests/e2e/` | Kiểm thử phép tính, lưu trữ và luồng sử dụng            |
| `docs/`                                           | Yêu cầu, thiết kế, kiểm thử, AI, kế hoạch, họp và nguồn |
| `deliverables/`                                   | Sản phẩm nộp đã hoàn thiện                              |

Các thư mục xác định vị trí phát triển, không xác nhận chức năng đã hoạt động. Luồng dự kiến: giao diện nhận thao tác, kiểm tra đầu vào, cập nhật trạng thái, lưu qua lớp LocalStorage và tính lại số liệu bằng các hàm nghiệp vụ.

## Hướng thiết kế dữ liệu cần hoàn thiện

- Tách danh mục môn khỏi kết quả từng lần học. Giữ lịch sử học lại/cải thiện để xử lý theo quy định được xác minh.
- Gắn chương trình và quy tắc với phiên bản K2025. Chỉ hỗ trợ khóa khác sau khi bổ sung nguồn tương ứng.
- Phân biệt điểm chưa nhập với điểm bằng `0`; không tự suy ra tín chỉ đạt.
- Dữ liệu lưu nên có phiên bản cấu trúc. Cần kiểm tra JSON lỗi, trường thiếu, trường hợp hết dung lượng hoặc trình duyệt từ chối lưu.
- Chỉ triển khai công thức sau khi có nguồn, ví dụ đối chiếu và ca kiểm thử. Không dùng ngưỡng tự đặt để kết luận điều kiện tốt nghiệp.

Đây là định hướng thiết kế; chưa có mô hình dữ liệu hoặc chuyển đổi phiên bản được coi là hoàn thiện.

## Lưu trữ và ngoại tuyến

LocalStorage giữ dữ liệu người dùng; cơ chế cache tài nguyên ứng dụng cần được chọn và triển khai sau khi chốt kiến trúc. Service worker/PWA là một phương án tham khảo. Cache tài nguyên và lưu dữ liệu phải được kiểm thử riêng.

Không phụ thuộc CDN, font, icon, API hay dịch vụ AI trực tuyến trong lúc sử dụng. Công cụ cài đặt ban đầu có thể cần Internet; yêu cầu ngoại tuyến áp dụng cho ứng dụng đã được chuẩn bị đầy đủ. Nếu dùng service worker, cần phục vụ qua localhost hoặc HTTPS và kiểm thử trên bản phát hành tương ứng.

LocalStorage gắn với origin: đổi giao thức, hostname, cổng hoặc hồ sơ trình duyệt có thể tạo vùng dữ liệu khác. Xóa dữ liệu trang hoặc dùng chế độ riêng tư có thể làm mất dữ liệu. Cơ chế sao lưu/khôi phục cần được xác định khi thiết kế màn hình quản lý dữ liệu.

Không cần backend hoặc tài khoản trực tuyến trong phạm vi đề bài. Chỉ dùng dữ liệu giả khi phát triển; không lưu mật khẩu cổng sinh viên vào LocalStorage. Nếu bổ sung server hoặc chia sẻ hồ sơ về sau, cần thiết kế xác thực và kiểm tra quyền sở hữu trước khi đưa dữ liệu thật lên server.

Hoàn tác (21/11/2026, UIBUILD-16): thao tác xóa/ghi đè không còn hỏi xác nhận (trừ “Đặt lại toàn bộ” vẫn gõ RESET) mà làm ngay rồi hiện thông báo “Hoàn tác” 10 giây (`undoToast` trong `src/components/ui.tsx`). `actions.restore(before, scope)` trong `src/lib/store.ts` chỉ lấy lại phần vừa đổi (kết quả học phần, danh sách chọn, phương án tốt nghiệp, một lịch học/lịch thi) nên giữ các thay đổi khác làm trong lúc đó; `actions.restoreAll(before)` dùng cho đặt lại, nạp dữ liệu mẫu, khôi phục từ file. Ảnh chụp chỉ nằm trong bộ nhớ, tải lại trang là mất.

Xuống dòng tiếng Việt: trình duyệt chỉ ngắt ở dấu cách nên hay tách đôi một từ ghép. `keepWords` (`src/lib/text.ts`) nối các từ ghép thường gặp trong tên học phần, tên nhóm và câu cảnh báo bằng dấu cách không ngắt khi hiển thị (danh sách Nhiệm vụ, tên môn, tên nhóm, thẻ ngày ở TKB, lịch thi); dữ liệu gốc và tìm kiếm không đổi. Không dùng trong ô thời khóa biểu dạng lưới vì ô quá hẹp.

Vòng góp ý 22/11/2026 (UIBUILD-17): quy tắc điểm theo báo cáo phân tích yêu cầu bản cập nhật (xem `src/domain/rules.ts`); `Profile.studentId` (MSSV, 8 chữ số, rỗng = chưa nhập; dữ liệu cũ tự bổ sung "", phiên bản dữ liệu vẫn 2); ngành cố định `MAJOR_NAME`; file sao lưu tên `student_k2026.json` (F-06); `SECTIONS` trong `src/data/curriculum.ts` gom các nhóm cùng mục CTĐT nhiều phần (7.1.3) thành một mục có phần con; `layoutOverlaps` (`src/lib/time.ts`) chia cột cho buổi học trùng giờ; `src/lib/color.ts` gồm 7 màu mặc định và `inkOn` chọn màu chữ theo nền khi người dùng chọn màu tự do. Thanh cuộn vẫn ẩn toàn ứng dụng, riêng danh sách Nhiệm vụ và thân cửa sổ có thanh cuộn pixel.

Thời khóa biểu học kỳ chưa có ngày bắt đầu (UIBUILD-19): không chia được theo tuần nên hiện lịch theo thứ trong tuần (`classesWithoutWeeks`), kèm nhãn giải thích; học kỳ sau học kỳ hiện tại luôn rơi vào trường hợp này vì ngày học kỳ chỉ nhập tới học kỳ hiện tại.

Vòng góp ý 22/11/2026 (UIBUILD-20): `Stats.earned` là **TC tích lũy thực tế** (tổng TC học phần đạt đã chọn, tính cả môn tự chọn học dư, có thể vượt 138; cũng là mẫu số GPA tích lũy), `Stats.counted` là TC tính vào yêu cầu tốt nghiệp (mỗi nhóm/khối tối đa số TC quy định), `Stats.missing = 138 − counted`; thanh Kinh nghiệm theo `counted` nên đầy và đổi màu hoàn thành khi đủ 138 theo từng khối. GPA hiện 2 chữ số thập phân để khớp ngưỡng xếp loại. Bỏ trường MSSV (`Profile.studentId`) theo yêu cầu người dùng. Hai bộ dữ liệu mẫu: `createSampleData` (đang học HK2) và `createCompletedSampleData` (đã hoàn thành, HK8), liệt kê ở `SAMPLES`.

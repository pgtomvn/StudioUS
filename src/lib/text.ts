/**
 * Giữ các từ ghép tiếng Việt trên cùng một dòng khi xuống dòng.
 *
 * Trình duyệt chỉ biết ngắt ở dấu cách, mà tiếng Việt viết cách từng âm tiết, nên nhãn hẹp hay bị
 * tách đôi một từ (“đại / cương”, “giải / thuật”). Bộ từ của ứng dụng là cố định (tên học phần trong
 * CTĐT, tên nhóm, câu cảnh báo), nên dùng danh sách từ ghép thường gặp và nối chúng bằng dấu cách
 * không ngắt (U+00A0). Chỉ dùng khi hiển thị; dữ liệu gốc và ô tìm kiếm giữ dấu cách thường.
 */
const COMPOUNDS = [
  // ba âm tiết (đặt trước để khớp trọn)
  "vi tích phân",
  "hồ chí minh",
  // tên học phần và nhóm trong CTĐT
  "an ninh",
  "anh văn",
  "bảo mật",
  "chính trị",
  "chủ đề",
  "chủ nghĩa",
  "chuyên ngành",
  "cơ sở",
  "công nghệ",
  "cộng sản",
  "cấu trúc",
  "di động",
  "dữ liệu",
  "dự án",
  "đại cương",
  "đại số",
  "đám mây",
  "điện toán",
  "điều hành",
  "đối tượng",
  "đồ họa",
  "giải thuật",
  "giáo dục",
  "hệ thống",
  "hóa học",
  "học máy",
  "học phần",
  "học sâu",
  "khai thác",
  "khóa luận",
  "khoa học",
  "kinh tế",
  "kỹ năng",
  "kỹ thuật",
  "lập trình",
  "lịch sử",
  "mã hóa",
  "máy tính",
  "môi trường",
  "nâng cao",
  "ngôn ngữ",
  "ngoại ngữ",
  "nhân tạo",
  "nhập môn",
  "pháp luật",
  "phân tích",
  "phát triển",
  "phần mềm",
  "phương án",
  "phương pháp",
  "quản lý",
  "quốc phòng",
  "rời rạc",
  "sinh học",
  "tích phân",
  "thể chất",
  "thể dục",
  "thiết bị",
  "thiết kế",
  "thị giác",
  "thông minh",
  "thông tin",
  "thống kê",
  "thuật toán",
  "thực hành",
  "thực tập",
  "tính toán",
  "tổ hợp",
  "toán học",
  "tốt nghiệp",
  "trái đất",
  "triển khai",
  "triết học",
  "trí tuệ",
  "tư duy",
  "tư tưởng",
  "tuyến tính",
  "tự chọn",
  "tự nhiên",
  "ứng dụng",
  "vận hành",
  "vật lí",
  "vật lý",
  "việt nam",
  "xác suất",
  "xã hội",
  "xử lý",
  // câu trạng thái, cảnh báo
  "chưa đạt",
  "đang học",
  "hoàn thành",
  "học lại",
  "học kỳ",
  "tín chỉ",
];

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
const PATTERN = new RegExp(
  `(^|[^\\p{L}\\p{M}])(${[...COMPOUNDS]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|")})(?=$|[^\\p{L}\\p{M}])`,
  "giu",
);
const NBSP = String.fromCharCode(0xa0);

export function keepWords(text: string): string {
  return (
    text
      .normalize("NFC")
      .replace(PATTERN, (_match, lead: string, word: string) => lead + word.replace(/\s+/g, NBSP))
      // tên riêng có gạch nối: không tách quanh dấu gạch
      .replace(/Mác\s+–\s+Lênin/g, `Mác${NBSP}–${NBSP}Lênin`)
      // thứ trong tuần: “Thứ 2” không tách
      .replace(/Thứ\s+(\d)/g, `Thứ${NBSP}$1`)
  );
}

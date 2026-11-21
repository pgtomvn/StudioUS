import type { BlockId, Course, CourseGroup, GradOptionId } from "../types";

/**
 * CHƯƠNG TRÌNH ĐÀO TẠO NGÀNH KỸ THUẬT PHẦN MỀM – KHÓA TUYỂN 2025
 * (Quyết định 2818/QĐ-KHTN ngày 19/09/2025), áp dụng cho sinh viên K26.
 *
 * Chép từ bản PDF chính thức (CTDT-KTPM-2025.pdf): mục 6 (cấu trúc), mục 7 (nội dung),
 * mục 8 (kế hoạch giảng dạy dự kiến → `plan`) và Phụ lục 1 (học phần tự chọn tự do).
 * Lớp chữ của PDF bị lỗi nhận dạng nên đã đối chiếu bằng ảnh từng trang.
 */
export const CURRICULUM_SOURCE = "CTĐT ngành Kỹ thuật phần mềm, khóa tuyển 2025 (QĐ 2818/QĐ-KHTN)";

/**
 * Bốn khối kiến thức. Tên viết hoa chữ cái đầu câu (đồng bộ với tên nhóm như “Tự chọn ngành /
 * chuyên ngành”); `label` là nhãn dùng giữa câu, VD danh sách Nhiệm vụ ở Tổng quan.
 */
export const BLOCKS: {
  id: BlockId;
  name: string;
  label: string;
  required: number;
  section: string;
}[] = [
  {
    id: "general",
    name: "Giáo dục đại cương",
    label: "Khối giáo dục đại cương",
    required: 56,
    section: "7.1",
  },
  {
    id: "foundation",
    name: "Cơ sở ngành",
    label: "Khối cơ sở ngành",
    required: 38,
    section: "7.2.1",
  },
  {
    id: "major",
    name: "Ngành / chuyên ngành",
    label: "Khối ngành / chuyên ngành",
    required: 34,
    section: "7.2.2–7.2.3",
  },
  {
    id: "graduation",
    name: "Tốt nghiệp",
    label: "Khối tốt nghiệp",
    required: 10,
    section: "7.2.4",
  },
];

/** Nhãn khối dùng giữa câu, VD “Khối ngành / chuyên ngành”. */
export const blockLabel = (id: BlockId): string =>
  BLOCKS.find((block) => block.id === id)?.label ?? id;

/** Khối có thể dồn TC vượt của nhóm trước sang nhóm sau (mục 7.2.2.2 và 7.2.3). */
export const POOLED_BLOCKS: BlockId[] = ["major"];

type Row = [id: string, name: string, credits: number, plan?: number[], note?: string];

const courses: Course[] = [];
function add(kind: Course["kind"], rows: Row[], origin?: string): string[] {
  for (const [id, name, credits, plan, note] of rows)
    if (!courses.some((course) => course.id === id))
      courses.push({ id, name, credits, kind, plan: plan ?? [], note, origin });
  return rows.map((row) => row[0]);
}

const g = (group: CourseGroup) => group;

/* ---------------------------------------------------------------- 7.1 Giáo dục đại cương */
export const GROUPS: CourseGroup[] = [
  g({
    id: "ge-politics",
    block: "general",
    section: "7.1.1",
    title: "Lý luận chính trị – Pháp luật",
    mode: "required",
    credits: 14,
    rule: "Bắt buộc 14 TC",
    courseIds: add("BB", [
      ["BAA00101", "Triết học Mác – Lênin", 3, [4]],
      ["BAA00102", "Kinh tế chính trị Mác – Lênin", 2, [5]],
      ["BAA00103", "Chủ nghĩa xã hội khoa học", 2, [6]],
      ["BAA00104", "Lịch sử Đảng Cộng sản Việt Nam", 2, [7]],
      ["BAA00003", "Tư tưởng Hồ Chí Minh", 2, [8]],
      ["BAA00004", "Pháp luật đại cương", 3, [2]],
    ]),
  }),
  g({
    id: "ge-social",
    block: "general",
    section: "7.1.2",
    title: "Khoa học xã hội – Kinh tế – Kỹ năng",
    mode: "elective",
    credits: 2,
    rule: "Chọn 01 học phần (02 TC)",
    courseIds: add("TC", [
      ["BAA00005", "Kinh tế đại cương", 2, [4]],
      ["BAA00006", "Tâm lý đại cương", 2, [4]],
      ["BAA00007", "Phương pháp luận sáng tạo", 2, [4]],
    ]),
  }),
  g({
    id: "ge-math",
    block: "general",
    section: "7.1.3",
    title: "Toán – Khoa học tự nhiên",
    mode: "required",
    credits: 24,
    rule: "Bắt buộc 24 TC",
    courseIds: add("BB", [
      ["MTH00021", "Vi tích phân 1", 4, [1]],
      ["MTH00022", "Vi tích phân 2", 4, [2]],
      ["MTH00035", "Đại số tuyến tính", 4, [2]],
      ["MTH00044", "Xác suất thống kê", 4, [3]],
      ["MTH00045", "Toán rời rạc", 4, [1]],
      ["MTH00050", "Toán học tổ hợp", 4, [3]],
    ]),
  }),
  g({
    id: "ge-math-elective",
    block: "general",
    section: "7.1.3",
    title: "Toán học tự chọn",
    mode: "elective",
    credits: 4,
    rule: "Chọn 01 học phần (04 TC)",
    courseIds: add("TC", [
      ["MTH00051", "Toán ứng dụng và thống kê", 4, [4]],
      ["MTH00052", "Phương pháp tính", 4, [4]],
      ["MTH00053", "Lý thuyết số", 4, [4]],
    ]),
  }),
  g({
    id: "ge-science",
    block: "general",
    section: "7.1.3",
    title: "Khoa học tự nhiên tự chọn",
    mode: "elective",
    credits: 6,
    rule: "Chọn 06 TC",
    courseIds: add("TC", [
      ["CHE00001", "Hóa đại cương 1", 3, [2]],
      ["CHE00002", "Hóa đại cương 2", 3, [3]],
      ["CHE00081", "Thực hành Hóa đại cương 1", 2, [2]],
      ["CHE00082", "Thực hành Hóa đại cương 2", 2, [3]],
      ["BIO00001", "Sinh đại cương 1", 3, [2]],
      ["BIO00002", "Sinh đại cương 2", 3, [3]],
      ["BIO00081", "Thực tập Sinh đại cương 1", 1, [2]],
      ["BIO00082", "Thực tập Sinh đại cương 2", 1, [3]],
      ["PHY00001", "Vật lý đại cương 1 (Cơ – Nhiệt)", 3, [2]],
      ["PHY00002", "Vật lý đại cương 2 (Điện từ – Quang)", 3, [3]],
      ["PHY00081", "Thực hành Vật lý đại cương", 2, [2]],
    ]),
  }),
  g({
    id: "ge-environment",
    block: "general",
    section: "7.1.3",
    title: "Trái đất – Môi trường tự chọn",
    mode: "elective",
    credits: 2,
    rule: "Chọn 01 học phần (02 TC)",
    courseIds: add("TC", [
      ["GEO00002", "Khoa học Trái đất", 2, [5]],
      ["ENV00001", "Môi trường đại cương", 2, [5]],
      ["ENV00003", "Con người và môi trường", 2, [5]],
    ]),
  }),
  g({
    id: "ge-informatics",
    block: "general",
    section: "7.1.4",
    title: "Tin học",
    mode: "required",
    credits: 4,
    rule: "Bắt buộc 04 TC",
    courseIds: add("BB", [["CSC00004", "Nhập môn công nghệ thông tin", 4, [1]]]),
  }),

  /* -------------------------------------------------------------- 7.2.1 Cơ sở ngành */
  g({
    id: "foundation",
    block: "foundation",
    section: "7.2.1",
    title: "Kiến thức cơ sở ngành",
    mode: "required",
    credits: 38,
    rule: "Bắt buộc 38 TC",
    courseIds: add("BB", [
      ["CSC10003", "Phương pháp lập trình hướng đối tượng", 4, [3]],
      ["CSC10004", "Cấu trúc dữ liệu và giải thuật", 4, [2]],
      ["CSC10006", "Cơ sở dữ liệu", 4, [4]],
      ["CSC10007", "Hệ điều hành", 4, [5]],
      ["CSC10008", "Mạng máy tính", 4, [3]],
      ["CSC10009", "Hệ thống máy tính", 2, [4]],
      ["CSC10012", "Cơ sở lập trình", 4, [1]],
      ["CSC10014", "Tư duy tính toán", 4, [4]],
      ["CSC13002", "Nhập môn công nghệ phần mềm", 4, [5]],
      ["CSC14003", "Cơ sở trí tuệ nhân tạo", 4, [6]],
    ]),
  }),

  /* -------------------------------------------------------------- 7.2.2 – 7.2.3 Ngành */
  g({
    id: "major-core",
    block: "major",
    section: "7.2.2.1",
    title: "Bắt buộc ngành / chuyên ngành",
    mode: "elective",
    credits: 16,
    rule: "Tích lũy tối thiểu 16 TC trong danh sách",
    courseIds: add("TC", [
      ["CSC13003", "Kiểm thử phần mềm", 4, [7]],
      ["CSC13005", "Phân tích và quản lý yêu cầu phần mềm", 4, [6]],
      ["CSC13006", "Quản lý dự án phần mềm", 4, [7]],
      ["CSC13007", "Phát triển game", 4, [7]],
      ["CSC13008", "Phát triển ứng dụng web", 4, [5]],
      ["CSC13009", "Phát triển phần mềm cho thiết bị di động", 4, [5]],
      ["CSC13010", "Thiết kế phần mềm", 4, [6]],
      ["CSC13106", "Kiến trúc phần mềm", 4, [7]],
      ["CSC13112", "Thiết kế giao diện", 4, [7]],
    ]),
  }),
  g({
    id: "major-elective",
    block: "major",
    section: "7.2.2.2",
    title: "Tự chọn ngành / chuyên ngành",
    mode: "elective",
    credits: 8,
    rule: "Tích lũy tối thiểu 08 TC (được tính cả TC vượt của mục 1)",
    courseIds: add("TC", [
      ["CSC10121", "Kỹ năng mềm", 3, [4], "Học kỳ hè năm 2"],
      ["CSC10102", "Kiến tập nghề nghiệp", 2, [6]],
      ["CSC10103", "Khởi nghiệp", 3, [6], "Học kỳ hè năm 3"],
      ["CSC10105", "Nhập môn tư duy thuật toán", 4, [5]],
      ["CSC10107", "Thực tập thực tế", 4, [6], "Học kỳ hè năm 3"],
      ["CSC13001", "Lập trình Windows", 4, [5]],
      ["CSC13101", "Các chủ đề nâng cao trong Công nghệ phần mềm", 4, [8]],
      ["CSC13102", "Lập trình ứng dụng Java", 4, [4]],
      ["CSC13103", "Nhập môn hệ thống phân tán", 4, [7]],
      ["CSC13107", "Mẫu thiết kế hướng đối tượng và ứng dụng", 4, [7]],
      ["CSC13117", "Phát triển game nâng cao", 4, [8]],
      ["CSC11007", "Nhập môn DevOps", 4, [6]],
      ["CSC14005", "Nhập môn học máy", 4, [6]],
      ["CSC16106", "Nhập môn lập trình điều khiển thiết bị thông minh", 4, [7]],
      ["CSC18106", "Mô hình ngôn ngữ lớn", 4, [8]],
      ["CSC16115", "Triển khai và vận hành hệ thống học máy", 4, [8]],
    ]),
  }),
  g({
    id: "major-free",
    block: "major",
    section: "7.2.3",
    title: "Tự chọn tự do (Phụ lục 1)",
    mode: "elective",
    credits: 10,
    rule: "Chọn thêm cho đủ 34 TC của khối ngành / chuyên ngành",
    picker: true,
    courseIds: [
      ...add(
        "TC",
        [
          ["CSC13114", "Phát triển ứng dụng web nâng cao", 4, [7]],
          ["CSC13115", "Các công nghệ mới trong phát triển phần mềm", 4, [8]],
          ["CSC13116", "Đồ án Công nghệ phần mềm", 4, [8], "Capstone"],
          ["CSC13118", "Phát triển ứng dụng cho thiết bị di động nâng cao", 4, [7]],
        ],
        "CTĐT KTPM",
      ),
      ...add(
        "TC",
        [
          ["CSC12002", "Cơ sở dữ liệu nâng cao", 4],
          ["CSC12003", "Hệ quản trị cơ sở dữ liệu", 4],
          ["CSC12004", "Phân tích thiết kế hệ thống thông tin", 4],
          ["CSC12005", "Phát triển ứng dụng hệ thống thông tin hiện đại", 4],
          ["CSC10104", "Quy hoạch tuyến tính", 4],
          ["CSC10106", "Thuật toán tổ hợp và ứng dụng", 4],
          ["CSC12001", "An toàn và bảo mật dữ liệu trong hệ thống thông tin", 4],
          ["CSC12105", "Thương mại điện tử", 4],
          ["CSC12106", "Tương tác người – máy", 4],
          ["CSC17101", "Hệ thống tư vấn", 4],
        ],
        "CTĐT HTTT",
      ),
      ...add(
        "TC",
        [
          ["CSC18001", "Nhập môn học sâu", 4],
          ["CSC18002", "Nhập môn Trí tuệ nhân tạo tạo sinh", 4],
          ["CSC18101", "Trí tuệ nhân tạo cho an ninh thông tin", 4],
          ["CSC18102", "Phương pháp toán cho tối ưu", 4],
          ["CSC18103", "Trí tuệ bầy đàn", 4],
          ["CSC18104", "Nhập môn hệ thống đa tác nhân", 4],
          ["CSC18107", "Các chủ đề chọn lọc trong Trí tuệ nhân tạo", 4],
        ],
        "CTĐT TTNT",
      ),
      ...add(
        "TC",
        [
          ["CSC14001", "Automata và ngôn ngữ hình thức", 4],
          ["CSC14002", "Các hệ cơ sở tri thức", 4],
          ["CSC14004", "Khai thác dữ liệu và ứng dụng", 4],
          ["CSC14006", "Nhận dạng", 4],
          ["CSC14101", "Ẩn dữ liệu và chia sẻ thông tin", 4],
          ["CSC14111", "Nhập môn thiết kế và phân tích giải thuật", 4],
          ["CSC14118", "Nhập môn dữ liệu lớn", 4],
          ["CSC14120", "Lập trình song song", 4],
          ["CSC14008", "Phương pháp nghiên cứu khoa học", 4],
          ["CSC14105", "Khoa học về web", 4],
          ["CSC14112", "Sinh trắc học", 4],
          ["CSC14113", "Trình biên dịch", 4],
          ["CSC14117", "Nhập môn lập trình kết nối vạn vật", 4],
        ],
        "CTĐT KHMT",
      ),
      ...add(
        "TC",
        [
          ["CSC14007", "Nhập môn phân tích độ phức tạp thuật toán", 4],
          ["CSC15001", "An ninh máy tính", 4],
          ["CSC15002", "Bảo mật cơ sở dữ liệu", 4],
          ["CSC15003", "Mã hóa ứng dụng", 4],
          ["CSC15004", "Học thống kê", 4],
          ["CSC15005", "Nhập môn mã hóa – mật mã", 4],
          ["CSC15006", "Nhập môn xử lý ngôn ngữ tự nhiên", 4],
          ["CSC15007", "Thống kê máy tính và ứng dụng", 4],
          ["CSC15009", "Xử lý tín hiệu số", 4],
          ["CSC15011", "Nhập môn ngôn ngữ học thống kê và ứng dụng", 4],
          ["CSC15012", "Ứng dụng xử lý ngôn ngữ tự nhiên trong doanh nghiệp", 4],
          ["CSC15109", "Nhập môn tính toán lượng tử", 4],
          ["CSC15010", "Blockchain và ứng dụng", 4],
          ["CSC15102", "Phân tích mạng xã hội", 4],
          ["CSC15107", "Phân tích dữ liệu bảo toàn tính riêng tư", 4],
          ["CSC15108", "Pháp chứng cho dữ liệu số", 4],
          ["CSC15110", "Các công nghệ tiên tiến trong xử lý ngôn ngữ tự nhiên", 4],
        ],
        "CTĐT KHMT (CNTThức)",
      ),
      ...add(
        "TC",
        [
          ["CSC16001", "Đồ họa máy tính", 4],
          ["CSC16002", "Phương pháp toán trong phân tích dữ liệu thị giác", 4],
          ["CSC16003", "Phân tích thống kê dữ liệu nhiều biến", 4],
          ["CSC16004", "Thị giác máy tính", 4],
          ["CSC16005", "Xử lý ảnh số và video số", 4],
          ["CSC16101", "Đồ họa ứng dụng", 4],
          ["CSC16102", "Kỹ thuật lập trình xử lý ảnh số và video số", 4],
          ["CSC16105", "Truy vấn thông tin thị giác", 4],
          ["CSC16107", "Ứng dụng thị giác máy tính", 4],
          ["CSC16109", "Ứng dụng xử lý ảnh số và video số", 4],
          ["CSC16113", "Thị giác máy tính ba chiều", 4],
          ["CSC16114", "Học sâu trong Thị giác máy tính", 4],
        ],
        "CTĐT KHMT (TGMT)",
      ),
      ...add(
        "TC",
        [
          ["CSC10108", "Trực quan hóa dữ liệu", 4],
          ["CSC14119", "Nhập môn khoa học dữ liệu", 4],
          ["CSC17001", "Phân tích dữ liệu thông minh", 4],
          ["CSC17104", "Lập trình cho khoa học dữ liệu", 4],
          ["CSC17103", "Khai thác dữ liệu đồ thị", 4],
          ["CSC17106", "Xử lý phân tích dữ liệu trực tuyến", 4],
        ],
        "CTĐT KHMT (KHDL)",
      ),
      ...add(
        "TC",
        [
          ["CSC11002", "Hệ thống viễn thông", 4],
          ["CSC11003", "Lập trình mạng", 4],
          ["CSC11004", "Mạng máy tính nâng cao", 4],
          ["CSC11006", "Nhập môn điện toán đám mây", 4],
          ["CSC11106", "Truyền thông không dây", 4],
          ["CSC11115", "An ninh mạng", 4],
          ["CSC11116", "DevOps nâng cao", 4],
          ["CSC11117", "Hệ điều hành Linux và ứng dụng", 4],
          ["CSC11118", "Triển khai và vận hành điện toán đám mây", 4],
          ["CSC11120", "Bảo mật web và thiết bị di động", 4],
        ],
        "CTĐT CNTT (MMT)",
      ),
    ],
  }),

  /* -------------------------------------------------------------- 7.2.4 Tốt nghiệp */
  g({
    id: "grad-thesis",
    block: "graduation",
    section: "7.2.4",
    title: "Phương án 1 – Khóa luận tốt nghiệp",
    mode: "required",
    credits: 10,
    rule: "10 TC",
    gradOption: "thesis",
    courseIds: add("TC", [["CSC10251", "Khóa luận tốt nghiệp", 10, [7, 8]]]),
  }),
  g({
    id: "grad-internship",
    block: "graduation",
    section: "7.2.4",
    title: "Phương án 2 – Thực tập tốt nghiệp",
    mode: "required",
    credits: 10,
    rule: "10 TC",
    gradOption: "internship",
    courseIds: add("TC", [["CSC10252", "Thực tập tốt nghiệp", 10, [7, 8]]]),
  }),
  g({
    id: "grad-project",
    block: "graduation",
    section: "7.2.4",
    title: "Phương án 3 – Thực tập dự án tốt nghiệp",
    mode: "required",
    credits: 6,
    rule: "06 TC",
    gradOption: "project",
    courseIds: add("TC", [["CSC10204", "Thực tập dự án tốt nghiệp", 6, [7, 8]]]),
  }),
  g({
    id: "grad-project-pick",
    block: "graduation",
    section: "7.2.4",
    title: "Phương án 3 – Học phần tốt nghiệp",
    mode: "elective",
    credits: 4,
    rule: "Chọn 01 học phần (04 TC)",
    gradOption: "project",
    courseIds: ["CSC13114", "CSC13115", "CSC13116", "CSC13118"],
  }),
];

/* ---------------------------------------------------------------- Giáo dục thể chất */
/**
 * Thể dục 1, 2 (mã và số TC theo CTĐT): học phần điều kiện, không tính vào 138 TC và GPA, nên
 * không nằm trong GROUPS. Kết quả nhập ở mục Giáo dục thể chất; điều kiện Thể chất suy ra từ đó.
 */
export const PE_GROUP: CourseGroup = g({
  id: "pe",
  block: "general",
  section: "7.1",
  title: "Giáo dục thể chất",
  mode: "required",
  credits: 4,
  rule: "Học phần điều kiện · 04 TC",
  courseIds: add("BB", [
    ["BAA00021", "Thể dục 1", 2],
    ["BAA00022", "Thể dục 2", 2],
  ]),
});

export const GRADUATION_OPTIONS: { id: GradOptionId; name: string; summary: string }[] = [
  { id: "thesis", name: "Khóa luận tốt nghiệp", summary: "CSC10251 · 10 TC" },
  { id: "internship", name: "Thực tập tốt nghiệp", summary: "CSC10252 · 10 TC" },
  {
    id: "project",
    name: "Thực tập dự án + Học phần tốt nghiệp",
    summary: "CSC10204 (6 TC) + 01 học phần 4 TC",
  },
];

/** Học phần điều kiện (không tính vào 138 TC và GPA). */
export const CONDITION_COURSES = {
  pe: ["BAA00021 Thể dục 1 (2 TC)", "BAA00022 Thể dục 2 (2 TC)"],
  defense: ["BAA00030 Giáo dục quốc phòng – An ninh (4 TC)"],
  english: ["ADD00031–ADD00034 Anh văn 1–4 (miễn học khi đạt chuẩn đầu ra)"],
};

export const COURSES: readonly Course[] = courses;
export const COURSE_BY_ID = new Map(courses.map((course) => [course.id, course]));
export const GROUP_BY_ID = new Map(GROUPS.map((group) => [group.id, group]));
export const TOTAL_PROGRAM_CREDITS = BLOCKS.reduce((sum, block) => sum + block.required, 0);

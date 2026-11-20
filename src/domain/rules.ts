/**
 * QUY TẮC HỌC VỤ
 *
 * Nguồn chính: Báo cáo phác thảo UI/UX Nhóm 6 (deliverables/ui-ux-report, mục 2.2 Màn hình 1–2),
 * người dùng chốt ngày 12/11/2026 là nguồn đúng nhất:
 *  - Học phần Đạt khi điểm hệ 10 ≥ 5.0; dưới 5.0 là "Chưa đạt", TC không cộng vào tích lũy.
 *  - GPA tính từ điểm hệ 10, trung bình theo số TC. Điểm chữ và điểm hệ 4 chỉ quy đổi để xem.
 *  - Điểm chữ A, B+, B, C+, C, D+, D, F ↔ hệ 4: 4.0 / 3.5 / 3.0 / 2.5 / 2.0 / 1.5 / 1.0 / 0.0.
 *  - Điều kiện tốt nghiệp: GPA (hệ 10) từ 5.0 trở lên.
 * Báo cáo không ghi ngưỡng điểm của từng bậc chữ và ngưỡng xếp loại: dùng thang quy đổi thang 10
 * thường dùng (ghi ở dưới), là lựa chọn của nhóm phát triển. Mốc 138 TC và việc GDTC, GDQP-AN,
 * Ngoại ngữ không tính vào TC tích lũy/GPA khớp mục 3, 7.1.5–7.1.7 của CTĐT.
 */
export const RULES_SOURCE = "Báo cáo phác thảo UI/UX Nhóm 6 (Màn hình 1 và 2)";

/** Tổng TC tích lũy khi tốt nghiệp (CTĐT mục 3, 6). */
export const TOTAL_CREDITS_REQUIRED = 138;
/** Học phần Đạt khi điểm hệ 10 ≥ 5.0 (báo cáo UI/UX). */
export const PASS_SCORE = 5.0;
/** GPA hệ 10 tối thiểu trong checklist tốt nghiệp (báo cáo UI/UX). */
export const GRADUATION_MIN_GPA = 5.0;
export const MAX_SEMESTER = 8;

/**
 * Quy đổi thang 10 → điểm chữ → hệ 4 (chỉ để xem). Thứ tự chữ và điểm hệ 4 theo báo cáo UI/UX;
 * ngưỡng từng bậc là thang quy đổi thường dùng vì báo cáo chưa ghi.
 */
const LETTER_SCALE: { min: number; letter: string; point4: number }[] = [
  { min: 8.5, letter: "A", point4: 4.0 },
  { min: 8.0, letter: "B+", point4: 3.5 },
  { min: 7.0, letter: "B", point4: 3.0 },
  { min: 6.5, letter: "C+", point4: 2.5 },
  { min: 5.5, letter: "C", point4: 2.0 },
  { min: 5.0, letter: "D+", point4: 1.5 },
  { min: 4.0, letter: "D", point4: 1.0 },
  { min: 0, letter: "F", point4: 0.0 },
];

/** Xếp loại học lực theo GPA hệ 10 (báo cáo chỉ có ví dụ "Giỏi"; ngưỡng thang 10 thường dùng). */
const RANK_SCALE: { min: number; rank: string }[] = [
  { min: 9.0, rank: "Xuất sắc" },
  { min: 8.0, rank: "Giỏi" },
  { min: 7.0, rank: "Khá" },
  { min: 5.0, rank: "Trung bình" },
  { min: 4.0, rank: "Yếu" },
  { min: 0, rank: "Kém" },
];

/** Làm tròn 2 chữ số để 8.45 hay 7.999… không bị xếp nhầm do sai số dấu phẩy động. */
const tidy = (value: number) => Math.round(value * 100) / 100;

export function convertScore(score: number): { letter: string; point4: number } {
  const value = tidy(score);
  const row =
    LETTER_SCALE.find((item) => value >= item.min) ?? LETTER_SCALE[LETTER_SCALE.length - 1];
  return { letter: row.letter, point4: row.point4 };
}

export function isPass(score: number | null): boolean {
  return score !== null && tidy(score) >= PASS_SCORE;
}

export function rankOf(gpa10: number | null): string {
  if (gpa10 === null) return "Chưa có";
  const value = tidy(gpa10);
  return (RANK_SCALE.find((item) => value >= item.min) ?? RANK_SCALE[RANK_SCALE.length - 1]).rank;
}

/**
 * Chuẩn ngoại ngữ đầu ra. Báo cáo UI/UX chỉ ghi "theo bảng chuẩn ngoại ngữ" (ví dụ IELTS tối thiểu
 * 4.5); mức tối thiểu lấy từ Bảng 5 của báo cáo phân tích yêu cầu Nhóm 6.
 */
export interface LanguageCert {
  id: string;
  name: string;
  min: number;
  max: number;
  label: string;
  /** Điểm thứ hai (TOEIC Nói – Viết). */
  min2?: number;
  max2?: number;
  label2?: string;
  display: string;
}

export const LANGUAGE_CERTS: LanguageCert[] = [
  { id: "VSTEP", name: "VSTEP", min: 3, max: 6, label: "Bậc", display: "B1 (bậc 3/6)" },
  { id: "IELTS", name: "IELTS", min: 4.5, max: 9, label: "Điểm", display: "4.5" },
  {
    id: "TOEIC",
    name: "TOEIC 4 kỹ năng",
    min: 450,
    max: 990,
    label: "Nghe–Đọc",
    min2: 181,
    max2: 400,
    label2: "Nói–Viết",
    display: "450 Nghe–Đọc, 181 Nói–Viết",
  },
  { id: "TOEFL_IBT", name: "TOEFL iBT", min: 45, max: 120, label: "Điểm", display: "45" },
  { id: "TOEFL_ITP", name: "TOEFL ITP", min: 450, max: 677, label: "Điểm", display: "450" },
  { id: "TOEFL_CBT", name: "TOEFL CBT", min: 133, max: 300, label: "Điểm", display: "133" },
];

export type LanguageResult = "empty" | "pass" | "fail";

export function languageResult(
  type: string,
  score: number | null,
  score2: number | null = null,
): { state: LanguageResult; cert: LanguageCert | undefined } {
  const cert = LANGUAGE_CERTS.find((item) => item.id === type);
  if (!cert || score === null || (cert.min2 !== undefined && score2 === null))
    return { state: "empty", cert };
  const ok = score >= cert.min && (cert.min2 === undefined || (score2 ?? 0) >= cert.min2);
  return { state: ok ? "pass" : "fail", cert };
}

/** Điểm nhập hợp lệ: số từ 0 đến 10, chấp nhận dấu "," hoặc ".". Trả null nếu không hợp lệ. */
export function parseScore(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value >= 0 && value <= 10 ? value : null;
}

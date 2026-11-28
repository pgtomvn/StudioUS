/**
 * QUY TẮC HỌC VỤ
 *
 * Nguồn: Báo cáo phân tích yêu cầu Nhóm 6, bản cập nhật người dùng gửi ngày 22/11/2026
 * (docs/requirements/bao-cao-phan-tich-yeu-cau-nhom6.pdf): chức năng F-02, F-03, mục 4.1–4.4.
 * Báo cáo dẫn Quy chế đào tạo trình độ đại học 2026 của Trường; bảng quy đổi trùng với ảnh Điều 11
 * của Quy chế trong feedback.pdf (Quy chế gốc chưa được mở trực tiếp để đối chiếu):
 *  - Điểm học phần hệ 10 → hệ 4 → chữ: 9.0–10 A+ 4.0; 8.0–<9.0 A 3.5; 7.0–<8.0 B+ 3.0;
 *    6.0–<7.0 B 2.5; 5.0–<6.0 C 2.0; 4.0–<5.0 D+ 1.5; 3.0–<4.0 D 1.0; <3.0 F 0.0.
 *  - Học phần Đạt khi điểm hệ 10 ≥ 5.0 (D+, D có điểm hệ 4 nhưng vẫn Chưa đạt).
 *  - TC tích lũy = tổng TC học phần Đạt thuộc 138 TC; GPA tích lũy = Σ(TC × điểm hệ 10) / TC tích lũy,
 *    tức chỉ tính các học phần đã đạt.
 *  - Xếp loại theo GPA (Bảng 4): Xuất sắc, Giỏi, Khá, Trung bình khá, Trung bình; dưới 5.0 không đạt
 *    (4.0–<5.0 Yếu). Dưới 4.0 báo cáo không ghi: ứng dụng hiện “Kém” (chưa xác minh).
 *  - Tốt nghiệp: 138 TC, GPA ≥ 5.0, GDQP-AN + GDTC, chuẩn ngoại ngữ (Bảng 5).
 * GDTC, GDQP-AN, Ngoại ngữ không cộng vào 138 TC và GPA (khớp mục 3, 7.1.5–7.1.7 của CTĐT).
 */
export const RULES_SOURCE = "Báo cáo phân tích yêu cầu Nhóm 6 (cập nhật 22/11/2026), mục 4";

/** Tổng TC tích lũy khi tốt nghiệp (CTĐT mục 3, 6). */
export const TOTAL_CREDITS_REQUIRED = 138;
/** Học phần Đạt khi điểm hệ 10 ≥ 5.0 (F-02). */
export const PASS_SCORE = 5.0;
/** GPA hệ 10 tối thiểu để tốt nghiệp (mục 4.3). */
export const GRADUATION_MIN_GPA = 5.0;
/** Số học kỳ chuẩn của CTĐT (mục 8, 4 năm). */
export const STANDARD_SEMESTERS = 8;
/** Giới hạn số học kỳ khi thêm học kỳ cho người học chậm (giới hạn của ứng dụng, không phải quy chế). */
export const SEMESTER_LIMIT = 16;

/** Quy đổi điểm học phần thang 10 → điểm chữ, hệ 4 (F-02, Điều 11 Quy chế). */
const LETTER_SCALE: { min: number; letter: string; point4: number }[] = [
  { min: 9.0, letter: "A+", point4: 4.0 },
  { min: 8.0, letter: "A", point4: 3.5 },
  { min: 7.0, letter: "B+", point4: 3.0 },
  { min: 6.0, letter: "B", point4: 2.5 },
  { min: 5.0, letter: "C", point4: 2.0 },
  { min: 4.0, letter: "D+", point4: 1.5 },
  { min: 3.0, letter: "D", point4: 1.0 },
  { min: 0, letter: "F", point4: 0.0 },
];

/** Xếp loại theo GPA hệ 10 (Bảng 4). “Kém” dưới 4.0 không có trong báo cáo. */
const RANK_SCALE: { min: number; rank: string }[] = [
  { min: 9.0, rank: "Xuất sắc" },
  { min: 8.0, rank: "Giỏi" },
  { min: 7.0, rank: "Khá" },
  { min: 6.0, rank: "Trung bình khá" },
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

/** Chuẩn ngoại ngữ đầu ra: mức tối thiểu theo Bảng 5 của báo cáo phân tích yêu cầu Nhóm 6 (mục 4.4). */
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

/**
 * Điểm nhập hợp lệ: số từ 0 đến 10, tối đa một chữ số thập phân (điểm học phần làm tròn đến một
 * chữ số thập phân, Điều 11 Quy chế), chấp nhận dấu "," hoặc ".". Trả null nếu không hợp lệ.
 */
export function parseScore(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value >= 0 && value <= 10 ? value : null;
}

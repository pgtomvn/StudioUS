export type ThemeId = "sunset" | "meadow" | "arcade" | "midnight" | "campus";
export type ScreenId = "dashboard" | "courses" | "schedule" | "data";

export type BlockId = "general" | "foundation" | "major" | "graduation";
/** Loại học phần theo cột "Loại HP" của CTĐT: BB = bắt buộc, TC = tự chọn. */
export type CourseKind = "BB" | "TC";
/** retake = đang học lại (lần học trước đã có điểm, lưu trong `attempts`). */
export type CourseStatus = "todo" | "doing" | "retake" | "done";
export type ConditionState = "none" | "pass" | "exempt";
export type GradOptionId = "thesis" | "internship" | "project";

export interface Course {
  id: string;
  name: string;
  credits: number;
  kind: CourseKind;
  /** Học kỳ dự kiến theo mục 8 của CTĐT (rỗng nếu CTĐT không xếp lịch). */
  plan: number[];
  note?: string;
  /** Nguồn của học phần tự chọn tự do (Phụ lục 1), VD "CTĐT HTTT". */
  origin?: string;
}

export interface CourseGroup {
  id: string;
  block: BlockId;
  section: string;
  title: string;
  /** required: phải học mọi học phần; elective: sinh viên tick chọn học phần. */
  mode: "required" | "elective";
  /** Số TC của nhóm được tính vào khối. */
  credits: number;
  rule: string;
  courseIds: string[];
  /** Danh sách dài: chọn qua hộp tìm kiếm thay vì liệt kê hết. */
  picker?: boolean;
  /** Nhóm chỉ thuộc một phương án tốt nghiệp. */
  gradOption?: GradOptionId;
}

/** Một lần học trước đó của học phần (lịch sử học lại). */
export interface Attempt {
  semester: number | null;
  score: number | null;
}

/** Lần học hiện tại (lần gần nhất) của học phần; điểm của lần này được tính vào TC và GPA tích lũy. */
export interface CourseRecord {
  semester: number | null;
  status: CourseStatus;
  /** null = chưa có điểm; khác với điểm 0. */
  score: number | null;
  /** Các lần học trước, cũ nhất trước (chỉ có khi đã chọn “Học lại”). */
  attempts?: Attempt[];
}

export interface SemesterInfo {
  /** yyyy-mm-dd */
  start: string;
  /** yyyy-mm-dd */
  end: string;
}

export interface Profile {
  name: string;
  /** "K25" hoặc "K26": quyết định năm học của từng học kỳ. */
  cohort: string;
  currentSemester: number;
  /** Số học kỳ của kế hoạch: 8 theo CTĐT, thêm được khi học chậm (tối đa SEMESTER_LIMIT). */
  semesterCount: number;
  /** Thông tin từng học kỳ, khóa là số học kỳ ("1", "2", …). */
  semesters: Record<string, SemesterInfo>;
  /** data URL ảnh đại diện đã thu nhỏ, hoặc null để dùng mascot mặc định. */
  avatar: string | null;
}

export interface Conditions {
  pe: ConditionState;
  defense: ConditionState;
  langType: string;
  langScore: number | null;
  /** Điểm thứ hai, chỉ dùng cho TOEIC 4 kỹ năng (Nói – Viết). */
  langScore2: number | null;
}

/** Buổi học lý thuyết hay thực hành (mỗi môn thường có cả hai). */
export type ClassKind = "theory" | "lab";

export interface ClassEntry {
  id: string;
  courseId: string;
  kind: ClassKind;
  semester: number;
  /** 1 = Thứ 2 … 7 = Chủ nhật */
  day: number;
  start: string;
  end: string;
  room: string;
  weekFrom: number;
  weekTo: number;
  color: string;
  note: string;
}

export type ExamKind = "mid" | "final" | "other";

export interface ExamEntry {
  id: string;
  courseId: string;
  semester: number;
  kind: ExamKind;
  /** yyyy-mm-dd */
  date: string;
  time: string;
  room: string;
  remindDays: number;
  note: string;
}

export interface AppData {
  version: number;
  profile: Profile;
  records: Record<string, CourseRecord>;
  /** Học phần tự chọn đã tick, theo từng nhóm: groupId → mã học phần. */
  selections: Record<string, string[]>;
  gradOption: GradOptionId | null;
  conditions: Conditions;
  classes: ClassEntry[];
  exams: ExamEntry[];
  meta: { lastSavedAt: string | null; lastExportAt: string | null };
}

export interface SoundSettings {
  /** Tắt toàn bộ âm thanh (hiệu ứng và nhạc nền). */
  muted: boolean;
  /** Âm lượng chung, 0–1. */
  master: number;
  /** Âm lượng hiệu ứng (linh vật, thành tích, nút bấm), 0–1. */
  effects: number;
  /** Âm lượng nhạc nền, 0–1. */
  music: number;
  /** Bật nhạc nền 8-bit; bài nhạc đổi theo chủ đề màu. */
  musicOn: boolean;
  /** Tiếng bấm nút, tick, chuyển trang, mở/đóng hộp thoại. */
  ui: boolean;
}

export interface Settings {
  theme: ThemeId;
  dismissedBannerExamId: string | null;
  /** Số lần xoa đầu linh vật (mức thân thiết). */
  petCount: number;
  sound: SoundSettings;
}

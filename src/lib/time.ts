import type { AppData, ClassEntry, ExamEntry, Profile } from "../types";

const DAY_MS = 86_400_000;
export const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export const pad2 = (value: number) => String(value).padStart(2, "0");

export function mondayOf(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

export function parseDate(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export const shortDate = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())} · ${shortDate(date)}/${date.getFullYear()}`;
}

export function formatDate(text: string): string {
  const date = parseDate(text);
  return date ? `${shortDate(date)}/${date.getFullYear()}` : "";
}

/** K26 nhập học năm 2026: HK1, HK2 thuộc năm học 2026–2027, HK3, HK4 thuộc 2027–2028… */
export const COHORT_START_YEAR = 2026;
export function academicYear(semester: number): string {
  const year = COHORT_START_YEAR + Math.floor((semester - 1) / 2);
  return `${year}–${year + 1}`;
}

/** Thứ Hai của tuần 1 của một học kỳ; null nếu chưa nhập ngày bắt đầu học kỳ đó. */
export function semesterMonday(profile: Profile, semester: number): Date | null {
  const start = parseDate(profile.semesters[String(semester)]?.start ?? "");
  return start ? mondayOf(start) : null;
}

export function weekRange(monday: Date, week: number): { from: Date; to: Date } {
  const from = new Date(monday.getTime());
  from.setDate(from.getDate() + (week - 1) * 7);
  const to = new Date(from.getTime());
  to.setDate(to.getDate() + 6);
  return { from, to };
}

export const DEFAULT_SEMESTER_WEEKS = 15;

/** Số tuần của học kỳ: theo ngày kết thúc nếu có, nếu không thì theo lịch học đã nhập (tối thiểu 15). */
export function semesterWeekCount(
  profile: Profile,
  semester: number,
  classes: ClassEntry[],
): number {
  const monday = semesterMonday(profile, semester);
  const end = parseDate(profile.semesters[String(semester)]?.end ?? "");
  if (monday && end && end > monday)
    return Math.floor((mondayOf(end).getTime() - monday.getTime()) / (7 * DAY_MS)) + 1;
  const used = classes.filter((item) => item.semester === semester).map((item) => item.weekTo);
  return Math.max(DEFAULT_SEMESTER_WEEKS, ...used);
}

export interface WeekSlot {
  semester: number;
  week: number;
  from: Date;
  to: Date;
}

/** Các tuần (bắt đầu từ tuần 1, không có tuần 0 hay âm) của những học kỳ đã có ngày bắt đầu. */
export function buildWeeks(
  profile: Profile,
  semesters: number[],
  classes: ClassEntry[],
): WeekSlot[] {
  const slots: WeekSlot[] = [];
  for (const semester of semesters) {
    const monday = semesterMonday(profile, semester);
    if (!monday) continue;
    const count = semesterWeekCount(profile, semester, classes);
    for (let week = 1; week <= count; week++)
      slots.push({ semester, week, ...weekRange(monday, week) });
  }
  return slots;
}

/**
 * Lịch học của các học kỳ chưa có ngày bắt đầu (VD học kỳ sau học kỳ hiện tại, chưa nhập được ngày):
 * không chia được theo tuần nên thời khóa biểu hiện chúng theo thứ trong tuần.
 */
export function classesWithoutWeeks(
  profile: Profile,
  semesters: number[],
  classes: ClassEntry[],
): ClassEntry[] {
  const undated = semesters.filter((semester) => !semesterMonday(profile, semester));
  return classes
    .filter((item) => undated.includes(item.semester))
    .sort((a, b) => a.day - b.day || minutesOf(a.start) - minutesOf(b.start));
}

/** Vị trí tuần chứa ngày cho trước; ưu tiên học kỳ sau nếu hai học kỳ chồng ngày. */
export function slotIndexOf(slots: WeekSlot[], date: Date): number {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  for (let index = slots.length - 1; index >= 0; index--)
    if (slots[index].from.getTime() <= day && day <= slots[index].to.getTime()) return index;
  return -1;
}

export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function examDate(exam: ExamEntry): Date {
  const date = parseDate(exam.date) ?? new Date();
  const [hours, minutes] = exam.time.split(":").map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export function daysUntil(target: Date, now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((end - start) / DAY_MS);
}

/**
 * Chia cột cho các buổi học trùng giờ trong cùng một ngày (kiểu Google Calendar): buổi chồng nhau
 * nằm song song. Trả về cột (`lane`) của từng buổi và số cột (`lanes`) của cụm trùng chứa buổi đó.
 */
export function layoutOverlaps(
  items: { id: string; start: string; end: string }[],
): Map<string, { lane: number; lanes: number }> {
  const sorted = [...items].sort(
    (a, b) => minutesOf(a.start) - minutesOf(b.start) || minutesOf(b.end) - minutesOf(a.end),
  );
  const result = new Map<string, { lane: number; lanes: number }>();
  let cluster: string[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const close = () => {
    for (const id of cluster) result.get(id)!.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };
  for (const item of sorted) {
    const start = minutesOf(item.start);
    const end = minutesOf(item.end);
    if (start >= clusterEnd) close();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = end;
    clusterEnd = Math.max(clusterEnd, end);
    cluster.push(item.id);
    result.set(item.id, { lane, lanes: 1 });
  }
  close();
  return result;
}

export function nextExam(exams: ExamEntry[], now = new Date()): ExamEntry | null {
  const upcoming = exams.filter((exam) => examDate(exam).getTime() >= now.getTime());
  upcoming.sort((a, b) => examDate(a).getTime() - examDate(b).getTime());
  return upcoming[0] ?? null;
}

/** Phần còn lại đến một thời điểm, tách thành tháng/ngày/giờ/phút cho bộ đếm ngược. */
export function countdownParts(target: Date, now = new Date()) {
  if (target.getTime() <= now.getTime()) return { months: 0, days: 0, hours: 0, minutes: 0 };
  let months = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();
  const anchor = new Date(now.getTime());
  anchor.setMonth(anchor.getMonth() + months);
  if (anchor.getTime() > target.getTime()) {
    months -= 1;
    anchor.setTime(now.getTime());
    anchor.setMonth(anchor.getMonth() + months);
  }
  const rest = target.getTime() - anchor.getTime();
  return {
    months,
    days: Math.floor(rest / DAY_MS),
    hours: Math.floor((rest % DAY_MS) / 3_600_000),
    minutes: Math.floor((rest % 3_600_000) / 60_000),
  };
}

/**
 * Ca thi trùng = cùng ngày và cùng giờ bắt đầu. Xét mọi lịch thi đã lưu (kể cả học kỳ khác),
 * bỏ qua chính lịch đang sửa.
 */
export function findExamClash(
  draft: Pick<ExamEntry, "date" | "time"> & { id?: string },
  exams: ExamEntry[],
): ExamEntry | undefined {
  return exams.find(
    (item) => item.id !== draft.id && item.date === draft.date && item.time === draft.time,
  );
}

/** Các học kỳ lớn hơn học kỳ hiện tại mà vẫn còn lịch học / lịch thi (không hiện ở "Tất cả"). */
export function semestersAhead(
  data: AppData,
): { semester: number; classes: number; exams: number }[] {
  const current = data.profile.currentSemester;
  const found = new Map<number, { semester: number; classes: number; exams: number }>();
  const bump = (semester: number, key: "classes" | "exams") => {
    if (semester <= current) return;
    const entry = found.get(semester) ?? { semester, classes: 0, exams: 0 };
    entry[key] += 1;
    found.set(semester, entry);
  };
  for (const item of data.classes) bump(item.semester, "classes");
  for (const item of data.exams) bump(item.semester, "exams");
  return [...found.values()].sort((a, b) => a.semester - b.semester);
}

export function classesOverlap(a: Omit<ClassEntry, "id">, b: ClassEntry): boolean {
  if (a.semester !== b.semester || a.day !== b.day) return false;
  if (a.weekTo < b.weekFrom || b.weekTo < a.weekFrom) return false;
  return minutesOf(a.start) < minutesOf(b.end) && minutesOf(b.start) < minutesOf(a.end);
}

import {
  BLOCKS,
  COURSE_BY_ID,
  GROUPS,
  PE_GROUP,
  POOLED_BLOCKS,
  blockLabel,
} from "../data/curriculum";
import type {
  AppData,
  BlockId,
  ConditionState,
  Course,
  CourseGroup,
  CourseRecord,
  Profile,
} from "../types";
import { GRADUATION_MIN_GPA, TOTAL_CREDITS_REQUIRED, isPass, languageResult } from "./rules";

export const EMPTY_RECORD: CourseRecord = { semester: null, status: "todo", score: null };

export function recordOf(data: AppData, courseId: string): CourseRecord {
  return data.records[courseId] ?? EMPTY_RECORD;
}

/** Nhóm học phần đang áp dụng: khối Tốt nghiệp chỉ lấy nhóm của phương án đã chọn. */
export function activeGroups(data: AppData): CourseGroup[] {
  return GROUPS.filter((group) => !group.gradOption || group.gradOption === data.gradOption);
}

/** Học phần được tính trong nhóm: nhóm bắt buộc lấy hết, nhóm tự chọn lấy học phần đã tick. */
export function chosenIds(data: AppData, group: CourseGroup): string[] {
  if (group.mode === "required") return group.courseIds;
  const picked = data.selections[group.id] ?? [];
  return group.courseIds.filter((id) => picked.includes(id));
}

/** Nhóm (đang áp dụng) đã chọn học phần này, nếu có. */
export function ownerGroup(data: AppData, courseId: string): CourseGroup | undefined {
  return activeGroups(data).find((group) => chosenIds(data, group).includes(courseId));
}

/** Toàn bộ học phần sinh viên phải/đã chọn học, kèm nhóm của nó. */
export function activeEntries(data: AppData): { course: Course; group: CourseGroup }[] {
  const result: { course: Course; group: CourseGroup }[] = [];
  const seen = new Set<string>();
  for (const group of activeGroups(data))
    for (const id of chosenIds(data, group)) {
      const course = COURSE_BY_ID.get(id);
      if (course && !seen.has(id)) {
        seen.add(id);
        result.push({ course, group });
      }
    }
  return result;
}

export function activeCourses(data: AppData): Course[] {
  return activeEntries(data).map((entry) => entry.course);
}

/** Học phần Thể dục 1, 2 (không tính TC/GPA). */
export function peCourses(): Course[] {
  return PE_GROUP.courseIds.map((id) => COURSE_BY_ID.get(id)!);
}

/**
 * Điều kiện Giáo dục thể chất, suy ra từ mục Giáo dục thể chất ở trang Học phần:
 * chọn Miễn → Miễn; Thể dục 1 và 2 đều "Đã hoàn thành" với điểm đạt → Đạt; còn lại (đang học,
 * chưa học, chưa có điểm, rớt) → Chưa.
 */
export function peState(data: AppData): {
  state: ConditionState;
  passed: number;
  doing: number;
  total: number;
} {
  const records = PE_GROUP.courseIds.map((id) => recordOf(data, id));
  const passed = records.filter((item) => item.status === "done" && isPass(item.score)).length;
  const doing = records.filter((item) => item.status === "doing").length;
  const total = records.length;
  const state: ConditionState =
    data.conditions.pe === "exempt" ? "exempt" : passed === total ? "pass" : "none";
  return { state, passed, doing, total };
}

/** Học phần chọn được khi thêm lịch học/lịch thi: học phần đang tính + Thể dục (nếu không miễn). */
export function scheduleCourses(data: AppData): Course[] {
  return [...activeCourses(data), ...(data.conditions.pe === "exempt" ? [] : peCourses())];
}

export interface Warning {
  key: string;
  block: BlockId;
  blockName: string;
  kind: "BB" | "TC" | "—";
  subject: string;
  message: string;
  /** failed = học phần đã có điểm nhưng chưa đạt, cần học lại (tô màu khác). */
  tone: "todo" | "failed";
  /** Mã học phần hoặc mã nhóm để chuyển tới đúng chỗ ở trang Học phần. */
  focus: string;
  order: number;
}

export interface GroupProgress {
  group: CourseGroup;
  /** TC đã đạt trong nhóm. */
  earned: number;
  /** TC đã tick chọn (nhóm bắt buộc = toàn bộ). */
  selected: number;
  /** TC được tính cho nhóm, sau khi dồn TC vượt (khối ngành). */
  counted: number;
  /** TC còn thiếu để đủ nhóm. */
  shortfall: number;
  /** TC còn phải tick chọn thêm. */
  selectShortfall: number;
}

export interface BlockProgress {
  id: BlockId;
  name: string;
  earned: number;
  required: number;
}

export interface Stats {
  earned: number;
  doing: number;
  missing: number;
  /** GPA hệ 10, trung bình theo TC (điểm chữ/hệ 4 không dùng để tính). */
  gpa: number | null;
  scoredCount: number;
  blocks: BlockProgress[];
  groups: Map<string, GroupProgress>;
  warnings: Warning[];
  checks: { key: string; label: string; done: boolean }[];
  graduationReady: boolean;
  isNewUser: boolean;
  /** Học phần đặt học kỳ lớn hơn học kỳ hiện tại. */
  aheadOfSemester: Course[];
}

function spread(groups: CourseGroup[], amounts: number[], pooled: boolean): number[] {
  let surplus = 0;
  return groups.map((group, index) => {
    const available = amounts[index] + (pooled ? surplus : 0);
    const counted = Math.min(available, group.credits);
    surplus = available - counted;
    return counted;
  });
}

export function computeStats(data: AppData): Stats {
  const entries = activeEntries(data);
  const groups = activeGroups(data);
  let doing = 0;
  let sum10 = 0;
  let scoredCredits = 0;
  let scoredCount = 0;
  const warnings: Warning[] = [];
  const aheadOfSemester: Course[] = [];

  for (const { course, group } of entries) {
    const record = recordOf(data, course.id);
    if (record.status === "doing") doing += course.credits;
    if (record.semester !== null && record.semester > data.profile.currentSemester)
      aheadOfSemester.push(course);
    if (record.status === "done" && record.score !== null) {
      scoredCount += 1;
      // GPA tích lũy chỉ tính các học phần đã đạt (chia cho TC tích lũy, F-03).
      if (isPass(record.score)) {
        scoredCredits += course.credits;
        sum10 += record.score * course.credits;
      }
    }
    if (record.status === "done" && isPass(record.score)) continue;
    const failed = record.status === "done" && record.score !== null;
    warnings.push({
      key: course.id,
      block: group.block,
      blockName: blockLabel(group.block),
      kind: course.kind,
      subject: course.name,
      message: failed
        ? "Chưa đạt – cần học lại."
        : record.status === "doing"
          ? "Đang học."
          : "Chưa hoàn thành.",
      tone: failed ? "failed" : "todo",
      focus: course.id,
      order: record.semester ?? course.plan[0] ?? 9,
    });
  }

  const groupProgress = new Map<string, GroupProgress>();
  const blocks: BlockProgress[] = BLOCKS.map((block) => {
    const inBlock = groups.filter((group) => group.block === block.id);
    const pooled = POOLED_BLOCKS.includes(block.id);
    const passed = inBlock.map((group) =>
      chosenIds(data, group).reduce((sum, id) => {
        const record = recordOf(data, id);
        const ok = record.status === "done" && isPass(record.score);
        return sum + (ok ? (COURSE_BY_ID.get(id)?.credits ?? 0) : 0);
      }, 0),
    );
    const picked = inBlock.map((group) =>
      chosenIds(data, group).reduce((sum, id) => sum + (COURSE_BY_ID.get(id)?.credits ?? 0), 0),
    );
    const counted = spread(inBlock, passed, pooled);
    const pickedCounted = spread(inBlock, picked, pooled);
    inBlock.forEach((group, index) => {
      const progress: GroupProgress = {
        group,
        earned: passed[index],
        selected: picked[index],
        counted: counted[index],
        shortfall: group.credits - counted[index],
        selectShortfall: group.credits - pickedCounted[index],
      };
      groupProgress.set(group.id, progress);
      if (group.mode === "elective" && progress.selectShortfall > 0)
        warnings.push({
          key: `group-${group.id}`,
          block: block.id,
          blockName: block.label,
          kind: "TC",
          subject: group.title,
          message: `Chọn thêm ${progress.selectShortfall} TC.`,
          tone: "todo",
          focus: group.id,
          order: Math.min(...group.courseIds.map((id) => COURSE_BY_ID.get(id)?.plan[0] ?? 9)),
        });
    });
    const total = pooled ? passed.reduce((a, b) => a + b, 0) : counted.reduce((a, b) => a + b, 0);
    return {
      id: block.id,
      name: block.name,
      required: block.required,
      earned: Math.min(total, block.required),
    };
  });

  if (!data.gradOption)
    warnings.push({
      key: "grad-option",
      block: "graduation",
      blockName: blockLabel("graduation"),
      kind: "TC",
      subject: "Phương án tốt nghiệp",
      message: "Chưa chọn phương án.",
      tone: "todo",
      focus: "graduation",
      order: 7,
    });
  warnings.sort(
    (a, b) =>
      Number(b.tone === "failed") - Number(a.tone === "failed") ||
      a.order - b.order ||
      a.key.localeCompare(b.key),
  );

  const earned = blocks.reduce((sum, block) => sum + block.earned, 0);
  const gpa = scoredCredits > 0 ? sum10 / scoredCredits : null;
  const language = languageResult(
    data.conditions.langType,
    data.conditions.langScore,
    data.conditions.langScore2,
  );
  // Thể dục cũng nhắc khi đặt học kỳ vượt quá học kỳ hiện tại (trừ khi đã chọn Miễn).
  if (data.conditions.pe !== "exempt")
    for (const course of peCourses()) {
      const record = recordOf(data, course.id);
      if (record.semester !== null && record.semester > data.profile.currentSemester)
        aheadOfSemester.push(course);
    }
  const conditionOk = (value: string) => value === "pass" || value === "exempt";
  const checks = [
    {
      key: "credits",
      label: `Tích lũy đủ ${TOTAL_CREDITS_REQUIRED} tín chỉ.`,
      done: earned >= TOTAL_CREDITS_REQUIRED,
    },
    {
      key: "gpa",
      label: `GPA (hệ 10) từ ${GRADUATION_MIN_GPA.toFixed(1)} trở lên.`,
      done: gpa !== null && gpa >= GRADUATION_MIN_GPA,
    },
    {
      key: "conditions",
      label: "Hoàn tất Giáo dục quốc phòng – An ninh (có chứng chỉ GDQP-AN) và Giáo dục thể chất.",
      done: conditionOk(peState(data).state) && conditionOk(data.conditions.defense),
    },
    { key: "language", label: "Đạt chuẩn ngoại ngữ đầu ra.", done: language.state === "pass" },
  ];

  return {
    earned,
    doing,
    missing: Math.max(0, TOTAL_CREDITS_REQUIRED - earned),
    gpa,
    scoredCount,
    blocks,
    groups: groupProgress,
    warnings,
    checks,
    graduationReady: checks.every((item) => item.done),
    isNewUser:
      Object.keys(data.records).length === 0 &&
      Object.values(data.selections).every((ids) => ids.length === 0) &&
      !data.gradOption,
    aheadOfSemester,
  };
}

export function formatGpa(gpa: number | null, digits = 1): string {
  return gpa === null ? "Chưa có" : gpa.toFixed(digits);
}

/** Tình trạng thông tin học kỳ 1 … học kỳ hiện tại trong hồ sơ. */
export function semesterInfoStatus(profile: Profile): {
  total: number;
  filled: number;
  missing: number[];
} {
  const missing: number[] = [];
  for (let semester = 1; semester <= profile.currentSemester; semester++) {
    const info = profile.semesters[String(semester)];
    if (!info?.start || !info?.end || info.end <= info.start) missing.push(semester);
  }
  return {
    total: profile.currentSemester,
    filled: profile.currentSemester - missing.length,
    missing,
  };
}

/** Bỏ dấu và hạ chữ thường để tìm kiếm không phân biệt hoa thường/dấu. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

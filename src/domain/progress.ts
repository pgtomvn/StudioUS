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
import {
  GRADUATION_MIN_GPA,
  SEMESTER_LIMIT,
  STANDARD_SEMESTERS,
  TOTAL_CREDITS_REQUIRED,
  isPass,
  languageResult,
} from "./rules";

export const EMPTY_RECORD: CourseRecord = { semester: null, status: "todo", score: null };

export function recordOf(data: AppData, courseId: string): CourseRecord {
  return data.records[courseId] ?? EMPTY_RECORD;
}

/** Đang học: lần đầu (doing) hoặc đang học lại (retake). */
export const isStudying = (record: CourseRecord) =>
  record.status === "doing" || record.status === "retake";

/**
 * Số học kỳ của kế hoạch: 8 theo CTĐT, nhiều hơn khi sinh viên thêm học kỳ (học chậm).
 * Không bao giờ nhỏ hơn học kỳ hiện tại.
 */
export function semesterCount(profile: Profile): number {
  return Math.min(
    SEMESTER_LIMIT,
    Math.max(STANDARD_SEMESTERS, profile.semesterCount || 0, profile.currentSemester),
  );
}

/**
 * GPA của một học kỳ (hệ 10) = Σ(TC × điểm hệ 10) / Σ TC của mọi học phần có điểm trong học kỳ đó,
 * kể cả học phần chưa đạt và lần học trước của học phần học lại. Chỉ xét học phần thuộc 138 TC
 * (không tính Thể dục, GDQP, Ngoại ngữ). Báo cáo chỉ nêu xếp loại theo Bảng 4 cho điểm trung bình
 * học kỳ, không ghi công thức – cách tính này chưa đối chiếu Quy chế (xem docs/data-sources.md).
 */
export function semesterGpa(
  data: AppData,
  semester: number,
): { gpa: number | null; credits: number } {
  let credits = 0;
  let sum = 0;
  for (const { course } of activeEntries(data)) {
    const record = recordOf(data, course.id);
    const tries = [
      ...(record.attempts ?? []),
      ...(record.status === "done" ? [{ semester: record.semester, score: record.score }] : []),
    ];
    for (const item of tries)
      if (item.semester === semester && item.score !== null) {
        credits += course.credits;
        sum += course.credits * item.score;
      }
  }
  return { gpa: credits > 0 ? sum / credits : null, credits };
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
  /** Khối kiến thức; "condition" = điều kiện tốt nghiệp ngoài 138 TC (Thể chất, GDQP, ngoại ngữ). */
  block: BlockId | "condition";
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
  /**
   * TC tích lũy (F-03): tổng TC các học phần đạt đã chọn thuộc 138 TC, mỗi học phần tính một lần,
   * kể cả môn tự chọn học dư – có thể vượt 138. Cũng là mẫu số của GPA tích lũy.
   */
  earned: number;
  /** TC tính vào yêu cầu tốt nghiệp: mỗi nhóm/khối tối đa số TC quy định (≤ 138). */
  counted: number;
  doing: number;
  /** TC còn thiếu theo yêu cầu của từng khối (138 − counted). */
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
  let passedCredits = 0;
  let scoredCount = 0;
  const warnings: Warning[] = [];
  const aheadOfSemester: Course[] = [];

  for (const { course, group } of entries) {
    const record = recordOf(data, course.id);
    if (isStudying(record)) doing += course.credits;
    if (record.semester !== null && record.semester > data.profile.currentSemester)
      aheadOfSemester.push(course);
    if (record.status === "done" && record.score !== null) {
      scoredCount += 1;
      // GPA tích lũy chỉ tính các học phần đã đạt (chia cho TC tích lũy, F-03).
      if (isPass(record.score)) {
        passedCredits += course.credits;
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
        : record.status === "retake"
          ? "Đang học lại."
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
  conditionWarnings(data).forEach((warning) => warnings.push(warning));

  const counted = blocks.reduce((sum, block) => sum + block.earned, 0);
  // GPA tích lũy = Σ(TC × điểm hệ 10) / TC tích lũy, cùng một tập học phần đạt (F-03, mục 4.2).
  const earned = passedCredits;
  const gpa = earned > 0 ? sum10 / earned : null;
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
  warnings.sort(
    (a, b) =>
      Number(b.tone === "failed") - Number(a.tone === "failed") ||
      a.order - b.order ||
      a.key.localeCompare(b.key),
  );
  const conditionOk = (value: string) => value === "pass" || value === "exempt";
  const checks = [
    {
      key: "credits",
      label: `Tích lũy đủ ${TOTAL_CREDITS_REQUIRED} tín chỉ.`,
      done: counted >= TOTAL_CREDITS_REQUIRED,
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
    counted,
    doing,
    missing: Math.max(0, TOTAL_CREDITS_REQUIRED - counted),
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

const CONDITION_BLOCK = "Điều kiện tốt nghiệp";

/**
 * Nhiệm vụ của các điều kiện tốt nghiệp ngoài 138 TC: Thể dục 1, 2 (khi không chọn Miễn), GDQP-AN,
 * chuẩn ngoại ngữ. Nhờ vậy danh sách Nhiệm vụ chỉ trống khi đã xong hết, kể cả khi một môn Thể dục
 * hay chứng chỉ bị đổi lại sau khi đã đủ điều kiện.
 */
function conditionWarnings(data: AppData): Warning[] {
  const result: Warning[] = [];
  const base = { block: "condition" as const, blockName: CONDITION_BLOCK, order: 10 };
  if (data.conditions.pe !== "exempt")
    for (const course of peCourses()) {
      const record = recordOf(data, course.id);
      if (record.status === "done" && isPass(record.score)) continue;
      const failed = record.status === "done" && record.score !== null;
      result.push({
        ...base,
        key: course.id,
        blockName: "Giáo dục thể chất",
        kind: course.kind,
        subject: course.name,
        message: failed
          ? "Chưa đạt – cần học lại."
          : record.status === "retake"
            ? "Đang học lại."
            : record.status === "doing"
              ? "Đang học."
              : "Chưa hoàn thành.",
        tone: failed ? "failed" : "todo",
        focus: course.id,
      });
    }
  if (data.conditions.defense !== "pass" && data.conditions.defense !== "exempt")
    result.push({
      ...base,
      key: "defense",
      kind: "—",
      subject: "Giáo dục quốc phòng – An ninh",
      message: "Chưa có chứng chỉ GDQP-AN.",
      tone: "todo",
      focus: "conditions",
    });
  const language = languageResult(
    data.conditions.langType,
    data.conditions.langScore,
    data.conditions.langScore2,
  );
  if (language.state !== "pass")
    result.push({
      ...base,
      key: "language",
      kind: "—",
      subject: "Chuẩn ngoại ngữ đầu ra",
      message:
        language.state === "empty"
          ? "Chưa nhập chứng chỉ."
          : `Chưa đạt mức tối thiểu (${language.cert?.display}).`,
      tone: language.state === "fail" ? "failed" : "todo",
      focus: "conditions",
    });
  return result;
}

/** GPA hiện 2 chữ số thập phân để khớp với ngưỡng xếp loại (VD 7.96 là Khá, không làm tròn thành 8.0). */
export function formatGpa(gpa: number | null, digits = 2): string {
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

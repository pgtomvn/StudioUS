import { describe, expect, it } from "vitest";
import { BLOCKS, GROUP_BY_ID, PE_GROUP } from "../../src/data/curriculum";
import { createCompletedSampleData, createSampleData } from "../../src/data/sample.demo";
import {
  activeEntries,
  computeStats,
  peState,
  recordOf,
  scheduleCourses,
} from "../../src/domain/progress";
import { convertScore, isPass, languageResult } from "../../src/domain/rules";
import { CLASS_COLORS, inkOn } from "../../src/lib/color";
import { validateImport } from "../../src/lib/storage/storage";
import {
  buildWeeks,
  classesWithoutWeeks,
  daysUntil,
  examDate,
  layoutOverlaps,
  nextExam,
  semestersAhead,
} from "../../src/lib/time";

// Ngày cố định để kết quả kiểm thử không phụ thuộc hôm nay.
const NOW = new Date(2026, 10, 22, 10, 0);
const data = createSampleData(NOW);

describe("bộ dữ liệu mẫu đủ để thử các chức năng", () => {
  it("là dữ liệu hợp lệ, khôi phục được từ file sao lưu", () => {
    const result = validateImport("student_k26_2026-11-22.json", JSON.stringify(data));
    expect(result.ok).toBe(true);
  });

  it("điểm có đủ 8 bậc chữ, cả đạt và chưa đạt; đủ ba trạng thái", () => {
    const scores = Object.values(data.records)
      .filter((record) => record.score !== null)
      .map((record) => record.score!);
    const letters = new Set(scores.map((score) => convertScore(score).letter));
    expect([...letters].sort()).toEqual(["A", "A+", "B", "B+", "C", "D", "D+", "F"].sort());
    expect(scores.some((score) => !isPass(score))).toBe(true);
    const statuses = new Set(Object.values(data.records).map((record) => record.status));
    expect(statuses).toEqual(new Set(["todo", "doing", "done"]));
  });

  it("có học phần ở cả 4 khối; nhóm tự chọn có nhóm đủ, nhóm thiếu, nhóm chọn qua hộp tìm", () => {
    const blocks = new Set(activeEntries(data).map(({ group }) => group.block));
    for (const block of BLOCKS) expect(blocks.has(block.id), block.id).toBe(true);
    const stats = computeStats(data);
    expect(stats.groups.get("ge-social")?.selectShortfall).toBe(0);
    expect(stats.groups.get("ge-environment")?.selectShortfall).toBeGreaterThan(0);
    expect(GROUP_BY_ID.get("major-free")?.picker).toBe(true);
    expect(data.selections["major-free"]?.length).toBeGreaterThan(0);
    expect(data.gradOption).toBe("project");
    expect(data.selections["grad-project-pick"]).toHaveLength(1);
  });

  it("có học phần cần học lại và học phần chọn học kỳ vượt quá học kỳ hiện tại", () => {
    const stats = computeStats(data);
    expect(stats.warnings.filter((warning) => warning.tone === "failed")).toHaveLength(3);
    expect(stats.aheadOfSemester.map((course) => course.id)).toEqual(["BIO00081"]);
    expect(stats.gpa).not.toBeNull();
  });

  it("điều kiện phụ: Thể dục 1 đạt, Thể dục 2 đang học; GDQP đạt; TOEIC thiếu Nói–Viết", () => {
    const pe = peState(data);
    expect(pe).toMatchObject({ state: "none", passed: 1, doing: 1 });
    expect(data.conditions.defense).toBe("pass");
    const language = languageResult(
      data.conditions.langType,
      data.conditions.langScore,
      data.conditions.langScore2,
    );
    expect(language.state).toBe("fail");
    expect(data.conditions.langScore).toBeGreaterThanOrEqual(language.cert!.min);
  });

  it("lịch học: cùng môn có Lý thuyết và Thực hành, có buổi trùng giờ, màu tự chọn, Thể dục, HK3", () => {
    const current = data.classes.filter((item) => item.semester === data.profile.currentSemester);
    const kindsByCourse = new Map<string, Set<string>>();
    for (const item of current)
      kindsByCourse.set(
        item.courseId,
        (kindsByCourse.get(item.courseId) ?? new Set()).add(item.kind),
      );
    expect([...kindsByCourse.values()].some((kinds) => kinds.size === 2)).toBe(true);
    const monday = layoutOverlaps(current.filter((item) => item.day === 1));
    expect(Math.max(...[...monday.values()].map((place) => place.lanes))).toBe(2);
    const custom = data.classes.find(
      (item) => !CLASS_COLORS.some((color) => color.value === item.color.toLowerCase()),
    );
    expect(custom && inkOn(custom.color)).toBe("#ffffff");
    expect(current.some((item) => PE_GROUP.courseIds.includes(item.courseId))).toBe(true);
    const schedulable = new Set(scheduleCourses(data).map((course) => course.id));
    for (const item of data.classes)
      expect(schedulable.has(item.courseId), item.courseId).toBe(true);
    expect(semestersAhead(data)).toEqual([{ semester: 3, classes: 1, exams: 1 }]);
  });

  it("lịch HK3 (chưa có ngày bắt đầu) vẫn xem được theo thứ trong tuần", () => {
    expect(buildWeeks(data.profile, [3], data.classes)).toEqual([]);
    expect(classesWithoutWeeks(data.profile, [3], data.classes).map((item) => item.id)).toEqual([
      "s10",
    ]);
    // học kỳ đã có ngày bắt đầu thì xem theo tuần như thường
    expect(buildWeeks(data.profile, [2], data.classes).length).toBeGreaterThan(0);
    expect(classesWithoutWeeks(data.profile, [2], data.classes)).toEqual([]);
  });

  it("lịch thi: lịch gần nhất nằm trong số ngày nhắc; có lịch xa và lịch đã qua", () => {
    const upcoming = nextExam(data.exams, NOW)!;
    expect(daysUntil(examDate(upcoming), NOW)).toBeLessThanOrEqual(upcoming.remindDays);
    expect(data.exams.some((item) => daysUntil(examDate(item), NOW) > 30)).toBe(true);
    expect(data.exams.some((item) => examDate(item) < NOW)).toBe(true);
    // mọi học phần có lịch thi đều đang được chọn
    for (const item of data.exams)
      expect(recordOf(data, item.courseId).semester, item.courseId).not.toBeNull();
  });
});

describe("bộ dữ liệu mẫu đã hoàn thành chương trình", () => {
  const done = createCompletedSampleData(NOW);
  const stats = computeStats(done);

  it("hợp lệ, mọi học phần đã chọn đều đạt, không còn nhiệm vụ", () => {
    expect(validateImport("student_k26_2026-11-22.json", JSON.stringify(done)).ok).toBe(true);
    expect(Object.values(done.records).every((record) => isPass(record.score))).toBe(true);
    expect(stats.warnings).toEqual([]);
    expect(stats.aheadOfSemester).toEqual([]);
  });

  it("vượt 138 TC: số tích lũy là số thực tế, phần tính vào yêu cầu đủ 138, còn lại 0", () => {
    expect(stats.earned).toBeGreaterThan(138);
    expect(stats.counted).toBe(138);
    expect(stats.missing).toBe(0);
    for (const block of stats.blocks) expect(block.earned, block.id).toBe(block.required);
  });

  it("đủ mọi điều kiện tốt nghiệp", () => {
    expect(peState(done).state).toBe("pass");
    expect(stats.checks.every((check) => check.done)).toBe(true);
    expect(stats.graduationReady).toBe(true);
  });

  it("GPA tích lũy đúng công thức Σ(TC × điểm hệ 10) / TC tích lũy", () => {
    const passed = activeEntries(done)
      .map(({ course }) => ({ course, record: recordOf(done, course.id) }))
      .filter(({ record }) => record.status === "done" && isPass(record.score));
    const credits = passed.reduce((sum, { course }) => sum + course.credits, 0);
    const weighted = passed.reduce(
      (sum, { course, record }) => sum + course.credits * record.score!,
      0,
    );
    expect(credits).toBe(stats.earned);
    expect(stats.gpa).toBeCloseTo(weighted / credits, 10);
  });
});

describe("GPA của bộ mẫu đang học (tính tay)", () => {
  it("5 môn đạt, 17 TC: (4×9.1 + 4×8.5 + 4×7.8 + 2×6.5 + 3×5.4) / 17 ≈ 7.69", () => {
    const stats = computeStats(data);
    expect(stats.earned).toBe(17);
    expect(stats.gpa).toBeCloseTo((4 * 9.1 + 4 * 8.5 + 4 * 7.8 + 2 * 6.5 + 3 * 5.4) / 17, 10);
    expect(stats.gpa!.toFixed(2)).toBe("7.69");
  });
});

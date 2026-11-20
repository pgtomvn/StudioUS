import { describe, expect, it } from "vitest";
import {
  BLOCKS,
  COURSE_BY_ID,
  GROUPS,
  PE_GROUP,
  TOTAL_PROGRAM_CREDITS,
} from "../../src/data/curriculum";
import {
  computeStats,
  fold,
  peState,
  scheduleCourses,
  semesterInfoStatus,
} from "../../src/domain/progress";
import { convertScore, isPass, languageResult, parseScore, rankOf } from "../../src/domain/rules";
import { createDefaultData } from "../../src/lib/storage/storage";
import { FACE_INDEX, affection, affectionLines, greeting, secretTyped } from "../../src/lib/mascot";
import {
  buildWeeks,
  classesOverlap,
  countdownParts,
  findExamClash,
  semestersAhead,
  slotIndexOf,
} from "../../src/lib/time";
import type { AppData } from "../../src/types";

const done = (semester: number, score: number) => ({ semester, status: "done" as const, score });

describe("danh mục CTĐT KTPM khóa tuyển 2025", () => {
  it("tổng TC các khối bằng 138 và khớp mục 6 của CTĐT", () => {
    expect(TOTAL_PROGRAM_CREDITS).toBe(138);
    expect(BLOCKS.map((block) => block.required)).toEqual([56, 38, 34, 10]);
    const sum = (block: string) =>
      GROUPS.filter((group) => group.block === block && !group.gradOption).reduce(
        (total, group) => total + group.credits,
        0,
      );
    expect(sum("general")).toBe(56);
    expect(sum("foundation")).toBe(38);
    expect(sum("major")).toBe(34);
  });

  it("nhóm bắt buộc có tổng TC đúng bằng yêu cầu của nhóm", () => {
    for (const group of GROUPS.filter((item) => item.mode === "required" && !item.gradOption)) {
      const credits = group.courseIds.reduce((t, id) => t + COURSE_BY_ID.get(id)!.credits, 0);
      expect(credits, group.id).toBe(group.credits);
    }
  });

  it("có đủ 104 học phần của Phụ lục 1 (gồm 7.2.2.1, 7.2.2.2 và 4 học phần tốt nghiệp)", () => {
    const ids = new Set(
      ["major-core", "major-elective", "major-free"].flatMap(
        (id) => GROUPS.find((group) => group.id === id)!.courseIds,
      ),
    );
    expect(ids.size).toBe(104);
    expect(GROUPS.find((group) => group.id === "major-free")!.courseIds).toHaveLength(79);
  });
});

describe("tổng hợp tiến độ", () => {
  it("người dùng mới: 0 TC, GPA chưa có, không chia cho 0", () => {
    const stats = computeStats(createDefaultData());
    expect(stats.earned).toBe(0);
    expect(stats.gpa).toBeNull();
    expect(stats.isNewUser).toBe(true);
    expect(stats.blocks.every((block) => block.earned === 0)).toBe(true);
  });

  it("đạt khi điểm ≥ 5.0; GPA tính từ điểm hệ 10, trung bình theo tín chỉ", () => {
    const data = createDefaultData();
    data.records.MTH00021 = done(1, 9); // A
    data.records.MTH00045 = done(1, 5); // D+ – vẫn đạt
    data.records.CSC00004 = done(1, 4.9); // D – chưa đạt
    data.records.BAA00004 = done(2, 6); // 3 TC
    data.records.CSC10012 = { semester: 1, status: "doing", score: null };
    const stats = computeStats(data);
    expect(stats.earned).toBe(11);
    expect(stats.doing).toBe(4);
    expect(stats.gpa).toBeCloseTo((9 * 4 + 5 * 4 + 4.9 * 4 + 6 * 3) / 15);
    expect(stats.warnings[0]).toMatchObject({ focus: "CSC00004", tone: "failed" });
    expect(stats.checks.find((check) => check.key === "gpa")).toMatchObject({
      label: "GPA (hệ 10) từ 5.0 trở lên.",
      done: true,
    });
  });

  it("môn tự chọn chỉ được tính khi đã tick, và mỗi nhóm chỉ tính tối đa số TC yêu cầu", () => {
    const data = createDefaultData();
    data.records.BAA00005 = done(4, 8);
    data.records.BAA00006 = done(4, 8);
    expect(computeStats(data).earned).toBe(0);
    data.selections["ge-social"] = ["BAA00005", "BAA00006"];
    const stats = computeStats(data);
    expect(stats.groups.get("ge-social")!.earned).toBe(4);
    expect(stats.earned).toBe(2);
  });

  it("nhắc chọn thêm TC khi tick chưa đủ nhóm tự chọn", () => {
    const data = createDefaultData();
    data.selections["ge-science"] = ["PHY00001", "PHY00081"];
    const stats = computeStats(data);
    expect(stats.groups.get("ge-science")!.selectShortfall).toBe(1);
    expect(stats.warnings.find((item) => item.key === "group-ge-science")?.message).toBe(
      "Chọn thêm 1 TC.",
    );
  });

  it("khối ngành: TC vượt của 7.2.2.1 được dồn sang 7.2.2.2 và tự chọn tự do", () => {
    const data = createDefaultData();
    const core = ["CSC13003", "CSC13005", "CSC13006", "CSC13008", "CSC13010"];
    data.selections["major-core"] = core;
    for (const id of core) data.records[id] = done(6, 8);
    const stats = computeStats(data);
    expect(stats.groups.get("major-core")!.counted).toBe(16);
    expect(stats.groups.get("major-elective")!.counted).toBe(4);
    expect(stats.blocks.find((block) => block.id === "major")!.earned).toBe(20);
  });

  it("khối Tốt nghiệp chỉ tính phương án đã chọn; phương án 3 cần thêm 01 học phần 4 TC", () => {
    const data = createDefaultData();
    data.gradOption = "project";
    data.records.CSC10204 = done(8, 8);
    data.records.CSC10251 = done(8, 10); // thuộc phương án khác
    const graduation = () => computeStats(data).blocks.find((block) => block.id === "graduation")!;
    expect(graduation().earned).toBe(6);
    data.selections["grad-project-pick"] = ["CSC13116"];
    data.records.CSC13116 = done(8, 7);
    expect(graduation().earned).toBe(10);
  });

  it("phát hiện học phần đặt học kỳ vượt quá học kỳ hiện tại", () => {
    const data = createDefaultData();
    data.profile.currentSemester = 1;
    data.records.MTH00022 = { semester: 2, status: "doing", score: null };
    data.records.MTH00021 = { semester: 1, status: "doing", score: null };
    expect(computeStats(data).aheadOfSemester.map((course) => course.id)).toEqual(["MTH00022"]);
  });

  it("thông tin học kỳ phải nhập đủ từ HK1 tới học kỳ hiện tại", () => {
    const data: AppData = createDefaultData();
    data.profile.currentSemester = 2;
    data.profile.semesters = {
      "1": { start: "2026-09-07", end: "2027-01-10" },
      "2": { start: "2027-02-15", end: "" },
    };
    expect(semesterInfoStatus(data.profile)).toEqual({ total: 2, filled: 1, missing: [2] });
  });
});

describe("Giáo dục thể chất (học phần điều kiện)", () => {
  const conditionsCheck = (data: AppData) =>
    computeStats(data).checks.find((check) => check.key === "conditions")!.done;

  it("Thể dục 1, 2 không nằm trong khối nào và không cộng TC/GPA", () => {
    expect(PE_GROUP.courseIds).toEqual(["BAA00021", "BAA00022"]);
    expect(GROUPS.some((group) => group.courseIds.includes("BAA00021"))).toBe(false);
    const data = createDefaultData();
    data.records = { BAA00021: done(1, 9), BAA00022: done(2, 9) };
    const stats = computeStats(data);
    expect(stats.earned).toBe(0);
    expect(stats.gpa).toBeNull();
  });

  it("đạt cả hai môn → Đạt; đang học hoặc thiếu điểm → Chưa; chọn Miễn → Miễn", () => {
    const data = createDefaultData();
    data.conditions = { ...data.conditions, defense: "pass" };
    expect(peState(data).state).toBe("none");
    data.records = {
      BAA00021: done(1, 8),
      BAA00022: { semester: 2, status: "doing", score: null },
    };
    expect(peState(data)).toEqual({ state: "none", passed: 1, doing: 1, total: 2 });
    expect(conditionsCheck(data)).toBe(false);
    data.records.BAA00022 = done(2, 4);
    expect(peState(data).state).toBe("none");
    data.records.BAA00022 = done(2, 6.5);
    expect(peState(data).state).toBe("pass");
    expect(conditionsCheck(data)).toBe(true);
    // Giá trị "Đạt" bấm tay ở bản cũ không còn được dùng: phải nhập Thể dục 1, 2.
    const legacy = createDefaultData();
    legacy.conditions = { ...legacy.conditions, pe: "pass" };
    expect(peState(legacy).state).toBe("none");
    legacy.conditions.pe = "exempt";
    expect(peState(legacy).state).toBe("exempt");
  });

  it("thêm lịch được chọn Thể dục, trừ khi đã Miễn; học kỳ vượt quá thì nhắc", () => {
    const data = createDefaultData();
    expect(scheduleCourses(data).map((course) => course.id)).toContain("BAA00022");
    data.records = { BAA00022: { semester: 3, status: "todo", score: null } };
    expect(computeStats(data).aheadOfSemester.map((course) => course.id)).toEqual(["BAA00022"]);
    data.conditions = { ...data.conditions, pe: "exempt" };
    expect(scheduleCourses(data).map((course) => course.id)).not.toContain("BAA00022");
    expect(computeStats(data).aheadOfSemester).toEqual([]);
  });
});

describe("quy tắc điểm (báo cáo UI/UX) và chuẩn ngoại ngữ", () => {
  it("quy đổi 8 bậc A, B+, B, C+, C, D+, D, F sang hệ 4 (chỉ để xem)", () => {
    const table = [
      [9.1, "A", 4],
      [8.5, "A", 4],
      [8.0, "B+", 3.5],
      [7.9, "B", 3],
      [7.0, "B", 3],
      [6.5, "C+", 2.5],
      [5.5, "C", 2],
      [5.0, "D+", 1.5],
      [4.5, "D", 1],
      [3.9, "F", 0],
    ] as const;
    for (const [score, letter, point4] of table)
      expect(convertScore(score), String(score)).toEqual({ letter, point4 });
    expect(isPass(5)).toBe(true);
    expect(isPass(4.99)).toBe(false);
    expect(isPass(null)).toBe(false);
  });

  it("xếp loại theo GPA hệ 10", () => {
    expect(rankOf(9.2)).toBe("Xuất sắc");
    expect(rankOf(8.0)).toBe("Giỏi");
    expect(rankOf(7.2)).toBe("Khá");
    expect(rankOf(5.0)).toBe("Trung bình");
    expect(rankOf(4.5)).toBe("Yếu");
    expect(rankOf(null)).toBe("Chưa có");
  });

  it("chuẩn ngoại ngữ Bảng 5, TOEIC cần đủ cả hai phần", () => {
    expect(languageResult("IELTS", 4.5).state).toBe("pass");
    expect(languageResult("IELTS", 4).state).toBe("fail");
    expect(languageResult("VSTEP", 3).state).toBe("pass");
    expect(languageResult("TOEIC", 500, null).state).toBe("empty");
    expect(languageResult("TOEIC", 500, 170).state).toBe("fail");
    expect(languageResult("TOEIC", 450, 181).state).toBe("pass");
  });

  it("điểm nhập chỉ nhận 0–10, chấp nhận dấu phẩy", () => {
    expect(parseScore("8,5")).toBe(8.5);
    expect(parseScore("0")).toBe(0);
    expect(parseScore("10.5")).toBeNull();
    expect(parseScore("abc")).toBeNull();
  });

  it("tìm kiếm không phân biệt hoa thường và dấu", () => {
    expect(fold("Toán rời rạc")).toBe("toan roi rac");
    expect(fold("Đại cương")).toBe("dai cuong");
  });
});

describe("tuần học theo học kỳ", () => {
  const profile = {
    ...createDefaultData().profile,
    currentSemester: 2,
    semesters: {
      "1": { start: "2026-09-09", end: "2026-12-20" },
      "2": { start: "2027-01-04", end: "" },
    },
  };

  it("tuần luôn bắt đầu từ 1, tuần 1 tính từ thứ Hai, không có tuần 0 hay âm", () => {
    const slots = buildWeeks(profile, [1], []);
    expect(slots[0].week).toBe(1);
    expect(slots[0].from).toEqual(new Date(2026, 8, 7));
    expect(slots.every((slot) => slot.week >= 1)).toBe(true);
    expect(slots).toHaveLength(15);
  });

  it("chọn Tất cả nối các học kỳ; học kỳ chưa có ngày kết thúc dùng 15 tuần hoặc tuần lớn nhất đã nhập", () => {
    const slots = buildWeeks(
      profile,
      [1, 2],
      [
        {
          id: "a",
          courseId: "X",
          kind: "theory",
          semester: 2,
          day: 1,
          start: "07:30",
          end: "09:00",
          room: "",
          weekFrom: 1,
          weekTo: 18,
          color: "",
          note: "",
        },
      ],
    );
    expect(slots.filter((slot) => slot.semester === 2)).toHaveLength(18);
    expect(slotIndexOf(slots, new Date(2027, 0, 6))).toBe(15);
    expect(slotIndexOf(slots, new Date(2026, 0, 1))).toBe(-1);
  });

  it("trùng lịch chỉ xét cùng học kỳ; đếm ngược tách tháng/ngày/giờ/phút", () => {
    const base = {
      courseId: "A",
      kind: "theory" as const,
      semester: 1,
      day: 1,
      start: "08:00",
      end: "10:00",
      room: "x",
      weekFrom: 1,
      weekTo: 10,
      color: "",
      note: "",
    };
    expect(classesOverlap(base, { ...base, id: "b", start: "09:00", end: "11:00" })).toBe(true);
    expect(classesOverlap(base, { ...base, id: "b", semester: 2 })).toBe(false);
    expect(classesOverlap(base, { ...base, id: "b", start: "10:00", end: "11:00" })).toBe(false);
    const parts = countdownParts(new Date(2026, 11, 20, 10, 30), new Date(2026, 10, 12, 8, 15));
    expect(parts).toEqual({ months: 1, days: 8, hours: 2, minutes: 15 });
  });
});

describe("lịch thi trùng ca và lịch thuộc học kỳ vượt quá", () => {
  const exam = (id: string, courseId: string, semester: number, date: string, time: string) => ({
    id,
    courseId,
    semester,
    kind: "mid" as const,
    date,
    time,
    room: "F1",
    remindDays: 3,
    note: "",
  });

  it("khác ngày cùng giờ thì không trùng; cùng ngày cùng giờ mới trùng; bỏ qua chính lịch đang sửa", () => {
    const exams = [exam("v", "MTH00021", 1, "2026-11-17", "07:30")];
    expect(findExamClash({ date: "2026-11-20", time: "07:30" }, exams)).toBeUndefined();
    expect(findExamClash({ date: "2026-11-17", time: "07:30" }, exams)?.id).toBe("v");
    expect(findExamClash({ id: "v", date: "2026-11-17", time: "07:30" }, exams)).toBeUndefined();
  });

  it("tìm ra lịch học/lịch thi thuộc học kỳ lớn hơn học kỳ hiện tại (đang bị ẩn khỏi “Tất cả”)", () => {
    const data = createDefaultData();
    data.profile.currentSemester = 1;
    data.exams = [
      exam("hidden", "MTH00021", 2, "2026-11-20", "07:30"),
      exam("ok", "CSC00004", 1, "2026-11-20", "07:30"),
    ];
    expect(semestersAhead(data)).toEqual([{ semester: 2, classes: 0, exams: 1 }]);
    // Đây là tình huống người dùng báo: lịch Nhập môn 20/11 bị báo trùng với lịch Vi tích phân 1 bị ẩn.
    expect(findExamClash({ id: "ok", date: "2026-11-20", time: "07:30" }, data.exams)?.id).toBe(
      "hidden",
    );
    data.profile.currentSemester = 2;
    expect(semestersAhead(data)).toEqual([]);
  });
});

describe("linh vật", () => {
  it("mức thân thiết theo số lần xoa đầu", () => {
    expect(affection(0)).toEqual({ level: 1, from: 0, next: 5 });
    expect(affection(5)).toEqual({ level: 2, from: 5, next: 15 });
    expect(affection(119).level).toBe(6);
    expect(affection(500)).toEqual({ level: 7, from: 120, next: null });
    expect(affectionLines(7).length).toBeGreaterThan(affectionLines(1).length);
  });

  it("lời chào theo giờ và mật mã bí mật", () => {
    expect(greeting(7)).toContain("buổi sáng");
    expect(greeting(12)).toContain("Trưa");
    expect(greeting(2)).toContain("Khuya");
    expect(secretTyped("abcSTUDIOUS")).toBe("studious");
    expect(secretTyped("xxhcmus")).toBe("hcmus");
    expect(secretTyped("studiou")).toBeNull();
  });

  it("thứ tự nét mặt khớp sprite 7 khung", () => {
    expect(Object.keys(FACE_INDEX)).toEqual([
      "idle",
      "blink",
      "happy",
      "sad",
      "sleep",
      "surprised",
      "love",
    ]);
  });
});

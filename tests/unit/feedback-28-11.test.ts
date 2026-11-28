import { beforeEach, describe, expect, it } from "vitest";
import { COURSE_BY_ID } from "../../src/data/curriculum";
import { createCompletedSampleData, createSampleData } from "../../src/data/sample.demo";
import { computeStats, semesterCount, semesterGpa } from "../../src/domain/progress";
import { computeCourseScore, type CalcState } from "../../src/features/curriculum/ScoreTools";
import { buildCsv, workbookSheets } from "../../src/lib/export";
import {
  createDefaultData,
  exportFileName,
  loadData,
  validateImport,
  type KeyValueStore,
} from "../../src/lib/storage/storage";
import { actions, getState } from "../../src/lib/store";
import { academicYear } from "../../src/lib/time";
import { buildXlsx, columnName, crc32 } from "../../src/lib/xlsx";

const NOW = new Date(2026, 10, 22, 10, 0);

describe("Nhiệm vụ cập nhật lại sau khi đã đủ điều kiện tốt nghiệp", () => {
  const done = createCompletedSampleData(NOW);

  it("bộ mẫu hoàn thành không còn nhiệm vụ", () => {
    expect(computeStats(done).warnings).toEqual([]);
  });

  it("đổi Thể dục 2 về Chưa học → có nhiệm vụ Thể dục 2", () => {
    const changed = {
      ...done,
      records: { ...done.records, BAA00022: { semester: 2, status: "todo" as const, score: null } },
    };
    const stats = computeStats(changed);
    expect(stats.warnings.map((warning) => warning.key)).toEqual(["BAA00022"]);
    expect(stats.graduationReady).toBe(false);
  });

  it("bỏ chứng chỉ GDQP, ngoại ngữ dưới chuẩn → có nhiệm vụ tương ứng", () => {
    const changed = {
      ...done,
      conditions: { ...done.conditions, defense: "none" as const, langScore: 4.0 },
    };
    const keys = computeStats(changed).warnings.map((warning) => warning.key);
    expect(keys).toEqual(["language", "defense"]);
  });

  it("chọn Miễn Giáo dục thể chất thì không nhắc Thể dục", () => {
    const changed = {
      ...done,
      records: { ...done.records, BAA00022: { semester: 2, status: "todo" as const, score: null } },
      conditions: { ...done.conditions, pe: "exempt" as const },
    };
    expect(computeStats(changed).warnings).toEqual([]);
  });
});

describe("GPA học kỳ", () => {
  it("tính mọi học phần có điểm trong học kỳ, kể cả chưa đạt và lần học trước", () => {
    const data = createSampleData(NOW);
    // HK1: 4×9.1 + 4×8.5 + 4×7.8 + 2×6.5 + 3×5.4 + 3×4.6 (MTH… D+) + … tính bằng tay theo TC thật
    const { gpa, credits } = semesterGpa(data, 1);
    expect(credits).toBeGreaterThan(computeStats(data).earned);
    expect(gpa).not.toBeNull();
    expect(semesterGpa(data, 2).gpa).toBeNull();
  });

  it("học kỳ không có điểm → null; Thể dục không tính", () => {
    const data = createDefaultData();
    data.records.BAA00021 = { semester: 1, status: "done", score: 9 };
    expect(semesterGpa(data, 1)).toEqual({ gpa: null, credits: 0 });
  });
});

describe("Học lại và lịch sử học lại", () => {
  beforeEach(() => actions.replaceData(createSampleData(NOW)));

  it("chọn Học lại: lưu lần trước, mở lần mới ở học kỳ hiện tại, chưa có điểm", () => {
    actions.setRecord("MTH00045", {}); // D 3.5 ở HK1, học kỳ hiện tại là HK2
    actions.startRetake("MTH00045");
    expect(getState().data.records.MTH00045).toEqual({
      semester: 2,
      status: "retake",
      score: null,
      attempts: [{ semester: 1, score: 3.5 }],
    });
    // đang học lại được tính là đang học, nhiệm vụ ghi “Đang học lại.”
    const warning = computeStats(getState().data).warnings.find((item) => item.key === "MTH00045");
    expect(warning?.message).toBe("Đang học lại.");
  });

  it("học lại lần nữa: lần trước ở học kỳ hiện tại thì lần mới sang học kỳ kế tiếp", () => {
    actions.setRecord("MTH00045", { semester: 2 });
    actions.setRecord("MTH00045", { status: "done", score: 4.0 });
    actions.startRetake("MTH00045");
    expect(getState().data.records.MTH00045.semester).toBe(3);
  });

  it("không học lại được khi chưa có điểm; điểm lần hiện tại mới tính vào GPA tích lũy", () => {
    const before = getState().data.records.MTH00022;
    actions.startRetake("MTH00022"); // đang học, chưa có điểm
    expect(getState().data.records.MTH00022).toEqual(before);
    actions.startRetake("MTH00045");
    actions.setRecord("MTH00045", { status: "done", score: 8.0 });
    const stats = computeStats(getState().data);
    expect(stats.earned).toBe(17 + COURSE_BY_ID.get("MTH00045")!.credits);
  });

  it("xóa một lần trong lịch sử; hết lịch sử thì Học lại trở về Đang học; hoàn tác", () => {
    actions.startRetake("MTH00045");
    const before = getState().data;
    actions.removeAttempt("MTH00045", 0);
    expect(getState().data.records.MTH00045).toEqual({
      semester: 2,
      status: "doing",
      score: null,
    });
    actions.restore(before, { records: ["MTH00045"] });
    expect(getState().data.records.MTH00045.attempts).toHaveLength(1);
  });
});

describe("Tính thử điểm học phần", () => {
  const part = (name: string, weight: string, score: string) => ({ id: 0, name, weight, score });
  const base = (): CalcState => ({
    theory: {
      weight: "70",
      parts: [part("Giữa kỳ", "40", "6"), part("Cuối kỳ", "60", "8")],
    },
    lab: { weight: "30", parts: [part("Thực hành", "100", "9")] },
    bonus: "",
  });

  it("LT 70% (40% GK + 60% CK) + TH 30%, làm tròn 1 chữ số", () => {
    // LT = 0.4×6 + 0.6×8 = 7.2; tổng = 0.7×7.2 + 0.3×9 = 7.74 → 7.7
    const result = computeCourseScore(base());
    expect(result.errors).toEqual([]);
    expect(result.raw).toBeCloseTo(7.74, 10);
    expect(result.final).toBe(7.7);
  });

  it("điểm cộng 0–1 cộng thẳng vào kết quả, điểm học phần tối đa 10", () => {
    expect(computeCourseScore({ ...base(), bonus: "0,5" }).final).toBe(8.2);
    expect(computeCourseScore({ ...base(), bonus: "1.5" }).errors).toEqual([
      "Điểm cộng là số từ 0 đến 1.",
    ]);
    const high = base();
    high.theory.parts = [part("Cuối kỳ", "100", "10")];
    high.lab.parts = [part("Thực hành", "100", "9.8")];
    expect(computeCourseScore({ ...high, bonus: "1" }).final).toBe(10);
  });

  it("điểm thành phần ngoài 0–10 (VD -5) là lỗi", () => {
    const state = base();
    state.lab.parts[0].score = "-5";
    expect(computeCourseScore(state).errors).toEqual(["Thực hành: điểm là số từ 0 đến 10."]);
  });

  it("Thực hành 0% thì bỏ qua phần Thực hành", () => {
    const state = base();
    state.theory.weight = "100";
    state.lab = { weight: "0", parts: [part("Thực hành", "100", "")] };
    expect(computeCourseScore(state).final).toBe(7.2);
  });

  it("báo lỗi khi trọng số không đủ 100% hoặc thiếu điểm", () => {
    const state = base();
    state.lab.weight = "20";
    state.theory.parts[1].score = "";
    const { final, errors } = computeCourseScore(state);
    expect(final).toBeNull();
    expect(errors).toEqual([
      "Lý thuyết + Thực hành phải bằng 100% (đang 90%).",
      "Lý thuyết: còn 1 thành phần chưa nhập điểm.",
    ]);
  });
});

describe("Khóa, số học kỳ và xuất file", () => {
  it("năm học theo khóa: K25 bắt đầu 2025–2026, K26 bắt đầu 2026–2027", () => {
    expect(academicYear(1, "K25")).toBe("2025–2026");
    expect(academicYear(9, "K25")).toBe("2029–2030");
    expect(academicYear(1, "K26")).toBe("2026–2027");
  });

  it("số học kỳ: tối thiểu 8, không nhỏ hơn học kỳ hiện tại, tối đa 16", () => {
    const profile = createDefaultData().profile;
    expect(semesterCount(profile)).toBe(8);
    expect(semesterCount({ ...profile, semesterCount: 10 })).toBe(10);
    expect(semesterCount({ ...profile, currentSemester: 11 })).toBe(11);
    expect(semesterCount({ ...profile, semesterCount: 40 })).toBe(16);
  });

  it("file cũ chưa có số học kỳ: lấy theo học kỳ lớn nhất đang dùng; khóa lạ về K26", () => {
    const old = createSampleData(NOW) as unknown as Record<string, unknown>;
    const profile: Record<string, unknown> = {
      ...(old.profile as Record<string, unknown>),
      cohort: "K99",
    };
    delete profile.semesterCount;
    const records = {
      ...(old.records as Record<string, unknown>),
      MTH00045: { semester: 10, status: "todo", score: null },
    };
    const text = JSON.stringify({ ...old, profile, records });
    const store: KeyValueStore = {
      getItem: () => text,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const { data, status } = loadData(store);
    expect(status).toBe("ok");
    expect(data.profile.semesterCount).toBe(10);
    expect(data.profile.cohort).toBe("K26");
  });

  it("khôi phục: nhận trạng thái Học lại và lịch sử hợp lệ, từ chối lịch sử sai", () => {
    const data = createSampleData(NOW);
    expect(validateImport("a.json", JSON.stringify(data)).ok).toBe(true);
    const bad = {
      ...data,
      records: {
        ...data.records,
        BAA00003: { ...data.records.BAA00003, attempts: [{ semester: 1, score: 12 }] },
      },
    };
    expect(validateImport("a.json", JSON.stringify(bad)).ok).toBe(false);
  });

  it("tên file theo khóa và định dạng", () => {
    const date = new Date(2026, 10, 28);
    expect(exportFileName(date)).toBe("student_k26_2026-11-28.json");
    expect(exportFileName(date, "K25", "csv")).toBe("student_k25_2026-11-28.csv");
    expect(exportFileName(date, "K26", "xlsx")).toBe("student_k26_2026-11-28.xlsx");
  });

  it("CSV: có BOM, tiêu đề không có điểm chữ, có lịch sử học lại", () => {
    const csv = buildCsv(createSampleData(NOW));
    expect(csv.startsWith("﻿Khối kiến thức,Nhóm,Mã HP,Tên học phần,TC,Loại,Học kỳ")).toBe(true);
    expect(csv).not.toMatch(/Điểm chữ/);
    expect(csv).toMatch(/BAA00003,.*Học lại,.*,2,Lần 1: HK1 – 2/);
  });

  it("Excel: 4 trang tính, gói ZIP đúng chữ ký và CRC", () => {
    const sheets = workbookSheets(createCompletedSampleData(NOW), NOW);
    expect(sheets.map((sheet) => sheet.name)).toEqual([
      "Tổng quan",
      "Học phần",
      "Lịch học",
      "Lịch thi",
    ]);
    const bytes = buildXlsx(sheets);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(bytes.length - 22 + 10, true)).toBe(5 + sheets.length);
    // CRC của mục đầu khớp nội dung
    const nameLength = view.getUint16(26, true);
    const size = view.getUint32(18, true);
    const data = bytes.slice(30 + nameLength, 30 + nameLength + size);
    expect(crc32(data)).toBe(view.getUint32(14, true));
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect([columnName(0), columnName(25), columnName(26), columnName(27)]).toEqual([
      "A",
      "Z",
      "AA",
      "AB",
    ]);
  });
});

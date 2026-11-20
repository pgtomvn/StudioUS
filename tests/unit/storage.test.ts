import { describe, expect, it } from "vitest";
import {
  CORRUPT_BACKUP_KEY,
  DATA_KEY,
  createDefaultData,
  exportFileName,
  loadData,
  saveData,
  validateImport,
  type KeyValueStore,
} from "../../src/lib/storage/storage";

function memoryStore(
  initial: Record<string, string> = {},
): KeyValueStore & { items: Map<string, string> } {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

describe("lưu và đọc LocalStorage", () => {
  it("trả trạng thái empty khi chưa có gì", () => {
    expect(loadData(memoryStore()).status).toBe("empty");
  });

  it("đọc lại đúng dữ liệu đã lưu, phân biệt điểm 0 với chưa có điểm", () => {
    const store = memoryStore();
    const data = createDefaultData();
    data.records.MTH00021 = { semester: 1, status: "done", score: 0 };
    data.records.CSC00004 = { semester: 1, status: "doing", score: null };
    expect(saveData(store, data)).toBe(true);
    const loaded = loadData(store);
    expect(loaded.status).toBe("ok");
    expect(loaded.data.records.MTH00021.score).toBe(0);
    expect(loaded.data.records.CSC00004.score).toBeNull();
  });

  it("JSON hỏng: mở trạng thái trống và giữ bản hỏng để cứu dữ liệu", () => {
    const store = memoryStore({ [DATA_KEY]: "{khong phai json" });
    const loaded = loadData(store);
    expect(loaded.status).toBe("corrupt");
    expect(loaded.data).toEqual(createDefaultData());
    expect(store.items.get(CORRUPT_BACKUP_KEY)).toBe("{khong phai json");
  });

  it("không báo lưu thành công khi trình duyệt từ chối ghi", () => {
    const full: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    };
    expect(saveData(full, createDefaultData())).toBe(false);
    expect(saveData(null, createDefaultData())).toBe(false);
    expect(loadData(null).status).toBe("unavailable");
  });
});

describe("kiểm tra file nhập", () => {
  const good = () => JSON.stringify(createDefaultData());

  it("nhận file hợp lệ do ứng dụng xuất", () => {
    const result = validateImport("student_k26_2026-11-11.json", good());
    expect(result.ok).toBe(true);
  });

  it("dừng ở lỗi đầu tiên theo đúng thứ tự kiểm tra", () => {
    const check = (name: string, text: string) => {
      const result = validateImport(name, text);
      return result.ok ? "ok" : result.error;
    };
    expect(check("a.txt", good())).toContain("Chỉ nhận file .json");
    expect(check("a.json", "{")).toContain("hỏng");
    expect(check("a.json", JSON.stringify({ version: 1, profile: {} }))).toContain(
      "File thiếu dữ liệu",
    );
    expect(check("a.json", JSON.stringify({ ...createDefaultData(), version: 99 }))).toContain(
      "phiên bản khác",
    );
    const bad = createDefaultData();
    bad.records.MTH00021 = { semester: 1, status: "done", score: 11 };
    bad.records.KHONG_CO = { semester: 1, status: "done", score: 5 };
    expect(check("a.json", JSON.stringify(bad))).toContain("Có 2 dòng dữ liệu không hợp lệ");
  });

  it("đặt tên file sao lưu theo ngày", () => {
    expect(exportFileName(new Date(2026, 10, 8))).toBe("student_k26_2026-11-08.json");
  });
});

describe("chuyển dữ liệu từ bản dựng trước", () => {
  const v1 = {
    version: 1,
    profile: {
      name: "A",
      cohort: "K2025",
      currentSemester: 2,
      semesterStart: "2027-01-04",
      avatar: null,
    },
    records: {
      MTH00021: { semester: 1, status: "done", score: 9 },
      BAA00005: { semester: 2, status: "doing", score: null },
      "DEMO-GE05": { semester: 1, status: "done", score: 7 },
    },
    gradOption: null,
    conditions: { pe: "none", defense: "none", langType: "IELTS", langScore: null },
    classes: [
      {
        id: "c",
        courseId: "MTH00021",
        day: 1,
        start: "07:30",
        end: "09:00",
        room: "F1",
        weekFrom: 1,
        weekTo: 10,
        color: "#fff",
        note: "",
      },
    ],
    exams: [],
    meta: { lastSavedAt: null, lastExportAt: null },
  };

  it("đọc khóa cũ fitquest:data, nâng lên phiên bản 2 và chuyển sang khóa mới", () => {
    const store = memoryStore({ "fitquest:data": JSON.stringify(v1) });
    const loaded = loadData(store);
    expect(loaded.status).toBe("ok");
    expect(store.items.has(DATA_KEY)).toBe(true);
    expect(store.items.has("fitquest:data")).toBe(false);
    const data = loaded.data;
    expect(data.version).toBe(2);
    expect(data.profile.semesters).toEqual({ "2": { start: "2027-01-04", end: "" } });
    expect(Object.keys(data.records).sort()).toEqual(["BAA00005", "MTH00021"]);
    expect(data.selections["ge-social"]).toEqual(["BAA00005"]);
    expect(data.classes[0].semester).toBe(2);
    // Lịch học cũ chưa có loại buổi được coi là Lý thuyết.
    expect(data.classes[0].kind).toBe("theory");
    expect(data.conditions.langScore2).toBeNull();
  });

  it("file sao lưu phiên bản 1 chỉ chứa mã hợp lệ vẫn khôi phục được", () => {
    const clean = { ...v1, records: { MTH00021: v1.records.MTH00021 } };
    const result = validateImport("a.json", JSON.stringify(clean));
    expect(result.ok).toBe(true);
    const old = validateImport("a.json", JSON.stringify(v1));
    expect(old.ok ? "ok" : old.error).toContain("Có 1 dòng dữ liệu không hợp lệ");
  });
});

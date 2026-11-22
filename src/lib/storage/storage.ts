import { COURSE_BY_ID, GROUPS } from "../../data/curriculum";
import type {
  AppData,
  ClassEntry,
  ExamEntry,
  GradOptionId,
  Settings,
  SoundSettings,
  ThemeId,
} from "../../types";

export const DATA_KEY = "studious:data";
export const SETTINGS_KEY = "studious:settings";
export const CORRUPT_BACKUP_KEY = "studious:data:corrupt";
/** Khóa của bản dựng trước (tên tạm "FIT Quest"); được chuyển sang khóa mới khi mở ứng dụng. */
const LEGACY_KEYS: Record<string, string> = {
  [DATA_KEY]: "fitquest:data",
  [SETTINGS_KEY]: "fitquest:settings",
  [CORRUPT_BACKUP_KEY]: "fitquest:data:corrupt",
};
export const DATA_VERSION = 2;

/** Phần tối thiểu của Web Storage mà ứng dụng cần; giúp kiểm thử không cần trình duyệt. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const THEME_IDS: ThemeId[] = ["sunset", "meadow", "arcade", "midnight", "campus"];
const GRAD_OPTIONS: GradOptionId[] = ["thesis", "internship", "project"];
const REQUIRED_GROUPS = ["profile", "records", "conditions", "classes", "exams"] as const;
const GROUP_LABELS: Record<(typeof REQUIRED_GROUPS)[number], string> = {
  profile: "Hồ sơ",
  records: "Kết quả học tập",
  conditions: "Điều kiện phụ và chứng chỉ ngoại ngữ",
  classes: "Lịch học",
  exams: "Lịch thi",
};

export function createDefaultData(): AppData {
  return {
    version: DATA_VERSION,
    profile: {
      name: "",
      studentId: "",
      cohort: "K26",
      currentSemester: 1,
      semesters: {},
      avatar: null,
    },
    records: {},
    selections: {},
    gradOption: null,
    conditions: {
      pe: "none",
      defense: "none",
      langType: "IELTS",
      langScore: null,
      langScore2: null,
    },
    classes: [],
    exams: [],
    meta: { lastSavedAt: null, lastExportAt: null },
  };
}

export function createDefaultSound(): SoundSettings {
  return { muted: false, master: 0.8, effects: 0.8, music: 0.5, musicOn: false, ui: true };
}

export function createDefaultSettings(): Settings {
  return {
    theme: "sunset",
    dismissedBannerExamId: null,
    petCount: 0,
    sound: createDefaultSound(),
  };
}

/** Đọc cài đặt âm thanh đã lưu; giá trị thiếu hoặc sai kiểu thì lấy mặc định, âm lượng kẹp 0–1. */
export function normalizeSound(raw: unknown): SoundSettings {
  const base = createDefaultSound();
  if (!isObject(raw)) return base;
  const level = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.round(Math.min(1, Math.max(0, value)) * 100) / 100
      : fallback;
  const flag = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;
  return {
    muted: flag(raw.muted, base.muted),
    master: level(raw.master, base.master),
    effects: level(raw.effects, base.effects),
    music: level(raw.music, base.music),
    musicOn: flag(raw.musicOn, base.musicOn),
    ui: flag(raw.ui, base.ui),
  };
}

export function getBrowserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage;
    const probe = "studious:probe";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

/** Đọc khóa mới; nếu chưa có thì lấy từ khóa cũ rồi chuyển sang khóa mới. */
function readKey(store: KeyValueStore, key: string): string | null {
  const value = store.getItem(key);
  if (value !== null || !LEGACY_KEYS[key]) return value;
  const legacy = store.getItem(LEGACY_KEYS[key]);
  if (legacy !== null) {
    try {
      store.setItem(key, legacy);
      store.removeItem(LEGACY_KEYS[key]);
    } catch {
      /* vẫn dùng được giá trị cũ trong phiên này */
    }
  }
  return legacy;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Phiên bản 1 (bản dựng đầu, danh mục minh họa) → phiên bản 2 (CTĐT thật, có học kỳ). */
function migrateV1(raw: Record<string, unknown>): Record<string, unknown> {
  const profile = isObject(raw.profile) ? { ...raw.profile } : {};
  const current = Number(profile.currentSemester) || 1;
  const start = typeof profile.semesterStart === "string" ? profile.semesterStart : "";
  delete profile.semesterStart;
  profile.semesters = start ? { [current]: { start, end: "" } } : {};
  profile.cohort = "K26";
  const records = Object.fromEntries(
    Object.entries(isObject(raw.records) ? raw.records : {}).filter(([id]) => COURSE_BY_ID.has(id)),
  );
  // Học phần tự chọn có kết quả thì coi như đã được tick ở nhóm đầu tiên chứa nó.
  const selections: Record<string, string[]> = {};
  for (const id of Object.keys(records)) {
    const group = GROUPS.find((item) => item.mode === "elective" && item.courseIds.includes(id));
    if (group) selections[group.id] = [...(selections[group.id] ?? []), id];
  }
  const withSemester = (list: unknown) =>
    Array.isArray(list) ? list.map((item) => ({ semester: current, ...item })) : list;
  return {
    ...raw,
    version: DATA_VERSION,
    profile,
    records,
    selections,
    classes: withSemester(raw.classes),
    exams: withSemester(raw.exams),
  };
}

/** Bổ sung trường thiếu bằng mặc định; trả null nếu không phải cấu trúc dữ liệu của ứng dụng. */
function normalize(input: unknown): AppData | null {
  if (!isObject(input)) return null;
  const raw = input.version === 1 ? migrateV1(input) : input;
  if (raw.version !== DATA_VERSION) return null;
  if (!isObject(raw.profile) || !isObject(raw.records) || !isObject(raw.conditions)) return null;
  if (!Array.isArray(raw.classes) || !Array.isArray(raw.exams)) return null;
  const base = createDefaultData();
  const profile = { ...base.profile, ...(raw.profile as Partial<AppData["profile"]>) };
  if (!isObject(profile.semesters)) profile.semesters = {};
  if (typeof profile.studentId !== "string") profile.studentId = "";
  const selections: AppData["selections"] = {};
  if (isObject(raw.selections))
    for (const [group, ids] of Object.entries(raw.selections))
      if (Array.isArray(ids)) selections[group] = ids.filter((id) => typeof id === "string");
  return {
    version: DATA_VERSION,
    profile,
    records: raw.records as AppData["records"],
    selections,
    gradOption: GRAD_OPTIONS.includes(raw.gradOption as GradOptionId)
      ? (raw.gradOption as GradOptionId)
      : null,
    conditions: { ...base.conditions, ...(raw.conditions as Partial<AppData["conditions"]>) },
    classes: (raw.classes as ClassEntry[]).map((item) => ({
      ...item,
      semester: Number(item.semester) || profile.currentSemester,
      kind: item.kind === "lab" ? "lab" : "theory",
    })),
    exams: (raw.exams as ExamEntry[]).map((item) => ({
      ...item,
      semester: Number(item.semester) || profile.currentSemester,
    })),
    meta: { ...base.meta, ...(isObject(raw.meta) ? (raw.meta as Partial<AppData["meta"]>) : {}) },
  };
}

export type LoadStatus = "ok" | "empty" | "corrupt" | "unavailable";

export function loadData(store: KeyValueStore | null): { data: AppData; status: LoadStatus } {
  if (!store) return { data: createDefaultData(), status: "unavailable" };
  let text: string | null;
  try {
    text = readKey(store, DATA_KEY);
  } catch {
    return { data: createDefaultData(), status: "unavailable" };
  }
  if (text === null) return { data: createDefaultData(), status: "empty" };
  try {
    const data = normalize(JSON.parse(text));
    if (data) return { data, status: "ok" };
  } catch {
    /* rơi xuống nhánh hỏng dữ liệu */
  }
  // Giữ lại bản hỏng để có thể cứu dữ liệu, không ghi đè im lặng.
  try {
    store.setItem(CORRUPT_BACKUP_KEY, text);
  } catch {
    /* không còn chỗ lưu bản dự phòng */
  }
  return { data: createDefaultData(), status: "corrupt" };
}

export function saveData(store: KeyValueStore | null, data: AppData): boolean {
  if (!store) return false;
  try {
    store.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(store: KeyValueStore | null): Settings {
  const base = createDefaultSettings();
  try {
    const raw: unknown = JSON.parse((store && readKey(store, SETTINGS_KEY)) ?? "null");
    if (!isObject(raw)) return base;
    return {
      theme: THEME_IDS.includes(raw.theme as ThemeId) ? (raw.theme as ThemeId) : base.theme,
      dismissedBannerExamId:
        typeof raw.dismissedBannerExamId === "string" ? raw.dismissedBannerExamId : null,
      petCount:
        typeof raw.petCount === "number" && raw.petCount >= 0 ? Math.floor(raw.petCount) : 0,
      sound: normalizeSound(raw.sound),
    };
  } catch {
    return base;
  }
}

export function saveSettings(store: KeyValueStore | null, settings: Settings): boolean {
  if (!store) return false;
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function clearAll(store: KeyValueStore | null): void {
  try {
    store?.removeItem(DATA_KEY);
    store?.removeItem(CORRUPT_BACKUP_KEY);
    for (const legacy of Object.values(LEGACY_KEYS)) store?.removeItem(legacy);
  } catch {
    /* bỏ qua: không có gì để xóa */
  }
}

export interface DataSummary {
  scored: number;
  classes: number;
  exams: number;
}

export function summarize(data: AppData): DataSummary {
  return {
    scored: Object.values(data.records).filter((record) => record.score !== null).length,
    classes: data.classes.length,
    exams: data.exams.length,
  };
}

/** Tên file sao lưu theo chức năng F-06 của báo cáo phân tích yêu cầu. */
export const EXPORT_FILE_NAME = "student_k2026.json";

/** Mã số sinh viên hợp lệ: 8 chữ số (rỗng = chưa nhập). */
export const isStudentId = (text: string) => /^\d{8}$/.test(text);

export type ImportResult =
  | { ok: true; data: AppData; summary: DataSummary; savedAt: string | null }
  | { ok: false; error: string };

/** Kiểm tra tuần tự theo báo cáo thiết kế, dừng ở lỗi đầu tiên. */
export function validateImport(fileName: string, text: string): ImportResult {
  if (!fileName.toLowerCase().endsWith(".json"))
    return { ok: false, error: "Chỉ nhận file .json. Hãy chọn file đã xuất từ ứng dụng này." };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "File bị hỏng hoặc không đọc được." };
  }
  if (!isObject(raw)) return { ok: false, error: "File bị hỏng hoặc không đọc được." };
  const missing = REQUIRED_GROUPS.filter((group) => !(group in raw));
  if (missing.length > 0)
    return {
      ok: false,
      error: `File thiếu dữ liệu: ${missing.map((group) => GROUP_LABELS[group]).join(", ")}.`,
    };
  if (raw.version !== DATA_VERSION && raw.version !== 1)
    return { ok: false, error: "File được tạo bởi phiên bản khác, chưa hỗ trợ." };

  let invalid = 0;
  for (const [courseId, record] of Object.entries(isObject(raw.records) ? raw.records : {})) {
    const value = isObject(record) ? record : {};
    const score = value.score;
    const scoreOk = score === null || (typeof score === "number" && score >= 0 && score <= 10);
    const statusOk = ["todo", "doing", "done"].includes(value.status as string);
    if (!COURSE_BY_ID.has(courseId) || !scoreOk || !statusOk) invalid += 1;
  }
  if (invalid > 0)
    return {
      ok: false,
      error: `Có ${invalid} dòng dữ liệu không hợp lệ (VD: điểm ngoài khoảng, mã học phần không có trong CTĐT).`,
    };
  const data = normalize(raw);
  if (!data) return { ok: false, error: "File bị hỏng hoặc không đọc được." };
  return { ok: true, data, summary: summarize(data), savedAt: data.meta.lastSavedAt };
}

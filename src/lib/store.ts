import { useSyncExternalStore } from "react";
import { COURSE_BY_ID, GROUP_BY_ID, GROUPS, PE_GROUP } from "../data/curriculum";
import { peState } from "../domain/progress";
import { isPass } from "../domain/rules";
import { affection, affectionLines, react } from "./mascot";
import type {
  AppData,
  ClassEntry,
  Conditions,
  CourseRecord,
  ExamEntry,
  GradOptionId,
  Profile,
  SemesterInfo,
  Settings,
  SoundSettings,
  ThemeId,
} from "../types";
import {
  clearAll,
  createDefaultData,
  getBrowserStore,
  loadData,
  loadSettings,
  saveData,
  saveSettings,
  type LoadStatus,
} from "./storage/storage";

interface AppState {
  data: AppData;
  settings: Settings;
  loadStatus: LoadStatus;
  /** false khi lần ghi gần nhất thất bại (hết dung lượng, bị chặn…). */
  saveOk: boolean;
}

const kv = getBrowserStore();
const loaded = loadData(kv);
let state: AppState = {
  data: loaded.data,
  settings: loadSettings(kv),
  loadStatus: loaded.status,
  saveOk: kv !== null,
};

/** Phần dữ liệu cần lấy lại khi hoàn tác (xem `actions.restore`). */
export interface UndoScope {
  /** Kết quả học phần (học kỳ, trạng thái, điểm) cần trả lại. */
  records?: string[];
  /** Danh sách chọn của các nhóm cần trả lại nguyên vẹn. */
  selections?: string[];
  /** Tick lại một học phần tự chọn (giữ các học phần khác đã tick sau đó). */
  select?: { groupId: string; courseId: string };
  gradOption?: boolean;
  classId?: string;
  examId?: string;
}

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

function commit(data: AppData) {
  const next = { ...data, meta: { ...data.meta, lastSavedAt: new Date().toISOString() } };
  state = { ...state, data: next, saveOk: saveData(kv, next) };
  emit();
}

function commitSettings(settings: Settings) {
  saveSettings(kv, settings);
  state = { ...state, settings };
  emit();
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export function getState(): AppState {
  return state;
}

/** Sự kiện "+N TC" khi một học phần vừa chuyển sang Đạt, để HUD hiện hiệu ứng. */
const gainListeners = new Set<(credits: number) => void>();
export function onCreditGain(listener: (credits: number) => void): () => void {
  gainListeners.add(listener);
  return () => gainListeners.delete(listener);
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const actions = {
  setTheme(theme: ThemeId) {
    if (theme === state.settings.theme) return;
    commitSettings({ ...state.settings, theme });
    react({
      face: "happy",
      motion: "spin",
      effect: "sparkles",
      say: "Đồ mới nè! Hợp với mình không?",
    });
  },
  /** Xoa đầu linh vật: tăng điểm thân thiết, báo khi lên cấp. */
  petMascot() {
    const before = affection(state.settings.petCount).level;
    const petCount = state.settings.petCount + 1;
    commitSettings({ ...state.settings, petCount });
    const after = affection(petCount).level;
    const lines = affectionLines(after);
    react(
      after > before
        ? {
            face: "love",
            motion: "dance",
            effect: "confetti",
            say: `Thân thiết lên Lv.${after} rồi! Yêu bạn ghê!`,
            ms: 3400,
            sound: "levelup",
            touch: true,
          }
        : {
            face: "love",
            motion: "wiggle",
            effect: "hearts",
            say: lines[petCount % lines.length],
            touch: true,
          },
    );
  },
  setSound(patch: Partial<SoundSettings>) {
    commitSettings({ ...state.settings, sound: { ...state.settings.sound, ...patch } });
  },
  dismissBanner(examId: string | null) {
    commitSettings({ ...state.settings, dismissedBannerExamId: examId });
  },
  updateProfile(patch: Partial<Profile>) {
    commit({ ...state.data, profile: { ...state.data.profile, ...patch } });
  },
  setSemesterInfo(semester: number, patch: Partial<SemesterInfo>) {
    const key = String(semester);
    const current = state.data.profile.semesters[key] ?? { start: "", end: "" };
    actions.updateProfile({
      semesters: { ...state.data.profile.semesters, [key]: { ...current, ...patch } },
    });
  },
  /**
   * Ghi kết quả theo thứ tự Học kỳ → Trạng thái → Điểm:
   * chưa có học kỳ thì không có trạng thái, chưa "Đã hoàn thành" thì không có điểm.
   */
  setRecord(courseId: string, patch: Partial<CourseRecord>) {
    const previous = state.data.records[courseId] ?? {
      semester: null,
      status: "todo",
      score: null,
    };
    const next: CourseRecord = { ...previous, ...patch };
    if (next.semester === null) next.status = "todo";
    if (next.status !== "done") next.score = null;
    const wasPass = previous.status === "done" && isPass(previous.score);
    const nowPass = next.status === "done" && isPass(next.score);
    commit({ ...state.data, records: { ...state.data.records, [courseId]: next } });
    const course = COURSE_BY_ID.get(courseId);
    if (!wasPass && nowPass && PE_GROUP.courseIds.includes(courseId)) {
      // Thể dục là học phần điều kiện: không cộng TC, đủ hai môn thì điều kiện Thể chất đạt.
      const done = peState(state.data).state === "pass";
      react(
        done
          ? {
              face: "love",
              motion: "dance",
              effect: "sparkles",
              sound: "levelup",
              say: "Xong Giáo dục thể chất! Điều kiện Thể chất: Đạt. Khỏe re luôn!",
              ms: 3400,
            }
          : { face: "happy", motion: "hop", say: `Qua môn ${course?.name} rồi! Khỏe re!` },
      );
    } else if (!wasPass && nowPass) {
      const credits = course?.credits ?? 0;
      for (const listener of gainListeners) listener(credits);
      react({
        face: "happy",
        motion: "hop",
        effect: "coins",
        sound: (next.score ?? 0) >= 8.5 ? "levelup" : "coin",
        say:
          (next.score ?? 0) >= 8.5
            ? `Điểm A môn ${course?.name}! Đỉnh quá trời!`
            : `+${credits} TC! Qua môn ${course?.name} rồi!`,
      });
    } else if (
      next.status === "done" &&
      next.score !== null &&
      !nowPass &&
      next.score !== previous.score
    ) {
      react({
        face: "sad",
        motion: "shake",
        effect: "tears",
        say: "Không sao đâu, lần sau mình cùng cố gắng nha!",
        ms: 3200,
      });
    } else if (patch.status === "doing" && previous.status !== "doing") {
      react({ face: "happy", motion: "wiggle", say: `Cố lên với môn ${course?.name} nha!` });
    }
  },
  /** Tick / bỏ tick học phần tự chọn trong một nhóm; bỏ tick thì xóa kết quả đã nhập. */
  toggleSelection(groupId: string, courseId: string, selected: boolean) {
    const group = GROUP_BY_ID.get(groupId);
    if (!group || group.mode !== "elective" || !group.courseIds.includes(courseId)) return;
    const current = state.data.selections[groupId] ?? [];
    const records = { ...state.data.records };
    if (!selected) delete records[courseId];
    if (selected)
      react({
        face: "happy",
        motion: "hop",
        effect: "sparkles",
        say: `Thêm ${COURSE_BY_ID.get(courseId)?.name} vào kế hoạch!`,
        ms: 1800,
      });
    commit({
      ...state.data,
      records,
      selections: {
        ...state.data.selections,
        [groupId]: selected
          ? [...current.filter((id) => id !== courseId), courseId]
          : current.filter((id) => id !== courseId),
      },
    });
  },
  /** Đổi phương án tốt nghiệp: xóa kết quả và lựa chọn của phương án cũ. */
  setGradOption(option: GradOptionId | null) {
    const records = { ...state.data.records };
    const selections = { ...state.data.selections };
    for (const group of GROUPS)
      if (group.gradOption && group.gradOption === state.data.gradOption) {
        const ids = group.mode === "required" ? group.courseIds : (selections[group.id] ?? []);
        for (const id of ids) delete records[id];
        delete selections[group.id];
      }
    commit({ ...state.data, gradOption: option, records, selections });
    if (option)
      react({
        face: "surprised",
        motion: "hop",
        effect: "sparkles",
        say: "Chọn hướng tốt nghiệp rồi, ngầu ghê!",
      });
  },
  setConditions(patch: Partial<Conditions>) {
    commit({ ...state.data, conditions: { ...state.data.conditions, ...patch } });
  },
  saveClass(entry: Omit<ClassEntry, "id"> & { id?: string }) {
    const item: ClassEntry = { ...entry, id: entry.id ?? uid() };
    const exists = state.data.classes.some((current) => current.id === item.id);
    commit({
      ...state.data,
      classes: exists
        ? state.data.classes.map((current) => (current.id === item.id ? item : current))
        : [...state.data.classes, item],
    });
  },
  removeClass(id: string) {
    commit({ ...state.data, classes: state.data.classes.filter((item) => item.id !== id) });
  },
  saveExam(entry: Omit<ExamEntry, "id"> & { id?: string }) {
    const item: ExamEntry = { ...entry, id: entry.id ?? uid() };
    const exists = state.data.exams.some((current) => current.id === item.id);
    if (!exists)
      react({
        face: "surprised",
        motion: "shake",
        say: `Có lịch thi ${COURSE_BY_ID.get(item.courseId)?.name}! Nhớ ôn bài sớm nha!`,
      });
    commit({
      ...state.data,
      exams: exists
        ? state.data.exams.map((current) => (current.id === item.id ? item : current))
        : [...state.data.exams, item],
    });
  },
  removeExam(id: string) {
    commit({ ...state.data, exams: state.data.exams.filter((item) => item.id !== id) });
  },
  markExported() {
    commit({ ...state.data, meta: { ...state.data.meta, lastExportAt: new Date().toISOString() } });
  },
  /**
   * Hoàn tác có phạm vi: lấy lại từ `before` đúng phần vừa đổi, giữ nguyên các thay đổi khác
   * người dùng làm sau đó (trong lúc thông báo “Hoàn tác” còn hiện).
   */
  restore(before: AppData, scope: UndoScope) {
    const data = state.data;
    const records = { ...data.records };
    for (const id of scope.records ?? []) {
      if (before.records[id]) records[id] = before.records[id];
      else delete records[id];
    }
    const selections = { ...data.selections };
    for (const id of scope.selections ?? []) {
      if (before.selections[id]) selections[id] = before.selections[id];
      else delete selections[id];
    }
    if (scope.select) {
      const { groupId, courseId } = scope.select;
      const current = selections[groupId] ?? [];
      if (!current.includes(courseId)) selections[groupId] = [...current, courseId];
    }
    const putBack = <T extends { id: string }>(list: T[], old: T[], id?: string) => {
      const index = old.findIndex((item) => item.id === id);
      if (index < 0 || list.some((item) => item.id === id)) return list;
      return [...list.slice(0, index), old[index], ...list.slice(index)];
    };
    commit({
      ...data,
      records,
      selections,
      gradOption: scope.gradOption ? before.gradOption : data.gradOption,
      classes: putBack(data.classes, before.classes, scope.classId),
      exams: putBack(data.exams, before.exams, scope.examId),
    });
    react({ face: "happy", motion: "hop", say: "Hoàn tác xong, mọi thứ như cũ nhé!", sound: null });
  },
  /** Hoàn tác thao tác ghi đè toàn bộ (đặt lại, nạp dữ liệu mẫu, khôi phục từ file). */
  restoreAll(before: AppData) {
    commit(before);
    state = { ...state, loadStatus: "ok" };
    emit();
    react({ face: "happy", motion: "dance", say: "Dữ liệu cũ về rồi, hú hồn!", sound: null });
  },
  replaceData(data: AppData) {
    commit(data);
    react({ face: "happy", motion: "dance", effect: "confetti", say: "Dữ liệu về nhà rồi! Yay!" });
  },
  resetAll() {
    clearAll(kv);
    state = { ...state, data: createDefaultData(), loadStatus: "empty", saveOk: kv !== null };
    emit();
    react({
      face: "surprised",
      motion: "spin",
      sound: "reset",
      say: "Mọi thứ trắng tinh rồi… mình bắt đầu lại nhé!",
    });
  },
};

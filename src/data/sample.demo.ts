import { COURSE_BY_ID, GROUPS } from "./curriculum";
import { createDefaultData } from "../lib/storage/storage";
import { mondayOf, toDateInput } from "../lib/time";
import type { AppData, ClassEntry, CourseRecord, ExamEntry, SemesterInfo } from "../types";

/**
 * Bộ dữ liệu MẪU do nhóm tự đặt để thử đủ chức năng (không phải kết quả học tập thật của ai).
 * Sinh viên mẫu đang học HK2; ngày tháng tính tương đối theo hôm nay để luôn có lịch sắp tới.
 *
 * Các trường hợp được phủ (kiểm tra trong tests/unit/sample.test.ts):
 *  - Điểm HK1 đủ 8 bậc A+, A, B+, B, C (đạt) và D+, D, F (chưa đạt → danh sách “cần học lại”).
 *  - Trạng thái Chưa học / Đang học / Đã hoàn thành; một học phần chọn HK3 (vượt học kỳ hiện tại).
 *  - Học phần ở cả 4 khối; nhóm tự chọn đã chọn đủ, đang thiếu (Trái đất – Môi trường) và nhóm
 *    chọn qua hộp tìm kiếm (Phụ lục 1); phương án tốt nghiệp 3 có chọn học phần tốt nghiệp.
 *  - Giáo dục thể chất: Thể dục 1 đạt, Thể dục 2 đang học (điều kiện Thể chất: Chưa);
 *    GDQP-AN Đạt; chứng chỉ TOEIC đủ Nghe–Đọc nhưng thiếu Nói–Viết (Chưa đạt).
 *  - Lịch học Lý thuyết + Thực hành của cùng một môn, hai buổi trùng giờ (hiện song song), màu tự
 *    chọn nền tối (chữ trắng), lịch Thể dục, lịch học kỳ trước và lịch HK3 (vượt học kỳ hiện tại).
 *  - Lịch thi sắp tới trong số ngày nhắc (thanh nhắc + đếm ngược), lịch thi xa, đã qua và ở HK3.
 */
export function createSampleData(now = new Date()): AppData {
  const data = createDefaultData();
  const day = (base: Date, offset: number) => {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
    return toDateInput(date);
  };
  const hk2 = mondayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * 7));
  const hk1 = new Date(hk2.getFullYear(), hk2.getMonth(), hk2.getDate() - 7 * 22);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lesson = (
    id: string,
    patch: Pick<ClassEntry, "courseId" | "kind" | "semester" | "day" | "start" | "end" | "room"> &
      Partial<ClassEntry>,
  ): ClassEntry => ({ id, weekFrom: 1, weekTo: 15, color: "#8fd0ff", note: "", ...patch });
  const exam = (
    id: string,
    patch: Pick<ExamEntry, "courseId" | "semester" | "kind" | "date" | "time" | "room"> &
      Partial<ExamEntry>,
  ): ExamEntry => ({ id, remindDays: 7, note: "", ...patch });

  return {
    ...data,
    profile: {
      ...data.profile,
      name: "Sinh viên mẫu",
      currentSemester: 2,
      semesters: {
        "1": { start: day(hk1, 0), end: day(hk1, 7 * 18 - 1) },
        "2": { start: day(hk2, 0), end: day(hk2, 7 * 18 - 1) },
      },
    },
    records: {
      // HK1 – đủ các bậc điểm
      MTH00021: { semester: 1, status: "done", score: 9.1 }, // A+
      CSC00004: { semester: 1, status: "done", score: 8.5 }, // A
      CSC10012: { semester: 1, status: "done", score: 7.8 }, // B+
      BAA00005: { semester: 1, status: "done", score: 6.5 }, // B (tự chọn KHXH)
      BAA00101: { semester: 1, status: "done", score: 5.4 }, // C
      BAA00102: { semester: 1, status: "done", score: 4.6 }, // D+ – chưa đạt
      MTH00045: { semester: 1, status: "done", score: 3.5 }, // D – chưa đạt
      BAA00003: { semester: 1, status: "done", score: 2.0 }, // F – chưa đạt
      BAA00021: { semester: 1, status: "done", score: 8.0 }, // Thể dục 1
      // HK2 – đang học
      BAA00004: { semester: 2, status: "doing", score: null },
      MTH00022: { semester: 2, status: "doing", score: null },
      MTH00035: { semester: 2, status: "doing", score: null },
      CSC10004: { semester: 2, status: "doing", score: null },
      PHY00001: { semester: 2, status: "doing", score: null },
      PHY00081: { semester: 2, status: "doing", score: null },
      BAA00022: { semester: 2, status: "doing", score: null }, // Thể dục 2
      // HK2 – đã chọn học kỳ nhưng chưa học
      MTH00052: { semester: 2, status: "todo", score: null },
      // HK3 – vượt học kỳ hiện tại (cảnh báo)
      BIO00081: { semester: 3, status: "todo", score: null },
    },
    selections: {
      "ge-social": ["BAA00005"],
      "ge-math-elective": ["MTH00052"],
      "ge-science": ["PHY00001", "PHY00081", "BIO00081"],
      "major-elective": ["CSC10121", "CSC10105"],
      "major-free": ["CSC12002"],
      "grad-project-pick": ["CSC13116"],
    },
    gradOption: "project",
    conditions: {
      ...data.conditions,
      pe: "none",
      defense: "pass",
      langType: "TOEIC",
      langScore: 520,
      langScore2: 170,
    },
    classes: [
      // HK1 (đã qua)
      lesson("s1", {
        courseId: "CSC10012",
        kind: "theory",
        semester: 1,
        day: 2,
        start: "07:30",
        end: "11:00",
        room: "F102",
      }),
      lesson("s2", {
        courseId: "MTH00021",
        kind: "theory",
        semester: 1,
        day: 4,
        start: "13:30",
        end: "16:50",
        room: "E301",
        color: "#ffb0c8",
      }),
      // HK2
      lesson("s3", {
        courseId: "CSC10004",
        kind: "lab",
        semester: 2,
        day: 1,
        start: "08:20",
        end: "11:50",
        room: "F106",
        color: "#ffe66b",
        note: "Mang theo laptop",
      }),
      lesson("s4", {
        courseId: "CSC10004",
        kind: "theory",
        semester: 2,
        day: 2,
        start: "13:30",
        end: "16:00",
        room: "E201",
        color: "#ffe66b",
      }),
      lesson("s5", {
        courseId: "MTH00022",
        kind: "theory",
        semester: 2,
        day: 3,
        start: "13:30",
        end: "16:00",
        room: "E402",
        color: "#8fe6a8",
      }),
      lesson("s6", {
        courseId: "PHY00081",
        kind: "lab",
        semester: 2,
        day: 5,
        start: "07:30",
        end: "11:00",
        room: "PTN Lý",
        weekFrom: 3,
        weekTo: 12,
        color: "#c9b0ff",
        note: "Mặc áo blouse",
      }),
      // Trùng giờ với s3 (Thứ 2) và dùng màu tự chọn nền tối: thử hiển thị song song, chữ trắng.
      lesson("s7", {
        courseId: "BAA00004",
        kind: "theory",
        semester: 2,
        day: 1,
        start: "09:30",
        end: "11:30",
        room: "B11",
        color: "#2f5fa8",
        note: "Lớp học bù, trùng giờ với Thực hành CTDL",
      }),
      lesson("s8", {
        courseId: "MTH00035",
        kind: "theory",
        semester: 2,
        day: 4,
        start: "07:30",
        end: "11:00",
        room: "E304",
        color: "#ffc08a",
      }),
      lesson("s9", {
        courseId: "BAA00022",
        kind: "lab",
        semester: 2,
        day: 6,
        start: "07:00",
        end: "09:00",
        room: "Nhà thi đấu",
        color: "#ff9b9b",
        note: "Mặc đồ thể dục",
      }),
      // HK3 – vượt học kỳ hiện tại
      lesson("s10", {
        courseId: "BIO00081",
        kind: "lab",
        semester: 3,
        day: 4,
        start: "13:30",
        end: "16:30",
        room: "PTN Sinh",
      }),
    ],
    exams: [
      exam("e1", {
        courseId: "MTH00022",
        semester: 2,
        kind: "mid",
        date: day(today, 5),
        time: "13:30",
        room: "F302",
      }),
      exam("e2", {
        courseId: "BAA00004",
        semester: 2,
        kind: "mid",
        date: day(today, 12),
        time: "09:00",
        room: "B11",
        remindDays: 3,
      }),
      exam("e3", {
        courseId: "CSC10004",
        semester: 2,
        kind: "final",
        date: day(today, 45),
        time: "07:30",
        room: "B12",
        note: "Được mang một tờ A4",
      }),
      exam("e4", {
        courseId: "CSC10012",
        semester: 1,
        kind: "final",
        date: day(hk1, 7 * 17 + 1),
        time: "08:20",
        room: "F106",
        remindDays: 3,
      }),
      exam("e5", {
        courseId: "BIO00081",
        semester: 3,
        kind: "final",
        date: day(hk2, 7 * 40),
        time: "13:30",
        room: "PTN Sinh",
      }),
    ],
  };
}

/**
 * Bộ dữ liệu MẪU ĐÃ HOÀN THÀNH chương trình (HK8), do nhóm tự đặt. Dùng để thử trạng thái cuối:
 *  - Đạt mọi học phần bắt buộc; mỗi nhóm tự chọn chọn vừa đủ TC; phương án tốt nghiệp Khóa luận.
 *  - Học dư một học phần tự chọn tự do: TC tích lũy vượt 138 (VD 142 / 138), thanh tiến độ đầy,
 *    đổi màu hoàn thành, còn lại 0 TC.
 *  - Thể dục 1, 2 đạt, GDQP-AN đạt, IELTS 6.0 (đạt chuẩn) → đủ điều kiện tốt nghiệp.
 *  - Lịch học HK8 và lịch thi đã qua (không còn lịch thi sắp tới).
 * Điểm cố định theo mã học phần (6.0–9.6, không ngẫu nhiên) để kết quả kiểm thử ổn định.
 */
export function createCompletedSampleData(now = new Date()): AppData {
  const data = createDefaultData();
  const day = (base: Date, offset: number) => {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
    return toDateInput(date);
  };
  const hk8 = mondayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * 15));
  const startOf = (semester: number) =>
    new Date(hk8.getFullYear(), hk8.getMonth(), hk8.getDate() - 7 * 22 * (8 - semester));
  const semesters: Record<string, SemesterInfo> = {};
  for (let semester = 1; semester <= 8; semester++)
    semesters[String(semester)] = {
      start: day(startOf(semester), 0),
      end: day(startOf(semester), 7 * 18 - 1),
    };

  const scoreOf = (id: string) => {
    let hash = 0;
    for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
    return Math.round((6 + (hash % 37) / 10) * 10) / 10;
  };
  const records: Record<string, CourseRecord> = {};
  const selections: Record<string, string[]> = {};
  const pass = (id: string) => {
    const course = COURSE_BY_ID.get(id)!;
    const semester = Math.min(8, Math.max(1, course.plan[0] ?? 7));
    records[id] = { semester, status: "done", score: scoreOf(id) };
  };
  const gradOption = "thesis";
  for (const group of GROUPS) {
    if (group.gradOption && group.gradOption !== gradOption) continue;
    if (group.mode === "required") {
      group.courseIds.forEach(pass);
      continue;
    }
    const picked: string[] = [];
    let credits = 0;
    for (const id of group.courseIds) {
      if (credits >= group.credits) break;
      if (records[id]) continue; // đã tính ở nhóm khác
      picked.push(id);
      pass(id);
      credits += COURSE_BY_ID.get(id)!.credits;
    }
    selections[group.id] = picked;
  }
  // Học dư một học phần tự chọn tự do để TC tích lũy vượt 138.
  const extra = GROUPS.find((group) => group.id === "major-free")!.courseIds.find(
    (id) => !records[id],
  )!;
  selections["major-free"] = [...selections["major-free"], extra];
  pass(extra);
  // Giáo dục thể chất (không tính vào 138 TC và GPA)
  records.BAA00021 = { semester: 1, status: "done", score: 8.0 };
  records.BAA00022 = { semester: 2, status: "done", score: 8.5 };

  const lesson = (id: string, patch: Partial<ClassEntry> & Pick<ClassEntry, "courseId">) => ({
    id,
    kind: "theory" as const,
    semester: 8,
    day: 2,
    start: "07:30",
    end: "09:30",
    room: "F201",
    weekFrom: 1,
    weekTo: 15,
    color: "#8fd0ff",
    note: "",
    ...patch,
  });
  return {
    ...data,
    profile: { ...data.profile, name: "Cử nhân mẫu", currentSemester: 8, semesters },
    records,
    selections,
    gradOption,
    conditions: {
      ...data.conditions,
      pe: "none",
      defense: "pass",
      langType: "IELTS",
      langScore: 6.0,
      langScore2: null,
    },
    classes: [
      lesson("c1", { courseId: "BAA00003", day: 4, room: "E101", color: "#ffe66b" }),
      lesson("c2", {
        courseId: "CSC10251",
        day: 2,
        start: "13:30",
        end: "15:30",
        room: "Phòng Lab SE",
        color: "#c9b0ff",
        note: "Gặp giảng viên hướng dẫn khóa luận",
      }),
    ],
    exams: [
      {
        id: "x1",
        courseId: "BAA00003",
        semester: 8,
        kind: "final",
        date: day(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -10),
        time: "07:30",
        room: "E101",
        remindDays: 7,
        note: "",
      },
    ],
  };
}

/** Hai bộ dữ liệu mẫu chọn được ở trang Tổng quan (người dùng mới) và trang Dữ liệu. */
export const SAMPLES: { id: string; label: string; done: string; create: () => AppData }[] = [
  {
    id: "progress",
    label: "Mẫu đang học (HK2)",
    done: "Đã nạp dữ liệu mẫu đang học HK2 (minh họa).",
    create: () => createSampleData(),
  },
  {
    id: "completed",
    label: "Mẫu đã hoàn thành (HK8)",
    done: "Đã nạp dữ liệu mẫu đã hoàn thành chương trình (minh họa).",
    create: () => createCompletedSampleData(),
  },
];

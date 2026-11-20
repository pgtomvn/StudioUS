import { createDefaultData } from "../lib/storage/storage";
import { mondayOf, toDateInput } from "../lib/time";
import type { AppData } from "../types";

/**
 * Bộ dữ liệu MẪU do nhóm tự đặt để xem thử giao diện (không phải kết quả học tập thật của ai).
 * Sinh viên mẫu đang học HK2; ngày tháng tính tương đối theo hôm nay để luôn có lịch sắp tới.
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
      MTH00021: { semester: 1, status: "done", score: 9.1 },
      MTH00045: { semester: 1, status: "done", score: 3.5 },
      CSC00004: { semester: 1, status: "done", score: 8.5 },
      CSC10012: { semester: 1, status: "done", score: 7.8 },
      BAA00004: { semester: 2, status: "doing", score: null },
      MTH00022: { semester: 2, status: "doing", score: null },
      MTH00035: { semester: 2, status: "doing", score: null },
      CSC10004: { semester: 2, status: "doing", score: null },
      PHY00001: { semester: 2, status: "doing", score: null },
      PHY00081: { semester: 2, status: "doing", score: null },
      BIO00081: { semester: 3, status: "todo", score: null },
      BAA00021: { semester: 1, status: "done", score: 8 },
      BAA00022: { semester: 2, status: "doing", score: null },
    },
    selections: { "ge-science": ["PHY00001", "PHY00081", "BIO00081"] },
    conditions: {
      ...data.conditions,
      pe: "none",
      defense: "none",
      langType: "IELTS",
      langScore: 4.0,
    },
    classes: [
      {
        id: "s1",
        kind: "theory",
        courseId: "CSC10012",
        semester: 1,
        day: 2,
        start: "07:30",
        end: "11:00",
        room: "F102",
        weekFrom: 1,
        weekTo: 15,
        color: "#8fd0ff",
        note: "",
      },
      {
        id: "s2",
        kind: "theory",
        courseId: "MTH00021",
        semester: 1,
        day: 4,
        start: "13:30",
        end: "16:50",
        room: "E301",
        weekFrom: 1,
        weekTo: 15,
        color: "#ffb0c8",
        note: "",
      },
      {
        id: "s3",
        kind: "lab",
        courseId: "CSC10004",
        semester: 2,
        day: 1,
        start: "08:20",
        end: "11:50",
        room: "F106",
        weekFrom: 1,
        weekTo: 15,
        color: "#ffe66b",
        note: "Mang theo laptop",
      },
      {
        id: "s4",
        kind: "theory",
        courseId: "MTH00022",
        semester: 2,
        day: 3,
        start: "13:30",
        end: "16:00",
        room: "E402",
        weekFrom: 1,
        weekTo: 15,
        color: "#8fe6a8",
        note: "",
      },
      {
        id: "s5",
        kind: "lab",
        courseId: "PHY00081",
        semester: 2,
        day: 5,
        start: "07:30",
        end: "11:00",
        room: "PTN Lý",
        weekFrom: 3,
        weekTo: 12,
        color: "#c9b0ff",
        note: "Mặc áo blouse",
      },
    ],
    exams: [
      {
        id: "e1",
        courseId: "MTH00022",
        semester: 2,
        kind: "mid",
        date: day(today, 5),
        time: "13:30",
        room: "F302",
        remindDays: 7,
        note: "",
      },
      {
        id: "e2",
        courseId: "CSC10004",
        semester: 2,
        kind: "final",
        date: day(today, 45),
        time: "07:30",
        room: "B12",
        remindDays: 7,
        note: "Được mang một tờ A4",
      },
      {
        id: "e3",
        courseId: "CSC10012",
        semester: 1,
        kind: "final",
        date: day(hk1, 7 * 17 + 1),
        time: "08:20",
        room: "F106",
        remindDays: 3,
        note: "",
      },
    ],
  };
}

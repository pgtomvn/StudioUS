import { COURSE_BY_ID, MAJOR_NAME, blockLabel } from "../data/curriculum";
import {
  activeEntries,
  computeStats,
  peCourses,
  peState,
  recordOf,
  semesterCount,
  semesterGpa,
} from "../domain/progress";
import { convertScore, isPass, languageResult, rankOf } from "../domain/rules";
import type { AppData, CourseStatus } from "../types";
import { DAY_NAMES, formatDate, toDateInput } from "./time";
import type { Cell, Sheet } from "./xlsx";

const STATUS: Record<CourseStatus, string> = {
  todo: "Chưa học",
  doing: "Đang học",
  retake: "Học lại",
  done: "Đã hoàn thành",
};
const CONDITION = { none: "Chưa", pass: "Đạt", exempt: "Miễn" } as const;
const EXAM_KIND = { mid: "Giữa kỳ", final: "Cuối kỳ", other: "Khác" } as const;
const gpaCell = (value: number | null): Cell => (value === null ? "" : Number(value.toFixed(2)));

/** Bảng kết quả học tập: học phần đang tính (138 TC) và Thể dục 1, 2 (trừ khi Miễn). */
export function courseTable(data: AppData): Cell[][] {
  const rows: Cell[][] = [
    [
      "Khối kiến thức",
      "Nhóm",
      "Mã HP",
      "Tên học phần",
      "TC",
      "Loại",
      "Học kỳ",
      "Trạng thái",
      "Điểm hệ 10",
      "Hệ 4",
      "Kết quả",
      "Số lần học",
      "Các lần học trước",
    ],
  ];
  const entries = [
    ...activeEntries(data).map(({ course, group }) => ({
      course,
      block: blockLabel(group.block),
      group: group.title,
    })),
    ...(data.conditions.pe === "exempt"
      ? []
      : peCourses().map((course) => ({
          course,
          block: "Giáo dục thể chất",
          group: "Không tính vào 138 TC và GPA",
        }))),
  ];
  for (const { course, block, group } of entries) {
    const record = recordOf(data, course.id);
    const scored = record.status === "done" && record.score !== null;
    const attempts = record.attempts ?? [];
    rows.push([
      block,
      group,
      course.id,
      course.name,
      course.credits,
      course.kind,
      record.semester === null ? "" : `HK${record.semester}`,
      STATUS[record.status],
      scored ? record.score : "",
      scored ? convertScore(record.score!).point4 : "",
      scored ? (isPass(record.score) ? "Đạt" : "Chưa đạt") : "",
      attempts.length + 1,
      attempts
        .map(
          (item, index) =>
            `Lần ${index + 1}: HK${item.semester ?? "?"} – ${item.score ?? "chưa có điểm"}`,
        )
        .join("; "),
    ]);
  }
  return rows;
}

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt), chỉ gồm bảng kết quả học tập. */
export function buildCsv(data: AppData): string {
  const quote = (value: Cell) => {
    const text = value === null ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return (
    "﻿" +
    courseTable(data)
      .map((row) => row.map(quote).join(","))
      .join("\r\n") +
    "\r\n"
  );
}

/** Bốn trang tính: Tổng quan, Học phần, Lịch học, Lịch thi. */
export function workbookSheets(data: AppData, now = new Date()): Sheet[] {
  const stats = computeStats(data);
  const { profile, conditions } = data;
  const language = languageResult(conditions.langType, conditions.langScore, conditions.langScore2);
  const languageText =
    language.state === "empty"
      ? "Chưa nhập"
      : `${language.cert?.name} ${conditions.langScore}${conditions.langScore2 !== null && language.cert?.min2 !== undefined ? ` / ${conditions.langScore2}` : ""} – ${language.state === "pass" ? "Đạt chuẩn" : "Chưa đạt"}`;
  const overview: Cell[][] = [
    ["Mục", "Giá trị"],
    ["Họ tên", profile.name],
    ["Ngành", MAJOR_NAME],
    ["Khóa", profile.cohort],
    ["Học kỳ hiện tại", `HK${profile.currentSemester}`],
    ["Số học kỳ của kế hoạch", semesterCount(profile)],
    ["TC tích lũy", stats.earned],
    ["TC tính vào yêu cầu 138 TC", stats.counted],
    ["TC còn thiếu", stats.missing],
    ["GPA tổng (thang 10)", gpaCell(stats.gpa)],
    [
      `GPA HK${profile.currentSemester} (thang 10)`,
      gpaCell(semesterGpa(data, profile.currentSemester).gpa),
    ],
    ["Xếp loại", rankOf(stats.gpa)],
    ["Giáo dục thể chất", CONDITION[peState(data).state]],
    ["GDQP – AN", CONDITION[conditions.defense]],
    ["Chuẩn ngoại ngữ", languageText],
    ["Đủ điều kiện tốt nghiệp", stats.graduationReady ? "Có" : "Chưa"],
    ["Ngày xuất", formatDate(toDateInput(now))],
  ];
  const name = (id: string) => COURSE_BY_ID.get(id)?.name ?? id;
  const classes: Cell[][] = [
    [
      "Học kỳ",
      "Mã HP",
      "Tên học phần",
      "Hình thức",
      "Thứ",
      "Bắt đầu",
      "Kết thúc",
      "Phòng",
      "Từ tuần",
      "Đến tuần",
      "Ghi chú",
    ],
    ...[...data.classes]
      .sort((a, b) => a.semester - b.semester || a.day - b.day || a.start.localeCompare(b.start))
      .map((item) => [
        `HK${item.semester}`,
        item.courseId,
        name(item.courseId),
        item.kind === "lab" ? "Thực hành" : "Lý thuyết",
        DAY_NAMES[item.day - 1],
        item.start,
        item.end,
        item.room,
        item.weekFrom,
        item.weekTo,
        item.note,
      ]),
  ];
  const exams: Cell[][] = [
    [
      "Học kỳ",
      "Mã HP",
      "Tên học phần",
      "Loại",
      "Ngày thi",
      "Giờ",
      "Phòng",
      "Nhắc trước (ngày)",
      "Ghi chú",
    ],
    ...[...data.exams]
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map((item) => [
        `HK${item.semester}`,
        item.courseId,
        name(item.courseId),
        EXAM_KIND[item.kind],
        formatDate(item.date),
        item.time,
        item.room,
        item.remindDays,
        item.note,
      ]),
  ];
  return [
    { name: "Tổng quan", rows: overview, widths: [30, 40] },
    {
      name: "Học phần",
      rows: courseTable(data),
      widths: [26, 34, 11, 44, 5, 6, 8, 14, 11, 6, 10, 10, 40],
    },
    { name: "Lịch học", rows: classes, widths: [8, 11, 40, 11, 7, 8, 8, 14, 8, 8, 30] },
    { name: "Lịch thi", rows: exams, widths: [8, 11, 40, 9, 12, 7, 12, 16, 30] },
  ];
}

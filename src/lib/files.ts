import { COURSE_BY_ID } from "../data/curriculum";
import type { AppData } from "../types";
import { examDate, pad2, semesterMonday, weekRange } from "./time";

export function downloadText(fileName: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = (date: Date) =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(date.getHours())}${pad2(date.getMinutes())}00`;
const escapeText = (text: string) => text.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");

/** Tạo nội dung file .ics (giờ địa phương) để nhập vào Google Calendar. */
export function buildIcs(data: AppData): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudioUS//Lich hoc va lich thi//VI",
    "CALSCALE:GREGORIAN",
  ];
  for (const item of data.classes) {
    const course = COURSE_BY_ID.get(item.courseId);
    const monday = semesterMonday(data.profile, item.semester);
    // Học kỳ chưa có ngày bắt đầu thì chưa biết ngày cụ thể để xuất.
    if (!monday) continue;
    const first = weekRange(monday, item.weekFrom).from;
    first.setDate(first.getDate() + item.day - 1);
    const at = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date(first.getTime());
      date.setHours(hours, minutes, 0, 0);
      return stamp(date);
    };
    lines.push(
      "BEGIN:VEVENT",
      `UID:class-${item.id}@studious.local`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${at(item.start)}`,
      `DTEND:${at(item.end)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${Math.max(1, item.weekTo - item.weekFrom + 1)}`,
      `SUMMARY:${escapeText(`${course?.name ?? item.courseId} (${item.kind === "lab" ? "Thực hành" : "Lý thuyết"})`)}`,
      `LOCATION:${escapeText(item.room)}`,
      `DESCRIPTION:${escapeText(item.note)}`,
      "END:VEVENT",
    );
  }
  for (const exam of data.exams) {
    const course = COURSE_BY_ID.get(exam.courseId);
    const start = examDate(exam);
    const end = new Date(start.getTime() + 90 * 60_000);
    const kind =
      exam.kind === "mid" ? "Thi giữa kỳ" : exam.kind === "final" ? "Thi cuối kỳ" : "Thi";
    lines.push(
      "BEGIN:VEVENT",
      `UID:exam-${exam.id}@studious.local`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeText(`${kind}: ${course?.name ?? exam.courseId}`)}`,
      `LOCATION:${escapeText(exam.room)}`,
      `DESCRIPTION:${escapeText(exam.note)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Thu nhỏ ảnh đại diện về 96×96 để không chiếm nhiều dung lượng LocalStorage. */
export function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = 96;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Không xử lý được ảnh."));
      const side = Math.min(image.width, image.height);
      context.imageSmoothingEnabled = true;
      context.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File không phải ảnh hợp lệ."));
    };
    image.src = url;
  });
}

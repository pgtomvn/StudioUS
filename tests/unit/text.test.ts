import { describe, expect, it } from "vitest";
import { keepWords } from "../../src/lib/text";
import { COURSE_BY_ID } from "../../src/data/curriculum";

const NB = String.fromCharCode(0xa0);

describe("giữ từ ghép trên một dòng", () => {
  it("nối các từ ghép mà tester báo bị tách đôi", () => {
    expect(keepWords("Khối giáo dục đại cương")).toBe(`Khối giáo${NB}dục đại${NB}cương`);
    expect(keepWords("Chưa đạt – cần học lại.")).toBe(`Chưa${NB}đạt – cần học${NB}lại.`);
    expect(keepWords("Cấu trúc dữ liệu và giải thuật")).toBe(
      `Cấu${NB}trúc dữ${NB}liệu và giải${NB}thuật`,
    );
    expect(keepWords("Tự chọn ngành / chuyên ngành")).toBe(`Tự${NB}chọn ngành / chuyên${NB}ngành`);
    expect(keepWords("Chủ nghĩa xã hội khoa học")).toBe(`Chủ${NB}nghĩa xã${NB}hội khoa${NB}học`);
  });
  it("không đổi khi chỉ trùng một phần chữ, khớp không phân biệt hoa thường", () => {
    expect(keepWords("Vật lý đại cương 1")).toBe(`Vật${NB}lý đại${NB}cương 1`);
    expect(keepWords("Khoa học máy tính")).toBe(`Khoa${NB}học máy${NB}tính`);
    // “an ninh” không được khớp bên trong một từ khác
    expect(keepWords("Toán an ninhx")).toBe("Toán an ninhx");
    expect(keepWords("Triết học Mác – Lênin")).toBe(`Triết${NB}học Mác${NB}–${NB}Lênin`);
    expect(keepWords("Thứ 2, 23/11 · 08:20")).toBe(`Thứ${NB}2, 23/11 · 08:20`);
  });
  it("chỉ thay dấu cách, giữ nguyên chữ của mọi tên học phần", () => {
    for (const course of COURSE_BY_ID.values())
      expect(keepWords(course.name).split(NB).join(" ")).toBe(course.name.normalize("NFC"));
  });
});

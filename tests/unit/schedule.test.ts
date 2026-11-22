import { describe, expect, it } from "vitest";
import { CLASS_COLORS, inkOn, isHexColor } from "../../src/lib/color";
import { layoutOverlaps } from "../../src/lib/time";

describe("chia cột cho buổi học trùng giờ", () => {
  it("không trùng thì mỗi buổi một cột", () => {
    const result = layoutOverlaps([
      { id: "a", start: "07:30", end: "09:30" },
      { id: "b", start: "09:30", end: "11:30" },
    ]);
    expect(result.get("a")).toEqual({ lane: 0, lanes: 1 });
    expect(result.get("b")).toEqual({ lane: 0, lanes: 1 });
  });

  it("hai buổi chồng nhau nằm song song, buổi sau cụm trở lại một cột", () => {
    const result = layoutOverlaps([
      { id: "ctdl", start: "08:20", end: "13:59" },
      { id: "vtp", start: "13:30", end: "16:00" },
      { id: "late", start: "17:00", end: "18:00" },
    ]);
    expect(result.get("ctdl")).toEqual({ lane: 0, lanes: 2 });
    expect(result.get("vtp")).toEqual({ lane: 1, lanes: 2 });
    expect(result.get("late")).toEqual({ lane: 0, lanes: 1 });
  });

  it("ba buổi: cột trống được dùng lại", () => {
    const result = layoutOverlaps([
      { id: "a", start: "07:00", end: "12:00" },
      { id: "b", start: "07:30", end: "09:00" },
      { id: "c", start: "09:00", end: "10:00" },
    ]);
    expect(result.get("a")).toEqual({ lane: 0, lanes: 2 });
    expect(result.get("b")).toEqual({ lane: 1, lanes: 2 });
    expect(result.get("c")).toEqual({ lane: 1, lanes: 2 });
  });
});

describe("màu lịch học", () => {
  it("bảy màu có sẵn hợp lệ và đều dùng chữ tối", () => {
    expect(CLASS_COLORS.map((color) => color.name)).toEqual([
      "đỏ",
      "cam",
      "vàng",
      "lục",
      "lam",
      "hồng",
      "tím",
    ]);
    for (const color of CLASS_COLORS) {
      expect(isHexColor(color.value)).toBe(true);
      expect(inkOn(color.value)).toBe("#241a33");
    }
  });

  it("màu tự chọn tối thì chữ trắng; mã sai giữ chữ tối", () => {
    expect(inkOn("#1a237e")).toBe("#ffffff");
    expect(inkOn("#000000")).toBe("#ffffff");
    expect(inkOn("#ffffff")).toBe("#241a33");
    expect(inkOn("đỏ")).toBe("#241a33");
    expect(isHexColor("#12345")).toBe(false);
  });
});

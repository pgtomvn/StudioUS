import type { ScreenId } from "../types";

const FOCUS_KEY = "studious:focus";

/** Điều hướng bằng hash để chạy được cả khi mở file trực tiếp (file://). */
export function navigate(screen: ScreenId, focus?: string) {
  if (focus) sessionStorage.setItem(FOCUS_KEY, focus);
  window.location.hash = `/${screen}`;
}

/** Từ khóa cần tô sáng khi vừa chuyển từ màn khác sang (đọc một lần rồi xóa). */
export function takeFocus(): string | null {
  const value = sessionStorage.getItem(FOCUS_KEY);
  if (value) sessionStorage.removeItem(FOCUS_KEY);
  return value;
}

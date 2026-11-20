import { useSyncExternalStore } from "react";
import type { SoundName } from "./sound";

/** Thứ tự khung trong sprite `mascot-*.png` (xem FACES trong scripts/generate-pixel-assets.mjs). */
export const FACE_INDEX = {
  idle: 0,
  blink: 1,
  happy: 2,
  sad: 3,
  sleep: 4,
  surprised: 5,
  love: 6,
} as const;
export type Face = keyof typeof FACE_INDEX;
export type Motion = "hop" | "spin" | "shake" | "dance" | "wiggle" | "sleep";
export type Effect = "hearts" | "sparkles" | "coins" | "confetti" | "notes" | "tears" | "zzz";

export interface Reaction {
  face?: Face;
  motion?: Motion;
  effect?: Effect;
  /** Câu linh vật nói trong bong bóng. */
  say?: string;
  /** Thời gian giữ phản ứng (ms); mặc định 2600. */
  ms?: number;
  /** Âm thanh đi kèm; bỏ trống thì suy ra từ hiệu ứng/động tác, null = im lặng. */
  sound?: SoundName | null;
  /** Phản ứng do người dùng chạm/bấm linh vật: âm đi theo công tắc “tiếng bấm”. */
  touch?: boolean;
}

export interface ActiveReaction extends Reaction {
  id: number;
}

/* ------------------------------------------------------------------ kho phản ứng dùng chung */
let current: ActiveReaction | null = null;
let asleep = false;
let nextId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const reactListeners = new Set<(reaction: Reaction) => void>();

/** Nghe mọi phản ứng mới (bộ âm thanh dùng để phát âm đi kèm). */
export function onReact(listener: (reaction: Reaction) => void): () => void {
  reactListeners.add(listener);
  return () => reactListeners.delete(listener);
}

/** Cho mọi linh vật đang hiển thị cùng phản ứng (đổi nét mặt, động tác, hiệu ứng, câu nói). */
export function react(reaction: Reaction): void {
  current = { ...reaction, id: ++nextId };
  // Có chuyện xảy ra thì linh vật tỉnh ngủ (trừ khi chính phản ứng là đi ngủ).
  if (reaction.face !== "sleep") asleep = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, reaction.ms ?? 2600);
  emit();
  for (const listener of reactListeners) listener(reaction);
}

export function calmDown(): void {
  clearTimeout(timer);
  current = null;
  emit();
}

export function useReaction(): ActiveReaction | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

/* ------------------------------------------------------------------ ngủ gật khi để lâu không dùng */

export function setAsleep(value: boolean): void {
  if (asleep === value) return;
  asleep = value;
  emit();
}

export function isAsleep(): boolean {
  return asleep;
}

export function useAsleep(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => asleep,
  );
}

/* ------------------------------------------------------------------ hàm thuần (có kiểm thử) */
const LEVELS = [0, 5, 15, 30, 50, 80, 120];

/** Mức thân thiết theo số lần xoa đầu: Lv.1 … Lv.7, kèm số lần cần cho mức kế tiếp. */
export function affection(pets: number): { level: number; from: number; next: number | null } {
  let level = 1;
  for (let index = 0; index < LEVELS.length; index++) if (pets >= LEVELS[index]) level = index + 1;
  return { level, from: LEVELS[level - 1], next: level < LEVELS.length ? LEVELS[level] : null };
}

/** Lời chào theo giờ trong ngày. */
export function greeting(hour: number): string {
  if (hour >= 5 && hour < 11) return "Chào buổi sáng! Hôm nay mình học gì nào?";
  if (hour >= 11 && hour < 14) return "Trưa rồi, nhớ ăn cơm rồi nghỉ xíu nha!";
  if (hour >= 14 && hour < 18) return "Buổi chiều năng suất nhé, mình ở đây cổ vũ!";
  if (hour >= 18 && hour < 23) return "Buổi tối vui vẻ! Ôn bài một chút không?";
  return "Khuya rồi đó… đi ngủ sớm để mai học tốt nha.";
}

/** Mật mã bí mật: gõ (ngoài ô nhập) một trong các từ dưới đây. */
export const SECRETS = {
  studious: {
    face: "love",
    motion: "dance",
    effect: "confetti",
    say: "Bạn tìm ra bí mật rồi! Cùng nhảy nào ♪",
    ms: 4200,
  },
  hcmus: {
    face: "happy",
    motion: "spin",
    effect: "sparkles",
    say: "fit@hcmus! Tự hào sinh viên Khoa học Tự nhiên!",
    ms: 3600,
  },
  zzz: {
    face: "sleep",
    motion: "sleep",
    effect: "zzz",
    say: "Zzz… năm phút nữa thôi…",
    ms: 3600,
  },
} satisfies Record<string, Reaction>;

/** Từ bí mật vừa được gõ xong ở cuối chuỗi phím, nếu có. */
export function secretTyped(buffer: string): keyof typeof SECRETS | null {
  const text = buffer.toLowerCase();
  return (
    (Object.keys(SECRETS) as (keyof typeof SECRETS)[]).find((key) => text.endsWith(key)) ?? null
  );
}

/** Câu thoại theo mức thân thiết (mức cao mở thêm câu). */
export function affectionLines(level: number): string[] {
  const lines = ["Hihi, nhột quá!", "Xoa nữa đi, dễ chịu ghê~", "Mình thích bạn lắm đó!"];
  if (level >= 3) lines.push("Học chung với bạn là vui nhất!");
  if (level >= 5) lines.push("Bạn là đồng đội thân nhất của mình rồi!");
  if (level >= 7) lines.push("Thân thiết tối đa! Tốt nghiệp mình cũng đi theo bạn nha!");
  return lines;
}

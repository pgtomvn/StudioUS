import { useSyncExternalStore } from "react";
import type { SoundSettings, ThemeId } from "../types";
import { onReact, type Reaction } from "./mascot";
import { MusicPlayer, TRACKS } from "./music";
import { createDefaultSound } from "./storage/storage";

/**
 * Bộ phát âm thanh của StudioUS (Web Audio API, chạy ngoại tuyến).
 * File âm nằm ở src/assets/sfx (sinh bằng scripts/generate-sfx.mjs) và được nhúng vào bản build.
 * Trình duyệt chỉ cho phát âm sau thao tác đầu tiên của người dùng, nên bộ phát khởi động ở đó.
 */
const files = import.meta.glob<string>("../assets/sfx/*.wav", { eager: true, import: "default" });
const URLS: Record<string, string> = {};
for (const [file, url] of Object.entries(files)) URLS[file.replace(/^.*\/(.+)\.wav$/, "$1")] = url;

type Channel = "ui" | "fx";

/** Danh mục âm: kênh (ui = bấm nút, fx = linh vật/thành tích) và độ lớn tương đối. */
export const SOUNDS = {
  click: { channel: "ui", gain: 0.45 },
  nav: { channel: "ui", gain: 0.5 },
  tickOn: { channel: "ui", gain: 0.55 },
  tickOff: { channel: "ui", gain: 0.45 },
  confirm: { channel: "ui", gain: 0.45 },
  delete: { channel: "ui", gain: 0.55 },
  open: { channel: "ui", gain: 0.4 },
  close: { channel: "ui", gain: 0.35 },
  pop: { channel: "ui", gain: 0.45 },
  coin: { channel: "fx", gain: 0.7 },
  levelup: { channel: "fx", gain: 0.6 },
  fanfare: { channel: "fx", gain: 0.65 },
  graduate: { channel: "fx", gain: 0.75 },
  fail: { channel: "fx", gain: 0.6 },
  error: { channel: "fx", gain: 0.55 },
  sparkle: { channel: "fx", gain: 0.5 },
  hop: { channel: "fx", gain: 0.45 },
  whoosh: { channel: "fx", gain: 0.5 },
  alert: { channel: "fx", gain: 0.55 },
  reset: { channel: "fx", gain: 0.6 },
  talk: { channel: "fx", gain: 0.45 },
  love: { channel: "fx", gain: 0.55 },
  dance: { channel: "fx", gain: 0.5 },
  snore: { channel: "fx", gain: 0.45 },
} as const satisfies Record<string, { channel: Channel; gain: number }>;
export type SoundName = keyof typeof SOUNDS;

/* ------------------------------------------------------------------ hàm thuần (có kiểm thử) */

/** Âm lượng thực của một kênh: 0 khi tắt; thanh trượt theo đường cong bình phương cho dễ chỉnh. */
export function channelGain(settings: SoundSettings, channel: Channel | "music"): number {
  if (settings.muted) return 0;
  if (channel === "ui" && !settings.ui) return 0;
  if (channel === "music" && !settings.musicOn) return 0;
  const level = channel === "music" ? settings.music : settings.effects;
  return settings.master * settings.master * level * level;
}

/** Có phát được không: theo âm lượng kênh; âm do chạm linh vật còn theo công tắc “tiếng bấm”. */
export function canPlay(settings: SoundSettings, channel: Channel, touch = false): boolean {
  if (touch && !settings.ui) return false;
  return channelGain(settings, channel) > 0;
}

/** Âm đi kèm phản ứng của linh vật: ưu tiên âm ghi rõ, sau đó theo hiệu ứng, động tác, lời nói. */
export function reactionSound(reaction: Reaction): SoundName | null {
  if (reaction.sound !== undefined) return reaction.sound;
  const byEffect: Record<string, SoundName> = {
    coins: "coin",
    confetti: "fanfare",
    tears: "fail",
    sparkles: "sparkle",
    hearts: "love",
    notes: "dance",
    zzz: "snore",
  };
  const byMotion: Record<string, SoundName> = {
    spin: "whoosh",
    shake: "alert",
    dance: "dance",
    hop: "hop",
    wiggle: "talk",
    sleep: "snore",
  };
  if (reaction.effect) return byEffect[reaction.effect];
  if (reaction.motion) return byMotion[reaction.motion];
  return reaction.say ? "talk" : null;
}

/* ------------------------------------------------------------------ bộ phát */
let settings: SoundSettings = createDefaultSound();
let theme: ThemeId = "sunset";
let ctx: AudioContext | null = null;
let buses: Record<Channel | "music", GainNode> | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const lastByName = new Map<SoundName, number>();
let lastFx = 0;
let lastAny = 0;
let voices = 0;
const music = new MusicPlayer();
const musicListeners = new Set<() => void>();

function audioBytes(url: string): Promise<ArrayBuffer> {
  if (url.startsWith("data:")) {
    // Bản build một file: âm nằm sẵn trong data URL, giải mã trực tiếp (không cần fetch).
    const binary = atob(url.slice(url.indexOf(",") + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return Promise.resolve(bytes.buffer);
  }
  return fetch(url).then((response) => response.arrayBuffer());
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  const master = ctx.createGain();
  master.connect(ctx.destination);
  buses = { ui: ctx.createGain(), fx: ctx.createGain(), music: ctx.createGain() };
  for (const bus of Object.values(buses)) bus.connect(master);
  applyGains(true);
  for (const name of Object.keys(SOUNDS) as SoundName[]) {
    const url = URLS[name];
    if (!url) continue;
    audioBytes(url)
      .then((bytes) => ctx!.decodeAudioData(bytes))
      .then((buffer) => buffers.set(name, buffer))
      .catch(() => undefined);
  }
  ctx.onstatechange = syncMusic;
  return ctx;
}

function applyGains(immediate = false) {
  if (!ctx || !buses) return;
  for (const channel of ["ui", "fx", "music"] as const) {
    const value = channelGain(settings, channel);
    if (immediate) buses[channel].gain.value = value;
    else buses[channel].gain.setTargetAtTime(value, ctx.currentTime, 0.03);
  }
}

function syncMusic() {
  const want =
    !!ctx &&
    !!buses &&
    ctx.state === "running" &&
    channelGain(settings, "music") > 0 &&
    document.visibilityState === "visible";
  const before = music.playing;
  if (want) music.play(ctx!, buses!.music, theme);
  else music.stop();
  const root = document.documentElement;
  root.dataset.music = music.playing ? "on" : "off";
  root.style.setProperty("--beat", `${60 / TRACKS[theme].bpm}s`);
  if (before !== music.playing) for (const listener of musicListeners) listener();
}

/** Áp cài đặt mới (gọi mỗi khi người dùng chỉnh hoặc đổi chủ đề màu). */
export function configureSound(next: SoundSettings, nextTheme: ThemeId): void {
  settings = next;
  theme = nextTheme;
  applyGains();
  if (typeof document !== "undefined") syncMusic();
}

/**
 * Phát một hiệu ứng. `soft`: bỏ qua nếu vừa có âm khác (tránh chồng tiếng).
 * `touch`: âm do người dùng chạm linh vật, im khi tắt “tiếng bấm” dù thuộc kênh hiệu ứng.
 * Tiếng bấm nút nhường cho âm phản ứng vừa phát ngay trước đó.
 */
export function sfx(
  name: SoundName,
  options: { soft?: boolean; rate?: number; touch?: boolean } = {},
): void {
  const meta = SOUNDS[name];
  if (!ctx || !buses || ctx.state !== "running") return;
  if (!canPlay(settings, meta.channel, options.touch)) return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  const now = performance.now();
  if (now - (lastByName.get(name) ?? -1e9) < 70) return;
  if (meta.channel === "ui" && now - lastFx < 150) return;
  if (options.soft && now - lastAny < 200) return;
  if (voices >= 8) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = options.rate ?? (name === "talk" ? 0.9 + Math.random() * 0.25 : 1);
  const gain = ctx.createGain();
  gain.gain.value = meta.gain;
  source.connect(gain).connect(buses[meta.channel]);
  voices++;
  source.onended = () => {
    voices--;
    gain.disconnect();
  };
  source.start();
  lastByName.set(name, now);
  lastAny = now;
  if (meta.channel === "fx") lastFx = now;
}

/** Nhạc nền có đang phát không (để linh vật nhún theo nhạc). */
export function useMusicPlaying(): boolean {
  return useSyncExternalStore(
    (listener) => {
      musicListeners.add(listener);
      return () => musicListeners.delete(listener);
    },
    () => music.playing !== null,
  );
}

/* ------------------------------------------------------------------ gắn vào giao diện */
function uiSoundFor(target: EventTarget | null): SoundName | null {
  if (!(target instanceof Element)) return null;
  const tagged = target.closest("[data-sfx]");
  if (tagged) {
    const value = tagged.getAttribute("data-sfx") ?? "";
    return value in SOUNDS ? (value as SoundName) : null;
  }
  if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio"))
    return target.checked ? "tickOn" : "tickOff";
  const control = target.closest("button, a[href], summary, [role='button'], select");
  if (!control) return null;
  if (control.matches(".nav-btn, .tabbar button")) return "nav";
  if (control.matches(".modal .btn-danger")) return "delete";
  if (control.matches(".btn-primary, .btn-good")) return "confirm";
  return "click";
}

/** Khởi động âm thanh ở thao tác đầu tiên, gắn tiếng bấm nút và phản ứng linh vật. */
export function installSound(): () => void {
  const unlock = () => {
    const context = ensureContext();
    if (context && context.state !== "running") context.resume().then(syncMusic, () => undefined);
  };
  const onClick = (event: MouseEvent) => {
    const name = uiSoundFor(event.target);
    if (name) sfx(name);
  };
  const offReact = onReact((reaction) => {
    const name = reactionSound(reaction);
    if (name) sfx(name, { touch: reaction.touch });
  });
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("touchend", unlock, true);
  window.addEventListener("keydown", unlock, true);
  window.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", syncMusic);
  return () => {
    offReact();
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("touchend", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    window.removeEventListener("click", onClick);
    document.removeEventListener("visibilitychange", syncMusic);
  };
}

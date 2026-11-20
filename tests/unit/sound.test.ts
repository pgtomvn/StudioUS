import { describe, expect, it } from "vitest";
import { TRACKS, buildLoop, midiToHz } from "../../src/lib/music";
import { SOUNDS, canPlay, channelGain, reactionSound } from "../../src/lib/sound";
import {
  SETTINGS_KEY,
  createDefaultSound,
  loadSettings,
  normalizeSound,
  type KeyValueStore,
} from "../../src/lib/storage/storage";

// File âm nhúng dạng data URL (giống bản build một file) để đọc được byte mà không cần API Node.
const SFX = import.meta.glob<string>("../../src/assets/sfx/*.wav", {
  eager: true,
  query: "?inline",
  import: "default",
});

function bytesOf(url: string): Uint8Array {
  const binary = atob(url.slice(url.indexOf(",") + 1));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function storeWith(value: unknown): KeyValueStore {
  const items = new Map([[SETTINGS_KEY, JSON.stringify(value)]]);
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, item) => void items.set(key, item),
    removeItem: (key) => void items.delete(key),
  };
}

describe("cài đặt âm thanh", () => {
  it("cài đặt cũ chưa có mục âm thanh thì dùng mặc định (nhạc nền tắt)", () => {
    const settings = loadSettings(storeWith({ theme: "arcade", petCount: 3 }));
    expect(settings.sound).toEqual(createDefaultSound());
    expect(settings.sound.musicOn).toBe(false);
    expect(settings.theme).toBe("arcade");
  });

  it("kẹp âm lượng về 0–1 và bỏ giá trị sai kiểu", () => {
    expect(
      normalizeSound({ muted: true, master: 7, effects: -1, music: "to", musicOn: 1, ui: false }),
    ).toEqual({ ...createDefaultSound(), muted: true, master: 1, effects: 0, ui: false });
    expect(normalizeSound(null)).toEqual(createDefaultSound());
    expect(normalizeSound({ master: 0.333 }).master).toBe(0.33);
  });

  it("âm lượng kênh: tắt tiếng, tắt tiếng bấm, tắt nhạc, đường cong bình phương", () => {
    const base = { ...createDefaultSound(), master: 0.5, effects: 1, music: 0.5, musicOn: true };
    expect(channelGain(base, "fx")).toBeCloseTo(0.25);
    expect(channelGain(base, "music")).toBeCloseTo(0.0625);
    expect(channelGain({ ...base, muted: true }, "fx")).toBe(0);
    expect(channelGain({ ...base, ui: false }, "ui")).toBe(0);
    expect(channelGain({ ...base, ui: false }, "fx")).toBeGreaterThan(0);
    expect(channelGain({ ...base, musicOn: false }, "music")).toBe(0);
  });
  it("âm do chạm linh vật im khi tắt tiếng bấm hoặc tắt tiếng chung", () => {
    const base = createDefaultSound();
    expect(canPlay(base, "fx", true)).toBe(true);
    expect(canPlay({ ...base, ui: false }, "fx", true)).toBe(false);
    expect(canPlay({ ...base, ui: false }, "fx")).toBe(true);
    expect(canPlay({ ...base, muted: true }, "fx", true)).toBe(false);
    expect(canPlay({ ...base, effects: 0 }, "fx", true)).toBe(false);
  });
});

describe("âm đi kèm phản ứng linh vật", () => {
  it("ưu tiên âm ghi rõ, kể cả im lặng", () => {
    expect(reactionSound({ effect: "coins", sound: "levelup" })).toBe("levelup");
    expect(reactionSound({ effect: "coins", sound: null })).toBeNull();
  });
  it("suy ra từ hiệu ứng, rồi động tác, rồi lời nói", () => {
    expect(reactionSound({ effect: "coins", motion: "hop" })).toBe("coin");
    expect(reactionSound({ effect: "tears" })).toBe("fail");
    expect(reactionSound({ effect: "confetti" })).toBe("fanfare");
    expect(reactionSound({ motion: "spin" })).toBe("whoosh");
    expect(reactionSound({ motion: "shake", face: "surprised" })).toBe("alert");
    expect(reactionSound({ say: "Chào!" })).toBe("talk");
    expect(reactionSound({ face: "happy" })).toBeNull();
  });
});

describe("file âm thanh", () => {
  const files = Object.entries(SFX).map(([file, url]) => ({
    name: file.replace(/^.*\/(.+)\.wav$/, "$1"),
    bytes: bytesOf(url),
  }));

  it("mỗi âm trong danh mục có đúng một file và ngược lại", () => {
    expect(files.map((file) => file.name).sort()).toEqual(Object.keys(SOUNDS).sort());
  });

  it("là WAV PCM 8-bit, mono, 22 050 Hz, tổng dưới 250 KB", () => {
    let total = 0;
    for (const { bytes } of files) {
      const view = new DataView(bytes.buffer);
      total += bytes.length;
      expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
      expect(view.getUint16(22, true)).toBe(1);
      expect(view.getUint32(24, true)).toBe(22_050);
      expect(view.getUint16(34, true)).toBe(8);
      expect(bytes.length).toBeGreaterThan(44 + 22_050 * 0.03);
    }
    expect(total).toBeLessThan(250 * 1024);
  });
});

describe("nhạc nền", () => {
  it("mỗi chủ đề có bài riêng, vòng lặp hợp lệ", () => {
    const titles = new Set<string>();
    for (const track of Object.values(TRACKS)) {
      titles.add(track.title);
      const loop = buildLoop(track);
      expect(loop.steps).toBe(track.chords.length * 8);
      expect(track.arp).toHaveLength(8);
      expect(track.bpm).toBeGreaterThanOrEqual(60);
      expect(track.bpm).toBeLessThanOrEqual(140);
      for (const event of loop.events) {
        expect(event.step).toBeGreaterThanOrEqual(0);
        expect(event.step).toBeLessThan(loop.steps);
        if (event.voice !== "hat") {
          expect(event.midi).toBeGreaterThanOrEqual(24);
          expect(event.midi).toBeLessThanOrEqual(90);
        }
      }
      // Mỗi ô nhịp: 2 nốt bè trầm và 2 nốt giai điệu.
      expect(loop.events.filter((event) => event.voice === "bass")).toHaveLength(
        track.chords.length * 2,
      );
      expect(loop.events.filter((event) => event.voice === "melody")).toHaveLength(
        track.chords.length * 2,
      );
    }
    expect(titles.size).toBe(Object.keys(TRACKS).length);
  });

  it("đổi số MIDI sang tần số", () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880);
  });
});

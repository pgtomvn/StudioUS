import type { ThemeId } from "../types";

/**
 * Nhạc nền 8-bit tự soạn, phát bằng Web Audio (không có file nhạc).
 * Mỗi chủ đề màu có một bài: hợp âm + mẫu rải hợp âm + bè trầm + giai điệu nối hợp âm.
 */
export interface Track {
  title: string;
  bpm: number;
  /** Hợp âm từng ô nhịp: nốt gốc (số MIDI) và tính chất trưởng/thứ. */
  chords: [number, "M" | "m"][];
  /** Mẫu rải 8 móc đơn: 0 gốc, 1 quãng 3, 2 quãng 5, 3 quãng 8; -1 là nghỉ. */
  arp: number[];
  lead: "square" | "pulse" | "triangle" | "sine";
  /** Tiếng hi-hat ở phách lẻ. */
  hat?: boolean;
}

export const TRACKS: Record<ThemeId, Track> = {
  sunset: {
    title: "Chiều tím",
    bpm: 80,
    chords: [
      [60, "M"],
      [57, "m"],
      [53, "M"],
      [55, "M"],
      [60, "M"],
      [52, "m"],
      [53, "M"],
      [55, "M"],
    ],
    arp: [0, 1, 2, 1, 3, 2, 1, 2],
    lead: "triangle",
  },
  meadow: {
    title: "Đồng cỏ xanh",
    bpm: 100,
    chords: [
      [55, "M"],
      [60, "M"],
      [62, "M"],
      [55, "M"],
      [52, "m"],
      [60, "M"],
      [62, "M"],
      [62, "M"],
    ],
    arp: [0, 2, 1, 2, 3, 2, 1, 2],
    lead: "square",
  },
  arcade: {
    title: "Neon arcade",
    bpm: 126,
    chords: [
      [57, "m"],
      [53, "M"],
      [60, "M"],
      [55, "M"],
      [57, "m"],
      [53, "M"],
      [55, "M"],
      [52, "m"],
    ],
    arp: [0, 0, 2, 0, 3, 0, 2, 1],
    lead: "pulse",
    hat: true,
  },
  midnight: {
    title: "Ru khúc đêm sao",
    bpm: 64,
    chords: [
      [53, "M"],
      [50, "m"],
      [58, "M"],
      [60, "M"],
      [53, "M"],
      [57, "m"],
      [58, "M"],
      [60, "M"],
    ],
    arp: [0, -1, 2, -1, 3, -1, 2, 1],
    lead: "sine",
  },
  campus: {
    title: "Giờ ra chơi",
    bpm: 112,
    chords: [
      [62, "M"],
      [59, "m"],
      [55, "M"],
      [57, "M"],
      [62, "M"],
      [54, "m"],
      [55, "M"],
      [57, "M"],
    ],
    arp: [0, 1, 2, 3, 2, 1, 2, 1],
    lead: "square",
    hat: true,
  },
};

export type Voice = "arp" | "bass" | "melody" | "hat";
export interface NoteEvent {
  /** Vị trí trong vòng lặp, tính theo móc đơn. */
  step: number;
  midi: number;
  /** Độ dài (số móc đơn). */
  length: number;
  voice: Voice;
}

const STEPS_PER_BAR = 8;
const chordTones = (quality: "M" | "m") => (quality === "M" ? [0, 4, 7, 12] : [0, 3, 7, 12]);

/** Dựng toàn bộ nốt của một vòng lặp (hàm thuần, có kiểm thử). */
export function buildLoop(track: Track): { steps: number; events: NoteEvent[] } {
  const events: NoteEvent[] = [];
  let previous: number | null = null;
  track.chords.forEach(([root, quality], bar) => {
    const tones = chordTones(quality);
    const start = bar * STEPS_PER_BAR;
    track.arp.forEach((index, step) => {
      if (index >= 0)
        events.push({ step: start + step, midi: root + tones[index], length: 1, voice: "arp" });
    });
    events.push({ step: start, midi: root - 24, length: 3, voice: "bass" });
    events.push({ step: start + 4, midi: root - 24 + 7, length: 3, voice: "bass" });
    // Giai điệu: hai nốt trắng mỗi ô nhịp, chọn âm hợp âm gần nốt trước nhất (đi liền bậc).
    for (const offset of [0, 4]) {
      const choices = tones.map((tone) => root + 12 + tone);
      const target: number = previous === null ? choices[2] : previous + (offset === 0 ? 1 : -1);
      const midi = choices.reduce((best, note) =>
        Math.abs(note - target) < Math.abs(best - target) ? note : best,
      );
      events.push({ step: start + offset, midi, length: 4, voice: "melody" });
      previous = midi;
    }
    if (track.hat)
      for (let step = 1; step < STEPS_PER_BAR; step += 2)
        events.push({ step: start + step, midi: 0, length: 1, voice: "hat" });
  });
  return { steps: track.chords.length * STEPS_PER_BAR, events };
}

export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/* ------------------------------------------------------------------ trình phát */
const LEVEL: Record<Voice, number> = { arp: 0.11, bass: 0.2, melody: 0.07, hat: 0.035 };

export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private theme: ThemeId | null = null;
  private loop: ReturnType<typeof buildLoop> | null = null;
  private bySteps = new Map<number, NoteEvent[]>();
  private step = 0;
  private nextTime = 0;
  private stepSeconds = 0.25;
  private pulse: PeriodicWave | null = null;
  private noise: AudioBuffer | null = null;

  get playing(): ThemeId | null {
    return this.theme;
  }

  play(ctx: AudioContext, destination: AudioNode, theme: ThemeId) {
    if (this.theme === theme && this.ctx === ctx) return;
    this.stop();
    const track = TRACKS[theme];
    this.ctx = ctx;
    this.theme = theme;
    this.loop = buildLoop(track);
    this.bySteps = new Map();
    for (const event of this.loop.events) {
      const list = this.bySteps.get(event.step) ?? [];
      list.push(event);
      this.bySteps.set(event.step, list);
    }
    this.stepSeconds = 60 / track.bpm / 2;
    this.out = ctx.createGain();
    this.out.gain.setValueAtTime(0, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
    this.out.connect(destination);
    this.pulse ??= makePulse(ctx, 0.25);
    this.noise ??= makeNoise(ctx);
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(track), 25);
    this.schedule(track);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = undefined;
    if (this.ctx && this.out) {
      const out = this.out;
      const now = this.ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 0.3);
      setTimeout(() => out.disconnect(), 400);
    }
    this.out = null;
    this.theme = null;
  }

  private schedule(track: Track) {
    const ctx = this.ctx;
    if (!ctx || !this.loop || !this.out) return;
    while (this.nextTime < ctx.currentTime + 0.15) {
      for (const event of this.bySteps.get(this.step) ?? [])
        this.voice(track, event, this.nextTime);
      this.step = (this.step + 1) % this.loop.steps;
      this.nextTime += this.stepSeconds;
    }
  }

  private voice(track: Track, event: NoteEvent, time: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    const duration = event.length * this.stepSeconds * 0.92;
    const level = LEVEL[event.voice];
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    gain.connect(this.out!);
    if (event.voice === "hat") {
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 6500;
      source.connect(filter).connect(gain);
      source.start(time);
      source.stop(time + 0.05);
      return;
    }
    const osc = ctx.createOscillator();
    if (event.voice === "arp") {
      if (track.lead === "pulse" && this.pulse) osc.setPeriodicWave(this.pulse);
      else osc.type = track.lead === "pulse" ? "square" : track.lead;
    } else osc.type = "triangle";
    osc.frequency.setValueAtTime(midiToHz(event.midi), time);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
}

/** Sóng xung tỉ lệ `duty` (âm sắc đặc trưng máy chơi game 8-bit). */
function makePulse(ctx: AudioContext, duty: number): PeriodicWave {
  const size = 32;
  const real = new Float32Array(size);
  const imag = new Float32Array(size);
  for (let n = 1; n < size; n++) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(2 * Math.PI * n * duty);
    imag[n] = (2 / (n * Math.PI)) * (1 - Math.cos(2 * Math.PI * n * duty));
  }
  return ctx.createPeriodicWave(real, imag);
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.1), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

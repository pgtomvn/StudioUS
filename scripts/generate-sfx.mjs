// Sinh bộ hiệu ứng âm thanh của giao diện vào src/assets/sfx (WAV 8-bit, 22 050 Hz, mono).
//
// Hai nguồn:
// 1. Âm chọn từ bộ CC0 "The Essential Retro Video Game Sound Effects Collection [512 sounds]"
//    của Juhani Junkala (SubspaceAudio), tải tại
//    https://opengameart.org/content/512-sound-effects-8-bit-style (giấy phép CC0).
//    Giải nén bộ âm rồi chạy:  npm run sfx -- "<thư mục đã giải nén>"
//    Không có đường dẫn thì giữ nguyên các file đã có, chỉ sinh lại âm tự tạo.
// 2. Âm tự tạo bằng công thức (giọng linh vật, xoa đầu, nhảy múa, ngáy).
//
// Mỗi âm được cắt khoảng lặng, giới hạn độ dài, cân âm lượng, hạ tần số mẫu và lưu 8-bit để
// bản build một file (dist/index.html) vẫn gọn.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "assets", "sfx");
const RATE = 22_050;

/** Âm lấy từ bộ CC0: tên trong ứng dụng → tên file gốc, độ dài tối đa (giây), hệ số âm lượng. */
const PICKS = {
  click: { file: "sfx_menu_move4.wav", max: 0.08, gain: 0.8 },
  nav: { file: "sfx_sounds_button11.wav", max: 0.12, gain: 0.8 },
  tickOn: { file: "sfx_coin_double7.wav", max: 0.12, gain: 0.9 },
  tickOff: { file: "sfx_sounds_Blip9.wav", max: 0.09, gain: 0.8 },
  confirm: { file: "sfx_menu_select1.wav", max: 0.36, gain: 0.85 },
  delete: { file: "sfx_sounds_damage3.wav", max: 0.2, gain: 1 },
  open: { file: "sfx_sounds_pause2_in.wav", max: 0.26, gain: 0.8 },
  close: { file: "sfx_sounds_pause2_out.wav", max: 0.26, gain: 0.8 },
  pop: { file: "sfx_sound_neutral8.wav", max: 0.12, gain: 0.8 },
  coin: { file: "sfx_coin_double4.wav", max: 0.3, gain: 1 },
  levelup: { file: "sfx_sounds_powerup2.wav", max: 0.75, gain: 0.95 },
  fanfare: { file: "sfx_sounds_fanfare1.wav", max: 0.6, gain: 1 },
  fail: { file: "sfx_sounds_error13.wav", max: 0.4, gain: 1 },
  error: { file: "sfx_sounds_error10.wav", max: 0.3, gain: 1 },
  sparkle: { file: "sfx_sound_bling.wav", max: 0.8, gain: 0.85 },
  hop: { file: "sfx_movement_jump4.wav", max: 0.2, gain: 0.85 },
  whoosh: { file: "sfx_movement_portal5.wav", max: 0.7, gain: 0.8 },
  alert: { file: "sfx_sounds_interaction14.wav", max: 0.16, gain: 0.9 },
  reset: { file: "sfx_sound_neutral11.wav", max: 0.3, gain: 1 },
};

/* ------------------------------------------------------------------ đọc / ghi WAV */
function readWav(file) {
  const buf = readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE")
    throw new Error(`${file}: không phải WAV`);
  let offset = 12;
  let format = null;
  let data = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ")
      format = {
        code: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        rate: buf.readUInt32LE(body + 4),
        bits: buf.readUInt16LE(body + 14),
      };
    if (id === "data") data = buf.subarray(body, body + size);
    offset = body + size + (size % 2);
  }
  if (!format || !data || format.code !== 1 || format.bits !== 16)
    throw new Error(`${file}: chỉ hỗ trợ PCM 16-bit`);
  const frames = Math.floor(data.length / (2 * format.channels));
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < format.channels; c++)
      sum += data.readInt16LE((i * format.channels + c) * 2) / 32768;
    samples[i] = sum / format.channels;
  }
  return { samples, rate: format.rate };
}

/** WAV PCM 8-bit không dấu, mono. */
function wav8(samples) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + samples.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(samples.length, 40);
  const body = Buffer.alloc(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    body[i] = Math.max(0, Math.min(255, Math.round(value * 127 + 128)));
  }
  return Buffer.concat([header, body]);
}

/* ------------------------------------------------------------------ xử lý */
/** Hạ tần số mẫu: lọc thông thấp 3 điểm rồi nội suy tuyến tính. */
function resample(samples, from) {
  if (from === RATE) return samples;
  const smooth = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++)
    smooth[i] =
      0.25 * (samples[i - 1] ?? samples[i]) +
      0.5 * samples[i] +
      0.25 * (samples[i + 1] ?? samples[i]);
  const ratio = from / RATE;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const t = position - index;
    out[i] = smooth[index] * (1 - t) + (smooth[index + 1] ?? smooth[index]) * t;
  }
  return out;
}

function peakOf(samples) {
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  return peak;
}

function rmsOf(samples) {
  let sum = 0;
  for (const value of samples) sum += value * value;
  return Math.sqrt(sum / Math.max(1, samples.length));
}

/** Cắt lặng hai đầu, giới hạn độ dài, làm mờ cuối, cân âm lượng về mức chung. */
function tidy(samples, { max, gain }) {
  const peak = peakOf(samples) || 1;
  const threshold = peak * 0.02;
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start++;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) end--;
  start = Math.max(0, start - Math.round(RATE * 0.002));
  const length = Math.min(end - start + 1, Math.round(max * RATE));
  const out = samples.slice(start, start + length);
  const fade = Math.min(out.length, Math.round(RATE * 0.02));
  for (let i = 0; i < fade; i++) out[out.length - 1 - i] *= i / fade;
  // Cân theo RMS (mục tiêu −15 dBFS) nhưng không để đỉnh vượt −1 dBFS.
  const scale = Math.min(0.178 / (rmsOf(out) || 1), 0.89 / (peakOf(out) || 1)) * gain;
  for (let i = 0; i < out.length; i++) out[i] *= scale;
  return out;
}

/* ------------------------------------------------------------------ âm tự tạo */
const square = (phase, duty = 0.5) => (phase % 1 < duty ? 1 : -1);
const triangle = (phase) => 1 - 4 * Math.abs((phase % 1) - 0.5);

/** Ghép nhiều nốt (tần số, độ dài, dạng sóng) thành một đoạn, có bao âm từng nốt. */
function tones(notes, { wave = square, level = 0.5, gap = 0 } = {}) {
  const parts = [];
  for (const note of notes) {
    const length = Math.round(note.ms * RATE * 0.001);
    const part = new Float32Array(length + Math.round(gap * RATE * 0.001));
    let phase = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const freq = note.hz * (1 + (note.glide ?? 0) * t);
      phase += freq / RATE;
      const attack = Math.min(1, i / (RATE * 0.003));
      const decay = Math.pow(1 - t, note.curve ?? 1.4);
      part[i] = wave(phase, note.duty) * attack * decay * level;
    }
    parts.push(part);
  }
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function echo(samples, delayMs, feedback) {
  const delay = Math.round(delayMs * RATE * 0.001);
  const out = new Float32Array(samples.length + delay * 2);
  out.set(samples);
  for (let i = delay; i < out.length; i++) out[i] += out[i - delay] * feedback;
  return out;
}

/**
 * Trộn nhiều nốt vào một đoạn. Mỗi nốt: thời điểm `at` và độ dài `dur` (giây), tần số `hz`
 * (`to`: tần số cuối nếu trượt), dạng sóng, độ lớn, độ tắt dần `decay`, độ rung `vib`.
 */
function render(seconds, notes) {
  const out = new Float32Array(Math.round(seconds * RATE));
  let seed = 12345;
  for (const note of notes) {
    const start = Math.round(note.at * RATE);
    const length = Math.round(note.dur * RATE);
    let phase = 0;
    let previous = 0;
    for (let i = 0; i < length && start + i < out.length; i++) {
      const t = i / RATE;
      const progress = i / length;
      const vibrato = note.vib && t > 0.12 ? 1 + note.vib * Math.sin(2 * Math.PI * 6 * t) : 1;
      const hz = (note.to ? note.hz + (note.to - note.hz) * progress : note.hz) * vibrato;
      phase += hz / RATE;
      let value;
      if (note.wave === "noise" || note.wave === "hiss") {
        seed = (seed * 16807) % 2147483647;
        const noise = seed / 1073741823.5 - 1;
        // "hiss": lọc thông cao đơn giản cho tiếng chũm chọe.
        value = note.wave === "hiss" ? noise - previous : noise;
        previous = noise;
      } else if (note.wave === "tri") value = triangle(phase);
      else value = square(phase, note.wave === "pulse" ? 0.25 : 0.5);
      const attack = Math.min(1, t / 0.004);
      const release = Math.min(1, (length - i) / (RATE * 0.025));
      const body = Math.pow(1 - progress, note.decay ?? 0.3);
      out[start + i] += value * note.level * attack * release * body;
    }
  }
  return out;
}

/** Kèn mừng tốt nghiệp (tự soạn): rải hợp âm đi lên, giai điệu C trưởng có bè, trống dồn, chũm chọe, sao lấp lánh. */
function graduate() {
  const S = 0.09; // một móc kép
  const notes = [];
  const lead = (at, dur, hz, extra = {}) =>
    notes.push({ at, dur, hz, wave: "pulse", level: 0.3, ...extra });
  const pad = (at, dur, list, extra = {}) =>
    list.forEach((hz) => notes.push({ at, dur, hz, wave: "square", level: 0.09, ...extra }));
  const bass = (at, dur, hz, extra = {}) =>
    notes.push({ at, dur, hz, wave: "tri", level: 0.34, decay: 0.6, ...extra });
  // Rải hợp âm đi lên: Sol – Đô – Mi – Sol
  [392, 523, 659, 784].forEach((hz, index) => lead(index * S, S, hz));
  bass(0, 4 * S, 131);
  // Giai điệu chính
  lead(4 * S, 3 * S, 1047);
  lead(7 * S, S, 880);
  lead(8 * S, 2 * S, 1047);
  lead(10 * S, 2 * S, 1175);
  lead(12 * S, 10 * S, 1319, { vib: 0.012, decay: 1.1 });
  // Bè hòa âm và bè trầm
  pad(4 * S, 3 * S, [659, 784]);
  pad(7 * S, S, [523, 698]);
  pad(8 * S, 2 * S, [698, 880]);
  pad(10 * S, 2 * S, [784, 988]);
  pad(12 * S, 10 * S, [784, 1047], { decay: 1.1 });
  bass(4 * S, 3 * S, 131);
  bass(7 * S, 3 * S, 87);
  bass(10 * S, 2 * S, 98);
  bass(12 * S, 10 * S, 131, { decay: 1 });
  bass(12 * S, 10 * S, 65, { level: 0.2, decay: 1 });
  // Trống dồn mạnh dần, trống cái và chũm chọe ở hai phách nhấn
  for (let index = 0; index < 8; index++)
    notes.push({ at: index * (S / 2), dur: 0.03, wave: "noise", level: 0.04 + index * 0.025 });
  for (const at of [4 * S, 12 * S]) {
    notes.push({ at, dur: 0.14, hz: 160, to: 45, wave: "tri", level: 0.5, decay: 1.5 });
    notes.push({ at, dur: at === 4 * S ? 0.45 : 0.9, wave: "hiss", level: 0.16, decay: 2.5 });
  }
  // Sao lấp lánh ở cuối: Đô – Mi – Sol – Đô cao
  [2093, 2637, 3136].forEach((hz, index) =>
    notes.push({ at: 18 * S + index * 0.06, dur: 0.06, hz, wave: "tri", level: 0.16 }),
  );
  notes.push({ at: 18 * S + 0.18, dur: 0.3, hz: 4186, wave: "tri", level: 0.14, decay: 2 });
  return render(22 * S + 0.12, notes);
}

const SYNTH = {
  /** Kèn mừng khi đủ điều kiện tốt nghiệp. */
  graduate,
  /** Giọng linh vật: bốn tiếng "pip" cao thấp khác nhau. */
  talk: () =>
    tones(
      [
        { hz: 740, ms: 55, glide: 0.08 },
        { hz: 988, ms: 50, glide: 0.06 },
        { hz: 831, ms: 55, glide: -0.05 },
        { hz: 1109, ms: 70, glide: 0.1 },
      ],
      { level: 0.32, gap: 18, wave: (p) => square(p, 0.25) },
    ),
  /** Xoa đầu: tiếng "kyu~" vuốt lên rồi rung nhẹ. */
  love: () => {
    const length = Math.round(0.42 * RATE);
    const out = new Float32Array(length);
    let phase = 0;
    for (let i = 0; i < length; i++) {
      const t = i / RATE;
      const sweep = t < 0.16 ? 660 + (t / 0.16) * 720 : 1380 + Math.sin(t * 2 * Math.PI * 7) * 40;
      phase += sweep / RATE;
      const envelope = Math.min(1, t / 0.01) * Math.pow(1 - i / length, 1.2);
      out[i] = triangle(phase) * envelope * 0.6;
    }
    return out;
  },
  /** Nhảy múa: chuỗi arpeggio đi lên, có tiếng vang. */
  dance: () =>
    echo(
      tones(
        [523, 659, 784, 1047, 784, 1047].map((hz) => ({ hz, ms: 75, curve: 0.8 })),
        { level: 0.3, wave: (p) => square(p, 0.25) },
      ),
      110,
      0.3,
    ),
  /** Ngủ gật: hai hơi thở dài, tiếng ồn lọc trầm. */
  snore: () => {
    const length = Math.round(1.1 * RATE);
    const out = new Float32Array(length);
    let seed = 7;
    let low = 0;
    let phase = 0;
    for (let i = 0; i < length; i++) {
      seed = (seed * 16807) % 2147483647;
      const noise = seed / 1073741823.5 - 1;
      low += (noise - low) * 0.08;
      const t = i / RATE;
      const breath =
        t < 0.6 ? Math.sin((t / 0.6) * Math.PI) : 0.6 * Math.sin(((t - 0.6) / 0.5) * Math.PI);
      phase += (95 - t * 12) / RATE;
      out[i] = (low * 2.2 + triangle(phase) * 0.25) * Math.max(0, breath) * 0.55;
    }
    return out;
  },
};

/* ------------------------------------------------------------------ chạy */
function findFiles(dir) {
  const result = new Map();
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = path.join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.toLowerCase().endsWith(".wav")) result.set(name, full);
    }
  };
  walk(dir);
  return result;
}

mkdirSync(outDir, { recursive: true });
const written = [];
const packDir = process.argv[2];
if (packDir) {
  if (!existsSync(packDir)) throw new Error(`Không thấy thư mục bộ âm: ${packDir}`);
  const files = findFiles(packDir);
  for (const [name, pick] of Object.entries(PICKS)) {
    const source = files.get(pick.file);
    if (!source) throw new Error(`Thiếu ${pick.file} trong bộ âm`);
    const { samples, rate } = readWav(source);
    const out = tidy(resample(samples, rate), pick);
    writeFileSync(path.join(outDir, `${name}.wav`), wav8(out));
    written.push(`${name}.wav ← ${pick.file} (${(out.length / RATE).toFixed(2)} s)`);
  }
} else {
  const missing = Object.keys(PICKS).filter(
    (name) => !existsSync(path.join(outDir, `${name}.wav`)),
  );
  console.warn(
    missing.length
      ? `Chưa có đường dẫn bộ âm CC0, còn thiếu: ${missing.join(", ")}`
      : "Không có đường dẫn bộ âm CC0: giữ nguyên các âm đã chọn trước đó.",
  );
}
for (const [name, make] of Object.entries(SYNTH)) {
  const out = tidy(make(), { max: 2.5, gain: name === "snore" ? 0.6 : 0.85 });
  writeFileSync(path.join(outDir, `${name}.wav`), wav8(out));
  written.push(`${name}.wav ← tự tạo (${(out.length / RATE).toFixed(2)} s)`);
}
const bytes = readdirSync(outDir)
  .filter((name) => name.endsWith(".wav"))
  .reduce((sum, name) => sum + statSync(path.join(outDir, name)).size, 0);
console.log(
  `Đã ghi ${written.length} âm vào src/assets/sfx (tổng ${(bytes / 1024).toFixed(0)} KB):\n- ${written.join("\n- ")}`,
);

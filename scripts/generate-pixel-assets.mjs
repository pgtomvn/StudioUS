// Sinh toàn bộ ảnh pixel của giao diện (nền, mascot, icon) thành PNG cục bộ.
// Không dùng thư viện ngoài: tự vẽ trên lưới điểm ảnh và tự mã hóa PNG bằng zlib của Node.
// Chạy: npm run assets   → ghi vào src/assets/pixel/ và một tờ xem trước ở tmp/pixel-preview.png
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const outDir = path.join(root, "src/assets/pixel");
const previewDir = path.join(root, "tmp");

// ---------------------------------------------------------------- nền tảng vẽ
const hexCache = new Map();
function rgb(hex) {
  if (Array.isArray(hex)) return hex;
  let c = hexCache.get(hex);
  if (!c) {
    const n = parseInt(hex.slice(1), 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(hex, c);
  }
  return c;
}

function mix(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t));
}

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  set(x, y, color, alpha = 1) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const [r, g, b] = rgb(color);
    const a0 = this.d[i + 3] / 255;
    if (alpha >= 1 || a0 === 0) {
      this.d[i] = r;
      this.d[i + 1] = g;
      this.d[i + 2] = b;
      this.d[i + 3] = alpha >= 1 ? 255 : Math.round(alpha * 255);
      return;
    }
    this.d[i] = Math.round(r * alpha + this.d[i] * (1 - alpha));
    this.d[i + 1] = Math.round(g * alpha + this.d[i + 1] * (1 - alpha));
    this.d[i + 2] = Math.round(b * alpha + this.d[i + 2] * (1 - alpha));
    this.d[i + 3] = Math.round((alpha + a0 * (1 - alpha)) * 255);
  }
  clear(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d.fill(0, (y * this.w + x) * 4, (y * this.w + x) * 4 + 4);
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }
  rect(x, y, w, h, color, alpha = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color, alpha);
  }
  ellipse(cx, cy, rx, ry, color, test) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (!test || test(x, y))) this.set(x, y, color);
      }
  }
  // Tam giác/đa giác lồi nhỏ: tô theo dòng quét.
  poly(points, color) {
    const ys = points.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        if (y1 === y2) continue;
        if (y >= Math.min(y1, y2) && y < Math.max(y1, y2))
          xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++) this.set(x, y, color);
    }
  }
  line(x0, y0, x1, y1, color, alpha = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++)
      this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, color, alpha);
  }
  // Viền 1 px quanh mọi điểm đã tô (kiểu sprite game).
  outline(color) {
    const marks = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y)) continue;
        if (
          this.alpha(x - 1, y) ||
          this.alpha(x + 1, y) ||
          this.alpha(x, y - 1) ||
          this.alpha(x, y + 1)
        )
          marks.push([x, y]);
      }
    for (const [x, y] of marks) this.set(x, y, color);
  }
  blit(src, ox, oy) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4;
        if (src.d[i + 3])
          this.set(ox + x, oy + y, [src.d[i], src.d[i + 1], src.d[i + 2]], src.d[i + 3] / 255);
      }
  }
  scaled(k) {
    const out = new Canvas(this.w * k, this.h * k);
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < out.w; x++) {
        const s = (Math.floor(y / k) * this.w + Math.floor(x / k)) * 4;
        out.d.set(this.d.subarray(s, s + 4), (y * out.w + x) * 4);
      }
    return out;
  }
  ascii(rows, palette, ox = 0, oy = 0) {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (palette[ch]) this.set(ox + x, oy + y, palette[ch]);
      }),
    );
  }
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(cv) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(cv.w, 0);
  header.writeUInt32BE(cv.h, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((cv.w * 4 + 1) * cv.h);
  for (let y = 0; y < cv.h; y++)
    Buffer.from(cv.d.buffer, y * cv.w * 4, cv.w * 4).copy(raw, y * (cv.w * 4 + 1) + 1);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// ---------------------------------------------------------------- các mảnh phong cảnh
const BG_W = 384;
const BG_H = 216;

function sky(cv, stops) {
  for (let y = 0; y < cv.h; y++) {
    const t = y / (cv.h - 1);
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    const f = Math.min(1, Math.max(0, (t - p0) / (p1 - p0)));
    for (let x = 0; x < cv.w; x++) cv.set(x, y, f > (BAYER[y & 3][x & 3] + 0.5) / 16 ? c1 : c0);
  }
}

function stars(cv, r, count, colors, maxY) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(r() * cv.w);
    const y = Math.floor(r() * maxY);
    const c = colors[Math.floor(r() * colors.length)];
    cv.set(x, y, c);
    if (r() < 0.12) {
      cv.set(x - 1, y, c, 0.6);
      cv.set(x + 1, y, c, 0.6);
      cv.set(x, y - 1, c, 0.6);
      cv.set(x, y + 1, c, 0.6);
    }
  }
}

function disc(cv, cx, cy, radius, rings) {
  // rings: [[tỉ lệ bán kính, màu, alpha]] vẽ từ ngoài vào trong
  for (const [k, color, alpha = 1] of rings) {
    const rr = radius * k;
    for (let y = Math.floor(cy - rr); y <= cy + rr; y++)
      for (let x = Math.floor(cx - rr); x <= cx + rr; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) cv.set(x, y, color, alpha);
  }
}

function rays(cv, cx, cy, color, r) {
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI * (0.52 + i * 0.09) + (r() - 0.5) * 0.05;
    const width = 6 + Math.floor(r() * 10);
    for (let d = 20; d < 320; d++)
      for (let wv = 0; wv < width * (d / 160); wv++) {
        const x = cx + Math.cos(ang) * d - Math.sin(ang) * wv;
        const y = cy + Math.sin(ang) * d + Math.cos(ang) * wv;
        if ((BAYER[Math.round(y) & 3][Math.round(x) & 3] & 1) === 0) cv.set(x, y, color, 0.22);
      }
  }
}

function cloud(cv, r, cx, baseY, width, height, [hi, mid, lo]) {
  const blobs = [];
  const n = Math.max(3, Math.round(width / 9));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const env = Math.sin(Math.PI * t) ** 0.6;
    const rad = Math.max(3, height * (0.22 + 0.5 * env * (0.55 + 0.45 * r())));
    blobs.push([cx - width / 2 + t * width + (r() - 0.5) * 5, baseY - rad * 0.75, rad]);
  }
  const inside = (x, y) =>
    y <= baseY && blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  for (let y = Math.floor(baseY - height * 1.6); y <= baseY; y++)
    for (let x = Math.floor(cx - width / 2 - height); x <= cx + width / 2 + height; x++) {
      if (!inside(x, y)) continue;
      let c = mid;
      if (!inside(x - 2, y - 3) || !inside(x, y - 2)) c = hi;
      else if (y > baseY - 3 - ((x >> 2) & 1) || !inside(x + 1, y + 4)) c = lo;
      cv.set(x, y, c);
    }
}

function mountains(cv, r, { peaks, baseY, light, dark, snow, jag = 1 }) {
  const jitter = Array.from({ length: cv.h }, () => (r() - 0.5) * 6);
  for (let x = 0; x < cv.w; x++) {
    let top = baseY;
    let lead = null;
    for (const p of peaks) {
      const y = p.y + Math.abs(x - p.x) * p.slope;
      if (y < top) {
        top = y;
        lead = p;
      }
    }
    top = Math.round(top + (jag ? ((x * 7919) % 3) - 1 : 0) * 0.5);
    for (let y = top; y < cv.h; y++) {
      if (!lead) {
        cv.set(x, y, dark);
        continue;
      }
      const edge = lead.x + (y - lead.y) * 0.35 + jitter[y];
      let c = x < edge ? light : dark;
      if (snow && y - lead.y < lead.cap + (((x + y) >> 1) & 1) * 2 && y - top < lead.cap) c = snow;
      cv.set(x, y, c);
    }
  }
}

function hills(cv, { baseY, amp, freq, phase, top, body, shade }) {
  for (let x = 0; x < cv.w; x++) {
    const y0 = Math.round(
      baseY + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase * 2) * amp * 0.35,
    );
    for (let y = y0; y < cv.h; y++) {
      const d = y - y0;
      let c = body;
      if (d < 2) c = top;
      else if (d < 5 && (BAYER[y & 3][x & 3] & 3) === 0) c = top;
      else if (d > 14 && (d > 22 || BAYER[y & 3][x & 3] < 8)) c = shade;
      cv.set(x, y, c);
    }
  }
}

function pine(cv, x, baseY, h, [light, dark, trunk]) {
  cv.rect(x - 1, baseY - Math.ceil(h * 0.18), 2, Math.ceil(h * 0.18), trunk);
  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const topY = baseY - h + t * h * 0.24;
    const botY = baseY - h * 0.16 - (tiers - 1 - t) * h * 0.2;
    const half = h * 0.22 * (0.55 + t * 0.3);
    for (let y = Math.round(topY); y <= botY; y++) {
      const k = (y - topY) / (botY - topY);
      const wv = Math.round(half * k);
      for (let dx = -wv; dx <= wv; dx++) cv.set(x + dx, y, dx < -wv * 0.15 ? light : dark);
    }
  }
}

function castle(cv, x0, groundY, { wall, shade, roof, glow }) {
  const towers = [
    [0, 16, 46, true],
    [14, 22, 30, false],
    [34, 14, 58, true],
    [46, 26, 36, false],
    [70, 12, 50, true],
    [80, 20, 24, false],
  ];
  for (const [dx, w, h, hasRoof] of towers) {
    const x = x0 + dx;
    const y = groundY - h;
    cv.rect(x, y, w, h + 40, wall);
    cv.rect(x + Math.round(w * 0.62), y, w - Math.round(w * 0.62), h + 40, shade);
    if (hasRoof) {
      for (let i = 0; i < w / 2 + 2; i++)
        cv.rect(x - 1 + i, y - (w / 2 + 2) + i - 1 + 1 - 1, 1, 1, roof);
      cv.poly(
        [
          [x - 2, y],
          [x + w / 2, y - w * 0.9],
          [x + w + 1, y],
        ],
        roof,
      );
      cv.poly(
        [
          [x + w / 2, y - w * 0.9],
          [x + w + 1, y],
          [x + w * 0.6, y],
        ],
        shade,
      );
    } else {
      for (let i = 0; i < w; i += 4) cv.rect(x + i, y - 3, 2, 3, i > w * 0.6 ? shade : wall);
    }
    for (let wy = y + 6; wy < groundY - 6; wy += 11)
      for (let wx = x + 3; wx < x + w - 3; wx += 7)
        if ((wx * 3 + wy) % 4 !== 0) cv.rect(wx, wy, 2, 3, glow);
  }
}

function floatingSquares(cv, r, count, colors) {
  for (let i = 0; i < count; i++) {
    const s = [2, 3, 4, 4, 6, 8, 10][Math.floor(r() * 7)];
    const x = Math.floor((r() * cv.w) / 2) * 2;
    const y = Math.floor((r() * cv.h) / 2) * 2;
    cv.rect(x, y, s, s, colors[Math.floor(r() * colors.length)], 0.18 + r() * 0.55);
  }
}

function sparkle(cv, x, y, s, color) {
  cv.rect(x - s, y, s * 2 + 1, 1, color);
  cv.rect(x, y - s, 1, s * 2 + 1, color);
  if (s > 1) cv.rect(x - 1, y - 1, 3, 3, color);
}

function neonGrid(cv, horizon, line, floor) {
  cv.rect(0, horizon, cv.w, cv.h - horizon, floor);
  const cx = cv.w / 2;
  for (let k = 0; k < 9; k++)
    cv.rect(0, Math.round(horizon + (k * k * (cv.h - horizon)) / 64), cv.w, 1, line, 0.75);
  for (let i = -14; i <= 14; i++) cv.line(cx + i * 9, horizon, cx + i * 60, cv.h, line, 0.6);
}

// ---------------------------------------------------------------- 5 phong cảnh theo chủ đề
const scenes = {
  sunset(cv) {
    const r = rng(11);
    sky(cv, [
      [0, "#4d4b72"],
      [0.3, "#62608a"],
      [0.55, "#a77fa8"],
      [0.75, "#f0a56a"],
      [0.9, "#ffcf7d"],
      [1, "#ffe6a8"],
    ]);
    stars(cv, r, 46, ["#fff4d6", "#d7c8ff"], 80);
    rays(cv, 318, 150, "#fff0c2", r);
    disc(cv, 318, 150, 26, [
      [1.6, "#ffe9b0", 0.25],
      [1.25, "#fff2c9", 0.45],
      [1, "#fffbe8"],
    ]);
    cloud(cv, r, 96, 62, 120, 30, ["#fff6d8", "#f6c7c2", "#d79cc4"]);
    cloud(cv, r, 300, 70, 110, 26, ["#f2b6e0", "#d58bd2", "#a96cc0"]);
    cloud(cv, r, 30, 104, 90, 24, ["#f7c3cf", "#e09ac6", "#b377c2"]);
    cloud(cv, r, 250, 122, 150, 22, ["#ffe2b0", "#f9bd8c", "#e79a8e"]);
    mountains(cv, r, {
      peaks: [
        { x: 330, y: 132, slope: 0.85, cap: 0 },
        { x: 372, y: 148, slope: 0.7, cap: 0 },
        { x: 286, y: 168, slope: 0.6, cap: 0 },
      ],
      baseY: 205,
      light: "#8a86c2",
      dark: "#5f5c98",
    });
    castle(cv, 22, 168, { wall: "#8683bd", shade: "#5c5a94", roof: "#6b5fa3", glow: "#ffd98a" });
    cloud(cv, r, 60, 214, 190, 34, ["#f0b3ea", "#cf85d6", "#a364bd"]);
    cloud(cv, r, 250, 222, 220, 30, ["#e7a0e4", "#bd76cf", "#9459b3"]);
  },
  meadow(cv) {
    const r = rng(23);
    sky(cv, [
      [0, "#2f6fbd"],
      [0.35, "#4a90d6"],
      [0.7, "#7fbdea"],
      [1, "#b6e0f5"],
    ]);
    cloud(cv, r, 250, 74, 150, 38, ["#ffffff", "#dcecf8", "#aecbe8"]);
    cloud(cv, r, 70, 50, 90, 22, ["#ffffff", "#dcecf8", "#aecbe8"]);
    cloud(cv, r, 160, 118, 120, 24, ["#f4fbff", "#cfe4f5", "#a5c5e6"]);
    mountains(cv, r, {
      peaks: [
        { x: 210, y: 112, slope: 0.75, cap: 0 },
        { x: 120, y: 132, slope: 0.7, cap: 0 },
      ],
      baseY: 190,
      light: "#a9dcc6",
      dark: "#86c4b2",
    });
    mountains(cv, r, {
      peaks: [
        { x: 318, y: 84, slope: 0.95, cap: 0 },
        { x: 384, y: 120, slope: 0.8, cap: 0 },
        { x: 250, y: 140, slope: 0.8, cap: 0 },
      ],
      baseY: 200,
      light: "#58b274",
      dark: "#2f8460",
    });
    hills(cv, {
      baseY: 176,
      amp: 5,
      freq: 0.021,
      phase: 1,
      top: "#a6e060",
      body: "#72c048",
      shade: "#4c9a3c",
    });
    for (let i = 0; i < 16; i++)
      pine(
        cv,
        150 + i * 13 + Math.floor(r() * 6),
        178 + Math.floor(r() * 4),
        16 + Math.floor(r() * 10),
        ["#3d9058", "#1f5e44", "#5a3a26"],
      );
    hills(cv, {
      baseY: 192,
      amp: 4,
      freq: 0.03,
      phase: 4,
      top: "#b9ea6a",
      body: "#7fcb4e",
      shade: "#559f3d",
    });
    for (const [x, h] of [
      [18, 62],
      [46, 44],
      [74, 34],
      [366, 40],
    ])
      pine(cv, x, 204, h, ["#4aa35f", "#236a48", "#6a4329"]);
    for (let y = 196; y < BG_H; y++) {
      const mid = 228 - (y - 196) * 2.2;
      const half = 5 + (y - 196) * 0.9;
      for (let x = Math.round(mid - half); x <= mid + half; x++)
        cv.set(x, y, (x + y) % 5 === 0 ? "#c28a3c" : "#e0b05a");
    }
  },
  arcade(cv) {
    const r = rng(37);
    sky(cv, [
      [0, "#ff58ad"],
      [0.3, "#de3fb3"],
      [0.6, "#8c2aa6"],
      [0.85, "#451a6e"],
      [1, "#26123f"],
    ]);
    floatingSquares(cv, r, 120, ["#ff9bd6", "#ffc9ec", "#c44fd0", "#7a2f9c", "#ffffff"]);
    for (let i = 0; i < 12; i++)
      sparkle(
        cv,
        12 + Math.floor(r() * 360),
        8 + Math.floor(r() * 150),
        i % 3 === 0 ? 2 : 1,
        "#ffe4f6",
      );
    disc(cv, 192, 176, 40, [
      [1.25, "#ff8fd0", 0.25],
      [1, "#ffd0f0"],
    ]);
    for (let k = 0; k < 6; k++) cv.rect(140, 150 + k * 6 + k, 104, 1 + (k >> 1), "#c93fb0");
    neonGrid(cv, 176, "#ff6fc8", "#1c0e33");
  },
  midnight(cv) {
    const r = rng(53);
    sky(cv, [
      [0, "#070b1f"],
      [0.4, "#0f1838"],
      [0.75, "#1c2c62"],
      [1, "#2f4a8c"],
    ]);
    stars(cv, r, 150, ["#ffffff", "#bfe9ff", "#8fb4ff"], 170);
    for (let x = 0; x < BG_W; x++) {
      const y0 = 96 + Math.sin(x * 0.03) * 12 + Math.sin(x * 0.011 + 2) * 16;
      for (let d = 0; d < 26; d++)
        if (BAYER[(Math.round(y0) + d) & 3][x & 3] < 7 - d * 0.25)
          cv.set(x, y0 + d, d < 10 ? "#4fe0d0" : "#3a8fd6", 0.4);
    }
    disc(cv, 300, 52, 20, [
      [1.5, "#bfe0ff", 0.12],
      [1, "#eef4ff"],
    ]);
    disc(cv, 293, 47, 5, [[1, "#cdd9f2"]]);
    disc(cv, 307, 60, 3, [[1, "#cdd9f2"]]);
    cloud(cv, r, 90, 132, 150, 22, ["#32437e", "#27356a", "#1d2955"]);
    cloud(cv, r, 320, 140, 120, 18, ["#32437e", "#27356a", "#1d2955"]);
    mountains(cv, r, {
      peaks: [
        { x: 96, y: 118, slope: 0.9, cap: 9 },
        { x: 30, y: 140, slope: 0.8, cap: 5 },
        { x: 196, y: 150, slope: 0.7, cap: 0 },
        { x: 350, y: 136, slope: 0.85, cap: 6 },
      ],
      baseY: 206,
      light: "#26346e",
      dark: "#151d47",
      snow: "#c9d8ff",
    });
    for (let i = 0; i < 30; i++)
      pine(cv, 4 + i * 13 + Math.floor(r() * 5), 216, 18 + Math.floor(r() * 16), [
        "#111a3e",
        "#0a1029",
        "#0a1029",
      ]);
  },
  campus(cv) {
    const r = rng(71);
    sky(cv, [
      [0, "#9fd6f2"],
      [0.45, "#c9e9f8"],
      [0.8, "#fdf0d6"],
      [1, "#ffe1b3"],
    ]);
    disc(cv, 70, 58, 20, [
      [1.7, "#fff1c4", 0.3],
      [1.3, "#ffe59c", 0.5],
      [1, "#ffc04d"],
    ]);
    cloud(cv, r, 260, 62, 130, 30, ["#ffffff", "#f1f6fb", "#cfdff0"]);
    cloud(cv, r, 150, 104, 100, 20, ["#ffffff", "#f1f6fb", "#d5e3f2"]);
    cloud(cv, r, 352, 118, 80, 18, ["#ffffff", "#f1f6fb", "#d5e3f2"]);
    // Dãy nhà xa (khối trường học) dạng bóng nhạt
    const blocks = [
      [196, 30, 26],
      [228, 22, 40],
      [252, 34, 22],
      [288, 18, 34],
      [308, 40, 28],
      [350, 30, 36],
    ];
    for (const [x, w, h] of blocks) {
      cv.rect(x, 172 - h, w, h + 20, "#f3c9a0");
      cv.rect(x + Math.round(w * 0.65), 172 - h, w - Math.round(w * 0.65), h + 20, "#e3ab82");
      for (let wy = 172 - h + 4; wy < 168; wy += 7)
        for (let wx = x + 3; wx < x + w - 3; wx += 6) cv.rect(wx, wy, 2, 3, "#fff6e0");
    }
    hills(cv, {
      baseY: 174,
      amp: 5,
      freq: 0.02,
      phase: 0.5,
      top: "#ffd39a",
      body: "#f9a95a",
      shade: "#ea8a3c",
    });
    hills(cv, {
      baseY: 192,
      amp: 4,
      freq: 0.033,
      phase: 3,
      top: "#ffe0ae",
      body: "#fbb86c",
      shade: "#ee9647",
    });
    for (let i = 0; i < 40; i++)
      cv.rect(
        Math.floor(r() * BG_W),
        196 + Math.floor(r() * 18),
        1,
        1,
        i % 2 ? "#ffffff" : "#ff6a1a",
      );
  },
};

// ---------------------------------------------------------------- mascot
// Phỏng theo thú bông linh vật fit@hcmus: thân trắng tròn, mũ cáo, mặt màn hình đen với mắt xanh.
// Mỗi chủ đề đổi màu mũ, màu đèn màn hình và phụ kiện.
const OUTLINE = "#241a33";
const outfits = {
  campus: {
    hood: "#f47a20",
    hoodHi: "#ff9d45",
    hoodLo: "#c9530f",
    ear: "#f58ab0",
    glow: "#3fe08a",
    gem: null,
  },
  sunset: {
    hood: "#7b5cc4",
    hoodHi: "#a183e6",
    hoodLo: "#57409a",
    ear: "#ffc85e",
    glow: "#ffd35e",
    gem: "crown",
  },
  meadow: {
    hood: "#3fa45a",
    hoodHi: "#6fcf74",
    hoodLo: "#27774a",
    ear: "#ffe38a",
    glow: "#8cf06a",
    gem: "leaf",
  },
  arcade: {
    hood: "#ff4fa8",
    hoodHi: "#ff8fcb",
    hoodLo: "#c22b86",
    ear: "#ffe45e",
    glow: "#ff7fe0",
    gem: "bow",
  },
  midnight: {
    hood: "#2b3f8f",
    hoodHi: "#4a66c8",
    hoodLo: "#1b2863",
    ear: "#8fe6ff",
    glow: "#5fe6ff",
    gem: "star",
  },
};

/** Thứ tự khung trong sprite linh vật; src/lib/mascot.ts dùng đúng thứ tự này. */
const FACES = ["idle", "blink", "happy", "sad", "sleep", "surprised", "love"];

function mascotFrame(o, face) {
  const cv = new Canvas(32, 32);
  const WHITE = "#ffffff";
  const SHADE = "#d6deee";
  const bodyIn = (x, y, grow = 0) =>
    ((x - 15.5) / (10.5 + grow)) ** 2 + ((y - 19.5) / (9.5 + grow)) ** 2 <= 1;
  // tay
  for (const ax of [3.5, 27.5]) {
    cv.ellipse(ax, 21.5, 2.6, 2.6, WHITE);
    cv.ellipse(ax + 0.6, 22.4, 1.6, 1.4, SHADE);
  }
  // thân
  for (let y = 9; y < 30; y++)
    for (let x = 4; x < 28; x++)
      if (bodyIn(x, y)) cv.set(x, y, bodyIn(x + 1.6, y + 1.8, -0.4) ? WHITE : SHADE);
  // mũ trùm: phần chỏm phía trên, vành cong xuống hai bên
  const rim = (x) => 12 + Math.round(((x - 15.5) / 11) ** 2 * 4.6);
  for (let y = 6; y < 20; y++)
    for (let x = 3; x < 29; x++) {
      const inHood = ((x - 15.5) / 10.9) ** 2 + ((y - 17) / 9.8) ** 2 <= 1;
      if (!inHood || y > rim(x)) continue;
      let c = o.hood;
      if (y === rim(x) || x > 23) c = o.hoodLo;
      else if (y < 10 && x < 15 && ((x - 15.5) / 9.4) ** 2 + ((y - 17) / 8) ** 2 > 1) c = o.hoodHi;
      cv.set(x, y, c);
    }
  // tai
  cv.poly(
    [
      [6, 10],
      [8, 3],
      [13, 7],
    ],
    o.hood,
  );
  cv.poly(
    [
      [18, 7],
      [23, 3],
      [25, 10],
    ],
    o.hood,
  );
  cv.poly(
    [
      [20, 7],
      [23, 5],
      [24, 9],
    ],
    o.ear,
  );
  cv.set(8, 4, o.hoodHi);
  cv.set(8, 5, o.hoodHi);
  // mặt nhỏ trên mũ
  cv.set(12, 10, "#1d3f8f");
  cv.set(19, 10, "#1d3f8f");
  cv.set(15, 11, OUTLINE);
  cv.set(16, 11, OUTLINE);
  // màn hình
  cv.ellipse(15.5, 21.5, 7.2, 5.4, "#15131f");
  cv.set(10, 19, "#3a3650");
  cv.set(11, 18, "#3a3650");
  // mắt và miệng trên màn hình (đèn LED theo màu chủ đề)
  const g = o.glow;
  const dot = (points, color = g) => points.forEach(([x, y]) => cv.set(x, y, color));
  const smile = () => (cv.rect(14, 23, 4, 1, g), cv.rect(15, 24, 2, 1, g));
  const cheeks = () =>
    dot(
      [
        [9, 23],
        [10, 23],
        [21, 23],
        [22, 23],
      ],
      o.ear,
    );
  for (const ex of [11, 17]) {
    if (face === "idle")
      dot([
        [ex, 21],
        [ex + 1, 20],
        [ex + 2, 20],
        [ex + 3, 21],
        [ex, 22],
        [ex + 3, 22],
      ]);
    else if (face === "blink") cv.rect(ex, 21, 4, 1, g);
    else if (face === "happy")
      dot([
        [ex, 21],
        [ex + 1, 20],
        [ex + 2, 20],
        [ex + 3, 21],
      ]);
    else if (face === "sad") {
      cv.rect(ex, 20, 4, 1, g);
      dot(
        [
          [ex + (ex === 11 ? 1 : 2), 21],
          [ex + (ex === 11 ? 1 : 2), 22],
        ],
        "#8fd6ff",
      );
    } else if (face === "sleep")
      dot([
        [ex, 21],
        [ex + 1, 22],
        [ex + 2, 22],
        [ex + 3, 21],
      ]);
    else if (face === "surprised") {
      cv.rect(ex + 1, 19, 2, 4, g);
      cv.rect(ex, 20, 4, 2, g);
      cv.set(ex + 1, 20, "#15131f");
    } else if (face === "love") {
      const hx = ex - 1;
      dot(
        [
          [hx, 19],
          [hx + 1, 19],
          [hx + 3, 19],
          [hx + 4, 19],
          [hx, 20],
          [hx + 1, 20],
          [hx + 2, 20],
          [hx + 3, 20],
          [hx + 4, 20],
          [hx + 1, 21],
          [hx + 2, 21],
          [hx + 3, 21],
          [hx + 2, 22],
        ],
        "#ff5c8a",
      );
    }
  }
  if (face === "happy") {
    cv.rect(13, 23, 6, 1, g);
    cv.rect(14, 24, 4, 1, g);
    cv.rect(15, 25, 2, 1, "#ff8fb0");
    cheeks();
  } else if (face === "sad") {
    dot([
      [15, 24],
      [16, 24],
      [14, 25],
      [17, 25],
    ]);
  } else if (face === "sleep") {
    cv.rect(15, 24, 2, 1, g);
  } else if (face === "surprised") {
    dot([
      [15, 23],
      [16, 23],
      [14, 24],
      [17, 24],
      [15, 25],
      [16, 25],
    ]);
  } else if (face === "love") {
    smile();
    cheeks();
  } else smile();
  // dòng chữ nhỏ dưới bụng
  for (const x of [12, 13, 15, 16, 18, 19]) cv.set(x, 28, "#2b62b8");
  // phụ kiện theo chủ đề
  if (o.gem === "crown") {
    cv.rect(13, 5, 6, 3, "#ffc83d");
    for (const x of [13, 15, 16, 18]) cv.set(x, 4, "#ffc83d");
    cv.rect(13, 7, 6, 1, "#d9961f");
    cv.set(15, 6, "#e5484d");
    cv.set(16, 6, "#e5484d");
    cv.set(13, 5, "#fff0a8");
  } else if (o.gem === "leaf") {
    cv.rect(15, 5, 1, 3, "#27774a");
    cv.rect(16, 3, 4, 2, "#9be36a");
    (cv.set(17, 2, "#9be36a"), cv.set(18, 2, "#9be36a"));
    cv.set(19, 4, "#5fc060");
    cv.rect(11, 4, 4, 2, "#7fd870");
    cv.set(11, 5, "#5fc060");
  } else if (o.gem === "bow") {
    cv.rect(11, 4, 4, 4, "#ffe45e");
    cv.rect(17, 4, 4, 4, "#ffe45e");
    cv.rect(15, 5, 2, 2, "#ffb81f");
    (cv.set(11, 4, "#fff6b8"), cv.set(17, 4, "#fff6b8"));
    (cv.rect(11, 7, 4, 1, "#f0c020"), cv.rect(17, 7, 4, 1, "#f0c020"));
  } else if (o.gem === "star") {
    cv.rect(13, 5, 7, 1, "#ffe66b");
    cv.rect(16, 2, 1, 6, "#ffe66b");
    cv.rect(15, 4, 3, 3, "#fff6b8");
    (cv.set(9, 12, "#ffe66b"), cv.set(22, 11, "#ffe66b"), cv.set(7, 14, "#bfe9ff"));
  }
  cv.outline(OUTLINE);
  return cv;
}

function mascotSheet(theme) {
  const sheet = new Canvas(32 * FACES.length, 32);
  FACES.forEach((face, index) => sheet.blit(mascotFrame(outfits[theme], face), 32 * index, 0));
  return sheet;
}

// ---------------------------------------------------------------- icon 16×16
const K = "#241a33";
const P = {
  k: K,
  w: "#fff7e6",
  g: "#ffc23d",
  G: "#c98a1b",
  y: "#ffe58a",
  s: "#c3cee0",
  S: "#7f8dab",
  r: "#e5484d",
  R: "#a8243a",
  b: "#4a90d9",
  B: "#2f5fa8",
  n: "#b0703f",
  N: "#75452a",
  p: "#f3deb0",
  q: "#cfae78",
  e: "#5cc46a",
  E: "#2f8a4a",
  c: "#bfefff",
  o: "#f58a2e",
  m: "#f08ac0",
};

const icons = {
  castle(c) {
    c.rect(2, 5, 3, 9, P.s);
    c.rect(11, 5, 3, 9, P.s);
    c.rect(5, 8, 6, 6, P.s);
    for (const x of [2, 4, 11, 13]) c.set(x, 4, P.s);
    for (const x of [5, 7, 8, 10]) c.set(x, 7, P.s);
    c.rect(4, 5, 1, 9, P.S);
    c.rect(13, 5, 1, 9, P.S);
    c.rect(10, 8, 1, 6, P.S);
    c.rect(7, 11, 2, 3, P.N);
    c.set(3, 7, P.B);
    c.set(12, 7, P.B);
    c.rect(8, 2, 1, 5, P.N);
    c.rect(9, 2, 2, 2, P.r);
  },
  book(c) {
    c.rect(3, 2, 10, 12, P.r);
    c.rect(3, 2, 2, 12, P.R);
    c.rect(5, 12, 8, 1, P.w);
    c.rect(5, 13, 8, 1, P.R);
    c.rect(7, 4, 4, 3, P.y);
    c.rect(8, 5, 2, 1, P.G);
    c.rect(12, 2, 1, 10, P.R);
  },
  calendar(c) {
    c.rect(2, 4, 12, 10, P.w);
    c.rect(2, 4, 12, 3, P.r);
    c.rect(2, 13, 12, 1, P.q);
    for (const x of [5, 10]) c.rect(x, 2, 1, 3, P.S);
    for (const [x, y] of [
      [4, 9],
      [7, 9],
      [10, 9],
      [4, 11],
      [7, 11],
    ])
      c.rect(x, y, 2, 1, P.S);
    c.rect(10, 11, 2, 1, P.r);
  },
  chest(c) {
    c.rect(2, 5, 12, 9, P.n);
    c.rect(2, 4, 12, 1, P.n);
    c.rect(3, 4, 10, 1, "#cf8c55");
    c.rect(2, 11, 12, 3, P.N);
    c.rect(2, 8, 12, 1, P.G);
    c.rect(4, 4, 1, 10, P.g);
    c.rect(11, 4, 1, 10, P.g);
    c.rect(7, 7, 2, 3, P.y);
    (c.set(7, 9, P.G), c.set(8, 9, P.G));
  },
  palette(c) {
    c.ellipse(7.5, 8, 6, 5.2, P.p);
    c.ellipse(8, 9.5, 5, 3.2, P.q, (x, y) => y > 10);
    for (const [x, y, col] of [
      [4, 6, P.r],
      [7, 4, P.b],
      [10, 5, P.e],
      [4, 9, P.g],
    ])
      c.rect(x, y, 2, 2, col);
    (c.clear(10, 9), c.clear(11, 9), c.clear(10, 10), c.clear(11, 10));
  },
  sword(c) {
    for (let i = 0; i < 8; i++) {
      c.set(13 - i, 2 + i, P.w);
      c.set(12 - i, 2 + i, P.s);
      c.set(13 - i, 3 + i, P.S);
    }
    c.set(14, 1, P.w);
    for (const [x, y] of [
      [3, 7],
      [4, 8],
      [5, 9],
      [6, 10],
      [7, 11],
      [8, 12],
    ])
      c.set(x, y, P.g);
    for (const [x, y] of [
      [4, 7],
      [5, 8],
      [7, 10],
      [8, 11],
    ])
      c.set(x, y, P.G);
    (c.set(4, 11, P.n), c.set(3, 12, P.n), c.set(4, 12, P.N), c.set(5, 10, P.n));
    c.rect(1, 13, 2, 2, P.g);
  },
  skull(c) {
    c.ellipse(7.5, 7, 5.4, 4.8, P.w);
    c.rect(5, 11, 6, 3, P.w);
    c.rect(4, 6, 3, 3, K);
    c.rect(9, 6, 3, 3, K);
    (c.set(5, 7, P.r), c.set(10, 7, P.r));
    (c.set(7, 10, K), c.set(8, 10, K));
    (c.set(6, 13, K), c.set(9, 13, K));
    (c.rect(11, 5, 1, 1, P.q), c.rect(10, 11, 1, 2, P.q));
  },
  star(c) {
    c.ascii(
      [
        "................",
        ".......yy.......",
        ".......yg.......",
        "......yggg......",
        "......yggg......",
        ".yyyyyggggggggg.",
        "..ygggggggggGG..",
        "...ygggggggGG...",
        "....ygggggGG....",
        "....ygggggGG....",
        "...yggggggGGG...",
        "...yggg..gGGG...",
        "..ygg......GGG..",
        "..y..........G..",
      ],
      P,
    );
  },
  hourglass(c) {
    c.rect(3, 2, 10, 2, P.n);
    c.rect(3, 12, 10, 2, P.n);
    (c.rect(3, 3, 10, 1, P.N), c.rect(3, 13, 10, 1, P.N));
    const rows = [
      [4, 4, 11],
      [5, 5, 10],
      [6, 6, 9],
      [7, 7, 8],
      [8, 6, 9],
      [9, 5, 10],
      [10, 4, 11],
      [11, 4, 11],
    ];
    for (const [y, a, b] of rows) c.rect(a, y, b - a + 1, 1, P.c);
    (c.rect(6, 5, 4, 1, P.g), c.rect(7, 6, 2, 1, P.g));
    (c.set(8, 8, P.g), c.rect(7, 9, 2, 1, P.g), c.rect(5, 10, 6, 2, P.g));
    c.rect(5, 11, 6, 1, P.G);
  },
  heart(c) {
    c.ascii(
      [
        "................",
        "................",
        "...rr....rr.....",
        "..rwrr..rrrr....",
        ".rwrrrrrrrrrR...",
        ".rrrrrrrrrrrR...",
        ".rrrrrrrrrrrR...",
        "..rrrrrrrrrR....",
        "...rrrrrrrR.....",
        "....rrrrrR......",
        ".....rrrR.......",
        "......rR........",
      ],
      P,
      1,
      1,
    );
  },
  // GPA học kỳ: cùng dáng trái tim của GPA tổng nhưng màu xanh để phân biệt
  heartTerm(c) {
    c.ascii(
      [
        "................",
        "................",
        "...bb....bb.....",
        "..bwbb..bbbb....",
        ".bwbbbbbbbbbB...",
        ".bbbbbbbbbbbB...",
        ".bbbbbbbbbbbB...",
        "..bbbbbbbbbB....",
        "...bbbbbbbB.....",
        "....bbbbbB......",
        ".....bbbB.......",
        "......bB........",
      ],
      P,
      1,
      1,
    );
  },
  coin(c) {
    c.ellipse(7.5, 7.5, 5.6, 5.6, P.g);
    c.ellipse(8.2, 8.2, 4.6, 4.6, P.G, (x, y) => x + y > 17);
    c.rect(7, 5, 2, 6, P.y);
    (c.rect(6, 5, 1, 1, P.y), c.rect(9, 10, 1, 1, P.y));
    c.set(5, 5, P.w);
  },
  warning(c) {
    c.poly(
      [
        [7.5, 2],
        [13.5, 13],
        [1.5, 13],
      ],
      P.g,
    );
    c.rect(2, 13, 12, 1, P.G);
    c.rect(7, 6, 2, 4, K);
    c.rect(7, 11, 2, 1, K);
  },
  scroll(c) {
    c.rect(4, 3, 9, 10, P.p);
    c.rect(2, 2, 10, 2, P.q);
    c.rect(2, 2, 2, 2, P.n);
    c.rect(5, 12, 9, 2, P.q);
    c.rect(12, 12, 2, 2, P.n);
    for (const y of [6, 8, 10]) c.rect(6, y, y === 10 ? 3 : 5, 1, P.N);
  },
  floppy(c) {
    c.rect(2, 2, 12, 12, P.b);
    c.rect(2, 12, 12, 2, P.B);
    c.rect(13, 2, 1, 12, P.B);
    c.rect(5, 2, 6, 4, P.s);
    c.rect(9, 3, 1, 2, P.B);
    c.rect(4, 8, 8, 6, P.w);
    (c.rect(5, 10, 6, 1, P.S), c.rect(5, 12, 4, 1, P.S));
  },
  note(c) {
    // nốt nhạc móc đơn cho hiệu ứng linh vật nhảy múa
    c.rect(9, 2, 2, 10, P.m);
    c.rect(11, 2, 3, 2, P.m);
    c.rect(12, 4, 2, 2, P.m);
    c.rect(13, 6, 1, 1, P.m);
    c.ellipse(7.5, 12.5, 3, 2.2, P.m);
    c.set(6, 11, P.w);
    c.rect(9, 3, 1, 6, "#ffc2df");
  },
  speaker(c) {
    // loa và sóng âm cho nút cài đặt âm thanh
    c.ascii(
      [
        "................",
        "......s.....y...",
        ".....ss......y..",
        "....sss...g...y.",
        "..ssssS....g..y.",
        "..ssssS....g..y.",
        "..ssssS....g..y.",
        "..ssssS....g..y.",
        "....sss...g...y.",
        ".....ss......y..",
        "......s.....y...",
      ],
      P,
      0,
      2,
    );
  },
  mute(c) {
    // loa đã tắt: dấu nhân đỏ thay cho sóng âm
    c.ascii(
      [
        "................",
        "......s.........",
        ".....ss.........",
        "....sss.........",
        "..ssssS..r...r..",
        "..ssssS...r.r...",
        "..ssssS....r....",
        "..ssssS...r.r...",
        "....sss..r...r..",
        ".....ss.........",
        "......s.........",
      ],
      P,
      0,
      2,
    );
  },
  student(c) {
    // thẻ sinh viên: dải xanh trên cùng, ảnh chân dung bên trái, các dòng chữ bên phải
    c.ascii(
      [
        ".bbbbbbbbbbbbbb.",
        ".bbbbbbbbbbbbbb.",
        ".pppppppppppppp.",
        ".pssssppSSSSSSp.",
        ".psqqsppppppppp.",
        ".psqqsppSSSSSpp.",
        ".pBBBBppppppppp.",
        ".pBBBBppSSSSppp.",
        ".pppppppppppppp.",
      ],
      P,
      0,
      3,
    );
  },
  calculator(c) {
    // máy tính bỏ túi: màn hình xanh có số, các phím trắng, phím "=" màu cam
    c.ascii(
      [
        "..SSSSSSSSSSSS..",
        "..SssssssssssS..",
        "..SseeeeeeeesS..",
        "..SseeeeEeEesS..",
        "..SseeeeeeeesS..",
        "..SssssssssssS..",
        "..SswwswwswwsS..",
        "..SswwswwswwsS..",
        "..SssssssssssS..",
        "..SswwswwswwsS..",
        "..SswwswwswwsS..",
        "..SssssssssssS..",
        "..SswwswwsoosS..",
        "..SswwswwsoosS..",
        "..SssssssssssS..",
        "..SSSSSSSSSSSS..",
      ],
      P,
      0,
      0,
    );
  },
  faction(c) {
    // cờ môn phái treo trên xà ngang, đuôi xẻ chữ V; ký hiệu ">_" (dấu nhắc lệnh) cho ngành phần mềm
    c.ascii(
      [
        "..gNNNNNNNNNNg..",
        "...rrrrrrrrrR...",
        "...rrrrrrrrrR...",
        "...rrrrrrrrrR...",
        "...rrgrrrrrrR...",
        "...rrrgrrrrrR...",
        "...rrrrgrrrrR...",
        "...rrrgrrrrrR...",
        "...rrgrrgggrR...",
        "...rrrrrrrrrR...",
        "...rrrrrrrrrR...",
        "...rrrrrrrrrR...",
        "...rrrr..rrrR...",
        "...rrr....rrR...",
        "...rr......rR...",
      ],
      P,
      0,
      0,
    );
  },
  shield(c) {
    c.ascii(
      [
        "..bbbbbbbbbbbb..",
        "..bwbbbbbbbbBB..",
        "..bwbbbggbbbBB..",
        "..bbbbbggbbbBB..",
        "..bbbggggggbBB..",
        "..bbbbggggbbBB..",
        "..bbbbggggbbBB..",
        "..bbbggbbggbBB..",
        "...bbbbbbbbBB...",
        "...bbbbbbbbBB...",
        "....bbbbbbBB....",
        ".....bbbbBB.....",
        "......bbBB......",
      ],
      P,
      0,
      1,
    );
  },
};

// ---------------------------------------------------------------- xuất file
mkdirSync(outDir, { recursive: true });
mkdirSync(previewDir, { recursive: true });
const written = [];
function save(name, cv) {
  writeFileSync(path.join(outDir, name), png(cv));
  written.push(`${name} (${cv.w}×${cv.h})`);
}

const backgrounds = {};
for (const [theme, draw] of Object.entries(scenes)) {
  const cv = new Canvas(BG_W, BG_H);
  draw(cv);
  backgrounds[theme] = cv;
  save(`bg-${theme}.png`, cv);
}
const mascots = {};
for (const theme of Object.keys(outfits)) {
  mascots[theme] = mascotSheet(theme);
  save(`mascot-${theme}.png`, mascots[theme]);
}
const iconCanvases = {};
for (const [name, draw] of Object.entries(icons)) {
  const cv = new Canvas(16, 16);
  draw(cv);
  cv.outline(K);
  iconCanvases[name] = cv;
  save(`icon-${name}.png`, cv);
}

// Tờ xem trước để rà bằng mắt (không dùng trong ứng dụng).
const themes = Object.keys(scenes);
const sheet = new Canvas(BG_W * 2 + 24, 3 * (BG_H + 8) + 8 + 130);
sheet.rect(0, 0, sheet.w, sheet.h, "#2b2b33");
themes.forEach((t, i) =>
  sheet.blit(backgrounds[t], 8 + (i % 2) * (BG_W + 8), 8 + Math.floor(i / 2) * (BG_H + 8)),
);
Object.values(iconCanvases).forEach((cv, i) =>
  sheet.blit(cv.scaled(3), BG_W + 20 + (i % 7) * 52, 2 * (BG_H + 8) + 16 + Math.floor(i / 7) * 56),
);
writeFileSync(path.join(previewDir, "pixel-preview.png"), png(sheet));
const mascotSheetPreview = new Canvas(
  32 * FACES.length * 4 + 16,
  Object.keys(outfits).length * (32 * 4 + 8) + 8,
);
mascotSheetPreview.rect(0, 0, mascotSheetPreview.w, mascotSheetPreview.h, "#8d8aa8");
Object.keys(outfits).forEach((t, i) =>
  mascotSheetPreview.blit(mascots[t].scaled(4), 8, 8 + i * (32 * 4 + 8)),
);
writeFileSync(path.join(previewDir, "pixel-preview-mascot.png"), png(mascotSheetPreview));

console.log(`Đã sinh ${written.length} ảnh vào src/assets/pixel:\n- ${written.join("\n- ")}`);

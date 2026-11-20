# Font nhúng cục bộ

Font được chép vào dự án (không tải từ CDN khi chạy ứng dụng), giấy phép SIL OFL 1.1:

- `galmuri9-vi.woff2` — Galmuri9 của Lee Minseo (quiple), từ gói npm `galmuri@2.40.3`, dùng cho **chữ thân bài**
  (từ 20/11/2026, UIBUILD-15). Đã cắt bằng fontTools 4.68.0 (`pyftsubset`) chỉ còn Latin cơ bản, Latin-1, đủ 134
  chữ có dấu tiếng Việt, dấu câu chung, mũi tên và vài ký hiệu (✓ ✕ ★ ♥ ♪): 358 glyph, 6 628 byte. Gói gốc mô tả
  font “dựa trên thiết kế font của Nintendo DS”; giấy phép trong gói là OFL 1.1 (`LICENSE-Galmuri.txt`).
  Khai báo với `size-adjust: 80%` để chữ rộng xấp xỉ VT323 cùng cỡ, bố cục không phải đổi.
- `vt323-*` — VT323 400, từ `@fontsource/vt323@5.3.0`. Trước đây là chữ thân bài; nay chỉ dự phòng ký tự Galmuri9
  không có.
- `handjet-*` — Handjet 600/800, từ `@fontsource/handjet@5.3.1`, dùng cho tiêu đề.

VT323 và Handjet chỉ giữ ba tập ký tự `latin`, `latin-ext`, `vietnamese` để hiển thị đủ dấu tiếng Việt.

Lệnh cắt Galmuri9 (chạy trong thư mục tạm, không cần cài vào dự án):

```text
python -m fontTools.subset Galmuri9.ttf --flavor=woff2 --no-hinting --layout-features='*' \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0102-0103,U+0110-0111,U+0128-0129,U+0131,U+0152-0153,U+0168-0169,\
U+01A0-01A1,U+01AF-01B0,U+02C6,U+02DA,U+02DC,U+0300-0303,U+0309,U+0323,U+1EA0-1EF9,U+2010-2027,U+2030-203A,\
U+20AB,U+20AC,U+2122,U+2190-2195,U+2212,U+2713,U+2715,U+2605,U+2606,U+2665,U+266A,U+266B,U+25B2-25BC,U+25CF" \
  --output-file=galmuri9-vi.woff2
```

Kiểm tra độ phủ (đếm trong bảng cmap): Galmuri9 và Galmuri11 bản thường có đủ 210/210 ký tự kiểm tra (chữ Việt
hoa/thường có dấu, chữ số, dấu câu); Galmuri11 Bold, Galmuri14, GalmuriMono11 và Fusion Pixel 10/12 px thiếu 94–102
chữ có dấu nên không dùng. Pixelify Sans, Silkscreen, Tiny5, Jersey, Micro 5, Bitcount… trên Fontsource không có tập
`vietnamese`.

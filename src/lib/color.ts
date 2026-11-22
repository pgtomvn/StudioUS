/** Màu lịch học: bảng màu mặc định và màu chữ đọc rõ trên nền bất kỳ. */

/** Màu có sẵn (tông nhạt để chữ tối đọc rõ): đỏ, cam, vàng, lục, lam, hồng, tím. */
export const CLASS_COLORS: { value: string; name: string }[] = [
  { value: "#ff9b9b", name: "đỏ" },
  { value: "#ffc08a", name: "cam" },
  { value: "#ffe66b", name: "vàng" },
  { value: "#8fe6a8", name: "lục" },
  { value: "#8fd0ff", name: "lam" },
  { value: "#ffb0c8", name: "hồng" },
  { value: "#c9b0ff", name: "tím" },
];

export const isHexColor = (text: string) => /^#[0-9a-f]{6}$/i.test(text);

const DARK_INK = "#241a33";
const LIGHT_INK = "#ffffff";

/** Màu chữ trên nền `background` (#rrggbb): chữ tối trên nền sáng, chữ trắng trên nền tối. */
export function inkOn(background: string): string {
  if (!isHexColor(background)) return DARK_INK;
  const channel = (index: number) => {
    const value = parseInt(background.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  // So độ tương phản với chữ tối (≈ 0.017) và chữ trắng (1.0), chọn bên tương phản hơn.
  const darkContrast = (luminance + 0.05) / (0.0168 + 0.05);
  const lightContrast = 1.05 / (luminance + 0.05);
  return darkContrast >= lightContrast ? DARK_INK : LIGHT_INK;
}

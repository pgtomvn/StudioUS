import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bản build gom toàn bộ JS, CSS, font và ảnh pixel vào một file dist/index.html.
// File này mở trực tiếp được (file://) hoặc qua máy chủ cục bộ, không cần mạng.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    target: "es2022",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    copyPublicDir: false,
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});

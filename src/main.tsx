import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import favicon from "./assets/pixel/icon-shield.png";
import { getState } from "./lib/store";
import "./styles/themes.css";
import "./styles/app.css";

// Gắn chủ đề trước lần vẽ đầu tiên để không nháy màu.
document.documentElement.dataset.theme = getState().settings.theme;

// Favicon nhúng dạng data URL để bản build chỉ còn đúng một file HTML.
const icon = document.createElement("link");
icon.rel = "icon";
icon.type = "image/png";
icon.href = favicon;
document.head.append(icon);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

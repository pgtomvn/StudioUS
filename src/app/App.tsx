import { useEffect, useState } from "react";
import { Pet, useMascotBrain } from "../components/Pet";
import { SoundButton, SoundPanel } from "../components/SoundPanel";
import { Icon, Mascot, Modal, ToastHost, toast, type IconName } from "../components/ui";
import { CoursesScreen } from "../features/curriculum/CoursesScreen";
import { DashboardScreen } from "../features/dashboard/DashboardScreen";
import { DataScreen } from "../features/data-management/DataScreen";
import { ScheduleScreen } from "../features/schedule/ScheduleScreen";
import { configureSound, installSound } from "../lib/sound";
import { actions, useAppState } from "../lib/store";
import type { ScreenId, ThemeId } from "../types";
import { navigate } from "./nav";

export const APP_NAME = "StudioUS";

const SCREENS: { id: ScreenId; label: string; short: string; icon: IconName }[] = [
  { id: "dashboard", label: "Tổng quan", short: "Tổng quan", icon: "castle" },
  { id: "courses", label: "Học phần & Điểm", short: "Học phần", icon: "book" },
  { id: "schedule", label: "TKB & Thi", short: "TKB & Thi", icon: "calendar" },
  { id: "data", label: "Dữ liệu", short: "Dữ liệu", icon: "chest" },
];

export const THEMES: { id: ThemeId; name: string; outfit: string; swatches: string[] }[] = [
  {
    id: "sunset",
    name: "Hoàng hôn",
    outfit: "Mũ tím, vương miện",
    swatches: ["#4b487a", "#ffc247", "#f0a56a"],
  },
  {
    id: "meadow",
    name: "Thảo nguyên",
    outfit: "Mũ lá, chồi non",
    swatches: ["#f6e7c1", "#d9482b", "#58b274"],
  },
  {
    id: "arcade",
    name: "Arcade",
    outfit: "Mũ hồng, nơ vàng",
    swatches: ["#3b1a63", "#ff4fa8", "#ffe45e"],
  },
  {
    id: "midnight",
    name: "Đêm sao",
    outfit: "Mũ đêm, ngôi sao",
    swatches: ["#18244f", "#5fe6ff", "#ffe66b"],
  },
  {
    id: "campus",
    name: "Sân trường",
    outfit: "Mũ cam nguyên bản",
    swatches: ["#fffaf0", "#f47a20", "#2b62b8"],
  },
];

function readHash(): ScreenId {
  const id = window.location.hash.replace(/^#\/?/, "") as ScreenId;
  return SCREENS.some((screen) => screen.id === id) ? id : "dashboard";
}

function ThemePicker({ onClose }: { onClose: () => void }) {
  const { settings } = useAppState();
  return (
    <Modal title="Chọn màu giao diện" onClose={onClose} wide>
      <p className="dim">
        Mỗi chủ đề đổi màu khung, ảnh nền và trang phục của linh vật. Lựa chọn được lưu trên thiết
        bị.
      </p>
      <div className="theme-grid">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            data-theme={theme.id}
            className={`theme-card${settings.theme === theme.id ? " is-active" : ""}`}
            aria-pressed={settings.theme === theme.id}
            onClick={() => actions.setTheme(theme.id)}
          >
            <span className="theme-thumb">
              <Mascot scale={2} still />
            </span>
            <span className="theme-meta">
              <span>
                {theme.name}
                <br />
                <small className="dim">{theme.outfit}</small>
              </span>
              <span className="swatches">
                {theme.swatches.map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function App() {
  const { settings, loadStatus, saveOk } = useAppState();
  const [screen, setScreen] = useState<ScreenId>(readHash);
  useMascotBrain();
  const [pickingTheme, setPickingTheme] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setScreen(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => installSound(), []);
  useEffect(() => configureSound(settings.sound, settings.theme), [settings.sound, settings.theme]);

  useEffect(() => {
    if (loadStatus === "corrupt")
      toast(
        "Dữ liệu đã lưu bị hỏng nên ứng dụng mở trạng thái trống. Bản hỏng vẫn được giữ lại trong trình duyệt để cứu dữ liệu.",
        true,
      );
    if (loadStatus === "unavailable")
      toast("Trình duyệt không cho phép lưu LocalStorage. Thay đổi sẽ mất khi đóng trang.", true);
  }, [loadStatus]);

  useEffect(() => {
    if (!saveOk && loadStatus !== "unavailable")
      toast("Không lưu được thay đổi vào LocalStorage (có thể đã hết dung lượng).", true);
  }, [saveOk, loadStatus]);

  const themeButton = (
    <button className="btn btn-sm" onClick={() => setPickingTheme(true)}>
      <Icon name="palette" size={1} />
      Đổi màu
    </button>
  );

  return (
    <>
      <div className="scene" aria-hidden="true" />
      <div className="app">
        <aside className="sidebar">
          <button
            className="brand"
            data-sfx="nav"
            title="Về trang Tổng quan"
            onClick={() => navigate("dashboard")}
          >
            <Icon name="shield" size={2.5} />
            <span className="brand-name display">{APP_NAME}</span>
          </button>
          <nav className="nav" aria-label="Điều hướng chính">
            {SCREENS.map((item) => (
              <button
                key={item.id}
                className={`nav-btn${screen === item.id ? " is-active" : ""}`}
                aria-current={screen === item.id ? "page" : undefined}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-icon">
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <Pet variant="side" />
            <div className="side-actions">
              {themeButton}
              <SoundButton onOpen={() => setSoundOpen(true)} />
            </div>
          </div>
        </aside>

        <div>
          <header className="topbar">
            <button
              className="brand topbar-brand"
              data-sfx="nav"
              title="Về trang Tổng quan"
              onClick={() => navigate("dashboard")}
            >
              <Icon name="shield" size={2} />
              <span className="brand-name display">{APP_NAME}</span>
            </button>
            <SoundButton compact onOpen={() => setSoundOpen(true)} />
            {themeButton}
          </header>
          <main className="main" key={screen}>
            {screen === "dashboard" && <DashboardScreen />}
            {screen === "courses" && <CoursesScreen />}
            {screen === "schedule" && <ScheduleScreen />}
            {screen === "data" && <DataScreen />}
          </main>
        </div>

        <nav className="tabbar" aria-label="Điều hướng chính">
          {SCREENS.map((item) => (
            <button
              key={item.id}
              className={screen === item.id ? "is-active" : ""}
              aria-current={screen === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={1.5} />
              {item.short}
            </button>
          ))}
        </nav>
      </div>
      {pickingTheme && <ThemePicker onClose={() => setPickingTheme(false)} />}
      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}
      <Pet variant="float" />
      <ToastHost />
    </>
  );
}

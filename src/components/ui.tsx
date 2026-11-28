import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { computeStats, formatGpa } from "../domain/progress";
import { TOTAL_CREDITS_REQUIRED } from "../domain/rules";
import { FACE_INDEX, useAsleep, useReaction, type Face, type Motion } from "../lib/mascot";
import { sfx } from "../lib/sound";
import { onCreditGain, useAppState } from "../lib/store";

/* ------------------------------------------------------------ ảnh pixel */
const pixelFiles = import.meta.glob<string>("../assets/pixel/icon-*.png", {
  eager: true,
  import: "default",
});
const ICONS: Record<string, string> = {};
for (const [file, url] of Object.entries(pixelFiles))
  ICONS[file.replace(/^.*icon-(.+)\.png$/, "$1")] = url;

export type IconName =
  | "castle"
  | "book"
  | "calendar"
  | "chest"
  | "palette"
  | "sword"
  | "skull"
  | "star"
  | "hourglass"
  | "heart"
  | "coin"
  | "warning"
  | "scroll"
  | "floppy"
  | "shield"
  | "faction"
  | "calculator"
  | "heartTerm"
  | "student"
  | "note"
  | "speaker"
  | "mute";

export function Icon({ name, size = 2 }: { name: IconName; size?: number }) {
  return (
    <img
      className="px-icon"
      src={ICONS[name]}
      width={16 * size}
      height={16 * size}
      alt=""
      aria-hidden="true"
    />
  );
}

/**
 * Linh vật pixel; trang phục đổi theo chủ đề qua biến CSS --mascot.
 * `live`: cùng phản ứng với các sự kiện của ứng dụng (vui khi qua môn, buồn khi rớt…).
 */
export function Mascot(props: {
  scale?: number;
  mood?: "happy";
  still?: boolean;
  live?: boolean;
  face?: Face;
  motion?: Motion;
}) {
  const reaction = useReaction();
  const asleep = useAsleep();
  const active = props.live ? reaction : null;
  // Linh vật "sống" ngủ gật cùng lúc khi người dùng để lâu không thao tác.
  const dozing = props.live && !reaction && asleep;
  const face =
    props.face ?? active?.face ?? (dozing ? "sleep" : props.mood === "happy" ? "happy" : undefined);
  const motion =
    props.motion ??
    active?.motion ??
    (dozing ? "sleep" : props.mood === "happy" ? "hop" : undefined);
  const classes = ["mascot"];
  if (face) classes.push("has-face");
  if (motion) classes.push(`m-${motion}`);
  if (props.still && !face && !motion) classes.push("is-still");
  const style = {
    ...(props.scale ? { "--s": props.scale } : {}),
    ...(face ? { "--face": FACE_INDEX[face] } : {}),
  } as React.CSSProperties;
  return (
    <span
      // Đổi key để chạy lại động tác khi có phản ứng mới.
      key={active?.id ?? "idle"}
      className={classes.join(" ")}
      style={style}
      role="img"
      aria-label="Linh vật pixel"
    />
  );
}

/* ------------------------------------------------------------ khung, thanh tiến độ */
export function Panel(props: {
  title?: string;
  icon?: IconName;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`panel ${props.className ?? ""}`}>
      {(props.title || props.actions) && (
        <header className="panel-head">
          {props.icon && <Icon name={props.icon} />}
          {props.title && <h2 className="panel-title display">{props.title}</h2>}
          <span className="spacer" />
          {props.actions}
        </header>
      )}
      {props.children}
    </section>
  );
}

export function Bar({
  value,
  max,
  small,
  label,
}: {
  value: number;
  max: number;
  small?: boolean;
  label: string;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={`bar${small ? " bar-sm" : ""}${value >= max && max > 0 ? " is-done" : ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <div className="bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Field(props: {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{props.label}</span>
      {props.children}
      {props.error ? (
        <span className="field-error">{props.error}</span>
      ) : props.hint ? (
        <span className="field-hint">{props.hint}</span>
      ) : null}
    </label>
  );
}

/* ------------------------------------------------------------ hộp thoại */
export function Modal(props: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  full?: boolean;
}) {
  const { onClose } = props;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Tiếng mở/đóng hộp thoại.
  useEffect(() => {
    sfx("open");
    return () => sfx("close", { soft: true });
  }, []);
  // Khóa cuộn trang nền khi hộp thoại đang mở.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <div
      className="modal-back"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`modal${props.wide ? " is-wide" : ""}${props.full ? " is-full" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <header className="modal-head">
          <h2 className="display">{props.title}</h2>
          <button
            className="btn btn-sm icon-btn"
            onClick={onClose}
            aria-label="Đóng"
            data-sfx="none"
          >
            ✕
          </button>
        </header>
        <div className="modal-body">{props.children}</div>
        {props.footer && <footer className="modal-foot">{props.footer}</footer>}
      </div>
    </div>
  );
}

export function Confirm(props: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={props.title}
      onClose={props.onCancel}
      footer={
        <>
          <button className="btn" onClick={props.onCancel}>
            Hủy
          </button>
          <button
            className={`btn ${props.danger ? "btn-danger" : "btn-primary"}`}
            onClick={props.onConfirm}
          >
            {props.confirmLabel}
          </button>
        </>
      }
    >
      <div>{props.message}</div>
    </Modal>
  );
}

/* ------------------------------------------------------------ toast */
interface ToastItem {
  id: number;
  text: string;
  error: boolean;
  /** Nút hành động (VD “Hoàn tác”); bấm thì chạy rồi đóng thông báo. */
  action?: { label: string; run: () => void };
  /** Thời gian tự tắt (ms); 0 = giữ đến khi đóng. */
  ms: number;
}
let toasts: ToastItem[] = [];
let toastId = 0;
const toastListeners = new Set<() => void>();
function setToasts(next: ToastItem[]) {
  toasts = next;
  for (const listener of toastListeners) listener();
}
function dismissToast(id: number) {
  setToasts(toasts.filter((item) => item.id !== id));
}
/** Thành công tự tắt sau 3 giây; lỗi giữ đến khi người dùng đóng. */
export function toast(
  text: string,
  options: boolean | { error?: boolean; action?: ToastItem["action"]; ms?: number } = {},
) {
  const { error = false, action, ms } = typeof options === "boolean" ? { error: options } : options;
  const id = ++toastId;
  const life = ms ?? (error ? 0 : 3000);
  setToasts([...toasts, { id, text, error, action, ms: life }]);
  sfx(error ? "error" : "pop", { soft: !error });
  if (life > 0) setTimeout(() => dismissToast(id), life);
}

/** Thời gian cho phép hoàn tác sau một thao tác xóa/ghi đè. */
export const UNDO_MS = 10_000;

/** Thông báo kèm nút “Hoàn tác” trong 10 giây (thay cho hộp xác nhận trước khi xóa). */
export function undoToast(text: string, undo: () => void) {
  toast(text, {
    ms: UNDO_MS,
    action: {
      label: "Hoàn tác",
      run: () => {
        undo();
        toast("Đã hoàn tác");
      },
    },
  });
}

export function ToastHost() {
  const items = useSyncExternalStore(
    (listener) => {
      toastListeners.add(listener);
      return () => toastListeners.delete(listener);
    },
    () => toasts,
  );
  return (
    <div className="toast-host" aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className={`toast${item.error ? " is-error" : ""}`}
          role={item.error ? "alert" : "status"}
        >
          <span>{item.text}</span>
          {item.action && (
            <button
              className="toast-action"
              onClick={() => {
                dismissToast(item.id);
                item.action!.run();
              }}
            >
              {item.action.label}
            </button>
          )}
          <button
            className="toast-close"
            onClick={() => dismissToast(item.id)}
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
          {item.action && item.ms > 0 && (
            <i
              className="toast-timer"
              style={{ animationDuration: `${item.ms}ms` }}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ HUD dùng chung cho màn 2–4 */
export function Avatar({ src }: { src: string | null }) {
  return (
    <span className="hud-avatar">
      {src ? <img className="avatar-img" src={src} alt="" /> : <Mascot scale={1.25} still live />}
    </span>
  );
}

export function Hud() {
  const { data } = useAppState();
  const stats = computeStats(data);
  const [gain, setGain] = useState<{ id: number; credits: number } | null>(null);
  useEffect(
    () =>
      onCreditGain((credits) => {
        const id = Date.now();
        setGain({ id, credits });
        setTimeout(() => setGain((current) => (current?.id === id ? null : current)), 1300);
      }),
    [],
  );
  return (
    <div className="hud">
      <Avatar src={data.profile.avatar} />
      <span className="hud-name display">{data.profile.name || "Tên sinh viên"}</span>
      <span className="hud-stat">
        <Icon name="coin" size={1} />
        TC: <b>{stats.earned}</b> / {TOTAL_CREDITS_REQUIRED}
        {gain && (
          <span key={gain.id} className="gain">
            +{gain.credits} TC
          </span>
        )}
      </span>
      <span className="hud-stat">
        <Icon name="heart" size={1} />
        GPA tổng: <b>{formatGpa(stats.gpa)}</b>
        {stats.gpa !== null && " / 10"}
      </span>
    </div>
  );
}

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

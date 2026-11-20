import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { COURSE_BY_ID } from "../data/curriculum";
import { computeStats, semesterInfoStatus } from "../domain/progress";
import { TOTAL_CREDITS_REQUIRED } from "../domain/rules";
import {
  SECRETS,
  affection,
  greeting,
  isAsleep,
  react,
  secretTyped,
  setAsleep,
  useAsleep,
  useReaction,
  type Effect,
} from "../lib/mascot";
import { sfx, useMusicPlaying } from "../lib/sound";
import { actions, useAppState } from "../lib/store";
import { daysUntil, examDate, nextExam, semestersAhead } from "../lib/time";
import { Icon, Mascot, type IconName } from "./ui";

/** Sau bao lâu không thao tác thì linh vật ngủ gật. */
export const IDLE_MS = 45_000;

/* ------------------------------------------------------------------ hiệu ứng hạt pixel */
const CONFETTI = ["#ff5c8a", "#ffc83d", "#5fe6ff", "#7be0a0", "#c9b0ff", "#ffffff"];

function random(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function Fx({ effect }: { effect: Effect }) {
  const particles = useMemo(() => {
    const icon: Partial<Record<Effect, IconName>> = {
      hearts: "heart",
      sparkles: "star",
      coins: "coin",
      notes: "note",
    };
    const count = { hearts: 7, sparkles: 8, coins: 7, notes: 5, confetti: 22, tears: 5, zzz: 3 }[
      effect
    ];
    return Array.from({ length: count }, (_, index) => {
      const style = {
        "--dx": `${random(-60, 60)}px`,
        "--dy": `${effect === "tears" ? random(30, 60) : random(-110, -50)}px`,
        "--d": `${effect === "zzz" ? index * 0.8 : random(0, 0.45)}s`,
        "--r": `${random(-200, 200)}deg`,
        "--c": CONFETTI[index % CONFETTI.length],
      } as CSSProperties;
      if (icon[effect])
        return (
          <span key={index} className="fx-p" style={style}>
            <Icon name={icon[effect]!} size={effect === "sparkles" ? 0.75 : 1} />
          </span>
        );
      if (effect === "zzz")
        return (
          <span key={index} className="fx-p fx-z" style={style}>
            Z
          </span>
        );
      return <span key={index} className={`fx-p fx-${effect}`} style={style} />;
    });
  }, [effect]);
  return (
    <span className={`fx${effect === "zzz" ? " is-loop" : ""}`} aria-hidden="true">
      {particles}
    </span>
  );
}

/* ------------------------------------------------------------------ "bộ não": chào, ngủ gật, mật mã, mừng tốt nghiệp */
export function useMascotBrain() {
  const { data } = useAppState();
  const ready = computeStats(data).graduationReady;
  const wasReady = useRef(ready);

  useEffect(() => {
    const timer = setTimeout(
      () => react({ face: "happy", motion: "hop", say: greeting(new Date().getHours()), ms: 4500 }),
      700,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && !wasReady.current)
      react({
        face: "love",
        motion: "dance",
        effect: "confetti",
        say: "ĐỦ ĐIỀU KIỆN TỐT NGHIỆP! Mình tự hào về bạn quá!",
        ms: 6000,
        sound: "graduate",
      });
    wasReady.current = ready;
  }, [ready]);

  useEffect(() => {
    let last = Date.now();
    let buffer = "";
    const wake = () => {
      last = Date.now();
      if (isAsleep()) {
        setAsleep(false);
        react({
          face: "surprised",
          motion: "hop",
          say: "Ơ! Mình đâu có ngủ đâu nha!",
          sound: "alert",
        });
      }
    };
    const onKey = (event: KeyboardEvent) => {
      wake();
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable]"))
        return;
      if (event.key.length !== 1) return;
      buffer = (buffer + event.key).slice(-12);
      const secret = secretTyped(buffer);
      if (secret) {
        buffer = "";
        react(SECRETS[secret]);
      }
    };
    let moved = 0;
    const onMove = () => {
      // Chỉ cần biết có hoạt động; không gọi wake ở mọi lần di chuột.
      if (Date.now() - moved > 500) {
        moved = Date.now();
        wake();
      }
    };
    const tick = setInterval(() => {
      if (!isAsleep() && Date.now() - last > IDLE_MS && document.visibilityState === "visible") {
        setAsleep(true);
        sfx("snore", { soft: true });
      }
    }, 3000);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("wheel", onMove, { passive: true });
    window.addEventListener("touchstart", wake, { passive: true });
    return () => {
      clearInterval(tick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("wheel", onMove);
      window.removeEventListener("touchstart", wake);
    };
  }, []);
}

/* ------------------------------------------------------------------ câu thoại theo tình hình học tập */
function useLines(): string[] {
  const { data, settings } = useAppState();
  return useMemo(() => {
    const stats = computeStats(data);
    const exam = nextExam(data.exams);
    const result: string[] = [];
    if (stats.isNewUser) result.push("Chào bạn! Hãy bắt đầu từ môn đang học nhé.");
    const info = semesterInfoStatus(data.profile);
    if (info.missing.length > 0)
      result.push(
        `Bạn chưa nhập đủ thông tin học kỳ (${info.filled}/${info.total}) ở trang Dữ liệu.`,
      );
    if (stats.aheadOfSemester.length > 0 || semestersAhead(data).length > 0)
      result.push("Có môn hoặc lịch đặt học kỳ vượt quá học kỳ hiện tại, kiểm tra lại nhé!");
    if (exam) {
      const days = daysUntil(examDate(exam));
      const name = COURSE_BY_ID.get(exam.courseId)?.name ?? "môn sắp tới";
      result.push(days <= 0 ? `Hôm nay thi ${name}. Cố lên!` : `Còn ${days} ngày nữa thi ${name}.`);
    }
    if (stats.graduationReady) result.push("Đủ điều kiện tốt nghiệp rồi. Tuyệt vời!");
    else if (!stats.isNewUser)
      result.push(`Còn ${stats.missing} TC nữa là đủ ${TOTAL_CREDITS_REQUIRED}. Từng bước một!`);
    result.push("Rê chuột qua đầu mình để xoa đầu nha (điện thoại: nhấn giữ)!");
    result.push("Nhớ xuất file sao lưu sau mỗi học kỳ nha.");
    result.push("Đổi màu giao diện là mình đổi đồ theo đó!");
    result.push("Bấm đúp vào mình để xem mình nhảy nè ♪");
    if (!settings.sound.musicOn)
      result.push("Mở nút “Âm thanh” để bật nhạc nền 8-bit, mình nhún theo nhạc cho xem!");
    if (affection(settings.petCount).level >= 3)
      result.push("Psst… thử gõ chữ “studious” ở đâu đó xem sao.");
    return result;
  }, [data, settings.petCount, settings.sound.musicOn]);
}

/* ------------------------------------------------------------------ linh vật có tương tác */
export function Pet({ variant }: { variant: "side" | "float" }) {
  const { settings } = useAppState();
  const reaction = useReaction();
  const asleep = useAsleep();
  const grooving = useMusicPlaying() && !reaction && !asleep;
  const lines = useLines();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const clicks = useRef<number[]>([]);
  const rubbed = useRef(0);
  const lastPet = useRef(0);
  const press = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const love = affection(settings.petCount);
  const line = lines[index % lines.length];
  const text = reaction?.say ?? (asleep ? "Zzz… (bấm để đánh thức)" : line);
  const showBubble = variant === "side" || open || !!reaction?.say;

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(timer);
  }, [open, index]);

  const pet = () => {
    if (Date.now() - lastPet.current < 1200) return;
    lastPet.current = Date.now();
    setAsleep(false);
    actions.petMascot();
  };

  const onClick = () => {
    setOpen(true);
    if (asleep) {
      setAsleep(false);
      react({
        face: "surprised",
        motion: "hop",
        say: "Ơ! Mình đâu có ngủ đâu nha!",
        sound: "alert",
        touch: true,
      });
      return;
    }
    const now = Date.now();
    clicks.current = [...clicks.current.filter((time) => now - time < 2000), now];
    if (clicks.current.length >= 6) {
      clicks.current = [];
      react({
        face: "surprised",
        motion: "spin",
        effect: "sparkles",
        say: "Á á á, chóng mặt quááá! Nhẹ tay thôi mà~",
        ms: 3000,
        touch: true,
      });
      return;
    }
    const next = index + 1;
    setIndex(next);
    react({
      face: "happy",
      motion: "hop",
      say: lines[next % lines.length],
      ms: 2600,
      sound: "talk",
      touch: true,
    });
  };

  return (
    <div
      className={`pet pet-${variant}${showBubble ? " has-bubble" : ""}${grooving ? " is-grooving" : ""}`}
    >
      {showBubble && (
        <p className="bubble" aria-live="polite">
          {text}
        </p>
      )}
      <div className="pet-stage">
        <button
          className="mascot-btn"
          data-sfx="none"
          title="Bấm: nói chuyện · Bấm đúp: nhảy · Rê chuột / nhấn giữ: xoa đầu"
          aria-label="Linh vật StudioUS"
          onClick={onClick}
          onDoubleClick={() =>
            react({
              face: "happy",
              motion: "dance",
              effect: "notes",
              say: "La la la ♪ Học hành vui vẻ nào!",
              ms: 3200,
              touch: true,
            })
          }
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse") return;
            rubbed.current += Math.abs(event.movementX) + Math.abs(event.movementY);
            if (rubbed.current > 180) {
              rubbed.current = 0;
              pet();
            }
          }}
          onPointerLeave={() => {
            rubbed.current = 0;
            clearTimeout(press.current);
          }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") return;
            press.current = setTimeout(pet, 550);
          }}
          onPointerUp={() => clearTimeout(press.current)}
          onPointerCancel={() => clearTimeout(press.current)}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Mascot
            scale={variant === "side" ? 3 : 2}
            live
            face={!reaction && asleep ? "sleep" : undefined}
            motion={!reaction && asleep ? "sleep" : undefined}
          />
        </button>
        {reaction?.effect && <Fx key={reaction.id} effect={reaction.effect} />}
        {!reaction && asleep && <Fx effect="zzz" />}
        {grooving && (
          <span className="fx is-loop" aria-hidden="true">
            {[0, 1].map((index) => (
              <span
                key={index}
                className="fx-p fx-groove"
                style={{ "--d": `${index * 1.3}s` } as CSSProperties}
              >
                <Icon name="note" size={0.75} />
              </span>
            ))}
          </span>
        )}
      </div>
      {variant === "side" && (
        <div
          className="pet-love"
          title={`Đã xoa đầu ${settings.petCount} lần${love.next ? ` · cần ${love.next} lần để lên Lv.${love.level + 1}` : " · thân thiết tối đa"}`}
        >
          <Icon name="heart" size={1} />
          <span>Thân thiết Lv.{love.level}</span>
          <span className="pet-meter" aria-hidden="true">
            <i
              style={{
                width: `${love.next ? Math.min(100, ((settings.petCount - love.from) / (love.next - love.from)) * 100) : 100}%`,
              }}
            />
          </span>
        </div>
      )}
    </div>
  );
}

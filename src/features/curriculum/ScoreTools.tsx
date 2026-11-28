import { useState } from "react";
import { Modal, undoToast } from "../../components/ui";
import { recordOf } from "../../domain/progress";
import { convertScore, isPass } from "../../domain/rules";
import { actions, getState, useAppState } from "../../lib/store";
import { keepWords } from "../../lib/text";
import type { Course, CourseStatus } from "../../types";

/* ------------------------------------------------------------------ tính thử điểm */
interface Part {
  id: number;
  name: string;
  /** Trọng số trong phần (%). */
  weight: string;
  score: string;
}
interface Section {
  /** Trọng số của phần trong điểm học phần (%). */
  weight: string;
  parts: Part[];
}
export interface CalcState {
  theory: Section;
  lab: Section;
  bonus: string;
}

let nextId = 1;
const part = (name: string, weight: string): Part => ({ id: nextId++, name, weight, score: "" });
const freshState = (): CalcState => ({
  theory: {
    weight: "70",
    parts: [part("Quá trình", "20"), part("Giữa kỳ", "30"), part("Cuối kỳ", "50")],
  },
  lab: { weight: "30", parts: [part("Thực hành", "100")] },
  bonus: "",
});
/** Giữ số đã nhập khi đóng rồi mở lại trong cùng phiên (không lưu vào dữ liệu học tập). */
let saved: CalcState | null = null;

/** Số từ 0 đến `max`, chấp nhận dấu "," hoặc "."; rỗng hoặc sai trả null. */
function readNumber(text: string, max: number): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value <= max ? value : null;
}
/** Điểm cộng tối đa (người dùng chốt 28/11/2026). */
export const BONUS_MAX = 1;
const round1 = (value: number) => Math.round((value + 1e-9) * 10) / 10;
const show = (value: number) => String(Math.round(value * 100) / 100);

/** Điểm của một phần (Lý thuyết / Thực hành) = Σ(trọng số × điểm) / 100. */
export function sectionScore(section: { parts: { weight: string; score: string }[] }): {
  score: number | null;
  weightSum: number;
  badWeight: boolean;
  missing: number;
  badScore: boolean;
} {
  let weightSum = 0;
  let sum = 0;
  let missing = 0;
  let badWeight = false;
  let badScore = false;
  for (const item of section.parts) {
    const weight = readNumber(item.weight, 100);
    if (weight === null) badWeight = true;
    else weightSum += weight;
    if (item.score.trim() === "") {
      missing += 1;
      continue;
    }
    const score = readNumber(item.score, 10);
    if (score === null) badScore = true;
    else sum += (weight ?? 0) * score;
  }
  const ok = !badWeight && !badScore && missing === 0 && Math.abs(weightSum - 100) < 1e-9;
  return { score: ok ? sum / 100 : null, weightSum, badWeight, missing, badScore };
}

/**
 * Điểm học phần = Lý thuyết × trọng số LT + Thực hành × trọng số TH, cộng thẳng điểm cộng vào kết
 * quả, tối đa 10, làm tròn 1 chữ số thập phân (cách làm tròn điểm học phần như ô nhập điểm).
 */
export function computeCourseScore(state: CalcState): {
  raw: number | null;
  final: number | null;
  errors: string[];
} {
  const errors: string[] = [];
  const theoryWeight = readNumber(state.theory.weight, 100);
  const labWeight = readNumber(state.lab.weight, 100);
  if (theoryWeight === null || labWeight === null)
    errors.push("Trọng số Lý thuyết và Thực hành là số từ 0 đến 100.");
  else if (Math.abs(theoryWeight + labWeight - 100) > 1e-9)
    errors.push(`Lý thuyết + Thực hành phải bằng 100% (đang ${show(theoryWeight + labWeight)}%).`);
  let total = 0;
  for (const [label, section, weight] of [
    ["Lý thuyết", state.theory, theoryWeight],
    ["Thực hành", state.lab, labWeight],
  ] as const) {
    if (!weight) continue;
    const result = sectionScore(section);
    if (result.badWeight) errors.push(`${label}: trọng số là số từ 0 đến 100.`);
    else if (Math.abs(result.weightSum - 100) > 1e-9)
      errors.push(
        `${label}: tổng trọng số các thành phần phải bằng 100% (đang ${show(result.weightSum)}%).`,
      );
    if (result.badScore) errors.push(`${label}: điểm là số từ 0 đến 10.`);
    else if (result.missing > 0)
      errors.push(`${label}: còn ${result.missing} thành phần chưa nhập điểm.`);
    if (result.score !== null) total += (weight * result.score) / 100;
  }
  const bonus = state.bonus.trim() === "" ? 0 : readNumber(state.bonus, BONUS_MAX);
  if (bonus === null) errors.push(`Điểm cộng là số từ 0 đến ${BONUS_MAX}.`);
  if (errors.length > 0) return { raw: null, final: null, errors };
  const raw = total + (bonus ?? 0);
  return { raw, final: Math.min(10, round1(raw)), errors };
}

/**
 * Ô nhập số của công cụ tính thử: nhập ngoài khoảng (VD -5, 11) thì viền đỏ và báo lỗi ngay dưới ô,
 * giống ô điểm ở bảng học phần.
 */
function NumberInput(props: {
  value: string;
  max: number;
  label: string;
  placeholder: string;
  error: string;
  onChange: (value: string) => void;
}) {
  const bad = props.value.trim() !== "" && readNumber(props.value, props.max) === null;
  return (
    <span className="calc-cell">
      <input
        className={`input${bad ? " is-error" : ""}`}
        inputMode="decimal"
        aria-label={props.label}
        aria-invalid={bad}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      {bad && <span className="field-error">{props.error}</span>}
    </span>
  );
}

function SectionEditor(props: {
  label: string;
  section: Section;
  onChange: (section: Section) => void;
}) {
  const { section, onChange } = props;
  const weight = readNumber(section.weight, 100);
  const result = sectionScore(section);
  const setPart = (id: number, patch: Partial<Part>) =>
    onChange({
      ...section,
      parts: section.parts.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  if (weight === 0)
    return (
      <div className="calc-section is-off">
        <b>{props.label}</b>
        <span className="dim"> · trọng số 0%, không tính.</span>
      </div>
    );
  return (
    <div className="calc-section" role="group" aria-label={props.label}>
      <div className="calc-title">{props.label}</div>
      <div className="calc-row calc-head" aria-hidden="true">
        <span>Thành phần</span>
        <span>Trọng số (%)</span>
        <span>Điểm (0–10)</span>
        <span />
      </div>
      {section.parts.map((item) => (
        <div className="calc-row" key={item.id}>
          <input
            className="input"
            aria-label={`${props.label}: tên thành phần`}
            value={item.name}
            onChange={(event) => setPart(item.id, { name: event.target.value })}
          />
          <NumberInput
            label={`${props.label} – ${item.name}: trọng số (%)`}
            placeholder="%"
            max={100}
            error="Trọng số 0–100"
            value={item.weight}
            onChange={(weight) => setPart(item.id, { weight })}
          />
          <NumberInput
            label={`${props.label} – ${item.name}: điểm`}
            placeholder="0–10"
            max={10}
            error="Điểm 0–10"
            value={item.score}
            onChange={(score) => setPart(item.id, { score })}
          />
          <button
            className="btn btn-sm calc-remove"
            aria-label={`Xóa thành phần ${item.name}`}
            title="Xóa thành phần"
            disabled={section.parts.length === 1}
            onClick={() =>
              onChange({ ...section, parts: section.parts.filter((other) => other.id !== item.id) })
            }
          >
            ✕
          </button>
        </div>
      ))}
      <div className="calc-foot">
        <button
          className="btn btn-sm"
          onClick={() =>
            onChange({ ...section, parts: [...section.parts, part("Thành phần", "")] })
          }
        >
          + Thêm thành phần
        </button>
        <span className={Math.abs(result.weightSum - 100) < 1e-9 ? "dim" : "calc-bad"}>
          Tổng trọng số: {show(result.weightSum)}%
        </span>
        <span>
          Điểm {props.label.toLowerCase()}:{" "}
          <b>{result.score === null ? "—" : show(result.score)}</b>
        </span>
      </div>
    </div>
  );
}

export function ScoreCalculator({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<CalcState>(() => saved ?? freshState());
  const update = (next: CalcState) => {
    saved = next;
    setState(next);
  };
  const result = computeCourseScore(state);
  const converted = result.final === null ? null : convertScore(result.final);
  const passed = result.final !== null && isPass(result.final);

  return (
    <Modal
      title="Công cụ tính điểm học phần"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={() => update(freshState())}>
            Nhập lại
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        </>
      }
    >
      <p className="dim">
        Nhập trọng số theo đề cương môn học. Đây chỉ là công cụ tính thử, không ghi điểm vào học
        phần nào.
      </p>
      <div className="calc-weights">
        <div className="field">
          <span className="field-label">Lý thuyết (%)</span>
          <NumberInput
            label="Trọng số Lý thuyết (%)"
            placeholder="%"
            max={100}
            error="Trọng số 0–100"
            value={state.theory.weight}
            onChange={(weight) => update({ ...state, theory: { ...state.theory, weight } })}
          />
        </div>
        <div className="field">
          <span className="field-label">Thực hành (%)</span>
          <NumberInput
            label="Trọng số Thực hành (%)"
            placeholder="%"
            max={100}
            error="Trọng số 0–100"
            value={state.lab.weight}
            onChange={(weight) => update({ ...state, lab: { ...state.lab, weight } })}
          />
        </div>
      </div>
      <SectionEditor
        label="Lý thuyết"
        section={state.theory}
        onChange={(theory) => update({ ...state, theory })}
      />
      <SectionEditor
        label="Thực hành"
        section={state.lab}
        onChange={(lab) => update({ ...state, lab })}
      />
      <div className="field calc-bonus">
        <span className="field-label">Điểm cộng (0–{BONUS_MAX})</span>
        <NumberInput
          label="Điểm cộng"
          placeholder="0"
          max={BONUS_MAX}
          error={`Điểm cộng 0–${BONUS_MAX}`}
          value={state.bonus}
          onChange={(bonus) => update({ ...state, bonus })}
        />
        <span className="field-hint">
          Cộng thẳng vào kết quả sau khi đã tính Lý thuyết và Thực hành; điểm học phần tối đa 10.
        </span>
      </div>

      <div className="calc-result" aria-live="polite">
        {result.final === null ? (
          <ul className="calc-errors">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <>
            <div>
              <span className="field-label">Điểm học phần</span>
              <b className="calc-score num">{result.final.toFixed(1)}</b>
              {result.raw !== null && round1(result.raw) !== result.raw && result.raw <= 10 && (
                <small className="dim"> (chưa làm tròn: {show(result.raw)})</small>
              )}
              {result.raw !== null && result.raw > 10 && (
                <small className="dim"> (đã giới hạn ở 10)</small>
              )}
            </div>
            <div>
              <span className="field-label">Hệ 4</span>
              <b className="calc-score num">{converted!.point4.toFixed(1)}</b>
            </div>
            <span className={`badge ${passed ? "good" : "bad"}`}>
              {passed ? "ĐẠT" : "CHƯA ĐẠT"}
            </span>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ lịch sử học lại */
const STATUS_TEXT: Record<CourseStatus, string> = {
  todo: "Chưa học",
  doing: "Đang học",
  retake: "Đang học lại",
  done: "Chưa có điểm",
};

function ResultCells({ score }: { score: number | null }) {
  if (score === null) return null;
  return (
    <>
      <span className="h-p4">Hệ 4: {convertScore(score).point4.toFixed(1)}</span>
      <span className={`badge ${isPass(score) ? "good" : "bad"}`}>
        {isPass(score) ? "ĐẠT" : "CHƯA ĐẠT"}
      </span>
    </>
  );
}

export function RetakeHistory({ course, onClose }: { course: Course; onClose: () => void }) {
  const { data } = useAppState();
  const record = recordOf(data, course.id);
  const attempts = record.attempts ?? [];
  const currentScore = record.status === "done" ? record.score : null;

  const remove = (index: number) => {
    const before = getState().data;
    const item = attempts[index];
    actions.removeAttempt(course.id, index);
    undoToast(
      `Đã xóa lần ${index + 1} (HK${item.semester ?? "?"}${item.score !== null ? ` · ${item.score}` : ""}) khỏi lịch sử.`,
      () => actions.restore(before, { records: [course.id] }),
    );
  };

  return (
    <Modal
      title="Lịch sử học lại"
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={onClose}>
          Đóng
        </button>
      }
    >
      <p>
        <b>{course.id}</b> · {keepWords(course.name)} · {course.credits} TC
      </p>
      <ol className="history">
        {attempts.map((item, index) => (
          <li key={index} className="history-row">
            <span className="h-turn">Lần {index + 1}</span>
            <span>HK{item.semester ?? "?"}</span>
            <span className="h-score num">{item.score === null ? "—" : item.score.toFixed(1)}</span>
            <ResultCells score={item.score} />
            <button
              className="btn btn-sm h-remove"
              title="Xóa lần học này (nếu nhập nhầm)"
              aria-label={`Xóa lần ${index + 1}`}
              onClick={() => remove(index)}
            >
              ✕
            </button>
          </li>
        ))}
        <li className="history-row is-current">
          <span className="h-turn">Lần {attempts.length + 1}</span>
          <span>HK{record.semester ?? "?"}</span>
          {currentScore !== null ? (
            <>
              <span className="h-score num">{currentScore.toFixed(1)}</span>
              <ResultCells score={currentScore} />
            </>
          ) : (
            <span className="badge accent">{STATUS_TEXT[record.status]}</span>
          )}
          <span className="badge">Hiện tại</span>
        </li>
      </ol>
      <p className="field-hint">
        Lần hiện tại (lần gần nhất) được tính vào TC tích lũy và GPA tổng; các lần trước được giữ để
        xem lại và tính GPA của học kỳ đã học. Muốn học thêm lần nữa: khi lần hiện tại đã có điểm,
        chọn lại trạng thái “Học lại”.
      </p>
    </Modal>
  );
}

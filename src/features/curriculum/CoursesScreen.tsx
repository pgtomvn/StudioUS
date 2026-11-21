import { useEffect, useMemo, useState } from "react";
import { navigate, takeFocus } from "../../app/nav";
import { Bar, Hud, Icon, Mascot, Modal, Panel, undoToast } from "../../components/ui";
import {
  BLOCKS,
  CONDITION_COURSES,
  COURSE_BY_ID,
  GRADUATION_OPTIONS,
  GROUPS,
  PE_GROUP,
} from "../../data/curriculum";
import {
  activeGroups,
  computeStats,
  fold,
  peCourses,
  peState,
  recordOf,
  type GroupProgress,
} from "../../domain/progress";
import {
  LANGUAGE_CERTS,
  MAX_SEMESTER,
  TOTAL_CREDITS_REQUIRED,
  convertScore,
  isPass,
  languageResult,
  parseScore,
} from "../../domain/rules";
import { actions, getState, useAppState } from "../../lib/store";
import { keepWords } from "../../lib/text";
import type {
  AppData,
  BlockId,
  ConditionState,
  Course,
  CourseGroup,
  CourseStatus,
  GradOptionId,
} from "../../types";

const STATUS_LABEL: Record<CourseStatus, string> = {
  todo: "Chưa học",
  doing: "Đang học",
  done: "Đã hoàn thành",
};
const SEMESTERS = Array.from({ length: MAX_SEMESTER }, (_, index) => index + 1);

interface Filters {
  query: string;
  semester: string;
  block: string;
  status: string;
  kind: string;
}
const NO_FILTERS: Filters = { query: "", semester: "", block: "", status: "", kind: "" };

const isChosen = (data: AppData, group: CourseGroup, id: string) =>
  group.mode === "required" || (data.selections[group.id] ?? []).includes(id);

/** Nhóm tự chọn khác đã tick học phần này (VD học phần tốt nghiệp trùng danh sách tự chọn tự do). */
function takenElsewhere(data: AppData, group: CourseGroup, id: string): CourseGroup | undefined {
  return GROUPS.find(
    (other) =>
      other.id !== group.id &&
      other.mode === "elective" &&
      (data.selections[other.id] ?? []).includes(id),
  );
}

function hasData(data: AppData, id: string) {
  const record = data.records[id];
  return (
    !!record && (record.semester !== null || record.status !== "todo" || record.score !== null)
  );
}

/* ------------------------------------------------------------------ một dòng học phần */
function ScoreInput(props: { courseId: string; score: number | null; disabled: boolean }) {
  const { courseId, score, disabled } = props;
  const [text, setText] = useState(score === null ? "" : String(score));
  const [error, setError] = useState(false);
  useEffect(() => {
    setText(score === null ? "" : String(score));
    setError(false);
  }, [score, disabled]);

  const commit = () => {
    if (text.trim() === "") {
      setError(false);
      if (score !== null) actions.setRecord(courseId, { score: null });
      return;
    }
    const value = parseScore(text);
    if (value === null) return setError(true);
    setError(false);
    if (value !== score) actions.setRecord(courseId, { score: value });
  };

  return (
    <span className="c-score">
      <input
        className={`input${error ? " is-error" : ""}`}
        inputMode="decimal"
        placeholder={disabled ? "—" : "0–10"}
        aria-label="Điểm hệ 10"
        aria-invalid={error}
        disabled={disabled}
        title={disabled ? "Chọn trạng thái “Đã hoàn thành” để nhập điểm" : undefined}
        value={disabled ? "" : text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      />
      {error && <span className="field-error">Điểm phải từ 0 đến 10</span>}
    </span>
  );
}

function CourseRow(props: { course: Course; group: CourseGroup; data: AppData; focus: boolean }) {
  const { course, group, data } = props;
  const record = recordOf(data, course.id);
  const chosen = isChosen(data, group, course.id);
  const other = chosen ? undefined : takenElsewhere(data, group, course.id);
  const hasScore = record.status === "done" && record.score !== null;
  const converted = hasScore ? convertScore(record.score!) : null;
  const passed = hasScore && isPass(record.score);
  const current = data.profile.currentSemester;
  const ahead = chosen && record.semester !== null && record.semester > current;

  // Thao tác làm mất kết quả đã nhập: làm ngay, cho hoàn tác trong 10 giây (không hỏi xác nhận).
  const undoRecord = (text: string) => {
    const before = getState().data;
    return () => undoToast(text, () => actions.restore(before, { records: [course.id] }));
  };
  const changeSemester = (value: string) => {
    if (!value && (record.status !== "todo" || record.score !== null)) {
      const notify = undoRecord(
        `Đã bỏ học kỳ của ${course.name}${hasScore ? ` và xóa điểm ${record.score}` : ""}.`,
      );
      actions.setRecord(course.id, { semester: null });
      return notify();
    }
    actions.setRecord(course.id, { semester: value ? Number(value) : null });
  };
  const changeStatus = (status: CourseStatus) => {
    if (hasScore && status !== "done") {
      const notify = undoRecord(`Đã xóa điểm ${record.score} của ${course.name}.`);
      actions.setRecord(course.id, { status, score: null });
      return notify();
    }
    actions.setRecord(course.id, { status });
  };
  const toggle = (checked: boolean) => {
    if (!checked && hasData(data, course.id)) return untickWithUndo(group, course);
    actions.toggleSelection(group.id, course.id, checked);
  };

  const classes = ["course-row"];
  if (hasScore && !passed) classes.push("is-failed");
  if (ahead) classes.push("is-warn");
  if (!chosen) classes.push("is-unchosen");
  if (props.focus) classes.push("is-focus");

  return (
    <div className={classes.join(" ")} id={`course-${course.id}`}>
      <span className="c-tick">
        {group.mode === "required" ? (
          <span className="tick is-locked" title="Học phần bắt buộc" aria-label="Bắt buộc">
            ✓
          </span>
        ) : (
          <label
            className="tick-label"
            title={other ? `Đã chọn ở: ${other.title}` : "Chọn học phần này"}
          >
            <input
              type="checkbox"
              className="tick-input"
              checked={chosen}
              disabled={!!other}
              aria-label={`Chọn ${course.name}`}
              onChange={(event) => toggle(event.target.checked)}
            />
            <span className="tick" aria-hidden="true">
              {chosen ? "✓" : ""}
            </span>
          </label>
        )}
      </span>
      <span className="c-code">{course.id}</span>
      <span className="c-name">
        {keepWords(course.name)}
        {(course.note || course.origin || other) && (
          <small className="c-plan">
            {[course.note, course.origin, other && `đã chọn ở “${other.title}”`]
              .filter(Boolean)
              .join(" · ")}
          </small>
        )}
      </span>
      <span className="c-tc c-center">
        {course.credits}
        <span className="c-label"> TC</span>
      </span>
      <span className="c-kind c-center">
        <span className="badge">{course.kind}</span>
      </span>
      <select
        className={`select c-sem${ahead ? " is-error" : ""}`}
        aria-label="Học kỳ"
        disabled={!chosen}
        title={chosen ? "Bước 1: chọn học kỳ" : "Tick chọn học phần trước"}
        value={record.semester ?? ""}
        onChange={(event) => changeSemester(event.target.value)}
      >
        <option value="">Chọn HK</option>
        {SEMESTERS.map((semester) => (
          <option key={semester} value={semester}>
            HK{semester}
          </option>
        ))}
      </select>
      <select
        className="select c-status"
        aria-label="Trạng thái"
        disabled={!chosen || record.semester === null}
        title={record.semester === null ? "Chọn học kỳ trước" : "Bước 2: chọn trạng thái"}
        value={record.status}
        onChange={(event) => changeStatus(event.target.value as CourseStatus)}
      >
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ScoreInput
        courseId={course.id}
        score={record.score}
        disabled={!chosen || record.status !== "done"}
      />
      <span className="c-letter c-center">{converted?.letter ?? ""}</span>
      <span className="c-p4 c-center">{converted ? converted.point4.toFixed(1) : ""}</span>
      <span className="c-result">
        {converted && (
          <span className="c-label">
            {converted.letter} · {converted.point4.toFixed(1)}
          </span>
        )}
        {hasScore && (
          <span className={`badge ${passed ? "good" : "bad"}`}>{passed ? "ĐẠT" : "CHƯA ĐẠT"}</span>
        )}
      </span>
      {ahead && (
        <div className="c-warn" role="alert">
          <Icon name="warning" size={1} />
          <span>
            Học kỳ bạn chọn (HK{record.semester}) đang vượt quá học kỳ hiện tại của bạn (HK{current}
            ). Vui lòng cập nhật học kỳ hiện tại.
          </span>
          <button className="btn btn-sm" onClick={() => navigate("data", "semester")}>
            Cập nhật
          </button>
        </div>
      )}
    </div>
  );
}

/** Bỏ tick học phần tự chọn đã có kết quả: xóa ngay, cho hoàn tác (tick lại và trả kết quả). */
function untickWithUndo(group: CourseGroup, course: Course) {
  const before = getState().data;
  actions.toggleSelection(group.id, course.id, false);
  undoToast(`Đã bỏ chọn ${course.name} (xóa học kỳ, trạng thái, điểm).`, () =>
    actions.restore(before, {
      records: [course.id],
      select: { groupId: group.id, courseId: course.id },
    }),
  );
}

function CourseHead() {
  return (
    <div className="course-head">
      <span className="c-center">Chọn</span>
      <span>Mã học phần</span>
      <span>Tên học phần</span>
      <span className="c-center">TC</span>
      <span className="c-center">Loại</span>
      <span>Học kỳ</span>
      <span>Trạng thái</span>
      <span>Điểm (hệ 10)</span>
      <span className="c-center">Chữ</span>
      <span className="c-center">Hệ 4</span>
      <span>Kết quả</span>
    </div>
  );
}

/* ------------------------------------------------------------------ chọn tự chọn tự do */
function ElectivePicker({ group, onClose }: { group: CourseGroup; onClose: () => void }) {
  const { data } = useAppState();
  const [query, setQuery] = useState("");
  const picked = data.selections[group.id] ?? [];
  const pickedCredits = picked.reduce((sum, id) => sum + (COURSE_BY_ID.get(id)?.credits ?? 0), 0);
  const list = group.courseIds
    .map((id) => COURSE_BY_ID.get(id)!)
    .filter((course) => {
      const needle = fold(query.trim());
      return (
        !needle ||
        fold(course.id).includes(needle) ||
        fold(course.name).includes(needle) ||
        fold(course.origin ?? "").includes(needle)
      );
    });

  return (
    <Modal
      title="Chọn học phần tự chọn tự do"
      onClose={onClose}
      wide
      full
      footer={
        <>
          <span className="dim" style={{ marginRight: "auto" }}>
            Đã chọn {picked.length} học phần · {pickedCredits} TC
          </span>
          <button className="btn btn-primary" onClick={onClose}>
            Xong
          </button>
        </>
      }
    >
      <p className="dim">
        Danh sách theo Phụ lục 1 của CTĐT (không lặp lại các học phần của mục 1 và mục 2 vì đã có ô
        tick riêng ở trên). Chọn thêm cho đủ 34 TC của khối ngành / chuyên ngành.
      </p>
      <input
        className="input"
        type="search"
        autoFocus
        placeholder="Tìm theo mã, tên hoặc nguồn (VD: HTTT, TTNT) …"
        aria-label="Tìm học phần tự chọn tự do"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="pick-list">
        {list.map((course) => {
          const chosen = picked.includes(course.id);
          const other = chosen ? undefined : takenElsewhere(data, group, course.id);
          return (
            <li key={course.id}>
              <label className={`pick-item${chosen ? " is-on" : ""}${other ? " is-off" : ""}`}>
                <input
                  type="checkbox"
                  className="tick-input"
                  checked={chosen}
                  disabled={!!other}
                  onChange={(event) => {
                    if (!event.target.checked && hasData(data, course.id))
                      untickWithUndo(group, course);
                    else actions.toggleSelection(group.id, course.id, event.target.checked);
                  }}
                />
                <span className="tick" aria-hidden="true">
                  {chosen ? "✓" : ""}
                </span>
                <span className="pick-code">{course.id}</span>
                <span className="pick-name">
                  {keepWords(course.name)}
                  {other && <small className="dim"> · đã chọn ở “{other.title}”</small>}
                </span>
                <span className="badge">{course.origin}</span>
                <span className="pick-tc">{course.credits} TC</span>
              </label>
            </li>
          );
        })}
        {list.length === 0 && <li className="dim">Không tìm thấy học phần nào.</li>}
      </ul>
    </Modal>
  );
}

/* ------------------------------------------------------------------ một nhóm học phần */
function GroupSection(props: {
  group: CourseGroup;
  /** Số thứ tự của nhóm trong khối (1, 2, 3…). */
  number: number;
  progress: GroupProgress | undefined;
  courses: Course[];
  data: AppData;
  focus: string | null;
  filtering: boolean;
}) {
  const { group, progress, courses, data } = props;
  const [picking, setPicking] = useState(false);
  const short = progress && group.mode === "elective" ? progress.selectShortfall : 0;
  return (
    <div className={`group${props.focus === group.id ? " is-focus" : ""}`} id={`group-${group.id}`}>
      <div className="group-head">
        <span className="group-sec" title={`Mục ${group.section} của CTĐT`}>
          {props.number}
        </span>
        <h3 className="group-title">{keepWords(group.title)}</h3>
        <span className="badge">{group.rule}</span>
        {group.mode === "elective" && progress && (
          <span className={`badge ${short > 0 ? "warn" : "good"}`}>
            Đã chọn {progress.selected} TC{short > 0 ? ` · chọn thêm ${short} TC` : " · đủ"}
          </span>
        )}
        {progress && (
          <span className="badge">
            Đạt {progress.earned}/{group.credits} TC
          </span>
        )}
        <span className="spacer" />
        {group.picker && (
          <button className="btn btn-sm btn-primary" onClick={() => setPicking(true)}>
            + Chọn học phần
          </button>
        )}
      </div>
      {courses.length > 0 ? (
        <>
          <CourseHead />
          {courses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              group={group}
              data={data}
              focus={props.focus === course.id}
            />
          ))}
        </>
      ) : (
        <p className="dim group-empty">
          {props.filtering
            ? "Không có học phần phù hợp bộ lọc."
            : "Chưa chọn học phần nào. Bấm “+ Chọn học phần” để tick các môn tự chọn tự do."}
        </p>
      )}
      {picking && <ElectivePicker group={group} onClose={() => setPicking(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ khối Tốt nghiệp */
function GraduationChooser({ data }: { data: AppData }) {
  const [choosing, setChoosing] = useState(false);
  const chosen = GRADUATION_OPTIONS.find((option) => option.id === data.gradOption);
  const hasResults = GROUPS.some(
    (group) =>
      group.gradOption === data.gradOption &&
      (group.mode === "required" ? group.courseIds : (data.selections[group.id] ?? [])).some((id) =>
        hasData(data, id),
      ),
  );

  const pick = (id: GradOptionId) => {
    if (id === data.gradOption) return setChoosing(false);
    const before = getState().data;
    const oldGroups = GROUPS.filter(
      (group) => group.gradOption && group.gradOption === data.gradOption,
    );
    actions.setGradOption(id);
    setChoosing(false);
    if (hasResults)
      undoToast(
        `Đã đổi phương án tốt nghiệp; kết quả của “${chosen?.name ?? "phương án cũ"}” đã xóa.`,
        () =>
          actions.restore(before, {
            gradOption: true,
            records: oldGroups.flatMap((group) => group.courseIds),
            selections: oldGroups.map((group) => group.id),
          }),
      );
  };

  if (chosen && !choosing)
    return (
      <div className="grad-chosen">
        <span className="badge accent">Phương án đã chọn</span>
        <span>
          {chosen.name} · {chosen.summary}
        </span>
        <button className="btn btn-sm" onClick={() => setChoosing(true)}>
          Đổi phương án
        </button>
      </div>
    );

  return (
    <>
      {!chosen && (
        <p style={{ padding: "0 4px 8px" }}>
          <span className="badge warn">Chưa chọn phương án</span> Chọn 01 trong 03 phương án (tối
          thiểu 10 TC) để nhập kết quả.
        </p>
      )}
      <div className={`grad-options${chosen ? "" : " is-unset"}`}>
        {GRADUATION_OPTIONS.map((option, index) => (
          <button
            key={option.id}
            className="grad-card"
            onClick={() => pick(option.id)}
            aria-pressed={option.id === data.gradOption}
          >
            <span className="dim">Phương án {index + 1}</span>
            <span className="display" style={{ fontSize: "1.2rem" }}>
              {option.name}
            </span>
            <span className="dim">{option.summary}</span>
            <span className="badge">10 TC</span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ điều kiện phụ */
const CONDITION_LABEL: Record<ConditionState, string> = {
  none: "Chưa",
  pass: "Đạt",
  exempt: "Miễn",
};

/** Chưa / Đạt / Miễn. Không có `onChange` thì chỉ hiển thị (giá trị được suy ra). */
function ConditionSeg(props: {
  label: string;
  hint: string[];
  value: ConditionState;
  onChange?: (value: ConditionState) => void;
}) {
  const { onChange } = props;
  return (
    <div>
      <div className="field-label">{props.label}</div>
      <div className={`seg${onChange ? "" : " is-readonly"}`} role="group" aria-label={props.label}>
        {(Object.keys(CONDITION_LABEL) as ConditionState[]).map((id) =>
          onChange ? (
            <button
              key={id}
              className={`btn${props.value === id ? " is-on" : ""}`}
              aria-pressed={props.value === id}
              onClick={() => onChange(id)}
            >
              {CONDITION_LABEL[id]}
            </button>
          ) : (
            <span
              key={id}
              className={`btn${props.value === id ? " is-on" : ""}`}
              aria-current={props.value === id ? "true" : undefined}
            >
              {CONDITION_LABEL[id]}
            </span>
          ),
        )}
      </div>
      {props.hint.map((line) => (
        <div key={line} className="field-hint">
          {line}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ mục Giáo dục thể chất */
function PeSection(props: {
  data: AppData;
  open: boolean;
  onToggle: () => void;
  /** Dòng Thể dục còn hiện sau bộ lọc. */
  courses: Course[];
  focus: string | null;
}) {
  const { data } = props;
  const pe = peState(data);
  const exempt = data.conditions.pe === "exempt";
  const earned = exempt
    ? PE_GROUP.credits
    : peCourses()
        .filter((course) => {
          const record = recordOf(data, course.id);
          return record.status === "done" && isPass(record.score);
        })
        .reduce((sum, course) => sum + course.credits, 0);
  return (
    <section className={`block${props.open ? " is-open" : ""}`} id="pe-section">
      <button className="block-head" aria-expanded={props.open} onClick={props.onToggle}>
        <span className="caret" aria-hidden="true" />
        <span className="display">Giáo dục thể chất</span>
        <span className="badge">{exempt ? "Miễn" : `${earned} / ${PE_GROUP.credits} TC`}</span>
        <Bar value={earned} max={PE_GROUP.credits} small label="Tiến độ khối Giáo dục thể chất" />
      </button>
      {props.open && (
        <div className="block-body">
          <div className="pe-info">
            <span className="badge">
              {PE_GROUP.rule} · không tính vào {TOTAL_CREDITS_REQUIRED} TC và GPA
            </span>
            <span className={`badge ${pe.state === "none" ? "warn" : "good"}`}>
              Thể chất: {CONDITION_LABEL[pe.state]}
            </span>
          </div>
          <div className="seg pe-seg" role="group" aria-label="Hoàn thành Giáo dục thể chất bằng">
            <button
              className={`btn${exempt ? "" : " is-on"}`}
              aria-pressed={!exempt}
              onClick={() => actions.setConditions({ pe: "none" })}
            >
              Học Thể dục 1, 2
            </button>
            <button
              className={`btn${exempt ? " is-on" : ""}`}
              aria-pressed={exempt}
              onClick={() => actions.setConditions({ pe: "exempt" })}
            >
              Miễn
            </button>
          </div>
          <div className={`group pe-rows${exempt ? " is-exempt" : ""}`} inert={exempt}>
            <CourseHead />
            {props.courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                group={PE_GROUP}
                data={data}
                focus={props.focus === course.id}
              />
            ))}
          </div>
          <p className="field-hint pe-note">
            {exempt
              ? "Đã chọn Miễn: điều kiện Thể chất ở mục Điều kiện phụ là Miễn, không cần nhập Thể dục 1, 2."
              : `Đạt cả Thể dục 1 và Thể dục 2 (Đã hoàn thành, điểm từ 5.0) thì điều kiện Thể chất chuyển Đạt. Hiện đã đạt ${pe.passed}/${pe.total} môn${pe.doing > 0 ? `, đang học ${pe.doing} môn` : ""}.`}
          </p>
        </div>
      )}
    </section>
  );
}

function NumberCommit(props: {
  value: number | null;
  max: number;
  label: string;
  onCommit: (value: number | null) => void;
}) {
  return (
    <input
      key={String(props.value)}
      className="input"
      inputMode="decimal"
      aria-label={props.label}
      placeholder={props.label}
      defaultValue={props.value ?? ""}
      onBlur={(event) => {
        const text = event.target.value.trim().replace(",", ".");
        const value = Number(text);
        const valid = text !== "" && Number.isFinite(value) && value >= 0 && value <= props.max;
        props.onCommit(valid ? value : null);
        if (!valid) event.target.value = "";
      }}
    />
  );
}

function ConditionsPanel({ data }: { data: AppData }) {
  const { conditions } = data;
  const language = languageResult(conditions.langType, conditions.langScore, conditions.langScore2);
  const cert = language.cert;
  return (
    <Panel
      title="Điều kiện phụ & Ngoại ngữ"
      actions={<span className="badge">Không tính vào {TOTAL_CREDITS_REQUIRED} TC và GPA</span>}
    >
      <div className="cond-grid">
        <ConditionSeg
          label="Giáo dục thể chất (4 TC)"
          hint={[
            "Tự cập nhật theo mục Giáo dục thể chất ở trên: đạt Thể dục 1 và 2 → Đạt; chọn Miễn → Miễn; đang học hoặc chưa học → Chưa.",
          ]}
          value={peState(data).state}
        />
        <ConditionSeg
          label="GDQP – AN (4 TC)"
          hint={CONDITION_COURSES.defense}
          value={conditions.defense}
          onChange={(defense) => actions.setConditions({ defense })}
        />
        <div>
          <div className="field-label">Chứng chỉ ngoại ngữ đầu ra</div>
          <div className={`lang-row${cert?.min2 !== undefined ? " has-two" : ""}`}>
            <select
              className="select"
              aria-label="Loại chứng chỉ"
              value={conditions.langType}
              onChange={(event) =>
                actions.setConditions({
                  langType: event.target.value,
                  langScore: null,
                  langScore2: null,
                })
              }
            >
              {LANGUAGE_CERTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <NumberCommit
              value={conditions.langScore}
              max={cert?.max ?? 0}
              label={cert?.label ?? "Điểm"}
              onCommit={(langScore) => actions.setConditions({ langScore })}
            />
            {cert?.min2 !== undefined && (
              <NumberCommit
                value={conditions.langScore2}
                max={cert.max2 ?? 0}
                label={cert.label2 ?? "Điểm 2"}
                onCommit={(langScore2) => actions.setConditions({ langScore2 })}
              />
            )}
            {language.state === "pass" && <span className="badge good">ĐẠT CHUẨN</span>}
            {language.state === "fail" && (
              <span className="badge bad">CHƯA ĐẠT (TỐI THIỂU {cert?.display})</span>
            )}
            {language.state === "empty" && <span className="badge">CHƯA NHẬP</span>}
          </div>
          <div className="field-hint">Tối thiểu: {cert?.display}</div>
          {CONDITION_COURSES.english.map((line) => (
            <div key={line} className="field-hint">
              {line}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ màn hình */
function FilterSelects({
  filters,
  set,
}: {
  filters: Filters;
  set: (patch: Partial<Filters>) => void;
}) {
  return (
    <>
      <select
        className="select filter-select"
        aria-label="Học kỳ"
        value={filters.semester}
        onChange={(event) => set({ semester: event.target.value })}
      >
        <option value="">Học kỳ: Tất cả</option>
        {SEMESTERS.map((semester) => (
          <option key={semester} value={semester}>
            HK{semester}
          </option>
        ))}
      </select>
      <select
        className="select filter-select"
        aria-label="Khối kiến thức"
        value={filters.block}
        onChange={(event) => set({ block: event.target.value })}
      >
        <option value="">Khối kiến thức</option>
        {BLOCKS.map((block) => (
          <option key={block.id} value={block.id}>
            {block.name}
          </option>
        ))}
      </select>
      <select
        className="select filter-select"
        aria-label="Trạng thái"
        value={filters.status}
        onChange={(event) => set({ status: event.target.value })}
      >
        <option value="">Trạng thái</option>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        className="select filter-select"
        aria-label="Loại học phần"
        value={filters.kind}
        onChange={(event) => set({ kind: event.target.value })}
      >
        <option value="">Loại</option>
        <option value="BB">BB – Bắt buộc</option>
        <option value="TC">TC – Tự chọn</option>
      </select>
    </>
  );
}

export function CoursesScreen() {
  const { data } = useAppState();
  const stats = computeStats(data);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [focus] = useState(() => takeFocus());
  const [filterSheet, setFilterSheet] = useState(false);
  const focusBlock = useMemo(() => {
    if (!focus) return null;
    if (BLOCKS.some((block) => block.id === focus)) return focus as BlockId;
    const group = GROUPS.find((item) => item.id === focus || item.courseIds.includes(focus));
    return group?.block ?? null;
  }, [focus]);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {};
    for (const block of BLOCKS)
      result[block.id] =
        focusBlock === block.id ||
        activeGroups(data).some(
          (group) =>
            group.block === block.id &&
            group.courseIds.some((id) => recordOf(data, id).status === "doing"),
        );
    if (!Object.values(result).some(Boolean)) result.general = true;
    result.pe =
      (focus !== null && PE_GROUP.courseIds.includes(focus)) ||
      PE_GROUP.courseIds.some((id) => recordOf(data, id).status === "doing");
    return result;
  });
  const set = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }));
  const filtering = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);
  const narrowing = filters.semester !== "" || filters.status !== "";

  useEffect(() => {
    if (!focus) return;
    const target =
      document.getElementById(`course-${focus}`) ??
      document.getElementById(`group-${focus}`) ??
      document.getElementById(`block-${focus}`);
    target?.scrollIntoView({ block: "center" });
  }, [focus]);

  /** Học phần hiển thị của từng nhóm (nhóm chọn qua hộp tìm kiếm chỉ hiện môn đã chọn). */
  const rowsOf = (group: CourseGroup, applyFilters: boolean): Course[] => {
    const query = fold(filters.query.trim());
    return group.courseIds
      .filter((id) => !group.picker || isChosen(data, group, id))
      .map((id) => COURSE_BY_ID.get(id)!)
      .filter((course) => {
        if (!applyFilters) return true;
        const record = recordOf(data, course.id);
        const chosen = isChosen(data, group, course.id);
        if (query && !fold(course.id).includes(query) && !fold(course.name).includes(query))
          return false;
        if (narrowing && !chosen) return false;
        if (filters.semester && String(record.semester ?? "") !== filters.semester) return false;
        if (filters.status && record.status !== filters.status) return false;
        if (filters.kind && course.kind !== filters.kind) return false;
        return true;
      });
  };
  const shownGroups = activeGroups(data);
  // Khối Thể chất ẩn khi đang lọc theo một khối CTĐT cụ thể.
  const peRows = filters.block ? [] : rowsOf(PE_GROUP, true);
  const total =
    shownGroups.reduce((sum, group) => sum + rowsOf(group, false).length, 0) +
    PE_GROUP.courseIds.length;
  const visible =
    shownGroups.reduce((sum, group) => sum + rowsOf(group, true).length, 0) + peRows.length;
  const current = data.profile.currentSemester;

  return (
    <>
      <Hud />
      <h1 className="screen-title display">Học phần</h1>

      <div className="stat-trio">
        {[
          ["Đã đạt", stats.earned],
          ["Đang học", stats.doing],
          ["Còn thiếu", stats.missing],
        ].map(([label, value]) => (
          <div className="panel trio" key={label}>
            <span className="display">{label}</span>
            <span className="trio-num display">{value}</span>
          </div>
        ))}
      </div>

      {stats.aheadOfSemester.length > 0 && (
        <div className="panel alert-bar" role="alert">
          <Icon name="warning" />
          <p>
            Có {stats.aheadOfSemester.length} học phần chọn học kỳ vượt quá học kỳ hiện tại của bạn
            (HK{current}): {stats.aheadOfSemester.map((course) => course.id).join(", ")}. Vui lòng
            cập nhật học kỳ hiện tại hoặc sửa học kỳ của học phần.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("data", "semester")}>
            Cập nhật học kỳ hiện tại
          </button>
        </div>
      )}

      <div className="filters">
        <input
          className="input"
          type="search"
          placeholder="Tìm theo mã hoặc tên môn …"
          aria-label="Tìm học phần"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
        />
        <FilterSelects filters={filters} set={set} />
        <button
          className="btn btn-sm filter-clear"
          disabled={!filtering}
          onClick={() => setFilters(NO_FILTERS)}
        >
          Xóa lọc ✕
        </button>
        <button className="btn btn-sm filter-toggle" onClick={() => setFilterSheet(true)}>
          Lọc{filtering ? " •" : ""}
        </button>
      </div>
      <div className="filter-count">
        Hiển thị: {visible} / {total} học phần
      </div>

      {stats.scoredCount === 0 && !filtering && (
        <Panel className="hint-bar">
          <Mascot scale={2} />
          <p>
            Chưa có điểm nào. Hãy bắt đầu từ môn đang học: chọn <b>Học kỳ</b> → <b>Trạng thái</b> →
            nhập <b>Điểm</b>. Môn tự chọn cần tick ô <b>Chọn</b> trước.
          </p>
        </Panel>
      )}

      {visible === 0 && filtering ? (
        <Panel>
          <div className="empty">
            <Mascot scale={3} />
            <p>Không tìm thấy học phần nào.</p>
            <button className="btn btn-primary" onClick={() => setFilters(NO_FILTERS)}>
              Xóa bộ lọc
            </button>
          </div>
        </Panel>
      ) : (
        BLOCKS.filter((block) => !filters.block || filters.block === block.id).map((block) => {
          const progress = stats.blocks.find((item) => item.id === block.id)!;
          const groups = shownGroups.filter((group) => group.block === block.id);
          // Đánh số nhóm 1, 2, 3… theo thứ tự trong khối (không đổi khi đang lọc).
          const groupRows = groups.map((group, index) => ({
            group,
            number: index + 1,
            rows: rowsOf(group, true),
          }));
          const anyRows = groupRows.some((item) => item.rows.length > 0);
          if (filtering && !anyRows && block.id !== "graduation") return null;
          const isOpen = filtering ? true : !!open[block.id];
          return (
            <section
              key={block.id}
              className={`block${isOpen ? " is-open" : ""}`}
              id={`block-${block.id}`}
            >
              <button
                className="block-head"
                aria-expanded={isOpen}
                onClick={() => setOpen((value) => ({ ...value, [block.id]: !value[block.id] }))}
              >
                <span className="caret" aria-hidden="true" />
                <span className="display">{block.name}</span>
                <span className="badge">
                  {progress.earned} / {progress.required} TC
                </span>
                <Bar
                  value={progress.earned}
                  max={progress.required}
                  small
                  label={`Tiến độ khối ${block.name}`}
                />
              </button>
              {isOpen && (
                <div className="block-body">
                  {block.id === "graduation" && <GraduationChooser data={data} />}
                  {groupRows
                    .filter((item) => !filtering || item.rows.length > 0 || item.group.picker)
                    .map(({ group, number, rows }) => (
                      <GroupSection
                        key={group.id}
                        group={group}
                        number={number}
                        progress={stats.groups.get(group.id)}
                        courses={rows}
                        data={data}
                        focus={focus}
                        filtering={filtering}
                      />
                    ))}
                </div>
              )}
            </section>
          );
        })
      )}

      {(!filtering || peRows.length > 0) && (
        <PeSection
          data={data}
          open={filtering || !!open.pe}
          onToggle={() => setOpen((value) => ({ ...value, pe: !value.pe }))}
          courses={peRows}
          focus={focus}
        />
      )}
      <ConditionsPanel data={data} />

      {filterSheet && (
        <Modal
          title="Bộ lọc"
          onClose={() => setFilterSheet(false)}
          footer={
            <>
              <button
                className="btn"
                onClick={() => setFilters({ ...NO_FILTERS, query: filters.query })}
              >
                Xóa lọc
              </button>
              <button className="btn btn-primary" onClick={() => setFilterSheet(false)}>
                Xem {visible} học phần
              </button>
            </>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            <FilterSelects filters={filters} set={set} />
          </div>
        </Modal>
      )}
    </>
  );
}

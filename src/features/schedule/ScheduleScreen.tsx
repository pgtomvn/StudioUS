import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "../../app/nav";
import { Field, Hud, Mascot, Modal, Panel, toast, undoToast, useNow } from "../../components/ui";
import { COURSE_BY_ID } from "../../data/curriculum";
import { recordOf, scheduleCourses } from "../../domain/progress";
import { MAX_SEMESTER } from "../../domain/rules";
import { buildIcs, downloadText } from "../../lib/files";
import { CLASS_COLORS, inkOn, isHexColor } from "../../lib/color";
import { actions, getState, useAppState } from "../../lib/store";
import { keepWords } from "../../lib/text";
import {
  DAY_NAMES,
  classesOverlap,
  daysUntil,
  examDate,
  classesWithoutWeeks,
  findExamClash,
  formatDate,
  layoutOverlaps,
  semestersAhead,
  minutesOf,
  nextExam,
  pad2,
  parseDate,
  shortDate,
  slotIndexOf,
  buildWeeks,
  academicYear,
  semesterMonday,
  semesterWeekCount,
  toDateInput,
  weekRange,
} from "../../lib/time";
import type { AppData, ClassEntry, ClassKind, ExamEntry, ExamKind } from "../../types";

const START_HOUR = 7;
const HOURS = Array.from({ length: 12 }, (_, index) => START_HOUR + index);
/** Chọn màu lịch học: 7 màu có sẵn + ô chọn màu tự do (bảng màu của máy) và ô nhập mã hex. */
function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const custom = !CLASS_COLORS.some((color) => color.value === value.toLowerCase());
  return (
    <div className="color-row">
      {CLASS_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          className={`color-dot${value.toLowerCase() === color.value ? " is-on" : ""}`}
          style={{ background: color.value }}
          title={`Màu ${color.name}`}
          aria-label={`Màu ${color.name}`}
          aria-pressed={value.toLowerCase() === color.value}
          onClick={() => onChange(color.value)}
        />
      ))}
      <label
        className={`color-dot color-custom${custom ? " is-on" : ""}`}
        style={custom ? { background: value, color: inkOn(value) } : undefined}
        title="Chọn màu tự do"
      >
        <input
          type="color"
          value={isHexColor(value) ? value : "#ffffff"}
          aria-label="Chọn màu tự do"
          onChange={(event) => onChange(event.target.value)}
        />
        {!custom && "+"}
      </label>
      <input
        className={`input color-hex${isHexColor(hex) ? "" : " is-error"}`}
        value={hex}
        maxLength={7}
        placeholder="#RRGGBB"
        aria-label="Mã màu hex"
        title="Nhập mã màu dạng #RRGGBB"
        onChange={(event) => {
          const text = event.target.value.trim();
          setHex(text);
          if (isHexColor(text)) onChange(text.toLowerCase());
        }}
        onBlur={() => setHex(value)}
      />
    </div>
  );
}
const EXAM_KIND: Record<ExamKind, string> = { mid: "Giữa kỳ", final: "Cuối kỳ", other: "Khác" };
const CLASS_KIND: Record<ClassKind, string> = { theory: "Lý thuyết", lab: "Thực hành" };

const courseName = (id: string) => COURSE_BY_ID.get(id)?.name ?? id;
type ClassDraft = Omit<ClassEntry, "id"> & { id?: string };
type ExamDraft = Omit<ExamEntry, "id"> & { id?: string };

function classErrors(draft: ClassDraft, maxWeek: number) {
  const errors: Partial<Record<keyof ClassDraft, string>> = {};
  if (!draft.courseId) errors.courseId = "Chưa chọn môn học";
  if (!draft.start || !draft.end) errors.end = "Nhập đủ giờ bắt đầu và kết thúc";
  else if (minutesOf(draft.end) <= minutesOf(draft.start))
    errors.end = "Giờ kết thúc phải sau giờ bắt đầu";
  if (!draft.room.trim()) errors.room = "Nhập phòng học";
  if (!(draft.weekFrom >= 1 && draft.weekTo <= maxWeek && draft.weekFrom <= draft.weekTo))
    errors.weekTo = `Khoảng tuần phải nằm trong Tuần 1 – ${maxWeek}`;
  return errors;
}

function examErrors(draft: ExamDraft) {
  const errors: Partial<Record<keyof ExamDraft, string>> = {};
  if (!draft.courseId) errors.courseId = "Chưa chọn môn học";
  if (!parseDate(draft.date)) errors.date = "Chọn ngày thi";
  if (!draft.time) errors.time = "Chọn giờ thi";
  if (!draft.room.trim()) errors.room = "Nhập phòng thi";
  return errors;
}

/** Chọn buổi Lý thuyết hay Thực hành. */
function KindPicker(props: { value: ClassKind; onChange: (kind: ClassKind) => void }) {
  return (
    <div className="field">
      <span className="field-label">Lý thuyết / Thực hành *</span>
      <div className="seg" role="group" aria-label="Loại buổi học">
        {(Object.keys(CLASS_KIND) as ClassKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            className={`btn${props.value === kind ? " is-on" : ""}`}
            aria-pressed={props.value === kind}
            onClick={() => props.onChange(kind)}
          >
            {CLASS_KIND[kind]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ biểu mẫu thêm lịch (2 tab) và sửa lịch thi */
function AddForm(props: {
  data: AppData;
  tab: "class" | "exam";
  semester: number;
  week: number;
  editExam?: ExamEntry;
  onClose: () => void;
}) {
  const { data } = props;
  const [semester, setSemester] = useState(props.editExam?.semester ?? props.semester);
  const maxWeek = semesterWeekCount(data.profile, semester, data.classes);
  const monday = semesterMonday(data.profile, semester);
  // Chỉ các học phần đã đặt vào học kỳ này và đang học / đã học (bước Học kỳ → Trạng thái ở trang Học phần).
  const studying = scheduleCourses(data).filter((course) => {
    const record = recordOf(data, course.id);
    return record.semester === semester && record.status !== "todo";
  });
  const [tab, setTab] = useState(props.tab);
  const [touched, setTouched] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [classDraft, setClassDraft] = useState<ClassDraft>({
    courseId: "",
    kind: "theory",
    day: 1,
    start: "07:30",
    end: "09:10",
    room: "",
    semester: props.semester,
    weekFrom: Math.max(1, props.week),
    weekTo: Math.max(props.week, maxWeek),
    color: CLASS_COLORS[data.classes.length % CLASS_COLORS.length].value,
    note: "",
  });
  const [examDraft, setExamDraft] = useState<ExamDraft>(
    props.editExam ?? {
      courseId: "",
      semester: props.semester,
      kind: "mid",
      date: "",
      time: "07:30",
      room: "",
      remindDays: 7,
      note: "",
    },
  );
  const errors = tab === "class" ? classErrors(classDraft, maxWeek) : examErrors(examDraft);
  const valid = Object.keys(errors).length === 0;
  const show = (key: string) =>
    touched ? ((errors as Record<string, string>)[key] ?? null) : null;
  const courseOptions =
    props.editExam && !studying.some((course) => course.id === props.editExam!.courseId)
      ? [...studying, COURSE_BY_ID.get(props.editExam.courseId)!].filter(Boolean)
      : studying;
  const changeSemester = (value: number) => {
    setSemester(value);
    setClassDraft((draft) => ({ ...draft, semester: value, courseId: "" }));
    setExamDraft((draft) => ({ ...draft, semester: value, courseId: "" }));
  };

  const save = (force: boolean) => {
    setTouched(true);
    if (!valid) return;
    if (tab === "class") {
      const clash = data.classes.find((item) => classesOverlap(classDraft, item));
      if (clash && !force)
        return setConflict(
          `Trùng lịch với ${courseName(clash.courseId)} – ${CLASS_KIND[clash.kind]} (${DAY_NAMES[clash.day - 1]}, ${clash.start}–${clash.end}).`,
        );
      actions.saveClass(classDraft);
      toast("Đã cập nhật lịch học");
    } else {
      const clash = findExamClash(examDraft, data.exams);
      if (clash && !force) {
        const current = data.profile.currentSemester;
        const hidden =
          clash.semester > current
            ? ` Lịch thi này thuộc HK${clash.semester}, vượt quá học kỳ hiện tại (HK${current}); chọn HK${clash.semester} ở trang TKB & Thi để xem, sửa hoặc xóa.`
            : clash.semester !== semester
              ? ` Lịch thi này thuộc HK${clash.semester}.`
              : "";
        return setConflict(
          `Trùng ca thi với ${courseName(clash.courseId)} – HK${clash.semester} · ${EXAM_KIND[clash.kind]} · ${formatDate(clash.date)} lúc ${clash.time} · Phòng ${clash.room}.${hidden}`,
        );
      }
      actions.saveExam(examDraft);
      toast("Đã cập nhật lịch thi");
    }
    props.onClose();
  };

  const weekHint = monday
    ? `${shortDate(weekRange(monday, classDraft.weekFrom).from)} – ${shortDate(weekRange(monday, classDraft.weekTo).to)}`
    : `Chưa nhập ngày bắt đầu HK${semester} ở trang Dữ liệu`;

  return (
    <Modal
      title={props.editExam ? "Sửa lịch thi" : "Thêm lịch"}
      onClose={props.onClose}
      wide
      full
      footer={
        <>
          <button className="btn" onClick={props.onClose}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            disabled={touched && !valid}
            onClick={() => save(false)}
          >
            Lưu
          </button>
        </>
      }
    >
      {!props.editExam && (
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "class"}
            className={`tab${tab === "class" ? " is-active" : ""}`}
            onClick={() => setTab("class")}
          >
            Lịch học
          </button>
          <button
            role="tab"
            aria-selected={tab === "exam"}
            className={`tab${tab === "exam" ? " is-active" : ""}`}
            onClick={() => setTab("exam")}
          >
            Lịch thi
          </button>
        </div>
      )}
      <Field label="Học kỳ *" hint={`Năm học ${academicYear(semester)}`}>
        <select
          className="select"
          value={semester}
          onChange={(event) => changeSemester(Number(event.target.value))}
        >
          {Array.from(
            { length: Math.min(MAX_SEMESTER, Math.max(data.profile.currentSemester, semester)) },
            (_, index) => index + 1,
          ).map((value) => (
            <option key={value} value={value}>
              HK{value}
            </option>
          ))}
        </select>
      </Field>
      {courseOptions.length === 0 && (
        <div className="demo-note" style={{ alignItems: "center" }}>
          <span style={{ flex: 1 }}>
            Chưa có học phần nào của HK{semester} ở trạng thái “Đang học” hoặc “Đã hoàn thành”. Hãy
            sang trang Học phần &amp; Điểm chọn học kỳ và trạng thái cho môn trước.
          </span>
          <button className="btn btn-sm" onClick={() => navigate("courses")}>
            Mở Học phần
          </button>
        </div>
      )}

      {tab === "class" ? (
        <>
          <Field label="Môn học *" error={show("courseId")}>
            <select
              className={`select${show("courseId") ? " is-error" : ""}`}
              value={classDraft.courseId}
              onChange={(event) => setClassDraft({ ...classDraft, courseId: event.target.value })}
            >
              <option value="">— Chọn môn của HK{semester} —</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.id} – {course.name}
                </option>
              ))}
            </select>
          </Field>
          <KindPicker
            value={classDraft.kind}
            onChange={(kind) => setClassDraft({ ...classDraft, kind })}
          />
          <div className="grid-2">
            <Field label="Thứ *">
              <select
                className="select"
                value={classDraft.day}
                onChange={(event) =>
                  setClassDraft({ ...classDraft, day: Number(event.target.value) })
                }
              >
                {DAY_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name === "CN" ? "Chủ nhật" : name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phòng học *" error={show("room")}>
              <input
                className={`input${show("room") ? " is-error" : ""}`}
                placeholder="VD: F101"
                value={classDraft.room}
                onChange={(event) => setClassDraft({ ...classDraft, room: event.target.value })}
              />
            </Field>
            <Field label="Giờ bắt đầu *">
              <input
                className="input"
                type="time"
                value={classDraft.start}
                onChange={(event) => setClassDraft({ ...classDraft, start: event.target.value })}
              />
            </Field>
            <Field label="Giờ kết thúc *" error={show("end")}>
              <input
                className={`input${show("end") ? " is-error" : ""}`}
                type="time"
                value={classDraft.end}
                onChange={(event) => setClassDraft({ ...classDraft, end: event.target.value })}
              />
            </Field>
            <Field label="Từ tuần *">
              <input
                className="input"
                type="number"
                min={1}
                max={maxWeek}
                value={classDraft.weekFrom}
                onChange={(event) =>
                  setClassDraft({ ...classDraft, weekFrom: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Đến tuần *" error={show("weekTo")} hint={weekHint}>
              <input
                className={`input${show("weekTo") ? " is-error" : ""}`}
                type="number"
                min={1}
                max={maxWeek}
                value={classDraft.weekTo}
                onChange={(event) =>
                  setClassDraft({ ...classDraft, weekTo: Number(event.target.value) })
                }
              />
            </Field>
          </div>
          <div className="field">
            <span className="field-label">Màu hiển thị</span>
            <ColorPicker
              value={classDraft.color}
              onChange={(color) => setClassDraft({ ...classDraft, color })}
            />
          </div>
          <Field label="Ghi chú">
            <textarea
              className="textarea"
              maxLength={200}
              placeholder="VD: Mang theo laptop"
              value={classDraft.note}
              onChange={(event) => setClassDraft({ ...classDraft, note: event.target.value })}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Môn học *" error={show("courseId")}>
            <select
              className={`select${show("courseId") ? " is-error" : ""}`}
              value={examDraft.courseId}
              onChange={(event) => setExamDraft({ ...examDraft, courseId: event.target.value })}
            >
              <option value="">— Chọn môn của HK{semester} —</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.id} – {course.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid-2">
            <Field label="Loại kỳ thi">
              <select
                className="select"
                value={examDraft.kind}
                onChange={(event) =>
                  setExamDraft({ ...examDraft, kind: event.target.value as ExamKind })
                }
              >
                {Object.entries(EXAM_KIND).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phòng thi *" error={show("room")}>
              <input
                className={`input${show("room") ? " is-error" : ""}`}
                placeholder="VD: B12"
                value={examDraft.room}
                onChange={(event) => setExamDraft({ ...examDraft, room: event.target.value })}
              />
            </Field>
            <Field label="Ngày thi *" error={show("date")}>
              <input
                className={`input${show("date") ? " is-error" : ""}`}
                type="date"
                value={examDraft.date}
                onChange={(event) => setExamDraft({ ...examDraft, date: event.target.value })}
              />
            </Field>
            <Field label="Giờ thi *" error={show("time")}>
              <input
                className={`input${show("time") ? " is-error" : ""}`}
                type="time"
                value={examDraft.time}
                onChange={(event) => setExamDraft({ ...examDraft, time: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Nhắc trước">
            <select
              className="select"
              value={examDraft.remindDays}
              onChange={(event) =>
                setExamDraft({ ...examDraft, remindDays: Number(event.target.value) })
              }
            >
              {[1, 3, 7].map((days) => (
                <option key={days} value={days}>
                  {days} ngày
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ghi chú">
            <textarea
              className="textarea"
              maxLength={200}
              placeholder="VD: số báo danh, được mang tài liệu"
              value={examDraft.note}
              onChange={(event) => setExamDraft({ ...examDraft, note: event.target.value })}
            />
          </Field>
        </>
      )}

      {conflict && (
        <Modal
          title="Cảnh báo trùng lịch"
          onClose={() => setConflict(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConflict(null)}>
                Quay lại sửa
              </button>
              <button className="btn btn-primary" onClick={() => save(true)}>
                Vẫn lưu
              </button>
            </>
          }
        >
          <p>{conflict}</p>
        </Modal>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ chi tiết + chỉnh sửa một môn trên bảng */
function ClassDetail({
  item,
  onEdit,
  onDelete,
  onClose,
}: {
  item: ClassEntry;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const course = COURSE_BY_ID.get(item.courseId);
  return (
    <Modal
      title={courseName(item.courseId)}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            Xóa
          </button>
          <button className="btn btn-primary" onClick={onEdit}>
            Chỉnh sửa
          </button>
        </>
      }
    >
      <dl className="kv">
        <dt>Mã học phần</dt>
        <dd>
          {item.courseId} – {course?.credits ?? "?"} TC
        </dd>
        <dt>Hình thức</dt>
        <dd>{CLASS_KIND[item.kind]}</dd>
        <dt>Học kỳ</dt>
        <dd>
          HK{item.semester} · {academicYear(item.semester)}
        </dd>
        <dt>Thứ</dt>
        <dd>{DAY_NAMES[item.day - 1] === "CN" ? "Chủ nhật" : DAY_NAMES[item.day - 1]}</dd>
        <dt>Giờ học</dt>
        <dd>
          {item.start} – {item.end}
        </dd>
        <dt>Phòng học</dt>
        <dd>{item.room}</dd>
        <dt>Thời gian áp dụng</dt>
        <dd>
          Tuần {item.weekFrom} – Tuần {item.weekTo}
        </dd>
        {item.note && (
          <>
            <dt>Ghi chú</dt>
            <dd>{item.note}</dd>
          </>
        )}
      </dl>
    </Modal>
  );
}

function ClassEdit({
  item,
  week,
  data,
  onClose,
}: {
  item: ClassEntry;
  week: number;
  data: AppData;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ClassEntry>(item);
  const [from, setFrom] = useState(item.weekFrom);
  const [to, setTo] = useState(item.weekTo);
  const [conflict, setConflict] = useState<string | null>(null);
  const inWeek = Math.min(item.weekTo, Math.max(item.weekFrom, week));
  const errors = classErrors(
    { ...draft, weekFrom: from, weekTo: to },
    Math.max(item.weekTo, semesterWeekCount(data.profile, item.semester, data.classes)),
  );
  const scopeError =
    from > to
      ? "Tuần bắt đầu lớn hơn tuần kết thúc"
      : from < item.weekFrom || to > item.weekTo
        ? `Khoảng tuần phải nằm trong Tuần ${item.weekFrom} – ${item.weekTo}`
        : null;
  const valid = !errors.end && !errors.room && !scopeError;

  const save = (force: boolean) => {
    if (!valid) return;
    const changed: ClassDraft = { ...draft, weekFrom: from, weekTo: to };
    const clash = data.classes.find(
      (other) => other.id !== item.id && classesOverlap(changed, other),
    );
    if (clash && !force)
      return setConflict(
        `Trùng lịch với ${courseName(clash.courseId)} – ${CLASS_KIND[clash.kind]} (${DAY_NAMES[clash.day - 1]}, ${clash.start}–${clash.end}).`,
      );
    // Tách lịch cũ: phần tuần ngoài phạm vi giữ nguyên, phần trong phạm vi nhận thay đổi.
    actions.removeClass(item.id);
    if (from > item.weekFrom) actions.saveClass({ ...item, id: undefined, weekTo: from - 1 });
    actions.saveClass({ ...changed, id: item.id });
    if (to < item.weekTo) actions.saveClass({ ...item, id: undefined, weekFrom: to + 1 });
    toast("Đã cập nhật lịch học");
    onClose();
  };

  return (
    <Modal
      title="Chỉnh sửa môn học"
      onClose={onClose}
      wide
      full
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => save(false)}>
            Lưu thay đổi
          </button>
        </>
      }
    >
      <div className="well">
        {item.courseId} – {courseName(item.courseId)}
      </div>
      <KindPicker value={draft.kind} onChange={(kind) => setDraft({ ...draft, kind })} />
      <div className="grid-2">
        <Field label="Thứ *">
          <select
            className="select"
            value={draft.day}
            onChange={(event) => setDraft({ ...draft, day: Number(event.target.value) })}
          >
            {DAY_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name === "CN" ? "Chủ nhật" : name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phòng học *" error={errors.room}>
          <input
            className={`input${errors.room ? " is-error" : ""}`}
            value={draft.room}
            onChange={(event) => setDraft({ ...draft, room: event.target.value })}
          />
        </Field>
        <Field label="Giờ bắt đầu *">
          <input
            className="input"
            type="time"
            value={draft.start}
            onChange={(event) => setDraft({ ...draft, start: event.target.value })}
          />
        </Field>
        <Field label="Giờ kết thúc *" error={errors.end}>
          <input
            className={`input${errors.end ? " is-error" : ""}`}
            type="time"
            value={draft.end}
            onChange={(event) => setDraft({ ...draft, end: event.target.value })}
          />
        </Field>
      </div>
      <div className="field">
        <span className="field-label">Màu hiển thị</span>
        <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
      </div>
      <Field label="Ghi chú">
        <textarea
          className="textarea"
          maxLength={200}
          value={draft.note}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
        />
      </Field>
      <h3 className="display" style={{ fontSize: "1.2rem" }}>
        Phạm vi áp dụng thay đổi
      </h3>
      <div className="quick-row">
        <button className="btn btn-sm" onClick={() => (setFrom(inWeek), setTo(inWeek))}>
          Chỉ tuần này
        </button>
        <button className="btn btn-sm" onClick={() => (setFrom(inWeek), setTo(item.weekTo))}>
          Từ tuần này trở đi
        </button>
        <button className="btn btn-sm" onClick={() => (setFrom(item.weekFrom), setTo(item.weekTo))}>
          Toàn bộ môn
        </button>
      </div>
      <div className="grid-2">
        <Field label="Từ tuần">
          <input
            className={`input${scopeError ? " is-error" : ""}`}
            type="number"
            min={item.weekFrom}
            max={item.weekTo}
            value={from}
            onChange={(event) => setFrom(Number(event.target.value))}
          />
        </Field>
        <Field label="Đến tuần" error={scopeError}>
          <input
            className={`input${scopeError ? " is-error" : ""}`}
            type="number"
            min={item.weekFrom}
            max={item.weekTo}
            value={to}
            onChange={(event) => setTo(Number(event.target.value))}
          />
        </Field>
      </div>
      {conflict && (
        <Modal
          title="Cảnh báo trùng lịch"
          onClose={() => setConflict(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConflict(null)}>
                Quay lại sửa
              </button>
              <button className="btn btn-primary" onClick={() => save(true)}>
                Vẫn lưu
              </button>
            </>
          }
        >
          <p>{conflict}</p>
        </Modal>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ màn hình */
type Dialog =
  | { type: "add"; tab: "class" | "exam" }
  | { type: "editExam"; exam: ExamEntry }
  | { type: "detail"; item: ClassEntry }
  | { type: "editClass"; item: ClassEntry }
  | null;

export function ScheduleScreen() {
  const { data, settings } = useAppState();
  const now = useNow();
  const current = data.profile.currentSemester;
  /** Học kỳ đang xem: một học kỳ cụ thể, hoặc "all" = từ HK1 tới học kỳ hiện tại. */
  const [filter, setFilter] = useState<number | "all">(current);
  const [picked, setPicked] = useState<number | null>(null);
  const [day, setDay] = useState(((now.getDay() + 6) % 7) + 1);
  const [dialog, setDialog] = useState<Dialog>(null);
  const touchX = useRef<number | null>(null);
  // Xóa ngay, cho hoàn tác trong 10 giây (không hỏi xác nhận).
  const deleteClass = (item: ClassEntry) => {
    const before = getState().data;
    actions.removeClass(item.id);
    setDialog(null);
    undoToast(
      `Đã xóa lịch học ${courseName(item.courseId)} (${DAY_NAMES[item.day - 1]}, ${item.start}–${item.end}).`,
      () => actions.restore(before, { classId: item.id }),
    );
  };
  const deleteExam = (exam: ExamEntry) => {
    const before = getState().data;
    actions.removeExam(exam.id);
    undoToast(
      `Đã xóa lịch thi ${courseName(exam.courseId)} ngày ${shortDate(examDate(exam))}.`,
      () => actions.restore(before, { examId: exam.id }),
    );
  };
  const semesters = useMemo(
    () => (filter === "all" ? Array.from({ length: current }, (_, i) => i + 1) : [filter]),
    [filter, current],
  );
  const slots = useMemo(
    () => buildWeeks(data.profile, semesters, data.classes),
    [data.profile, semesters, data.classes],
  );
  const todayIndex = slotIndexOf(slots, now);
  const fallback =
    todayIndex >= 0
      ? todayIndex
      : slots.length > 0 && now > slots[slots.length - 1].to
        ? slots.length - 1
        : 0;
  const index = picked !== null && picked < slots.length ? picked : fallback;
  const slot = slots[index] as (typeof slots)[number] | undefined;
  const missingStart = semesters.filter((semester) => !semesterMonday(data.profile, semester));
  const weekClasses = useMemo(
    () =>
      slot
        ? data.classes
            .filter(
              (item) =>
                item.semester === slot.semester &&
                item.weekFrom <= slot.week &&
                slot.week <= item.weekTo,
            )
            .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
        : [],
    [data.classes, slot],
  );
  const semesterClasses = data.classes.filter((item) => semesters.includes(item.semester));
  // Học kỳ chưa có ngày bắt đầu (thường là học kỳ sau học kỳ hiện tại): hiện lịch theo thứ, không chia tuần.
  const undated = slot ? [] : classesWithoutWeeks(data.profile, semesters, data.classes);
  const shownClasses = slot ? weekClasses : undated;
  const missingAhead = missingStart.filter((semester) => semester > current);
  // Lịch thuộc học kỳ vượt quá học kỳ hiện tại: không nằm trong "Tất cả" nên phải hiện riêng kèm cảnh báo.
  const ahead = semestersAhead(data);
  const chooseFilter = (value: number | "all") => {
    setFilter(value);
    setPicked(null);
  };
  const exams = useMemo(() => {
    const inView = data.exams.filter((exam) =>
      filter === "all" ? exam.semester <= current : exam.semester === filter,
    );
    const upcoming = inView
      .filter((exam) => examDate(exam) >= now)
      .sort((a, b) => examDate(a).getTime() - examDate(b).getTime());
    const past = inView
      .filter((exam) => examDate(exam) < now)
      .sort((a, b) => examDate(b).getTime() - examDate(a).getTime());
    return [...upcoming, ...past];
  }, [data.exams, now, filter, current]);
  const upcoming = nextExam(data.exams, now);
  const showBanner =
    upcoming &&
    daysUntil(examDate(upcoming), now) <= upcoming.remindDays &&
    settings.dismissedBannerExamId !== upcoming.id;
  const hasAnything = data.classes.length + data.exams.length > 0;
  const nowTop = (now.getHours() * 60 + now.getMinutes() - START_HOUR * 60) / 60;

  const exportIcs = () => {
    downloadText(`lich_hoc_${toDateInput(now)}.ics`, buildIcs(data), "text/calendar;charset=utf-8");
    toast("Đã tải file lịch .ics");
  };

  return (
    <>
      <Hud />
      <h1 className="sr-only">Thời khóa biểu và Lịch thi</h1>

      {showBanner && upcoming && (
        <div className="banner" role="status">
          <div className="banner-name display">{courseName(upcoming.courseId)}</div>
          <div className="banner-body">
            <span>Thi {EXAM_KIND[upcoming.kind].toLowerCase()}</span>
            <div className="banner-date">
              {[
                ["Ngày", examDate(upcoming).getDate()],
                ["Tháng", examDate(upcoming).getMonth() + 1],
                ["Giờ", examDate(upcoming).getHours()],
                ["Phút", examDate(upcoming).getMinutes()],
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{String(label).toUpperCase()}</small>
                  {pad2(value as number)}
                </div>
              ))}
            </div>
            <span>Phòng: {upcoming.room}</span>
          </div>
          <button
            className="banner-close"
            aria-label="Ẩn nhắc nhở"
            onClick={() => actions.dismissBanner(upcoming.id)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setDialog({ type: "add", tab: "class" })}
        >
          + Thêm lịch học
        </button>
        <button className="btn btn-primary" onClick={() => setDialog({ type: "add", tab: "exam" })}>
          + Thêm lịch thi
        </button>
        <span className="spacer" />
        <button className="btn btn-export" disabled={!hasAnything} onClick={exportIcs}>
          Xuất lên Google Calendar (.ics)
        </button>
      </div>

      <div className="sem-pick" role="group" aria-label="Chọn học kỳ">
        <span className="field-label">Học kỳ:</span>
        {Array.from({ length: current }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            className={`btn btn-sm${filter === value ? " is-on" : ""}`}
            aria-pressed={filter === value}
            onClick={() => chooseFilter(value)}
          >
            HK{value}
          </button>
        ))}
        <button
          className={`btn btn-sm${filter === "all" ? " is-on" : ""}`}
          aria-pressed={filter === "all"}
          title={`Từ HK1 tới học kỳ hiện tại (HK${current})`}
          onClick={() => chooseFilter("all")}
        >
          Tất cả
        </button>
        {ahead.map(({ semester: value }) => (
          <button
            key={value}
            className={`btn btn-sm is-ahead${filter === value ? " is-on" : ""}`}
            aria-pressed={filter === value}
            title={`HK${value} vượt quá học kỳ hiện tại (HK${current})`}
            onClick={() => chooseFilter(value)}
          >
            ⚠ HK{value}
          </button>
        ))}
      </div>

      {ahead.length > 0 && (
        <div className="panel alert-bar" role="alert">
          <Mascot scale={1.5} still />
          <p>
            Có{" "}
            {ahead
              .map(
                (item) =>
                  `${[item.classes ? `${item.classes} lịch học` : "", item.exams ? `${item.exams} lịch thi` : ""].filter(Boolean).join(" và ")} thuộc HK${item.semester}`,
              )
              .join("; ")}{" "}
            – vượt quá học kỳ hiện tại của bạn (HK{current}) nên không nằm trong “Tất cả”, nhưng vẫn
            được dùng để nhắc lịch và kiểm tra trùng. Hãy xem lại hoặc cập nhật học kỳ hiện tại.
          </p>
          <button className="btn btn-sm" onClick={() => chooseFilter(ahead[0].semester)}>
            Xem HK{ahead[0].semester}
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => navigate("data", "semester")}>
            Cập nhật học kỳ hiện tại
          </button>
        </div>
      )}

      {slot && (
        <div className="row">
          <div className="weekpick">
            <button
              onClick={() => setPicked(index - 1)}
              disabled={index === 0}
              aria-label="Tuần trước"
            >
              ◀ Trước
            </button>
            <div className="weekpick-label">
              {filter === "all" && `HK${slot.semester} · `}Tuần {slot.week}
              <br />({shortDate(slot.from)} – {shortDate(slot.to)})
            </div>
            <button
              onClick={() => setPicked(index + 1)}
              disabled={index === slots.length - 1}
              aria-label="Tuần sau"
            >
              Sau ▶
            </button>
          </div>
          {todayIndex >= 0 && index !== todayIndex && (
            <button className="btn btn-sm" onClick={() => setPicked(todayIndex)}>
              Về tuần hiện tại
            </button>
          )}
          {missingStart.length > 0 && (
            <span className="badge warn">
              Chưa có ngày bắt đầu: {missingStart.map((value) => `HK${value}`).join(", ")}
            </span>
          )}
        </div>
      )}

      {!slot && undated.length > 0 && (
        <div className="row">
          <span className="badge warn undated-note">
            {missingStart.map((value) => `HK${value}`).join(", ")} chưa có ngày bắt đầu nên lịch
            hiện theo thứ trong tuần, chưa chia tuần.{" "}
            {missingAhead.length === missingStart.length
              ? `Ngày bắt đầu nhập được ở trang Dữ liệu khi ${missingAhead.map((value) => `HK${value}`).join(", ")} là học kỳ hiện tại.`
              : "Nhập ngày bắt đầu ở trang Dữ liệu để xem theo tuần."}
          </span>
        </div>
      )}

      <div className="sched-grid">
        <Panel className="tt-wrap">
          <div className="tt" role="table" aria-label="Thời khóa biểu tuần">
            <div className="tt-head">Thời gian</div>
            {DAY_NAMES.map((name) => (
              <div className="tt-head" key={name}>
                {name}
              </div>
            ))}
            <div className="tt-times">
              {HOURS.map((hour, index) => (
                <span key={hour} style={{ top: `calc(var(--hour) * ${index})` }}>
                  {hour}
                </span>
              ))}
            </div>
            {DAY_NAMES.map((name, index) => (
              <div className="tt-col" key={name}>
                {index === todayIndex && nowTop >= 0 && nowTop <= 12 && (
                  <div className="tt-now" style={{ top: `calc(var(--hour) * ${nowTop})` }} />
                )}
                {(() => {
                  const dayClasses = shownClasses.filter((item) => item.day === index + 1);
                  const lanes = layoutOverlaps(dayClasses);
                  return dayClasses.map((item) => {
                    const place = lanes.get(item.id) ?? { lane: 0, lanes: 1 };
                    const top = Math.max(0, (minutesOf(item.start) - START_HOUR * 60) / 60);
                    const height = Math.max(
                      0.6,
                      (minutesOf(item.end) - START_HOUR * 60) / 60 - top,
                    );
                    return (
                      <button
                        key={item.id}
                        className="tt-event"
                        style={{
                          top: `calc(var(--hour) * ${top})`,
                          height: `calc(var(--hour) * ${height})`,
                          // buổi trùng giờ nằm song song (mỗi buổi một cột hẹp)
                          left: `calc(${place.lane} * 100% / ${place.lanes} + 2px)`,
                          width: `calc(100% / ${place.lanes} - 4px)`,
                          background: item.color,
                          color: inkOn(item.color),
                        }}
                        title={`${courseName(item.courseId)} – ${CLASS_KIND[item.kind]}${place.lanes > 1 ? " (trùng giờ)" : ""}`}
                        onClick={() => setDialog({ type: "detail", item })}
                      >
                        <b>{courseName(item.courseId)}</b>
                        {CLASS_KIND[item.kind]}
                        <br />
                        {item.start} – {item.end}
                        <br />
                        P.{item.room}
                      </button>
                    );
                  });
                })()}
              </div>
            ))}
          </div>

          {/* Điện thoại: xem theo ngày */}
          <div className="daystrip">
            {DAY_NAMES.map((name, index) => (
              <button
                key={name}
                className={day === index + 1 ? "is-active" : ""}
                aria-pressed={day === index + 1}
                onClick={() => setDay(index + 1)}
              >
                {name.replace("Thứ ", "T")}
              </button>
            ))}
          </div>
          <div
            className="day-list"
            onTouchStart={(event) => (touchX.current = event.touches[0].clientX)}
            onTouchEnd={(event) => {
              if (touchX.current === null) return;
              const delta = event.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(delta) > 50)
                setDay((value) => Math.min(7, Math.max(1, value + (delta < 0 ? 1 : -1))));
            }}
          >
            {shownClasses
              .filter((item) => item.day === day)
              .map((item) => (
                <button
                  key={item.id}
                  className="day-card"
                  style={{ background: item.color, color: inkOn(item.color) }}
                  onClick={() => setDialog({ type: "detail", item })}
                >
                  <b style={{ fontWeight: 400, fontSize: "1.15rem" }}>
                    {keepWords(courseName(item.courseId))}
                  </b>
                  <br />
                  {CLASS_KIND[item.kind]}
                  <br />
                  {item.start} – {item.end} · Phòng {item.room}
                </button>
              ))}
            {shownClasses.length > 0 && shownClasses.every((item) => item.day !== day) && (
              <p className="dim">Ngày này không có lịch học.</p>
            )}
          </div>

          {!slot && undated.length === 0 ? (
            <div className="empty tt-empty">
              <Mascot scale={2} />
              <p>
                Chưa nhập ngày bắt đầu của {missingStart.map((value) => `HK${value}`).join(", ")}.
                Hãy nhập thông tin học kỳ ở trang Dữ liệu để xem thời khóa biểu theo tuần.
              </p>
              <button className="btn btn-primary" onClick={() => navigate("data", "semester")}>
                Nhập thông tin học kỳ
              </button>
            </div>
          ) : (
            slot &&
            weekClasses.length === 0 && (
              <div className="empty tt-empty">
                <Mascot scale={2} />
                <p>
                  {semesterClasses.length === 0
                    ? "Chưa có lịch học, nhấn Thêm lịch để bắt đầu."
                    : "Tuần này chưa có lịch học."}
                </p>
              </div>
            )
          )}
        </Panel>

        <Panel
          title="Lịch thi"
          icon="hourglass"
          actions={<span className="dim">gần nhất trước</span>}
        >
          {exams.length === 0 ? (
            <p className="dim">Chưa có lịch thi, nhấn Thêm lịch thi để bắt đầu.</p>
          ) : (
            <div className="exam-list">
              {exams.map((exam) => {
                const days = daysUntil(examDate(exam), now);
                const past = examDate(exam) < now;
                return (
                  <article key={exam.id} className={`exam-card${past ? " is-past" : ""}`}>
                    <h3>{courseName(exam.courseId)}</h3>
                    <div className="dim">
                      {filter === "all" && `HK${exam.semester} · `}
                      {EXAM_KIND[exam.kind]} – {shortDate(examDate(exam))} – {exam.time} – Phòng{" "}
                      {exam.room}
                    </div>
                    <div
                      className={`exam-left${past ? "" : days <= 2 ? " is-urgent" : days <= 7 ? " is-soon" : ""}`}
                    >
                      {past ? "Đã qua" : days === 0 ? "Hôm nay" : `Còn ${days} ngày`}
                    </div>
                    <div className="row">
                      <button
                        className="btn btn-sm"
                        onClick={() => setDialog({ type: "editExam", exam })}
                      >
                        Sửa
                      </button>
                      <button className="btn btn-sm" onClick={() => deleteExam(exam)}>
                        Xóa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {dialog?.type === "add" && (
        <AddForm
          data={data}
          tab={dialog.tab}
          semester={filter === "all" ? (slot?.semester ?? current) : filter}
          week={slot?.week ?? 1}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "editExam" && (
        <AddForm
          data={data}
          tab="exam"
          semester={dialog.exam.semester}
          week={slot?.week ?? 1}
          editExam={dialog.exam}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "detail" && (
        <ClassDetail
          item={dialog.item}
          onClose={() => setDialog(null)}
          onEdit={() => setDialog({ type: "editClass", item: dialog.item })}
          onDelete={() => deleteClass(dialog.item)}
        />
      )}
      {dialog?.type === "editClass" && (
        <ClassEdit
          item={dialog.item}
          week={slot?.week ?? dialog.item.weekFrom}
          data={data}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

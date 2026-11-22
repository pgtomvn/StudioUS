import { useEffect, useRef, useState } from "react";
import { takeFocus } from "../../app/nav";
import { Avatar, Field, Hud, Icon, Modal, Panel, toast, undoToast } from "../../components/ui";
import { semesterInfoStatus } from "../../domain/progress";
import { MAX_SEMESTER } from "../../domain/rules";
import { MAJOR_NAME } from "../../data/curriculum";
import { SAMPLES } from "../../data/sample.demo";
import { downloadText, fileToAvatar } from "../../lib/files";
import {
  DATA_VERSION,
  EXPORT_FILE_NAME,
  summarize,
  validateImport,
  type ImportResult,
} from "../../lib/storage/storage";
import { actions, getState, useAppState } from "../../lib/store";
import { keepWords } from "../../lib/text";
import {
  academicYear,
  formatDateTime,
  mondayOf,
  parseDate,
  semesterWeekCount,
} from "../../lib/time";

function exportBackup() {
  actions.markExported();
  const data = getState().data;
  downloadText(EXPORT_FILE_NAME, JSON.stringify(data, null, 2), "application/json");
  toast("Đã tải file sao lưu");
}

/** Thông tin từng học kỳ từ HK1 tới học kỳ hiện tại (bắt buộc nhập đủ). */
function SemesterInfo({ highlight }: { highlight: boolean }) {
  const { data } = useAppState();
  const profile = data.profile;
  const status = semesterInfoStatus(profile);
  const complete = status.missing.length === 0;
  const rows = Array.from({ length: profile.currentSemester }, (_, index) => index + 1);
  return (
    <div className={`sem-info${highlight ? " is-focus" : ""}`} id="semester-info">
      <div className="group-head">
        <h3 className="group-title">Thông tin học kỳ</h3>
        <span className={`badge ${complete ? "good" : "warn"}`}>
          Đã nhập {status.filled}/{status.total} học kỳ
        </span>
        <span className="dim">
          Đang ở HK{profile.currentSemester} nên cần nhập đủ HK1
          {profile.currentSemester > 1 ? ` → HK${profile.currentSemester}` : ""}.
        </span>
      </div>
      <div className="sem-head">
        <span>Học kỳ</span>
        <span>Ngày bắt đầu *</span>
        <span>Ngày kết thúc *</span>
        <span>Số tuần</span>
        <span>Tình trạng</span>
      </div>
      {rows.map((semester) => {
        const info = profile.semesters[String(semester)] ?? { start: "", end: "" };
        const previous = profile.semesters[String(semester - 1)];
        const start = parseDate(info.start);
        const end = parseDate(info.end);
        let problem: string | null = null;
        if (!info.start || !info.end) problem = "Thiếu ngày";
        else if (start && end && end <= start) problem = "Kết thúc phải sau bắt đầu";
        const overlap =
          !problem && previous?.end && info.start && info.start <= previous.end
            ? `Bắt đầu trước khi HK${semester - 1} kết thúc`
            : null;
        const weeks =
          start && end && end > start ? semesterWeekCount(profile, semester, data.classes) : null;
        return (
          <div key={semester} className={`sem-row${problem ? " is-missing" : ""}`}>
            <span className="sem-name">
              <b>HK{semester}</b>
              <small className="dim">Năm học {academicYear(semester)}</small>
            </span>
            <input
              className={`input${!info.start ? " is-error" : ""}`}
              type="date"
              aria-label={`Ngày bắt đầu HK${semester}`}
              value={info.start}
              onChange={(event) => actions.setSemesterInfo(semester, { start: event.target.value })}
            />
            <input
              className={`input${!info.end || (start && end && end <= start) ? " is-error" : ""}`}
              type="date"
              aria-label={`Ngày kết thúc HK${semester}`}
              min={info.start || undefined}
              value={info.end}
              onChange={(event) => actions.setSemesterInfo(semester, { end: event.target.value })}
            />
            <span className="sem-weeks">
              {weeks !== null ? `${weeks} tuần` : "—"}
              {start && start.getDay() !== 1 && (
                <small className="dim">tuần 1 từ thứ 2 {formatShort(mondayOf(start))}</small>
              )}
            </span>
            <span>
              {problem ? (
                <span className="badge bad">{problem}</span>
              ) : overlap ? (
                <span className="badge warn">{overlap}</span>
              ) : (
                <span className="badge good">Đủ</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const formatShort = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

function ProfileForm({ focusSemester }: { focusSemester: boolean }) {
  const { data } = useAppState();
  const profile = data.profile;
  const [name, setName] = useState(profile.name);
  const [nameError, setNameError] = useState(false);
  // Đồng bộ lại khi hồ sơ đổi từ nơi khác (khôi phục file, nạp dữ liệu mẫu, đặt lại).
  useEffect(() => setName(profile.name), [profile.name]);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    try {
      actions.updateProfile({ avatar: await fileToAvatar(file) });
      toast("Đã cập nhật ảnh đại diện");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không đọc được ảnh.", true);
    }
  };

  return (
    <Panel title="Hồ sơ sinh viên" icon="student">
      <div className="profile-form">
        <Field label="Họ tên *" error={nameError ? "Không để trống họ tên" : null}>
          <input
            className={`input${nameError ? " is-error" : ""}`}
            placeholder="Họ và tên"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              const value = name.trim();
              setNameError(value === "");
              if (value !== "" && value !== profile.name) actions.updateProfile({ name: value });
            }}
          />
        </Field>
        <Field label="Ngành">
          {/* ngành cố định theo CTĐT: chỉ hiển thị, chữ tự xuống dòng khi ô hẹp */}
          <span className="input readonly-value">{keepWords(MAJOR_NAME)}</span>
        </Field>
        <Field label="Khóa">
          <select
            className="select"
            value={profile.cohort}
            onChange={(event) => actions.updateProfile({ cohort: event.target.value })}
          >
            <option value="K26">K26</option>
          </select>
        </Field>
        <Field label="HK hiện tại *" hint={`Năm học ${academicYear(profile.currentSemester)}`}>
          <select
            id="current-semester"
            className={`select${focusSemester ? " is-focus" : ""}`}
            value={profile.currentSemester}
            onChange={(event) =>
              actions.updateProfile({ currentSemester: Number(event.target.value) })
            }
          >
            {Array.from({ length: MAX_SEMESTER }, (_, index) => index + 1).map((semester) => (
              <option key={semester} value={semester}>
                HK{semester} · Năm {Math.ceil(semester / 2)}
              </option>
            ))}
          </select>
        </Field>
        <div className="field">
          <span className="field-label">Ảnh đại diện</span>
          <div className="avatar-pick">
            <Avatar src={profile.avatar} />
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              Chọn ảnh
            </button>
            {profile.avatar && (
              <button
                className="btn btn-sm"
                onClick={() => actions.updateProfile({ avatar: null })}
              >
                {keepWords("Dùng linh vật")}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => (pickAvatar(event.target.files?.[0]), (event.target.value = ""))}
            />
          </div>
        </div>
      </div>
      <SemesterInfo highlight={focusSemester} />
    </Panel>
  );
}

function ImportPanel() {
  const [picked, setPicked] = useState<{ name: string; result: ImportResult } | null>(null);
  const [over, setOver] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const read = async (file: File | undefined) => {
    if (!file) return;
    const result = validateImport(
      file.name,
      file.name.toLowerCase().endsWith(".json") ? await file.text() : "",
    );
    setPicked({ name: file.name, result });
    if (!result.ok) toast(result.error, true);
  };

  const restore = () => {
    if (!picked?.result.ok) return;
    const before = getState().data;
    actions.replaceData(picked.result.data);
    setConfirming(false);
    setPicked(null);
    undoToast("Đã khôi phục dữ liệu từ file.", () => actions.restoreAll(before));
  };

  return (
    <Panel title="Khôi phục từ file" className="io-panel">
      <button
        className={`dropzone${over ? " is-over" : ""}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => (event.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void read(event.dataTransfer.files[0]);
        }}
      >
        <Icon name="scroll" />
        <span>
          Kéo file .json vào đây hoặc <u>bấm để chọn</u>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => (void read(event.target.files?.[0]), (event.target.value = ""))}
      />

      {picked && (
        <div className="well" aria-live="polite">
          <div className="row">
            <span className={`badge ${picked.result.ok ? "good" : "bad"}`}>
              {picked.result.ok ? "✓ Hợp lệ" : "✕ Không hợp lệ"}
            </span>
            <span style={{ overflowWrap: "anywhere" }}>{picked.name}</span>
          </div>
          <p style={{ marginTop: 6 }}>
            {picked.result.ok
              ? `Lưu lúc: ${formatDateTime(picked.result.savedAt) || "không rõ"} – ${picked.result.summary.scored} HP có điểm – ${picked.result.summary.classes} lịch học – ${picked.result.summary.exams} lịch thi`
              : picked.result.error}
          </p>
        </div>
      )}
      <button
        className="btn btn-primary btn-lg btn-block"
        disabled={!picked?.result.ok}
        onClick={() => setConfirming(true)}
      >
        ⬆ Khôi phục
      </button>

      {confirming && (
        <Modal
          title="Khôi phục dữ liệu"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirming(false)}>
                Hủy
              </button>
              <button className="btn btn-good" onClick={exportBackup}>
                Xuất bản sao lưu hiện tại trước
              </button>
              <button className="btn btn-danger" onClick={restore}>
                Ghi đè và khôi phục
              </button>
            </>
          }
        >
          <p>Khôi phục sẽ ghi đè dữ liệu hiện tại bằng nội dung của file {picked?.name}.</p>
        </Modal>
      )}
    </Panel>
  );
}

function ResetPanel() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const close = () => (setOpen(false), setText(""));
  return (
    <>
      <div className="panel danger">
        <p>
          <b className="display" style={{ color: "var(--bad)" }}>
            Vùng nguy hiểm.
          </b>{" "}
          Xóa toàn bộ điểm, lịch và hồ sơ, đưa ứng dụng về trạng thái ban đầu.
        </p>
        <button className="btn btn-danger btn-lg" onClick={() => setOpen(true)}>
          Đặt lại toàn bộ dữ liệu
        </button>
      </div>
      {open && (
        <Modal
          title="Đặt lại toàn bộ dữ liệu"
          onClose={close}
          footer={
            <>
              <button className="btn" onClick={close}>
                Hủy
              </button>
              <button className="btn btn-good" onClick={exportBackup}>
                Xuất sao lưu trước
              </button>
              <button
                className="btn btn-danger"
                disabled={text !== "RESET"}
                onClick={() => {
                  const before = getState().data;
                  actions.resetAll();
                  close();
                  undoToast("Đã đặt lại toàn bộ dữ liệu.", () => actions.restoreAll(before));
                }}
              >
                Xóa tất cả
              </button>
            </>
          }
        >
          <p>
            Bạn sẽ mất: hồ sơ sinh viên, toàn bộ trạng thái và điểm học phần, chứng chỉ ngoại ngữ,
            lịch học và lịch thi. Sau khi xóa chỉ có 10 giây để bấm “Hoàn tác”, nên xuất sao lưu
            trước.
          </p>
          <Field label="Gõ chữ RESET để xác nhận">
            <input
              className="input"
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="RESET"
            />
          </Field>
        </Modal>
      )}
    </>
  );
}

export function DataScreen() {
  const { data, loadStatus, saveOk } = useAppState();
  const summary = summarize(data);
  const storageOk = loadStatus !== "unavailable" && saveOk;
  const [focusSemester] = useState(() => takeFocus() === "semester");
  useEffect(() => {
    if (!focusSemester) return;
    document.getElementById("current-semester")?.scrollIntoView({ block: "center" });
    document.getElementById("current-semester")?.focus();
  }, [focusSemester]);

  return (
    <>
      <Hud />
      <h1 className="screen-title display">Dữ liệu</h1>

      <Panel
        title="Kho dữ liệu trên thiết bị"
        icon="floppy"
        className="storage-panel"
        actions={
          <span className={`badge ${storageOk ? "good" : "bad"}`}>
            {storageOk
              ? "Lưu trên thiết bị · Dùng được ngoại tuyến"
              : "Không ghi được LocalStorage"}
          </span>
        }
      >
        <div className="slot">
          <div className="slot-item">
            <small>Lưu lần cuối</small>
            <span>{formatDateTime(data.meta.lastSavedAt) || "Chưa có"}</span>
          </div>
          <div className="slot-item">
            <small>Lần xuất gần nhất</small>
            <span>{formatDateTime(data.meta.lastExportAt) || "Chưa từng xuất"}</span>
          </div>
          <div className="slot-item">
            <small>Phiên bản dữ liệu</small>
            <span>v{DATA_VERSION}</span>
          </div>
          <div className="slot-item">
            <small>Dữ liệu hiện có</small>
            <span>
              {summary.scored} HP có điểm – {summary.classes} lịch học – {summary.exams} lịch thi
            </span>
          </div>
        </div>
      </Panel>

      <ProfileForm focusSemester={focusSemester} />

      <div className="io-grid">
        <Panel title="Sao lưu ra file" className="io-panel">
          <p>
            File sẽ gồm: Hồ sơ, Kết quả học tập, Chứng chỉ ngoại ngữ, Lịch học và lịch thi, Cấu
            hình.
          </p>
          <div className="well">
            Tên file:
            <br />
            {EXPORT_FILE_NAME}
          </div>
          <button className="btn btn-good btn-lg btn-block" onClick={exportBackup}>
            ⬇ Tải file sao lưu
          </button>
        </Panel>
        <ImportPanel />
      </div>

      <section className="panel notes">
        <h2 className="panel-title display">
          <Icon name="warning" /> Lưu ý
        </h2>
        <ol>
          <li>
            Dữ liệu chỉ nằm trong trình duyệt này; xóa dữ liệu duyệt web hoặc dùng chế độ ẩn danh có
            thể làm mất.
          </li>
          <li>Nên xuất file sau mỗi kỳ hoặc trước khi đổi máy.</li>
          <li>Chuyển máy: xuất ở máy cũ, nhập ở máy mới.</li>
        </ol>
      </section>

      <Panel title="Dữ liệu mẫu (demo)">
        <div className="row">
          <p style={{ flex: 1, minWidth: 220 }}>
            Nạp bộ dữ liệu minh họa do nhóm tự đặt để thử các chức năng: sinh viên đang học HK2,
            hoặc sinh viên đã hoàn thành chương trình (HK8, đủ điều kiện tốt nghiệp). Thao tác này
            ghi đè dữ liệu hiện tại (có 10 giây để hoàn tác).
          </p>
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              className="btn"
              onClick={() => {
                const before = getState().data;
                actions.replaceData(sample.create());
                undoToast(sample.done, () => actions.restoreAll(before));
              }}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </Panel>

      <ResetPanel />
    </>
  );
}

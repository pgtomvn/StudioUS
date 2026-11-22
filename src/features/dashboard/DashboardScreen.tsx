import { navigate } from "../../app/nav";
import { Bar, Icon, Mascot, Panel, undoToast, useNow } from "../../components/ui";
import { COURSE_BY_ID, MAJOR_NAME } from "../../data/curriculum";
import { SAMPLES } from "../../data/sample.demo";
import { computeStats, formatGpa, semesterInfoStatus } from "../../domain/progress";
import { TOTAL_CREDITS_REQUIRED, rankOf } from "../../domain/rules";
import { actions, getState, useAppState } from "../../lib/store";
import { keepWords } from "../../lib/text";
import {
  countdownParts,
  examDate,
  nextExam,
  pad2,
  semestersAhead,
  shortDate,
} from "../../lib/time";

const EXAM_KIND = { mid: "Giữa kỳ", final: "Cuối kỳ", other: "Kỳ thi" } as const;

export function DashboardScreen() {
  const { data } = useAppState();
  const now = useNow();
  const stats = computeStats(data);
  const exam = nextExam(data.exams, now);
  const parts = exam ? countdownParts(examDate(exam), now) : null;
  const year = Math.min(4, Math.ceil(data.profile.currentSemester / 2));
  const semesterInfo = semesterInfoStatus(data.profile);
  const scheduleAhead = semestersAhead(data);
  const needsAttention =
    !stats.isNewUser &&
    (semesterInfo.missing.length > 0 ||
      stats.aheadOfSemester.length > 0 ||
      scheduleAhead.length > 0);

  return (
    <>
      <h1 className="sr-only">Tổng quan</h1>

      {stats.isNewUser && (
        <Panel className="hint-bar">
          <Mascot scale={2} />
          <p>
            Chưa có dữ liệu học tập. Hãy sang trang Học phần &amp; Điểm để đánh dấu môn đang học và
            nhập điểm, hoặc nạp một bộ dữ liệu mẫu (đang học hoặc đã hoàn thành) để xem thử.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("courses")}>
            Bắt đầu nhập
          </button>
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
        </Panel>
      )}

      {needsAttention && (
        <div className="panel alert-bar" role="alert">
          <Icon name="warning" />
          {/* mỗi vấn đề một dòng */}
          <div className="alert-lines">
            {semesterInfo.missing.length > 0 && (
              <p>
                Chưa nhập đủ thông tin học kỳ ({semesterInfo.filled}/{semesterInfo.total}): thiếu{" "}
                {semesterInfo.missing.map((value) => `HK${value}`).join(", ")}.
              </p>
            )}
            {stats.aheadOfSemester.length > 0 && (
              <p>
                Có {stats.aheadOfSemester.length} học phần chọn học kỳ vượt quá học kỳ hiện tại (HK
                {data.profile.currentSemester}).
              </p>
            )}
            {scheduleAhead.length > 0 && (
              <p>
                Có lịch học/lịch thi thuộc{" "}
                {scheduleAhead.map((item) => `HK${item.semester}`).join(", ")} – vượt quá học kỳ
                hiện tại.
              </p>
            )}
          </div>
          {scheduleAhead.length > 0 && (
            <button className="btn" onClick={() => navigate("schedule")}>
              Mở TKB &amp; Thi
            </button>
          )}
          {stats.aheadOfSemester.length > 0 && (
            <button
              className="btn"
              title={`Mở ${stats.aheadOfSemester[0].id} ở trang Học phần để sửa học kỳ`}
              onClick={() => navigate("courses", stats.aheadOfSemester[0].id)}
            >
              Sửa học kỳ học phần
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate("data", "semester")}>
            Cập nhật thông tin học kỳ
          </button>
        </div>
      )}

      <div className="dash-grid">
        {/* Thẻ hồ sơ sinh viên */}
        <button
          className="panel profile-card"
          onClick={() => navigate("data")}
          title="Bấm để sửa hồ sơ ở trang Dữ liệu"
        >
          <div className="profile-top">
            <div>
              <div className="profile-name display">{data.profile.name || "Tên sinh viên"}</div>
              <div className="level">
                <Icon name="sword" size={1.5} />
                <span className="display">Cấp {year}</span>
                <span className="dim">
                  · Năm {year} · HK{data.profile.currentSemester}
                </span>
              </div>
              <div className="faction">
                <Icon name="faction" size={1.5} />
                <span className="dim">Môn phái:</span>
                <b>{MAJOR_NAME}</b>
              </div>
            </div>
            <div className="avatar-frame">
              {data.profile.avatar ? (
                <img className="avatar-img" src={data.profile.avatar} alt="Ảnh đại diện" />
              ) : (
                <Mascot live />
              )}
            </div>
          </div>
          <div className="well stat-strip">
            <div className="stat">
              <div className="stat-label">
                <Icon name="heart" size={1} /> GPA
              </div>
              <div className="stat-value display">
                {formatGpa(stats.gpa)}
                {stats.gpa !== null && <small> / 10.0</small>}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">
                <Icon name="star" size={1} /> Hạng
              </div>
              <div className="stat-value display">{rankOf(stats.gpa)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">
                <Icon name="coin" size={1} /> Kinh nghiệm
              </div>
              {/* Số: TC tích lũy thực tế (có thể vượt 138). Thanh, % và “Còn lại”: phần tính vào
                  yêu cầu tốt nghiệp, đầy và đổi màu hoàn thành khi đủ 138 TC theo từng khối. */}
              <div className="xp-line">
                <span>
                  {stats.earned}{" "}
                  <small className="dim">
                    ({((stats.counted / TOTAL_CREDITS_REQUIRED) * 100).toFixed(1)}%)
                  </small>
                </span>
                <span>{TOTAL_CREDITS_REQUIRED}</span>
              </div>
              <Bar
                value={stats.counted}
                max={TOTAL_CREDITS_REQUIRED}
                label="Số tín chỉ tích lũy theo yêu cầu tốt nghiệp"
              />
              <div className="xp-line dim" style={{ justifyContent: "flex-end" }}>
                <span>Còn lại: {stats.missing}</span>
              </div>
            </div>
          </div>
        </button>

        <div className="dash-right">
          {/* Nhắc lịch thi */}
          <Panel title="Sự kiện" icon="hourglass">
            {exam && parts ? (
              <div className="countdown">
                <div>
                  <div className="dim" style={{ marginLeft: 4 }}>
                    ĐẾM NGƯỢC:
                  </div>
                  <div className="count-boxes">
                    {[
                      ["Ngày", parts.days, true],
                      ["Tháng", parts.months, false],
                      ["Giờ", parts.hours, false],
                      ["Phút", parts.minutes, false],
                    ].map(([label, value, hot]) => (
                      <div key={label as string} className={`count-box${hot ? " is-hot" : ""}`}>
                        <b className="display">{pad2(value as number)}</b>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="exam-info">
                  <div className="display">
                    {keepWords(COURSE_BY_ID.get(exam.courseId)?.name ?? exam.courseId)}
                  </div>
                  <div>
                    {EXAM_KIND[exam.kind]} · {shortDate(examDate(exam))} · {exam.time}
                  </div>
                  <div>Phòng thi: {exam.room}</div>
                </div>
              </div>
            ) : (
              <p className="dim">Chưa có lịch thi sắp tới.</p>
            )}
          </Panel>

          {/* 4 khối kiến thức */}
          <Panel title="Kỹ năng" icon="star">
            {stats.blocks.map((block) => (
              <div className="skill" key={block.id}>
                <div className="skill-head">
                  <span>{block.name}</span>
                  <span>
                    {block.earned}/{block.required} TC
                  </span>
                </div>
                <Bar
                  value={block.earned}
                  max={block.required}
                  label={`Tiến độ khối ${block.name}`}
                />
              </div>
            ))}
          </Panel>
        </div>
      </div>

      <div className="dash-bottom">
        {/* Cảnh báo còn thiếu */}
        <Panel title="Nhiệm vụ" icon="scroll">
          {stats.warnings.length === 0 ? (
            <div className="empty">
              <Mascot scale={3} mood="happy" />
              <p>Bạn đã hoàn thành đủ yêu cầu.</p>
            </div>
          ) : (
            <>
              <div className="quest-head">
                <span>Học phần · khối kiến thức</span>
                <span>Loại HP</span>
                <span>Cảnh báo</span>
              </div>
              <div className="quest-scroll">
                {stats.warnings.map((warning) => (
                  <button
                    key={warning.key}
                    className={`quest-row${warning.tone === "failed" ? " is-failed" : ""}`}
                    onClick={() => navigate("courses", warning.focus)}
                  >
                    <span className="q-subject">
                      {keepWords(warning.subject)}
                      <small className="q-block">{keepWords(warning.blockName)}</small>
                    </span>
                    <span className="q-kind">
                      <span className="badge">{warning.kind}</span>
                    </span>
                    <span className="q-message">{keepWords(warning.message)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Panel>

        {/* Điều kiện tốt nghiệp */}
        <Panel title="Trùm cuối" icon="skull">
          <div className="well">
            {stats.checks.map((check) => (
              <div key={check.key} className={`check${check.done ? " is-done" : ""}`}>
                <span className="check-box" aria-hidden="true">
                  {check.done ? "✓" : ""}
                </span>
                <span>
                  <span className="sr-only">{check.done ? "Đã đạt: " : "Chưa đạt: "}</span>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
          {stats.graduationReady && (
            <div className="boss-ready display">Đủ điều kiện tốt nghiệp</div>
          )}
        </Panel>
      </div>
    </>
  );
}

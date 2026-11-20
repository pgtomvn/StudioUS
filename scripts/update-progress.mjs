import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const usage = `Cập nhật PROGRESS.md sau mỗi bước (chỉ một agent ghi tại một thời điểm).

npm run progress -- --step SETUP-03 --status done --agent root --message "Kết quả, file và kiểm tra thực tế."

Trạng thái: todo | in_progress | blocked | done
Thêm dòng công việc vào bảng trước nếu mã chưa tồn tại.
Thêm --dry-run để xem nội dung mà không ghi file.`;

const allowed = new Set(["--step", "--status", "--agent", "--message"]);
const args = process.argv.slice(2);
const values = {};
let dryRun = false;

function fail(message) {
  console.error(`${message}\n\n${usage}`);
  process.exit(1);
}

if (args.includes("--help")) {
  console.log(usage);
  process.exit(0);
}

for (let i = 0; i < args.length; i += 1) {
  const key = args[i];
  if (key === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (!allowed.has(key) || !args[i + 1] || args[i + 1].startsWith("--")) {
    fail(`Tham số không hợp lệ: ${key}`);
  }
  if (values[key]) fail(`Tham số bị lặp: ${key}`);
  values[key] = args[++i].trim();
}

for (const key of allowed) {
  if (!values[key]) fail(`Thiếu ${key}`);
}

const step = values["--step"];
const status = values["--status"];
if (!/^[A-Z]+-\d+$/.test(step)) fail("Mã công việc cần có dạng SETUP-03.");
if (!["todo", "in_progress", "blocked", "done"].includes(status)) fail("Trạng thái không hợp lệ.");

// Prevent a message from breaking the Markdown table or adding new rows.
function cell(value) {
  return value
    .replaceAll("|", "&#124;")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

const progressPath = fileURLToPath(new URL("../PROGRESS.md", import.meta.url));
const original = readFileSync(progressPath, "utf8").replaceAll("\r\n", "\n");
const marker = "## Nhật ký theo bước";
const markerIndex = original.indexOf(marker);
if (markerIndex < 0) fail("Không tìm thấy mục nhật ký trong PROGRESS.md.");
const overview = original.slice(0, markerIndex);
const lines = overview.split("\n");
const taskIndex = lines.findIndex(
  (line) => line.startsWith("|") && line.split("|")[1]?.trim() === step,
);
if (taskIndex < 0) fail(`Chưa có ${step} trong bảng công việc. Thêm dòng công việc trước.`);

const agent = cell(values["--agent"]);
const message = cell(values["--message"]);
const columns = lines[taskIndex].split("|");
if (columns.length !== 8) fail("Dòng công việc không đúng 6 cột như mẫu.");
columns[3] = ` ${status} `;
columns[4] = ` ${agent} `;
columns[6] = ` ${message} `;
lines[taskIndex] = columns.join("|");

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
}).formatToParts(new Date());
const part = (type) => parts.find((entry) => entry.type === type).value;
const timestamp = `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")} +07:00`;
const record = `| ${timestamp} | ${step} | ${status} | ${agent} | ${message} |`;
const updated = `${lines.join("\n")}${original.slice(markerIndex).trimEnd()}\n${record}\n`;

if (dryRun) {
  console.log(`DRY RUN: ${lines[taskIndex]}\n${record}`);
} else {
  // Check for an intervening edit; coordination still requires a single writer.
  const current = readFileSync(progressPath, "utf8").replaceAll("\r\n", "\n");
  if (current !== original) fail("PROGRESS.md vừa thay đổi. Đọc lại trước khi cập nhật.");
  writeFileSync(progressPath, updated, "utf8");
  console.log(`Đã cập nhật ${step}: ${status}\n${record}`);
}

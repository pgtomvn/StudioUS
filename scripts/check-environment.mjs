import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const requiredPaths = [
  "AGENTS.md",
  "PROGRESS.md",
  "docs/architecture.md",
  "docs/project-scope.md",
  "docs/data-sources.md",
  "docs/requirements/traceability.md",
  "docs/testing/test-plan.md",
  "docs/ai/usage-log.md",
  "docs/planning/work-plan.md",
  "docs/meetings/README.md",
  "docs/design",
  "docs/references",
  "src/domain",
  "src/features/dashboard",
  "src/features/curriculum",
  "src/features/academic-records",
  "src/features/data-management",
  "src/lib/storage",
  "src/types",
  "src/assets",
  "public/data",
  "public/icons",
  "tests/unit",
  "tests/integration",
  "tests/e2e",
];
// Tài liệu gốc của môn học và báo cáo nộp chỉ giữ ở máy (không đưa lên GitHub): thiếu thì chỉ cảnh báo.
const localOnlyPaths = ["projectDetail.pdf", "projectRequirement.pdf", "deliverables"];

let failed = false;
function report(ok, label) {
  console.log(`${ok ? "OK" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}

console.log(`${packageJson.name}: kiểm tra môi trường công cụ, chưa kiểm thử ứng dụng.\n`);
report(Number(process.versions.node.split(".")[0]) === 24, `Node.js ${process.version} (cần 24.x)`);

// npm supplies its executable path to lifecycle scripts on all supported shells.
const npmCli = process.env.npm_execpath;
const npmResult = npmCli
  ? spawnSync(process.execPath, [npmCli, "--version"], { encoding: "utf8", cwd: root })
  : null;
const npmVersion = npmResult?.stdout?.trim();
report(
  npmResult?.status === 0 && npmVersion?.startsWith("11."),
  `npm ${npmVersion || "không tìm thấy; dùng npm run doctor"} (cần 11.x)`,
);

const git = spawnSync("git", ["--version"], { encoding: "utf8", cwd: root });
report(git.status === 0, git.stdout?.trim() || "Git chưa có trong PATH");

for (const entry of requiredPaths) {
  report(existsSync(path.join(root, entry)), entry);
}

for (const entry of localOnlyPaths) {
  const ok = existsSync(path.join(root, entry));
  console.log(
    `${ok ? "OK" : "WARN"} ${entry}${ok ? "" : " (tài liệu chỉ có ở máy, không có trong repo)"}`,
  );
}

report(
  existsSync(path.join(root, "node_modules/prettier/package.json")),
  "Prettier đã cài (npm ci)",
);
report(existsSync(path.join(root, "package-lock.json")), "package-lock.json có sẵn");
console.log(
  "\nCông nghệ: Vite + React + TypeScript (chốt 11/11/2026). Không yêu cầu Docker, backend hoặc dịch vụ trực tuyến.",
);
process.exitCode = failed ? 1 : 0;

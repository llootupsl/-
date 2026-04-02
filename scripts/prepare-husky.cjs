const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");

if (!existsSync(".git")) {
  console.log("[prepare] skip husky: no .git directory");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["husky"], { stdio: "inherit" });

if (result.error) {
  console.error("[prepare] failed to initialize husky:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);

import "../server/env";
import { spawn, type ChildProcess } from "node:child_process";
const portIndex = process.argv.indexOf("--port");
const port =
  portIndex >= 0
    ? Number(process.argv[portIndex + 1])
    : Number(process.env.WEB_PORT || 3000);
const apiPort = Number(process.env.API_PORT || port + 1000);
const env = {
  ...process.env,
  NODE_ENV: "development",
  WEB_PORT: String(port),
  API_PORT: String(apiPort),
  SITE_URL: `http://127.0.0.1:${port}`,
};
const children: ChildProcess[] = [];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === "win32")
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    else child.kill("SIGTERM");
  }
}
for (const [script, args] of [
  ["node_modules/tsx/dist/cli.mjs", ["server/index.ts"]],
  ["node_modules/vite/bin/vite.js", []],
] as const) {
  const child = spawn(process.execPath, [script, ...args], {
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  children.push(child);
  child.on("error", () => {
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (!stopping) {
      process.exitCode = code || 0;
      stop();
    }
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("exit", stop);

import { spawn, type ChildProcess } from "node:child_process";
const production = process.argv.includes("--production");
const env = {
  ...process.env,
  DATABASE_URL: "",
  SITE_URL: "http://127.0.0.1:3000",
  API_PORT: production ? "3000" : "4000",
  NODE_ENV: production ? "production" : "development",
};
let server: ChildProcess | undefined;
async function stop() {
  if (!server?.pid) return;
  if (process.platform === "win32")
    await new Promise<void>((resolve) => {
      const child = spawn(
        "taskkill",
        ["/PID", String(server!.pid), "/T", "/F"],
        { windowsHide: true, stdio: "ignore" },
      );
      child.on("exit", () => resolve());
      child.on("error", () => resolve());
    });
  else server.kill("SIGTERM");
}
async function main() {
  try {
    await fetch("http://127.0.0.1:3000/api/health");
    throw new Error(
      "Port 3000 is already in use; stop the local server before browser tests.",
    );
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Port")) throw e;
  }
  server = spawn(
    process.execPath,
    production
      ? ["dist/server/index.cjs"]
      : ["node_modules/tsx/dist/cli.mjs", "scripts/dev.ts"],
    { env, stdio: "ignore", windowsHide: true },
  );
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw new Error("Browser test server exited");
    try {
      const r = await fetch("http://127.0.0.1:3000/api/health");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for both processes. */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw new Error("Browser test server did not start");
  await new Promise<void>((resolve, reject) => {
    const test = spawn(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test"],
      { env, stdio: "inherit", windowsHide: true },
    );
    test.on("error", reject);
    test.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Browser tests failed")),
    );
  });
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(stop);

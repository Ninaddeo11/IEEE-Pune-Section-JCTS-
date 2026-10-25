import EmbeddedPostgres from "embedded-postgres";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { seedEntries } from "../lib/seed-data";
import { roles } from "../lib/content";
const root = process.cwd();
const databaseDir = path.resolve(root, ".test-db", randomUUID());
if (!databaseDir.startsWith(path.resolve(root, ".test-db") + path.sep))
  throw new Error("Unsafe test database path");
const password = randomBytes(24).toString("hex");
const adminPassword = randomBytes(24).toString("hex");
const databaseUrl = `postgresql://jcts_test:${password}@127.0.0.1:55432/jcts_test?schema=public`;
const env:NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "development",
  STORAGE_DRIVER: "local",
  DATABASE_URL: databaseUrl,
  CMS_TEST_PASSWORD: adminPassword,
  NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
  NEXT_TELEMETRY_DISABLED: "1",
};
const postgres = new EmbeddedPostgres({
  databaseDir,
  user: "jcts_test",
  password,
  port: 55432,
  persistent: false,
  createPostgresUser: false,
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
let server: ChildProcess | undefined;
function run(script: string, args: string[] = []) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Test command failed (${code})`)),
    );
  });
}
async function main() {
  console.log("Starting isolated local PostgreSQL test database…");
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase("jcts_test");
  await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  const db = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    for (const { id, ...entry } of seedEntries)
      await db.content.create({
        data: {
          id,
          ...entry,
          status: "PUBLISHED",
          data: JSON.parse(JSON.stringify(entry.data)),
        },
      });
    for (const role of roles)
      await db.user.create({
        data: {
          email: `${role.toLowerCase()}@cms-test.invalid`,
          name: `Test ${role}`,
          passwordHash: await hash(adminPassword, 12),
          role,
        },
      });
  } finally {
    await db.$disconnect();
  }
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "-p", "3001"],
    { cwd: root, env, stdio: "ignore", windowsHide: true },
  );
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      const result = await fetch("http://localhost:3001/admin");
      if (result.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) throw new Error("CMS test server did not become ready");
  console.log("Running authenticated CMS integration checks…");
  await run("node_modules/@playwright/test/cli.js", [
    "test",
    "--config",
    "playwright.cms.config.ts",
  ]);
}
let exitCode = 0;
main()
  .catch((e) => {
    console.error(e.message);
    exitCode = 1;
  })
  .finally(async () => {
    if (server?.pid) {
      if (process.platform === "win32")
        await new Promise<void>((resolve) => {
          const stopper = spawn(
            "taskkill",
            ["/PID", String(server!.pid), "/T", "/F"],
            { windowsHide: true, stdio: "ignore" },
          );
          stopper.once("exit", () => resolve());
          stopper.once("error", () => resolve());
        });
      else server.kill();
    }
    await postgres.stop();
    console.log("Isolated test services stopped.");
    process.exit(exitCode);
  });

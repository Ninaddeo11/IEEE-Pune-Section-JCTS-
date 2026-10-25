import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/cms",
  workers: 1,
  timeout: 60000,
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3001", channel: "chrome", headless: true },
  reporter: "list",
});

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/cms",
  workers: 1,
  timeout: 60000,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3001", channel: "chrome", headless: true },
  reporter: "list",
});

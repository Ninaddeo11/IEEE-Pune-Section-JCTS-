import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("public pages meet automated WCAG 2.2 AA checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/activities", "/contact", "/admin"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      route,
    ).toEqual([]);
  }
});
test("homepage renders without page errors or horizontal overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Technology.",
  );
  await expect(
    page.getByRole("link", { name: "Explore activities", exact: true }),
  ).toBeVisible();
  for (const section of await page.locator("main>section").all()) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  await page.screenshot({
    path: `artifacts/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({ path: `artifacts/hero-${info.project.name}.png` });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("activity filters, search and details work", async ({ page }) => {
  await page.goto("/activities");
  await page.getByRole("button", { name: "Humanitarian", exact: true }).click();
  await expect(page.getByText("2 results", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("searchbox").fill("Campus to Corporate");
  await expect(page.getByText("1 result", { exact: true })).toBeVisible();
  await page
    .getByRole("heading", { name: "Campus to Corporate", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Campus to Corporate",
  );
  await expect(
    page.getByRole("listitem").filter({ hasText: "Mr. Dhiraj Mani Chauraisa" }),
  ).toBeVisible();
});
test("all public sections and search respond", async ({ page, request }) => {
  for (const route of [
    "/about",
    "/leadership",
    "/research",
    "/publications",
    "/membership",
    "/opportunities",
    "/resources",
    "/news",
    "/gallery",
    "/contact",
    "/privacy",
    "/terms",
    "/sitemap.xml",
    "/robots.txt",
  ]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
  await page.goto("/search?q=Quantum");
  await expect(
    page.getByRole("heading", { name: /Third International Conference/ }),
  ).toBeVisible();
  await page.goto("/activities/eureka-2026");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "EU-REKA 2026",
  );
  await expect(
    page.getByText("School Children", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("2,19,970");
});
test("admin routes and writes require authentication", async ({
  page,
  request,
}) => {
  await page.goto("/admin/activities/new");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  for (const endpoint of ["/api/content", "/api/media", "/api/users"]) {
    const result = await request.post(endpoint, {
      headers: { Origin: "http://localhost:3000" },
      data: {},
    });
    expect(result.status()).toBeGreaterThanOrEqual(400);
  }
  const external = await request.post("/api/content", {
    headers: { Origin: "https://attacker.invalid" },
    data: {},
  });
  expect(external.status()).toBe(400);
});
test("reduced motion uses a non-WebGL fallback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".fallback-system")).toBeVisible();
  await expect(page.locator(".webgl-scene")).toHaveCount(0);
});
test("search dialog and mobile menu support keyboard interaction", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Leadership", exact: true })
      .click();
    await expect(page).toHaveURL(/\/leadership$/);
  }
});

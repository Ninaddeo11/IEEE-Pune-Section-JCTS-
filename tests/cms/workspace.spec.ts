import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { blankEntry, collections, roles, canManage } from "../../lib/content";
let admin: APIRequestContext;
const db = new PrismaClient();
const origin = { Origin: "http://localhost:3001" };
test.beforeAll(async ({ playwright }) => {
  admin = await playwright.request.newContext({
    baseURL: "http://localhost:3001",
    extraHTTPHeaders: origin,
  });
  const response = await admin.post("/api/auth", {
    data: {
      email: "super_admin@cms-test.invalid",
      password: process.env.CMS_TEST_PASSWORD,
    },
  });
  expect(response.status()).toBe(200);
});
test.afterAll(async () => {
  await admin?.dispose();
  await db.$disconnect();
});
test("homepage, page copy, navigation and private homepage previews use CMS records", async ({
  request,
}) => {
  const hero = await db.content.findUniqueOrThrow({
    where: { collection_slug: { collection: "homepage", slug: "hero" } },
  });
  const about = await db.content.findUniqueOrThrow({
    where: { collection_slug: { collection: "pages", slug: "about" } },
  });
  const nav = await db.content.findUniqueOrThrow({
    where: { collection_slug: { collection: "navigation", slug: "about" } },
  });
  try {
    expect(
      (
        await admin.post("/api/content", {
          data: { ...hero, title: "CMS driven home." },
        })
      ).ok(),
    ).toBe(true);
    expect(await (await request.get("/")).text()).toContain("CMS driven home");
    expect(
      (
        await admin.post("/api/content", {
          data: { ...about, title: "A chapter shaped by its community." },
        })
      ).ok(),
    ).toBe(true);
    expect(await (await request.get("/about")).text()).toContain(
      "A chapter shaped by its community.",
    );
    expect(
      (
        await admin.post("/api/content", {
          data: { ...nav, title: "Chapter Story" },
        })
      ).ok(),
    ).toBe(true);
    expect(await (await request.get("/")).text()).toContain("Chapter Story");
    const preview = await (
      await admin.post("/api/preview", {
        data: { ...hero, title: "Private homepage proposal." },
      })
    ).json();
    expect(await (await admin.get(`/?preview=${preview.id}`)).text()).toContain(
      "Private homepage proposal",
    );
    expect(
      await (await request.get(`/?preview=${preview.id}`)).text(),
    ).not.toContain("Private homepage proposal");
  } finally {
    for (const record of [hero, about, nav])
      await admin.post("/api/content", { data: record });
  }
});
test("an administrator can create, preview, publish, unpublish and delete an activity", async ({
  page,
  request,
}) => {
  await page.context().addCookies((await admin.storageState()).cookies);
  await page.goto("/admin/activities/new");
  await page
    .getByLabel("Title", { exact: true })
    .fill("Integration workshop 2029");
  await page
    .getByLabel("Short description")
    .fill("A temporary integration test workshop.");
  await page
    .locator(".tiptap")
    .fill("A rich text description for integration verification.");
  await page.getByLabel("Date", { exact: true }).fill("2029-05-01");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/content") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  expect((await saved).ok()).toBe(true);
  await expect(page).toHaveURL(/\/admin\/activities\/(?!new$)[^/]+$/);
  const record = await db.content.findUniqueOrThrow({
    where: {
      collection_slug: {
        collection: "activities",
        slug: "integration-workshop-2029",
      },
    },
  });
  expect(
    (await request.get("/activities/integration-workshop-2029")).status(),
  ).toBe(404);
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Preview changes ↗" }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading", { level: 1 })).toHaveText(
    "Integration workshop 2029",
  );
  await popup.close();
  await page.getByRole("button", { name: "Publish ↗", exact: true }).click();
  await expect(page.locator(".admin-heading .status")).toHaveText("PUBLISHED");
  expect(
    (await request.get("/activities/integration-workshop-2029")).status(),
  ).toBe(200);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator(".admin-heading .status")).toHaveText("DRAFT");
  expect(
    (await request.get("/activities/integration-workshop-2029")).status(),
  ).toBe(404);
  await page.screenshot({ path: "artifacts/cms-editor.png", fullPage: true });
  expect(
    (await admin.delete("/api/content", { data: { id: record.id } })).ok(),
  ).toBe(true);
});
test("every editorial collection supports persistent CRUD and audit records", async () => {
  for (const collection of collections) {
    const payload = {
      ...blankEntry,
      collection,
      title: `CMS integration ${collection}`,
      slug: "cms-integration-test",
      body: "Database-backed content",
      status: "DRAFT",
      data: collection === "statistics" ? { value: 10 } : {},
    };
    let response = await admin.post("/api/content", { data: payload });
    expect(response.ok(), await response.text()).toBe(true);
    let record = await response.json();
    response = await admin.post("/api/content", {
      data: { ...record, title: `Updated ${collection}`, status: "PUBLISHED" },
    });
    expect(response.ok(), await response.text()).toBe(true);
    record = await response.json();
    expect(
      (await db.content.findUniqueOrThrow({ where: { id: record.id } })).title,
    ).toBe(`Updated ${collection}`);
    expect(
      (
        await admin.post("/api/content", {
          data: { ...record, status: "ARCHIVED" },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (await admin.delete("/api/content", { data: { id: record.id } })).ok(),
    ).toBe(true);
    expect(await db.auditLog.count({ where: { target: record.id } })).toBe(4);
  }
});
test("private preview snapshots do not change published content", async ({
  request,
}) => {
  const payload = {
    ...blankEntry,
    collection: "news",
    title: "Published original",
    slug: "preview-isolation",
    summary: "Original summary",
    status: "PUBLISHED",
  };
  const record = await (
    await admin.post("/api/content", { data: payload })
  ).json();
  const preview = await (
    await admin.post("/api/preview", {
      data: { ...record, title: "Private proposed title" },
    })
  ).json();
  expect(
    (await db.content.findUniqueOrThrow({ where: { id: record.id } })).title,
  ).toBe("Published original");
  const publicResponse = await request.get(
    `/news/preview-isolation?preview=${preview.id}`,
  );
  expect(await publicResponse.text()).not.toContain(
    "<h1>Private proposed title</h1>",
  );
  expect(
    (await admin.get(`/news/preview-isolation?preview=${preview.id}`)).status(),
  ).toBe(200);
  await admin.delete("/api/content", { data: { id: record.id } });
});
test("media upload, replacement, reference protection and deletion work", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQioAAAAASUVORK5CYII=",
    "base64",
  );
  let response = await admin.post("/api/media", {
    multipart: {
      file: { name: "test.png", mimeType: "image/png", buffer: png },
      alt: "Integration test pixel",
      folder: "Tests",
      tags: "test",
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const media = await response.json();
  expect((await admin.get(media.url)).status()).toBe(200);
  response = await admin.patch("/api/media", {
    multipart: {
      id: media.id,
      alt: "Updated test pixel",
      file: { name: "replacement.png", mimeType: "image/png", buffer: png },
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const content = await (
    await admin.post("/api/content", {
      data: {
        ...blankEntry,
        title: "Media references",
        slug: "media-references",
        data: { gallery: [{ url: media.url, alt: "Test pixel" }] },
      },
    })
  ).json();
  expect(
    (await admin.delete("/api/media", { data: { id: media.id } })).ok(),
  ).toBe(false);
  await admin.delete("/api/content", { data: { id: content.id } });
  expect(
    (await admin.delete("/api/media", { data: { id: media.id } })).ok(),
  ).toBe(true);
  const rejected = await admin.post("/api/media", {
    multipart: {
      file: {
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from('<svg onload="alert(1)">'),
      },
      alt: "Invalid content",
    },
  });
  expect(rejected.ok()).toBe(false);
});
test("public contact messages persist and can be resolved by admins", async ({
  request,
  page,
}) => {
  const response = await request.post("/api/contact", {
    headers: origin,
    data: {
      name: "Integration Tester",
      email: "visitor@cms-test.invalid",
      subject: "CMS contact test",
      message: "This message verifies the database contact workflow.",
      website: "",
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const message = await db.contactMessage.findFirstOrThrow({
    where: { subject: "CMS contact test" },
  });
  expect(message.status).toBe("unread");
  expect(
    (
      await admin.patch("/api/messages", {
        data: { id: message.id, status: "resolved" },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (await db.contactMessage.findUniqueOrThrow({ where: { id: message.id } }))
      .status,
  ).toBe("resolved");
  await page.context().addCookies((await admin.storageState()).cookies);
  await page.goto("/admin/messages");
  await expect(
    page.getByRole("heading", { name: "CMS contact test" }),
  ).toBeVisible();
});
test("all seven roles enforce collection permissions and disabled sessions are revoked", async ({
  playwright,
}) => {
  for (const role of roles) {
    const session = await playwright.request.newContext({
      baseURL: "http://localhost:3001",
      extraHTTPHeaders: origin,
    });
    expect(
      (
        await session.post("/api/auth", {
          data: {
            email: `${role.toLowerCase()}@cms-test.invalid`,
            password: process.env.CMS_TEST_PASSWORD,
          },
        })
      ).ok(),
    ).toBe(true);
    const permitted = collections.find((c) => canManage(role, c));
    if (permitted) {
      const response = await session.post("/api/content", {
        data: {
          ...blankEntry,
          collection: permitted,
          title: `Role test ${role}`,
          slug: `role-test-${role.toLowerCase().replace(/_/g, "-")}`,
          data: permitted === "statistics" ? { value: 1 } : {},
        },
      });
      expect(response.ok(), await response.text()).toBe(true);
      await admin.delete("/api/content", {
        data: { id: (await response.json()).id },
      });
    }
    const denied = collections.find((c) => !canManage(role, c));
    if (denied) {
      const response = await session.post("/api/content", {
        data: {
          ...blankEntry,
          collection: denied,
          title: "Denied write",
          slug: "denied-write",
        },
      });
      expect(response.ok()).toBe(false);
      expect(await db.content.count({ where: { slug: "denied-write" } })).toBe(
        0,
      );
    }
    if (role === "VIEWER") {
      const viewer = await db.user.findUniqueOrThrow({
        where: { email: "viewer@cms-test.invalid" },
      });
      expect(
        (
          await admin.patch("/api/users", {
            data: { id: viewer.id, active: false },
          })
        ).ok(),
      ).toBe(true);
      expect(await db.session.count({ where: { userId: viewer.id } })).toBe(0);
    }
    await session.dispose();
  }
});
test("scheduling changes public visibility without exposing future drafts", async ({
  request,
}) => {
  const record = await (
    await admin.post("/api/content", {
      data: {
        ...blankEntry,
        title: "Scheduled test",
        slug: "scheduled-test",
        status: "SCHEDULED",
        publishAt: new Date(Date.now() + 86400000).toISOString(),
      },
    })
  ).json();
  expect((await request.get("/activities/scheduled-test")).status()).toBe(404);
  await admin.post("/api/content", {
    data: { ...record, publishAt: new Date(Date.now() - 60000).toISOString() },
  });
  expect((await request.get("/activities/scheduled-test")).status()).toBe(200);
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "/activities/scheduled-test",
  );
  await admin.delete("/api/content", { data: { id: record.id } });
});

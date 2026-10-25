import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { blankEntry, collections, roles, canManage } from "../../lib/content";
let admin: APIRequestContext;
const db = new PrismaClient();
const origin = { Origin: "http://127.0.0.1:3001" };
test.beforeAll(async ({ playwright }) => {
  admin = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3001",
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
    for (const record of [hero, about, nav]) {
      const fresh = await db.content.findUniqueOrThrow({
        where: { id: record.id },
      });
      await admin.post("/api/content", {
        data: { ...record, version: fresh.version },
      });
    }
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
      baseURL: "http://127.0.0.1:3001",
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

test("required activity workflow: event manager submits, chapter admin publishes, public distribution and concurrency", async ({
  playwright,
  request,
}) => {
  const event = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3001",
    extraHTTPHeaders: origin,
  });
  const chapter = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3001",
    extraHTTPHeaders: origin,
  });
  for (const [ctx, role] of [
    [event, "event_manager"],
    [chapter, "chapter_admin"],
  ] as const)
    expect(
      (
        await ctx.post("/api/auth", {
          data: {
            email: `${role}@cms-test.invalid`,
            password: process.env.CMS_TEST_PASSWORD,
          },
        })
      ).ok(),
    ).toBe(true);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQioAAAAASUVORK5CYII=",
    "base64",
  );
  const upload = await event.post("/api/media", {
    multipart: {
      file: { name: "banner.png", mimeType: "image/png", buffer: png },
      alt: "Workshop banner",
    },
  });
  expect(upload.ok(), await upload.text()).toBe(true);
  const media = await upload.json();
  const input = {
    ...blankEntry,
    title: "AI & Cybersecurity for Schools",
    slug: "ai-cybersecurity-for-schools",
    category: "Technical",
    date: "2026-11-15",
    summary: "A student-focused workshop on AI and cybersecurity.",
    body: "A student-focused workshop on AI and cybersecurity.",
    image: media.url,
    imageAlt: media.alt,
    featured: true,
    homepage: true,
    data: {
      venue: "Saraswati International School",
      startTime: "10:00",
      endTime: "12:00",
      timezone: "Asia/Kolkata",
      format: "Offline",
      speakers: ["Test speaker"],
      registrationUrl: "https://example.org/register",
      registrationStatus: "Open",
    },
  };
  let response = await event.post("/api/content", { data: input });
  expect(response.ok(), await response.text()).toBe(true);
  let record = await response.json();
  try {
    expect((await request.get(`/activities/${record.slug}`)).status()).toBe(
      404,
    );
    const snapshot = await (
      await event.post("/api/preview", { data: record })
    ).json();
    expect(
      (
        await event.get(`/activities/${record.slug}?preview=${snapshot.id}`)
      ).status(),
    ).toBe(200);
    expect(
      (
        await event.post("/api/content", {
          data: { ...record, status: "PUBLISHED" },
        })
      ).ok(),
    ).toBe(false);
    response = await event.post("/api/content", {
      data: { ...record, status: "REVIEW" },
    });
    expect(response.ok()).toBe(true);
    record = await response.json();
    response = await chapter.post("/api/content", {
      data: { ...record, status: "APPROVED" },
    });
    expect(response.ok()).toBe(true);
    record = await response.json();
    response = await chapter.post("/api/content", {
      data: { ...record, status: "PUBLISHED" },
    });
    expect(response.ok()).toBe(true);
    record = await response.json();
    expect((await request.get(`/activities/${record.slug}`)).status()).toBe(
      200,
    );
    for (const route of [
      "/activities?q=AI%20%26%20Cybersecurity",
      "/activities?category=Technical",
      "/upcoming?q=AI%20%26%20Cybersecurity",
      "/search?q=AI%20%26%20Cybersecurity",
      "/sitemap.xml",
    ])
      expect(await (await request.get(route)).text()).toContain(record.slug);
    const html = await (await request.get(`/activities/${record.slug}`)).text();
    expect(html).toContain("Saraswati International School");
    expect(html).toContain("04:30:00.000Z");
    expect(html).toContain("Test speaker");
    const homeSection = await (
      await admin.post("/api/content", {
        data: {
          ...blankEntry,
          collection: "homepage",
          slug: "acceptance-module",
          title: "Acceptance spotlight",
          status: "PUBLISHED",
          data: {
            kind: "spotlight",
            source: "activities",
            selection: "manual",
            selectedIds: [record.id],
            order: 20,
          },
        },
      })
    ).json();
    try {
      expect(await (await request.get("/")).text()).toContain(record.slug);
    } finally {
      await admin.delete("/api/content", { data: { id: homeSection.id } });
    }
    const stale = await chapter.post("/api/content", {
      data: {
        ...record,
        version: record.version - 1,
        title: "Stale overwrite",
      },
    });
    expect(stale.status()).toBe(409);
    const revisions = await (
      await chapter.get(`/api/revisions?id=${record.id}`)
    ).json();
    expect(revisions.length).toBeGreaterThanOrEqual(3);
    expect(
      (
        await event.post("/api/content", {
          data: { ...record, title: "Unauthorized public edit" },
        })
      ).ok(),
    ).toBe(false);
  } finally {
    await admin.delete("/api/content", { data: { id: record.id } });
    await admin.delete("/api/media", { data: { id: media.id } });
    await event.dispose();
    await chapter.dispose();
  }
});

test("reusable people, revision rollback, role isolation, password change and session revocation", async ({
  playwright,
  request,
}) => {
  const person = await (
    await admin.post("/api/content", {
      data: {
        ...blankEntry,
        collection: "people",
        slug: "test-person",
        title: "Test speaker profile",
        status: "PUBLISHED",
        data: { designation: "Test role", organization: "Test organization" },
      },
    })
  ).json();
  let item = await (
    await admin.post("/api/content", {
      data: {
        ...blankEntry,
        title: "People workflow",
        slug: "people-workflow",
        status: "DRAFT",
        data: { people: [{ personId: person.id, role: "Speaker" }] },
      },
    })
  ).json();
  try {
    expect(
      await db.contentParticipant.count({
        where: { activityId: item.id, personId: person.id },
      }),
    ).toBe(1);
    item = await (
      await admin.post("/api/content", {
        data: { ...item, status: "PUBLISHED" },
      })
    ).json();
    expect(
      await (await request.get("/activities/people-workflow")).text(),
    ).toContain("Test speaker profile");
    const revisions = await (
      await admin.get(`/api/revisions?id=${item.id}`)
    ).json();
    const restored = await admin.post("/api/content", {
      data: {
        ...revisions[0].payload,
        id: item.id,
        version: item.version,
        status: "DRAFT",
      },
    });
    expect(restored.ok()).toBe(true);
    expect((await request.get("/activities/people-workflow")).status()).toBe(
      404,
    );
    expect(
      (await admin.delete("/api/content", { data: { id: person.id } })).ok(),
    ).toBe(false);
  } finally {
    await admin.delete("/api/content", { data: { id: item.id } });
    await admin.delete("/api/content", { data: { id: person.id } });
  }
  const deniedUpload = await admin.post("/api/media", {
    multipart: {
      file: {
        name: "wrong.exe",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7"),
      },
      alt: "Invalid extension",
    },
  });
  expect(deniedUpload.ok()).toBe(false);
  const user = await db.user.create({
    data: {
      email: "account-test@cms-test.invalid",
      name: "Account Test",
      role: "EVENT_MANAGER",
      passwordHash: await (
        await import("bcryptjs")
      ).hash("Initial-test-password-123", 12),
    },
  });
  const ctx = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3001",
    extraHTTPHeaders: { ...origin, "x-forwarded-for": "127.0.0.2" },
  });
  try {
    expect(
      (
        await ctx.post("/api/auth", {
          data: { email: user.email, password: "Initial-test-password-123" },
        })
      ).ok(),
    ).toBe(true);
    expect((await ctx.get("/admin/research")).status()).toBe(404);
    expect(
      (
        await ctx.patch("/api/users", {
          data: { id: user.id, role: "SUPER_ADMIN" },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (
        await ctx.post("/api/account", {
          data: {
            currentPassword: "wrong",
            password: "Replacement-password-123",
          },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (
        await ctx.post("/api/account", {
          data: {
            currentPassword: "Initial-test-password-123",
            password: "Replacement-password-123",
          },
        })
      ).ok(),
    ).toBe(true);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
    expect((await ctx.delete("/api/account")).ok()).toBe(true);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
  } finally {
    await ctx.dispose();
  }
});

test("publishing grants revoke sessions and managed categories cannot be renamed while in use", async ({
  playwright,
}) => {
  const password = "Grant-test-password-123";
  const user = await db.user.create({
    data: {
      email: "grant-test@cms-test.invalid",
      name: "Grant Test",
      role: "EVENT_MANAGER",
      passwordHash: await (await import("bcryptjs")).hash(password, 12),
    },
  });
  const ctx = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3001",
    extraHTTPHeaders: { ...origin, "x-forwarded-for": "127.0.0.3" },
  });
  const login = () =>
    ctx.post("/api/auth", { data: { email: user.email, password } });
  const category = await (
    await admin.post("/api/content", {
      data: {
        ...blankEntry,
        collection: "categories",
        slug: "integration-category",
        title: "Integration category",
        status: "PUBLISHED",
      },
    })
  ).json();
  let item: { id: string; version: number; status: string } | undefined;
  try {
    expect((await login()).ok()).toBe(true);
    const response = await ctx.post("/api/content", {
      data: {
        ...blankEntry,
        title: "Grant workflow",
        slug: "grant-workflow",
        category: category.title,
        status: "REVIEW",
      },
    });
    expect(response.ok()).toBe(true);
    item = await response.json();
    expect(
      (
        await ctx.post("/api/content", {
          data: { ...blankEntry, ...item, status: "PUBLISHED" },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (
        await admin.patch("/api/users", {
          data: { id: user.id, permissions: ["activities:PUBLISH"] },
        })
      ).ok(),
    ).toBe(true);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect((await login()).ok()).toBe(true);
    const published = await ctx.post("/api/content", {
      data: { ...item, status: "PUBLISHED" },
    });
    expect(published.ok(), await published.text()).toBe(true);
    item = await published.json();
    expect(
      (
        await admin.post("/api/content", {
          data: { ...category, title: "Renamed category" },
        })
      ).ok(),
    ).toBe(false);
    expect(
      (await admin.delete("/api/content", { data: { id: category.id } })).ok(),
    ).toBe(false);
  } finally {
    if (item) await admin.delete("/api/content", { data: { id: item.id } });
    await admin.delete("/api/content", { data: { id: category.id } });
    await ctx.dispose();
  }
});
test("activity database filters paginate and search structured metadata", async () => {
  const fixtureIds: string[] = [];
  try {
    for (let i = 0; i < 13; i++) {
      const response = await admin.post("/api/content", {
        data: {
          ...blankEntry,
          title: `Pagination fixture ${i}`,
          slug: `pagination-fixture-${i}`,
          category: "Technical",
          status: "PUBLISHED",
          data: { speakers: ["StructuredSearchToken"], format: "Online" },
        },
      });
      expect(response.ok()).toBe(true);
      fixtureIds.push((await response.json()).id);
    }
    const { activityQuery } = await import("../../lib/activity-query");
    const first = await activityQuery({
      q: "StructuredSearchToken",
      category: "Technical",
      format: "Online",
      page: "1",
    });
    const second = await activityQuery({
      q: "StructuredSearchToken",
      page: "2",
    });
    expect(first.total).toBe(13);
    expect(first.items.length).toBe(12);
    expect(second.items.length).toBe(1);
    expect(first.items.some((e) => e.id === second.items[0].id)).toBe(false);
  } finally {
    for (const id of fixtureIds)
      await admin.delete("/api/content", { data: { id } });
  }
});

test("legacy event timestamp backfill preserves content and applies its timezone", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(
    "prisma/migrations/202610250001_modular_platform/migration.sql",
    "utf8",
  );
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) =>
      /^UPDATE "Content" SET "(startsAt|endsAt|scheduledAt)"/.test(s),
    );
  expect(statements.length).toBeGreaterThanOrEqual(3);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`CREATE TEMP TABLE "LegacyContent" (LIKE "Content" INCLUDING ALL) ON COMMIT DROP`;
    await tx.$executeRaw`INSERT INTO "LegacyContent" ("id","collection","slug","title","date","endDate","publishAt","data","updatedAt") VALUES ('legacy-event','activities','legacy-event','Legacy event','2026-11-15','2026-11-15','2026-11-01T00:00:00Z','{"timezone":"Asia/Kolkata","startTime":"10:00","endTime":"12:00"}'::jsonb,NOW())`;
    for (const statement of statements)
      await tx.$executeRawUnsafe(
        statement.replaceAll('"Content"', '"LegacyContent"'),
      );
    const rows = await tx.$queryRaw<
      {
        title: string;
        date: string;
        startsAt: Date;
        endsAt: Date;
        scheduledAt: Date;
      }[]
    >`SELECT "title","date","startsAt","endsAt","scheduledAt" FROM "LegacyContent"`;
    expect(rows[0].title).toBe("Legacy event");
    expect(rows[0].date).toBe("2026-11-15");
    expect(rows[0].startsAt.toISOString()).toBe("2026-11-15T04:30:00.000Z");
    expect(rows[0].endsAt.toISOString()).toBe("2026-11-15T06:30:00.000Z");
    expect(rows[0].scheduledAt.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canManage,
  visible,
  slugify,
  blankEntry,
  roles,
  collections,
} from "../lib/content";
import { contentSchema, contactSchema, userSchema } from "../lib/validation";
import { seedEntries } from "../lib/seed-data";
import { detectedType } from "../lib/storage";
test("roles restrict every content collection on the server", () => {
  for (const c of collections) {
    assert.equal(canManage("SUPER_ADMIN", c), true);
    assert.equal(canManage("VIEWER", c), false);
  }
  assert.equal(canManage("EVENT_MANAGER", "activities"), true);
  assert.equal(canManage("EVENT_MANAGER", "users"), false);
  assert.equal(canManage("EVENT_MANAGER", "research"), false);
  assert.equal(canManage("CONTENT_MANAGER", "settings"), false);
  assert.equal(canManage("MEDIA_MANAGER", "media"), true);
  for (const r of roles.filter((r) => r !== "SUPER_ADMIN"))
    assert.equal(canManage(r, "users"), false);
});
test("drafts, review, archived and future scheduled records stay private", () => {
  for (const status of ["DRAFT", "REVIEW", "ARCHIVED"])
    assert.equal(visible({ status, publishAt: "" }), false);
  assert.equal(
    visible(
      { status: "SCHEDULED", publishAt: "2027-01-01T00:00:00Z" },
      new Date("2026-10-22"),
    ),
    false,
  );
  assert.equal(
    visible(
      { status: "SCHEDULED", publishAt: "2026-01-01T00:00:00Z" },
      new Date("2026-10-22"),
    ),
    true,
  );
  assert.equal(visible({ status: "SCHEDULED", publishAt: "" }), false);
});
test("schema rejects dangerous image URLs, missing alt text and unscheduled dates", () => {
  const valid = { ...blankEntry, title: "Valid title", slug: "valid-title" };
  assert.equal(contentSchema.safeParse(valid).success, true);
  assert.equal(
    contentSchema.safeParse({
      ...valid,
      image: "javascript:alert(1)",
      imageAlt: "x",
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({ ...valid, image: "//evil.test/image" }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({ ...valid, image: "/image.png" }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({ ...valid, status: "SCHEDULED" }).success,
    false,
  );
});
test("contact and user validation enforce bounded inputs", () => {
  assert.equal(
    contactSchema.safeParse({
      name: "Ninad",
      email: "invalid",
      subject: "Hello",
      message: "A valid long message",
    }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({
      name: "Ninad",
      email: "test@example.org",
      subject: "Hello",
      message: "A valid long message",
      website: "spam",
    }).success,
    false,
  );
  assert.equal(
    userSchema.safeParse({
      name: "Admin",
      email: "test@example.org",
      password: "short",
      role: "SUPER_ADMIN",
    }).success,
    false,
  );
});
test("activity dates, statistics and missing data preserve the supplied brief", () => {
  assert.equal(
    seedEntries.filter((e) => e.collection === "activities").length,
    16,
  );
  const eu = seedEntries.find((e) => e.slug === "eureka-2026")!;
  assert.equal(eu.date, "");
  assert.equal(
    (eu.data.statistics as Record<string, number>).Participants,
    2636,
  );
  assert.equal(
    (eu.data.statistics as Record<string, number>)["School Children"],
    219970,
  );
  assert.equal(
    seedEntries.find((e) => e.title === "Skills for Success")?.date,
    "2026-10-03",
  );
  assert.equal(
    seedEntries.some((e) => e.collection === "leadership"),
    false,
  );
  assert.equal(
    new Set(seedEntries.map((e) => `${e.collection}/${e.slug}`)).size,
    seedEntries.length,
  );
  assert.equal(slugify("Future Research 2029!"), "future-research-2029");
});
test("upload signatures reject executable and SVG content", () => {
  assert.equal(detectedType(Buffer.from('<svg onload="alert(1)">')), null);
  assert.equal(detectedType(Buffer.from("MZ fake image")), null);
  assert.equal(
    detectedType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))?.mime,
    "image/png",
  );
  assert.equal(detectedType(Buffer.from("%PDF-1.7"))?.mime, "application/pdf");
});

import { permits, assertTransition, readable } from "../lib/policy";
import { zonedInstant, upcoming } from "../lib/dates";
import { moduleItems } from "../lib/modules";
test("publishing is separate from editing and media access", () => {
  assert.equal(
    permits({ role: "EVENT_MANAGER" }, "MEDIA_UPLOAD", "media"),
    true,
  );
  assert.equal(permits({ role: "EVENT_MANAGER" }, "DELETE", "media"), false);
  assert.doesNotThrow(() =>
    assertTransition(
      { role: "EVENT_MANAGER" },
      "activities",
      "DRAFT",
      "REVIEW",
    ),
  );
  assert.throws(() =>
    assertTransition(
      { role: "EVENT_MANAGER" },
      "activities",
      "REVIEW",
      "PUBLISHED",
    ),
  );
  assert.throws(() =>
    assertTransition({ role: "CONTENT_MANAGER" }, "news", "DRAFT", "PUBLISHED"),
  );
  assert.doesNotThrow(() =>
    assertTransition(
      { role: "CHAPTER_ADMIN" },
      "activities",
      "REVIEW",
      "APPROVED",
    ),
  );
  assert.doesNotThrow(() =>
    assertTransition(
      { role: "EVENT_MANAGER", permissions: ["activities:PUBLISH"] },
      "activities",
      "APPROVED",
      "SCHEDULED",
    ),
  );
  assert.equal(
    permits({ role: "MEDIA_MANAGER" }, "UPDATE", "activities"),
    false,
  );
  assert.equal(
    readable(
      { role: "VIEWER" },
      { collection: "activities", status: "DRAFT", publishAt: "" },
    ),
    false,
  );
  assert.equal(permits({ role: "VIEWER" }, "READ", "users"), false);
  assert.equal(permits({ role: "EVENT_MANAGER" }, "READ", "research"), false);
});
test("timezone conversion handles chapter time and DST gaps", () => {
  assert.equal(
    zonedInstant("2026-11-15", "10:00", "Asia/Kolkata")?.toISOString(),
    "2026-11-15T04:30:00.000Z",
  );
  assert.equal(
    zonedInstant("2026-07-01", "10:00", "Europe/London")?.toISOString(),
    "2026-07-01T09:00:00.000Z",
  );
  assert.throws(() => zonedInstant("2026-03-29", "01:30", "Europe/London"));
  assert.equal(
    upcoming({ ...blankEntry, date: "2026-11-15" }, new Date("2026-10-25")),
    true,
  );
  assert.equal(
    upcoming(
      { ...blankEntry, date: "2026-11-15", status: "COMPLETED" },
      new Date("2026-10-25"),
    ),
    false,
  );
});
test("homepage selections are data-driven and ordered by event date", () => {
  const all = [
    {
      ...blankEntry,
      id: "later",
      date: "2027-02-01",
      featured: true,
      homepage: false,
    },
    {
      ...blankEntry,
      id: "first",
      date: "2027-01-01",
      featured: false,
      homepage: true,
    },
  ];
  const homeSection = {
    ...blankEntry,
    collection: "homepage",
    data: { source: "activities", selection: "upcoming", itemCount: 2 },
  };
  assert.deepEqual(
    moduleItems(homeSection, all, new Date("2026-10-25")).map((e) => e.id),
    ["first", "later"],
  );
  assert.deepEqual(
    moduleItems(
      { ...homeSection, data: { source: "activities", selection: "homepage" } },
      all,
    ).map((e) => e.id),
    ["first"],
  );
  assert.deepEqual(
    moduleItems(
      {
        ...homeSection,
        data: {
          source: "activities",
          selection: "manual",
          selectedIds: ["later", "first"],
        },
      },
      all,
    ).map((e) => e.id),
    ["later", "first"],
  );
});
test("event logistics and homepage settings are validated", () => {
  const item = {
    ...blankEntry,
    title: "Valid activity",
    slug: "valid-activity",
  };
  for (const data of [
    { startTime: "25:00" },
    { timezone: "Invalid/Zone" },
    { capacity: -1 },
    { format: "Unknown" },
    { people: [{ personId: "x", role: "Invalid" }] },
  ])
    assert.equal(contentSchema.safeParse({ ...item, data }).success, false);
  assert.equal(
    contentSchema.safeParse({
      ...item,
      collection: "homepage",
      data: { itemCount: 1000 },
    }).success,
    false,
  );
});

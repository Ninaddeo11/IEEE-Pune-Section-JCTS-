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

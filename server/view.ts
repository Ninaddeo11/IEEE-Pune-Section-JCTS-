import { db, entries, entry, configured, publicWhere } from "../lib/db";
import {
  blankEntry,
  collections,
  label,
  publicCollection,
  type Entry,
} from "../lib/content";
import { currentUser } from "../lib/auth";
import { applyPreview } from "../lib/preview";
import { homeData } from "../lib/home-data";
import { activityQuery } from "../lib/activity-query";
import { searchContent } from "../lib/search";
import { permits, readable } from "../lib/policy";
import type { ViewData } from "../client/types";
const publicCollections = [
  "activities",
  "leadership",
  "research",
  "publications",
  "opportunities",
  "resources",
  "news",
  "gallery",
];
const serialize = <T>(value: unknown): T => JSON.parse(JSON.stringify(value));
export async function buildView(path: string): Promise<ViewData> {
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const url = new URL(path, siteUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const [section = "", slug] = segments;
  const query = Object.fromEntries(url.searchParams);
  const preview = query.preview;
  const v: ViewData = {
    page: "not-found",
    section,
    query,
    siteUrl,
    title: "Page not found",
    description: "IEEE JCTS Pune Chapter",
    canonical: url.pathname,
    status: 404,
    configured: configured(),
    all: [],
    footer: [],
    navigation: [],
    modules: [],
    isPreview: false,
    e: blankEntry,
    related: [],
    profiles: [],
    result: { items: [], total: 0, page: 1, pages: 0 },
    categories: [],
    authors: [],
    items: [],
    total: 0,
    records: [],
    options: [],
    media: [],
    users: [],
    messages: [],
    user: { id: "", name: "", email: "", role: "VIEWER", active: false },
    actor: { role: "VIEWER" },
    metrics: [],
    logs: [],
  };
  const common = await applyPreview(
    (await Promise.all([entries("settings"), entries("navigation")])).flat(),
    preview,
  );
  v.footer = common;
  v.navigation = common
    .filter((e) => e.collection === "navigation")
    .sort((a, b) => Number(a.data.order || 0) - Number(b.data.order || 0));
  if (section === "admin") {
    const user = await currentUser();
    v.title = "Chapter workspace";
    v.status = 200;
    if (!user) {
      if (slug) v.redirect = "/admin";
      v.page = "login";
      return v;
    }
    v.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      permissions: user.permissions,
    };
    v.actor = { role: user.role, permissions: user.permissions };
    if (!slug) {
      v.redirect = "/admin/dashboard";
      v.page = "admin";
      return v;
    }
    v.page = "admin";
    v.section = slug;
    const id = segments[2];
    if (
      !["dashboard", "security"].includes(slug) &&
      !permits(user, slug === "audit-logs" ? "AUDIT_VIEW" : "READ", slug)
    )
      return { ...v, page: "not-found", status: 404 };
    if (slug === "dashboard") {
      const allowed = collections.filter((c) => permits(user, "READ", c));
      const counts = await db.content.groupBy({
        by: ["collection", "status"],
        where: {
          collection: { in: allowed },
          ...(user.role === "VIEWER" ? publicWhere() : {}),
        },
        _count: true,
      });
      const count = (c: string, s?: string) =>
        counts
          .filter((r) => r.collection === c && (!s || r.status === s))
          .reduce((sum, r) => sum + r._count, 0);
      if (allowed.includes("activities")) {
        v.metrics.push(["Total activities", count("activities")]);
        for (const s of [
          "DRAFT",
          "REVIEW",
          "APPROVED",
          "SCHEDULED",
          "PUBLISHED",
          "COMPLETED",
        ])
          v.metrics.push([
            `${s.toLowerCase()} activities`,
            count("activities", s),
          ]);
        v.metrics.push([
          "Upcoming activities",
          (await activityQuery({ upcoming: true })).total,
        ]);
      }
      for (const c of ["research", "publications", "news", "opportunities"])
        if (allowed.includes(c as (typeof allowed)[number]))
          v.metrics.push([label(c), count(c)]);
      if (permits(user, "READ", "messages"))
        v.metrics.push(["Messages", await db.contactMessage.count()]);
      if (permits(user, "READ", "media"))
        v.metrics.push(["Media assets", await db.media.count()]);
      v.logs = serialize(
        await db.auditLog.findMany({
          where: permits(user, "AUDIT_VIEW", "audit-logs")
            ? {}
            : { userId: user.id },
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        }),
      );
    } else if (slug === "media")
      v.media = serialize(
        await db.media.findMany({ orderBy: { createdAt: "desc" } }),
      );
    else if (slug === "users")
      v.users = serialize(
        await db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            permissions: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      );
    else if (slug === "messages")
      v.messages = serialize(
        await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
      );
    else if (slug === "audit-logs")
      v.logs = serialize(
        await db.auditLog.findMany({
          take: 200,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } } },
        }),
      );
    else if (slug === "activities" && !id) {
      v.result = await activityQuery(query, user.role !== "VIEWER");
      v.categories = await entries("categories");
      v.authors = await db.user.findMany({
        where: { id: { in: v.result.items.map((e) => e.createdBy || "") } },
        select: { id: true, name: true },
      });
    } else if (collections.includes(slug as (typeof collections)[number])) {
      if (id) {
        if (id === "new" && !permits(user, "CREATE", slug))
          return { ...v, page: "not-found", status: 404 };
        const record =
          id === "new"
            ? { ...blankEntry, collection: slug }
            : serialize<Entry | undefined>(
                await db.content.findFirst({ where: { collection: slug, id } }),
              );
        if (!record || !readable(user, record))
          return { ...v, page: "not-found", status: 404 };
        v.record = record;
        v.media = serialize(
          await db.media.findMany({ orderBy: { createdAt: "desc" } }),
        );
        v.categories = await entries("categories");
        const sources =
          slug === "activities"
            ? ["people"]
            : slug === "homepage"
              ? collections.filter((c) => permits(user, "READ", c))
              : [];
        v.options = (
          await db.content.findMany({
            where: { collection: { in: sources } },
            select: {
              id: true,
              title: true,
              collection: true,
              slug: true,
              status: true,
              publishAt: true,
            },
          })
        )
          .filter((e) => readable(user, e))
          .map((e) => ({ ...blankEntry, ...e }));
      } else
        v.records = (await entries(slug, true)).filter((e) =>
          readable(user, e),
        );
    } else if (slug !== "security")
      return { ...v, page: "not-found", status: 404 };
    return serialize(v);
  }
  if (!section) {
    const published = await homeData(await entries("homepage"));
    v.all = await applyPreview(published, preview);
    v.isPreview = v.all !== published;
    v.modules = v.all
      .filter((e) => e.collection === "homepage" && e.data.enabled !== false)
      .sort(
        (a, b) =>
          Number(a.data.order ?? (a.slug === "hero" ? -100 : 0)) -
            Number(b.data.order ?? (b.slug === "hero" ? -100 : 0)) ||
          a.slug.localeCompare(b.slug),
      );
    const hero = v.modules.find(
      (e) => e.data.kind === "hero" || e.slug === "hero",
    );
    v.title = hero?.seoTitle || hero?.title || "IEEE JCTS Pune";
    v.description = hero?.seoDescription || hero?.summary || v.description;
    v.page = "home";
    v.status = 200;
    return serialize(v);
  }
  if (section === "activity" && slug)
    return { ...v, redirect: `/activities/${slug}`, status: 301 };
  v.cmsPage = await entry("pages", section);
  if ((section === "activities" || section === "upcoming") && !slug) {
    v.page = "activities";
    v.status = 200;
    v.title =
      section === "upcoming"
        ? "Upcoming activities"
        : v.cmsPage?.title || "Activities";
    v.description = v.cmsPage?.summary || v.description;
    v.result = await activityQuery({
      ...query,
      upcoming: section === "upcoming",
    });
    v.categories = await entries("categories");
    return serialize(v);
  }
  if (section === "search" && !slug) {
    v.page = "search";
    v.status = 200;
    v.title = v.cmsPage?.title || "Search";
    const q = (query.q || "").trim().slice(0, 200);
    const page = Math.max(1, Math.min(100000, Number(query.page) || 1));
    const sources = [...publicCollections, "documents", "announcements"];
    if (q && configured()) {
      const result = await searchContent(q, sources, page);
      v.items = result.items;
      v.total = result.total;
    } else if (q) {
      const found = (await entries()).filter(
        (e) =>
          sources.includes(e.collection) &&
          `${e.title} ${e.summary} ${e.body} ${JSON.stringify(e.data)}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      );
      v.total = found.length;
      v.items = found.slice((page - 1) * 12, page * 12);
    }
    return serialize(v);
  }
  if (slug) {
    if (!publicCollections.includes(section)) return v;
    const sources =
      section === "resources"
        ? [section, "documents"]
        : section === "news"
          ? [section, "announcements"]
          : [section];
    let found: Entry | undefined;
    for (const c of sources) {
      found = await entry(c, slug);
      if (found) break;
    }
    const candidates = await applyPreview(found ? [found] : [], preview);
    v.isPreview =
      !!preview &&
      candidates.some(
        (e) =>
          e.slug === slug &&
          publicCollection(e.collection) === section &&
          e.id !== found?.id,
      );
    found = candidates.find(
      (e) => e.slug === slug && publicCollection(e.collection) === section,
    );
    if (!found) return v;
    v.e = found;
    v.page = "detail";
    v.status = 200;
    v.title = found.seoTitle || found.title;
    v.description = found.seoDescription || found.summary;
    v.image = found.image;
    v.related = (await entries(section))
      .filter((e) => e.id !== found.id)
      .slice(0, 3);
    const people = Array.isArray(found.data.people)
      ? (found.data.people as { personId: string }[])
      : [];
    v.profiles = people.length
      ? (await entries("people")).filter((e) =>
          people.some((p) => p.personId === e.id),
        )
      : [];
    return serialize(v);
  }
  const published = (
    await Promise.all([
      entries("pages"),
      entries("settings"),
      entries(section),
      ...(section === "about" ? [entries("focus-areas")] : []),
      ...(section === "news"
        ? [entries("announcements")]
        : section === "resources"
          ? [entries("documents")]
          : section === "contact"
            ? [entries("faqs")]
            : []),
    ])
  ).flat();
  v.all = await applyPreview(published, preview);
  v.isPreview = v.all !== published;
  v.cmsPage = v.all.find((e) => e.collection === "pages" && e.slug === section);
  if (!publicCollections.includes(section) && !v.cmsPage) return v;
  v.page = "section";
  v.status = 200;
  v.title = v.cmsPage?.seoTitle || v.cmsPage?.title || label(section);
  v.description =
    v.cmsPage?.seoDescription || v.cmsPage?.summary || v.description;
  return serialize(v);
}

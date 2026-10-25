import { Prisma } from "@prisma/client";
import { db, configured } from "./db";
import { seedEntries } from "./seed-data";
import { visible, type Entry } from "./content";
import { upcoming } from "./dates";
export type ActivityQuery = {
  limit?: number;
  q?: string;
  category?: string;
  status?: string;
  month?: string;
  format?: string;
  featured?: string;
  homepage?: string;
  sort?: string;
  page?: string;
  upcoming?: boolean;
  start?: string;
  end?: string;
};
export async function activityQuery(query: ActivityQuery, admin = false) {
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1));
  const take = Math.max(1, Math.min(24, Number(query.limit) || 12));
  const ascending = query.upcoming || query.sort === "date-asc";
  if (configured()) {
    const conditions: Prisma.Sql[] = [Prisma.sql`"collection"='activities'`];
    if (!admin)
      conditions.push(
        Prisma.sql`("status" IN ('PUBLISHED','COMPLETED') OR ("status"='SCHEDULED' AND (("scheduledAt" IS NOT NULL AND "scheduledAt"<=NOW()) OR ("scheduledAt" IS NULL AND "publishAt"<>'' AND "publishAt"<=${new Date().toISOString()}))))`,
      );
    if (query.q) {
      const pattern = `%${query.q.slice(0, 200).replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        Prisma.sql`concat_ws(' ',"title","summary","body","data"::text) ILIKE ${pattern}`,
      );
    }
    if (query.category && query.category !== "All")
      conditions.push(
        Prisma.sql`("category"=${query.category} OR "data"->'tags' @> ${JSON.stringify([query.category])}::jsonb)`,
      );
    if (
      query.status &&
      [
        "DRAFT",
        "REVIEW",
        "APPROVED",
        "SCHEDULED",
        "PUBLISHED",
        "COMPLETED",
        "ARCHIVED",
      ].includes(query.status)
    )
      conditions.push(Prisma.sql`"status"::text=${query.status}`);
    if (query.month && /^\d{4}-\d{2}$/.test(query.month))
      conditions.push(Prisma.sql`"date" LIKE ${query.month + "%"}`);
    if (query.format)
      conditions.push(Prisma.sql`"data"->>'format'=${query.format}`);
    if (query.featured === "true") conditions.push(Prisma.sql`"featured"=true`);
    if (query.homepage === "true") conditions.push(Prisma.sql`"homepage"=true`);
    if (query.start) conditions.push(Prisma.sql`"date">=${query.start}`);
    if (query.end) conditions.push(Prisma.sql`"date"<=${query.end}`);
    if (query.upcoming)
      conditions.push(
        Prisma.sql`"status" NOT IN ('COMPLETED','ARCHIVED') AND "date">=to_char(NOW() AT TIME ZONE COALESCE(NULLIF("data"->>'timezone',''),'Asia/Kolkata'),'YYYY-MM-DD')`,
      );
    const where = Prisma.join(conditions, " AND ");
    const order =
      query.sort === "updated"
        ? Prisma.sql`"updatedAt" DESC, "id" ASC`
        : ascending
          ? Prisma.sql`"date" ASC, "title" ASC`
          : Prisma.sql`"date" DESC, "title" ASC`;
    const [records, counts] = await Promise.all([
      db.$queryRaw<Entry[]>(
        Prisma.sql`SELECT * FROM "Content" WHERE ${where} ORDER BY ${order} LIMIT ${take} OFFSET ${(page - 1) * take}`,
      ),
      db.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`SELECT COUNT(*) AS total FROM "Content" WHERE ${where}`,
      ),
    ]);
    const total = Number(counts[0].total);
    return { items: records, total, page, pages: Math.ceil(total / take) };
  }
  const items = seedEntries
    .filter((e) => e.collection === "activities" && (admin || visible(e)))
    .filter(
      (e) =>
        !query.q ||
        `${e.title} ${e.summary} ${e.body} ${JSON.stringify(e.data)}`
          .toLowerCase()
          .includes(query.q.toLowerCase()),
    )
    .filter(
      (e) =>
        !query.category ||
        query.category === "All" ||
        e.category === query.category ||
        (Array.isArray(e.data.tags) && e.data.tags.includes(query.category)),
    )
    .filter((e) => !query.status || e.status === query.status)
    .filter((e) => !query.month || e.date.startsWith(query.month))
    .filter((e) => !query.format || e.data.format === query.format)
    .filter((e) => query.featured !== "true" || e.featured)
    .filter((e) => query.homepage !== "true" || e.homepage)
    .filter((e) => !query.upcoming || upcoming(e))
    .sort(
      (a, b) =>
        (ascending
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date)) || a.title.localeCompare(b.title),
    );
  return {
    items: items.slice((page - 1) * take, page * take),
    total: items.length,
    page,
    pages: Math.ceil(items.length / take),
  };
}

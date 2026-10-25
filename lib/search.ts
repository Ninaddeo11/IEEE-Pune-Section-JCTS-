import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Entry } from "./content";
export async function searchContent(
  q: string,
  collections: string[],
  page: number,
  take = 12,
) {
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const where = Prisma.sql`"collection" IN (${Prisma.join(collections)}) AND
    ("status" IN ('PUBLISHED', 'COMPLETED') OR ("status"='SCHEDULED' AND
      (("scheduledAt" IS NOT NULL AND "scheduledAt" <= NOW()) OR ("scheduledAt" IS NULL AND "publishAt" <> '' AND "publishAt" <= ${new Date().toISOString()}))))
    AND concat_ws(' ', "title", "summary", "body", "data"::text) ILIKE ${pattern}`;
  const [items, counts] = await Promise.all([
    db.$queryRaw<Entry[]>(
      Prisma.sql`SELECT * FROM "Content" WHERE ${where} ORDER BY "date" DESC, "title" ASC LIMIT ${take} OFFSET ${(page - 1) * take}`,
    ),
    db.$queryRaw<{ total: bigint }[]>(
      Prisma.sql`SELECT COUNT(*) AS total FROM "Content" WHERE ${where}`,
    ),
  ]);
  return { items, total: Number(counts[0].total) };
}

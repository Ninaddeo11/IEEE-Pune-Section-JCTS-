import { PrismaClient } from "@prisma/client";
import { seedEntries } from "./seed-data";
import { visible, type Entry } from "./content";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalDb.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
export const configured = () => Boolean(process.env.DATABASE_URL);
export async function entries(
  collection?: string,
  includeDrafts = false,
): Promise<Entry[]> {
  const items = configured()
    ? ((await db.content.findMany({
        where: collection ? { collection } : undefined,
        orderBy: { createdAt: "desc" },
      })) as unknown as Entry[])
    : seedEntries.filter((e) => !collection || e.collection === collection);
  return includeDrafts ? items : items.filter((e) => visible(e));
}
export async function entry(collection: string, slug: string, preview = false) {
  return (await entries(collection, preview)).find((e) => e.slug === slug);
}
export async function audit(
  userId: string,
  action: string,
  target: string,
  before?: unknown,
  after?: unknown,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      target,
      ...(before ? { before: JSON.parse(JSON.stringify(before)) } : {}),
      ...(after ? { after: JSON.parse(JSON.stringify(after)) } : {}),
    },
  });
}

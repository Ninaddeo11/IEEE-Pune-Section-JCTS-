import { Prisma, PrismaClient } from "@prisma/client";
import { seedEntries } from "./seed-data";
import { visible, type Entry } from "./content";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalDb.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
export const configured = () => Boolean(process.env.DATABASE_URL);
async function readEntries(
  collection?: string,
  includeDrafts = false,
): Promise<Entry[]> {
  const items = configured()
    ? ((await db.content.findMany({
        where: {
          ...(collection ? { collection } : {}),
          ...(!includeDrafts ? publicWhere() : {}),
        },
        orderBy: { createdAt: "desc" },
      })) as unknown as Entry[])
    : seedEntries.filter((e) => !collection || e.collection === collection);
  return includeDrafts ? items : items.filter((e) => visible(e));
}
export const entries = readEntries;
export async function entry(collection: string, slug: string, preview = false) {
  if (!configured())
    return (await entries(collection, preview)).find((e) => e.slug === slug);
  return (await db.content.findFirst({
    where: { collection, slug, ...(!preview ? publicWhere() : {}) },
  })) as unknown as Entry | undefined;
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

export function publicWhere(): Prisma.ContentWhereInput {
  return {
    OR: [
      { status: { in: ["PUBLISHED", "COMPLETED"] } },
      { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      {
        status: "SCHEDULED",
        scheduledAt: null,
        publishAt: { not: "", lte: new Date().toISOString() },
      },
    ],
  };
}

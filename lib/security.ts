import { headers } from "next/headers";
import { db } from "./db";
export async function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new Error("Invalid request origin");
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const now = new Date();
  const result = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${new Date(now.getTime() + seconds * 1000)}) ON CONFLICT ("key") DO UPDATE SET "count" = CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END, "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${new Date(now.getTime() + seconds * 1000)} ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
  if (result[0].count > limit)
    throw new Error("Too many requests. Please try again later.");
}
export async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

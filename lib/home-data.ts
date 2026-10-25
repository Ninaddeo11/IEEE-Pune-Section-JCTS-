import { activityQuery } from "./activity-query";
import { db, configured, entries, publicWhere } from "./db";
import type { Entry } from "./content";
export async function homeData(modules: Entry[]) {
  if (!configured()) return entries();
  const groups = await Promise.all(
    modules.map(async (m) => {
      const source = String(
        m.data.source ||
          (
            {
              activities: "activities",
              upcoming: "activities",
              spotlight: "activities",
              focus: "focus-areas",
              news: "news",
              knowledge: "research",
            } as Record<string, string>
          )[m.slug] ||
          m.slug,
      );
      const selection = String(
        m.data.selection || (m.slug === "activities" ? "homepage" : "all"),
      );
      const selected = Array.isArray(m.data.selectedIds)
        ? m.data.selectedIds.map(String).slice(0, 24)
        : [];
      const take = Math.min(24, Math.max(1, Number(m.data.itemCount) || 6));
      if (selection === "upcoming" && source === "activities")
        return (await activityQuery({ upcoming: true, limit: take })).items;
      return db.content.findMany({
        where: {
          ...publicWhere(),
          collection:
            source === "news" ? { in: ["news", "announcements"] } : source,
          ...(selection === "with-statistics"
            ? {
                data: {
                  path: ["statistics"],
                  not: (await import("@prisma/client")).Prisma.DbNull,
                },
              }
            : selection === "manual"
              ? { id: { in: selected } }
              : selection === "featured"
                ? { featured: true }
                : selection === "homepage"
                  ? { homepage: true }
                  : selection === "upcoming"
                    ? {
                        date: {
                          gte: new Intl.DateTimeFormat("en-CA", {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }).format(new Date()),
                        },
                        status: { notIn: ["COMPLETED", "ARCHIVED"] },
                      }
                    : selection === "completed"
                      ? {
                          AND: [
                            {
                              OR: [
                                { status: "COMPLETED" },
                                {
                                  date: {
                                    not: "",
                                    lt: new Intl.DateTimeFormat("en-CA", {
                                      timeZone: "Asia/Kolkata",
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    }).format(new Date()),
                                  },
                                },
                              ],
                            },
                          ],
                        }
                      : {}),
        },
        take,
        orderBy: [
          { date: selection === "upcoming" ? "asc" : "desc" },
          { title: "asc" },
        ],
      });
    }),
  );
  return [
    ...new Map(
      [...modules, ...(groups.flat() as unknown as Entry[])].map((e) => [
        e.id,
        e,
      ]),
    ).values(),
  ];
}

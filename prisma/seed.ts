import { PrismaClient } from "@prisma/client";
import { zonedInstant } from "../lib/dates";
import { seedEntries } from "../lib/seed-data";
const db = new PrismaClient();
async function main() {
  for (const item of seedEntries) {
    const { id, ...data } = item;
    await db.content.upsert({
      where: {
        collection_slug: { collection: item.collection, slug: item.slug },
      },
      create: {
        id,
        ...data,
        startsAt:
          data.collection === "activities"
            ? zonedInstant(
                data.date,
                String(data.data.startTime || "00:00"),
                String(data.data.timezone || "Asia/Kolkata"),
              )
            : null,
        endsAt:
          data.collection === "activities" && data.endDate
            ? zonedInstant(
                data.endDate,
                String(data.data.endTime || "23:59"),
                String(data.data.timezone || "Asia/Kolkata"),
              )
            : null,
        status: "PUBLISHED",
        data: JSON.parse(JSON.stringify(data.data)),
      },
      update: {},
    });
  }
  console.log(
    `Seeded ${seedEntries.length} initial content records. Existing content preserved.`,
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

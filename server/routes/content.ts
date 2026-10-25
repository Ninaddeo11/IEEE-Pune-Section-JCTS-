import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authorize } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { contentSchema } from "@/lib/validation";
import { assertTransition, permits, transitionAction } from "@/lib/policy";
import { zonedInstant } from "@/lib/dates";
const json = (v: unknown) => JSON.parse(JSON.stringify(v));
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const raw = await request.json();
    const input = contentSchema.parse(raw);
    const user = await authorize(
      input.collection,
      raw.id ? "UPDATE" : "CREATE",
    );
    const before = raw.id
      ? await db.content.findUniqueOrThrow({ where: { id: String(raw.id) } })
      : null;
    if (before && before.collection !== input.collection)
      throw new Error("Collection cannot be changed");
    if (before && raw.version !== before.version)
      return Response.json(
        {
          error:
            "This record changed. Reload it before saving; your recovery copy is retained.",
        },
        { status: 409 },
      );
    const from = before?.status ?? "DRAFT";
    assertTransition(user, input.collection, from, input.status);
    if (
      before &&
      ["PUBLISHED", "COMPLETED", "SCHEDULED", "APPROVED"].includes(from) &&
      input.status === from &&
      !permits(user, "PUBLISH", input.collection)
    )
      throw new Error(
        "Published and approved content must be returned to draft by a publisher before editing",
      );
    if (input.collection === "activities" && input.category) {
      const category = await db.content.findFirst({
        where: {
          collection: "categories",
          title: input.category,
          status: "PUBLISHED",
        },
      });
      if (!category)
        throw new Error(
          "Choose a managed activity category. Ask a chapter administrator to add new categories.",
        );
    }
    const alias = (
      {
        documents: "resources",
        resources: "documents",
        announcements: "news",
        news: "announcements",
      } as Record<string, string>
    )[input.collection];
    if (
      alias &&
      (await db.content.findFirst({
        where: { collection: alias, slug: input.slug },
      }))
    )
      throw new Error(
        "This public URL is already used by another content collection",
      );
    const timezone = String(input.data.timezone || "Asia/Kolkata");
    const startsAt =
      input.collection === "activities"
        ? zonedInstant(
            input.date,
            String(input.data.startTime || "00:00"),
            timezone,
          )
        : null;
    const endsAt =
      input.collection === "activities" && (input.endDate || input.data.endTime)
        ? zonedInstant(
            input.endDate || input.date,
            String(input.data.endTime || "23:59"),
            timezone,
          )
        : null;
    if (startsAt && endsAt && endsAt < startsAt)
      throw new Error("End time must follow start time");
    const data = {
      ...input,
      data: json(input.data),
      startsAt,
      endsAt,
      scheduledAt: input.publishAt ? new Date(input.publishAt) : null,
    };
    const record = await db.$transaction(async (tx) => {
      if (before)
        await tx.contentRevision.create({
          data: {
            contentId: before.id,
            version: before.version,
            userId: user.id,
            payload: json(before),
          },
        });
      const result = before
        ? await tx.content.update({
            where: { id: before.id, version: before.version },
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.content.create({ data: { ...data, createdBy: user.id } });
      if (before?.collection === "categories" && before.title !== input.title) {
        const used = await tx.content.count({
          where: { collection: "activities", category: before.title },
        });
        if (used)
          throw new Error(
            "This category is in use. Create a new category and explicitly recategorize activities before renaming it.",
          );
      }
      if (input.collection === "activities") {
        const participants = Array.isArray(input.data.people)
          ? (input.data.people as { personId: string; role: string }[])
          : [];
        for (const participant of participants) {
          const person = await tx.content.findFirst({
            where: { id: participant.personId, collection: "people" },
          });
          if (!person) throw new Error("Select an existing person");
        }
        await tx.contentParticipant.deleteMany({
          where: { activityId: result.id },
        });
        if (participants.length)
          await tx.contentParticipant.createMany({
            data: participants.map((p) => ({
              activityId: result.id,
              personId: p.personId,
              role: p.role,
            })),
            skipDuplicates: true,
          });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action:
            from === "REVIEW" && input.status === "DRAFT"
              ? "REJECT"
              : from !== input.status
                ? transitionAction(from, input.status)
                : before
                  ? "UPDATED_CONTENT"
                  : "CREATED_CONTENT",
          target: result.id,
          ...(before ? { before: json(before) } : {}),
          after: json(result),
        },
      });
      return result;
    });
    return Response.json(record);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2025"].includes(e.code)
    )
      return Response.json(
        {
          error:
            "The record changed or its slug is already used. Reload the editor or choose a unique slug.",
        },
        { status: 409 },
      );
    return Response.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    await sameOrigin(request);
    const { id, version } = await request.json();
    const before = await db.content.findUniqueOrThrow({
      where: { id: String(id) },
    });
    const user = await authorize(before.collection, "DELETE");
    if (
      ["PUBLISHED", "COMPLETED", "SCHEDULED"].includes(before.status) &&
      !permits(user, "UNPUBLISH", before.collection)
    )
      throw new Error("Ask a publisher to unpublish this record first");
    if (version !== undefined && version !== before.version)
      return Response.json(
        { error: "Record changed; reload before deleting" },
        { status: 409 },
      );
    if (
      before.collection === "categories" &&
      (await db.content.count({
        where: { collection: "activities", category: before.title },
      }))
    )
      throw new Error(
        "Category is used by activities; recategorize them before deleting it",
      );
    await db.$transaction(async (tx) => {
      await tx.content.delete({
        where: { id: before.id, version: before.version },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETED_CONTENT",
          target: before.id,
          before: json(before),
        },
      });
    });
    return Response.json({ ok: true });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2025"].includes(e.code)
    )
      return Response.json(
        {
          error:
            "The record changed or its slug is already used. Reload the editor or choose a unique slug.",
        },
        { status: 409 },
      );
    return Response.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}

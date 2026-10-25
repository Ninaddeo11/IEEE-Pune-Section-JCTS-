import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { authorize } from "../../lib/auth";
import { sameOrigin } from "../../lib/security";
import { permits } from "../../lib/policy";
const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        version: z.number().int().positive(),
        order: z.number().int().min(0).max(1000),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(100),
});
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("homepage", "UPDATE");
    const input = schema.parse(await request.json());
    if (new Set(input.items.map((i) => i.id)).size !== input.items.length)
      throw new Error("Sections cannot be repeated");
    const records = await db.$transaction(async (tx) => {
      const results = [];
      for (const item of input.items) {
        const before = await tx.content.findFirstOrThrow({
          where: { id: item.id, collection: "homepage" },
        });
        if (before.version !== item.version) throw new Error("CONFLICT");
        if (
          ["PUBLISHED", "COMPLETED", "SCHEDULED", "APPROVED"].includes(
            before.status,
          ) &&
          !permits(user, "PUBLISH", "homepage")
        )
          throw new Error(
            "Publishing permission is required to change live homepage sections",
          );
        const old = before.data as Record<string, unknown>;
        if (
          Number(old.order || 0) === item.order &&
          (old.enabled !== false) === item.enabled
        ) {
          results.push(before);
          continue;
        }
        await tx.contentRevision.create({
          data: {
            contentId: before.id,
            version: before.version,
            userId: user.id,
            payload: JSON.parse(JSON.stringify(before)),
          },
        });
        const after = await tx.content.update({
          where: { id: before.id, version: item.version },
          data: {
            data: {
              ...JSON.parse(JSON.stringify(old)),
              order: item.order,
              enabled: item.enabled,
            },
            version: { increment: 1 },
          },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "UPDATED_HOMEPAGE_LAYOUT",
            target: before.id,
            before: JSON.parse(JSON.stringify(before)),
            after: JSON.parse(JSON.stringify(after)),
          },
        });
        results.push(after);
      }
      return results;
    });
    return Response.json({ items: records });
  } catch (e) {
    const conflict =
      (e instanceof Error && e.message === "CONFLICT") ||
      (e instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2025"].includes(e.code));
    return Response.json(
      {
        error: conflict
          ? "The homepage changed in another session. Reload before saving."
          : e instanceof Error
            ? e.message
            : "Unable to save homepage layout",
      },
      { status: conflict ? 409 : 400 },
    );
  }
}

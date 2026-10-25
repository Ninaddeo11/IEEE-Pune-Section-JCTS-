import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorize } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { contentSchema } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const raw = await request.json();
    const input = contentSchema.parse(raw);
    const user = await authorize(input.collection);
    const before = raw.id
      ? await db.content.findUnique({ where: { id: String(raw.id) } })
      : null;
    if (before && before.collection !== input.collection)
      throw new Error("Collection cannot be changed");
    const data = { ...input, data: JSON.parse(JSON.stringify(input.data)) };
    const record = await db.$transaction(async (tx) => {
      const result = before
        ? await tx.content.update({ where: { id: before.id }, data })
        : await tx.content.create({ data });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: before ? "UPDATED_CONTENT" : "CREATED_CONTENT",
          target: result.id,
          ...(before ? { before: JSON.parse(JSON.stringify(before)) } : {}),
          after: JSON.parse(JSON.stringify(result)),
        },
      });
      return result;
    });
    return NextResponse.json(record);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    await sameOrigin(request);
    const { id } = await request.json();
    const before = await db.content.findUniqueOrThrow({
      where: { id: String(id) },
    });
    const user = await authorize(before.collection);
    await db.$transaction(async (tx) => {
      await tx.content.delete({ where: { id: before.id } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETED_CONTENT",
          target: before.id,
          before: JSON.parse(JSON.stringify(before)),
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}

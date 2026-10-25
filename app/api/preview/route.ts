import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import { sameOrigin, rateLimit } from "@/lib/security";
import { contentSchema } from "@/lib/validation";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const input = contentSchema.parse(await request.json());
    const user = await authorize(input.collection);
    await rateLimit(`preview:${user.id}`, 60, 3600);
    await db.contentPreview.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    const preview = await db.contentPreview.create({
      data: {
        userId: user.id,
        collection: input.collection,
        slug: input.slug,
        payload: JSON.parse(JSON.stringify(input)),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    return NextResponse.json({ id: preview.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Preview failed" },
      { status: 400 },
    );
  }
}

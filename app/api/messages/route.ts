import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/auth";
import { db, audit } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
export async function PATCH(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("messages");
    const { id, status } = z
      .object({
        id: z.string(),
        status: z.enum(["unread", "read", "resolved", "archived"]),
      })
      .parse(await request.json());
    await db.contactMessage.update({ where: { id }, data: { status } });
    await audit(user.id, "UPDATED_MESSAGE_STATUS", id, undefined, { status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to update message" },
      { status: 400 },
    );
  }
}

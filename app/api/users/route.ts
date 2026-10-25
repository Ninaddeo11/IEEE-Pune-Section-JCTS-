import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db, audit } from "@/lib/db";
import { authorize } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { userSchema } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("users");
    const data = userSchema.parse(await request.json());
    const result = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        role: data.role,
        passwordHash: await hash(data.password, 12),
      },
    });
    await audit(user.id, "CREATED_USER", result.id, undefined, {
      email: result.email,
      role: result.role,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to create user" },
      { status: 400 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("users");
    const { id, active } = await request.json();
    if (id === user.id) throw new Error("You cannot disable your own account");
    if (typeof active !== "boolean") throw new Error("Invalid status");
    await db.user.update({ where: { id: String(id) }, data: { active } });
    if (!active) await db.session.deleteMany({ where: { userId: String(id) } });
    await audit(user.id, "CHANGED_USER_ACCESS", String(id), undefined, {
      active,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}

import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { currentUser, createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sameOrigin, rateLimit } from "@/lib/security";
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Sign in first" }, { status: 401 });
    await rateLimit(`password:${user.id}`, 5, 900);
    const input = z
      .object({
        currentPassword: z.string().max(128),
        password: z.string().min(12).max(128),
      })
      .parse(await request.json());
    if (!(await compare(input.currentPassword, user.passwordHash)))
      throw new Error("Current password is incorrect");
    const passwordHash = await hash(input.password, 12);
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({
        data: { userId: user.id, action: "PASSWORD_CHANGED", target: user.id },
      });
    });
    await createSession(user.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to change password" },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    await sameOrigin(request);
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Sign in first" }, { status: 401 });
    await db.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({
        data: { userId: user.id, action: "REVOKED_SESSIONS", target: user.id },
      });
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Unable to revoke sessions" },
      { status: 400 },
    );
  }
}

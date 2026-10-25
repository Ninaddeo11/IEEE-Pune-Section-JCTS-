import { z } from "zod";
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
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to create user" },
      { status: 400 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("users");
    const { id, active, role, permissions, password } = z
      .object({
        id: z.string(),
        active: z.boolean().optional(),
        role: z
          .enum([
            "SUPER_ADMIN",
            "CHAPTER_ADMIN",
            "EVENT_MANAGER",
            "CONTENT_MANAGER",
            "RESEARCH_MANAGER",
            "MEDIA_MANAGER",
            "VIEWER",
          ])
          .optional(),
        permissions: z
          .array(
            z
              .string()
              .regex(
                /^(activities|research|publications|news|announcements|pages|homepage|resources|opportunities|people):(PUBLISH|APPROVE|UNPUBLISH|ARCHIVE)$/,
              ),
          )
          .max(40)
          .optional(),
        password: z.string().min(12).max(128).optional(),
      })
      .parse(await request.json());
    if (id === user.id) throw new Error("You cannot disable your own account");
    if (active === undefined && !role && !permissions && !password)
      throw new Error("No changes supplied");
    await db.user.update({
      where: { id: String(id) },
      data: {
        ...(active !== undefined ? { active } : {}),
        ...(role ? { role } : {}),
        ...(permissions ? { permissions } : {}),
        ...(password ? { passwordHash: await hash(password, 12) } : {}),
      },
    });
    if (active === false || role || permissions || password)
      await db.session.deleteMany({ where: { userId: String(id) } });
    await audit(user.id, "CHANGED_USER_ACCESS", String(id), undefined, {
      active,
      role,
      permissions,
      passwordReset: !!password,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}

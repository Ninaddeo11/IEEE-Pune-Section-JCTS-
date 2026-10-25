import { compare } from "bcryptjs";
import { z } from "zod";
import { db, configured, audit } from "@/lib/db";
import { createSession, endSession, currentUser } from "@/lib/auth";
import { sameOrigin, rateLimit, clientKey } from "@/lib/security";
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    if (!configured())
      return Response.json(
        { error: "Database is not configured. See README for setup." },
        { status: 503 },
      );
    await rateLimit(`login:${await clientKey()}`, 10, 900);
    const input = z
      .object({ email: z.email(), password: z.string().min(1).max(128) })
      .parse(await request.json());
    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    const fallback =
      "$2b$12$C6UzMDM.H6dfI/f/IKcEe.0pBDvO0kFtprx1JeyMzxS31vG6TZp.2";
    const valid = await compare(input.password, user?.passwordHash ?? fallback);
    if (!user || !valid || !user.active)
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    await createSession(user.id);
    await audit(user.id, "SIGNED_IN", user.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Unable to sign in. Check your details or try again later." },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    await sameOrigin(request);
    const user = await currentUser();
    if (user) await audit(user.id, "SIGNED_OUT", user.id);
    await endSession();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to sign out" }, { status: 400 });
  }
}

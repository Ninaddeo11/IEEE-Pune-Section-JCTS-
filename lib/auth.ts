import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db, configured } from "./db";
import { canManage } from "./content";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function currentUser() {
  if (!configured()) return null;
  const token = (await cookies()).get("jcts_session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active)
    return null;
  return session.user;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/admin");
  return user;
}
export async function authorize(collection?: string) {
  const user = await currentUser();
  if (!user) throw new Error("Authentication required");
  if (collection && !canManage(user.role, collection))
    throw new Error("You do not have permission for this action");
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db.session.create({ data: { id: hash(token), userId, expiresAt } });
  (await cookies()).set("jcts_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get("jcts_session")?.value;
  if (token) await db.session.deleteMany({ where: { id: hash(token) } });
  jar.delete("jcts_session");
}

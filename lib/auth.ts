import { requestContext, cookieValue } from "../server/context";
import { createHash, randomBytes } from "node:crypto";
import { db, configured } from "./db";
import { permits, type Action } from "./policy";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function currentUser() {
  if (!configured()) return null;
  const token = cookieValue("jcts_session");
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
  if (!user) throw new Error("Authentication required");
  return user;
}
export async function authorize(
  collection?: string,
  action: Action = "UPDATE",
) {
  const user = await currentUser();
  if (!user) throw new Error("Authentication required");
  if (collection && !permits(user, action, collection))
    throw new Error("You do not have permission for this action");
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db.session.create({ data: { id: hash(token), userId, expiresAt } });
  requestContext().setCookies.push(
    `jcts_session=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}
export async function endSession() {
  const token = cookieValue("jcts_session");
  if (token) await db.session.deleteMany({ where: { id: hash(token) } });
  requestContext().setCookies.push(
    "jcts_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );
}

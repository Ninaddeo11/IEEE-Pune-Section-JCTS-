import { headers } from "next/headers";
import { currentUser } from "./auth";
import { db } from "./db";
import { canManage, type Entry } from "./content";
export async function applyPreview(items: Entry[], token?: string) {
  const id = token ?? (await headers()).get("x-jcts-preview");
  if (!id) return items;
  const user = await currentUser();
  if (!user) return items;
  const snapshot = await db.contentPreview.findUnique({ where: { id } });
  if (
    !snapshot ||
    snapshot.userId !== user.id ||
    snapshot.expiresAt < new Date() ||
    !canManage(user.role, snapshot.collection)
  )
    return items;
  const value = { ...(snapshot.payload as unknown as Entry), id: snapshot.id };
  return [
    ...items.filter(
      (e) => e.collection !== value.collection || e.slug !== value.slug,
    ),
    value,
  ];
}

import { requestContext } from "../server/context";
import { currentUser } from "./auth";
import { db } from "./db";
import { type Entry } from "./content";
import { permits } from "./policy";
export async function applyPreview(items: Entry[], token?: string) {
  const id =
    token ?? new URL(requestContext().request.url).searchParams.get("preview");
  if (!id) return items;
  const user = await currentUser();
  if (!user || user.role === "VIEWER") return items;
  const snapshot = await db.contentPreview.findUnique({ where: { id } });
  if (
    !snapshot ||
    snapshot.userId !== user.id ||
    snapshot.expiresAt < new Date() ||
    !permits(user, "PREVIEW", snapshot.collection)
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

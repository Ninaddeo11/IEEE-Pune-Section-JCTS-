import { db } from "@/lib/db";
import { authorize } from "@/lib/auth";
import { readable } from "@/lib/policy";
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id") || "";
    const item = await db.content.findUniqueOrThrow({ where: { id } });
    const user = await authorize(item.collection, "READ");
    if (!readable(user, item)) throw new Error("Not permitted");
    const revisions = await db.contentRevision.findMany({
      where: { contentId: id },
      orderBy: { version: "desc" },
      take: 50,
    });
    return Response.json(revisions, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Unable to read revisions" },
      { status: 403 },
    );
  }
}

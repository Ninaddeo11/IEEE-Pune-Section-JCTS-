import { db, configured } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { sameOrigin, rateLimit, clientKey } from "@/lib/security";
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    if (!configured())
      return Response.json(
        {
          error:
            "The contact service is awaiting database configuration. Please try again later.",
        },
        { status: 503 },
      );
    await rateLimit(`contact:${await clientKey()}`, 5, 3600);
    const { website, ...data } = contactSchema.parse(await request.json());
    void website;
    await db.contactMessage.create({ data });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Message not sent. Check the fields or try again later." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import { sameOrigin, rateLimit } from "@/lib/security";
import { db, audit } from "@/lib/db";
import { detectedType, storeFile, removeFile } from "@/lib/storage";
export async function PATCH(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("media");
    await rateLimit(`upload:${user.id}`, 30, 3600);
    if (Number(request.headers.get("content-length") ?? 0) > 26 * 1024 * 1024)
      throw new Error("File is too large");
    const form = await request.formData();
    const before = await db.media.findUniqueOrThrow({
      where: { id: String(form.get("id")) },
    });
    const alt = String(form.get("alt") ?? "").trim();
    if (!alt || alt.length > 500) throw new Error("Alt text is required");
    const replacement = form.get("file");
    let size = before.size;
    let name = before.name;
    if (replacement instanceof File && replacement.size) {
      if (replacement.size > 25 * 1024 * 1024)
        throw new Error("File exceeds 25 MB");
      const bytes = Buffer.from(await replacement.arrayBuffer());
      const type = detectedType(bytes);
      if (!type || type.mime !== before.mime || type.mime !== replacement.type)
        throw new Error(
          "Replacement must have the same file type as the original",
        );
      await storeFile(bytes, type.mime, type.extension, before.key);
      size = replacement.size;
      name = replacement.name.slice(0, 200);
    }
    const record = await db.media.update({
      where: { id: before.id },
      data: {
        alt,
        size,
        name,
        folder: String(form.get("folder") ?? "").slice(0, 100),
        tags: String(form.get("tags") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    });
    await audit(user.id, "UPDATED_MEDIA", record.id, before, record);
    return NextResponse.json(record);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("media");
    await rateLimit(`upload:${user.id}`, 30, 3600);
    if (Number(request.headers.get("content-length") ?? 0) > 26 * 1024 * 1024)
      throw new Error("File is too large");
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "").trim();
    if (
      !(file instanceof File) ||
      !alt ||
      alt.length > 500 ||
      file.size > 25 * 1024 * 1024
    )
      throw new Error("Choose a file under 25 MB and provide alt text");
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = detectedType(bytes);
    if (!type || type.mime !== file.type)
      throw new Error(
        "Supported files: PNG, JPEG, WebP, PDF and MP4. File content must match its type.",
      );
    const stored = await storeFile(bytes, type.mime, type.extension);
    const media = await db.media.create({
      data: {
        ...stored,
        name: file.name.slice(0, 200),
        mime: type.mime,
        size: file.size,
        alt,
        folder: String(form.get("folder") ?? "").slice(0, 100),
        tags: String(form.get("tags") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    });
    await audit(user.id, "UPLOADED_MEDIA", media.id);
    return NextResponse.json(media);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    await sameOrigin(request);
    const user = await authorize("media");
    const { id } = await request.json();
    const item = await db.media.findUniqueOrThrow({
      where: { id: String(id) },
    });
    const used = await db.content.findFirst({
      where: {
        OR: [
          { image: item.url },
          { body: { contains: item.url } },
          { data: { path: ["url"], equals: item.url } },
        ],
      },
    });
    const nested = await db.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "Content" WHERE "data"::text LIKE ${`%${item.url}%`} LIMIT 1`;
    if (used || nested.length)
      throw new Error(
        "This file is used by content. Remove its references before deleting.",
      );
    await removeFile(item.key);
    await db.media.delete({ where: { id: item.id } });
    await audit(user.id, "DELETED_MEDIA", item.id, item);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}

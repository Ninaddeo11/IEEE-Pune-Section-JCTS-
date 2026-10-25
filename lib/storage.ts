import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
const s3 = () =>
  new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
export function detectedType(bytes: Buffer) {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { mime: "image/png", extension: "png" };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return { mime: "image/jpeg", extension: "jpg" };
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  )
    return { mime: "image/webp", extension: "webp" };
  if (bytes.subarray(0, 5).toString() === "%PDF-")
    return { mime: "application/pdf", extension: "pdf" };
  if (bytes.subarray(4, 8).toString() === "ftyp")
    return { mime: "video/mp4", extension: "mp4" };
  return null;
}
export async function storeFile(
  bytes: Buffer,
  mime: string,
  extension: string,
  existingKey?: string,
) {
  const key = existingKey ?? `${randomUUID()}.${extension}`;
  if (!/^[a-f0-9-]+\.(png|jpg|webp|pdf|mp4)$/.test(key))
    throw new Error("Invalid storage key");
  if (process.env.STORAGE_DRIVER === "s3") {
    if (!process.env.S3_BUCKET || !process.env.S3_PUBLIC_URL)
      throw new Error("Object storage is not configured");
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: mime,
        CacheControl: "public, max-age=60",
      }),
    );
    return {
      key,
      url: `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`,
    };
  }
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Configure S3-compatible object storage for production uploads",
    );
  await mkdir(path.join(process.cwd(), "public", "uploads"), {
    recursive: true,
  });
  await writeFile(path.join(process.cwd(), "public", "uploads", key), bytes);
  return { key, url: `/uploads/${key}` };
}
export async function removeFile(key: string) {
  if (!/^[a-f0-9-]+\.(png|jpg|webp|pdf|mp4)$/.test(key))
    throw new Error("Invalid storage key");
  if (process.env.STORAGE_DRIVER === "s3")
    await s3().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  else await unlink(path.join(process.cwd(), "public", "uploads", key));
}

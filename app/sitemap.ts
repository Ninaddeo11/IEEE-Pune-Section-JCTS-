import type { MetadataRoute } from "next";
import { entries } from "@/lib/db";
import { publicCollection } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const sections = [
    "about",
    "leadership",
    "activities",
    "research",
    "publications",
    "membership",
    "opportunities",
    "resources",
    "news",
    "gallery",
    "contact",
  ];
  const all = await entries();
  return [
    { url: base },
    ...sections.map((s) => ({ url: `${base}/${s}` })),
    ...all
      .filter((e) => e.collection === "pages" && !sections.includes(e.slug))
      .map((e) => ({ url: `${base}/${e.slug}` })),
    ...all
      .filter((e) => sections.includes(publicCollection(e.collection)))
      .map((e) => ({
        url: `${base}/${publicCollection(e.collection)}/${e.slug}`,
      })),
  ];
}

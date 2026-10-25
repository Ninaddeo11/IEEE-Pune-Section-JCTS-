export const collections = [
  "activities",
  "leadership",
  "research",
  "publications",
  "news",
  "announcements",
  "opportunities",
  "resources",
  "gallery",
  "documents",
  "partners",
  "homepage",
  "statistics",
  "faqs",
  "settings",
  "navigation",
  "focus-areas",
  "pages",
] as const;
export type Collection = (typeof collections)[number];
export function publicCollection(collection: string) {
  return collection === "documents"
    ? "resources"
    : collection === "announcements"
      ? "news"
      : collection;
}
export const categories = [
  "Professional",
  "Technical",
  "Research",
  "Innovation",
  "Humanitarian",
  "Non-Technical",
  "Pre-University",
  "Administrative",
];
export const statuses = [
  "DRAFT",
  "REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export const roles = [
  "SUPER_ADMIN",
  "CHAPTER_ADMIN",
  "CONTENT_MANAGER",
  "EVENT_MANAGER",
  "RESEARCH_MANAGER",
  "MEDIA_MANAGER",
  "VIEWER",
] as const;
export type Role = (typeof roles)[number];
export function canManage(role: string, collection: string) {
  if (role === "SUPER_ADMIN") return true;
  if (role === "CHAPTER_ADMIN")
    return !["users", "audit-logs", "security"].includes(collection);
  const allowed: Record<string, string[]> = {
    CONTENT_MANAGER: [
      "news",
      "announcements",
      "opportunities",
      "resources",
      "faqs",
    ],
    EVENT_MANAGER: ["activities"],
    RESEARCH_MANAGER: ["research", "publications"],
    MEDIA_MANAGER: ["gallery", "media", "documents"],
  };
  return allowed[role]?.includes(collection) ?? false;
}
export type Entry = {
  id: string;
  collection: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  date: string;
  endDate: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  homepage: boolean;
  status: string;
  publishAt: string;
  seoTitle: string;
  seoDescription: string;
  data: Record<string, unknown>;
};
export const blankEntry: Entry = {
  id: "",
  collection: "activities",
  slug: "",
  title: "",
  summary: "",
  body: "",
  category: "",
  date: "",
  endDate: "",
  image: "",
  imageAlt: "",
  featured: false,
  homepage: false,
  status: "DRAFT",
  publishAt: "",
  seoTitle: "",
  seoDescription: "",
  data: {},
};
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function visible(
  e: Pick<Entry, "status" | "publishAt">,
  now = new Date(),
) {
  return (
    e.status === "PUBLISHED" ||
    (e.status === "SCHEDULED" && !!e.publishAt && new Date(e.publishAt) <= now)
  );
}
export function label(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

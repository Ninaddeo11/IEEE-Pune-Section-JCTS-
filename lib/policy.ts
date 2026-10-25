import { visible } from "./content";
export const actions = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "PREVIEW",
  "SUBMIT_FOR_REVIEW",
  "APPROVE",
  "PUBLISH",
  "UNPUBLISH",
  "ARCHIVE",
  "MEDIA_UPLOAD",
  "SETTINGS_MANAGE",
  "USERS_MANAGE",
  "AUDIT_VIEW",
] as const;
export type Action = (typeof actions)[number];
export type Actor = { role: string; permissions?: unknown };
const scope: Record<string, string[]> = {
  EVENT_MANAGER: ["activities", "people"],
  CONTENT_MANAGER: [
    "news",
    "announcements",
    "pages",
    "homepage",
    "faqs",
    "opportunities",
    "resources",
  ],
  RESEARCH_MANAGER: ["research", "publications", "people", "resources"],
};
export function permits(actor: Actor, action: Action, collection: string) {
  if (actor.role === "SUPER_ADMIN") return true;
  if (
    action === "USERS_MANAGE" ||
    collection === "users" ||
    collection === "policy"
  )
    return false;
  if (actor.role === "CHAPTER_ADMIN") return collection !== "security";
  if (
    action === "AUDIT_VIEW" ||
    collection === "audit-logs" ||
    collection === "messages" ||
    collection === "settings" ||
    collection === "navigation" ||
    collection === "categories"
  )
    return false;
  if (actor.role === "VIEWER") return action === "READ" || action === "PREVIEW";
  if (collection === "media")
    return (
      ([
        "EVENT_MANAGER",
        "CONTENT_MANAGER",
        "RESEARCH_MANAGER",
        "MEDIA_MANAGER",
      ].includes(actor.role) &&
        ["READ", "MEDIA_UPLOAD", "PREVIEW"].includes(action)) ||
      (actor.role === "MEDIA_MANAGER" && ["UPDATE", "DELETE"].includes(action))
    );
  if (!(scope[actor.role] ?? []).includes(collection)) return false;
  const grants = Array.isArray(actor.permissions) ? actor.permissions : [];
  if (["PUBLISH", "APPROVE", "UNPUBLISH", "ARCHIVE"].includes(action))
    return grants.includes(`${collection}:${action}`);
  return [
    "CREATE",
    "READ",
    "UPDATE",
    "DELETE",
    "PREVIEW",
    "SUBMIT_FOR_REVIEW",
  ].includes(action);
}
export function readable(
  actor: Actor,
  item: { collection: string; status: string; publishAt: string },
) {
  return (
    permits(actor, "READ", item.collection) &&
    (actor.role !== "VIEWER" || visible(item))
  );
}
const transitions: Record<string, string[]> = {
  DRAFT: ["REVIEW"],
  REVIEW: ["DRAFT", "APPROVED", "PUBLISHED"],
  APPROVED: ["DRAFT", "SCHEDULED", "PUBLISHED"],
  SCHEDULED: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["DRAFT", "COMPLETED", "ARCHIVED"],
  COMPLETED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};
export function transitionAction(from: string, to: string): Action {
  if (to === "REVIEW") return "SUBMIT_FOR_REVIEW";
  if (to === "APPROVED") return "APPROVE";
  if (to === "ARCHIVED") return "ARCHIVE";
  if (to === "DRAFT" && ["PUBLISHED", "COMPLETED", "SCHEDULED"].includes(from))
    return "UNPUBLISH";
  if (["PUBLISHED", "SCHEDULED", "COMPLETED"].includes(to)) return "PUBLISH";
  return "UPDATE";
}
export function assertTransition(
  actor: Actor,
  collection: string,
  from: string,
  to: string,
) {
  if (from === to) return;
  if (!permits(actor, transitionAction(from, to), collection))
    throw new Error(
      "You do not have permission for this publication transition",
    );
  if (
    !["SUPER_ADMIN", "CHAPTER_ADMIN"].includes(actor.role) &&
    !(transitions[from] ?? []).includes(to)
  )
    throw new Error(`Cannot transition from ${from} to ${to}`);
}

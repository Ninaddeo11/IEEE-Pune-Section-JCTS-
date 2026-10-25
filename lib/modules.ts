import type { Entry } from "./content";
import { upcoming } from "./dates";
export function moduleItems(module: Entry, all: Entry[], now = new Date()) {
  const source = String(
    module.data.source ||
      (
        {
          activities: "activities",
          upcoming: "activities",
          spotlight: "activities",
          focus: "focus-areas",
          news: "news",
          knowledge: "research",
        } as Record<string, string>
      )[module.slug] ||
      module.slug,
  );
  const mode = String(
    module.data.selection ||
      (module.slug === "activities" ? "homepage" : "all"),
  );
  const selected = Array.isArray(module.data.selectedIds)
    ? module.data.selectedIds.map(String)
    : [];
  return all
    .filter(
      (e) =>
        e.collection === source ||
        (source === "news" && e.collection === "announcements"),
    )
    .filter((e) =>
      mode === "with-statistics"
        ? !!e.data.statistics
        : mode === "manual"
          ? selected.includes(e.id)
          : mode === "featured"
            ? e.featured
            : mode === "homepage"
              ? e.homepage
              : mode === "upcoming"
                ? upcoming(e, now)
                : mode === "completed"
                  ? e.status === "COMPLETED" || (!!e.date && !upcoming(e, now))
                  : true,
    )
    .sort((a, b) =>
      mode === "manual"
        ? selected.indexOf(a.id) - selected.indexOf(b.id)
        : mode === "upcoming"
          ? a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
          : b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
    )
    .slice(0, Math.min(24, Math.max(1, Number(module.data.itemCount) || 6)));
}

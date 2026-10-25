import type { ViewData } from "../client/types";
import { zonedInstant } from "../lib/dates";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function pageHtml(template: string, view: ViewData) {
  const url = new URL(view.canonical, view.siteUrl).href;
  const noindex =
    view.page === "admin" ||
    view.page === "login" ||
    view.page === "search" ||
    !!view.query.preview ||
    view.status === 404;
  const data = JSON.stringify(view).replace(/</g, "\\u003c");
  const meta = `<title>${escape(view.title)} | IEEE JCTS Pune</title><meta name="description" content="${escape(view.description)}"><link rel="canonical" href="${escape(url)}"><meta name="robots" content="${noindex ? "noindex,nofollow" : "index,follow"}"><meta property="og:title" content="${escape(view.title)}"><meta property="og:description" content="${escape(view.description)}"><meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${escape(new URL(view.image || "/opengraph-image", view.siteUrl).href)}"><meta name="twitter:card" content="summary_large_image">`;
  const structured: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "IEEE JCTS Pune Chapter",
      url: view.siteUrl,
    },
  ];
  if (view.page === "detail") {
    const e = view.e,
      d = e.data;
    structured.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: view.siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: view.section,
          item: new URL(`/${view.section}`, view.siteUrl).href,
        },
        { "@type": "ListItem", position: 3, name: e.title, item: url },
      ],
    });
    if (view.section === "activities" && e.date)
      structured.push({
        "@context": "https://schema.org",
        "@type": "Event",
        name: e.title,
        description: e.summary,
        startDate: zonedInstant(
          e.date,
          String(d.startTime || "00:00"),
          String(d.timezone || "Asia/Kolkata"),
        )?.toISOString(),
        ...(e.endDate || d.endTime
          ? {
              endDate: zonedInstant(
                e.endDate || e.date,
                String(d.endTime || "23:59"),
                String(d.timezone || "Asia/Kolkata"),
              )?.toISOString(),
            }
          : {}),
        ...(d.venue
          ? { location: { "@type": "Place", name: String(d.venue) } }
          : {}),
        ...(e.image ? { image: e.image } : {}),
      });
    else if (["news", "publications"].includes(view.section))
      structured.push({
        "@context": "https://schema.org",
        "@type":
          view.section === "publications" ? "ScholarlyArticle" : "Article",
        headline: e.title,
        description: e.summary,
        datePublished: e.date || undefined,
        ...(d.authors ? { author: String(d.authors) } : {}),
      });
  }
  const jsonLd = `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, "\\u003c")}</script>`;
  return template
    .replace("<!--page-head-->", meta + jsonLd)
    .replace(
      "<!--page-data-->",
      `<script id="page-data" type="application/json">${data}</script>`,
    );
}

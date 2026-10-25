import Link from "@/client/router";
import type { Entry } from "@/lib/content";
import { moduleItems } from "@/lib/modules";
import { safeUrl } from "@/lib/urls";
import { ContentCard, SectionHead, Eyebrow, EmptyState } from "./ui";
import { Counter, Reveal } from "./motion";
import Hero3D from "./three/hero";
import RichText from "./rich-text";
export default function HomeModule({
  module: m,
  all,
}: {
  module: Entry;
  all: Entry[];
}) {
  const kind = String(
    m.data.kind ||
      (m.slug === "hero"
        ? "hero"
        : m.slug === "join"
          ? "cta"
          : m.slug === "statistics"
            ? "statistics"
            : m.slug === "about"
              ? "about"
              : "collection"),
  );
  const items = moduleItems(m, all);
  if (kind === "hero")
    return (
      <section className="hero page-width">
        <div className="hero-copy">
          <Reveal>
            <Eyebrow>
              {String(m.data.eyebrow || "IEEE JCTS • PUNE SECTION")}
            </Eyebrow>
            <h1>
              {m.title
                .split(".")
                .filter(Boolean)
                .map((line, i) => (
                  <span className={i === 2 ? "blue-text" : ""} key={i}>
                    {line.trim()}.
                  </span>
                ))}
            </h1>
            <p className="hero-description">{m.summary}</p>
            <div className="hero-buttons">
              <Link
                className="button"
                aria-label={String(m.data.ctaText || "Explore activities")}
                href={safeUrl(m.data.ctaUrl, "/activities")}
              >
                {String(m.data.ctaText || "Explore activities")} ↗
              </Link>
              <Link className="button secondary" href="/about">
                Discover JCTS →
              </Link>
            </div>
          </Reveal>
        </div>
        <Hero3D />
      </section>
    );
  return (
    <section
      className={`section ${m.data.display === "tinted" ? "tinted" : ""}`}
    >
      <div className="page-width">
        <Reveal>
          <SectionHead
            number={String(m.data.order ?? "JCTS")}
            title={m.title}
            description={m.summary}
          />
          {kind === "cta" || kind === "contact" || kind === "newsletter" ? (
            <div className="join-panel">
              <RichText document={m.data.richText} />
              <p>{m.body}</p>
              <Link
                className="button"
                href={safeUrl(m.data.ctaUrl, "/contact")}
              >
                {String(m.data.ctaText || "Get involved")} ↗
              </Link>
            </div>
          ) : kind === "about" || kind === "announcement" ? (
            <div className="prose">
              <p>{m.body || items[0]?.summary}</p>
              <RichText document={m.data.richText} />
              <Link
                className="text-link"
                href={safeUrl(m.data.ctaUrl, "/about")}
              >
                {String(m.data.ctaText || "Discover the chapter")} →
              </Link>
            </div>
          ) : kind === "statistics" || kind === "impact" ? (
            <div className="stats-row">
              {items
                .flatMap((e) =>
                  e.collection === "statistics"
                    ? [[e.title, Number(e.data.value || 0)] as const]
                    : Object.entries(
                        (e.data.statistics || {}) as Record<string, number>,
                      ),
                )
                .map(([name, value]) => (
                  <div key={name}>
                    <strong>
                      <Counter value={Number(value)} />
                    </strong>
                    <span>{name}</span>
                  </div>
                ))}
            </div>
          ) : items.length ? (
            <div
              className={kind === "spotlight" ? "spotlight-grid" : "cards-grid"}
            >
              {items.map((e, i) =>
                ["partners", "focus-areas"].includes(e.collection) ? (
                  <a
                    className="knowledge-card"
                    key={e.id}
                    href={safeUrl(e.data.url)}
                  >
                    <h3>{e.title}</h3>
                    <p>{e.summary}</p>
                    <span>Explore ↗</span>
                  </a>
                ) : (
                  <ContentCard key={e.id} item={e} index={i} />
                ),
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </Reveal>
      </div>
    </section>
  );
}

import Link from "@/client/router";
import { motion, useReducedMotion } from "framer-motion";
import type { Entry } from "@/lib/content";
import { moduleItems } from "@/lib/modules";
import { safeUrl } from "@/lib/urls";
import { SectionHead, Eyebrow, EmptyState } from "./ui";
import { Counter, Reveal } from "./motion";
import Hero3D from "./three/hero";
import RichText from "./rich-text";
import MagneticLink from "./magnetic-link";
import EditorialCollection, {
  ActivityEditorial,
  FocusNetwork,
} from "./editorial-collection";
import { ArrowUpRight, ArrowDown, ArrowRight } from "lucide-react";
function Headline({ title }: { title: string }) {
  const reduced = useReducedMotion();
  return (
    <h1 className="signature-headline">
      {title
        .split(".")
        .filter(Boolean)
        .map((word, i) => (
          <span className={`hero-word ${i === 2 ? "blue-text" : ""}`} key={i}>
            <motion.span
              initial={reduced ? false : { y: "105%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.9,
                delay: 0.1 + i * 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word.trim()}.
            </motion.span>
          </span>
        ))}
    </h1>
  );
}
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
  const source = String(m.data.source || items[0]?.collection || m.slug);
  if (kind === "hero")
    return (
      <section className="hero signature-hero page-width">
        <div className="hero-copy">
          <Eyebrow>
            {String(m.data.eyebrow || "IEEE JCTS ? PUNE SECTION")}
          </Eyebrow>
          <Headline title={m.title} />
          <Reveal>
            <p className="hero-description">{m.summary}</p>
            <div className="hero-buttons">
              <MagneticLink
                className="button"
                aria-label={String(m.data.ctaText || "Explore activities")}
                href={safeUrl(m.data.ctaUrl, "/activities")}
              >
                {String(m.data.ctaText || "Explore activities")}
                <ArrowUpRight size={18} />
              </MagneticLink>
              <MagneticLink className="button secondary" href="/about">
                Discover JCTS
                <ArrowRight size={18} />
              </MagneticLink>
            </div>
          </Reveal>
        </div>
        <Hero3D />
        <div className="signature-hero-footer">
          <span>
            IEEE TEMS <i /> IEEE SYSTEMS COUNCIL
          </span>
          <a href="#connected" aria-label="Scroll to connected intelligence">
            <span>SCROLL TO CONNECT</span>
            <ArrowDown size={17} />
          </a>
          <span>PUNE, INDIA / CONNECTED GLOBALLY</span>
        </div>
      </section>
    );
  if (kind === "statistics" || kind === "impact") {
    const stats = items.flatMap((e) =>
      e.collection === "statistics"
        ? [[e.title, Number(e.data.value || 0)] as const]
        : Object.entries((e.data.statistics || {}) as Record<string, number>),
    );
    return (
      <section className="impact-console">
        <div className="page-width">
          <Reveal>
            <div className="impact-console-head">
              <span className="eyebrow">
                <i className="signal-dot" />
                IMPACT, OBSERVED.
              </span>
              <span>
                {items[0]?.collection === "activities"
                  ? items[0].title
                  : m.title}
              </span>
            </div>
            <div className="impact-data">
              {stats.map(([name, value], i) => (
                <div className="impact-datum" key={name}>
                  <span className="data-index">
                    {String(i + 1).padStart(2, "0")} /
                  </span>
                  <strong>
                    <Counter value={Number(value)} />
                  </strong>
                  <span>{name}</span>
                  <div className="data-track" aria-hidden="true">
                    <i style={{ width: "100%" }} />
                  </div>
                </div>
              ))}
            </div>
            {!stats.length && (
              <p className="impact-placeholder">
                Publish chapter statistics to bring this data story to life.
              </p>
            )}
            <div className="impact-console-foot">
              <span>PEOPLE. IDEAS. REAL-WORLD CONNECTIONS.</span>
              <span>IEEE JCTS PUNE SECTION</span>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }
  if (kind === "about" || kind === "announcement")
    return (
      <section className="section editorial-intro page-width">
        <Reveal>
          <div className="editorial-intro-top">
            <p className="section-index">THE CHAPTER / CONNECTED BY PURPOSE</p>
            <span className="section-coordinate">01 ? PUNE SECTION</span>
          </div>
          <div className="editorial-intro-grid">
            <h2>{m.title}</h2>
            <div className="intro-support">
              <div className="intro-diagram" aria-hidden="true">
                <svg viewBox="0 0 320 130">
                  <path
                    d="M15 65H95L145 20L200 65H305M95 65L145 110L200 65M145 20V110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  {[15, 95, 200, 305].map((x, i) => (
                    <circle key={x} cx={x} cy="65" r={i === 1 ? 7 : 4} />
                  ))}
                </svg>
                <span>PEOPLE + TECHNOLOGY + KNOWLEDGE</span>
              </div>
              <p className="lead">{m.summary || items[0]?.summary}</p>
              <p className="muted">{m.body}</p>
              <RichText document={m.data.richText} />
              <Link
                className="text-link"
                href={safeUrl(m.data.ctaUrl, "/about")}
              >
                {String(m.data.ctaText || "Discover the chapter")}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    );
  if (["cta", "contact", "newsletter"].includes(kind))
    return (
      <section className="section page-width">
        <Reveal>
          <div className="connection-cta">
            <div className="cta-grid-lines" aria-hidden="true" />
            <p className="eyebrow">A SHARED CURIOSITY. A COLLECTIVE FUTURE.</p>
            <h2>{m.title}</h2>
            <p>{m.summary}</p>
            {m.body && <p>{m.body}</p>}
            <RichText document={m.data.richText} />
            <MagneticLink
              className="button"
              href={safeUrl(m.data.ctaUrl, "/contact")}
            >
              {String(m.data.ctaText || "Get involved")}
              <ArrowUpRight size={18} />
            </MagneticLink>
            <span className="cta-cross" aria-hidden="true">
              +
            </span>
          </div>
        </Reveal>
      </section>
    );
  return (
    <section
      className={`section editorial-module module-${source} ${m.data.display === "tinted" ? "tinted" : ""}`}
    >
      <div className="page-width">
        <Reveal>
          <SectionHead
            number={String(m.data.order ?? "JCTS")}
            title={m.title}
            description={m.summary}
            href={
              source === "focus-areas"
                ? "/activities"
                : ["settings", "partners"].includes(source)
                  ? undefined
                  : `/${source}`
            }
            link={
              source === "activities" ? "All activities" : `Explore ${source}`
            }
          />
          {source === "focus-areas" ? (
            <FocusNetwork items={items} />
          ) : source === "partners" ? (
            <div className="partner-editorial">
              {items.length ? (
                items.map((e) => (
                  <a key={e.id} href={safeUrl(e.data.url)}>
                    {e.image && (
                      <img src={e.image} alt={e.imageAlt} loading="lazy" />
                    )}
                    <h3>{e.title}</h3>
                    <p>{e.summary}</p>
                    <ArrowUpRight size={19} />
                  </a>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          ) : kind === "spotlight" ? (
            <ActivityEditorial items={items} spotlight />
          ) : (
            <EditorialCollection items={items} collection={source} />
          )}
        </Reveal>
      </div>
    </section>
  );
}

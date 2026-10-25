import Link from "next/link";
import { ArrowUpRight, ArrowRight, MoveDown, Network } from "lucide-react";
import { entries, entry } from "@/lib/db";
import type { Metadata } from "next";
import {
  Eyebrow,
  SectionHead,
  ContentCard,
  focusIcons,
  EmptyState,
} from "@/components/ui";
import { Reveal, Counter } from "@/components/motion";
import Hero3D from "@/components/three/hero";
import Footer from "@/components/footer";
import { safeUrl } from "@/lib/urls";
import { applyPreview } from "@/lib/preview";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const hero = await entry("homepage", "hero");
  return {
    title: hero?.seoTitle || "JCTS Pune — Technology. Research. Impact.",
    description: hero?.seoDescription || hero?.summary,
    alternates: { canonical: "/" },
    robots: (await searchParams).preview
      ? { index: false, follow: false }
      : undefined,
  };
}
export default async function Home() {
  const published = await entries();
  const all = await applyPreview(published);
  const hero = all.find(
    (e) => e.collection === "homepage" && e.slug === "hero",
  );
  const settings = all.find(
    (e) => e.collection === "settings" && e.slug === "chapter",
  );
  const activities = all
    .filter((e) => e.collection === "activities" && e.featured && e.homepage)
    .slice(0, 6);
  const eureka = all.find((e) => e.slug === "eureka-2026");
  const stats = all.filter((e) => e.collection === "statistics");
  const defaults = Object.entries(
    (eureka?.data.statistics ?? {}) as Record<string, number>,
  ).filter(([key]) =>
    ["Teams", "Participants", "States", "Schools"].includes(key),
  );
  const news = all
    .filter((e) => ["news", "announcements"].includes(e.collection))
    .slice(0, 3);
  const focusAreas = all
    .filter((e) => e.collection === "focus-areas")
    .sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
  const sections = Object.fromEntries(
    all.filter((e) => e.collection === "homepage").map((e) => [e.slug, e]),
  );
  const partners = all.filter((e) => e.collection === "partners");
  const featuredResearch = all
    .filter(
      (e) =>
        ["research", "publications", "leadership"].includes(e.collection) &&
        e.homepage &&
        e.featured,
    )
    .slice(0, 6);
  return (
    <>
      {all !== published && (
        <div className="preview-banner">
          ADMIN PREVIEW · Private snapshot · Public content is unchanged.
        </div>
      )}
      <main id="main">
        <section className="hero page-width">
          <div className="hero-copy">
            <Reveal>
              <Eyebrow>
                {String(hero?.data.eyebrow ?? "IEEE JCTS • PUNE SECTION")}
              </Eyebrow>
              <h1>
                {(hero?.title ?? "Technology. Research. Impact.")
                  .split(".")
                  .filter(Boolean)
                  .map((line, i) => (
                    <span key={line} className={i === 2 ? "blue-text" : ""}>
                      {line.trim()}.
                    </span>
                  ))}
              </h1>
              <p className="hero-description">{hero?.summary}</p>
              <div className="hero-buttons">
                <Link
                  className="button"
                  href={safeUrl(hero?.data.ctaUrl, "/activities")}
                >
                  {String(hero?.data.ctaText ?? "Explore activities")}
                  <ArrowUpRight size={17} />
                </Link>
                <Link className="button secondary" href="/about">
                  Discover JCTS <ArrowRight size={17} />
                </Link>
              </div>
              <div className="hero-note">
                <span className="line" /> A community for what comes next.
              </div>
            </Reveal>
          </div>
          <Hero3D />
          <div className="hero-bottom">
            <span>
              TECHNOLOGY & ENGINEERING MANAGEMENT SOCIETY <b>×</b> SYSTEMS
              COUNCIL
            </span>
            <a href="#discover" aria-label="Scroll to discover">
              <span>SCROLL TO DISCOVER</span>
              <MoveDown size={16} />
            </a>
          </div>
        </section>
        <section className="affiliation-strip">
          <span>ONE CHAPTER. TWO PERSPECTIVES. ENDLESS POSSIBILITIES.</span>
          <div>
            <strong>
              IEEE <span>TEMS</span>
            </strong>
            <span className="strip-divider" />
            <strong>
              IEEE <span>SYSTEMS COUNCIL</span>
            </strong>
            <span className="strip-divider" />
            <strong>
              Pune <span>SECTION</span>
            </strong>
          </div>
        </section>
        <section id="discover" className="section page-width">
          <Reveal>
            <div className="about-grid">
              <div>
                <p className="section-index">01 / THE CHAPTER</p>
                <h2>
                  Progress happens
                  <br />
                  when minds <span className="blue-text">connect.</span>
                </h2>
              </div>
              <div className="about-copy">
                <p className="lead">
                  Bringing technology, engineering management and systems
                  thinking together.
                </p>
                <p className="muted">
                  {settings?.summary}. We connect people and ideas to turn
                  knowledge into meaningful, lasting impact.
                </p>
                <Link href="/about" className="text-link">
                  Meet your next community <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </Reveal>
          <div className="stats-row">
            {stats.length
              ? stats.map((e) => (
                  <div key={e.id}>
                    <strong>
                      <Counter value={Number(e.data.value ?? 0)} />
                    </strong>
                    <span>{e.title}</span>
                  </div>
                ))
              : defaults.map(([key, value]) => (
                  <div key={key}>
                    <strong>
                      <Counter value={value} />
                    </strong>
                    <span>{key} · EU-REKA 2026</span>
                  </div>
                ))}
          </div>
        </section>
        {sections.activities && (
          <section className="section tinted">
            <div className="page-width">
              <Reveal>
                <SectionHead
                  number="02"
                  title={sections.activities?.title ?? ""}
                  description={sections.activities?.summary}
                  href="/activities"
                  link="All activities"
                />
              </Reveal>
              <div className="cards-grid">
                {activities.map((item, i) => (
                  <Reveal key={item.id}>
                    <ContentCard item={item} index={i} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
        {sections.focus && (
          <section className="section page-width">
            <Reveal>
              <SectionHead
                number="03"
                title={sections.focus?.title ?? ""}
                description={sections.focus?.summary}
              />
            </Reveal>
            <div className="focus-grid">
              {focusAreas.map((area, i) => {
                const Icon = focusIcons[i % focusIcons.length];
                return (
                  <Link
                    className="focus-card"
                    key={area.id}
                    href={safeUrl(area.data.url, "/activities")}
                  >
                    <Icon size={23} strokeWidth={1.3} />
                    <span className="focus-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3>{area.title}</h3>
                    <ArrowUpRight size={18} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {eureka && (
          <section className="eureka-section">
            <div className="page-width eureka-grid">
              <Reveal>
                <Eyebrow>THE NEXT GENERATION STARTS HERE</Eyebrow>
                <h2>
                  Small ideas.
                  <br />
                  Extraordinary
                  <br />
                  <span>possibilities.</span>
                </h2>
                <p>{eureka?.summary}</p>
                <Link href="/activities/eureka-2026" className="button light">
                  Discover EU-REKA 2026 <ArrowUpRight size={18} />
                </Link>
              </Reveal>
              <div className="eureka-orb">
                <div className="orb-ring" />
                <div className="orb-ring" />
                <Network size={96} strokeWidth={0.6} />
                <span>
                  EU-REKA<span>2026</span>
                </span>
              </div>
            </div>
          </section>
        )}
        {sections.knowledge && (
          <section className="section page-width">
            <SectionHead
              number="04"
              title={sections.knowledge?.title ?? ""}
              description={sections.knowledge?.summary}
              href="/research"
              link="Explore research"
            />
            <div className="knowledge-grid">
              {[
                [
                  "Research",
                  "Questions today. Breakthroughs tomorrow.",
                  "/research",
                ],
                [
                  "Publications",
                  "Ideas made open. Knowledge moved forward.",
                  "/publications",
                ],
                [
                  "Resources",
                  "The tools for your next big step.",
                  "/resources",
                ],
              ].map(([title, copy, href], i) => (
                <Link className="knowledge-card" href={href} key={title}>
                  <span>
                    0{i + 1} / {title.toUpperCase()}
                  </span>
                  <h3>{copy}</h3>
                  <ArrowUpRight />
                </Link>
              ))}
            </div>
          </section>
        )}
        {sections.news && (
          <section className="section tinted">
            <div className="page-width">
              <SectionHead
                number="05"
                title={sections.news?.title ?? ""}
                href="/news"
                link="All news"
              />
              {news.length ? (
                <div className="cards-grid">
                  {news.map((item, i) => (
                    <ContentCard key={item.id} item={item} index={i} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="The next chapter is being written."
                  description="Chapter news and announcements will appear here when published."
                />
              )}
              <div className="opportunity-line">
                <div>
                  <span className="section-index">YOUR NEXT STEP</span>
                  <h3>Find an opportunity to contribute.</h3>
                </div>
                <Link href="/opportunities" className="text-link">
                  Explore opportunities <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </section>
        )}
        {sections.join && (
          <section className="section page-width">
            <div className="join-panel">
              <p className="section-index">BETTER, TOGETHER.</p>
              <h2>{sections.join?.title}</h2>
              <p>{sections.join?.summary}</p>
              <Link href="/membership" className="button">
                Find your place at JCTS <ArrowUpRight size={18} />
              </Link>
              <span className="join-mark" aria-hidden="true">
                ↗
              </span>
            </div>
          </section>
        )}
        {featuredResearch.length > 0 && (
          <section className="section page-width">
            <SectionHead number="06" title="People and ideas moving forward." />
            <div className="cards-grid">
              {featuredResearch.map((item, i) => (
                <ContentCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        )}
        {partners.length > 0 && (
          <section className="section page-width">
            <SectionHead number="07" title="Progress through collaboration." />
            <div className="knowledge-grid">
              {partners.map((p) => (
                <a
                  key={p.id}
                  href={safeUrl(p.data.url)}
                  className="knowledge-card"
                >
                  <h3>{p.title}</h3>
                  <p className="muted">{p.summary}</p>
                  <ArrowUpRight />
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

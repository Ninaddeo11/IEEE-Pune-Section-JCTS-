import { Suspense } from "react";
import RichText from "@/components/rich-text";
import { safeUrl } from "@/lib/urls";
import { collections, label, publicCollection } from "@/lib/content";
import { Eyebrow, ContentCard, EmptyState, Arrow } from "@/components/ui";
import Footer from "@/components/footer";
import Listing from "@/components/listing";
import ContactForm from "@/components/contact-form";
import Link from "@/client/router";
import { useView } from "@/client/view";
export default function SectionPage() {
  const { section, all, cmsPage, query: search, isPreview } = useView();
  const publicCollections = [
    "activities",
    "leadership",
    "research",
    "publications",
    "opportunities",
    "resources",
    "news",
    "gallery",
  ];
  const settings = all.find(
    (e) => e.collection === "settings" && e.slug === "chapter",
  );
  const data = settings?.data ?? {};
  const items = all.filter((e) => publicCollection(e.collection) === section);
  const title = cmsPage?.title || label(section);
  return (
    <>
      {isPreview && (
        <div className="preview-banner">
          ADMIN PREVIEW ? Private snapshot ? Public content is unchanged.
        </div>
      )}
      <main id="main" className="page-width">
        <div className="page-hero">
          <Eyebrow>IEEE JCTS • PUNE SECTION</Eyebrow>
          <h1>{title}</h1>
          <p>{cmsPage?.summary}</p>
        </div>
        {publicCollections.includes(section) && (
          <section className="listing-section">
            <Suspense fallback={<div className="loading-skeleton" />}>
              <Listing items={items} collection={section} />
            </Suspense>
          </section>
        )}
        {section === "about" && (
          <section className="listing-section">
            <div className="about-grid">
              <div>
                <h2 style={{ whiteSpace: "pre-line" }}>
                  {String(cmsPage?.data.subheading ?? title)}
                </h2>
                <p className="lead">{settings?.summary}</p>
                <div className="muted">
                  {cmsPage?.data.richText ? (
                    <RichText document={cmsPage.data.richText} />
                  ) : (
                    <p>{cmsPage?.body}</p>
                  )}
                </div>
              </div>
              <div>
                <h3>Our mission</h3>
                <p className="muted">{String(data.mission ?? "")}</p>
                <h3>Our vision</h3>
                <p className="muted">{String(data.vision ?? "")}</p>
                <Link className="text-link" href="/leadership">
                  Meet the leadership <Arrow />
                </Link>
              </div>
            </div>
            {Boolean(cmsPage?.data.ctaHeading) && (
              <div className="join-panel" style={{ marginTop: 40 }}>
                <h2>{String(cmsPage?.data.ctaHeading)}</h2>
                <p>{String(cmsPage?.data.ctaDescription ?? "")}</p>
                <Link
                  href={safeUrl(cmsPage?.data.ctaUrl, "/contact")}
                  className="button"
                >
                  {String(cmsPage?.data.ctaText ?? "Get involved")} <Arrow />
                </Link>
              </div>
            )}
          </section>
        )}
        {section === "membership" && (
          <section className="listing-section">
            {Array.isArray(cmsPage?.data.cards) && (
              <div className="knowledge-grid">
                {(
                  cmsPage.data.cards as { title: string; description: string }[]
                ).map((card, i) => (
                  <div className="knowledge-card" key={i}>
                    <span>0{i + 1} / GET INVOLVED</span>
                    <h3>{card.title}</h3>
                    <p className="muted">{card.description}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="prose" style={{ maxWidth: 760, marginTop: 30 }}>
              {cmsPage?.data.richText ? (
                <RichText document={cmsPage.data.richText} />
              ) : (
                <p>{cmsPage?.body}</p>
              )}
            </div>
            {Boolean(cmsPage?.data.ctaHeading) && (
              <div className="join-panel" style={{ marginTop: 40 }}>
                <h2>{String(cmsPage?.data.ctaHeading)}</h2>
                <p>{String(cmsPage?.data.ctaDescription ?? "")}</p>
                <Link
                  href={safeUrl(cmsPage?.data.ctaUrl, "/contact")}
                  className="button"
                >
                  {String(cmsPage?.data.ctaText ?? "Get involved")} <Arrow />
                </Link>
              </div>
            )}
          </section>
        )}
        {section === "contact" && (
          <section className="listing-section">
            <div className="contact-grid">
              <ContactForm />
              <aside className="contact-aside">
                <h3>
                  IEEE JCTS
                  <br />
                  Pune Section
                </h3>
                <p>{settings?.summary}</p>
                {Boolean(data.email) && (
                  <p>
                    <a href={`mailto:${String(data.email)}`}>
                      {String(data.email)}
                    </a>
                  </p>
                )}
                {Boolean(data.phone) && <p>{String(data.phone)}</p>}
                <p>Pune, Maharashtra, India</p>
                <Link className="text-link" href="/about">
                  Discover the chapter <Arrow />
                </Link>
              </aside>
            </div>
            <div style={{ marginTop: 65 }}>
              {all
                .filter((e) => e.collection === "faqs")
                .map((e) => (
                  <details className="admin-panel" key={e.id}>
                    <summary>{e.title}</summary>
                    <p style={{ marginTop: 15 }}>{e.body}</p>
                  </details>
                ))}
            </div>
          </section>
        )}
        {section === "search" && (
          <section className="listing-section">
            <form className="filter-bar">
              <input
                type="search"
                name="q"
                defaultValue={search.q}
                aria-label="Search all content"
                placeholder="Search the chapter…"
              />
              <button className="button">
                Search <Arrow />
              </button>
            </form>
            {search.q ? (
              (() => {
                const found = all.filter(
                  (e) =>
                    collections.includes(
                      e.collection as (typeof collections)[number],
                    ) &&
                    publicCollections.includes(
                      publicCollection(e.collection),
                    ) &&
                    `${e.title} ${e.summary} ${e.body} ${JSON.stringify(e.data)}`
                      .toLowerCase()
                      .includes(search.q!.toLowerCase()),
                );
                return (
                  <>
                    <p className="result-count">
                      {found.length} results for “{search.q}”
                    </p>
                    {found.length ? (
                      <div className="cards-grid">
                        {found.map((e, i) => (
                          <ContentCard key={e.id} item={e} index={i} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No results found."
                        description="Try a broader search or explore our activities."
                      />
                    )}
                  </>
                );
              })()
            ) : (
              <EmptyState
                title="What are you curious about?"
                description="Search activities, research, people, publications and resources."
              />
            )}
          </section>
        )}
        {![
          ...publicCollections,
          "about",
          "membership",
          "contact",
          "search",
        ].includes(section) &&
          cmsPage && (
            <section className="listing-section prose">
              {cmsPage.data.richText ? (
                <RichText document={cmsPage.data.richText} />
              ) : (
                <p>{cmsPage.body}</p>
              )}
            </section>
          )}
      </main>
      <Footer />
    </>
  );
}

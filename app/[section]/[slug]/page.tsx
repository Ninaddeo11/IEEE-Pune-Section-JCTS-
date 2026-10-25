import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { entry, entries, db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canManage, publicCollection, type Entry } from "@/lib/content";
import { Eyebrow, Artwork, ContentCard, SectionHead } from "@/components/ui";
import { Counter } from "@/components/motion";
import Footer from "@/components/footer";
import Citation from "@/components/citation";
import Gallery from "@/components/gallery";
import RichText from "@/components/rich-text";
export const dynamic = "force-dynamic";
const allowed = [
  "activities",
  "research",
  "publications",
  "opportunities",
  "resources",
  "news",
  "gallery",
  "leadership",
];
const safe = (v: unknown) =>
  typeof v === "string" && (/^https:\/\//.test(v) || /^\/(?!\/)/.test(v))
    ? v
    : null;
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { section, slug } = await params;
  const e =
    (await entry(section, slug)) ??
    (section === "resources"
      ? await entry("documents", slug)
      : section === "news"
        ? await entry("announcements", slug)
        : undefined);
  const preview = (await searchParams).preview;
  return {
    title: e?.seoTitle || e?.title || "Not found",
    robots: preview ? { index: false, follow: false } : undefined,
    description: e?.seoDescription || e?.summary,
    alternates: { canonical: `/${section}/${slug}` },
    openGraph: {
      title: e?.title,
      description: e?.summary,
      ...(e?.image ? { images: [e.image] } : {}),
    },
  };
}
export default async function DetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { section, slug } = await params;
  if (!allowed.includes(section)) notFound();
  const { preview } = await searchParams;
  const user = preview ? await currentUser() : null;
  let isPreview = false;
  let e: Entry | undefined;
  if (user && preview) {
    const snapshot = await db.contentPreview.findUnique({
      where: { id: preview },
    });
    if (
      snapshot &&
      snapshot.userId === user.id &&
      publicCollection(snapshot.collection) === section &&
      canManage(user.role, snapshot.collection) &&
      snapshot.slug === slug &&
      snapshot.expiresAt > new Date()
    ) {
      e = { ...(snapshot.payload as unknown as Entry), id: snapshot.id };
      isPreview = true;
    }
    if (preview === "1" && canManage(user.role, section)) {
      e = await entry(section, slug, true);
      isPreview = true;
    }
  }
  if (!e)
    e =
      (await entry(section, slug)) ??
      (section === "resources"
        ? await entry("documents", slug)
        : section === "news"
          ? await entry("announcements", slug)
          : undefined);
  if (!e) notFound();
  const related = (await entries(section))
    .filter((v) => v.id !== e.id)
    .slice(0, 3);
  const d = e.data;
  const arrays = [
    "highlights",
    "speakers",
    "organizers",
    "schedule",
    "outcomes",
    "tags",
    "technologies",
    "researchers",
    "expertise",
  ];
  const url =
    safe(d.registrationUrl) ||
    safe(d.applicationUrl) ||
    safe(d.url) ||
    safe(d.pdf) ||
    safe(d.profileUrl);
  const schema =
    section === "activities" && e.date
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: e.title,
          description: e.summary,
          startDate: e.date,
          ...(e.endDate ? { endDate: e.endDate } : {}),
          ...(d.venue
            ? { location: { "@type": "Place", name: String(d.venue) } }
            : {}),
          ...(e.image ? { image: e.image } : {}),
        }
      : section === "news"
        ? {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: e.title,
            description: e.summary,
            datePublished: e.date || undefined,
          }
        : null;
  return (
    <>
      {isPreview && (
        <div className="preview-banner">
          ADMIN PREVIEW · {e.status} · This preview is visible only to
          authorized administrators.
        </div>
      )}
      <main id="main" className="page-width">
        {schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
            }}
          />
        )}
        <div className="page-hero detail-hero">
          <p className="breadcrumb">
            <Link href="/">Home</Link> /{" "}
            <Link href={`/${section}`}>{section}</Link> / {e.title}
          </p>
          <Eyebrow>{e.category || "IEEE JCTS • PUNE SECTION"}</Eyebrow>
          <h1>{e.title}</h1>
          <p>{e.summary}</p>
          <div className="detail-meta">
            {e.date && (
              <span>
                {new Date(`${e.date}T12:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {e.endDate &&
                  ` – ${new Date(`${e.endDate}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}
              </span>
            )}
            {Boolean(d.venue) && <span>{String(d.venue)}</span>}
            {Boolean(d.organization) && <span>{String(d.organization)}</span>}
            {Boolean(d.deadline) && <span>Deadline: {String(d.deadline)}</span>}
          </div>
        </div>
        <div className="detail-art">
          {e.image ? (
            <div
              role="img"
              aria-label={e.imageAlt}
              className="cover-image"
              style={{
                backgroundImage: `url(${JSON.stringify(e.image).slice(1, -1)})`,
              }}
            />
          ) : (
            <Artwork variant={e.title.length % 6} />
          )}
        </div>
        <div className="detail-layout">
          <article className="prose">
            <h2>Overview</h2>
            {d.richText ? <RichText document={d.richText} /> : <p>{e.body}</p>}
            {Boolean(d.statistics) && typeof d.statistics === "object" && (
              <>
                <h2>Impact, in numbers.</h2>
                <div className="impact-grid">
                  {Object.entries(d.statistics as Record<string, unknown>).map(
                    ([name, value]) => (
                      <div key={name}>
                        <strong>
                          <Counter value={Number(value)} />
                        </strong>
                        <p>{name}</p>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}
            {arrays.map((key) =>
              Array.isArray(d[key]) && d[key].length > 0 ? (
                <section key={key}>
                  <h2>{key.charAt(0).toUpperCase() + key.slice(1)}</h2>
                  <ul>
                    {(d[key] as unknown[]).map((v, i) => (
                      <li key={i}>
                        {typeof v === "object"
                          ? Object.values(v as Record<string, unknown>)
                              .map(String)
                              .join(" · ")
                          : String(v)}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
            {Boolean(d.abstract) && (
              <>
                <h2>Abstract</h2>
                <p>{String(d.abstract)}</p>
              </>
            )}
            {Boolean(d.eligibility) && (
              <>
                <h2>Eligibility</h2>
                <p>{String(d.eligibility)}</p>
              </>
            )}
            {Boolean(d.bio) && (
              <>
                <h2>Biography</h2>
                <p>{String(d.bio)}</p>
              </>
            )}
            {Array.isArray(d.gallery) && (
              <>
                <h2>Gallery</h2>
                <Gallery
                  pictures={(
                    d.gallery as { url: string; alt: string; type?: string }[]
                  ).filter((p) => safe(p.url))}
                />
              </>
            )}
            {section === "gallery" && !Array.isArray(d.gallery) && (
              <Gallery pictures={[]} />
            )}
          </article>
          <aside className="detail-aside">
            <p className="metadata">IEEE JCTS PUNE SECTION</p>
            <h3>{e.title}</h3>
            {Boolean(d.designation) && <p>{String(d.designation)}</p>}
            {Boolean(d.institution) && <p>{String(d.institution)}</p>}
            {Boolean(d.authors) && <p>Authors: {String(d.authors)}</p>}
            {Boolean(d.doi) && <p>DOI: {String(d.doi)}</p>}
            {url && (
              <p>
                <a
                  className="button small"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {section === "opportunities"
                    ? "Apply / learn more"
                    : section === "resources"
                      ? "Open resource"
                      : "Open official link"}{" "}
                  ↗
                </a>
              </p>
            )}
            {section === "publications" && (
              <Citation
                text={String(
                  d.citation ??
                    `${d.authors ?? ""}. ${e.title}. ${d.venue ?? ""} ${d.year ?? e.date.slice(0, 4)}. ${d.doi ?? ""}`,
                )}
              />
            )}
            <Link className="text-link" href={`/${section}`}>
              ← Back to {section}
            </Link>
          </aside>
        </div>
        {related.length > 0 && (
          <section className="listing-section">
            <SectionHead number="EXPLORE" title="Keep the ideas flowing." />
            <div className="cards-grid">
              {related.map((item, i) => (
                <ContentCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

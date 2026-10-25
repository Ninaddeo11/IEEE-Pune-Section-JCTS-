import { Eyebrow, Artwork, ContentCard, SectionHead } from "@/components/ui";
import DomainSummary from "@/components/domain-summary";
import MediaImage from "@/components/media-image";
import ActivityLogistics from "@/components/activity-logistics";
import { zonedInstant } from "@/lib/dates";
import { Counter } from "@/components/motion";
import Footer from "@/components/footer";
import Citation from "@/components/citation";
import Gallery from "@/components/gallery";
import RichText from "@/components/rich-text";
import Link from "@/client/router";
import { useView } from "@/client/view";
const safe = (v: unknown) =>
  typeof v === "string" && (/^https:\/\//.test(v) || /^\/(?!\/)/.test(v))
    ? v
    : null;
export default function DetailPage() {
  const { e, related, profiles, section, isPreview, siteUrl } = useView();
  const d = e.data;
  const people = Array.isArray(d.people)
    ? (d.people as { personId: string; role: string }[])
    : [];
  const arrays = [
    "highlights",
    "speakers",
    "coordinators",
    "partners",
    "hosts",
    "sdgs",
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
        }
      : section === "news"
        ? {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: e.title,
            description: e.summary,
            datePublished: e.date || undefined,
          }
        : section === "publications"
          ? {
              "@context": "https://schema.org",
              "@type": "ScholarlyArticle",
              headline: e.title,
              abstract: String(d.abstract || e.summary),
              author: String(d.authors || ""),
              datePublished: String(d.year || e.date || ""),
              identifier: String(d.doi || ""),
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
      <main id="main" className={`page-width detail-${section}`}>
        {schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                schema,
                {
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    {
                      "@type": "ListItem",
                      position: 1,
                      name: "Home",
                      item: siteUrl,
                    },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: section,
                      item: `${siteUrl}/${section}`,
                    },
                    { "@type": "ListItem", position: 3, name: e.title },
                  ],
                },
              ]).replace(/</g, "\\u003c"),
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
        <DomainSummary item={e} />
        <div className="detail-art">
          {e.image ? (
            <MediaImage
              src={e.image}
              alt={e.imageAlt}
              sizes="(max-width: 760px) 100vw, 1280px"
            />
          ) : (
            <Artwork variant={e.title.length % 6} />
          )}
        </div>
        <div className="detail-layout">
          <article className="prose">
            {section === "activities" && <ActivityLogistics item={e} />}
            <h2>
              {section === "research"
                ? "Research overview"
                : section === "leadership"
                  ? "About"
                  : "Overview"}
            </h2>
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
            {profiles.length > 0 && (
              <section>
                <h2>People behind the activity</h2>
                <div className="people-grid">
                  {people.map((link, i) => {
                    const person = profiles.find((p) => p.id === link.personId);
                    return person ? (
                      <div className="person-card" key={i}>
                        {person.image && (
                          <div
                            role="img"
                            aria-label={person.imageAlt}
                            className="person-photo"
                            style={{
                              backgroundImage: `url(${JSON.stringify(person.image).slice(1, -1)})`,
                            }}
                          />
                        )}
                        <p className="eyebrow">{link.role}</p>
                        <h3>{person.title}</h3>
                        <p>
                          {String(person.data.designation || "")} ?{" "}
                          {String(person.data.organization || "")}
                        </p>
                        <p>{String(person.data.bio || person.summary)}</p>
                        {safe(person.data.profileUrl) && (
                          <a
                            href={safe(person.data.profileUrl)!}
                            className="text-link"
                          >
                            Professional profile ?
                          </a>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </section>
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
            {["publications", "research", "leadership"].includes(section) && (
              <div className="form-stack">
                {["pdf", "url", "profileUrl"]
                  .filter((key) => safe(d[key]))
                  .map((key) => (
                    <a
                      className="text-link"
                      key={key}
                      href={safe(d[key])!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {key === "pdf"
                        ? "Download PDF"
                        : key === "profileUrl"
                          ? "Professional profile"
                          : "Official website"}{" "}
                      ?
                    </a>
                  ))}
                {Boolean(d.publicationStatus) && (
                  <p>Status: {String(d.publicationStatus)}</p>
                )}
              </div>
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

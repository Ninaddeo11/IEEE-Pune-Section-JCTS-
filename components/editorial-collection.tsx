import Link from "@/client/router";
import type { Entry } from "@/lib/content";
import { publicCollection } from "@/lib/content";
import { safeUrl } from "@/lib/urls";
import { Artwork, EmptyState } from "./ui";
import MediaImage from "./media-image";
import { ArrowUpRight, ArrowRight } from "lucide-react";
const date = (value: string) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "JCTS PUNE";
const href = (e: Entry) => `/${publicCollection(e.collection)}/${e.slug}`;
function Visual({ item }: { item: Entry }) {
  return item.image ? (
    <MediaImage src={item.image} alt={item.imageAlt} />
  ) : (
    <Artwork variant={item.title.length % 6} />
  );
}
export function ActivityEditorial({
  items,
  spotlight = false,
}: {
  items: Entry[];
  spotlight?: boolean;
}) {
  if (!items.length)
    return (
      <EmptyState
        title="The next idea starts here."
        description="New programs appear as the chapter publishes them."
      />
    );
  const [lead, ...rest] = items;
  return (
    <div
      className={`activity-editorial ${spotlight ? "immersive-spotlight" : ""}`}
    >
      <Link href={href(lead)} className="editorial-feature">
        <div className="editorial-feature-visual">
          <Visual item={lead} />
        </div>
        <div className="editorial-feature-copy">
          <span className="editorial-kicker">
            <i />
            {lead.category || "CHAPTER ACTIVITY"}
          </span>
          <h3>{lead.title}</h3>
          <p>{lead.summary}</p>
          <div className="editorial-feature-meta">
            <span>{date(lead.date)}</span>
            {Boolean(lead.data.venue) && <span>{String(lead.data.venue)}</span>}
            <ArrowUpRight size={26} />
          </div>
          {spotlight && Boolean(lead.data.statistics) && (
            <div className="spotlight-statistics">
              {Object.entries(lead.data.statistics as Record<string, number>)
                .slice(0, 4)
                .map(([key, n]) => (
                  <span key={key}>
                    <strong>{Number(n).toLocaleString("en-IN")}</strong>
                    {key}
                  </span>
                ))}
            </div>
          )}
        </div>
      </Link>
      {rest.length > 0 && (
        <div className="editorial-side-list">
          <p className="section-index">
            MORE FROM THE CHAPTER{" "}
            <span>{String(rest.length).padStart(2, "0")}</span>
          </p>
          {rest.map((e, i) => (
            <Link className="editorial-list-item" key={e.id} href={href(e)}>
              <span className="editorial-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="metadata">
                  {e.category} <span>{date(e.date)}</span>
                </p>
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
          ))}
          <Link href="/activities" className="text-link">
            Explore all activities <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}
export default function EditorialCollection({
  items,
  collection,
}: {
  items: Entry[];
  collection: string;
}) {
  if (!items.length) return <EmptyState />;
  if (collection === "activities") return <ActivityEditorial items={items} />;
  if (collection === "research")
    return (
      <div className="research-lab">
        <div className="lab-grid" aria-hidden="true" />
        <p className="lab-label">
          <span className="signal-dot" />
          THE RESEARCH NETWORK
        </p>
        <div className="research-nodes">
          {items.map((e, i) => (
            <Link
              className="research-node"
              key={e.id}
              href={href(e)}
              style={{ "--node-order": i } as React.CSSProperties}
            >
              <span className="node-symbol" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <p className="metadata">
                {e.category || "RESEARCH"} / {String(i + 1).padStart(2, "0")}
              </p>
              <h3>{e.title}</h3>
              <div className="research-node-details">
                <p>{e.summary}</p>
                {Array.isArray(e.data.researchers) && (
                  <p>{e.data.researchers.map(String).join(", ")}</p>
                )}
                {Array.isArray(e.data.technologies) && (
                  <div className="chips">
                    {e.data.technologies.slice(0, 3).map((t, j) => (
                      <span className="chip" key={j}>
                        {String(t)}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-link">
                  Explore research <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  if (collection === "publications")
    return (
      <div className="journal-list">
        {items.map((e, i) => (
          <article className="journal-entry" key={e.id}>
            <span className="editorial-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="journal-year">
              {String(e.data.year || e.date.slice(0, 4) || "—")}
            </div>
            <div>
              <p className="metadata">
                {String(e.data.venue || e.category || "PUBLICATION")}
              </p>
              <Link href={href(e)}>
                <h3>{e.title}</h3>
              </Link>
              <p>{e.summary}</p>
              <div className="journal-citation">
                {Boolean(e.data.authors) && (
                  <span>{String(e.data.authors)}</span>
                )}
                {Boolean(e.data.doi) && <span>DOI {String(e.data.doi)}</span>}
              </div>
            </div>
            <Link
              className="journal-action"
              href={href(e)}
              aria-label={`Read ${e.title}`}
            >
              <ArrowUpRight />
              <span>Read paper</span>
            </Link>
          </article>
        ))}
      </div>
    );
  if (collection === "leadership")
    return (
      <div className="leadership-editorial">
        {items.map((e, i) => (
          <Link className="leadership-profile" href={href(e)} key={e.id}>
            <div className="leadership-portrait">
              <Visual item={e} />
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="leadership-profile-copy">
              <p className="eyebrow">
                {String(e.data.designation || "CHAPTER LEADERSHIP")}
              </p>
              <h3>{e.title}</h3>
              <p>{String(e.data.organization || "")}</p>
              <div className="profile-reveal">
                <p>{String(e.data.bio || e.summary)}</p>
                {Array.isArray(e.data.expertise) && (
                  <p>{e.data.expertise.map(String).join(" · ")}</p>
                )}
                <span className="text-link">
                  View profile <ArrowUpRight size={17} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  if (collection === "news")
    return (
      <div className="news-editorial">
        {items.map((e, i) => (
          <Link
            key={e.id}
            href={href(e)}
            className={i === 0 ? "news-lead" : "news-row"}
          >
            {i === 0 && (
              <div className="news-visual">
                <Visual item={e} />
              </div>
            )}
            <div>
              <p className="metadata">
                {date(e.date)} <span>{e.category || "CHAPTER NEWS"}</span>
              </p>
              <h3>{e.title}</h3>
              <p>{e.summary}</p>
              {Boolean(e.data.readTime) && (
                <small>{String(e.data.readTime)} min read</small>
              )}
              <ArrowUpRight size={21} />
            </div>
          </Link>
        ))}
      </div>
    );
  if (collection === "opportunities")
    return (
      <div className="opportunity-editorial">
        {items.map((e) => {
          const closed =
            !!e.data.deadline && new Date(String(e.data.deadline)) < new Date();
          return (
            <Link key={e.id} href={href(e)} className="opportunity-entry">
              <span className={`opportunity-state ${closed ? "closed" : ""}`}>
                <i />
                {closed ? "CLOSED" : "EXPLORE"}
              </span>
              <div>
                <p className="metadata">{e.category || "OPPORTUNITY"}</p>
                <h3>{e.title}</h3>
                <p>{String(e.data.organization || e.summary)}</p>
              </div>
              <div className="opportunity-deadline">
                {e.data.deadline ? (
                  <>
                    <small>Deadline</small>
                    {String(e.data.deadline)}
                  </>
                ) : (
                  <small>View details</small>
                )}
              </div>
              <ArrowUpRight />
            </Link>
          );
        })}
      </div>
    );
  if (collection === "gallery")
    return (
      <div className="album-editorial">
        {items.map((e) => (
          <Link key={e.id} href={href(e)} className="album-entry">
            <Visual item={e} />
            <div>
              <span className="eyebrow">CHAPTER MOMENTS</span>
              <h3>{e.title}</h3>
              <ArrowUpRight />
            </div>
          </Link>
        ))}
      </div>
    );
  return (
    <div className="resource-editorial">
      {items.map((e) => (
        <Link key={e.id} href={href(e)} className="resource-entry">
          <span>{e.category || e.collection}</span>
          <h3>{e.title}</h3>
          <p>{e.summary}</p>
          <ArrowUpRight />
        </Link>
      ))}
    </div>
  );
}
export function FocusNetwork({ items }: { items: Entry[] }) {
  return (
    <div className="focus-network">
      {items.map((e, i) => (
        <a key={e.id} className="focus-network-item" href={safeUrl(e.data.url)}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <i aria-hidden="true" />
          <h3>{e.title}</h3>
          <ArrowUpRight size={17} />
        </a>
      ))}
    </div>
  );
}

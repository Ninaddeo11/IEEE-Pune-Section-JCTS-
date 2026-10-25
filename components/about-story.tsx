import Link from "@/client/router";
import type { Entry } from "@/lib/content";
import RichText from "./rich-text";
import { FocusNetwork } from "./editorial-collection";
import { Reveal } from "./motion";
import { ArrowUpRight } from "lucide-react";
import { safeUrl } from "@/lib/urls";
export default function AboutStory({
  page,
  settings,
  all,
}: {
  page?: Entry;
  settings?: Entry;
  all: Entry[];
}) {
  const d = settings?.data || {};
  const focus = all.filter((e) => e.collection === "focus-areas");
  return (
    <section className="about-story listing-section">
      <Reveal>
        <div className="about-opening">
          <span className="eyebrow">OUR FOUNDATION</span>
          <h2>
            {String(
              page?.data.subheading ||
                "Different perspectives. A shared purpose.",
            )}
          </h2>
          <p className="lead">{settings?.summary}</p>
          <div className="prose">
            {page?.data.richText ? (
              <RichText document={page.data.richText} />
            ) : (
              <p>{page?.body}</p>
            )}
          </div>
        </div>
      </Reveal>
      <div className="chapter-storyline">
        {[
          ["01", "Mission", d.mission],
          ["02", "Vision", d.vision],
        ]
          .filter((item) => item[2])
          .map(([number, title, copy]) => (
            <Reveal key={String(number)}>
              <article className="chapter-story-step">
                <span>{String(number)}</span>
                <h2>{String(title)}</h2>
                <p>{String(copy)}</p>
                <span className="chapter-story-point" aria-hidden="true" />
              </article>
            </Reveal>
          ))}
      </div>
      {focus.length > 0 && (
        <Reveal>
          <div className="section-head">
            <div>
              <p className="section-index">03 / WHAT WE DO</p>
              <h2>
                Many disciplines.
                <br />
                One connected chapter.
              </h2>
            </div>
          </div>
          <FocusNetwork items={focus} />
        </Reveal>
      )}
      <Reveal>
        <div className="about-community">
          <p className="eyebrow">OUR COMMUNITY</p>
          <h2>Progress has a human side.</h2>
          <p>Discover the people and activities behind IEEE JCTS Pune.</p>
          <div className="hero-buttons">
            <Link href="/leadership" className="button secondary">
              Meet the leadership
              <ArrowUpRight size={17} />
            </Link>
            <Link href="/activities" className="button">
              Explore our activities
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </Reveal>
      {Boolean(page?.data.ctaHeading) && (
        <div className="connection-cta">
          <p className="eyebrow">CONNECT WITH THE CHAPTER</p>
          <h2>{String(page?.data.ctaHeading)}</h2>
          <p>{String(page?.data.ctaDescription || "")}</p>
          <Link
            className="button"
            href={safeUrl(page?.data.ctaUrl, "/contact")}
          >
            {String(page?.data.ctaText || "Get involved")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}

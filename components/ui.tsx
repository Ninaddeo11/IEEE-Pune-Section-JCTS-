import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Network,
  FlaskConical,
  Globe,
  Lightbulb,
  GraduationCap,
  Briefcase,
  Users,
  Settings,
} from "lucide-react";
import { publicCollection, type Entry } from "@/lib/content";
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? <ArrowUpRight size={18} /> : <ArrowRight size={18} />;
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
export function SectionHead({
  number,
  title,
  description,
  href,
  link = "Explore more",
}: {
  number: string;
  title: string;
  description?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="section-index">{number} / CONNECTED BY PURPOSE</p>
        <h2>{title}</h2>
        {description && <p className="muted">{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {link}
          <Arrow />
        </Link>
      )}
    </div>
  );
}
export function Artwork({
  variant = 0,
  className = "",
}: {
  variant?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`artwork artwork-${variant % 6} ${className}`}
    >
      <div className="art-grid" />
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-orbit orbit-three" />
      <div className="art-core" />
      <span className="art-label">JCTS / SYSTEMS IN MOTION</span>
      <span className="art-cross">+</span>
    </div>
  );
}
export function ContentCard({
  item,
  index = 0,
}: {
  item: Entry;
  index?: number;
}) {
  return (
    <Link
      className="content-card"
      href={`/${publicCollection(item.collection)}/${item.slug}`}
    >
      <div className="card-visual">
        {item.image ? (
          <div
            role="img"
            aria-label={item.imageAlt}
            className="cover-image"
            style={{
              backgroundImage: `url(${JSON.stringify(item.image).slice(1, -1)})`,
            }}
          />
        ) : (
          <Artwork variant={index} />
        )}
        <span className="category-badge">
          {item.category || item.collection}
        </span>
        <span className="card-arrow">
          <Arrow diagonal />
        </span>
      </div>
      <div className="card-copy">
        <p className="metadata">
          {item.date
            ? new Date(`${item.date}T12:00:00`).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "JCTS PUNE SECTION"}
          <span>↗</span>
        </p>
        <h3>{item.title}</h3>
        {item.collection === "opportunities" &&
          typeof item.data.deadline === "string" &&
          item.data.deadline && (
            <p className="deadline-badge">
              {new Date(item.data.deadline) < new Date()
                ? "Applications closed"
                : "Apply by"}{" "}
              · {item.data.deadline}
            </p>
          )}
        {item.collection === "leadership" && Boolean(item.data.designation) && (
          <p className="people-designation">
            {String(item.data.designation)}
            {item.data.organization
              ? ` · ${String(item.data.organization)}`
              : ""}
          </p>
        )}
        {item.collection === "publications" && Boolean(item.data.authors) && (
          <p className="publication-authors">
            {String(item.data.authors)} ·{" "}
            {String(item.data.year ?? item.date.slice(0, 4))}
          </p>
        )}
        <p>{item.summary}</p>
      </div>
    </Link>
  );
}
export const focusIcons = [
  Briefcase,
  Network,
  FlaskConical,
  Lightbulb,
  Globe,
  GraduationCap,
  Users,
  Settings,
];
export function EmptyState({
  title = "More is on the horizon.",
  description = "New work and updates will appear here as the chapter publishes them.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <Network size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

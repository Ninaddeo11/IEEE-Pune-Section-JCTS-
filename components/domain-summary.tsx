import type { Entry } from "@/lib/content";
import { safeUrl } from "@/lib/urls";
import { FlaskConical, FileText, Users } from "lucide-react";
export default function DomainSummary({ item: e }: { item: Entry }) {
  if (!["research", "publications", "leadership"].includes(e.collection))
    return null;
  const fields =
    e.collection === "publications"
      ? ["authors", "venue", "year", "doi"]
      : e.collection === "research"
        ? ["institution", "publicationStatus", "doi"]
        : ["designation", "organization", "group"];
  const Icon =
    e.collection === "research"
      ? FlaskConical
      : e.collection === "publications"
        ? FileText
        : Users;
  return (
    <section
      className={`domain-summary domain-${e.collection}`}
      aria-label={`${e.collection} information`}
    >
      <div className="domain-icon">
        <Icon size={32} strokeWidth={1.3} />
      </div>
      <dl>
        {fields
          .filter((k) => e.data[k])
          .map((k) => (
            <div key={k}>
              <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
              <dd>{String(e.data[k])}</dd>
            </div>
          ))}
      </dl>
      <div className="domain-links">
        {["pdf", "url", "profileUrl"]
          .filter((k) => e.data[k] && safeUrl(e.data[k], ""))
          .map((k) => (
            <a
              className="button secondary small"
              href={safeUrl(e.data[k])}
              key={k}
              target="_blank"
              rel="noopener noreferrer"
            >
              {k === "pdf"
                ? "Read the paper"
                : k === "profileUrl"
                  ? "Professional profile"
                  : "Project website"}{" "}
              ↗
            </a>
          ))}
      </div>
    </section>
  );
}

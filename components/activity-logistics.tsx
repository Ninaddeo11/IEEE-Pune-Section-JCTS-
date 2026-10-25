import type { Entry } from "@/lib/content";
import { safeUrl } from "@/lib/urls";
export default function ActivityLogistics({ item: e }: { item: Entry }) {
  const d = e.data;
  const fields = [
    "activityType",
    "startTime",
    "endTime",
    "timezone",
    "venue",
    "location",
    "format",
    "registrationDeadline",
    "registrationStatus",
    "registrationDetails",
    "capacity",
    "eligibility",
  ];
  return (
    <section className="activity-logistics" aria-label="Activity information">
      <dl className="logistics-grid">
        {fields
          .filter((k) => d[k] !== undefined && d[k] !== "")
          .map((k) => (
            <div key={k}>
              <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
              <dd>{String(d[k])}</dd>
            </div>
          ))}
      </dl>
      <div className="hero-buttons">
        {["registrationUrl", "meetingUrl", "url"]
          .filter((k) => d[k] && safeUrl(d[k], ""))
          .map((k) => (
            <a
              key={k}
              className={`button ${k === "registrationUrl" ? "" : "secondary"}`}
              href={safeUrl(d[k])}
              target="_blank"
              rel="noopener noreferrer"
            >
              {k === "registrationUrl"
                ? d.registrationStatus === "Closed" ||
                  d.registrationStatus === "Full"
                  ? "Registration information"
                  : "Register"
                : k === "meetingUrl"
                  ? "Join online"
                  : "Official website"}{" "}
              ↗
            </a>
          ))}
      </div>
      {Boolean(d.videoUrl) && (
        <div className="activity-video">
          <h2>Watch the activity</h2>
          <video
            controls
            preload="metadata"
            src={safeUrl(d.videoUrl)}
            poster={d.videoThumbnail ? safeUrl(d.videoThumbnail) : undefined}
            aria-label={String(d.videoDescription || e.title)}
          />
          <p>{String(d.videoDescription || "")}</p>
        </div>
      )}
    </section>
  );
}

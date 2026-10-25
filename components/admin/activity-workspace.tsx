import { useState, useRef, type Dispatch, type SetStateAction } from "react";
import { ViewContext, useView } from "@/client/view";
import type { Entry } from "@/lib/content";
import { slugify } from "@/lib/content";
import { permits, type Actor } from "@/lib/policy";
import { localInput } from "@/lib/dates";
import type { JSONContent } from "@tiptap/react";
import { ContentCard } from "../ui";
import DetailPage from "@/client/pages/detail";
import RichEditor from "./rich-editor";
import StructuredFields from "./structured-fields";
import AssetUpload from "./asset-upload";
import { Eye, Save, Send, Globe, X, Trash2 } from "lucide-react";
type Asset = {
  id: string;
  url: string;
  alt: string;
  name: string;
  mime: string;
};
type Props = {
  item: Entry;
  setItem: Dispatch<SetStateAction<Entry>>;
  extra: string;
  setExtra: Dispatch<SetStateAction<string>>;
  assets: Asset[];
  setAssets: Dispatch<SetStateAction<Asset[]>>;
  actor: Actor;
  categories: string[];
  records: Entry[];
  readOnly: boolean;
  busy: boolean;
  error: string;
  saved: string;
  allowedStatuses: readonly string[];
  save: (status?: string, preview?: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  recovered: boolean;
  onDiscard: () => void;
};
const tabs = [
  "Basic",
  "Event",
  "People",
  "Content",
  "Media",
  "Registration",
  "SEO",
  "Publish",
];
const label = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
export default function ActivityWorkspace(p: Props) {
  const [tab, setTab] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const view = useView();
  const { item, extra, assets, readOnly } = p;
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(extra);
  } catch {
    /* The advanced editor reports the error below. */
  }
  const set = (field: keyof Entry, value: unknown) =>
    p.setItem((old) => ({ ...old, [field]: value }));
  const setData = (field: string, value: unknown) =>
    p.setExtra(JSON.stringify({ ...data, [field]: value }, null, 2));
  const fields = (names: string[]) =>
    names.map((name) => (
      <label key={name}>
        {label(name)}
        {["format", "registrationStatus"].includes(name) ? (
          <select
            value={String(data[name] || "")}
            onChange={(e) => setData(name, e.target.value)}
          >
            <option value="">Choose...</option>
            {(name === "format"
              ? ["Online", "Offline", "Hybrid"]
              : ["Open", "Closed", "Coming soon", "Full", "Not required"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        ) : (
          <input
            type={
              name.endsWith("Time")
                ? "time"
                : name === "registrationDeadline"
                  ? "date"
                  : name === "capacity"
                    ? "number"
                    : "text"
            }
            min={name === "capacity" ? 0 : undefined}
            value={String(data[name] || "")}
            placeholder={name === "timezone" ? "Asia/Kolkata" : undefined}
            onChange={(e) => setData(name, e.target.value)}
          />
        )}
      </label>
    ));
  const structured = (names: string[], gallery = false, stats = false) => (
    <StructuredFields
      collection="activities"
      value={extra}
      onChange={p.setExtra}
      media={assets}
      fields={names}
      showGallery={gallery}
      showStats={stats}
    />
  );
  const live = { ...item, data };
  return (
    <>
      <div className="admin-heading activity-workspace-heading">
        <div>
          <p className="eyebrow">
            CONTENT / ACTIVITIES / {item.id ? "EDIT" : "NEW"}
          </p>
          <h1>
            {item.id
              ? "Shape the next chapter."
              : "An idea worth bringing together."}
          </h1>
          <p>{item.title || "Untitled activity"}</p>
        </div>
        <span className={`status ${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      </div>
      {p.recovered && (
        <div className="notice">
          Recovered a local editing copy.{" "}
          <button className="text-link" onClick={p.onDiscard}>
            Discard recovery
          </button>
        </div>
      )}
      {readOnly && (
        <div className="notice">
          Read-only view. Publishing permissions are required to change approved
          or live content.
        </div>
      )}
      <div className="activity-workspace">
        <div className="activity-workspace-main">
          <div
            className="editor-tabs"
            role="tablist"
            aria-label="Activity editor sections"
          >
            {tabs.map((name, i) => (
              <button
                key={name}
                id={`editor-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={tab === i}
                aria-controls="activity-tab-panel"
                tabIndex={tab === i ? 0 : -1}
                onClick={() => setTab(i)}
                onKeyDown={(e) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 7
                        : (i + (e.key === "ArrowRight" ? 1 : 7)) % 8;
                  setTab(next);
                  const nodes =
                    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                      "[role=tab]",
                    );
                  nodes?.[next].focus();
                }}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {name}
              </button>
            ))}
          </div>
          <fieldset className="editor-tab-fieldset" disabled={readOnly}>
            <section
              className="admin-panel editor-tab-panel"
              id="activity-tab-panel"
              role="tabpanel"
              aria-labelledby={`editor-tab-${tab}`}
            >
              {tab === 0 && (
                <>
                  <div className="editor-section-head">
                    <span>01 / THE ESSENTIALS</span>
                    <h2>Every great activity starts with a clear idea.</h2>
                    <p>
                      The headline, context and story your audience will
                      discover.
                    </p>
                  </div>
                  <div className="form-grid">
                    <label className="wide">
                      Title
                      <input
                        value={item.title}
                        maxLength={300}
                        onChange={(e) =>
                          p.setItem((old) => ({
                            ...old,
                            title: e.target.value,
                            ...(!old.id
                              ? { slug: slugify(e.target.value) }
                              : {}),
                          }))
                        }
                      />
                    </label>
                    <label>
                      URL slug
                      <input
                        value={item.slug}
                        onChange={(e) => set("slug", e.target.value)}
                      />
                    </label>
                    <label>
                      Category
                      <select
                        value={item.category}
                        onChange={(e) => set("category", e.target.value)}
                      >
                        <option value="">Choose category...</option>
                        {p.categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="wide">
                      Short description
                      <textarea
                        rows={3}
                        value={item.summary}
                        onChange={(e) => set("summary", e.target.value)}
                      />
                    </label>
                    {fields(["activityType"])}
                    <div className="wide">
                      <p className="field-caption">Full description</p>
                      <RichEditor
                        readOnly={readOnly}
                        value={
                          (data.richText as JSONContent) || {
                            type: "doc",
                            content: item.body
                              .split("\n")
                              .map((text) => ({
                                type: "paragraph",
                                content: text ? [{ type: "text", text }] : [],
                              })),
                          }
                        }
                        onChange={(json, text) => {
                          setData("richText", json);
                          set("body", text);
                        }}
                      />
                    </div>
                  </div>
                  {structured(["tags"])}
                </>
              )}
              {tab === 1 && (
                <>
                  <div className="editor-section-head">
                    <span>02 / EVENT LOGISTICS</span>
                    <h2>A time. A place. A reason to connect.</h2>
                    <p>
                      Event times are interpreted in the selected IANA timezone.
                    </p>
                  </div>
                  <div className="form-grid">
                    <label>
                      Date
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => set("date", e.target.value)}
                      />
                    </label>
                    <label>
                      End date
                      <input
                        type="date"
                        value={item.endDate}
                        onChange={(e) => set("endDate", e.target.value)}
                      />
                    </label>
                    {fields([
                      "startTime",
                      "endTime",
                      "timezone",
                      "venue",
                      "location",
                      "format",
                      "meetingUrl",
                    ])}
                  </div>
                </>
              )}
              {tab === 2 && (
                <>
                  <div className="editor-section-head">
                    <span>03 / PEOPLE & COLLABORATION</span>
                    <h2>Ideas move forward through people.</h2>
                    <p>
                      Add reusable profiles or retain the flexibility of text
                      entries.
                    </p>
                  </div>
                  <label>
                    Reusable person
                    <select
                      value=""
                      onChange={(e) =>
                        setData("people", [
                          ...(Array.isArray(data.people) ? data.people : []),
                          { personId: e.target.value, role: "Speaker" },
                        ])
                      }
                    >
                      <option value="">Add an existing person...</option>
                      {p.records
                        .filter((r) => r.collection === "people")
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  {(Array.isArray(data.people)
                    ? (data.people as { personId: string; role: string }[])
                    : []
                  ).map((person, i) => (
                    <div className="editor-person-row" key={i}>
                      <strong>
                        {p.records.find((r) => r.id === person.personId)
                          ?.title || "Unavailable person"}
                      </strong>
                      <select
                        aria-label="Participation role"
                        value={person.role}
                        onChange={(e) =>
                          setData(
                            "people",
                            (data.people as object[]).map((entry, j) =>
                              j === i
                                ? { ...person, role: e.target.value }
                                : entry,
                            ),
                          )
                        }
                      >
                        {[
                          "Speaker",
                          "Organizer",
                          "Coordinator",
                          "Partner",
                          "Host",
                        ].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Remove person"
                        onClick={() =>
                          setData(
                            "people",
                            (data.people as object[]).filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {structured([
                    "speakers",
                    "organizers",
                    "coordinators",
                    "partners",
                    "hosts",
                  ])}
                </>
              )}
              {tab === 3 && (
                <>
                  <div className="editor-section-head">
                    <span>04 / THE EXPERIENCE</span>
                    <h2>Give the activity its depth.</h2>
                    <p>
                      Build a clear program, capture its outcomes and connect it
                      to impact.
                    </p>
                  </div>
                  {structured(
                    ["schedule", "highlights", "outcomes", "sdgs"],
                    false,
                    true,
                  )}
                  <details className="advanced-content">
                    <summary>Advanced structured content</summary>
                    <textarea
                      aria-label="Structured content JSON"
                      className="json-field"
                      value={extra}
                      onChange={(e) => p.setExtra(e.target.value)}
                    />
                  </details>
                </>
              )}
              {tab === 4 && (
                <>
                  <div className="editor-section-head">
                    <span>05 / MEDIA LIBRARY</span>
                    <h2>Make the story visible.</h2>
                    <p>
                      Use meaningful imagery with descriptive alternative text.
                    </p>
                  </div>
                  {item.image && (
                    <div className="editor-cover-preview">
                      <img src={item.image} alt={item.imageAlt} />
                      <button
                        className="button secondary small"
                        onClick={() => {
                          set("image", "");
                          set("imageAlt", "");
                        }}
                      >
                        Remove cover
                      </button>
                    </div>
                  )}
                  {permits(p.actor, "MEDIA_UPLOAD", "media") && (
                    <AssetUpload
                      onUpload={(asset, purpose) => {
                        p.setAssets((old) => [...old, asset]);
                        if (purpose === "cover")
                          p.setItem((old) => ({
                            ...old,
                            image: asset.url,
                            imageAlt: asset.alt,
                          }));
                        else if (purpose === "gallery")
                          setData("gallery", [
                            ...(Array.isArray(data.gallery)
                              ? data.gallery
                              : []),
                            {
                              url: asset.url,
                              alt: asset.alt,
                              type: asset.mime.startsWith("video/")
                                ? "video"
                                : "image",
                            },
                          ]);
                        else if (purpose === "video")
                          p.setExtra(
                            JSON.stringify(
                              {
                                ...data,
                                videoUrl: asset.url,
                                videoDescription: asset.alt,
                              },
                              null,
                              2,
                            ),
                          );
                        else setData("videoThumbnail", asset.url);
                      }}
                    />
                  )}
                  <div className="form-grid">
                    <label className="wide">
                      Choose an existing image
                      <select
                        value=""
                        onChange={(e) => {
                          const asset = assets.find(
                            (a) => a.id === e.target.value,
                          );
                          if (asset)
                            p.setItem((old) => ({
                              ...old,
                              image: asset.url,
                              imageAlt: asset.alt,
                            }));
                        }}
                      >
                        <option value="">Select from media library...</option>
                        {assets
                          .filter((a) => a.mime.startsWith("image/"))
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Hero image URL
                      <input
                        value={item.image}
                        onChange={(e) => set("image", e.target.value)}
                      />
                    </label>
                    <label>
                      Image alt text
                      <input
                        value={item.imageAlt}
                        onChange={(e) => set("imageAlt", e.target.value)}
                      />
                    </label>
                    {fields(["videoUrl", "videoThumbnail", "videoDescription"])}
                  </div>
                  {structured([], true)}
                </>
              )}
              {tab === 5 && (
                <>
                  <div className="editor-section-head">
                    <span>06 / REGISTRATION</span>
                    <h2>Turn interest into participation.</h2>
                    <p>
                      Connect visitors to registration and explain who can take
                      part.
                    </p>
                  </div>
                  <div className="form-grid">
                    {fields([
                      "registrationUrl",
                      "registrationDeadline",
                      "registrationStatus",
                      "capacity",
                      "eligibility",
                      "registrationDetails",
                      "url",
                    ])}
                  </div>
                </>
              )}
              {tab === 6 && (
                <>
                  <div className="editor-section-head">
                    <span>07 / DISCOVERABILITY</span>
                    <h2>Help the right people find it.</h2>
                    <p>
                      Search metadata defaults to your activity title and
                      summary.
                    </p>
                  </div>
                  <div className="form-grid">
                    <label className="wide">
                      SEO title
                      <input
                        value={item.seoTitle}
                        onChange={(e) => set("seoTitle", e.target.value)}
                      />
                    </label>
                    <label className="wide">
                      SEO description
                      <textarea
                        rows={4}
                        value={item.seoDescription}
                        onChange={(e) => set("seoDescription", e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="search-result-preview">
                    <span>
                      {view.siteUrl}/activities/{item.slug || "your-activity"}
                    </span>
                    <h3>
                      {item.seoTitle || item.title || "Your activity title"}
                    </h3>
                    <p>
                      {item.seoDescription ||
                        item.summary ||
                        "A clear, meaningful description for your audience."}
                    </p>
                  </div>
                </>
              )}
              {tab === 7 && (
                <>
                  <div className="editor-section-head">
                    <span>08 / PUBLICATION</span>
                    <h2>Ready to meet the world?</h2>
                    <p>
                      Publishing actions are checked against your role on the
                      server.
                    </p>
                  </div>
                  <div className="publication-steps">
                    {[
                      "DRAFT",
                      "REVIEW",
                      "APPROVED",
                      "SCHEDULED",
                      "PUBLISHED",
                      "COMPLETED",
                      "ARCHIVED",
                    ].map((s) => (
                      <span
                        key={s}
                        className={`status ${s.toLowerCase()} ${item.status === s ? "current" : ""}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <label>
                    Scheduled publication
                    <input
                      type="datetime-local"
                      value={localInput(item.publishAt)}
                      onChange={(e) =>
                        set(
                          "publishAt",
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        )
                      }
                    />
                  </label>
                  <p className="field-help">
                    Displayed in your browser timezone. Select SCHEDULED and
                    save to schedule visibility.
                  </p>
                  <p className="field-help">
                    Previews are private, bound to your account and expire after
                    one hour. They use the public page renderer.
                  </p>
                </>
              )}
            </section>
          </fieldset>
        </div>
        <aside className="activity-inspector">
          <div className="admin-panel">
            <p className="eyebrow">PUBLICATION CONTROL</p>
            <label>
              Publication status
              <select
                disabled={readOnly}
                value={item.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {p.allowedStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="inspector-visibility">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={item.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                />
                Featured content
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={item.homepage}
                  onChange={(e) => set("homepage", e.target.checked)}
                />
                Show on homepage
              </label>
            </div>
            <dl>
              <div>
                <dt>Visibility</dt>
                <dd>
                  {["PUBLISHED", "COMPLETED"].includes(item.status)
                    ? "Public"
                    : item.status === "SCHEDULED"
                      ? "Scheduled"
                      : "Private"}
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleString()
                    : "Not saved yet"}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="button secondary small"
              onClick={() => dialog.current?.showModal()}
            >
              <Eye size={15} />
              Live preview
            </button>
          </div>
          <div className="inspector-preview">
            <p className="eyebrow">PUBLIC CARD PREVIEW</p>
            <ContentCard item={live} />
          </div>
        </aside>
      </div>
      {p.error && (
        <p className="form-error" role="alert">
          {p.error}
        </p>
      )}
      <div className="editor-toolbar workspace-toolbar">
        <span role="status">{p.saved || "Ready to create"}</span>
        {!readOnly && (
          <>
            <button
              className="button secondary small"
              disabled={p.busy || !p.allowedStatuses.includes("DRAFT")}
              onClick={() => p.save("DRAFT")}
            >
              <Save size={14} />
              Save draft
            </button>
            <button
              className="button secondary small"
              disabled={p.busy}
              onClick={() => p.save(item.status, true)}
            >
              Preview changes ↗
            </button>
            {p.allowedStatuses.includes("REVIEW") &&
              item.status !== "REVIEW" && (
                <button
                  className="button secondary small"
                  disabled={p.busy}
                  onClick={() => p.save("REVIEW")}
                >
                  <Send size={14} />
                  Submit for review
                </button>
              )}
            {permits(p.actor, "APPROVE", "activities") &&
              item.status === "REVIEW" && (
                <button
                  className="button small"
                  disabled={p.busy}
                  onClick={() => p.save("APPROVED")}
                >
                  Approve
                </button>
              )}
            <button
              className="button secondary small"
              disabled={p.busy}
              onClick={() => p.save()}
            >
              Save changes
            </button>
            {permits(p.actor, "PUBLISH", "activities") && (
              <button
                className="button small"
                disabled={p.busy}
                onClick={() => p.save("PUBLISHED")}
              >
                <Globe size={14} />
                Publish ↗
              </button>
            )}
            {item.id && (
              <button
                className="icon-button"
                disabled={p.busy}
                aria-label="Delete content"
                onClick={p.onDelete}
              >
                <Trash2 size={17} />
              </button>
            )}
          </>
        )}
      </div>
      <dialog className="workspace-preview-dialog" ref={dialog}>
        <div className="workspace-preview-top">
          <span>LIVE PREVIEW / UNSAVED CHANGES</span>
          <button
            className="icon-button"
            aria-label="Close live preview"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <ViewContext.Provider
          value={{
            ...view,
            page: "detail",
            section: "activities",
            e: live,
            related: [],
            profiles: p.records.filter(
              (r) =>
                Array.isArray(data.people) &&
                (data.people as { personId: string }[]).some(
                  (person) => person.personId === r.id,
                ),
            ),
            isPreview: true,
          }}
        >
          <div className="workspace-preview-page">
            <DetailPage />
          </div>
        </ViewContext.Provider>
      </dialog>
    </>
  );
}

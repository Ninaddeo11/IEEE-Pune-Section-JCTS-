import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/client/router";
import { slugify, statuses, publicCollection, type Entry } from "@/lib/content";
import { permits, assertTransition } from "@/lib/policy";
import { localInput } from "@/lib/dates";
import ActivityWorkspace from "./activity-workspace";
import AssetUpload from "./asset-upload";
import Revisions from "./revisions";
import ModuleFields from "./module-fields";
import RichEditor from "./rich-editor";
import StructuredFields from "./structured-fields";
import type { JSONContent } from "@tiptap/react";
type MediaOption = {
  id: string;
  url: string;
  alt: string;
  name: string;
  mime: string;
};
const extraFields: Record<string, string[]> = {
  pages: ["subheading", "ctaHeading", "ctaDescription", "ctaText", "ctaUrl"],
  activities: [
    "url",
    "activityType",
    "registrationStatus",
    "registrationDetails",
    "videoThumbnail",
    "videoDescription",
    "startTime",
    "endTime",
    "timezone",
    "venue",
    "location",
    "format",
    "meetingUrl",
    "registrationUrl",
    "registrationDeadline",
    "eligibility",
    "capacity",
    "videoUrl",
  ],
  people: ["designation", "organization", "bio", "profileUrl"],
  leadership: ["designation", "organization", "bio", "profileUrl", "group"],
  research: [
    "abstract",
    "institution",
    "doi",
    "publicationStatus",
    "pdf",
    "url",
  ],
  publications: [
    "authors",
    "year",
    "venue",
    "abstract",
    "doi",
    "pdf",
    "citation",
    "url",
  ],
  opportunities: ["organization", "deadline", "eligibility", "applicationUrl"],
  news: ["author", "readTime"],
  announcements: ["author"],
  resources: ["url", "format"],
  documents: ["url", "format"],
  partners: ["url"],
  settings: ["mission", "vision", "email", "phone", "footerText"],
  homepage: ["eyebrow", "ctaText", "ctaUrl"],
  statistics: ["value"],
  navigation: ["url", "order", "parent"],
  gallery: [],
  "focus-areas": ["url", "order"],
};
const defaultData: Record<string, Record<string, unknown>> = {
  activities: {
    speakers: [],
    organizers: [],
    schedule: [],
    highlights: [],
    outcomes: [],
    tags: [],
    gallery: [],
  },
  leadership: { expertise: [] },
  research: { researchers: [], technologies: [] },
  gallery: { gallery: [] },
};
export default function Editor({
  initial,
  media,
  readOnly = false,
  actor,
  categories = [],
  records = [],
  userId,
}: {
  initial: Entry;
  media: MediaOption[];
  readOnly?: boolean;
  actor: { role: string; permissions?: unknown };
  categories?: string[];
  records?: Entry[];
  userId: string;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(media);
  const [item, setItem] = useState(initial);
  const [extra, setExtra] = useState(
    JSON.stringify(
      { ...defaultData[initial.collection], ...initial.data },
      null,
      2,
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [draftNotice, setDraftNotice] = useState(false);
  const [ready, setReady] = useState(false);
  const restored = useRef(false);
  const lastSaved = useRef(
    JSON.stringify({
      item: initial,
      extra: JSON.stringify(
        { ...defaultData[initial.collection], ...initial.data },
        null,
        2,
      ),
    }),
  );
  const key = `jcts-editor:${userId}:${initial.collection}:${initial.id || "new"}`;
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    queueMicrotask(() => {
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const value = JSON.parse(cached);
          setItem(value.item);
          setExtra(value.extra);
          setDraftNotice(true);
        } catch {
          localStorage.removeItem(key);
        }
      }
      setReady(true);
    });
  }, [key]);
  useEffect(() => {
    if (!ready || readOnly) return;
    const timeout = setTimeout(() => {
      if (JSON.stringify({ item, extra }) === lastSaved.current) {
        localStorage.removeItem(key);
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify({ item, extra }));
        setSaved("Recovery copy saved on this device");
      } catch {
        setSaved("Local recovery unavailable — save your draft");
      }
    }, 900);
    return () => clearTimeout(timeout);
  }, [item, extra, key, ready, readOnly]);
  useEffect(() => {
    if (!ready || readOnly || !item.id || item.status !== "DRAFT" || busy)
      return;
    const revision = JSON.stringify({ item, extra });
    if (revision === lastSaved.current) return;
    const timer = setTimeout(async () => {
      try {
        const data = JSON.parse(extra);
        if (!item.title.trim() || !item.slug) return;
        setSaved("Autosaving draft…");
        const response = await fetch("/api/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, data, status: "DRAFT" }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        lastSaved.current = JSON.stringify({ item: result, extra });
        setItem((old) => ({
          ...old,
          data: result.data,
          version: result.version,
          updatedAt: result.updatedAt,
        }));
        setSaved("Draft autosaved to database");
      } catch {
        setSaved("Database autosave unavailable — recovery copy retained");
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [item, extra, ready, readOnly, busy]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!readOnly && JSON.stringify({ item, extra }) !== lastSaved.current)
        event.preventDefault();
    };
    const leave = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !readOnly &&
        link &&
        link.target !== "_blank" &&
        !link.hash &&
        JSON.stringify({ item, extra }) !== lastSaved.current &&
        !window.confirm("You have unsaved changes. Leave this editor?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", leave, true);
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", leave, true);
    };
  }, [item, extra, readOnly]);
  const allowedStatuses = statuses.filter((status) => {
    try {
      assertTransition(actor, item.collection, item.status, status);
      return true;
    } catch {
      return false;
    }
  });
  function change<K extends keyof Entry>(field: K, value: Entry[K]) {
    setItem((old) => ({ ...old, [field]: value }));
  }
  async function save(status = item.status, preview = false) {
    setBusy(true);
    setError("");
    setSaved("Saving…");
    try {
      let data;
      try {
        data = JSON.parse(extra);
      } catch {
        throw new Error("Structured content must be valid JSON.");
      }
      if (preview) {
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, status, data }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        const detailTypes = [
          "activities",
          "leadership",
          "research",
          "publications",
          "news",
          "announcements",
          "opportunities",
          "resources",
          "documents",
          "gallery",
        ];
        const path =
          item.collection === "pages"
            ? `/${item.slug}`
            : detailTypes.includes(item.collection)
              ? `/${publicCollection(item.collection)}/${item.slug}`
              : item.collection === "settings"
                ? "/about"
                : item.collection === "faqs"
                  ? "/contact"
                  : "/";
        window.open(
          `${path}?preview=${result.id}`,
          "_blank",
          "noopener,noreferrer",
        );
        setSaved("Preview created — public content unchanged");
        return;
      }
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, status, data }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      localStorage.removeItem(key);
      lastSaved.current = JSON.stringify({ item: result, extra });
      setItem(result);
      setSaved("Saved to database");
      router.replace(`/admin/${result.collection}/${result.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
      setSaved("Unsaved changes");
    } finally {
      setBusy(false);
    }
  }
  const linkedMedia = assets.filter((m) => m.mime.startsWith("image/"));
  if (item.collection === "activities")
    return (
      <>
        <ActivityWorkspace
          item={item}
          setItem={setItem}
          extra={extra}
          setExtra={setExtra}
          assets={assets}
          setAssets={setAssets}
          actor={actor}
          categories={categories}
          records={records}
          readOnly={readOnly}
          busy={busy}
          error={error}
          saved={saved}
          allowedStatuses={allowedStatuses}
          save={save}
          recovered={draftNotice}
          onDiscard={() => {
            setItem(initial);
            setExtra(JSON.stringify(initial.data, null, 2));
            localStorage.removeItem(key);
            setDraftNotice(false);
          }}
          onDelete={async () => {
            if (
              !confirm(
                "Permanently delete this content? This cannot be undone.",
              )
            )
              return;
            setBusy(true);
            try {
              const response = await fetch("/api/content", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, version: item.version }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
              localStorage.removeItem(key);
              router.push("/admin/activities");
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Delete failed");
            } finally {
              setBusy(false);
            }
          }}
        />
        {item.id && !readOnly && (
          <Revisions
            id={item.id}
            onRestore={(old) => {
              setItem({
                ...old,
                id: item.id,
                version: item.version,
                status: "DRAFT",
              });
              setExtra(JSON.stringify(old.data, null, 2));
            }}
          />
        )}
      </>
    );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>{initial.id ? "Edit content" : "Create content"}</h1>
          <p>
            {initial.collection} / {item.title || "Untitled"}
          </p>
        </div>
        <span className={`status ${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      </div>
      {readOnly && (
        <div className="notice">
          You have read-only access to this collection.
        </div>
      )}
      {draftNotice && (
        <div className="notice">
          Recovered a local editing copy. Review before saving.
          <button
            className="text-link"
            style={{ marginLeft: 15, border: 0, background: "none" }}
            onClick={() => {
              setItem(initial);
              setExtra(JSON.stringify(initial.data, null, 2));
              localStorage.removeItem(key);
              setDraftNotice(false);
            }}
          >
            Discard recovery
          </button>
        </div>
      )}
      <fieldset
        disabled={readOnly}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <div className="admin-panel">
          <h2>The essentials</h2>
          <div className="form-grid">
            <label className="wide">
              Title
              <input
                value={item.title}
                onChange={(e) => {
                  change("title", e.target.value);
                  if (!initial.id) change("slug", slugify(e.target.value));
                }}
                maxLength={300}
              />
            </label>
            <label>
              URL slug
              <input
                value={item.slug}
                onChange={(e) => change("slug", e.target.value)}
              />
            </label>
            <label>
              Category
              <input
                list="categories"
                value={item.category}
                onChange={(e) => change("category", e.target.value)}
              />
              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="wide">
              Short description
              <textarea
                rows={3}
                value={item.summary}
                onChange={(e) => change("summary", e.target.value)}
              />
            </label>
            <div className="wide">
              <p style={{ fontSize: 12, marginBottom: 8 }}>Full description</p>
              <RichEditor
                readOnly={readOnly}
                value={(() => {
                  try {
                    return (
                      (JSON.parse(extra).richText as JSONContent) || {
                        type: "doc",
                        content: item.body.split("\n").map((text) => ({
                          type: "paragraph",
                          content: text ? [{ type: "text", text }] : [],
                        })),
                      }
                    );
                  } catch {
                    return { type: "doc", content: [] };
                  }
                })()}
                onChange={(json, text) => {
                  try {
                    setExtra(
                      JSON.stringify(
                        { ...JSON.parse(extra), richText: json },
                        null,
                        2,
                      ),
                    );
                    change("body", text);
                  } catch {
                    setError(
                      "Fix the structured JSON before editing the description.",
                    );
                  }
                }}
              />
            </div>
            <label>
              Date
              <input
                type="date"
                value={item.date}
                onChange={(e) => change("date", e.target.value)}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={item.endDate}
                onChange={(e) => change("endDate", e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="admin-panel">
          <h2>Media & visibility</h2>
          {permits(actor, "MEDIA_UPLOAD", "media") && (
            <AssetUpload
              onUpload={(asset, purpose) => {
                setAssets((old) => [...old, asset]);
                if (purpose === "cover") {
                  change("image", asset.url);
                  change("imageAlt", asset.alt);
                } else {
                  try {
                    const d = JSON.parse(extra);
                    setExtra(
                      JSON.stringify(
                        {
                          ...d,
                          ...(purpose === "gallery"
                            ? {
                                gallery: [
                                  ...(d.gallery || []),
                                  {
                                    url: asset.url,
                                    alt: asset.alt,
                                    type: asset.mime.startsWith("video/")
                                      ? "video"
                                      : "image",
                                  },
                                ],
                              }
                            : purpose === "video"
                              ? {
                                  videoUrl: asset.url,
                                  videoDescription: asset.alt,
                                }
                              : { videoThumbnail: asset.url }),
                        },
                        null,
                        2,
                      ),
                    );
                  } catch {
                    setError(
                      "Upload succeeded. Fix structured content then select the asset.",
                    );
                  }
                }
              }}
            />
          )}
          {item.image && (
            <button
              type="button"
              className="button secondary small"
              onClick={() => {
                change("image", "");
                change("imageAlt", "");
              }}
            >
              Remove cover
            </button>
          )}
          <div className="form-grid">
            <label className="wide">
              Choose an existing image
              <select
                value=""
                onChange={(e) => {
                  const m = linkedMedia.find((v) => v.id === e.target.value);
                  if (m) {
                    change("image", m.url);
                    change("imageAlt", m.alt);
                  }
                }}
              >
                <option value="">Select from media library…</option>
                {linkedMedia.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hero image URL
              <input
                value={item.image}
                onChange={(e) => change("image", e.target.value)}
                placeholder="/uploads/… or https://…"
              />
            </label>
            <label>
              Image alt text
              <input
                value={item.imageAlt}
                onChange={(e) => change("imageAlt", e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={item.featured}
                onChange={(e) => change("featured", e.target.checked)}
              />
              Featured content
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={item.homepage}
                onChange={(e) => change("homepage", e.target.checked)}
              />
              Show on homepage
            </label>
          </div>
          <p className="muted" style={{ fontSize: 11, marginTop: 20 }}>
            Upload new assets in the media library, then select them here.
            Without an image, the website uses an abstract illustration.
          </p>
        </div>
        <div className="admin-panel">
          <h2>Content details</h2>
          {item.collection === "homepage" && (
            <ModuleFields value={extra} onChange={setExtra} records={records} />
          )}
          {item.collection === "activities" && (
            <div className="form-grid">
              <label>
                Reusable person
                <select
                  value=""
                  onChange={(e) => {
                    try {
                      const d = JSON.parse(extra);
                      setExtra(
                        JSON.stringify(
                          {
                            ...d,
                            people: [
                              ...(d.people || []),
                              { personId: e.target.value, role: "Speaker" },
                            ],
                          },
                          null,
                          2,
                        ),
                      );
                    } catch {
                      setError("Fix structured content first");
                    }
                  }}
                >
                  <option value="">Add a person...</option>
                  {records
                    .filter((r) => r.collection === "people")
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </label>
              {(() => {
                try {
                  const d = JSON.parse(extra);
                  return (d.people || []).map(
                    (person: { personId: string; role: string }, i: number) => (
                      <div key={i}>
                        <span>
                          {records.find((r) => r.id === person.personId)
                            ?.title || "Unavailable person"}
                        </span>
                        <select
                          aria-label="Participation role"
                          value={person.role}
                          onChange={(e) => {
                            d.people[i].role = e.target.value;
                            setExtra(JSON.stringify(d, null, 2));
                          }}
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
                          className="button secondary small"
                          onClick={() => {
                            d.people.splice(i, 1);
                            setExtra(JSON.stringify(d, null, 2));
                          }}
                        >
                          Remove person
                        </button>
                      </div>
                    ),
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          )}
          <StructuredFields
            collection={item.collection}
            value={extra}
            onChange={setExtra}
            media={assets}
          />
          <div className="form-grid">
            {(extraFields[item.collection] ?? []).map((field) => (
              <label key={field}>
                {field
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (c) => c.toUpperCase())}
                {["format", "registrationStatus"].includes(field) ? (
                  <select
                    value={String(
                      (() => {
                        try {
                          return JSON.parse(extra)[field] || "";
                        } catch {
                          return "";
                        }
                      })(),
                    )}
                    onChange={(e) => {
                      try {
                        setExtra(
                          JSON.stringify(
                            { ...JSON.parse(extra), [field]: e.target.value },
                            null,
                            2,
                          ),
                        );
                      } catch {
                        setError("Fix structured content first");
                      }
                    }}
                  >
                    <option value="">Choose...</option>
                    {(field === "format"
                      ? ["Online", "Offline", "Hybrid"]
                      : [
                          "Open",
                          "Closed",
                          "Coming soon",
                          "Full",
                          "Not required",
                        ]
                    ).map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      ["startTime", "endTime"].includes(field)
                        ? "time"
                        : field === "registrationDeadline"
                          ? "date"
                          : field === "capacity"
                            ? "number"
                            : "text"
                    }
                    value={(() => {
                      try {
                        return String(JSON.parse(extra)[field] ?? "");
                      } catch {
                        return "";
                      }
                    })()}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(extra);
                        value[field] = e.target.value;
                        setExtra(JSON.stringify(value, null, 2));
                      } catch {
                        setError(
                          "Fix the structured JSON before editing detail fields.",
                        );
                      }
                    }}
                  />
                )}
              </label>
            ))}
          </div>
          <details
            style={{ marginTop: 25 }}
            open={["activities", "gallery"].includes(item.collection)}
          >
            <summary style={{ fontSize: 12, cursor: "pointer" }}>
              Structured sections · speakers, schedule, highlights, gallery &
              custom fields
            </summary>
            <p className="muted" style={{ fontSize: 11, marginTop: 15 }}>
              Use arrays of text for speakers, organizers, schedule, highlights,
              outcomes, tags and expertise. Gallery entries use{" "}
              {`{"url":"/uploads/…","alt":"Description","type":"image"}`}.
              Statistics use a name-to-number object. These sections appear on
              the public detail page.
            </p>
            <textarea
              className="json-field"
              style={{ width: "100%" }}
              aria-label="Structured content JSON"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
          </details>
        </div>
        <div className="admin-panel">
          <h2>Search & publication</h2>
          <div className="form-grid">
            <label>
              SEO title
              <input
                value={item.seoTitle}
                onChange={(e) => change("seoTitle", e.target.value)}
              />
            </label>
            <label>
              Publication status
              <select
                value={item.status}
                onChange={(e) => change("status", e.target.value)}
              >
                {allowedStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              SEO description
              <textarea
                rows={2}
                value={item.seoDescription}
                onChange={(e) => change("seoDescription", e.target.value)}
              />
            </label>
            <label>
              Scheduled publication
              <input
                type="datetime-local"
                value={localInput(item.publishAt)}
                onChange={(e) =>
                  change(
                    "publishAt",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  )
                }
              />
            </label>
          </div>
        </div>
      </fieldset>
      {item.id && !readOnly && (
        <Revisions
          id={item.id}
          onRestore={(old) => {
            setItem({
              ...old,
              id: item.id,
              version: item.version,
              status: "DRAFT",
            });
            setExtra(JSON.stringify(old.data, null, 2));
          }}
        />
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="editor-toolbar">
        <span role="status">{saved || "All changes saved"}</span>
        {!readOnly && (
          <>
            {allowedStatuses.includes("REVIEW") && (
              <button
                disabled={busy}
                className="button secondary small"
                onClick={() => save("REVIEW")}
              >
                Submit for review
              </button>
            )}
            {permits(actor, "APPROVE", item.collection) &&
              item.status === "REVIEW" && (
                <button
                  disabled={busy}
                  className="button small"
                  onClick={() => save("APPROVED")}
                >
                  Approve
                </button>
              )}
            <button
              disabled={busy || !allowedStatuses.includes("DRAFT")}
              className="button secondary small"
              onClick={() => save("DRAFT")}
            >
              Save draft
            </button>
            <button
              disabled={busy}
              className="button secondary small"
              onClick={() => save(item.status, true)}
            >
              Preview changes ↗
            </button>
            <button
              disabled={busy}
              className="button small"
              onClick={() => save()}
            >
              Save changes
            </button>
            {permits(actor, "PUBLISH", item.collection) && (
              <button
                disabled={busy}
                className="button small"
                onClick={() => save("PUBLISHED")}
              >
                Publish ↗
              </button>
            )}
          </>
        )}
        {initial.id && !readOnly && (
          <button
            disabled={busy}
            className="icon-button"
            aria-label="Delete content"
            onClick={async () => {
              if (
                !window.confirm(
                  "Permanently delete this content? This cannot be undone.",
                )
              )
                return;
              setBusy(true);
              try {
                const r = await fetch("/api/content", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: item.id, version: item.version }),
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data.error);
                localStorage.removeItem(key);
                router.push(`/admin/${item.collection}`);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Delete failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            ⌫
          </button>
        )}
      </div>
    </>
  );
}

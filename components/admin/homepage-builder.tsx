import { useState, useRef, useEffect } from "react";
import Link, { useRouter } from "@/client/router";
import type { Entry } from "@/lib/content";
import type { Actor } from "@/lib/policy";
import { permits } from "@/lib/policy";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Settings2,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  LayoutTemplate,
} from "lucide-react";
const sorted = (records: Entry[]) =>
  [...records].sort(
    (a, b) => Number(a.data.order || 0) - Number(b.data.order || 0),
  );
export default function HomepageBuilder({
  records,
  actor,
}: {
  records: Entry[];
  actor: Actor;
}) {
  const [sections, setSections] = useState(() => sorted(records));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);
  const router = useRouter();
  const moving = useRef<number | null>(null);
  const editable =
    permits(actor, "UPDATE", "homepage") &&
    sections.every(
      (e) =>
        !["PUBLISHED", "COMPLETED", "SCHEDULED", "APPROVED"].includes(
          e.status,
        ) || permits(actor, "PUBLISH", "homepage"),
    );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (changed) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);
  function move(from: number, to: number) {
    if (!editable || to < 0 || to >= sections.length) return;
    setSections((old) => {
      const next = [...old];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setChanged(true);
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/homepage-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: sections.map((e, i) => ({
            id: e.id,
            version: e.version,
            order: i,
            enabled: e.data.enabled !== false,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSections(sorted(result.items));
      setChanged(false);
      setMessage(
        "Homepage layout saved. Published sections are updated on the public site.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save layout");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">WEBSITE / COMPOSITION</p>
          <h1>Your chapter. Your canvas.</h1>
          <p>
            Arrange the story visitors discover. Changes to live sections
            require publishing permission.
          </p>
        </div>
        <Link className="button secondary small" href="/" target="_blank">
          View homepage
          <ExternalLink size={14} />
        </Link>
      </div>
      <div className="builder-layout">
        <section className="builder-canvas" aria-label="Homepage sections">
          <div className="builder-canvas-top">
            <LayoutTemplate size={16} />
            <span>HOMEPAGE COMPOSITION</span>
            <span>{sections.length} SECTIONS</span>
          </div>
          {sections.length ? (
            sections.map((e, i) => (
              <div
                className={`builder-section ${e.data.enabled === false ? "disabled" : ""} ${dragging === i ? "dragging" : ""}`}
                key={e.id}
                draggable={editable && !busy}
                onDragStart={(event) => {
                  moving.current = i;
                  setDragging(i);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", e.id);
                }}
                onDragOver={(event) => {
                  if (editable) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (moving.current !== null) move(moving.current, i);
                  moving.current = null;
                  setDragging(null);
                }}
                onDragEnd={() => {
                  moving.current = null;
                  setDragging(null);
                }}
              >
                <span className="builder-grip" aria-hidden="true">
                  <GripVertical size={18} />
                </span>
                <span className="builder-section-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="builder-section-info">
                  <p>
                    {String(e.data.kind || e.slug).toUpperCase()}{" "}
                    <span className={`status ${e.status.toLowerCase()}`}>
                      {e.status}
                    </span>
                  </p>
                  <h2>{e.title}</h2>
                  <span>
                    {String(e.data.source || "Editorial content")} ·{" "}
                    {String(e.data.selection || "all")} ·{" "}
                    {Number(e.data.itemCount || 6)} items
                  </span>
                </div>
                <div className="builder-section-actions">
                  <button
                    className="icon-button"
                    disabled={!editable || busy || i === 0}
                    aria-label={`Move ${e.title} up`}
                    onClick={() => move(i, i - 1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={!editable || busy || i === sections.length - 1}
                    aria-label={`Move ${e.title} down`}
                    onClick={() => move(i, i + 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    className="icon-button builder-visibility"
                    disabled={!editable || busy}
                    aria-label={`${e.data.enabled === false ? "Enable" : "Disable"} ${e.title}`}
                    aria-pressed={e.data.enabled !== false}
                    onClick={() => {
                      setSections((old) =>
                        old.map((s) =>
                          s.id === e.id
                            ? {
                                ...s,
                                data: {
                                  ...s.data,
                                  enabled: s.data.enabled === false,
                                },
                              }
                            : s,
                        ),
                      );
                      setChanged(true);
                    }}
                  >
                    {e.data.enabled === false ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    className="icon-button"
                    href={`/admin/homepage/${e.id}`}
                    aria-label={`Configure ${e.title}`}
                  >
                    <Settings2 size={16} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h2>A new chapter starts here.</h2>
              <p>Create a homepage section to start composing your story.</p>
            </div>
          )}
          {editable && (
            <Link className="builder-add" href="/admin/homepage/new">
              <Plus size={18} />
              Add a section
            </Link>
          )}
        </section>
        <aside className="builder-inspector">
          <div className="admin-panel">
            <p className="eyebrow">COMPOSITION GUIDE</p>
            <h2>A story, not a stack.</h2>
            <p>
              Lead with your identity. Connect it to real chapter activity,
              people and impact.
            </p>
            <ol>
              <li>Drag sections to reorder, or use the arrow controls.</li>
              <li>Toggle visibility without deleting content.</li>
              <li>Configure the source and selection for each section.</li>
              <li>Save to apply the layout.</li>
            </ol>
            <button
              className="button"
              disabled={!editable || !changed || busy}
              onClick={save}
            >
              {busy ? "Saving layout…" : "Save layout"}
            </button>
            <span className="builder-save-state">
              {changed ? "Unsaved layout changes" : "Layout is saved"}
            </span>
            <p role="status">{message}</p>
          </div>
        </aside>
      </div>
    </>
  );
}

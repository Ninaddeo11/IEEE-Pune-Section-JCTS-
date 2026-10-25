"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaEdit from "./media-edit";
type Item = {
  id: string;
  name: string;
  url: string;
  mime: string;
  alt: string;
  folder: string;
  tags: string[];
  size: number;
};
export default function MediaLibrary({
  items,
  editable,
}: {
  items: Item[];
  editable: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Media library</h1>
          <p>A shared home for chapter images, videos and documents.</p>
        </div>
      </div>
      {editable && (
        <div className="admin-panel">
          <h2>Upload a new asset</h2>
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setMessage("");
              const form = e.currentTarget;
              try {
                const r = await fetch("/api/media", {
                  method: "POST",
                  body: new FormData(form),
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data.error);
                setMessage(
                  "Uploaded successfully. This asset is now available in content editors.",
                );
                form.reset();
                router.refresh();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Upload failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              File · up to 25 MB
              <input
                name="file"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf,video/mp4"
                required
              />
            </label>
            <label>
              Alt text / description
              <input name="alt" required maxLength={500} />
            </label>
            <label>
              Folder
              <input name="folder" />
            </label>
            <label>
              Tags · comma separated
              <input name="tags" />
            </label>
            <div>
              <button disabled={busy} className="button small">
                {busy ? "Uploading…" : "Upload asset ↗"}
              </button>
            </div>
          </form>
        </div>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search names, alt text, folders, tags…"
          aria-label="Search media"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="File type"
        >
          <option value="">All files</option>
          <option value="image/">Images</option>
          <option value="video/">Videos</option>
          <option value="application/pdf">PDFs</option>
        </select>
      </div>
      <div className="upload-grid">
        {items
          .filter(
            (m) =>
              `${m.name} ${m.alt} ${m.folder} ${m.tags.join(" ")}`
                .toLowerCase()
                .includes(q.toLowerCase()) && m.mime.startsWith(type),
          )
          .map((m) => (
            <div className="upload-card" key={m.id}>
              {m.mime.startsWith("image/") ? (
                <img src={m.url} alt={m.alt} />
              ) : (
                <div className="empty-state" style={{ padding: 20 }}>
                  {m.mime}
                </div>
              )}
              <p>
                <strong>{m.name}</strong>
                <br />
                {m.alt}
                <br />
                {Math.round(m.size / 1024)} KB · {m.folder || "Unfiled"}
              </p>
              <input
                readOnly
                value={m.url}
                aria-label={`URL for ${m.name}`}
                onFocus={(e) => e.target.select()}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <a
                  className="text-link"
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open ↗
                </a>
                {editable && (
                  <button
                    className="text-link"
                    style={{ border: 0, background: "none", fontSize: 11 }}
                    onClick={async () => {
                      if (!confirm("Delete this asset permanently?")) return;
                      try {
                        const r = await fetch("/api/media", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: m.id }),
                        });
                        const result = await r.json();
                        if (!r.ok) throw new Error(result.error);
                        router.refresh();
                      } catch (e) {
                        setMessage(
                          e instanceof Error ? e.message : "Delete failed",
                        );
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              {editable && <MediaEdit item={m} />}
            </div>
          ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <h3>A clean canvas.</h3>
          <p>Upload your first asset to get started.</p>
        </div>
      )}
    </>
  );
}

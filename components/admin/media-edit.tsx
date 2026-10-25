"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function MediaEdit({
  item,
}: {
  item: {
    id: string;
    alt: string;
    folder: string;
    tags: string[];
    mime: string;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <details style={{ marginTop: 18 }}>
      <summary style={{ fontSize: 11, cursor: "pointer" }}>
        Edit metadata / replace file
      </summary>
      <form
        className="form-stack"
        style={{ marginTop: 15 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await fetch("/api/media", {
              method: "PATCH",
              body: new FormData(e.currentTarget),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            setMessage("Saved. Existing content links are preserved.");
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input type="hidden" name="id" value={item.id} />
        <label>
          Alt text
          <input name="alt" defaultValue={item.alt} required maxLength={500} />
        </label>
        <label>
          Folder
          <input name="folder" defaultValue={item.folder} />
        </label>
        <label>
          Tags
          <input name="tags" defaultValue={item.tags.join(", ")} />
        </label>
        <label>
          Replacement · same file type
          <input type="file" name="file" accept={item.mime} />
        </label>
        {message && <p role="status">{message}</p>}
        <button disabled={busy} className="button small">
          {busy ? "Saving…" : "Save asset"}
        </button>
      </form>
    </details>
  );
}

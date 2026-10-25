import { useState } from "react";
import type { Entry } from "@/lib/content";
export default function Revisions({
  id,
  onRestore,
}: {
  id: string;
  onRestore: (entry: Entry) => void;
}) {
  const [items, setItems] = useState<
    {
      id: string;
      version: number;
      userId: string;
      createdAt: string;
      payload: Entry;
    }[]
  >([]);
  const [message, setMessage] = useState("");
  return (
    <details className="admin-panel">
      <summary>Revision history</summary>
      <button
        className="button secondary small"
        onClick={async () => {
          setMessage("Loading revisions…");
          try {
            const response = await fetch(
              `/api/revisions?id=${encodeURIComponent(id)}`,
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setItems(data);
            setMessage(
              data.length
                ? "Select a revision to restore as a draft. Publication still requires permission."
                : "No previous revisions yet.",
            );
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Unable to load revisions",
            );
          }
        }}
      >
        Load history
      </button>
      <p role="status">{message}</p>
      {items.map((r) => (
        <div key={r.id} className="admin-topbar">
          <span>
            Version {r.version} · {new Date(r.createdAt).toLocaleString()} ·{" "}
            {r.userId}
          </span>
          <button
            className="button secondary small"
            onClick={() => {
              onRestore(r.payload);
              setMessage(
                "Revision loaded into editor. Save draft to restore it.",
              );
            }}
          >
            Restore as draft
          </button>
        </div>
      ))}
    </details>
  );
}

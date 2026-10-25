import { useState } from "react";
import { useRouter } from "@/client/router";
import type { Entry } from "@/lib/content";
import { permits, type Actor } from "@/lib/policy";
export default function BulkActivities({
  items,
  actor,
}: {
  items: Entry[];
  actor: Actor;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  if (!permits(actor, "ARCHIVE", "activities")) return null;
  return (
    <details className="admin-panel">
      <summary>Bulk archive · current page</summary>
      <p>Each record is checked for permissions and concurrent changes.</p>
      {items.map((e) => (
        <label className="checkbox-label" key={e.id}>
          <input
            type="checkbox"
            checked={ids.includes(e.id)}
            onChange={(v) =>
              setIds((old) =>
                v.target.checked
                  ? [...old, e.id]
                  : old.filter((id) => id !== e.id),
              )
            }
          />
          {e.title}
        </label>
      ))}
      <button
        className="button secondary small"
        disabled={busy || !ids.length}
        onClick={async () => {
          if (!confirm(`Archive ${ids.length} selected activities?`)) return;
          setBusy(true);
          const errors: string[] = [];
          let saved = 0;
          for (const item of items.filter((e) => ids.includes(e.id))) {
            try {
              const r = await fetch("/api/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...item, status: "ARCHIVED" }),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error);
              saved++;
            } catch (e) {
              errors.push(
                `${item.title}: ${e instanceof Error ? e.message : "Failed"}`,
              );
            }
          }
          setMessage(`${saved} archived. ${errors.join("; ")}`);
          setIds([]);
          setBusy(false);
          router.refresh();
        }}
      >
        Archive selected
      </button>
      <p role="status">{message}</p>
    </details>
  );
}

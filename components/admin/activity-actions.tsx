import { useState } from "react";
import { useRouter } from "@/client/router";
import Link from "@/client/router";
import type { Entry } from "@/lib/content";
import { assertTransition, permits, type Actor } from "@/lib/policy";
export default function ActivityActions({
  item,
  actor,
}: {
  item: Entry;
  actor: Actor;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const save = async (status: string, duplicate = false) => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          duplicate
            ? {
                ...item,
                id: "",
                version: undefined,
                title: `${item.title} (copy)`,
                slug: `${item.slug}-copy-${Date.now()}`,
                status: "DRAFT",
                featured: false,
                homepage: false,
              }
            : { ...item, status },
        ),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Saved");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="row-actions">
      <Link href={`/admin/activities/${item.id}`}>Open</Link>
      <Link href={`/activities/${item.slug}`} target="_blank">
        View
      </Link>
      {permits(actor, "CREATE", "activities") && (
        <button disabled={busy} onClick={() => save("DRAFT", true)}>
          Duplicate
        </button>
      )}
      {["REVIEW", "APPROVED", "PUBLISHED", "DRAFT", "ARCHIVED"]
        .filter((s) => {
          if (s === item.status) return false;
          try {
            assertTransition(actor, "activities", item.status, s);
            return true;
          } catch {
            return false;
          }
        })
        .map((s) => (
          <button key={s} disabled={busy} onClick={() => save(s)}>
            {s === "DRAFT" ? "Unpublish / draft" : s.toLowerCase()}
          </button>
        ))}
      {permits(actor, "DELETE", "activities") && (
        <button
          disabled={busy}
          onClick={async () => {
            if (!confirm("Delete this activity permanently?")) return;
            setBusy(true);
            try {
              const r = await fetch("/api/content", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, version: item.version }),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error);
              router.refresh();
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Delete
        </button>
      )}
      <span role="status">{message}</span>
    </div>
  );
}

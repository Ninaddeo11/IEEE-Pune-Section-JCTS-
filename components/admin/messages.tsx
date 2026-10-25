import { useState } from "react";
import { useRouter } from "@/client/router";
type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};
export default function Messages({
  items,
  editable,
}: {
  items: Message[];
  editable: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Conversations</h1>
          <p>Messages from your chapter community.</p>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!items.length && (
        <div className="empty-state">
          <h3>You’re all caught up.</h3>
          <p>Contact form messages will appear here.</p>
        </div>
      )}
      {items.map((m) => (
        <article className="admin-panel" key={m.id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div>
              <h2>{m.subject}</h2>
              <p className="muted" style={{ fontSize: 11 }}>
                {m.name} · {m.email} ·{" "}
                {new Date(m.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
            <select
              disabled={!editable}
              aria-label={`Status for ${m.subject}`}
              value={m.status}
              onChange={async (e) => {
                try {
                  const r = await fetch("/api/messages", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: m.id, status: e.target.value }),
                  });
                  if (!r.ok) throw new Error();
                  router.refresh();
                } catch {
                  setError("Unable to update message status.");
                }
              }}
            >
              {["unread", "read", "resolved", "archived"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 13, marginBottom: 0 }}>
            {m.message}
          </p>
        </article>
      ))}
    </>
  );
}

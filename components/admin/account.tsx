import { useRouter } from "@/client/router";
import { useState } from "react";
export default function Account() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="admin-panel">
      <h2>Password and sessions</h2>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setMessage("");
          try {
            const response = await fetch("/api/account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(new FormData(form))),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            form.reset();
            setMessage("Password changed. Other sessions were revoked.");
          } catch (err) {
            setMessage(
              err instanceof Error ? err.message : "Password change failed",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Current password
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            name="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <button className="button small" disabled={busy}>
          Change password
        </button>
      </form>
      <button
        className="button secondary small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/account", { method: "DELETE" });
            if (!r.ok) throw new Error("Unable to revoke sessions");
            router.push("/admin");
            router.refresh();
          } catch (e) {
            setMessage(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Sign out all sessions
      </button>
      <p role="status">{message}</p>
    </section>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { roles } from "@/lib/content";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
export default function Users({
  items,
  currentId,
}: {
  items: User[];
  currentId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Workspace access</h1>
          <p>Invite trusted administrators with the right permissions.</p>
        </div>
      </div>
      <div className="admin-panel">
        <h2>Create a user</h2>
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const form = e.currentTarget;
            try {
              const r = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error);
              form.reset();
              setMessage(
                "User created. Share their initial password through a secure channel.",
              );
              router.refresh();
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Failed to create user",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Name
            <input name="name" required minLength={2} />
          </label>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Initial password
            <input
              type="password"
              name="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <label>
            Role
            <select name="role">
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div>
            <button disabled={busy} className="button small">
              Create user ↗
            </button>
          </div>
        </form>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="admin-panel">
        <table>
          <thead>
            <tr>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>ACCESS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.id === currentId ? (
                    "Your account"
                  ) : (
                    <button
                      className="button secondary small"
                      onClick={async () => {
                        try {
                          const r = await fetch("/api/users", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: u.id,
                              active: !u.active,
                            }),
                          });
                          const data = await r.json();
                          if (!r.ok) throw new Error(data.error);
                          router.refresh();
                        } catch (e) {
                          setMessage(
                            e instanceof Error ? e.message : "Update failed",
                          );
                        }
                      }}
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

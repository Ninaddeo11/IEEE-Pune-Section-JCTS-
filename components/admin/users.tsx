import { useState } from "react";
import { useRouter } from "@/client/router";
import { roles } from "@/lib/content";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions?: unknown;
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
                <td>
                  {u.id === currentId ? (
                    u.role
                  ) : (
                    <select
                      aria-label={`Role for ${u.name}`}
                      value={u.role}
                      onChange={async (e) => {
                        try {
                          const r = await fetch("/api/users", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: u.id,
                              role: e.target.value,
                            }),
                          });
                          const data = await r.json();
                          if (!r.ok) throw new Error(data.error);
                          setMessage("Role updated; sessions revoked");
                          router.refresh();
                        } catch (err) {
                          setMessage(String(err));
                        }
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  )}
                  {u.id !== currentId && (
                    <details>
                      <summary>Publishing grants / password reset</summary>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const data = new FormData(form);
                          try {
                            const r = await fetch("/api/users", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: u.id,
                                permissions: data.getAll("permissions"),
                                ...(data.get("password")
                                  ? { password: data.get("password") }
                                  : {}),
                              }),
                            });
                            const result = await r.json();
                            if (!r.ok) throw new Error(result.error);
                            setMessage("Access updated; sessions revoked");
                            router.refresh();
                          } catch (err) {
                            setMessage(String(err));
                          }
                        }}
                      >
                        {[
                          "activities",
                          "research",
                          "publications",
                          "news",
                          "announcements",
                          "pages",
                          "homepage",
                          "resources",
                          "opportunities",
                          "people",
                        ].map((c) => (
                          <fieldset key={c}>
                            <legend>{c}</legend>
                            {["PUBLISH", "APPROVE", "UNPUBLISH", "ARCHIVE"].map(
                              (action) => (
                                <label className="checkbox-label" key={action}>
                                  <input
                                    name="permissions"
                                    type="checkbox"
                                    value={`${c}:${action}`}
                                    defaultChecked={
                                      Array.isArray(u.permissions) &&
                                      u.permissions.includes(`${c}:${action}`)
                                    }
                                  />
                                  {action.toLowerCase()}
                                </label>
                              ),
                            )}
                          </fieldset>
                        ))}
                        <label>
                          Reset password
                          <input
                            name="password"
                            type="password"
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                          />
                        </label>
                        <button className="button small">Save access</button>
                      </form>
                    </details>
                  )}
                </td>
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

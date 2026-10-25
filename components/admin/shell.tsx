import Brand from "@/components/brand";
import Link from "@/client/router";
import { usePathname, useRouter } from "@/client/router";
import { useState } from "react";
import { label } from "@/lib/content";
import { permits } from "@/lib/policy";
const groups: Record<string, string[]> = {
  Workspace: ["dashboard"],
  Content: [
    "activities",
    "research",
    "publications",
    "news",
    "announcements",
    "opportunities",
    "resources",
  ],
  Community: ["leadership", "people", "partners", "categories"],
  Media: ["gallery", "media", "documents"],
  Website: [
    "pages",
    "homepage",
    "statistics",
    "focus-areas",
    "navigation",
    "faqs",
    "settings",
  ],
  System: ["messages", "users", "audit-logs", "security"],
};
export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: string };
}) {
  const path = usePathname();
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Brand />
        <nav aria-label="CMS navigation">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} style={{ display: "contents" }}>
              <p className="sidebar-label">{group.toUpperCase()}</p>
              {items
                .filter(
                  (c) =>
                    c === "dashboard" ||
                    c === "security" ||
                    permits(
                      user,
                      c === "audit-logs" ? "AUDIT_VIEW" : "READ",
                      c,
                    ),
                )
                .map((c) => (
                  <Link
                    key={c}
                    className={path.startsWith(`/admin/${c}`) ? "active" : ""}
                    href={`/admin/${c}`}
                  >
                    {label(c)}
                    {c === "dashboard" && <span>⌂</span>}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <div className="admin-topbar">
          <span>
            {user.name}{" "}
            <span style={{ opacity: 0.5 }}>
              {" "}
              / {label(user.role.toLowerCase().replace(/_/g, " "))}
            </span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" target="_blank">
              View website ↗
            </Link>
            <button
              className="button secondary small"
              onClick={async () => {
                try {
                  const r = await fetch("/api/auth", { method: "DELETE" });
                  if (!r.ok) throw new Error();
                  router.push("/admin");
                  router.refresh();
                } catch {
                  setError("Sign-out failed. Try again.");
                }
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

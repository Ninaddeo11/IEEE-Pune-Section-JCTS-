import Brand from "@/components/brand";
import Link from "@/client/router";
import { usePathname, useRouter } from "@/client/router";
import { useState, useRef, useEffect } from "react";
import { label } from "@/lib/content";
import { permits } from "@/lib/policy";
import { Search, X, Command, ArrowUpRight } from "lucide-react";
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
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const command = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((old) => !old);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (commandOpen) command.current?.showModal();
    else command.current?.close();
  }, [commandOpen]);
  const commands = Object.values(groups)
    .flat()
    .filter(
      (c) =>
        c === "dashboard" ||
        c === "security" ||
        permits(user, c === "audit-logs" ? "AUDIT_VIEW" : "READ", c),
    )
    .filter((c) => label(c).toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Brand />
        <button
          className="workspace-command-trigger"
          onClick={() => setCommandOpen(true)}
        >
          <Search size={14} />
          <span>Go to workspace...</span>
          <kbd>Ctrl K</kbd>
        </button>
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
      <dialog
        className="workspace-command-dialog"
        ref={command}
        onCancel={() => setCommandOpen(false)}
        onClick={(e) => {
          if (e.target === command.current) setCommandOpen(false);
        }}
      >
        <div className="workspace-command-head">
          <Command size={18} />
          <input
            autoFocus
            aria-label="Search workspace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where would you like to go?"
          />
          <button
            className="icon-button"
            aria-label="Close workspace search"
            onClick={() => setCommandOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="workspace-command-results">
          {commands.length ? (
            commands.map((c) => (
              <Link
                key={c}
                href={`/admin/${c}`}
                onClick={() => setCommandOpen(false)}
              >
                <span>{label(c)}</span>
                <ArrowUpRight size={16} />
              </Link>
            ))
          ) : (
            <p>No matching workspace section.</p>
          )}
        </div>
        <p className="workspace-command-hint">
          Navigate your chapter workspace. Escape to close.
        </p>
      </dialog>
    </div>
  );
}

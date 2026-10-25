import Brand from "@/components/brand";
import Link from "@/client/router";
import { usePathname } from "@/client/router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Search, ArrowUpRight, Command } from "lucide-react";
import type { Entry } from "@/lib/content";
export default function Navigation({ items }: { items: Entry[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [compact, setCompact] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 30);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (search) dialog.current?.showModal();
    else dialog.current?.close();
  }, [search]);
  if (path.startsWith("/admin")) return null;
  return (
    <>
      <header className={`site-header ${compact ? "compact" : ""} ${path === "/" ? "over-hero" : ""}`}>
        <Brand />
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          {items
            .filter((item) => !item.data.parent)
            .map((item) => {
              const children = items.filter(
                (child) => child.data.parent === item.slug,
              );
              return children.length ? (
                <details className="nav-dropdown" key={item.id}>
                  <summary>{item.title}</summary>
                  <div>
                    <Link
                      href={safeHref(item.data.url)}
                      onClick={() => setOpen(false)}
                    >
                      Overview
                    </Link>
                    {children.map((child) => (
                      <Link
                        href={safeHref(child.data.url)}
                        key={child.id}
                        onClick={() => setOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={item.id}
                  className={path === String(item.data.url) ? "active" : ""}
                  href={safeHref(item.data.url)}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              );
            })}
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button search-trigger"
            aria-label="Search website"
            onClick={() => setSearch(true)}
          >
            <Search size={18} />
          </button>
          <Link className="button small" href="/membership">
            Get involved <ArrowUpRight size={15} />
          </Link>
          <button
            className="icon-button mobile-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        onCancel={() => setSearch(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setSearch(false);
        }}
        className="search-dialog"
      >
        <div className="dialog-top">
          <Command size={20} />
          <span>Explore JCTS</span>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => setSearch(false)}
          >
            <X size={20} />
          </button>
        </div>
        <form action="/search" onSubmit={() => setSearch(false)}>
          <Search />
          <input
            autoFocus
            name="q"
            aria-label="Search all content"
            placeholder="Search activities, research, people…"
          />
          <button className="button small">Search</button>
        </form>
        <p>
          Search across the chapter. <kbd>esc</kbd> to close.
        </p>
      </dialog>
    </>
  );
}
export function safeHref(value: unknown) {
  const url = String(value ?? "/");
  return /^\/(?!\/)/.test(url) || /^https:\/\//.test(url) ? url : "/";
}

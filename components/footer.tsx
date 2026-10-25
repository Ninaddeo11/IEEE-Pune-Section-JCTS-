import Link from "next/link";
import { entries } from "@/lib/db";
import { safeUrl } from "@/lib/urls";
import { applyPreview } from "@/lib/preview";
export default async function Footer() {
  const all = await applyPreview(await entries());
  const settings = all.find(
    (e) => e.collection === "settings" && e.slug === "chapter",
  );
  const links = all
    .filter((e) => e.collection === "navigation")
    .sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Link href="/" className="brand">
          <span className="brand-symbol">⟐</span>
          <span>
            JCTS<span className="brand-sub">IEEE PUNE SECTION</span>
          </span>
        </Link>
        <p>
          {String(
            settings?.data.footerText ??
              "A connected community. A shared commitment to progress.",
          )}
        </p>
        <div>
          {links.slice(0, 5).map((l) => (
            <Link key={l.id} href={safeUrl(l.data.url)}>
              {l.title}
            </Link>
          ))}
        </div>
        <div>
          {links.slice(5).map((l) => (
            <Link key={l.id} href={safeUrl(l.data.url)}>
              {l.title}
            </Link>
          ))}
          <Link href="/admin">Chapter CMS ↗</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} IEEE JCTS Pune Chapter</span>
        <span>Technology with purpose. Progress together.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

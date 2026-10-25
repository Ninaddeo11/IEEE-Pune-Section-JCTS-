import Brand from "@/components/brand";
import Link from "@/client/router";
import { safeUrl } from "@/lib/urls";
import { useView } from "@/client/view";
export default function Footer() {
  const all = useView().footer;
  const settings = all.find(
    (e) => e.collection === "settings" && e.slug === "chapter",
  );
  const links = all
    .filter((e) => e.collection === "navigation")
    .sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Brand />
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

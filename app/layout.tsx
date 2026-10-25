import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import { entries } from "@/lib/db";
import { applyPreview } from "@/lib/preview";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "JCTS Pune — Technology. Research. Impact.",
    template: "%s | IEEE JCTS Pune",
  },
  description:
    "IEEE Joint Chapter of Technology and Engineering Management Society & Systems Council, Pune Section. A connected community advancing technology, research and impact.",
  openGraph: { type: "website", siteName: "IEEE JCTS Pune" },
  twitter: { card: "summary_large_image" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = (await applyPreview(await entries("navigation")))
    .filter((e) => e.collection === "navigation")
    .sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation items={nav} />
        {children}
      </body>
    </html>
  );
}

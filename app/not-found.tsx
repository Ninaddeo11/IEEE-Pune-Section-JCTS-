import Link from "next/link";
export default function NotFound() {
  return (
    <main
      id="main"
      className="page-width section"
      style={{ minHeight: "75vh" }}
    >
      <p className="eyebrow">404 / A DIFFERENT DIRECTION</p>
      <h1 style={{ fontSize: 64 }}>Let’s reconnect.</h1>
      <p className="muted">This page may have moved or is not published yet.</p>
      <Link href="/" className="button">
        Back to the chapter ↗
      </Link>
    </main>
  );
}

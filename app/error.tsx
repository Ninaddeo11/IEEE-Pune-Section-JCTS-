"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-width section">
      <p className="eyebrow">CONNECTION INTERRUPTED</p>
      <h1>Something needs a moment.</h1>
      <p className="muted">We couldn’t load this page. Please try again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}

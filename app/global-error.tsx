"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial,sans-serif",
          background: "#f5f9fc",
          color: "#142535",
        }}
      >
        <main style={{ maxWidth: 720, margin: "15vh auto", padding: 30 }}>
          <p style={{ fontSize: 12, letterSpacing: 3, color: "#006bac" }}>
            IEEE JCTS · PUNE SECTION
          </p>
          <h1 style={{ fontSize: 48, fontWeight: 400, letterSpacing: -2 }}>
            A moment to reconnect.
          </h1>
          <p style={{ lineHeight: 1.8, color: "#536675" }}>
            The chapter website is temporarily unavailable. Please try again
            shortly.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "14px 24px",
              background: "#006bac",
              color: "white",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

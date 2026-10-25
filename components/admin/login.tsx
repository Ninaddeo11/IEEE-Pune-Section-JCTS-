import Brand from "@/components/brand";
import Link from "@/client/router";
import { useState } from "react";
import { useRouter } from "@/client/router";
export default function Login({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push("/admin/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="login-page">
      <div className="login-story">
        <Brand />
        <h1>
          The ideas start here.
          <br />
          You help them grow.
        </h1>
        <p>THE JCTS CHAPTER WORKSPACE</p>
      </div>
      <div className="login-form">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <p className="eyebrow">CHAPTER ADMINISTRATION</p>
        <h2>Welcome back.</h2>
        <p>Sign in to manage your chapter’s digital presence.</p>
        {!configured && (
          <div className="notice">
            CMS setup required. Configure PostgreSQL, run the database setup and
            create an administrator using the README instructions.
          </div>
        )}
        <form className="form-stack" onSubmit={submit}>
          <label>
            Email address
            <input type="email" name="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button" disabled={busy || !configured}>
            {busy ? "Signing in…" : "Sign in to workspace →"}
          </button>
        </form>
        <p style={{ marginTop: 25, fontSize: 11 }}>
          Access is limited to authorized chapter administrators.
        </p>
        <Link href="/" className="text-link">
          ← Back to the website
        </Link>
      </div>
    </main>
  );
}

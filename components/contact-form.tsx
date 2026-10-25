import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
export default function ContactForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const form = e.currentTarget;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess(true);
      setStatus("Thank you. Your message has been received by the chapter.");
      form.reset();
    } catch (e) {
      setSuccess(false);
      setStatus(
        e instanceof Error ? e.message : "Unable to send your message.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Your name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
      </div>
      <label>
        What would you like to talk about?
        <input name="subject" required minLength={3} maxLength={200} />
      </label>
      <label>
        Your message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={10000}
          rows={6}
        />
      </label>
      <label className="hidden-field" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="muted" style={{ fontSize: 11, margin: 0 }}>
        Your details are used to respond to your enquiry. Please avoid sending
        sensitive information.
      </p>
      {status && (
        <p role="status" className={success ? "form-success" : "form-error"}>
          {status}
        </p>
      )}
      <div>
        <button disabled={busy} className="button">
          {busy ? "Sending…" : "Send message"}
          <ArrowUpRight size={17} />
        </button>
      </div>
    </form>
  );
}

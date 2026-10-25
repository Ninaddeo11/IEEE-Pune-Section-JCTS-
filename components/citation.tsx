import { useState } from "react";
export default function Citation({ text }: { text: string }) {
  const [status, setStatus] = useState("Copy citation");
  return (
    <button
      className="button secondary small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus("Citation copied");
        } catch {
          setStatus("Clipboard unavailable");
        }
      }}
    >
      {status}
    </button>
  );
}

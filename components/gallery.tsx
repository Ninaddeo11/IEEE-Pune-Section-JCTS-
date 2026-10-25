"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { X } from "lucide-react";
import { EmptyState } from "./ui";
type Picture = { url: string; alt: string; type?: string };
export default function Gallery({ pictures }: { pictures: Picture[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  if (!pictures.length)
    return (
      <EmptyState
        title="A space for shared moments."
        description="Chapter photos and videos will appear here when published."
      />
    );
  return (
    <>
      <div className="gallery-grid">
        {pictures.map((p, i) => (
          <button
            key={`${p.url}-${i}`}
            className="gallery-item"
            aria-label={`Open ${p.alt}`}
            onClick={() => {
              setIndex(i);
              dialog.current?.showModal();
            }}
          >
            {p.type === "video" ? (
              <video src={p.url} muted preload="metadata" aria-label={p.alt} />
            ) : (
              <img src={p.url} alt={p.alt} loading="lazy" />
            )}
          </button>
        ))}
      </div>
      <dialog
        className="lightbox"
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span>{pictures[index].alt}</span>
          <button
            aria-label="Close image"
            className="icon-button"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        {pictures[index].type === "video" ? (
          <video
            src={pictures[index].url}
            controls
            style={{ maxWidth: "100%", maxHeight: "75vh" }}
          />
        ) : (
          <img
            src={pictures[index].url}
            alt={pictures[index].alt}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "75vh",
              margin: "auto",
            }}
          />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <button
            className="button secondary small"
            onClick={() =>
              setIndex((index - 1 + pictures.length) % pictures.length)
            }
          >
            Previous
          </button>
          <span>
            {index + 1} / {pictures.length}
          </span>
          <button
            className="button secondary small"
            onClick={() => setIndex((index + 1) % pictures.length)}
          >
            Next
          </button>
        </div>
      </dialog>
    </>
  );
}

"use client";
type Props = {
  collection: string;
  value: string;
  onChange: (value: string) => void;
  media: { id: string; url: string; alt: string; name: string; mime: string }[];
};
const arrayFields: Record<string, string[]> = {
  activities: [
    "speakers",
    "organizers",
    "schedule",
    "highlights",
    "outcomes",
    "tags",
  ],
  leadership: ["expertise"],
  research: ["researchers", "technologies", "tags"],
  publications: ["tags"],
  news: ["tags"],
};
export default function StructuredFields({
  collection,
  value,
  onChange,
  media,
}: Props) {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(value);
  } catch {
    return null;
  }
  function change(field: string, v: unknown) {
    onChange(JSON.stringify({ ...data, [field]: v }, null, 2));
  }
  const gallery = Array.isArray(data.gallery)
    ? (data.gallery as { url: string; alt: string; type?: string }[])
    : [];
  return (
    <>
      <div className="form-grid">
        {(arrayFields[collection] ?? []).map((field) => (
          <label key={field}>
            {field[0].toUpperCase() + field.slice(1)} · one per line
            <textarea
              rows={3}
              value={
                Array.isArray(data[field])
                  ? (data[field] as unknown[]).map(String).join("\n")
                  : ""
              }
              onChange={(e) => change(field, e.target.value.split("\n"))}
            />
          </label>
        ))}
      </div>
      {["activities", "gallery"].includes(collection) && (
        <div style={{ marginBlock: 25 }}>
          <h3 style={{ fontSize: 16 }}>Gallery</h3>
          <select
            aria-label="Add asset to gallery"
            value=""
            onChange={(e) => {
              const asset = media.find((m) => m.id === e.target.value);
              if (asset)
                change("gallery", [
                  ...gallery,
                  {
                    url: asset.url,
                    alt: asset.alt,
                    type: asset.mime.startsWith("video/") ? "video" : "image",
                  },
                ]);
            }}
          >
            <option value="">Add from media library…</option>
            {media
              .filter(
                (m) =>
                  m.mime.startsWith("image/") || m.mime.startsWith("video/"),
              )
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
          {gallery.map((p, i) => (
            <div
              key={`${p.url}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                marginTop: 10,
                fontSize: 12,
              }}
            >
              <span>{p.alt || p.url}</span>
              <button
                type="button"
                className="button secondary small"
                onClick={() =>
                  change(
                    "gallery",
                    gallery.filter((_, n) => n !== i),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {collection === "activities" && (
        <details style={{ marginBlock: 20 }}>
          <summary>Impact statistics</summary>
          <div className="form-grid" style={{ marginTop: 20 }}>
            {Object.entries(
              (data.statistics ?? {}) as Record<string, number>,
            ).map(([key, n]) => (
              <label key={key}>
                {key}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    value={n}
                    onChange={(e) =>
                      change("statistics", {
                        ...(data.statistics as object),
                        [key]: Number(e.target.value),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${key}`}
                    onClick={() => {
                      const stats = {
                        ...(data.statistics as Record<string, number>),
                      };
                      delete stats[key];
                      change("statistics", stats);
                    }}
                  >
                    ×
                  </button>
                </div>
              </label>
            ))}
          </div>
          <button
            className="button secondary small"
            style={{ marginTop: 15 }}
            type="button"
            onClick={() => {
              const name = prompt("Statistic label");
              if (name?.trim())
                change("statistics", {
                  ...(data.statistics as object),
                  [name.trim()]: 0,
                });
            }}
          >
            Add statistic +
          </button>
        </details>
      )}
    </>
  );
}

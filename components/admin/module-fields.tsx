import type { Entry } from "@/lib/content";
export default function ModuleFields({
  value,
  onChange,
  records,
}: {
  value: string;
  onChange: (v: string) => void;
  records: Entry[];
}) {
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(value);
  } catch {
    return null;
  }
  const set = (k: string, v: unknown) =>
    onChange(JSON.stringify({ ...d, [k]: v }, null, 2));
  return (
    <div className="form-grid">
      <label>
        Section type
        <select
          value={String(d.kind || "collection")}
          onChange={(e) => set("kind", e.target.value)}
        >
          {[
            "hero",
            "collection",
            "spotlight",
            "statistics",
            "impact",
            "about",
            "announcement",
            "cta",
            "contact",
            "newsletter",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Order
        <input
          type="number"
          value={Number(d.order || 0)}
          onChange={(e) => set("order", Number(e.target.value))}
        />
      </label>
      <label>
        Content source
        <select
          value={String(d.source || "activities")}
          onChange={(e) => set("source", e.target.value)}
        >
          {[
            "activities",
            "research",
            "publications",
            "leadership",
            "news",
            "opportunities",
            "partners",
            "statistics",
            "focus-areas",
            "settings",
            "resources",
            "gallery",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Selection
        <select
          value={String(d.selection || "all")}
          onChange={(e) => set("selection", e.target.value)}
        >
          {[
            "all",
            "featured",
            "homepage",
            "upcoming",
            "completed",
            "with-statistics",
            "manual",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Item count
        <input
          type="number"
          min={1}
          max={24}
          value={Number(d.itemCount || 6)}
          onChange={(e) => set("itemCount", Number(e.target.value))}
        />
      </label>
      <label>
        Display
        <select
          value={String(d.display || "plain")}
          onChange={(e) => set("display", e.target.value)}
        >
          <option>plain</option>
          <option>tinted</option>
        </select>
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={d.enabled !== false}
          onChange={(e) => set("enabled", e.target.checked)}
        />
        Enabled
      </label>
      {d.kind === "spotlight" && (
        <label>
          Primary activity
          <select
            value={
              Array.isArray(d.selectedIds) ? String(d.selectedIds[0] || "") : ""
            }
            onChange={(e) =>
              onChange(
                JSON.stringify(
                  {
                    ...d,
                    source: "activities",
                    selection: "manual",
                    selectedIds: [
                      e.target.value,
                      ...(Array.isArray(d.selectedIds)
                        ? d.selectedIds.filter((id) => id !== e.target.value)
                        : []),
                    ],
                  },
                  null,
                  2,
                ),
              )
            }
          >
            <option value="">Choose primary...</option>
            {records
              .filter((r) => r.collection === "activities")
              .map((r) => (
                <option value={r.id} key={r.id}>
                  {r.title}
                </option>
              ))}
          </select>
        </label>
      )}
      {d.selection === "manual" && (
        <label className="wide">
          Selected records (selection order controls display)
          <select
            multiple
            value={
              Array.isArray(d.selectedIds) ? d.selectedIds.map(String) : []
            }
            onChange={(e) =>
              set(
                "selectedIds",
                Array.from(e.target.selectedOptions, (o) => o.value),
              )
            }
          >
            {records
              .filter((r) => r.collection === (d.source || "activities"))
              .map((r) => (
                <option value={r.id} key={r.id}>
                  {r.title}
                </option>
              ))}
          </select>
        </label>
      )}
    </div>
  );
}

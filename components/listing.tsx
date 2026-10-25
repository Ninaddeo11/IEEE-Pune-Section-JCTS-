import { useState } from "react";
import { useSearchParams } from "@/client/router";
import { Search } from "lucide-react";
import type { Entry } from "@/lib/content";

import EditorialCollection from "./editorial-collection";
import { EmptyState } from "./ui";
export default function Listing({
  items,
  collection,
}: {
  items: Entry[];
  collection: string;
}) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "All");
  const [year, setYear] = useState("All years");
  const [month, setMonth] = useState("");
  const [featured, setFeatured] = useState(false);
  const years = [
    ...new Set(items.map((e) => e.date.slice(0, 4)).filter(Boolean)),
  ]
    .sort()
    .reverse();
  const cats = [...new Set(items.map((e) => e.category).filter(Boolean))];
  const [format, setFormat] = useState("");
  const filtered = items.filter(
    (e) =>
      (!format || e.data.format === format) &&
      (!format || e.data.format === format) &&
      (category === "All" ||
        e.category === category ||
        (Array.isArray(e.data.tags) && e.data.tags.includes(category))) &&
      (year === "All years" || e.date.startsWith(year)) &&
      (!month || e.date.slice(5, 7) === month) &&
      (!featured || e.featured) &&
      `${e.title} ${e.summary} ${e.body} ${JSON.stringify(e.data)}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="filter-bar">
        <label className="hidden-field" htmlFor="content-search">
          Search content
        </label>
        <input
          id="content-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${collection}…`}
          type="search"
        />
        <select
          aria-label="Filter by year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option>All years</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          aria-label="Filter by month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">All months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option value={String(i + 1).padStart(2, "0")} key={i}>
              {new Date(2026, i, 1).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured
        </label>
      </div>
      {collection === "activities" && (
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">All formats</option>
            {[
              ...new Set(
                items.map((e) => String(e.data.format || "")).filter(Boolean),
              ),
            ].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      )}
      {collection === "activities" && (
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">All formats</option>
            {[
              ...new Set(
                items.map((e) => String(e.data.format || "")).filter(Boolean),
              ),
            ].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      )}
      <div className="chips">
        {["All", ...cats].map((cat) => (
          <button
            className={`chip ${cat === category ? "active" : ""}`}
            key={cat}
            onClick={() => setCategory(cat)}
            aria-pressed={cat === category}
          >
            {cat}
          </button>
        ))}
      </div>
      <p className="result-count">
        <Search size={11} style={{ verticalAlign: "middle", marginRight: 6 }} />
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </p>
      {filtered.length ? (
        <EditorialCollection items={filtered} collection={collection} />
      ) : (
        <EmptyState
          title={items.length ? "No matches. Keep exploring." : undefined}
          description={
            items.length
              ? "Try another search or change your filters."
              : undefined
          }
        />
      )}
    </>
  );
}

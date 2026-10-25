import Link from "@/client/router";
import { useView } from "@/client/view";
import { ContentCard, EmptyState } from "./ui";
export default function ActivityResults() {
  const { query, result, categories } = useView();
  const href = (changes: Record<string, string>) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(
        (pair): pair is [string, string] => typeof pair[1] === "string",
      ),
    );
    Object.entries(changes).forEach(([k, v]) =>
      v ? params.set(k, v) : params.delete(k),
    );
    return `?${params}`;
  };
  return (
    <>
      <form className="filter-bar">
        <label className="hidden-field" htmlFor="activity-search">
          Search content
        </label>
        <input
          id="activity-search"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="Search activities…"
        />
        <select
          name="category"
          aria-label="Category"
          defaultValue={query.category || ""}
        >
          <option value="">All categories</option>
          {categories.map((e) => (
            <option key={e.id}>{e.title}</option>
          ))}
        </select>
        <input
          type="month"
          name="month"
          aria-label="Month"
          defaultValue={query.month}
        />
        <select
          name="format"
          aria-label="Format"
          defaultValue={query.format || ""}
        >
          <option value="">All formats</option>
          {["Online", "Offline", "Hybrid"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="featured"
            value="true"
            defaultChecked={query.featured === "true"}
          />
          Featured
        </label>
        <button className="button small">Apply filters</button>
      </form>
      <div className="chips">
        <Link
          className={`chip ${!query.category ? "active" : ""}`}
          href={href({ category: "", page: "" })}
        >
          All
        </Link>
        {categories.map((e) => (
          <Link
            className={`chip ${e.title === query.category ? "active" : ""}`}
            key={e.id}
            href={href({ category: e.title, page: "" })}
          >
            {e.title}
          </Link>
        ))}
      </div>
      <p className="result-count">
        {result.total} {result.total === 1 ? "result" : "results"}
      </p>
      {result.items.length ? (
        <div className="cards-grid">
          {result.items.map((e, i) => (
            <ContentCard key={e.id} item={e} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState title="No matching activities." />
      )}
      <nav className="pagination" aria-label="Activity pages">
        {result.page > 1 && (
          <Link
            className="button secondary small"
            href={href({ page: String(result.page - 1) })}
          >
            Previous
          </Link>
        )}
        <span>
          Page {result.page} of {Math.max(1, result.pages)}
        </span>
        {result.page < result.pages && (
          <Link
            className="button secondary small"
            href={href({ page: String(result.page + 1) })}
          >
            Next
          </Link>
        )}
      </nav>
    </>
  );
}

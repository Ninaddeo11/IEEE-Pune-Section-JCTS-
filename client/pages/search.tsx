import { useView } from "@/client/view";
import Link from "@/client/router";
import { ContentCard, EmptyState } from "@/components/ui";
import Footer from "@/components/footer";
export default function Search() {
  const { cmsPage, query, items, total } = useView();
  const q = query.q || "";
  const page = Number(query.page) || 1;
  const take = 12;
  return (
    <>
      <main id="main" className="page-width">
        <div className="page-hero">
          <p className="eyebrow">EXPLORE THE CHAPTER</p>
          <h1>{cmsPage?.title || "Search JCTS"}</h1>
          <p>{cmsPage?.summary}</p>
        </div>
        <section className="listing-section">
          <form className="filter-bar">
            <input
              type="search"
              name="q"
              aria-label="Search all content"
              defaultValue={q}
              placeholder="Search activities, people and ideas…"
            />
            <button className="button">Search</button>
          </form>
          <p className="result-count">
            {total} results{q ? ` for “${q}”` : ""}
          </p>
          {items.length ? (
            <div className="cards-grid">
              {items.map((e, i) => (
                <ContentCard key={e.id} item={e} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={q ? "No results found." : "What are you curious about?"}
            />
          )}
          <nav className="pagination" aria-label="Search pages">
            {page > 1 && (
              <Link href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>
                Previous
              </Link>
            )}
            {page * take < total && (
              <Link href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>
                Next
              </Link>
            )}
          </nav>
        </section>
      </main>
      <Footer />
    </>
  );
}

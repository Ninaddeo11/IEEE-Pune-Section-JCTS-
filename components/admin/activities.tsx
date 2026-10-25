import Link from "@/client/router";
import { useView } from "@/client/view";
import { statuses } from "@/lib/content";
import { permits } from "@/lib/policy";
import BulkActivities from "./bulk-activities";
import ActivityActions from "./activity-actions";
export default function AdminActivities() {
  const { query, result, categories, authors, actor } = useView();
  const link = (page: number) => {
    const p = new URLSearchParams(
      Object.entries(query).filter(
        (v): v is [string, string] => typeof v[1] === "string",
      ),
    );
    p.set("page", String(page));
    return `?${p}`;
  };
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Activities</h1>
          <p>{result.total} records</p>
        </div>
        {permits(actor, "CREATE", "activities") && (
          <Link className="button small" href="/admin/activities/new">
            Create activity +
          </Link>
        )}
      </div>
      <form className="admin-filters">
        <input
          name="q"
          aria-label="Search activities"
          placeholder="Search activities"
          defaultValue={query.q}
        />
        <select
          name="category"
          aria-label="Category"
          defaultValue={query.category}
        >
          <option value="">All categories</option>
          {categories.map((e) => (
            <option key={e.id}>{e.title}</option>
          ))}
        </select>
        <select name="status" aria-label="Status" defaultValue={query.status}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          name="start"
          aria-label="From date"
          defaultValue={query.start}
        />
        <input
          type="date"
          name="end"
          aria-label="To date"
          defaultValue={query.end}
        />
        <label>
          <input
            type="checkbox"
            name="featured"
            value="true"
            defaultChecked={query.featured === "true"}
          />
          Featured
        </label>
        <label>
          <input
            type="checkbox"
            name="homepage"
            value="true"
            defaultChecked={query.homepage === "true"}
          />
          Homepage
        </label>
        <select name="sort" aria-label="Sort" defaultValue={query.sort}>
          <option value="date-desc">Newest event</option>
          <option value="date-asc">Oldest event</option>
          <option value="updated">Recently updated</option>
        </select>
        <button className="button small">Filter</button>
      </form>
      <BulkActivities
        items={JSON.parse(JSON.stringify(result.items))}
        actor={actor}
      />
      <div className="admin-panel table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Activity",
                "Category",
                "Date",
                "Status",
                "Visibility",
                "Creator / updated",
                "Actions",
              ].map((v) => (
                <th key={v}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((e) => (
              <tr key={e.id}>
                <td>
                  {e.image && (
                    <div
                      role="img"
                      aria-label={e.imageAlt}
                      className="admin-thumb"
                      style={{
                        backgroundImage: `url(${JSON.stringify(e.image).slice(1, -1)})`,
                      }}
                    />
                  )}
                  <Link href={`/admin/activities/${e.id}`}>{e.title}</Link>
                </td>
                <td>{e.category}</td>
                <td>{e.date}</td>
                <td>
                  <span className={`status ${e.status.toLowerCase()}`}>
                    {e.status}
                  </span>
                </td>
                <td>
                  {e.featured ? "Featured " : ""}
                  {e.homepage ? "Homepage" : ""}
                </td>
                <td>
                  {authors.find((a) => a.id === e.createdBy)?.name ||
                    "Legacy content"}
                  <br />
                  {e.updatedAt ? new Date(e.updatedAt).toLocaleString() : ""}
                </td>
                <td>
                  <ActivityActions
                    item={JSON.parse(JSON.stringify(e))}
                    actor={actor}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result.total && <p>No activities match these filters.</p>}
      </div>
      <nav className="pagination" aria-label="Admin activity pages">
        {result.page > 1 && <Link href={link(result.page - 1)}>Previous</Link>}
        <span>
          Page {result.page} of {Math.max(1, result.pages)}
        </span>
        {result.page < result.pages && (
          <Link href={link(result.page + 1)}>Next</Link>
        )}
      </nav>
    </>
  );
}

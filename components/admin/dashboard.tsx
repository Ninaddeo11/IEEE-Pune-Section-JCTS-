import Link from "@/client/router";
import { useView } from "@/client/view";
import { permits } from "@/lib/policy";
export default function Dashboard() {
  const { actor, user, metrics, logs } = useView();
  const name = user.name;
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">CHAPTER WORKSPACE</p>
          <h1>Welcome, {name.split(" ")[0]}.</h1>
          <p>Content and activity within your access.</p>
        </div>
        {permits(actor, "CREATE", "activities") && (
          <Link className="button small" href="/admin/activities/new">
            Create activity +
          </Link>
        )}
      </div>
      <div className="dashboard-grid">
        {metrics.map(([title, value]) => (
          <div className="metric" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="admin-panel">
        <h2>
          {permits(actor, "AUDIT_VIEW", "audit-logs")
            ? "Recent audit events"
            : "Your recent activity"}
        </h2>
        {logs.length ? (
          <table>
            <thead>
              <tr>
                <th>Who</th>
                <th>Action</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user.name}</td>
                  <td>{log.action}</td>
                  <td>
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No activity yet.</p>
        )}
      </section>
    </>
  );
}

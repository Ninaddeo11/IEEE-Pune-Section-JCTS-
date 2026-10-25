import { Navigate } from "react-router-dom";
import Link from "@/client/router";
import { useView } from "@/client/view";
import { permits } from "@/lib/policy";
import { label } from "@/lib/content";
import Shell from "@/components/admin/shell";
import Login from "@/components/admin/login";
import Editor from "@/components/admin/editor";
import Activities from "@/components/admin/activities";
import Dashboard from "@/components/admin/dashboard";
import Media from "@/components/admin/media";
import Users from "@/components/admin/users";
import Messages from "@/components/admin/messages";
import HomepageBuilder from "@/components/admin/homepage-builder";
import Account from "@/components/admin/account";
export default function Admin() {
  const v = useView();
  if (v.redirect) return <Navigate to={v.redirect} replace />;
  if (v.page === "login") return <Login configured={v.configured} />;
  const canEdit = permits(v.actor, "UPDATE", v.section);
  const body =
    v.section === "dashboard" ? (
      <Dashboard />
    ) : v.section === "activities" && !v.record ? (
      <Activities />
    ) : v.section === "homepage" && !v.record ? (
      <HomepageBuilder records={v.records} actor={v.actor} />
    ) : v.section === "media" ? (
      <Media
        items={v.media}
        editable={canEdit}
        canUpload={permits(v.actor, "MEDIA_UPLOAD", "media")}
      />
    ) : v.section === "users" ? (
      <Users items={v.users} currentId={v.user.id} />
    ) : v.section === "messages" ? (
      <Messages items={v.messages} editable={canEdit} />
    ) : v.section === "security" ? (
      <>
        <h1>Workspace security</h1>
        <Account />
        <div className="admin-panel">
          <p>
            Sessions expire after 12 hours. Changing access revokes sessions.
          </p>
        </div>
      </>
    ) : v.section === "audit-logs" ? (
      <>
        <h1>Audit trail</h1>
        <div className="admin-panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action / target</th>
                <th>Changes</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {v.logs.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.user.name}
                    <br />
                    {l.user.email}
                  </td>
                  <td>
                    {l.action}
                    <br />
                    {l.target}
                  </td>
                  <td>
                    <details>
                      <summary>View record</summary>
                      <pre className="json-preview">
                        {JSON.stringify(
                          { before: l.before, after: l.after },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ) : v.record ? (
      <Editor
        key={`${v.section}-${v.record.id || "new"}`}
        initial={v.record}
        actor={v.actor}
        userId={v.user.id}
        records={v.options}
        categories={v.categories.map((c) => c.title)}
        media={v.media}
        readOnly={
          !canEdit ||
          (["APPROVED", "PUBLISHED", "COMPLETED", "SCHEDULED"].includes(
            v.record.status,
          ) &&
            !permits(v.actor, "PUBLISH", v.section))
        }
      />
    ) : (
      <>
        <div className="admin-heading">
          <div>
            <h1>{label(v.section)}</h1>
            <p>{v.records.length} records</p>
          </div>
          {canEdit && (
            <Link className="button small" href={`/admin/${v.section}/new`}>
              Create content +
            </Link>
          )}
        </div>
        <div className="admin-panel table-wrap">
          {v.records.length ? (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {v.records.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/admin/${v.section}/${e.id}`}>
                        {e.title}
                      </Link>
                    </td>
                    <td>{e.category}</td>
                    <td>
                      <span className={`status ${e.status.toLowerCase()}`}>
                        {e.status}
                      </span>
                    </td>
                    <td>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No {v.section} yet.</p>
          )}
        </div>
      </>
    );
  return (
    <Shell user={{ name: v.user.name, role: v.user.role }}>
      <main id="main">{body}</main>
    </Shell>
  );
}

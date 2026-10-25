import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, entries } from "@/lib/db";
import {
  collections,
  label,
  canManage,
  blankEntry,
  type Entry,
} from "@/lib/content";
import AdminShell from "@/components/admin/shell";
import Editor from "@/components/admin/editor";
import MediaLibrary from "@/components/admin/media";
import Users from "@/components/admin/users";
import Messages from "@/components/admin/messages";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Chapter workspace",
  robots: { index: false, follow: false },
};
export default async function AdminPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const user = await requireUser();
  const { path } = await params;
  const [section, id] = path;
  const all = await entries(undefined, true);
  const allowed = collections.includes(section as (typeof collections)[number]);
  const canEdit = canManage(user.role, section);
  let content: React.ReactNode;
  if (section === "dashboard") {
    const metrics = [
      ["Activities", all.filter((e) => e.collection === "activities").length],
      ["Published", all.filter((e) => e.status === "PUBLISHED").length],
      [
        "Upcoming activities",
        all.filter(
          (e) =>
            e.collection === "activities" &&
            e.date > new Date().toISOString().slice(0, 10),
        ).length,
      ],
      [
        "Research projects",
        all.filter((e) => e.collection === "research").length,
      ],
      [
        "Publications",
        all.filter((e) => e.collection === "publications").length,
      ],
      ["News", all.filter((e) => e.collection === "news").length],
      [
        "Opportunities",
        all.filter((e) => e.collection === "opportunities").length,
      ],
      ["Media assets", await db.media.count()],
    ];
    const logs = await db.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    content = (
      <>
        <div className="admin-heading">
          <div>
            <p className="eyebrow">YOUR CHAPTER, AT A GLANCE</p>
            <h1>Good to have you here, {user.name.split(" ")[0]}.</h1>
            <p>Make room for the next great idea.</p>
          </div>
          {canManage(user.role, "activities") && (
            <Link className="button small" href="/admin/activities/new">
              Create activity +
            </Link>
          )}
        </div>
        <div className="dashboard-grid">
          {metrics.map(([name, value]) => (
            <div className="metric" key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="admin-panel">
          <h2>Recent workspace activity</h2>
          {logs.length ? (
            <table>
              <thead>
                <tr>
                  <th>WHO</th>
                  <th>ACTION</th>
                  <th>WHEN</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.user.name}</td>
                    <td>{l.action.replace(/_/g, " ")}</td>
                    <td>
                      {l.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Your workspace activity will appear here.</p>
          )}
        </div>
      </>
    );
  } else if (section === "media") {
    const media = await db.media.findMany({ orderBy: { createdAt: "desc" } });
    content = <MediaLibrary items={media} editable={canEdit} />;
  } else if (section === "users") {
    if (!canEdit)
      content = (
        <div className="notice">
          User management is restricted to super administrators.
        </div>
      );
    else
      content = (
        <Users
          items={await db.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              active: true,
            },
            orderBy: { createdAt: "desc" },
          })}
          currentId={user.id}
        />
      );
  } else if (section === "messages") {
    if (!canEdit)
      content = (
        <div className="notice">
          Messages are restricted to chapter administrators.
        </div>
      );
    else
      content = (
        <Messages
          editable={canEdit}
          items={(
            await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } })
          ).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        />
      );
  } else if (section === "audit-logs") {
    if (!["SUPER_ADMIN", "CHAPTER_ADMIN"].includes(user.role))
      content = (
        <div className="notice">
          Audit records are restricted to chapter administrators.
        </div>
      );
    else {
      const logs = await db.auditLog.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      content = (
        <>
          <div className="admin-heading">
            <div>
              <h1>Audit trail</h1>
              <p>The latest 200 changes, with before and after records.</p>
            </div>
          </div>
          <div className="admin-panel">
            <table>
              <thead>
                <tr>
                  <th>ACTOR</th>
                  <th>ACTION / TARGET</th>
                  <th>CHANGES</th>
                  <th>WHEN</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
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
                    <td>
                      {l.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }
  } else if (section === "security") {
    content = (
      <>
        <div className="admin-heading">
          <h1>Workspace security</h1>
        </div>
        <div className="admin-panel">
          <h2>Your session</h2>
          <p className="muted">
            Signed in as {user.email}. Sessions expire after 12 hours. Disabling
            a user revokes all their sessions.
          </p>
          <h2>Access policy</h2>
          <p className="muted">
            Content permissions are enforced on the server. All write endpoints
            validate request origin, inputs and session access. Sign-in and
            public contact submissions are rate limited through PostgreSQL.
          </p>
          <h2>Storage</h2>
          <p className="muted">
            Uploads use file signature checks, a 25 MB limit and required
            alternative text. Production uploads require configured
            S3-compatible object storage.
          </p>
        </div>
      </>
    );
  } else if (allowed) {
    if (id) {
      if (id === "new" && !canEdit)
        content = (
          <div className="notice">
            You do not have permission to create content in this collection.
          </div>
        );
      else {
        const record =
          id === "new"
            ? { ...blankEntry, collection: section }
            : all.find((e) => e.id === id && e.collection === section);
        if (!record) notFound();
        const media = await db.media.findMany({
          select: { id: true, url: true, alt: true, name: true, mime: true },
        });
        content = (
          <Editor
            key={`${section}-${id}`}
            initial={JSON.parse(JSON.stringify(record)) as Entry}
            media={media}
            readOnly={!canEdit}
          />
        );
      }
    } else {
      const records = all.filter((e) => e.collection === section);
      content = (
        <>
          <div className="admin-heading">
            <div>
              <h1>{label(section)}</h1>
              <p>
                {records.length} records · Publish, update and shape your
                chapter.
              </p>
            </div>
            {canEdit && (
              <Link href={`/admin/${section}/new`} className="button small">
                Create {section === "activities" ? "activity" : "content"} +
              </Link>
            )}
          </div>
          {records.length ? (
            <div className="admin-panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>TITLE</th>
                    <th>CATEGORY</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>VISIBILITY</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Link href={`/admin/${section}/${e.id}`}>
                          {e.title}
                        </Link>
                        <br />
                        <span className="muted" style={{ fontSize: 10 }}>
                          /{e.collection}/{e.slug}
                        </span>
                      </td>
                      <td>{e.category || "—"}</td>
                      <td>
                        <span className={`status ${e.status.toLowerCase()}`}>
                          {e.status}
                        </span>
                      </td>
                      <td>{e.date || "—"}</td>
                      <td>
                        {e.featured ? "Featured" : ""}{" "}
                        {e.homepage ? "· Homepage" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Your next story starts here.</h3>
              <p>
                No {section} yet.{" "}
                {canEdit
                  ? "Create the first record to get started."
                  : "Published and draft records will appear here."}
              </p>
            </div>
          )}
        </>
      );
    }
  } else notFound();
  return (
    <AdminShell user={{ name: user.name, role: user.role }}>
      <main id="main">{content}</main>
    </AdminShell>
  );
}

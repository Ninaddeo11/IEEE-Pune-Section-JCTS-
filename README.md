# IEEE JCTS Pune Chapter

A React 19 + TypeScript website and administrator CMS, built with Vite. A separate Express 5 backend provides authenticated APIs and PostgreSQL access through Prisma. Next.js is no longer a dependency or runtime.

## Architecture

- `client/`: React entry point, React Router navigation, page-data context, public/admin pages and styles.
- `components/`: reusable public components, CMS editors, media tools, Tiptap, motion and lazy-loaded Three.js.
- `server/`: Express application, request-scoped sessions, page-data queries, metadata and API handlers.
- `api/index.ts`: serverless Express entry point for Vercel.
- `lib/`: shared content/policy/date helpers plus server-only database, storage and authentication services.
- `prisma/`: existing schema, additive migrations and non-destructive content seed.
- `tests/`: unit tests, desktop/mobile browser checks and isolated PostgreSQL CMS tests.

Browser code never connects directly to PostgreSQL or imports Prisma, authentication secrets, filesystem storage or database services. Public React pages load JSON through `/api/view`; content mutations retain the existing `/api/*` routes. The server supplies initial page data and per-route HTML metadata, canonical URLs, social images and JSON-LD. React renders page content in the browser; this is a client-rendered application, without React Server Components.

## Local development

Requires Node.js 22.12+ and PostgreSQL (local or Supabase). On Windows use `npm.cmd` when PowerShell blocks npm scripts.

```powershell
npm.cmd ci
# For a new checkout only: copy .env.example to .env and fill in your database URL.
npx.cmd prisma generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

`npm run dev` starts Vite at **http://127.0.0.1:3000** and the separate backend at **http://127.0.0.1:4000**. Vite proxies API/media requests to the backend. Explicit IPv4 addresses avoid unrelated Docker services that may occupy IPv6 localhost ports. Both processes are stopped with Ctrl+C. Individual commands are `npm run dev:client` and `npm run dev:server`; restart the combined command after changing backend code.

Open `/admin` for administrator login. The initial administrator is created separately:

```powershell
# Set ADMIN_INITIAL_PASSWORD securely in your shell (12+ characters).
npm.cmd run admin:create
# Clear ADMIN_INITIAL_PASSWORD from your shell afterward.
```

There are no default credentials, public sign-ups or shared accounts. Existing Supabase content, administrators and bcrypt hashes are unchanged by this framework migration.

Without `DATABASE_URL`, public pages use bundled approved source records. CMS login and contact submissions require the database. A configured database is the source of truth and must be migrated/seeded; an unavailable configured database produces a visible error rather than silently falling back to demo content.

## Environment

Keep `.env` and `.env.local` out of Git. `.env.local` has precedence over `.env`; explicit process environment values have precedence over both.

| Variable                                                    | Purpose                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                              | Server-only PostgreSQL connection; URL-encode password characters and use TLS for Supabase.                 |
| `SITE_URL`                                                  | Canonical public origin, including HTTPS in production. Replaces the former `NEXT_PUBLIC_SITE_URL` setting. |
| `API_PORT` / `PORT`                                         | Backend listening port (default 4000).                                                                      |
| `WEB_PORT`                                                  | Vite development port (default 3000).                                                                       |
| `STORAGE_DRIVER`                                            | `local` for development, `s3` for production.                                                               |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`                     | S3-compatible object storage.                                                                               |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | Server-only storage credentials and public asset base.                                                      |

No browser environment variable needs database credentials or an administrator password. Do not put secrets in Vite-prefixed variables. Supabase direct endpoints require IPv6 unless the IPv4 add-on is enabled. For IPv4-only hosts use the exact session-pooler URI from Supabase's Connect panel; for serverless hosting configure the appropriate transaction pooler for Prisma 6. Apply migrations through a direct or session-mode connection, rather than the transaction pooler.

Supabase is used as PostgreSQL, with custom CMS sessions; Supabase Auth/browser keys are not required. Migration `202610250002_server_only_access` enables RLS and revokes direct table access from `anon` and `authenticated`. The backend's database role must retain its table access. Do not open browser access without designing explicit policies.

## CMS and publishing

The CMS manages activities, reusable people, leadership, research, publications, news, announcements, opportunities, resources, documents, gallery, partners, homepage modules, taxonomy, navigation, statistics, FAQs and chapter settings.

- Super administrators manage users, roles, explicit publishing grants and password resets. Self-elevation is blocked and access changes revoke sessions.
- Chapter administrators manage chapter content, publication and audit views.
- Event managers create/edit activities and people, upload assets, preview and submit for review; publishing is separately granted.
- Content/research managers edit their permitted collections and submit for review; they cannot publish by default.
- Media managers manage assets without editorial publishing access. Viewers have read-only published access.

The lifecycle supports DRAFT, REVIEW, APPROVED, SCHEDULED, PUBLISHED, COMPLETED and ARCHIVED. Permissions are enforced on the backend, including direct API calls. COMPLETED is public; ARCHIVED is private. Scheduled content becomes visible on public requests after its publication time, without a background job changing its stored status.

Activity calendar dates and IANA timezones produce typed UTC timestamps. Existing date fields and legacy text speakers remain compatible. Reusable people have relational activity participation roles. Categories are managed records; used categories cannot be deleted or renamed without explicitly recategorizing their activities.

The editor supports rich text, logistics, schedules, SDGs, registration links, statistics, images, video and galleries. Uploads require matching signatures/MIME/extensions, alt text and a 25 MB limit. Local uploads are for development; production requires S3-compatible storage. Uploaded asset URLs are public even when attached to drafts.

Save a draft, preview the account-bound one-hour snapshot, submit for review and have a publisher approve/publish. Publication automatically feeds listings, search, detail pages, sitemap, upcoming and configured homepage modules. `/activities/{slug}` remains canonical and `/activity/{slug}` redirects to it. Homepage selections are data-driven; no activity slug is hardcoded in the frontend.

Homepage records configure section types, source collections, selection, ordering, item counts, titles, summaries and enabled state. Spotlight supports manual primary/secondary choices. Contact/newsletter modules link to Contact; they do not claim to subscribe visitors to an external service.

Revisions, audited transitions, optimistic version checks, per-user local recovery and existing-draft autosave are preserved. Conflicting saves return 409. The Security screen supports password changes and revoking sessions. Super administrators can reset passwords; email recovery and MFA enrollment are not implemented.

## Production and Vercel

```powershell
npm.cmd run build
npm.cmd run start
```

The build creates `dist/client` (Vite assets) and `dist/server/index.cjs` (Express). The production backend serves the React build and APIs on one origin; its internal modules remain separate. Set `NODE_ENV=production` and the canonical `SITE_URL` when running the Node server.

`vercel.json` declares the Vite output and routes dynamic pages/APIs to `api/index.ts`, preserving GitHub -> Vercel -> custom domain deployment. Configure the server environment in Vercel, including pooled PostgreSQL and production object storage. Deployments and custom-domain DNS have not been performed by this migration. HTTPS is required for production session cookies. The reverse proxy must normalize `x-forwarded-for` for rate limits.

## Verification

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:cms
npm.cmd run test:browser
npm.cmd run test:browser:production
```

The CMS suite starts disposable PostgreSQL plus the real React/Express stack on ports 3001/4001. It never uses Supabase for mutations. Browser suites start and stop their own frontend/backend with seed-only public content on port 3000; stop your development server first. Tests cover activity approval/publication, previews, access, media, revisions, concurrency, grants, pagination, timezone backfill, accessibility, mobile navigation and reduced motion.

Non-activity collection listings retain their client filtering. Session/revision/rate-limit retention, email recovery, MFA and a stricter nonce-based CSP remain separate operational improvements.

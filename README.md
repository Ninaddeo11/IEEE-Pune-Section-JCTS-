# IEEE JCTS Pune Chapter

A Next.js App Router application for the Joint Chapter of IEEE Technology and Engineering Management Society & IEEE Systems Council, Pune Section.

The public website and administrator workspace live in the same application. Content is read from PostgreSQL through Prisma. With no `DATABASE_URL`, the public website renders the supplied 2026 source records in read-only mode; CMS login and contact submission explicitly require database setup. Configuring a database switches reads to that database; run the seed once to populate it.

## Run locally

Requires Node.js 22.12+ and PostgreSQL 17+. On Windows, use `npm.cmd` / `npx.cmd` if PowerShell restricts npm scripts.

```powershell
npm.cmd ci
Copy-Item .env.example .env
# Edit DATABASE_URL in .env to point to your PostgreSQL database.
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Visit `http://localhost:3000`. To start the optional development PostgreSQL container, set a unique `POSTGRES_PASSWORD` environment variable, run `docker compose up -d`, and use matching `jcts` credentials in `DATABASE_URL`. Docker Desktop must be running. No database or production service is provisioned automatically.

## Create the first administrator

There are no default credentials and no public sign-up. Set `ADMIN_INITIAL_PASSWORD` in your shell to a unique password of at least 12 characters, then run:

```powershell
npm.cmd run admin:create
Remove-Item Env:ADMIN_INITIAL_PASSWORD
```

The command prompts for the administrator's email and name, hashes the password with bcrypt, and creates a `SUPER_ADMIN`. Sign in at `/admin`. Super administrators can create and enable/disable other users under **Users**. Share initial passwords privately. Disabling an account revokes its sessions.

## CMS workflow

The sidebar manages activities, research, publications, news, announcements, opportunities, resources, leadership, partners, albums, documents, media, homepage sections, focus areas, statistics, navigation, FAQs, settings, users, messages and audit records.

1. Create a record and set its unique slug, category and dates.
2. Write the description with the rich-text editor. Edit speakers, organizers, highlights, schedule and outcomes using their individual fields. Gallery assets can be selected from the media library. An advanced JSON editor supports additional structured fields.
3. Upload media separately and choose an existing hero image. Images require alt text. The media library supports folders, tags, metadata edits, replacement in place and deletion. Referenced assets cannot be deleted.
4. Save a draft, request review, schedule publication, publish or archive. **Preview changes** creates a private snapshot that expires after one hour and is bound to your administrator account. It opens the public design without altering the published record. Drafts and future scheduled records stay out of public listings, search, sitemap and unauthenticated detail routes.
5. Featured records with **Show on homepage** appear in their homepage features. Future years require content changes only. Scheduled records become public on the first request at or after their scheduled time; no cron task is needed.

Editors keep an automatic recovery copy in the browser. Existing drafts also autosave to the database after an editing pause. Recovery copies are device-local and should not be used on shared devices. Clear browser storage after using a shared workstation.

Homepage → `hero` controls the main title, description and CTA. Other homepage records control section titles, summaries and visibility; unpublish a section record to hide it. Focus areas have their own ordered collection. Statistics override the homepage EU-REKA snapshot when published. Navigation items support ordering, visibility and a parent slug for dropdown grouping. Settings → `chapter` controls the mission, vision, contact details and footer text.

**Pages** controls informational page copy, section headings and SEO, including About, Membership, Contact, Privacy and Terms. Create a published page with a new slug to add an informational route. About and Membership expose CTA fields; Membership's structured `cards` array controls its three introductory cards. Documents appear in Resources and announcements appear in News.

Public content routes include `/activities`, `/leadership`, `/research`, `/publications`, `/opportunities`, `/resources`, `/news` and `/gallery`, with slug detail routes. Also included are `/about`, `/membership`, `/contact`, `/search`, `/privacy`, `/terms`, `/robots.txt` and `/sitemap.xml`. Press Ctrl/Cmd+K for search.

## Architecture

- Next.js 16, React 19, strict TypeScript, Tailwind 4, a shadcn-style Radix button primitive, Framer Motion, Tiptap, React Three Fiber / Drei / Three.js.
- Shared `Content` records provide publication workflow, slugs, dates, search text, SEO, visibility and collection-specific structured data. This implementation deliberately uses a shared content model with JSON extensions rather than a separate Prisma table for every editorial type. Users, sessions, media, messages, rate limits and audit records have separate relational tables.
- The same repository reads drive listings, search, detail pages, metadata and sitemap. No event arrays live inside page components. Seed data is isolated in `lib/seed-data.ts` and database seeding never overwrites existing edits.
- HTTP-only random-token sessions are stored as SHA-256 hashes in PostgreSQL, expire after 12 hours, and use secure cookies in production. There is no Google OAuth or password-recovery service configured.
- Server-side role enforcement covers all mutations. Writes require matching Origin; payloads use Zod validation; public forms and sign-in use database-backed rate limiting. CMS changes are audited with before/after snapshots. Rich-text JSON is rendered as React elements, never raw HTML.
- The hero uses a dynamically imported WebGL scene. Mobile, reduced-motion and unsupported WebGL clients receive CSS geometry. The scene pauses when out of view. Cards and grids use CSS for low-cost hover feedback.

## Storage and deployment

`STORAGE_DRIVER=local` writes development assets to `public/uploads`. Production rejects local uploads because serverless filesystems are ephemeral. Set `STORAGE_DRIVER=s3` and the S3-compatible variables from `.env.example` for AWS S3, Cloudflare R2 or another compatible provider. Configure `S3_PUBLIC_URL` to a public/CDN origin serving those files and apply your provider's access and retention policy. Accepted uploads are PNG, JPEG, WebP, PDF and MP4, checked against file signatures and limited to 25 MB.

For Vercel or a Node host:

1. Provision PostgreSQL and object storage; configure environment variables, HTTPS and the final `NEXT_PUBLIC_SITE_URL`.
2. Apply migrations with `npm run db:migrate`; seed once; create the initial administrator.
3. Build with `npm run build`, then use the host's Next.js integration or `npm start`.
4. Configure database backups, connection pooling, trusted proxy/IP forwarding, logs and alerting. Run the database-backed integration checks in staging before opening CMS access.

## Validation

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
# With the application running on port 3000 and Chrome installed:
npm.cmd run test:browser
# Isolated PostgreSQL + authenticated CMS tests; does not need a configured database:
npm.cmd run test:cms
```

Browser tests exercise desktop and mobile rendering, routes, activity filters, search, detail pages, keyboard search, mobile navigation, reduced motion, unauthenticated CMS rejection and automated WCAG 2.2 AA checks. Screenshots are saved to ignored `artifacts/`. Override the Playwright browser channel if your machine does not have Chrome installed. No Lighthouse score is claimed without a measured production run.

The CMS integration harness starts a temporary, loopback-only PostgreSQL instance on port 55432 and a development server on port 3001. It generates random test credentials in memory, forces local storage and its own database URL, applies the migration, and exercises database CRUD, browser editing, publication, private previews, CMS-driven page/navigation changes, uploads/replacement/reference protection, contact messages, all seven roles and session revocation. Test services stop afterward and database files are removed. Both ports must be available. Test accounts and records exist only in this isolated database.

## Source content and launch requirements

Only the pasted brief was supplied. The initial 16 activity records, dates, named speakers and EU-REKA numbers come from that brief. EU-REKA has no invented event date. Original report attachments, official branding assets, photographs, full PRAXIS speaker details, finale team names, leadership, publication records, partnerships and official contact/social URLs were not provided; these should be added through the CMS after source verification. Abstract artwork is decorative and is not presented as event photography. Mission and vision are preserved verbatim.

Before launch, provide verified content and branding, review privacy/terms and retention requirements, configure real infrastructure, and run staging checks against your database and object store. Local PostgreSQL and local-file workflows have been exercised; production S3 credentials and hosting have not been supplied or tested.

# Repository guidance

This application uses React + Vite in `client/` and a separate Express backend in `server/`.
Keep Prisma, database credentials, sessions and storage code on the server. Browser code may import shared content types, policy predicates, formatting and validation helpers only when they have no server dependencies.
Run typecheck, lint, unit tests, the isolated CMS suite and desktop/mobile browser checks for architectural changes. CMS tests must use their isolated PostgreSQL instance, never the connected Supabase database.

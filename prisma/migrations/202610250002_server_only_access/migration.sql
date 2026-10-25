-- The CMS uses server-side Prisma and its own session authorization.
-- No application table is intended for direct Supabase browser/API access.
DO $$
DECLARE
  table_name TEXT;
  api_role TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'User', 'Session', 'Content', 'Media', 'ContactMessage', 'AuditLog',
    'RateLimit', 'ContentPreview', 'ContentRevision', 'ContentParticipant',
    '_prisma_migrations'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
          EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', table_name, api_role);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

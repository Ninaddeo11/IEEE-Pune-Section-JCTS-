ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TABLE "User" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Content" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT '',
ADD COLUMN "startsAt" TIMESTAMPTZ(3), ADD COLUMN "endsAt" TIMESTAMPTZ(3), ADD COLUMN "scheduledAt" TIMESTAMPTZ(3);
CREATE TABLE "ContentRevision" ("id" TEXT NOT NULL, "contentId" TEXT NOT NULL, "version" INTEGER NOT NULL, "userId" TEXT NOT NULL, "payload" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ContentRevision_contentId_version_key" ON "ContentRevision"("contentId", "version");
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Content_collection_startsAt_idx" ON "Content"("collection", "startsAt");
-- Legacy date strings remain intact. Valid event dates are backfilled in the chapter timezone.
UPDATE "Content" SET "startsAt" = ("date"::date::timestamp AT TIME ZONE COALESCE(NULLIF("data"->>'timezone', ''), 'Asia/Kolkata')) WHERE "collection"='activities' AND "date" ~ '^\d{4}-\d{2}-\d{2}$';

INSERT INTO "Content" ("id","collection","slug","title","status","data","updatedAt")
SELECT 'taxonomy-' || md5(category), 'categories', lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')), category, 'PUBLISHED', '{}', NOW()
FROM (SELECT DISTINCT "category" AS category FROM "Content" WHERE "collection"='activities' AND "category"<>'' UNION SELECT unnest(ARRAY['Professional','Technical','Non-Technical','Administrative','Humanities','Pre-University','Research','Innovation','Humanitarian'])) c
ON CONFLICT ("collection","slug") DO NOTHING;

CREATE TABLE "ContentParticipant" ("id" TEXT NOT NULL, "activityId" TEXT NOT NULL, "personId" TEXT NOT NULL, "role" TEXT NOT NULL, CONSTRAINT "ContentParticipant_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ContentParticipant_activityId_personId_role_key" ON "ContentParticipant"("activityId","personId","role");
ALTER TABLE "ContentParticipant" ADD CONSTRAINT "ContentParticipant_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Content"("id") ON DELETE CASCADE;
ALTER TABLE "ContentParticipant" ADD CONSTRAINT "ContentParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Content"("id") ON DELETE RESTRICT;

-- Preserve existing content and give legacy homepage records explicit module settings.
UPDATE "Content" SET "data" = "data" || jsonb_build_object('kind', CASE WHEN "slug"='hero' THEN 'hero' WHEN "slug"='join' THEN 'cta' ELSE 'collection' END, 'source', CASE WHEN "slug"='focus' THEN 'focus-areas' WHEN "slug"='knowledge' THEN 'research' ELSE "slug" END, 'selection', CASE WHEN "slug"='activities' THEN 'homepage' ELSE 'all' END) WHERE "collection"='homepage' AND NOT ("data" ? 'kind');
INSERT INTO "Content" ("id","collection","slug","title","status","data","updatedAt") VALUES
('module-upcoming','homepage','upcoming','Upcoming activities','PUBLISHED','{"kind":"collection","source":"activities","selection":"upcoming","itemCount":3,"order":2}',NOW()),
('module-spotlight','homepage','spotlight','In the spotlight','PUBLISHED','{"kind":"spotlight","source":"activities","selection":"featured","itemCount":3,"order":3}',NOW()),
('module-about','homepage','about','Progress happens when minds connect.','PUBLISHED','{"kind":"about","source":"settings","selection":"all","order":1}',NOW()),
('module-statistics','homepage','statistics','Impact, in numbers.','PUBLISHED','{"kind":"statistics","source":"statistics","selection":"all","order":4}',NOW()),
('module-partners','homepage','partners','Progress through collaboration.','PUBLISHED','{"kind":"collection","source":"partners","selection":"all","order":10}',NOW())
ON CONFLICT ("collection","slug") DO NOTHING;

UPDATE "Content" SET "scheduledAt"="publishAt"::timestamptz WHERE "publishAt" ~ '^\d{4}-\d{2}-\d{2}T' AND "publishAt" <> '';
UPDATE "Content" SET "startsAt"=(("date" || ' ' || CASE WHEN "data"->>'startTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN "data"->>'startTime' ELSE '00:00' END)::timestamp AT TIME ZONE COALESCE(NULLIF("data"->>'timezone',''),'Asia/Kolkata')) WHERE "collection"='activities' AND "date" ~ '^\d{4}-\d{2}-\d{2}$';
UPDATE "Content" SET "endsAt"=((COALESCE(NULLIF("endDate",''),"date") || ' ' || CASE WHEN "data"->>'endTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN "data"->>'endTime' ELSE '23:59' END)::timestamp AT TIME ZONE COALESCE(NULLIF("data"->>'timezone',''),'Asia/Kolkata')) WHERE "collection"='activities' AND "date" ~ '^\d{4}-\d{2}-\d{2}$' AND ("endDate"<>'' OR "data"->>'endTime'<>'');

UPDATE "Content" SET "data"="data" || '{"kind":"statistics","source":"activities","selection":"with-statistics","itemCount":1}'::jsonb WHERE "collection"='homepage' AND "id"='module-statistics';

CREATE INDEX "Content_collection_date_idx" ON "Content"("collection","date");

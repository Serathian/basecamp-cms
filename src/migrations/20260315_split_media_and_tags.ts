import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ─── Step 1: Create 3 new tag tables ────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jr_tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS nitf_tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rotr_tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 2: Populate tag tables from existing tags table ───────────────────
  // Conditional: tags table may not exist if up() is called a second time in a test cycle
  await db.execute(sql.raw(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags' AND table_schema = 'public') THEN
        INSERT INTO jr_tags (id, name, slug, updated_at, created_at)
          SELECT id, name, slug, updated_at, created_at FROM tags WHERE site = 'jake-reddy'
          ON CONFLICT (id) DO NOTHING;
        INSERT INTO nitf_tags (id, name, slug, updated_at, created_at)
          SELECT id, name, slug, updated_at, created_at FROM tags WHERE site = 'nerdintheforest'
          ON CONFLICT (id) DO NOTHING;
        INSERT INTO rotr_tags (id, name, slug, updated_at, created_at)
          SELECT id, name, slug, updated_at, created_at FROM tags WHERE site = 'reddyontheroad'
          ON CONFLICT (id) DO NOTHING;
      END IF;
    END $$
  `))

  // Reset sequences to avoid PK conflicts on future inserts
  await db.execute(sql`SELECT setval('jr_tags_id_seq', COALESCE((SELECT MAX(id) FROM jr_tags), 0) + 1, false)`)
  await db.execute(sql`SELECT setval('nitf_tags_id_seq', COALESCE((SELECT MAX(id) FROM nitf_tags), 0) + 1, false)`)
  await db.execute(sql`SELECT setval('rotr_tags_id_seq', COALESCE((SELECT MAX(id) FROM rotr_tags), 0) + 1, false)`)

  // ─── Step 3: Create 3 new media tables ──────────────────────────────────────
  // Mirror the original media table schema from migration 20260303_172001
  // Columns: id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename,
  //          mime_type, filesize (NUMERIC), width (NUMERIC), height (NUMERIC),
  //          focal_x (NUMERIC), focal_y (NUMERIC)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jr_media (
      id SERIAL PRIMARY KEY,
      alt VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      url VARCHAR(255),
      thumbnail_u_r_l VARCHAR(255),
      filename VARCHAR(255),
      mime_type VARCHAR(255),
      filesize NUMERIC,
      width NUMERIC,
      height NUMERIC,
      focal_x NUMERIC,
      focal_y NUMERIC
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS nitf_media (
      id SERIAL PRIMARY KEY,
      alt VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      url VARCHAR(255),
      thumbnail_u_r_l VARCHAR(255),
      filename VARCHAR(255),
      mime_type VARCHAR(255),
      filesize NUMERIC,
      width NUMERIC,
      height NUMERIC,
      focal_x NUMERIC,
      focal_y NUMERIC
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rotr_media (
      id SERIAL PRIMARY KEY,
      alt VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      url VARCHAR(255),
      thumbnail_u_r_l VARCHAR(255),
      filename VARCHAR(255),
      mime_type VARCHAR(255),
      filesize NUMERIC,
      width NUMERIC,
      height NUMERIC,
      focal_x NUMERIC,
      focal_y NUMERIC
    )
  `)

  // ─── Step 3b: Create authors_rels join table (polymorphic avatar relationship) ─
  // Authors.avatar is a polymorphic upload field (jr_media | nitf_media | rotr_media)
  // which requires an authors_rels table — created here since these media tables are new.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS authors_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
      path VARCHAR(255) NOT NULL,
      jr_media_id INTEGER REFERENCES jr_media(id) ON DELETE SET NULL,
      nitf_media_id INTEGER REFERENCES nitf_media(id) ON DELETE SET NULL,
      rotr_media_id INTEGER REFERENCES rotr_media(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 4: Populate media tables with attribution ─────────────────────────
  // Conditional: media table may not exist if up() is called a second time in a test cycle
  await db.execute(sql.raw(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media' AND table_schema = 'public') THEN
        -- jr_media: records referenced by jr_posts.cover_image_id
        INSERT INTO jr_media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
          SELECT m.id, m.alt, m.updated_at, m.created_at, m.url, m.thumbnail_u_r_l, m.filename, m.mime_type, m.filesize, m.width, m.height, m.focal_x, m.focal_y
          FROM media m INNER JOIN jr_posts p ON p.cover_image_id = m.id ON CONFLICT (id) DO NOTHING;
        -- nitf_media: records referenced by nitf_posts.cover_image_id
        INSERT INTO nitf_media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
          SELECT m.id, m.alt, m.updated_at, m.created_at, m.url, m.thumbnail_u_r_l, m.filename, m.mime_type, m.filesize, m.width, m.height, m.focal_x, m.focal_y
          FROM media m INNER JOIN nitf_posts p ON p.cover_image_id = m.id ON CONFLICT (id) DO NOTHING;
        -- nitf_trails.gpx_file_id references in nitf_media
        INSERT INTO nitf_media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
          SELECT m.id, m.alt, m.updated_at, m.created_at, m.url, m.thumbnail_u_r_l, m.filename, m.mime_type, m.filesize, m.width, m.height, m.focal_x, m.focal_y
          FROM media m INNER JOIN nitf_trails t ON t.gpx_file_id = m.id ON CONFLICT (id) DO NOTHING;
        -- rotr_media: records referenced by rotr_posts.cover_image_id (rotr_posts may not exist after Phase 4 migration)
        -- Orphans: insert into jr_media as default
        INSERT INTO jr_media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
          SELECT m.id, m.alt, m.updated_at, m.created_at, m.url, m.thumbnail_u_r_l, m.filename, m.mime_type, m.filesize, m.width, m.height, m.focal_x, m.focal_y
          FROM media m
          WHERE NOT EXISTS (SELECT 1 FROM jr_media jm WHERE jm.id = m.id)
            AND NOT EXISTS (SELECT 1 FROM nitf_media nm WHERE nm.id = m.id)
            AND NOT EXISTS (SELECT 1 FROM rotr_media rm WHERE rm.id = m.id)
          ON CONFLICT (id) DO NOTHING;
      END IF;
    END $$
  `))

  // Reset media sequences
  await db.execute(sql`SELECT setval('jr_media_id_seq', COALESCE((SELECT MAX(id) FROM jr_media), 0) + 1, false)`)
  await db.execute(sql`SELECT setval('nitf_media_id_seq', COALESCE((SELECT MAX(id) FROM nitf_media), 0) + 1, false)`)
  await db.execute(sql`SELECT setval('rotr_media_id_seq', COALESCE((SELECT MAX(id) FROM rotr_media), 0) + 1, false)`)

  // ─── Step 5: Update _rels join tables with site-specific tag ID columns ──────

  // jr_posts_rels: add jr_tags_id, populate from tags_id where site='jake-reddy', drop tags_id
  await db.execute(sql`
    ALTER TABLE jr_posts_rels ADD COLUMN IF NOT EXISTS jr_tags_id INTEGER
  `)
  await db.execute(sql`
    UPDATE jr_posts_rels r
    SET jr_tags_id = r.tags_id
    WHERE r.path = 'tags'
      AND r.tags_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM tags t WHERE t.id = r.tags_id AND t.site = 'jake-reddy'
      )
  `)
  await db.execute(sql`
    ALTER TABLE jr_posts_rels DROP COLUMN IF EXISTS tags_id
  `)

  // nitf_posts_rels: add nitf_tags_id, populate from tags_id where site='nerdintheforest', drop tags_id
  await db.execute(sql`
    ALTER TABLE nitf_posts_rels ADD COLUMN IF NOT EXISTS nitf_tags_id INTEGER
  `)
  await db.execute(sql`
    UPDATE nitf_posts_rels r
    SET nitf_tags_id = r.tags_id
    WHERE r.path = 'tags'
      AND r.tags_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM tags t WHERE t.id = r.tags_id AND t.site = 'nerdintheforest'
      )
  `)
  await db.execute(sql`
    ALTER TABLE nitf_posts_rels DROP COLUMN IF EXISTS tags_id
  `)

  // rotr_posts_rels: add rotr_tags_id, populate from tags_id where site='reddyontheroad', drop tags_id
  await db.execute(sql`
    ALTER TABLE rotr_posts_rels ADD COLUMN IF NOT EXISTS rotr_tags_id INTEGER
  `)
  await db.execute(sql`
    UPDATE rotr_posts_rels r
    SET rotr_tags_id = r.tags_id
    WHERE r.path = 'tags'
      AND r.tags_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM tags t WHERE t.id = r.tags_id AND t.site = 'reddyontheroad'
      )
  `)
  await db.execute(sql`
    ALTER TABLE rotr_posts_rels DROP COLUMN IF EXISTS tags_id
  `)

  // ─── Step 6: Update payload_locked_documents_rels ───────────────────────────
  // Payload expects site-specific FK columns instead of generic media_id / tags_id
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS jr_media_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_media_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_media_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS jr_tags_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_tags_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_tags_id INTEGER
  `)
  // Drop old generic columns (media_id and tags_id)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS media_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS tags_id
  `)

  // ─── Step 7: Drop old shared tables ─────────────────────────────────────────
  await db.execute(sql`DROP TABLE IF EXISTS media CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS tags CASCADE`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // ─── Step 1: Recreate media and tags tables with original schemas ─────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS media (
      id SERIAL PRIMARY KEY,
      alt VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      url VARCHAR(255),
      thumbnail_u_r_l VARCHAR(255),
      filename VARCHAR(255),
      mime_type VARCHAR(255),
      filesize NUMERIC,
      width NUMERIC,
      height NUMERIC,
      focal_x NUMERIC,
      focal_y NUMERIC
    )
  `)

  await db.execute(sql`DROP TYPE IF EXISTS enum_tags_site_restore CASCADE`)
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tags_site') THEN
        CREATE TYPE "public"."enum_tags_site" AS ENUM('jake-reddy', 'nerdintheforest', 'reddyontheroad');
      END IF;
    END$$
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      site "enum_tags_site" NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 2: Restore media rows from site-specific tables ────────────────────
  await db.execute(sql`
    INSERT INTO media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
    SELECT id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y
    FROM jr_media
    ON CONFLICT (id) DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
    SELECT id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y
    FROM nitf_media
    ON CONFLICT (id) DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y)
    SELECT id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y
    FROM rotr_media
    ON CONFLICT (id) DO NOTHING
  `)

  // Reset media id sequence
  await db.execute(sql`
    SELECT setval('media_id_seq', COALESCE((SELECT MAX(id) FROM media), 0) + 1, false)
  `)

  // ─── Step 3: Restore tags rows from site-specific tables ─────────────────────
  await db.execute(sql`
    INSERT INTO tags (id, name, slug, site, updated_at, created_at)
    SELECT id, name, slug, 'jake-reddy', updated_at, created_at
    FROM jr_tags
    ON CONFLICT (id) DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO tags (id, name, slug, site, updated_at, created_at)
    SELECT id, name, slug, 'nerdintheforest', updated_at, created_at
    FROM nitf_tags
    ON CONFLICT (id) DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO tags (id, name, slug, site, updated_at, created_at)
    SELECT id, name, slug, 'reddyontheroad', updated_at, created_at
    FROM rotr_tags
    ON CONFLICT (id) DO NOTHING
  `)

  // Reset tags id sequence
  await db.execute(sql`
    SELECT setval('tags_id_seq', COALESCE((SELECT MAX(id) FROM tags), 0) + 1, false)
  `)

  // ─── Step 4: Restore tags_id columns in _rels tables ─────────────────────────
  // Conditional UPDATE: only copy from site-specific column if it exists (idempotent for test cycles)

  // jr_posts_rels: add tags_id back, populate from jr_tags_id (if exists), drop jr_tags_id
  await db.execute(sql`ALTER TABLE jr_posts_rels ADD COLUMN IF NOT EXISTS tags_id INTEGER`)
  await db.execute(sql.raw(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jr_posts_rels' AND column_name='jr_tags_id' AND table_schema='public') THEN
        UPDATE jr_posts_rels SET tags_id = jr_tags_id WHERE jr_tags_id IS NOT NULL;
      END IF;
    END $$
  `))
  await db.execute(sql`ALTER TABLE jr_posts_rels DROP COLUMN IF EXISTS jr_tags_id`)

  // nitf_posts_rels: add tags_id back, populate from nitf_tags_id (if exists), drop nitf_tags_id
  await db.execute(sql`ALTER TABLE nitf_posts_rels ADD COLUMN IF NOT EXISTS tags_id INTEGER`)
  await db.execute(sql.raw(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nitf_posts_rels' AND column_name='nitf_tags_id' AND table_schema='public') THEN
        UPDATE nitf_posts_rels SET tags_id = nitf_tags_id WHERE nitf_tags_id IS NOT NULL;
      END IF;
    END $$
  `))
  await db.execute(sql`ALTER TABLE nitf_posts_rels DROP COLUMN IF EXISTS nitf_tags_id`)

  // rotr_posts_rels: add tags_id back, populate from rotr_tags_id (if exists), drop rotr_tags_id
  await db.execute(sql`ALTER TABLE rotr_posts_rels ADD COLUMN IF NOT EXISTS tags_id INTEGER`)
  await db.execute(sql.raw(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rotr_posts_rels' AND column_name='rotr_tags_id' AND table_schema='public') THEN
        UPDATE rotr_posts_rels SET tags_id = rotr_tags_id WHERE rotr_tags_id IS NOT NULL;
      END IF;
    END $$
  `))
  await db.execute(sql`ALTER TABLE rotr_posts_rels DROP COLUMN IF EXISTS rotr_tags_id`)

  // ─── Step 5: Restore payload_locked_documents_rels columns ──────────────────
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS media_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS tags_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS jr_media_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_media_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_media_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS jr_tags_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_tags_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_tags_id
  `)

  // ─── Step 6: Drop the 6 site-specific tables and authors_rels ───────────────
  await db.execute(sql`DROP TABLE IF EXISTS authors_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_media CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_media CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_media CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_tags CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_tags CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_tags CASCADE`)
}

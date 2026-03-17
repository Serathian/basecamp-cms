import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ─── Step 1: Drop old tables (CASCADE removes dependent _rels, trigger bindings, FK constraints) ───
  await db.execute(sql`DROP TABLE IF EXISTS nitf_locations CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_waypoints CASCADE`)

  // ─── Step 2: Drop old standalone trigger functions (NOT dropped by CASCADE on the table) ──────────
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_nitf_locations_geom_fn();`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_nitf_waypoints_geom_fn();`))

  // ─── Step 3: Drop legacy columns from nitf_posts (fields removed from NitfPosts.ts) ──────────────
  await db.execute(sql`ALTER TABLE nitf_posts DROP COLUMN IF EXISTS review_meta`)
  await db.execute(sql`ALTER TABLE nitf_posts DROP COLUMN IF EXISTS recipe_meta`)
  await db.execute(sql`ALTER TABLE nitf_posts DROP COLUMN IF EXISTS seo_title`)
  await db.execute(sql`ALTER TABLE nitf_posts DROP COLUMN IF EXISTS seo_description`)
  await db.execute(sql`ALTER TABLE nitf_posts DROP COLUMN IF EXISTS reading_time_minutes`)

  // ─── Step 3b: Update enum_nitf_posts_type to match trimmed type options (review/recipe/article) ──
  // PostgreSQL cannot remove enum values directly — recreate the enum with only the 3 valid options.
  await db.execute(sql.raw(`DROP TYPE IF EXISTS enum_nitf_posts_type_new`))
  await db.execute(sql.raw(`CREATE TYPE enum_nitf_posts_type_new AS ENUM ('review', 'recipe', 'article')`))
  await db.execute(sql.raw(`ALTER TABLE nitf_posts ALTER COLUMN type TYPE enum_nitf_posts_type_new USING CASE type::text WHEN 'review' THEN 'review'::enum_nitf_posts_type_new WHEN 'recipe' THEN 'recipe'::enum_nitf_posts_type_new ELSE 'article'::enum_nitf_posts_type_new END`))
  await db.execute(sql.raw(`DROP TYPE IF EXISTS enum_nitf_posts_type`))
  await db.execute(sql.raw(`ALTER TYPE enum_nitf_posts_type_new RENAME TO enum_nitf_posts_type`))

  // ─── Step 4: Update nitf_posts_rels for changed relationships ────────────────────────────────────
  // Drop nitf_locations_id (locations field now points to nitf_poi via nitf_posts_rels)
  await db.execute(sql`ALTER TABLE nitf_posts_rels DROP COLUMN IF EXISTS nitf_locations_id`)
  // Drop nitf_trails_id (trail field removed from NitfPosts.ts)
  await db.execute(sql`ALTER TABLE nitf_posts_rels DROP COLUMN IF EXISTS nitf_trails_id`)
  // Add nitf_poi_id for locations field (now relationTo: nitf_poi)
  await db.execute(sql`ALTER TABLE nitf_posts_rels ADD COLUMN IF NOT EXISTS nitf_poi_id INTEGER`)

  // ─── Step 5: Create nitf_poi_types table (no relationship fields, no _rels table needed) ─────────
  await db.execute(sql`
    CREATE TABLE nitf_poi_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 6: Create nitf_destinations table ──────────────────────────────────────────────────────
  // Single relationship (featured_image upload) stored as direct FK column.
  // links array field stored in nitf_destinations_links table.
  await db.execute(sql`
    CREATE TABLE nitf_destinations (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      latitude NUMERIC,
      longitude NUMERIC,
      featured_image_id INTEGER,
      difficulty VARCHAR(255),
      season_info TEXT,
      published_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 7: Create nitf_poi table ───────────────────────────────────────────────────────────────
  // Single relationships (type, place) stored as direct FK columns.
  // hasMany trips relationship lives in nitf_poi_rels.
  await db.execute(sql`
    CREATE TABLE nitf_poi (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      latitude NUMERIC,
      longitude NUMERIC,
      type_id INTEGER,
      place_id INTEGER,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 8: Create nitf_trips table ─────────────────────────────────────────────────────────────
  // Single relationships (destination, cover_image) stored as direct FK columns.
  // hasMany relationships (pois, tags) live in nitf_trips_rels.
  // date_range group field flattens to date_range__start_date / date_range__end_date (Payload v3 convention)
  await db.execute(sql`
    CREATE TABLE nitf_trips (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      body TEXT,
      destination_id INTEGER,
      cover_image_id INTEGER,
      date_range_start_date TIMESTAMP WITH TIME ZONE,
      date_range_end_date TIMESTAMP WITH TIME ZONE,
      published_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 9: Create nitf_places table ────────────────────────────────────────────────────────────
  // Single relationships (cover_image, poi) stored as direct FK columns.
  // hasMany relationships (tags) live in nitf_places_rels.
  await db.execute(sql`
    CREATE TABLE nitf_places (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      body TEXT,
      cover_image_id INTEGER,
      poi_id INTEGER,
      published_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 9b: Create nitf_destinations_links table (Payload array field storage) ───────────────
  // The links array field on NitfDestinations is stored as a separate child table.
  // Payload v3 array child tables use _order and _parent_id (underscore-prefixed) columns.
  await db.execute(sql`
    CREATE TABLE nitf_destinations_links (
      id SERIAL PRIMARY KEY,
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL REFERENCES nitf_destinations(id) ON DELETE CASCADE,
      url TEXT,
      label VARCHAR(255)
    )
  `)

  // ─── Step 10: Add PostGIS geom columns (outside Drizzle schema, raw SQL) ─────────────────────────
  await db.execute(sql`SELECT AddGeometryColumn('public', 'nitf_destinations', 'geom', 4326, 'POINT', 2)`)
  await db.execute(sql`SELECT AddGeometryColumn('public', 'nitf_poi', 'geom', 4326, 'POINT', 2)`)

  // ─── Step 11: Create BEFORE trigger for nitf_destinations (sql.raw() required for $$ blocks) ─────
  await db.execute(sql.raw(`
    CREATE OR REPLACE FUNCTION trg_nitf_destinations_geom_fn()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
      ELSE
        NEW.geom := NULL;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `))

  await db.execute(sql.raw(`
    DROP TRIGGER IF EXISTS trg_nitf_destinations_geom ON nitf_destinations;
    CREATE TRIGGER trg_nitf_destinations_geom
      BEFORE INSERT OR UPDATE ON nitf_destinations
      FOR EACH ROW
      EXECUTE FUNCTION trg_nitf_destinations_geom_fn();
  `))

  // ─── Step 12: Create BEFORE trigger for nitf_poi (sql.raw() required for $$ blocks) ───────────────
  await db.execute(sql.raw(`
    CREATE OR REPLACE FUNCTION trg_nitf_poi_geom_fn()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
      ELSE
        NEW.geom := NULL;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `))

  await db.execute(sql.raw(`
    DROP TRIGGER IF EXISTS trg_nitf_poi_geom ON nitf_poi;
    CREATE TRIGGER trg_nitf_poi_geom
      BEFORE INSERT OR UPDATE ON nitf_poi
      FOR EACH ROW
      EXECUTE FUNCTION trg_nitf_poi_geom_fn();
  `))

  // ─── Step 13: Create _rels join tables ───────────────────────────────────────────────────────────
  // Payload requires a _rels table for every collection that has relationship fields.

  // nitf_trips_rels: destination (nitf_destinations), pois (nitf_poi), cover_image (nitf_media), tags (nitf_tags)
  await db.execute(sql`
    CREATE TABLE nitf_trips_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES nitf_trips(id) ON DELETE CASCADE,
      path VARCHAR(255) NOT NULL,
      nitf_destinations_id INTEGER REFERENCES nitf_destinations(id) ON DELETE SET NULL,
      nitf_poi_id INTEGER REFERENCES nitf_poi(id) ON DELETE SET NULL,
      nitf_media_id INTEGER REFERENCES nitf_media(id) ON DELETE SET NULL,
      nitf_tags_id INTEGER REFERENCES nitf_tags(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // nitf_destinations_rels: featured_image (nitf_media)
  await db.execute(sql`
    CREATE TABLE nitf_destinations_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES nitf_destinations(id) ON DELETE CASCADE,
      path VARCHAR(255) NOT NULL,
      nitf_media_id INTEGER REFERENCES nitf_media(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // nitf_poi_rels: type (nitf_poi_types), trips (nitf_trips), place (nitf_places)
  await db.execute(sql`
    CREATE TABLE nitf_poi_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES nitf_poi(id) ON DELETE CASCADE,
      path VARCHAR(255) NOT NULL,
      nitf_poi_types_id INTEGER REFERENCES nitf_poi_types(id) ON DELETE SET NULL,
      nitf_trips_id INTEGER REFERENCES nitf_trips(id) ON DELETE SET NULL,
      nitf_places_id INTEGER REFERENCES nitf_places(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // nitf_places_rels: cover_image (nitf_media), tags (nitf_tags), poi (nitf_poi)
  await db.execute(sql`
    CREATE TABLE nitf_places_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES nitf_places(id) ON DELETE CASCADE,
      path VARCHAR(255) NOT NULL,
      nitf_media_id INTEGER REFERENCES nitf_media(id) ON DELETE SET NULL,
      nitf_tags_id INTEGER REFERENCES nitf_tags(id) ON DELETE SET NULL,
      nitf_poi_id INTEGER REFERENCES nitf_poi(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 14: Update payload_locked_documents_rels ───────────────────────────────────────────────
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_trips_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_destinations_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_poi_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_poi_types_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_places_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_locations_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_waypoints_id`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // ─── Step 1: Drop trigger bindings and functions for nitf_destinations and nitf_poi ─────────────
  await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_nitf_destinations_geom ON nitf_destinations;`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_nitf_destinations_geom_fn();`))
  await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_nitf_poi_geom ON nitf_poi;`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_nitf_poi_geom_fn();`))

  // ─── Step 2: Drop _rels and array child tables ───────────────────────────────────────────────────
  await db.execute(sql`DROP TABLE IF EXISTS nitf_places_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_poi_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_destinations_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_destinations_links CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_trips_rels CASCADE`)

  // ─── Step 3: Drop main tables ────────────────────────────────────────────────────────────────────
  await db.execute(sql`DROP TABLE IF EXISTS nitf_places CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_poi CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_trips CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_destinations CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS nitf_poi_types CASCADE`)

  // ─── Step 4: Restore nitf_posts columns ──────────────────────────────────────────────────────────
  await db.execute(sql`ALTER TABLE nitf_posts ADD COLUMN IF NOT EXISTS review_meta JSONB`)
  await db.execute(sql`ALTER TABLE nitf_posts ADD COLUMN IF NOT EXISTS recipe_meta JSONB`)
  await db.execute(sql`ALTER TABLE nitf_posts ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255)`)
  await db.execute(sql`ALTER TABLE nitf_posts ADD COLUMN IF NOT EXISTS seo_description TEXT`)
  await db.execute(sql`ALTER TABLE nitf_posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER`)

  // ─── Step 4b: Restore enum_nitf_posts_type to original 5 options ──────────────────────────────
  await db.execute(sql.raw(`DROP TYPE IF EXISTS enum_nitf_posts_type_old`))
  await db.execute(sql.raw(`CREATE TYPE enum_nitf_posts_type_old AS ENUM ('adventure', 'tips', 'recipe', 'review', 'general')`))
  await db.execute(sql.raw(`ALTER TABLE nitf_posts ALTER COLUMN type TYPE enum_nitf_posts_type_old USING CASE type::text WHEN 'review' THEN 'review'::enum_nitf_posts_type_old WHEN 'recipe' THEN 'recipe'::enum_nitf_posts_type_old ELSE 'general'::enum_nitf_posts_type_old END`))
  await db.execute(sql.raw(`DROP TYPE IF EXISTS enum_nitf_posts_type`))
  await db.execute(sql.raw(`ALTER TYPE enum_nitf_posts_type_old RENAME TO enum_nitf_posts_type`))

  // ─── Step 5: Restore nitf_posts_rels columns ─────────────────────────────────────────────────────
  await db.execute(sql`ALTER TABLE nitf_posts_rels ADD COLUMN IF NOT EXISTS nitf_locations_id INTEGER`)
  await db.execute(sql`ALTER TABLE nitf_posts_rels ADD COLUMN IF NOT EXISTS nitf_trails_id INTEGER`)

  // ─── Step 6: Update payload_locked_documents_rels ────────────────────────────────────────────────
  // Note: down() does NOT recreate nitf_locations or nitf_waypoints tables — clean-slate migration, no data to preserve.
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_trips_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_destinations_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_poi_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_poi_types_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_places_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_locations_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_waypoints_id INTEGER`)
}

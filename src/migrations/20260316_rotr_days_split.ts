import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ─── Step 1: Drop old tables (CASCADE removes dependent _rels tables, trigger bindings, FK constraints) ───
  await db.execute(sql`DROP TABLE IF EXISTS rotr_posts CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_locations CASCADE`)

  // ─── Step 2: Drop old standalone trigger functions (NOT dropped by CASCADE on the table) ──────────────────
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_rotr_posts_geom_fn();`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_rotr_locations_geom_fn();`))

  // ─── Step 3: Create rotr_place_types table ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE rotr_place_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 4: Create rotr_days table ─────────────────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE rotr_days (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      title VARCHAR(255) NOT NULL,
      date TIMESTAMP WITH TIME ZONE,
      latitude NUMERIC,
      longitude NUMERIC,
      location_name VARCHAR(255),
      location_type_id INTEGER REFERENCES rotr_place_types(id),
      weather VARCHAR(255),
      temperature NUMERIC,
      summary TEXT,
      content TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // ─── Step 5: Add PostGIS geom column (outside Drizzle schema, raw SQL only) ─────────────────────────────
  await db.execute(sql`
    SELECT AddGeometryColumn('public', 'rotr_days', 'geom', 4326, 'POINT', 2)
  `)

  // ─── Step 6: Create BEFORE INSERT OR UPDATE trigger (must use sql.raw() for $$ PL/pgSQL blocks) ─────────
  await db.execute(sql.raw(`
    CREATE OR REPLACE FUNCTION trg_rotr_days_geom_fn()
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
    DROP TRIGGER IF EXISTS trg_rotr_days_geom ON rotr_days;
    CREATE TRIGGER trg_rotr_days_geom
      BEFORE INSERT OR UPDATE ON rotr_days
      FOR EACH ROW
      EXECUTE FUNCTION trg_rotr_days_geom_fn();
  `))

  // ─── Step 7: Update payload_locked_documents_rels ────────────────────────────────────────────────────────
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_days_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_place_types_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_posts_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_locations_id`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // ─── Step 1: Drop trigger binding and function for rotr_days ─────────────────────────────────────────────
  await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_rotr_days_geom ON rotr_days;`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_rotr_days_geom_fn();`))

  // ─── Step 2: Drop new tables (CASCADE handles their dependent _rels entries) ─────────────────────────────
  await db.execute(sql`DROP TABLE IF EXISTS rotr_days CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_place_types CASCADE`)

  // ─── Step 3: Restore payload_locked_documents_rels ───────────────────────────────────────────────────────
  // Note: down() does NOT recreate rotr_posts or rotr_locations tables — clean-slate migration, no data to preserve.
  // Restoring the payload_locked_documents_rels columns is sufficient for Payload to function if down() is run in a test cycle.
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_days_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_place_types_id`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_posts_id INTEGER`)
  await db.execute(sql`ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_locations_id INTEGER`)
}

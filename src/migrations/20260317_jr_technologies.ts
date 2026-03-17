import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Step 1: Create jr_technologies table
  // icon_id is a direct FK column for the single upload field (not a _rels table)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jr_technologies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      icon_id INTEGER,
      category VARCHAR(255),
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // Step 2: Drop old tech_stack JSON column from jr_posts
  // Must be dropped before relationship takes effect — column name collision otherwise
  await db.execute(sql`ALTER TABLE jr_posts DROP COLUMN IF EXISTS tech_stack`)

  // Step 3: Add jr_technologies_id to jr_posts_rels for the hasMany tech_stack relationship
  await db.execute(sql`
    ALTER TABLE jr_posts_rels ADD COLUMN IF NOT EXISTS jr_technologies_id INTEGER
  `)

  // Step 4: Update payload_locked_documents_rels (required for all new collections)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS jr_technologies_id INTEGER
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reverse order of up()

  // Step 1: Remove payload_locked_documents_rels column
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS jr_technologies_id
  `)

  // Step 2: Remove jr_technologies_id from jr_posts_rels
  await db.execute(sql`
    ALTER TABLE jr_posts_rels DROP COLUMN IF EXISTS jr_technologies_id
  `)

  // Step 3: Restore tech_stack JSON column (clean-slate — no data to preserve)
  await db.execute(sql`ALTER TABLE jr_posts ADD COLUMN IF NOT EXISTS tech_stack JSONB`)

  // Step 4: Drop jr_technologies table
  await db.execute(sql`DROP TABLE IF EXISTS jr_technologies CASCADE`)
}

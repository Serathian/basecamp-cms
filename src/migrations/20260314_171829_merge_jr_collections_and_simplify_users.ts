import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // CLEAN SLATE: Drop existing tables
  // Drop jr_projects (merging into jr_posts)
  await db.execute(sql`DROP TABLE IF EXISTS jr_projects_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_projects CASCADE`)

  // Drop jr_posts (will recreate with merged schema)
  await db.execute(sql`DROP TABLE IF EXISTS jr_posts_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_posts CASCADE`)

  // Simplify users role enum to admin-only
  // Delete non-admin users first (clean slate per user decision)
  // Users without admin role in users_roles join table must be deleted
  await db.execute(sql`
    DELETE FROM users 
    WHERE id NOT IN (
      SELECT parent_id FROM users_roles WHERE value = 'admin'
    )
  `)

  // Drop users_roles join table (switching from hasMany to select with single admin role)
  await db.execute(sql`DROP TABLE IF EXISTS users_roles CASCADE`)

  // Update enum to admin-only
  await db.execute(sql`DROP TYPE IF EXISTS enum_users_roles CASCADE`)
  await db.execute(sql`CREATE TYPE enum_users_roles AS ENUM('admin')`)

  // Recreate jr_posts table with merged schema
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jr_posts (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      body TEXT NOT NULL,
      excerpt TEXT,
      published_at TIMESTAMP WITH TIME ZONE,
      cover_image_id INTEGER,
      project_type VARCHAR(255),
      project_status VARCHAR(255),
      tech_stack JSONB,
      github_url TEXT,
      live_url TEXT,
      featured BOOLEAN DEFAULT false,
      sort INTEGER,
      author_id INTEGER,
      reading_time_minutes INTEGER,
      seo_title TEXT,
      seo_description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `)

  // Create enums for jr_posts status and project fields
  await db.execute(sql`DROP TYPE IF EXISTS enum_jr_posts_status CASCADE`)
  await db.execute(sql`CREATE TYPE enum_jr_posts_status AS ENUM('draft', 'published', 'archived')`)

  await db.execute(sql`DROP TYPE IF EXISTS enum_jr_posts_project_type CASCADE`)
  await db.execute(
    sql`CREATE TYPE enum_jr_posts_project_type AS ENUM('open-source', 'personal', 'home-lab', 'professional')`,
  )

  await db.execute(sql`DROP TYPE IF EXISTS enum_jr_posts_project_status CASCADE`)
  await db.execute(
    sql`CREATE TYPE enum_jr_posts_project_status AS ENUM('active', 'in-progress', 'completed', 'archived')`,
  )

  // Alter jr_posts to use enums (drop defaults first to avoid cast errors)
  await db.execute(sql`ALTER TABLE jr_posts ALTER COLUMN status DROP DEFAULT`)
  await db.execute(
    sql`ALTER TABLE jr_posts ALTER COLUMN status TYPE enum_jr_posts_status USING status::enum_jr_posts_status`,
  )
  await db.execute(sql`ALTER TABLE jr_posts ALTER COLUMN status SET DEFAULT 'draft'`)

  await db.execute(
    sql`ALTER TABLE jr_posts ALTER COLUMN project_type TYPE enum_jr_posts_project_type USING project_type::text::enum_jr_posts_project_type`,
  )
  await db.execute(
    sql`ALTER TABLE jr_posts ALTER COLUMN project_status TYPE enum_jr_posts_project_status USING project_status::text::enum_jr_posts_project_status`,
  )

  // Create jr_posts_rels table for relationships (tags, etc.)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jr_posts_rels (
      id SERIAL PRIMARY KEY,
      order INTEGER,
      parent_id INTEGER NOT NULL REFERENCES jr_posts(id) ON DELETE CASCADE,
      path VARCHAR(255) NOT NULL,
      tags_id INTEGER,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `)

  // Create indexes
  await db.execute(sql`CREATE INDEX IF NOT EXISTS jr_posts_slug_idx ON jr_posts(slug);`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS jr_posts_status_idx ON jr_posts(status);`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS jr_posts_rels_parent_idx ON jr_posts_rels(parent_id);`,
  )
  await db.execute(sql`CREATE INDEX IF NOT EXISTS jr_posts_rels_path_idx ON jr_posts_rels(path);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  throw new Error('Cannot rollback clean slate migration - would lose data')
}

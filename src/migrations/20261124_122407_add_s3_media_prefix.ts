import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "jr_media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'jr_media';
    ALTER TABLE "nitf_media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'nitf_media';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "jr_media" DROP COLUMN IF EXISTS "prefix";
    ALTER TABLE "nitf_media" DROP COLUMN IF EXISTS "prefix";
  `)
}

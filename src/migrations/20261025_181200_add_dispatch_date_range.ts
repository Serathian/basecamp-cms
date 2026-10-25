import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "start_date" timestamp(3) with time zone;
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "end_date" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "start_date";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "end_date";
  `)
}

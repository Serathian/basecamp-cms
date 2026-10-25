import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "nitf_locations" ADD COLUMN IF NOT EXISTS "shelter_capacity" numeric;
    ALTER TABLE "nitf_locations" ADD COLUMN IF NOT EXISTS "tent_spaces" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "nitf_locations" DROP COLUMN IF EXISTS "shelter_capacity";
    ALTER TABLE "nitf_locations" DROP COLUMN IF EXISTS "tent_spaces";
  `)
}

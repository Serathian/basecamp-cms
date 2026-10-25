import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_nitf_locations_amenities" ADD VALUE IF NOT EXISTS 'parking';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres enum values cannot be dropped directly without recreating the enum; no-op on down
}

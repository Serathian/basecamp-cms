import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "gpx_file_id" integer;
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "trail_geometry" jsonb;
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "distance_km" numeric;
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "elevation_gain_m" numeric;
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "elevation_loss_m" numeric;
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "duration_hours" numeric;

    DO $$ BEGIN
      ALTER TABLE "nitf_dispatches"
        ADD CONSTRAINT "nitf_dispatches_gpx_file_id_nitf_media_id_fk"
        FOREIGN KEY ("gpx_file_id") REFERENCES "public"."nitf_media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "nitf_dispatches_gpx_file_idx" ON "nitf_dispatches" USING btree ("gpx_file_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "nitf_dispatches_gpx_file_idx";
    ALTER TABLE "nitf_dispatches" DROP CONSTRAINT IF EXISTS "nitf_dispatches_gpx_file_id_nitf_media_id_fk";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "gpx_file_id";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "trail_geometry";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "distance_km";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "elevation_gain_m";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "elevation_loss_m";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "duration_hours";
  `)
}

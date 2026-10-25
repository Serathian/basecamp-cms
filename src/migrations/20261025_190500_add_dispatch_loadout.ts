import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "nitf_dispatches" ADD COLUMN IF NOT EXISTS "loadout_id" integer;
    DO $$ BEGIN
      ALTER TABLE "nitf_dispatches"
        ADD CONSTRAINT "nitf_dispatches_loadout_id_nitf_loadouts_id_fk"
        FOREIGN KEY ("loadout_id") REFERENCES "public"."nitf_loadouts"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    CREATE INDEX IF NOT EXISTS "nitf_dispatches_loadout_idx" ON "nitf_dispatches" USING btree ("loadout_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "nitf_dispatches_loadout_idx";
    ALTER TABLE "nitf_dispatches" DROP CONSTRAINT IF EXISTS "nitf_dispatches_loadout_id_nitf_loadouts_id_fk";
    ALTER TABLE "nitf_dispatches" DROP COLUMN IF EXISTS "loadout_id";
  `)
}

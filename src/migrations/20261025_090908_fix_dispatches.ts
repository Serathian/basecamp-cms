import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "nitf_dispatches_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"location_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "nitf_dispatches_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"nitf_locations_id" integer
  );
  
  ALTER TABLE "nitf_dispatches" DROP CONSTRAINT "nitf_dispatches_location_id_nitf_locations_id_fk";
  
  DROP INDEX "nitf_dispatches_location_idx";
  ALTER TABLE "nitf_dispatches_gallery" ADD CONSTRAINT "nitf_dispatches_gallery_image_id_nitf_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_dispatches_gallery" ADD CONSTRAINT "nitf_dispatches_gallery_location_id_nitf_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."nitf_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_dispatches_gallery" ADD CONSTRAINT "nitf_dispatches_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nitf_dispatches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_dispatches_rels" ADD CONSTRAINT "nitf_dispatches_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_dispatches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_dispatches_rels" ADD CONSTRAINT "nitf_dispatches_rels_nitf_locations_fk" FOREIGN KEY ("nitf_locations_id") REFERENCES "public"."nitf_locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "nitf_dispatches_gallery_order_idx" ON "nitf_dispatches_gallery" USING btree ("_order");
  CREATE INDEX "nitf_dispatches_gallery_parent_id_idx" ON "nitf_dispatches_gallery" USING btree ("_parent_id");
  CREATE INDEX "nitf_dispatches_gallery_image_idx" ON "nitf_dispatches_gallery" USING btree ("image_id");
  CREATE INDEX "nitf_dispatches_gallery_location_idx" ON "nitf_dispatches_gallery" USING btree ("location_id");
  CREATE INDEX "nitf_dispatches_rels_order_idx" ON "nitf_dispatches_rels" USING btree ("order");
  CREATE INDEX "nitf_dispatches_rels_parent_idx" ON "nitf_dispatches_rels" USING btree ("parent_id");
  CREATE INDEX "nitf_dispatches_rels_path_idx" ON "nitf_dispatches_rels" USING btree ("path");
  CREATE INDEX "nitf_dispatches_rels_nitf_locations_id_idx" ON "nitf_dispatches_rels" USING btree ("nitf_locations_id");
  ALTER TABLE "nitf_dispatches" DROP COLUMN "location_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "nitf_dispatches_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_dispatches_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "nitf_dispatches_gallery" CASCADE;
  DROP TABLE "nitf_dispatches_rels" CASCADE;
  ALTER TABLE "nitf_dispatches" ADD COLUMN "location_id" integer;
  ALTER TABLE "nitf_dispatches" ADD CONSTRAINT "nitf_dispatches_location_id_nitf_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."nitf_locations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "nitf_dispatches_location_idx" ON "nitf_dispatches" USING btree ("location_id");`)
}

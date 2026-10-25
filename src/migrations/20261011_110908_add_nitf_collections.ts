import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_nitf_locations_amenities" AS ENUM('timber_shelter', 'stone_hearth', 'potable_water', 'dry_wood', 'lake_view', 'lake_water', 'tent_pitch');
  CREATE TYPE "public"."enum_nitf_locations_category" AS ENUM('shelter', 'hearth', 'springhead', 'summit', 'viewpoint', 'trailhead');
  CREATE TYPE "public"."enum_nitf_dispatches_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_nitf_gear_items_category" AS ENUM('shelter_sleep', 'cook_water', 'navigation_tools', 'pack_apparel', 'hygiene_repair');
  CREATE TYPE "public"."enum_nitf_gear_reviews_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_nitf_gear_reviews_topic" AS ENUM('durability', 'thermal', 'maintenance', 'philosophy');
  CREATE TYPE "public"."enum_nitf_loadouts_items_status" AS ENUM('packed', 'essential', 'worn', 'consumable');
  CREATE TYPE "public"."enum_nitf_loadouts_season" AS ENUM('spring', 'summer', 'autumn', 'winter');
  CREATE TABLE "nitf_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "nitf_areas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"country" varchar NOT NULL,
  	"description" varchar,
  	"center_latitude" numeric NOT NULL,
  	"center_longitude" numeric NOT NULL,
  	"default_zoom" numeric DEFAULT 10,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_locations_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_nitf_locations_amenities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "nitf_locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"area_id" integer NOT NULL,
  	"category" "enum_nitf_locations_category" NOT NULL,
  	"latitude" numeric NOT NULL,
  	"longitude" numeric NOT NULL,
  	"elevation" numeric,
  	"summary" varchar,
  	"trailhead_id" integer,
  	"elevation_gain" numeric,
  	"elevation_loss" numeric,
  	"cover_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_dispatches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_dispatches_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"location_id" integer,
  	"excerpt" varchar NOT NULL,
  	"weather" varchar,
  	"hero_image_id" integer,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_gear_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"brand" varchar NOT NULL,
  	"category" "enum_nitf_gear_items_category" NOT NULL,
  	"weight_grams" numeric NOT NULL,
  	"spec_note" varchar,
  	"notes" varchar,
  	"image_id" integer,
  	"product_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_gear_reviews_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"takeaway" varchar NOT NULL
  );
  
  CREATE TABLE "nitf_gear_reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_gear_reviews_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"gear_item_id" integer NOT NULL,
  	"topic" "enum_nitf_gear_reviews_topic" NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"duration_tested" varchar,
  	"summary" varchar NOT NULL,
  	"verdict" varchar NOT NULL,
  	"hero_image_id" integer,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_loadouts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_id" integer NOT NULL,
  	"status" "enum_nitf_loadouts_items_status" DEFAULT 'packed' NOT NULL,
  	"custom_note" varchar
  );
  
  CREATE TABLE "nitf_loadouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"season" "enum_nitf_loadouts_season" NOT NULL,
  	"temp_range" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_media_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_areas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_locations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_dispatches_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_gear_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_gear_reviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nitf_loadouts_id" integer;
  ALTER TABLE "nitf_areas" ADD CONSTRAINT "nitf_areas_hero_image_id_nitf_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_locations_amenities" ADD CONSTRAINT "nitf_locations_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_locations" ADD CONSTRAINT "nitf_locations_area_id_nitf_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."nitf_areas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_locations" ADD CONSTRAINT "nitf_locations_trailhead_id_nitf_locations_id_fk" FOREIGN KEY ("trailhead_id") REFERENCES "public"."nitf_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_locations" ADD CONSTRAINT "nitf_locations_cover_image_id_nitf_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_dispatches" ADD CONSTRAINT "nitf_dispatches_location_id_nitf_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."nitf_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_dispatches" ADD CONSTRAINT "nitf_dispatches_hero_image_id_nitf_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_gear_items" ADD CONSTRAINT "nitf_gear_items_image_id_nitf_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_gear_reviews_key_takeaways" ADD CONSTRAINT "nitf_gear_reviews_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nitf_gear_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_gear_reviews" ADD CONSTRAINT "nitf_gear_reviews_gear_item_id_nitf_gear_items_id_fk" FOREIGN KEY ("gear_item_id") REFERENCES "public"."nitf_gear_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_gear_reviews" ADD CONSTRAINT "nitf_gear_reviews_hero_image_id_nitf_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_loadouts_items" ADD CONSTRAINT "nitf_loadouts_items_item_id_nitf_gear_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."nitf_gear_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_loadouts_items" ADD CONSTRAINT "nitf_loadouts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nitf_loadouts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "nitf_media_updated_at_idx" ON "nitf_media" USING btree ("updated_at");
  CREATE INDEX "nitf_media_created_at_idx" ON "nitf_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "nitf_media_filename_idx" ON "nitf_media" USING btree ("filename");
  CREATE UNIQUE INDEX "nitf_areas_slug_idx" ON "nitf_areas" USING btree ("slug");
  CREATE INDEX "nitf_areas_hero_image_idx" ON "nitf_areas" USING btree ("hero_image_id");
  CREATE INDEX "nitf_areas_updated_at_idx" ON "nitf_areas" USING btree ("updated_at");
  CREATE INDEX "nitf_areas_created_at_idx" ON "nitf_areas" USING btree ("created_at");
  CREATE INDEX "nitf_locations_amenities_order_idx" ON "nitf_locations_amenities" USING btree ("order");
  CREATE INDEX "nitf_locations_amenities_parent_idx" ON "nitf_locations_amenities" USING btree ("parent_id");
  CREATE UNIQUE INDEX "nitf_locations_slug_idx" ON "nitf_locations" USING btree ("slug");
  CREATE INDEX "nitf_locations_area_idx" ON "nitf_locations" USING btree ("area_id");
  CREATE INDEX "nitf_locations_trailhead_idx" ON "nitf_locations" USING btree ("trailhead_id");
  CREATE INDEX "nitf_locations_cover_image_idx" ON "nitf_locations" USING btree ("cover_image_id");
  CREATE INDEX "nitf_locations_updated_at_idx" ON "nitf_locations" USING btree ("updated_at");
  CREATE INDEX "nitf_locations_created_at_idx" ON "nitf_locations" USING btree ("created_at");
  CREATE UNIQUE INDEX "nitf_dispatches_slug_idx" ON "nitf_dispatches" USING btree ("slug");
  CREATE INDEX "nitf_dispatches_location_idx" ON "nitf_dispatches" USING btree ("location_id");
  CREATE INDEX "nitf_dispatches_hero_image_idx" ON "nitf_dispatches" USING btree ("hero_image_id");
  CREATE INDEX "nitf_dispatches_updated_at_idx" ON "nitf_dispatches" USING btree ("updated_at");
  CREATE INDEX "nitf_dispatches_created_at_idx" ON "nitf_dispatches" USING btree ("created_at");
  CREATE INDEX "nitf_gear_items_image_idx" ON "nitf_gear_items" USING btree ("image_id");
  CREATE INDEX "nitf_gear_items_updated_at_idx" ON "nitf_gear_items" USING btree ("updated_at");
  CREATE INDEX "nitf_gear_items_created_at_idx" ON "nitf_gear_items" USING btree ("created_at");
  CREATE INDEX "nitf_gear_reviews_key_takeaways_order_idx" ON "nitf_gear_reviews_key_takeaways" USING btree ("_order");
  CREATE INDEX "nitf_gear_reviews_key_takeaways_parent_id_idx" ON "nitf_gear_reviews_key_takeaways" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nitf_gear_reviews_slug_idx" ON "nitf_gear_reviews" USING btree ("slug");
  CREATE INDEX "nitf_gear_reviews_gear_item_idx" ON "nitf_gear_reviews" USING btree ("gear_item_id");
  CREATE INDEX "nitf_gear_reviews_hero_image_idx" ON "nitf_gear_reviews" USING btree ("hero_image_id");
  CREATE INDEX "nitf_gear_reviews_updated_at_idx" ON "nitf_gear_reviews" USING btree ("updated_at");
  CREATE INDEX "nitf_gear_reviews_created_at_idx" ON "nitf_gear_reviews" USING btree ("created_at");
  CREATE INDEX "nitf_loadouts_items_order_idx" ON "nitf_loadouts_items" USING btree ("_order");
  CREATE INDEX "nitf_loadouts_items_parent_id_idx" ON "nitf_loadouts_items" USING btree ("_parent_id");
  CREATE INDEX "nitf_loadouts_items_item_idx" ON "nitf_loadouts_items" USING btree ("item_id");
  CREATE UNIQUE INDEX "nitf_loadouts_slug_idx" ON "nitf_loadouts" USING btree ("slug");
  CREATE INDEX "nitf_loadouts_updated_at_idx" ON "nitf_loadouts" USING btree ("updated_at");
  CREATE INDEX "nitf_loadouts_created_at_idx" ON "nitf_loadouts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_media_fk" FOREIGN KEY ("nitf_media_id") REFERENCES "public"."nitf_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_areas_fk" FOREIGN KEY ("nitf_areas_id") REFERENCES "public"."nitf_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_locations_fk" FOREIGN KEY ("nitf_locations_id") REFERENCES "public"."nitf_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_dispatches_fk" FOREIGN KEY ("nitf_dispatches_id") REFERENCES "public"."nitf_dispatches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_gear_items_fk" FOREIGN KEY ("nitf_gear_items_id") REFERENCES "public"."nitf_gear_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_gear_reviews_fk" FOREIGN KEY ("nitf_gear_reviews_id") REFERENCES "public"."nitf_gear_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_loadouts_fk" FOREIGN KEY ("nitf_loadouts_id") REFERENCES "public"."nitf_loadouts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_nitf_media_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_media_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_areas_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_areas_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_locations_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_dispatches_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_dispatches_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_gear_items_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_gear_items_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_gear_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_gear_reviews_id");
  ALTER TABLE "nitf_locations" ADD COLUMN IF NOT EXISTS "geom" geometry(Point, 4326);
  CREATE INDEX IF NOT EXISTS "nitf_locations_geom_idx" ON "nitf_locations" USING GIST ("geom");

  CREATE OR REPLACE FUNCTION update_nitf_locations_geom()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
      NEW.geom = NULL;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_update_nitf_locations_geom ON nitf_locations;
  CREATE TRIGGER trigger_update_nitf_locations_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON nitf_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_nitf_locations_geom();`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "nitf_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_areas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_locations_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_dispatches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_gear_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_gear_reviews_key_takeaways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_gear_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_loadouts_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nitf_loadouts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "nitf_media" CASCADE;
  DROP TABLE "nitf_areas" CASCADE;
  DROP TABLE "nitf_locations_amenities" CASCADE;
  DROP TABLE "nitf_locations" CASCADE;
  DROP TABLE "nitf_dispatches" CASCADE;
  DROP TABLE "nitf_gear_items" CASCADE;
  DROP TABLE "nitf_gear_reviews_key_takeaways" CASCADE;
  DROP TABLE "nitf_gear_reviews" CASCADE;
  DROP TABLE "nitf_loadouts_items" CASCADE;
  DROP TABLE "nitf_loadouts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_areas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_locations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_dispatches_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_gear_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_gear_reviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_nitf_loadouts_fk";
  
  DROP INDEX "payload_locked_documents_rels_nitf_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_nitf_areas_id_idx";
  DROP INDEX "payload_locked_documents_rels_nitf_locations_id_idx";
  DROP INDEX "payload_locked_documents_rels_nitf_dispatches_id_idx";
  DROP INDEX "payload_locked_documents_rels_nitf_gear_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_nitf_gear_reviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_nitf_loadouts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_areas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_locations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_dispatches_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_gear_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_gear_reviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nitf_loadouts_id";
  DROP TYPE "public"."enum_nitf_locations_amenities";
  DROP TYPE "public"."enum_nitf_locations_category";
  DROP TYPE "public"."enum_nitf_dispatches_status";
  DROP TYPE "public"."enum_nitf_gear_items_category";
  DROP TYPE "public"."enum_nitf_gear_reviews_status";
  DROP TYPE "public"."enum_nitf_gear_reviews_topic";
  DROP TYPE "public"."enum_nitf_loadouts_items_status";
  DROP TYPE "public"."enum_nitf_loadouts_season";
  DROP TRIGGER IF EXISTS trigger_update_nitf_locations_geom ON nitf_locations;
  DROP FUNCTION IF EXISTS update_nitf_locations_geom();
  DROP INDEX IF EXISTS "nitf_locations_geom_idx";
  ALTER TABLE "nitf_locations" DROP COLUMN IF EXISTS "geom";`)
}

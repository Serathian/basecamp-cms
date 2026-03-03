import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_authors_sites" AS ENUM('jake-reddy', 'nerdintheforest', 'reddyontheroad');
  CREATE TYPE "public"."enum_tags_site" AS ENUM('jake-reddy', 'nerdintheforest', 'reddyontheroad');
  CREATE TYPE "public"."enum_jr_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_jr_projects_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_jr_projects_project_type" AS ENUM('open-source', 'personal', 'home-lab', 'professional');
  CREATE TYPE "public"."enum_jr_projects_project_status" AS ENUM('active', 'in-progress', 'completed', 'archived');
  CREATE TYPE "public"."enum_nitf_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_nitf_posts_type" AS ENUM('adventure', 'tips', 'recipe', 'review', 'general');
  CREATE TYPE "public"."enum_nitf_trails_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_nitf_trails_difficulty" AS ENUM('easy', 'moderate', 'hard', 'expert');
  CREATE TYPE "public"."enum_nitf_trails_trail_type" AS ENUM('loop', 'out-and-back', 'point-to-point');
  CREATE TYPE "public"."enum_nitf_waypoints_type" AS ENUM('viewpoint', 'summit', 'water', 'hazard', 'camp', 'junction', 'trailhead', 'other');
  CREATE TYPE "public"."enum_nitf_locations_place_type" AS ENUM('forest', 'lake', 'park', 'viewpoint', 'summit', 'town', 'beach', 'island', 'valley', 'other');
  CREATE TYPE "public"."enum_nitf_locations_marker_type" AS ENUM('camp', 'cabin', 'cabin-paid', 'camp-paid', 'laavu', 'motorhome', 'day-visit', 'trailhead', 'viewpoint', 'other');
  CREATE TYPE "public"."enum_rotr_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_rotr_posts_type" AS ENUM('story', 'guide', 'tips', 'listicle');
  CREATE TYPE "public"."enum_rotr_locations_place_type" AS ENUM('city', 'town', 'village', 'beach', 'mountain', 'park', 'landmark', 'accommodation', 'restaurant', 'other');
  CREATE TYPE "public"."enum_rotr_locations_marker_type" AS ENUM('hotel', 'hostel', 'airbnb', 'camp', 'parking', 'city-stop', 'viewpoint', 'beach', 'restaurant', 'other');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
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
  
  CREATE TABLE "authors_sites" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_authors_sites",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"bio" varchar,
  	"avatar_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"site" "enum_tags_site" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jr_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_jr_posts_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"excerpt" varchar,
  	"body" varchar,
  	"cover_image_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"reading_time_minutes" numeric,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jr_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "jr_projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_jr_projects_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"summary" varchar,
  	"body" varchar,
  	"cover_image_id" integer,
  	"project_type" "enum_jr_projects_project_type",
  	"project_status" "enum_jr_projects_project_status",
  	"tech_stack" jsonb,
  	"github_url" varchar,
  	"live_url" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"sort" numeric,
  	"author_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jr_projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "nitf_posts_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location_id" integer NOT NULL,
  	"visit_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "nitf_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_posts_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_nitf_posts_type" NOT NULL,
  	"excerpt" varchar,
  	"body" varchar,
  	"cover_image_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"reading_time_minutes" numeric,
  	"latitude" numeric,
  	"longitude" numeric,
  	"trail_id" integer,
  	"review_meta" jsonb,
  	"recipe_meta" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "nitf_trails" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_trails_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"gpx_file_id" integer,
  	"distance_km" numeric,
  	"elevation_gain_m" numeric,
  	"elevation_loss_m" numeric,
  	"duration_hours" numeric,
  	"difficulty" "enum_nitf_trails_difficulty",
  	"trail_type" "enum_nitf_trails_trail_type",
  	"latitude_start" numeric,
  	"longitude_start" numeric,
  	"bounding_box" jsonb,
  	"country" varchar,
  	"region" varchar,
  	"season_start" varchar,
  	"season_end" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_waypoints" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"trail_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"type" "enum_nitf_waypoints_type" NOT NULL,
  	"latitude" numeric NOT NULL,
  	"longitude" numeric NOT NULL,
  	"altitude_m" numeric,
  	"sort" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"place_type" "enum_nitf_locations_place_type" NOT NULL,
  	"marker_type" "enum_nitf_locations_marker_type" NOT NULL,
  	"latitude" numeric NOT NULL,
  	"longitude" numeric NOT NULL,
  	"country" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rotr_posts_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location_id" integer NOT NULL,
  	"visit_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "rotr_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_rotr_posts_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_rotr_posts_type",
  	"excerpt" varchar,
  	"body" varchar,
  	"cover_image_id" integer,
  	"author_id" integer,
  	"latitude" numeric,
  	"longitude" numeric,
  	"published_at" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"wp_post_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rotr_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "rotr_locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"place_type" "enum_rotr_locations_place_type" NOT NULL,
  	"marker_type" "enum_rotr_locations_marker_type" NOT NULL,
  	"latitude" numeric NOT NULL,
  	"longitude" numeric NOT NULL,
  	"country" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"authors_id" integer,
  	"tags_id" integer,
  	"jr_posts_id" integer,
  	"jr_projects_id" integer,
  	"nitf_posts_id" integer,
  	"nitf_trails_id" integer,
  	"nitf_waypoints_id" integer,
  	"nitf_locations_id" integer,
  	"rotr_posts_id" integer,
  	"rotr_locations_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_sites" ADD CONSTRAINT "authors_sites_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_posts" ADD CONSTRAINT "jr_posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_posts" ADD CONSTRAINT "jr_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_posts_rels" ADD CONSTRAINT "jr_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jr_posts_rels" ADD CONSTRAINT "jr_posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jr_projects" ADD CONSTRAINT "jr_projects_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_projects" ADD CONSTRAINT "jr_projects_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_projects_rels" ADD CONSTRAINT "jr_projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jr_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jr_projects_rels" ADD CONSTRAINT "jr_projects_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_posts_locations" ADD CONSTRAINT "nitf_posts_locations_location_id_nitf_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."nitf_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_posts_locations" ADD CONSTRAINT "nitf_posts_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nitf_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_posts" ADD CONSTRAINT "nitf_posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_posts" ADD CONSTRAINT "nitf_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_posts" ADD CONSTRAINT "nitf_posts_trail_id_nitf_trails_id_fk" FOREIGN KEY ("trail_id") REFERENCES "public"."nitf_trails"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_posts_rels" ADD CONSTRAINT "nitf_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_posts_rels" ADD CONSTRAINT "nitf_posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_trails" ADD CONSTRAINT "nitf_trails_gpx_file_id_media_id_fk" FOREIGN KEY ("gpx_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_waypoints" ADD CONSTRAINT "nitf_waypoints_trail_id_nitf_trails_id_fk" FOREIGN KEY ("trail_id") REFERENCES "public"."nitf_trails"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotr_posts_locations" ADD CONSTRAINT "rotr_posts_locations_location_id_rotr_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."rotr_locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotr_posts_locations" ADD CONSTRAINT "rotr_posts_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rotr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotr_posts" ADD CONSTRAINT "rotr_posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotr_posts" ADD CONSTRAINT "rotr_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotr_posts_rels" ADD CONSTRAINT "rotr_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rotr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotr_posts_rels" ADD CONSTRAINT "rotr_posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jr_posts_fk" FOREIGN KEY ("jr_posts_id") REFERENCES "public"."jr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jr_projects_fk" FOREIGN KEY ("jr_projects_id") REFERENCES "public"."jr_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_posts_fk" FOREIGN KEY ("nitf_posts_id") REFERENCES "public"."nitf_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_trails_fk" FOREIGN KEY ("nitf_trails_id") REFERENCES "public"."nitf_trails"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_waypoints_fk" FOREIGN KEY ("nitf_waypoints_id") REFERENCES "public"."nitf_waypoints"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_locations_fk" FOREIGN KEY ("nitf_locations_id") REFERENCES "public"."nitf_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotr_posts_fk" FOREIGN KEY ("rotr_posts_id") REFERENCES "public"."rotr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotr_locations_fk" FOREIGN KEY ("rotr_locations_id") REFERENCES "public"."rotr_locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "authors_sites_order_idx" ON "authors_sites" USING btree ("order");
  CREATE INDEX "authors_sites_parent_idx" ON "authors_sites" USING btree ("parent_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_avatar_idx" ON "authors" USING btree ("avatar_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "jr_posts_slug_idx" ON "jr_posts" USING btree ("slug");
  CREATE INDEX "jr_posts_cover_image_idx" ON "jr_posts" USING btree ("cover_image_id");
  CREATE INDEX "jr_posts_author_idx" ON "jr_posts" USING btree ("author_id");
  CREATE INDEX "jr_posts_updated_at_idx" ON "jr_posts" USING btree ("updated_at");
  CREATE INDEX "jr_posts_created_at_idx" ON "jr_posts" USING btree ("created_at");
  CREATE INDEX "jr_posts_rels_order_idx" ON "jr_posts_rels" USING btree ("order");
  CREATE INDEX "jr_posts_rels_parent_idx" ON "jr_posts_rels" USING btree ("parent_id");
  CREATE INDEX "jr_posts_rels_path_idx" ON "jr_posts_rels" USING btree ("path");
  CREATE INDEX "jr_posts_rels_tags_id_idx" ON "jr_posts_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "jr_projects_slug_idx" ON "jr_projects" USING btree ("slug");
  CREATE INDEX "jr_projects_cover_image_idx" ON "jr_projects" USING btree ("cover_image_id");
  CREATE INDEX "jr_projects_author_idx" ON "jr_projects" USING btree ("author_id");
  CREATE INDEX "jr_projects_updated_at_idx" ON "jr_projects" USING btree ("updated_at");
  CREATE INDEX "jr_projects_created_at_idx" ON "jr_projects" USING btree ("created_at");
  CREATE INDEX "jr_projects_rels_order_idx" ON "jr_projects_rels" USING btree ("order");
  CREATE INDEX "jr_projects_rels_parent_idx" ON "jr_projects_rels" USING btree ("parent_id");
  CREATE INDEX "jr_projects_rels_path_idx" ON "jr_projects_rels" USING btree ("path");
  CREATE INDEX "jr_projects_rels_tags_id_idx" ON "jr_projects_rels" USING btree ("tags_id");
  CREATE INDEX "nitf_posts_locations_order_idx" ON "nitf_posts_locations" USING btree ("_order");
  CREATE INDEX "nitf_posts_locations_parent_id_idx" ON "nitf_posts_locations" USING btree ("_parent_id");
  CREATE INDEX "nitf_posts_locations_location_idx" ON "nitf_posts_locations" USING btree ("location_id");
  CREATE UNIQUE INDEX "nitf_posts_slug_idx" ON "nitf_posts" USING btree ("slug");
  CREATE INDEX "nitf_posts_cover_image_idx" ON "nitf_posts" USING btree ("cover_image_id");
  CREATE INDEX "nitf_posts_author_idx" ON "nitf_posts" USING btree ("author_id");
  CREATE INDEX "nitf_posts_trail_idx" ON "nitf_posts" USING btree ("trail_id");
  CREATE INDEX "nitf_posts_updated_at_idx" ON "nitf_posts" USING btree ("updated_at");
  CREATE INDEX "nitf_posts_created_at_idx" ON "nitf_posts" USING btree ("created_at");
  CREATE INDEX "nitf_posts_rels_order_idx" ON "nitf_posts_rels" USING btree ("order");
  CREATE INDEX "nitf_posts_rels_parent_idx" ON "nitf_posts_rels" USING btree ("parent_id");
  CREATE INDEX "nitf_posts_rels_path_idx" ON "nitf_posts_rels" USING btree ("path");
  CREATE INDEX "nitf_posts_rels_tags_id_idx" ON "nitf_posts_rels" USING btree ("tags_id");
  CREATE INDEX "nitf_trails_gpx_file_idx" ON "nitf_trails" USING btree ("gpx_file_id");
  CREATE INDEX "nitf_trails_updated_at_idx" ON "nitf_trails" USING btree ("updated_at");
  CREATE INDEX "nitf_trails_created_at_idx" ON "nitf_trails" USING btree ("created_at");
  CREATE INDEX "nitf_waypoints_trail_idx" ON "nitf_waypoints" USING btree ("trail_id");
  CREATE INDEX "nitf_waypoints_updated_at_idx" ON "nitf_waypoints" USING btree ("updated_at");
  CREATE INDEX "nitf_waypoints_created_at_idx" ON "nitf_waypoints" USING btree ("created_at");
  CREATE INDEX "nitf_locations_updated_at_idx" ON "nitf_locations" USING btree ("updated_at");
  CREATE INDEX "nitf_locations_created_at_idx" ON "nitf_locations" USING btree ("created_at");
  CREATE INDEX "rotr_posts_locations_order_idx" ON "rotr_posts_locations" USING btree ("_order");
  CREATE INDEX "rotr_posts_locations_parent_id_idx" ON "rotr_posts_locations" USING btree ("_parent_id");
  CREATE INDEX "rotr_posts_locations_location_idx" ON "rotr_posts_locations" USING btree ("location_id");
  CREATE UNIQUE INDEX "rotr_posts_slug_idx" ON "rotr_posts" USING btree ("slug");
  CREATE INDEX "rotr_posts_cover_image_idx" ON "rotr_posts" USING btree ("cover_image_id");
  CREATE INDEX "rotr_posts_author_idx" ON "rotr_posts" USING btree ("author_id");
  CREATE INDEX "rotr_posts_updated_at_idx" ON "rotr_posts" USING btree ("updated_at");
  CREATE INDEX "rotr_posts_created_at_idx" ON "rotr_posts" USING btree ("created_at");
  CREATE INDEX "rotr_posts_rels_order_idx" ON "rotr_posts_rels" USING btree ("order");
  CREATE INDEX "rotr_posts_rels_parent_idx" ON "rotr_posts_rels" USING btree ("parent_id");
  CREATE INDEX "rotr_posts_rels_path_idx" ON "rotr_posts_rels" USING btree ("path");
  CREATE INDEX "rotr_posts_rels_tags_id_idx" ON "rotr_posts_rels" USING btree ("tags_id");
  CREATE INDEX "rotr_locations_updated_at_idx" ON "rotr_locations" USING btree ("updated_at");
  CREATE INDEX "rotr_locations_created_at_idx" ON "rotr_locations" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_jr_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("jr_posts_id");
  CREATE INDEX "payload_locked_documents_rels_jr_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("jr_projects_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_posts_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_trails_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_trails_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_waypoints_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_waypoints_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_locations_id");
  CREATE INDEX "payload_locked_documents_rels_rotr_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("rotr_posts_id");
  CREATE INDEX "payload_locked_documents_rels_rotr_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("rotr_locations_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "authors_sites" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "jr_posts" CASCADE;
  DROP TABLE "jr_posts_rels" CASCADE;
  DROP TABLE "jr_projects" CASCADE;
  DROP TABLE "jr_projects_rels" CASCADE;
  DROP TABLE "nitf_posts_locations" CASCADE;
  DROP TABLE "nitf_posts" CASCADE;
  DROP TABLE "nitf_posts_rels" CASCADE;
  DROP TABLE "nitf_trails" CASCADE;
  DROP TABLE "nitf_waypoints" CASCADE;
  DROP TABLE "nitf_locations" CASCADE;
  DROP TABLE "rotr_posts_locations" CASCADE;
  DROP TABLE "rotr_posts" CASCADE;
  DROP TABLE "rotr_posts_rels" CASCADE;
  DROP TABLE "rotr_locations" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_authors_sites";
  DROP TYPE "public"."enum_tags_site";
  DROP TYPE "public"."enum_jr_posts_status";
  DROP TYPE "public"."enum_jr_projects_status";
  DROP TYPE "public"."enum_jr_projects_project_type";
  DROP TYPE "public"."enum_jr_projects_project_status";
  DROP TYPE "public"."enum_nitf_posts_status";
  DROP TYPE "public"."enum_nitf_posts_type";
  DROP TYPE "public"."enum_nitf_trails_status";
  DROP TYPE "public"."enum_nitf_trails_difficulty";
  DROP TYPE "public"."enum_nitf_trails_trail_type";
  DROP TYPE "public"."enum_nitf_waypoints_type";
  DROP TYPE "public"."enum_nitf_locations_place_type";
  DROP TYPE "public"."enum_nitf_locations_marker_type";
  DROP TYPE "public"."enum_rotr_posts_status";
  DROP TYPE "public"."enum_rotr_posts_type";
  DROP TYPE "public"."enum_rotr_locations_place_type";
  DROP TYPE "public"."enum_rotr_locations_marker_type";`)
}

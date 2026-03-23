import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin');
  CREATE TYPE "public"."enum_authors_sites" AS ENUM('jake-reddy', 'nerdintheforest', 'reddyontheroad');
  CREATE TYPE "public"."enum_jr_technologies_category" AS ENUM('language', 'framework', 'database', 'infrastructure', 'tool', 'library');
  CREATE TYPE "public"."enum_jr_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_jr_posts_project_type" AS ENUM('open-source', 'personal', 'home-lab', 'professional');
  CREATE TYPE "public"."enum_jr_posts_project_status" AS ENUM('active', 'in-progress', 'completed', 'archived');
  CREATE TYPE "public"."enum_nitf_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_nitf_posts_type" AS ENUM('review', 'recipe', 'article');
  CREATE TYPE "public"."enum_nitf_trails_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_nitf_trails_difficulty" AS ENUM('easy', 'moderate', 'hard', 'expert');
  CREATE TYPE "public"."enum_nitf_trails_trail_type" AS ENUM('loop', 'out-and-back', 'point-to-point');
  CREATE TYPE "public"."enum_nitf_trips_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_nitf_destinations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_nitf_destinations_difficulty" AS ENUM('easy', 'moderate', 'hard', 'expert');
  CREATE TYPE "public"."enum_nitf_places_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_rotr_days_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"roles" "enum_users_roles" DEFAULT 'admin',
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
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "authors_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"jr_media_id" integer,
  	"nitf_media_id" integer,
  	"rotr_media_id" integer
  );
  
  CREATE TABLE "jr_media" (
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
  
  CREATE TABLE "jr_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jr_technologies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"icon_id" integer,
  	"category" "enum_jr_technologies_category",
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jr_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_jr_posts_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"excerpt" varchar,
  	"body" varchar,
  	"cover_image_id" integer,
  	"project_type" "enum_jr_posts_project_type",
  	"project_status" "enum_jr_posts_project_status",
  	"github_url" varchar,
  	"live_url" varchar,
  	"featured" boolean DEFAULT false,
  	"sort" numeric,
  	"author_id" integer,
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
  	"jr_technologies_id" integer,
  	"jr_tags_id" integer
  );
  
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
  
  CREATE TABLE "nitf_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
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
  	"latitude" numeric,
  	"longitude" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"nitf_tags_id" integer
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
  
  CREATE TABLE "nitf_trips" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_trips_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"body" varchar,
  	"destination_id" integer,
  	"cover_image_id" integer,
  	"date_range_start_date" timestamp(3) with time zone,
  	"date_range_end_date" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_trips_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"nitf_tags_id" integer,
  	"nitf_poi_id" integer
  );
  
  CREATE TABLE "nitf_destinations_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "nitf_destinations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_destinations_status" DEFAULT 'draft' NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"featured_image_id" integer,
  	"difficulty" "enum_nitf_destinations_difficulty",
  	"season_info" varchar,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_poi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"latitude" numeric NOT NULL,
  	"longitude" numeric NOT NULL,
  	"type_id" integer,
  	"place_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_poi_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"nitf_trips_id" integer
  );
  
  CREATE TABLE "nitf_poi_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_places" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_nitf_places_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"body" varchar,
  	"cover_image_id" integer,
  	"poi_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nitf_places_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"nitf_tags_id" integer
  );
  
  CREATE TABLE "rotr_media" (
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
  
  CREATE TABLE "rotr_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rotr_days" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_rotr_days_status" DEFAULT 'draft' NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone,
  	"latitude" numeric,
  	"longitude" numeric,
  	"location_name" varchar,
  	"location_type_id" integer,
  	"weather" varchar,
  	"temperature" numeric,
  	"summary" varchar,
  	"content" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rotr_days_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"rotr_tags_id" integer
  );
  
  CREATE TABLE "rotr_place_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
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
  	"authors_id" integer,
  	"jr_media_id" integer,
  	"jr_tags_id" integer,
  	"jr_technologies_id" integer,
  	"jr_posts_id" integer,
  	"nitf_media_id" integer,
  	"nitf_tags_id" integer,
  	"nitf_posts_id" integer,
  	"nitf_trails_id" integer,
  	"nitf_trips_id" integer,
  	"nitf_destinations_id" integer,
  	"nitf_poi_id" integer,
  	"nitf_poi_types_id" integer,
  	"nitf_places_id" integer,
  	"rotr_media_id" integer,
  	"rotr_tags_id" integer,
  	"rotr_days_id" integer,
  	"rotr_place_types_id" integer
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
  ALTER TABLE "authors_rels" ADD CONSTRAINT "authors_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_rels" ADD CONSTRAINT "authors_rels_jr_media_fk" FOREIGN KEY ("jr_media_id") REFERENCES "public"."jr_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_rels" ADD CONSTRAINT "authors_rels_nitf_media_fk" FOREIGN KEY ("nitf_media_id") REFERENCES "public"."nitf_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_rels" ADD CONSTRAINT "authors_rels_rotr_media_fk" FOREIGN KEY ("rotr_media_id") REFERENCES "public"."rotr_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jr_technologies" ADD CONSTRAINT "jr_technologies_icon_id_jr_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."jr_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_posts" ADD CONSTRAINT "jr_posts_cover_image_id_jr_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."jr_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_posts" ADD CONSTRAINT "jr_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jr_posts_rels" ADD CONSTRAINT "jr_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jr_posts_rels" ADD CONSTRAINT "jr_posts_rels_jr_technologies_fk" FOREIGN KEY ("jr_technologies_id") REFERENCES "public"."jr_technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jr_posts_rels" ADD CONSTRAINT "jr_posts_rels_jr_tags_fk" FOREIGN KEY ("jr_tags_id") REFERENCES "public"."jr_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_posts" ADD CONSTRAINT "nitf_posts_cover_image_id_nitf_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_posts" ADD CONSTRAINT "nitf_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_posts_rels" ADD CONSTRAINT "nitf_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_posts_rels" ADD CONSTRAINT "nitf_posts_rels_nitf_tags_fk" FOREIGN KEY ("nitf_tags_id") REFERENCES "public"."nitf_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_trails" ADD CONSTRAINT "nitf_trails_gpx_file_id_nitf_media_id_fk" FOREIGN KEY ("gpx_file_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_trips" ADD CONSTRAINT "nitf_trips_destination_id_nitf_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."nitf_destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_trips" ADD CONSTRAINT "nitf_trips_cover_image_id_nitf_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_trips_rels" ADD CONSTRAINT "nitf_trips_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_trips_rels" ADD CONSTRAINT "nitf_trips_rels_nitf_tags_fk" FOREIGN KEY ("nitf_tags_id") REFERENCES "public"."nitf_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_trips_rels" ADD CONSTRAINT "nitf_trips_rels_nitf_poi_fk" FOREIGN KEY ("nitf_poi_id") REFERENCES "public"."nitf_poi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_destinations_links" ADD CONSTRAINT "nitf_destinations_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nitf_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_destinations" ADD CONSTRAINT "nitf_destinations_featured_image_id_nitf_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_poi" ADD CONSTRAINT "nitf_poi_type_id_nitf_poi_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."nitf_poi_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_poi" ADD CONSTRAINT "nitf_poi_place_id_nitf_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."nitf_places"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_poi_rels" ADD CONSTRAINT "nitf_poi_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_poi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_poi_rels" ADD CONSTRAINT "nitf_poi_rels_nitf_trips_fk" FOREIGN KEY ("nitf_trips_id") REFERENCES "public"."nitf_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_places" ADD CONSTRAINT "nitf_places_cover_image_id_nitf_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."nitf_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_places" ADD CONSTRAINT "nitf_places_poi_id_nitf_poi_id_fk" FOREIGN KEY ("poi_id") REFERENCES "public"."nitf_poi"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nitf_places_rels" ADD CONSTRAINT "nitf_places_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nitf_places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nitf_places_rels" ADD CONSTRAINT "nitf_places_rels_nitf_tags_fk" FOREIGN KEY ("nitf_tags_id") REFERENCES "public"."nitf_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotr_days" ADD CONSTRAINT "rotr_days_location_type_id_rotr_place_types_id_fk" FOREIGN KEY ("location_type_id") REFERENCES "public"."rotr_place_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotr_days_rels" ADD CONSTRAINT "rotr_days_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rotr_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotr_days_rels" ADD CONSTRAINT "rotr_days_rels_rotr_tags_fk" FOREIGN KEY ("rotr_tags_id") REFERENCES "public"."rotr_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jr_media_fk" FOREIGN KEY ("jr_media_id") REFERENCES "public"."jr_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jr_tags_fk" FOREIGN KEY ("jr_tags_id") REFERENCES "public"."jr_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jr_technologies_fk" FOREIGN KEY ("jr_technologies_id") REFERENCES "public"."jr_technologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jr_posts_fk" FOREIGN KEY ("jr_posts_id") REFERENCES "public"."jr_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_media_fk" FOREIGN KEY ("nitf_media_id") REFERENCES "public"."nitf_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_tags_fk" FOREIGN KEY ("nitf_tags_id") REFERENCES "public"."nitf_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_posts_fk" FOREIGN KEY ("nitf_posts_id") REFERENCES "public"."nitf_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_trails_fk" FOREIGN KEY ("nitf_trails_id") REFERENCES "public"."nitf_trails"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_trips_fk" FOREIGN KEY ("nitf_trips_id") REFERENCES "public"."nitf_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_destinations_fk" FOREIGN KEY ("nitf_destinations_id") REFERENCES "public"."nitf_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_poi_fk" FOREIGN KEY ("nitf_poi_id") REFERENCES "public"."nitf_poi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_poi_types_fk" FOREIGN KEY ("nitf_poi_types_id") REFERENCES "public"."nitf_poi_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nitf_places_fk" FOREIGN KEY ("nitf_places_id") REFERENCES "public"."nitf_places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotr_media_fk" FOREIGN KEY ("rotr_media_id") REFERENCES "public"."rotr_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotr_tags_fk" FOREIGN KEY ("rotr_tags_id") REFERENCES "public"."rotr_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotr_days_fk" FOREIGN KEY ("rotr_days_id") REFERENCES "public"."rotr_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotr_place_types_fk" FOREIGN KEY ("rotr_place_types_id") REFERENCES "public"."rotr_place_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "authors_sites_order_idx" ON "authors_sites" USING btree ("order");
  CREATE INDEX "authors_sites_parent_idx" ON "authors_sites" USING btree ("parent_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE INDEX "authors_rels_order_idx" ON "authors_rels" USING btree ("order");
  CREATE INDEX "authors_rels_parent_idx" ON "authors_rels" USING btree ("parent_id");
  CREATE INDEX "authors_rels_path_idx" ON "authors_rels" USING btree ("path");
  CREATE INDEX "authors_rels_jr_media_id_idx" ON "authors_rels" USING btree ("jr_media_id");
  CREATE INDEX "authors_rels_nitf_media_id_idx" ON "authors_rels" USING btree ("nitf_media_id");
  CREATE INDEX "authors_rels_rotr_media_id_idx" ON "authors_rels" USING btree ("rotr_media_id");
  CREATE INDEX "jr_media_updated_at_idx" ON "jr_media" USING btree ("updated_at");
  CREATE INDEX "jr_media_created_at_idx" ON "jr_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "jr_media_filename_idx" ON "jr_media" USING btree ("filename");
  CREATE UNIQUE INDEX "jr_tags_slug_idx" ON "jr_tags" USING btree ("slug");
  CREATE INDEX "jr_tags_updated_at_idx" ON "jr_tags" USING btree ("updated_at");
  CREATE INDEX "jr_tags_created_at_idx" ON "jr_tags" USING btree ("created_at");
  CREATE INDEX "jr_technologies_icon_idx" ON "jr_technologies" USING btree ("icon_id");
  CREATE INDEX "jr_technologies_updated_at_idx" ON "jr_technologies" USING btree ("updated_at");
  CREATE INDEX "jr_technologies_created_at_idx" ON "jr_technologies" USING btree ("created_at");
  CREATE UNIQUE INDEX "jr_posts_slug_idx" ON "jr_posts" USING btree ("slug");
  CREATE INDEX "jr_posts_cover_image_idx" ON "jr_posts" USING btree ("cover_image_id");
  CREATE INDEX "jr_posts_author_idx" ON "jr_posts" USING btree ("author_id");
  CREATE INDEX "jr_posts_updated_at_idx" ON "jr_posts" USING btree ("updated_at");
  CREATE INDEX "jr_posts_created_at_idx" ON "jr_posts" USING btree ("created_at");
  CREATE INDEX "jr_posts_rels_order_idx" ON "jr_posts_rels" USING btree ("order");
  CREATE INDEX "jr_posts_rels_parent_idx" ON "jr_posts_rels" USING btree ("parent_id");
  CREATE INDEX "jr_posts_rels_path_idx" ON "jr_posts_rels" USING btree ("path");
  CREATE INDEX "jr_posts_rels_jr_technologies_id_idx" ON "jr_posts_rels" USING btree ("jr_technologies_id");
  CREATE INDEX "jr_posts_rels_jr_tags_id_idx" ON "jr_posts_rels" USING btree ("jr_tags_id");
  CREATE INDEX "nitf_media_updated_at_idx" ON "nitf_media" USING btree ("updated_at");
  CREATE INDEX "nitf_media_created_at_idx" ON "nitf_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "nitf_media_filename_idx" ON "nitf_media" USING btree ("filename");
  CREATE UNIQUE INDEX "nitf_tags_slug_idx" ON "nitf_tags" USING btree ("slug");
  CREATE INDEX "nitf_tags_updated_at_idx" ON "nitf_tags" USING btree ("updated_at");
  CREATE INDEX "nitf_tags_created_at_idx" ON "nitf_tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "nitf_posts_slug_idx" ON "nitf_posts" USING btree ("slug");
  CREATE INDEX "nitf_posts_cover_image_idx" ON "nitf_posts" USING btree ("cover_image_id");
  CREATE INDEX "nitf_posts_author_idx" ON "nitf_posts" USING btree ("author_id");
  CREATE INDEX "nitf_posts_updated_at_idx" ON "nitf_posts" USING btree ("updated_at");
  CREATE INDEX "nitf_posts_created_at_idx" ON "nitf_posts" USING btree ("created_at");
  CREATE INDEX "nitf_posts_rels_order_idx" ON "nitf_posts_rels" USING btree ("order");
  CREATE INDEX "nitf_posts_rels_parent_idx" ON "nitf_posts_rels" USING btree ("parent_id");
  CREATE INDEX "nitf_posts_rels_path_idx" ON "nitf_posts_rels" USING btree ("path");
  CREATE INDEX "nitf_posts_rels_nitf_tags_id_idx" ON "nitf_posts_rels" USING btree ("nitf_tags_id");
  CREATE INDEX "nitf_trails_gpx_file_idx" ON "nitf_trails" USING btree ("gpx_file_id");
  CREATE INDEX "nitf_trails_updated_at_idx" ON "nitf_trails" USING btree ("updated_at");
  CREATE INDEX "nitf_trails_created_at_idx" ON "nitf_trails" USING btree ("created_at");
  CREATE UNIQUE INDEX "nitf_trips_slug_idx" ON "nitf_trips" USING btree ("slug");
  CREATE INDEX "nitf_trips_destination_idx" ON "nitf_trips" USING btree ("destination_id");
  CREATE INDEX "nitf_trips_cover_image_idx" ON "nitf_trips" USING btree ("cover_image_id");
  CREATE INDEX "nitf_trips_updated_at_idx" ON "nitf_trips" USING btree ("updated_at");
  CREATE INDEX "nitf_trips_created_at_idx" ON "nitf_trips" USING btree ("created_at");
  CREATE INDEX "nitf_trips_rels_order_idx" ON "nitf_trips_rels" USING btree ("order");
  CREATE INDEX "nitf_trips_rels_parent_idx" ON "nitf_trips_rels" USING btree ("parent_id");
  CREATE INDEX "nitf_trips_rels_path_idx" ON "nitf_trips_rels" USING btree ("path");
  CREATE INDEX "nitf_trips_rels_nitf_tags_id_idx" ON "nitf_trips_rels" USING btree ("nitf_tags_id");
  CREATE INDEX "nitf_trips_rels_nitf_poi_id_idx" ON "nitf_trips_rels" USING btree ("nitf_poi_id");
  CREATE INDEX "nitf_destinations_links_order_idx" ON "nitf_destinations_links" USING btree ("_order");
  CREATE INDEX "nitf_destinations_links_parent_id_idx" ON "nitf_destinations_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nitf_destinations_slug_idx" ON "nitf_destinations" USING btree ("slug");
  CREATE INDEX "nitf_destinations_featured_image_idx" ON "nitf_destinations" USING btree ("featured_image_id");
  CREATE INDEX "nitf_destinations_updated_at_idx" ON "nitf_destinations" USING btree ("updated_at");
  CREATE INDEX "nitf_destinations_created_at_idx" ON "nitf_destinations" USING btree ("created_at");
  CREATE INDEX "nitf_poi_type_idx" ON "nitf_poi" USING btree ("type_id");
  CREATE INDEX "nitf_poi_place_idx" ON "nitf_poi" USING btree ("place_id");
  CREATE INDEX "nitf_poi_updated_at_idx" ON "nitf_poi" USING btree ("updated_at");
  CREATE INDEX "nitf_poi_created_at_idx" ON "nitf_poi" USING btree ("created_at");
  CREATE INDEX "nitf_poi_rels_order_idx" ON "nitf_poi_rels" USING btree ("order");
  CREATE INDEX "nitf_poi_rels_parent_idx" ON "nitf_poi_rels" USING btree ("parent_id");
  CREATE INDEX "nitf_poi_rels_path_idx" ON "nitf_poi_rels" USING btree ("path");
  CREATE INDEX "nitf_poi_rels_nitf_trips_id_idx" ON "nitf_poi_rels" USING btree ("nitf_trips_id");
  CREATE UNIQUE INDEX "nitf_poi_types_slug_idx" ON "nitf_poi_types" USING btree ("slug");
  CREATE INDEX "nitf_poi_types_updated_at_idx" ON "nitf_poi_types" USING btree ("updated_at");
  CREATE INDEX "nitf_poi_types_created_at_idx" ON "nitf_poi_types" USING btree ("created_at");
  CREATE UNIQUE INDEX "nitf_places_slug_idx" ON "nitf_places" USING btree ("slug");
  CREATE INDEX "nitf_places_cover_image_idx" ON "nitf_places" USING btree ("cover_image_id");
  CREATE INDEX "nitf_places_poi_idx" ON "nitf_places" USING btree ("poi_id");
  CREATE INDEX "nitf_places_updated_at_idx" ON "nitf_places" USING btree ("updated_at");
  CREATE INDEX "nitf_places_created_at_idx" ON "nitf_places" USING btree ("created_at");
  CREATE INDEX "nitf_places_rels_order_idx" ON "nitf_places_rels" USING btree ("order");
  CREATE INDEX "nitf_places_rels_parent_idx" ON "nitf_places_rels" USING btree ("parent_id");
  CREATE INDEX "nitf_places_rels_path_idx" ON "nitf_places_rels" USING btree ("path");
  CREATE INDEX "nitf_places_rels_nitf_tags_id_idx" ON "nitf_places_rels" USING btree ("nitf_tags_id");
  CREATE INDEX "rotr_media_updated_at_idx" ON "rotr_media" USING btree ("updated_at");
  CREATE INDEX "rotr_media_created_at_idx" ON "rotr_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "rotr_media_filename_idx" ON "rotr_media" USING btree ("filename");
  CREATE UNIQUE INDEX "rotr_tags_slug_idx" ON "rotr_tags" USING btree ("slug");
  CREATE INDEX "rotr_tags_updated_at_idx" ON "rotr_tags" USING btree ("updated_at");
  CREATE INDEX "rotr_tags_created_at_idx" ON "rotr_tags" USING btree ("created_at");
  CREATE INDEX "rotr_days_location_type_idx" ON "rotr_days" USING btree ("location_type_id");
  CREATE INDEX "rotr_days_updated_at_idx" ON "rotr_days" USING btree ("updated_at");
  CREATE INDEX "rotr_days_created_at_idx" ON "rotr_days" USING btree ("created_at");
  CREATE INDEX "rotr_days_rels_order_idx" ON "rotr_days_rels" USING btree ("order");
  CREATE INDEX "rotr_days_rels_parent_idx" ON "rotr_days_rels" USING btree ("parent_id");
  CREATE INDEX "rotr_days_rels_path_idx" ON "rotr_days_rels" USING btree ("path");
  CREATE INDEX "rotr_days_rels_rotr_tags_id_idx" ON "rotr_days_rels" USING btree ("rotr_tags_id");
  CREATE UNIQUE INDEX "rotr_place_types_slug_idx" ON "rotr_place_types" USING btree ("slug");
  CREATE INDEX "rotr_place_types_updated_at_idx" ON "rotr_place_types" USING btree ("updated_at");
  CREATE INDEX "rotr_place_types_created_at_idx" ON "rotr_place_types" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_jr_media_id_idx" ON "payload_locked_documents_rels" USING btree ("jr_media_id");
  CREATE INDEX "payload_locked_documents_rels_jr_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("jr_tags_id");
  CREATE INDEX "payload_locked_documents_rels_jr_technologies_id_idx" ON "payload_locked_documents_rels" USING btree ("jr_technologies_id");
  CREATE INDEX "payload_locked_documents_rels_jr_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("jr_posts_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_media_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_media_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_tags_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_posts_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_trails_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_trails_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_trips_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_trips_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_destinations_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_destinations_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_poi_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_poi_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_poi_types_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_poi_types_id");
  CREATE INDEX "payload_locked_documents_rels_nitf_places_id_idx" ON "payload_locked_documents_rels" USING btree ("nitf_places_id");
  CREATE INDEX "payload_locked_documents_rels_rotr_media_id_idx" ON "payload_locked_documents_rels" USING btree ("rotr_media_id");
  CREATE INDEX "payload_locked_documents_rels_rotr_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("rotr_tags_id");
  CREATE INDEX "payload_locked_documents_rels_rotr_days_id_idx" ON "payload_locked_documents_rels" USING btree ("rotr_days_id");
  CREATE INDEX "payload_locked_documents_rels_rotr_place_types_id_idx" ON "payload_locked_documents_rels" USING btree ("rotr_place_types_id");
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
  DROP TABLE "authors_sites" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "authors_rels" CASCADE;
  DROP TABLE "jr_media" CASCADE;
  DROP TABLE "jr_tags" CASCADE;
  DROP TABLE "jr_technologies" CASCADE;
  DROP TABLE "jr_posts" CASCADE;
  DROP TABLE "jr_posts_rels" CASCADE;
  DROP TABLE "nitf_media" CASCADE;
  DROP TABLE "nitf_tags" CASCADE;
  DROP TABLE "nitf_posts" CASCADE;
  DROP TABLE "nitf_posts_rels" CASCADE;
  DROP TABLE "nitf_trails" CASCADE;
  DROP TABLE "nitf_trips" CASCADE;
  DROP TABLE "nitf_trips_rels" CASCADE;
  DROP TABLE "nitf_destinations_links" CASCADE;
  DROP TABLE "nitf_destinations" CASCADE;
  DROP TABLE "nitf_poi" CASCADE;
  DROP TABLE "nitf_poi_rels" CASCADE;
  DROP TABLE "nitf_poi_types" CASCADE;
  DROP TABLE "nitf_places" CASCADE;
  DROP TABLE "nitf_places_rels" CASCADE;
  DROP TABLE "rotr_media" CASCADE;
  DROP TABLE "rotr_tags" CASCADE;
  DROP TABLE "rotr_days" CASCADE;
  DROP TABLE "rotr_days_rels" CASCADE;
  DROP TABLE "rotr_place_types" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_authors_sites";
  DROP TYPE "public"."enum_jr_technologies_category";
  DROP TYPE "public"."enum_jr_posts_status";
  DROP TYPE "public"."enum_jr_posts_project_type";
  DROP TYPE "public"."enum_jr_posts_project_status";
  DROP TYPE "public"."enum_nitf_posts_status";
  DROP TYPE "public"."enum_nitf_posts_type";
  DROP TYPE "public"."enum_nitf_trails_status";
  DROP TYPE "public"."enum_nitf_trails_difficulty";
  DROP TYPE "public"."enum_nitf_trails_trail_type";
  DROP TYPE "public"."enum_nitf_trips_status";
  DROP TYPE "public"."enum_nitf_destinations_status";
  DROP TYPE "public"."enum_nitf_destinations_difficulty";
  DROP TYPE "public"."enum_nitf_places_status";
  DROP TYPE "public"."enum_rotr_days_status";`)
}

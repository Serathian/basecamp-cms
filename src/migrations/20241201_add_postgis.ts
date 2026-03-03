import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`)

  const geoTables: Array<{
    table: string
    latCol: string
    lonCol: string
    indexName: string
  }> = [
    {
      table: 'nitf_posts',
      latCol: 'latitude',
      lonCol: 'longitude',
      indexName: 'idx_nitf_posts_geom',
    },
    {
      table: 'nitf_trails',
      latCol: 'latitude_start',
      lonCol: 'longitude_start',
      indexName: 'idx_nitf_trails_geom',
    },
    {
      table: 'nitf_waypoints',
      latCol: 'latitude',
      lonCol: 'longitude',
      indexName: 'idx_nitf_waypoints_geom',
    },
    {
      table: 'nitf_locations',
      latCol: 'latitude',
      lonCol: 'longitude',
      indexName: 'idx_nitf_locations_geom',
    },
    {
      table: 'rotr_posts',
      latCol: 'latitude',
      lonCol: 'longitude',
      indexName: 'idx_rotr_posts_geom',
    },
    {
      table: 'rotr_locations',
      latCol: 'latitude',
      lonCol: 'longitude',
      indexName: 'idx_rotr_locations_geom',
    },
  ]

  for (const { table, latCol, lonCol, indexName } of geoTables) {
    await db.execute(
      sql.raw(`
      ALTER TABLE ${table}
      ADD COLUMN IF NOT EXISTS geom GEOMETRY(POINT, 4326)
      GENERATED ALWAYS AS (
        CASE WHEN ${latCol} IS NOT NULL AND ${lonCol} IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(${lonCol}, ${latCol}), 4326) END
      ) STORED
    `),
    )
    await db.execute(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} USING GIST (geom)`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const tables = [
    'nitf_posts',
    'nitf_trails',
    'nitf_waypoints',
    'nitf_locations',
    'rotr_posts',
    'rotr_locations',
  ]
  for (const table of tables) {
    await db.execute(
      sql.raw(`ALTER TABLE ${table} DROP COLUMN IF EXISTS geom`),
    )
  }
}

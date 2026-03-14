import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`)

  const geoTables: Array<{
    table: string
    latCol: string
    lonCol: string
    geomCol: string
    indexName: string
  }> = [
    {
      table: 'nitf_posts',
      latCol: 'latitude',
      lonCol: 'longitude',
      geomCol: 'geom',
      indexName: 'idx_nitf_posts_geom',
    },
    {
      table: 'nitf_trails',
      latCol: 'latitude_start',
      lonCol: 'longitude_start',
      geomCol: 'geom',
      indexName: 'idx_nitf_trails_geom',
    },
    {
      table: 'nitf_waypoints',
      latCol: 'latitude',
      lonCol: 'longitude',
      geomCol: 'geom',
      indexName: 'idx_nitf_waypoints_geom',
    },
    {
      table: 'nitf_locations',
      latCol: 'latitude',
      lonCol: 'longitude',
      geomCol: 'geom',
      indexName: 'idx_nitf_locations_geom',
    },
    {
      table: 'rotr_posts',
      latCol: 'latitude',
      lonCol: 'longitude',
      geomCol: 'geom',
      indexName: 'idx_rotr_posts_geom',
    },
    {
      table: 'rotr_locations',
      latCol: 'latitude',
      lonCol: 'longitude',
      geomCol: 'geom',
      indexName: 'idx_rotr_locations_geom',
    },
  ]

  for (const { table, latCol, lonCol, geomCol, indexName } of geoTables) {
    // 1️⃣ Add the geometry column (IF NOT EXISTS makes this safe to re-run)
    await db.execute(
      sql`ALTER TABLE ${sql.identifier(table)} ADD COLUMN IF NOT EXISTS ${sql.identifier(geomCol)} geometry(Point, 4326)`,
    )

    // 2️⃣ Populate it from lat/lon (UPDATE is always safe to re-run)
    await db.execute(sql`
      UPDATE ${sql.identifier(table)}
      SET ${sql.identifier(geomCol)} = ST_SetSRID(ST_MakePoint(${sql.identifier(lonCol)}, ${sql.identifier(latCol)}), 4326)
      WHERE ${sql.identifier(latCol)} IS NOT NULL AND ${sql.identifier(lonCol)} IS NOT NULL
    `)

    // 3️⃣ Create a spatial index (IF NOT EXISTS makes this safe to re-run)
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(indexName)} ON ${sql.identifier(table)} USING GIST (${sql.identifier(geomCol)})`,
    )

    /*
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
      sql.raw(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} USING GIST (geom)`),
    )
    */
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
    await db.execute(sql.raw(`ALTER TABLE ${table} DROP COLUMN IF EXISTS geom`))
  }
}

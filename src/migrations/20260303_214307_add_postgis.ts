import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

const geoTables: Array<{
  table: string
  latCol: string
  lonCol: string
  geomCol: string
  indexName: string
  triggerName: string
}> = [
  {
    table: 'nitf_posts',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_nitf_posts_geom',
    triggerName: 'trg_nitf_posts_geom',
  },
  {
    table: 'nitf_trails',
    latCol: 'latitude_start',
    lonCol: 'longitude_start',
    geomCol: 'geom',
    indexName: 'idx_nitf_trails_geom',
    triggerName: 'trg_nitf_trails_geom',
  },
  {
    table: 'nitf_destinations',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_nitf_destinations_geom',
    triggerName: 'trg_nitf_destinations_geom',
  },
  {
    table: 'nitf_poi',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_nitf_poi_geom',
    triggerName: 'trg_nitf_poi_geom',
  },
  {
    table: 'rotr_days',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_rotr_days_geom',
    triggerName: 'trg_rotr_days_geom',
  },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`)

  for (const { table, latCol, lonCol, geomCol, indexName, triggerName } of geoTables) {
    await db.execute(
      sql`ALTER TABLE ${sql.identifier(table)} ADD COLUMN IF NOT EXISTS ${sql.identifier(geomCol)} geometry(Point, 4326)`,
    )

    await db.execute(sql`
      UPDATE ${sql.identifier(table)}
      SET ${sql.identifier(geomCol)} = ST_SetSRID(ST_MakePoint(${sql.identifier(lonCol)}, ${sql.identifier(latCol)}), 4326)
      WHERE ${sql.identifier(latCol)} IS NOT NULL AND ${sql.identifier(lonCol)} IS NOT NULL
    `)

    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(indexName)} ON ${sql.identifier(table)} USING GIST (${sql.identifier(geomCol)})`,
    )

    const functionName = `${triggerName}_fn`
    await db.execute(
      sql.raw(`
      CREATE OR REPLACE FUNCTION ${functionName}()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.${latCol} IS NOT NULL AND NEW.${lonCol} IS NOT NULL THEN
          NEW.geom := ST_SetSRID(ST_MakePoint(NEW.${lonCol}, NEW.${latCol}), 4326);
        ELSE
          NEW.geom := NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `),
    )

    await db.execute(
      sql.raw(`
      DROP TRIGGER IF EXISTS ${triggerName} ON ${table};
      CREATE TRIGGER ${triggerName}
        BEFORE INSERT OR UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION ${functionName}();
    `),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const { table, geomCol, triggerName } of geoTables) {
    await db.execute(sql.raw(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table};`))
    await db.execute(sql.raw(`DROP FUNCTION IF EXISTS ${triggerName}_fn();`))
    await db.execute(sql.raw(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${geomCol}`))
  }
}

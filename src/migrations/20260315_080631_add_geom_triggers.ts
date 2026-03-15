import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const geoTables: Array<{
    table: string
    latCol: string
    lonCol: string
    triggerName: string
  }> = [
    {
      table: 'nitf_posts',
      latCol: 'latitude',
      lonCol: 'longitude',
      triggerName: 'trg_nitf_posts_geom',
    },
    {
      table: 'nitf_trails',
      latCol: 'latitude_start',
      lonCol: 'longitude_start',
      triggerName: 'trg_nitf_trails_geom',
    },
    {
      table: 'nitf_waypoints',
      latCol: 'latitude',
      lonCol: 'longitude',
      triggerName: 'trg_nitf_waypoints_geom',
    },
    {
      table: 'nitf_locations',
      latCol: 'latitude',
      lonCol: 'longitude',
      triggerName: 'trg_nitf_locations_geom',
    },
    {
      table: 'rotr_posts',
      latCol: 'latitude',
      lonCol: 'longitude',
      triggerName: 'trg_rotr_posts_geom',
    },
    {
      table: 'rotr_locations',
      latCol: 'latitude',
      lonCol: 'longitude',
      triggerName: 'trg_rotr_locations_geom',
    },
  ]

  for (const { table, latCol, lonCol, triggerName } of geoTables) {
    // Create trigger function for this table
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

    // Create trigger that calls the function on INSERT or UPDATE
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
  const tables = [
    { table: 'nitf_posts', trigger: 'trg_nitf_posts_geom' },
    { table: 'nitf_trails', trigger: 'trg_nitf_trails_geom' },
    { table: 'nitf_waypoints', trigger: 'trg_nitf_waypoints_geom' },
    { table: 'nitf_locations', trigger: 'trg_nitf_locations_geom' },
    { table: 'rotr_posts', trigger: 'trg_rotr_posts_geom' },
    { table: 'rotr_locations', trigger: 'trg_rotr_locations_geom' },
  ]

  for (const { table, trigger } of tables) {
    await db.execute(sql.raw(`DROP TRIGGER IF EXISTS ${trigger} ON ${table};`))
    await db.execute(sql.raw(`DROP FUNCTION IF EXISTS ${trigger}_fn();`))
  }
}

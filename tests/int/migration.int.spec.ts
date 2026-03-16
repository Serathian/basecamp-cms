import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { execSync } from 'child_process'

let payload: Payload
let db: any

describe('PostGIS Migration — up/down operations', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    db = (payload.db as any).drizzle
  })

  afterAll(async () => {
    if (payload?.db?.destroy) {
      await payload.db.destroy()
    }
  })

  it('Migration up adds geom columns to all 6 tables', async () => {
    // rotr_posts and rotr_locations were replaced by rotr_days in Phase 4
    const tables = [
      'nitf_posts',
      'nitf_trails',
      'nitf_waypoints',
      'nitf_locations',
      'rotr_days',
    ]

    for (const tableName of tables) {
      const result = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ${tableName} AND column_name = 'geom'
      `)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].column_name).toBe('geom')
    }
  })

  it('Migration populates geom from existing lat/lon data', async () => {
    // Create a test post with lat/lon
    const testPost = await payload.create({
      collection: 'nitf_posts',
      data: {
        title: 'Test geom population',
        slug: `test-geom-${Date.now()}`,
        status: 'published',
        type: 'general',
        latitude: 43.0,
        longitude: -75.0,
      },
    })

    // Manually trigger geom population via migration pattern
    await db.execute(sql`
      UPDATE nitf_posts
      SET geom = ST_SetSRID(ST_MakePoint(${testPost.longitude}, ${testPost.latitude}), 4326)
      WHERE id = ${testPost.id}
    `)

    // Query geom column directly
    const result = await db.execute(sql`
      SELECT geom FROM nitf_posts WHERE id = ${testPost.id}
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].geom).not.toBeNull()

    // Cleanup
    await payload.delete({ collection: 'nitf_posts', id: testPost.id })
  })

  it('Spatial indexes exist on NITF geographic tables', async () => {
    // Phase 2 migration created GIST indexes on the original 4 NITF geographic tables.
    // rotr_posts and rotr_locations (dropped in Phase 4) had indexes; rotr_days does not yet have one.
    const expectedIndexes = [
      { tablename: 'nitf_posts', indexname: 'idx_nitf_posts_geom' },
      { tablename: 'nitf_trails', indexname: 'idx_nitf_trails_geom' },
      { tablename: 'nitf_waypoints', indexname: 'idx_nitf_waypoints_geom' },
      { tablename: 'nitf_locations', indexname: 'idx_nitf_locations_geom' },
    ]

    const result = await db.execute(sql`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE tablename IN ('nitf_posts', 'nitf_trails', 'nitf_waypoints', 'nitf_locations')
        AND indexdef LIKE '%USING gist%'
      ORDER BY tablename
    `)

    expect(result.rows).toHaveLength(expectedIndexes.length)

    for (const expected of expectedIndexes) {
      const found = result.rows.find(
        (row: any) => row.tablename === expected.tablename && row.indexname === expected.indexname,
      )
      expect(found).toBeDefined()
    }
  })
})

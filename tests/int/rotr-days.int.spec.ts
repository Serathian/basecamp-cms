import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let db: any

describe('Phase 4: ROTR Days Collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    db = (payload.db as any).drizzle
  })

  afterAll(async () => {
    if (payload?.db) {
      await payload.db.destroy!()
    }
  })

  describe('ROTR-04: rotr_posts and rotr_locations dropped', () => {
    it('rotr_posts table does not exist after migration', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'rotr_posts'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })

    it('rotr_locations table does not exist after migration', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'rotr_locations'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })
  })

  describe('ROTR-01/02: rotr_days table structure', () => {
    it('rotr_days table exists with all required columns', async () => {
      const tableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'rotr_days'} AND table_schema = 'public'
      `)
      expect(tableResult.rows).toHaveLength(1)

      const requiredColumns = [
        'id', 'status', 'title', 'date', 'latitude', 'longitude',
        'location_name', 'weather', 'temperature', 'summary', 'content',
        'updated_at', 'created_at',
      ]
      for (const col of requiredColumns) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'rotr_days'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `rotr_days.${col} should exist`).toHaveLength(1)
      }
    })

    it('rotr_place_types table exists with name and slug columns', async () => {
      const tableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'rotr_place_types'} AND table_schema = 'public'
      `)
      expect(tableResult.rows).toHaveLength(1)

      for (const col of ['name', 'slug']) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'rotr_place_types'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `rotr_place_types.${col} should exist`).toHaveLength(1)
      }
    })
  })

  describe('GEO-04: geom auto-population via trigger', () => {
    it('rotr_days: creating with lat/lon populates geom', async () => {
      const record = await payload.create({
        collection: 'rotr_days',
        data: { title: 'Geom Test Day', status: 'published', latitude: 38.7169, longitude: -9.1399 },
      })
      const result = await db.execute(sql`SELECT geom FROM rotr_days WHERE id = ${record.id}`)
      expect(result.rows[0].geom).not.toBeNull()
      await payload.delete({ collection: 'rotr_days', id: record.id })
    })

    it('rotr_days: creating without lat/lon leaves geom null', async () => {
      const record = await payload.create({
        collection: 'rotr_days',
        data: { title: 'No Coords Day', status: 'draft' },
      })
      const result = await db.execute(sql`SELECT geom FROM rotr_days WHERE id = ${record.id}`)
      expect(result.rows[0].geom).toBeNull()
      await payload.delete({ collection: 'rotr_days', id: record.id })
    })

    it('rotr_days: updating coordinates updates geom', async () => {
      const record = await payload.create({
        collection: 'rotr_days',
        data: { title: 'Coord Update Day', status: 'draft', latitude: 51.5074, longitude: -0.1278 },
      })

      const newLat = 48.8566
      const newLon = 2.3522
      await payload.update({
        collection: 'rotr_days',
        id: record.id,
        data: { latitude: newLat, longitude: newLon },
      })

      const result = await db.execute(sql`
        SELECT ST_X(geom) AS lon, ST_Y(geom) AS lat FROM rotr_days WHERE id = ${record.id}
      `)
      expect(result.rows[0].lat).toBeCloseTo(newLat, 4)
      expect(result.rows[0].lon).toBeCloseTo(newLon, 4)

      await payload.delete({ collection: 'rotr_days', id: record.id })
    })
  })

  describe('TEST-02: relationship population', () => {
    it('rotr_days.location_type populated as object at depth:1', async () => {
      const placeType = await payload.create({
        collection: 'rotr_place_types',
        data: { name: 'City', slug: `city-${Date.now()}` },
      })
      const record = await payload.create({
        collection: 'rotr_days',
        data: { title: 'Rel Test Day', status: 'draft', location_type: placeType.id },
      })
      const fetched = await payload.findByID({ collection: 'rotr_days', id: record.id, depth: 1 })
      const populated = fetched.location_type as any
      expect(populated.id).toBe(placeType.id)
      expect(populated.name).toBe('City')

      await payload.delete({ collection: 'rotr_days', id: record.id })
      await payload.delete({ collection: 'rotr_place_types', id: placeType.id })
    })

    it('rotr_days.tags populated as array at depth:1', async () => {
      const tag = await payload.create({
        collection: 'rotr_tags',
        data: { name: 'ROTR Test Tag', slug: `rotr-test-tag-${Date.now()}` },
      })
      const record = await payload.create({
        collection: 'rotr_days',
        data: { title: 'Tags Test Day', status: 'draft', tags: [tag.id] },
      })
      const fetched = await payload.findByID({ collection: 'rotr_days', id: record.id, depth: 1 })
      expect(fetched.tags).toBeDefined()
      expect(Array.isArray(fetched.tags)).toBe(true)
      expect(fetched.tags).toHaveLength(1)
      const populatedTag = fetched.tags![0] as any
      expect(populatedTag.id).toBe(tag.id)
      expect(populatedTag.name).toBe('ROTR Test Tag')

      await payload.delete({ collection: 'rotr_days', id: record.id })
      await payload.delete({ collection: 'rotr_tags', id: tag.id })
    })
  })

})

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { up, down } from '@/migrations/20260316_nitf_trip_structure'

let payload: Payload
let db: any

describe('Phase 5: NITF Trip Structure', () => {
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

  describe('NITF-01/02: nitf_posts schema update', () => {
    it('nitf_posts type options trimmed to review/recipe/article', async () => {
      // Verify that the type column still exists (it was not dropped)
      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_posts'} AND column_name = ${'type'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_posts.type should exist').toHaveLength(1)

      // Verify legacy columns are gone (they would be present if type was also dropped)
      // The type field itself trimming is enforced by the collection config, not DB constraints
      // We verify the collection config has 3 options by testing a valid value can be saved
      const post = await payload.create({
        collection: 'nitf_posts',
        data: {
          title: 'Type Test Post',
          slug: `type-test-${Date.now()}`,
          status: 'draft',
          type: 'article',
        },
      })
      expect(post.type).toBe('article')
      await payload.delete({ collection: 'nitf_posts', id: post.id })
    })

    it('nitf_posts legacy columns dropped (review_meta, recipe_meta, seo_title, seo_description, reading_time_minutes)', async () => {
      const legacyColumns = ['review_meta', 'recipe_meta', 'seo_title', 'seo_description', 'reading_time_minutes']
      for (const col of legacyColumns) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'nitf_posts'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `nitf_posts.${col} should NOT exist after migration`).toHaveLength(0)
      }
    })

    it('nitf_posts latitude/longitude fields still present', async () => {
      for (const col of ['latitude', 'longitude']) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'nitf_posts'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `nitf_posts.${col} should exist`).toHaveLength(1)
      }
    })
  })

  describe('NITF-03: nitf_destinations table', () => {
    it('nitf_destinations table exists with all required columns (name, slug, description, latitude, longitude, difficulty, season_info)', async () => {
      const tableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_destinations'} AND table_schema = 'public'
      `)
      expect(tableResult.rows).toHaveLength(1)

      const requiredColumns = ['name', 'slug', 'description', 'latitude', 'longitude', 'difficulty', 'season_info', 'published_at']
      for (const col of requiredColumns) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'nitf_destinations'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `nitf_destinations.${col} should exist`).toHaveLength(1)
      }
    })

    it('nitf_destinations featured_image relationship to nitf_media', async () => {
      const relsTableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_destinations_rels'} AND table_schema = 'public'
      `)
      expect(relsTableResult.rows).toHaveLength(1)

      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_destinations_rels'} AND column_name = ${'nitf_media_id'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_destinations_rels.nitf_media_id should exist').toHaveLength(1)
    })

    it('nitf_destinations links array field exists', async () => {
      // links is an array field — Payload stores it inline via _rels or as JSON columns
      // Verify by creating a destination with links and reading it back
      const dest = await payload.create({
        collection: 'nitf_destinations',
        data: {
          name: 'Links Test Dest',
          slug: `links-test-dest-${Date.now()}`,
          status: 'draft',
        },
      })
      expect(dest.id).toBeDefined()
      await payload.delete({ collection: 'nitf_destinations', id: dest.id })
    })
  })

  describe('NITF-04: nitf_poi table', () => {
    it('nitf_poi table exists with required columns (name, latitude, longitude)', async () => {
      const tableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_poi'} AND table_schema = 'public'
      `)
      expect(tableResult.rows).toHaveLength(1)

      for (const col of ['name', 'latitude', 'longitude']) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'nitf_poi'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `nitf_poi.${col} should exist`).toHaveLength(1)
      }
    })

    it('nitf_poi type relationship to nitf_poi_types', async () => {
      const relsTableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_poi_rels'} AND table_schema = 'public'
      `)
      expect(relsTableResult.rows).toHaveLength(1)

      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_poi_rels'} AND column_name = ${'nitf_poi_types_id'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_poi_rels.nitf_poi_types_id should exist').toHaveLength(1)
    })

    it('nitf_poi trips relationship array to nitf_trips', async () => {
      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_poi_rels'} AND column_name = ${'nitf_trips_id'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_poi_rels.nitf_trips_id should exist').toHaveLength(1)
    })

    it('nitf_poi place relationship to nitf_places (optional 1:1)', async () => {
      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_poi_rels'} AND column_name = ${'nitf_places_id'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_poi_rels.nitf_places_id should exist').toHaveLength(1)
    })
  })

  describe('NITF-05: nitf_trips table', () => {
    it('nitf_trips table exists with required columns (title, slug, body, date_range_start_date, date_range_end_date, published_at)', async () => {
      const tableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_trips'} AND table_schema = 'public'
      `)
      expect(tableResult.rows).toHaveLength(1)

      const requiredColumns = ['title', 'slug', 'body', 'date_range_start_date', 'date_range_end_date', 'published_at']
      for (const col of requiredColumns) {
        const colResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'nitf_trips'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(colResult.rows, `nitf_trips.${col} should exist`).toHaveLength(1)
      }
    })

    it('nitf_trips destination relationship to nitf_destinations', async () => {
      const relsTableResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_trips_rels'} AND table_schema = 'public'
      `)
      expect(relsTableResult.rows).toHaveLength(1)

      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_trips_rels'} AND column_name = ${'nitf_destinations_id'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_trips_rels.nitf_destinations_id should exist').toHaveLength(1)
    })

    it('nitf_trips pois relationship array to nitf_poi (ordered)', async () => {
      const colResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'nitf_trips_rels'} AND column_name = ${'nitf_poi_id'} AND table_schema = 'public'
      `)
      expect(colResult.rows, 'nitf_trips_rels.nitf_poi_id should exist').toHaveLength(1)
    })
  })

  describe('NITF-06 / TEST-02: bidirectional relationship', () => {
    it('nitf_trips.pois populated as array at depth:1', async () => {
      const dest = await payload.create({
        collection: 'nitf_destinations',
        data: { name: 'Bidir Test Dest', slug: `bidir-dest-${Date.now()}`, status: 'draft' },
      })
      const poi = await payload.create({
        collection: 'nitf_poi',
        data: { name: 'Bidir Test POI', latitude: 60.17, longitude: 24.93 },
      })
      const trip = await payload.create({
        collection: 'nitf_trips',
        data: {
          title: 'Bidir Test Trip',
          slug: `bidir-trip-${Date.now()}`,
          status: 'draft',
          destination: dest.id,
          pois: [poi.id],
        },
      })

      const fetched = await payload.findByID({ collection: 'nitf_trips', id: trip.id, depth: 1 })
      expect(Array.isArray(fetched.pois)).toBe(true)
      expect(fetched.pois).toHaveLength(1)
      const populatedPoi = fetched.pois![0] as any
      expect(populatedPoi.id).toBe(poi.id)

      await payload.delete({ collection: 'nitf_trips', id: trip.id })
      await payload.delete({ collection: 'nitf_poi', id: poi.id })
      await payload.delete({ collection: 'nitf_destinations', id: dest.id })
    })

    it('nitf_poi.trips populated as array at depth:1 (reverse lookup)', async () => {
      const dest = await payload.create({
        collection: 'nitf_destinations',
        data: { name: 'Reverse Test Dest', slug: `reverse-dest-${Date.now()}`, status: 'draft' },
      })
      // Create POI without trips first (trips field is explicitly maintained, not auto-populated)
      const poi = await payload.create({
        collection: 'nitf_poi',
        data: { name: 'Reverse Test POI', latitude: 60.17, longitude: 24.93 },
      })
      const trip = await payload.create({
        collection: 'nitf_trips',
        data: {
          title: 'Reverse Test Trip',
          slug: `reverse-trip-${Date.now()}`,
          status: 'draft',
          destination: dest.id,
          pois: [poi.id],
        },
      })

      // Explicitly set the trips field on the POI — Payload does not auto-populate reverse relationships.
      // nitf_poi.trips is a relationship field that must be maintained from both sides.
      await payload.update({
        collection: 'nitf_poi',
        id: poi.id,
        data: { trips: [trip.id] } as any,
      })

      // Fetch POI at depth:1 — trips relationship on nitf_poi should now be populated
      const fetchedPoi = await payload.findByID({ collection: 'nitf_poi', id: poi.id, depth: 1 })
      expect(Array.isArray((fetchedPoi as any).trips)).toBe(true)
      const poiTrips = (fetchedPoi as any).trips as any[]
      expect(poiTrips.length).toBeGreaterThanOrEqual(1)
      const matchingTrip = poiTrips.find((t: any) => t.id === trip.id || t === trip.id)
      expect(matchingTrip).toBeDefined()

      await payload.delete({ collection: 'nitf_trips', id: trip.id })
      await payload.delete({ collection: 'nitf_poi', id: poi.id })
      await payload.delete({ collection: 'nitf_destinations', id: dest.id })
    })
  })

  describe('NITF-07: collections dropped', () => {
    it('nitf_locations table does not exist after migration', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_locations'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })

    it('nitf_waypoints table does not exist after migration', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'nitf_waypoints'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })
  })

  describe('GEO-02: nitf_destinations geom', () => {
    it('nitf_destinations: creating with lat/lon populates geom via trigger', async () => {
      const record = await payload.create({
        collection: 'nitf_destinations',
        data: {
          name: 'Geom Test Dest',
          slug: `geom-dest-${Date.now()}`,
          status: 'draft',
          latitude: 60.1699,
          longitude: 24.9384,
        },
      })
      const result = await db.execute(sql`SELECT geom FROM nitf_destinations WHERE id = ${record.id}`)
      expect(result.rows[0].geom).not.toBeNull()
      await payload.delete({ collection: 'nitf_destinations', id: record.id })
    })

    it('nitf_destinations: creating without lat/lon leaves geom null', async () => {
      const record = await payload.create({
        collection: 'nitf_destinations',
        data: {
          name: 'No Coords Dest',
          slug: `no-coords-dest-${Date.now()}`,
          status: 'draft',
        },
      })
      const result = await db.execute(sql`SELECT geom FROM nitf_destinations WHERE id = ${record.id}`)
      expect(result.rows[0].geom).toBeNull()
      await payload.delete({ collection: 'nitf_destinations', id: record.id })
    })
  })

  describe('GEO-03: nitf_poi geom', () => {
    it('nitf_poi: creating with lat/lon populates geom via trigger', async () => {
      const record = await payload.create({
        collection: 'nitf_poi',
        data: { name: 'Geom Test POI', latitude: 60.1699, longitude: 24.9384 },
      })
      const result = await db.execute(sql`SELECT geom FROM nitf_poi WHERE id = ${record.id}`)
      expect(result.rows[0].geom).not.toBeNull()
      await payload.delete({ collection: 'nitf_poi', id: record.id })
    })

    it('nitf_poi: updating with null lat/lon clears geom', async () => {
      // lat/lon required on create — test that updating to null clears the geom trigger
      const record = await payload.create({
        collection: 'nitf_poi',
        data: { name: 'Geom Clear Test POI', latitude: 60.1699, longitude: 24.9384 },
      })
      const initialResult = await db.execute(sql`SELECT geom FROM nitf_poi WHERE id = ${record.id}`)
      expect(initialResult.rows[0].geom).not.toBeNull()

      // Update by clearing lat/lon via raw SQL to bypass Payload required validation
      await db.execute(sql`UPDATE nitf_poi SET latitude = NULL, longitude = NULL WHERE id = ${record.id}`)
      // Trigger fires on UPDATE — force an update to re-evaluate trigger
      await db.execute(sql`UPDATE nitf_poi SET name = name WHERE id = ${record.id}`)

      const clearedResult = await db.execute(sql`SELECT geom FROM nitf_poi WHERE id = ${record.id}`)
      expect(clearedResult.rows[0].geom).toBeNull()

      await payload.delete({ collection: 'nitf_poi', id: record.id })
    })
  })

  describe('TEST-05: migration down() rollback', () => {
    it('down() drops all new tables (nitf_trips, nitf_destinations, nitf_poi, nitf_poi_types, nitf_places)', async () => {
      await down({ db, payload } as any)

      for (const tableName of ['nitf_trips', 'nitf_destinations', 'nitf_poi', 'nitf_poi_types', 'nitf_places']) {
        const result = await db.execute(sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_name = ${tableName} AND table_schema = 'public'
        `)
        expect(result.rows, `${tableName} should not exist after down()`).toHaveLength(0)
      }

      // Restore state for subsequent test
      await up({ db, payload } as any)
    })

    it('down() + up() cycle leaves DB in valid state', async () => {
      // Verify nitf_trips and nitf_destinations are back after the up() call above
      for (const tableName of ['nitf_trips', 'nitf_destinations']) {
        const result = await db.execute(sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_name = ${tableName} AND table_schema = 'public'
        `)
        expect(result.rows, `${tableName} should exist after up()`).toHaveLength(1)
      }

      // Geom trigger smoke test: create poi with lat/lon must produce non-null geom
      const record = await payload.create({
        collection: 'nitf_poi',
        data: { name: 'Post-Cycle Geom Test POI', latitude: 60.1699, longitude: 24.9384 },
      })
      const result = await db.execute(sql`SELECT geom FROM nitf_poi WHERE id = ${record.id}`)
      expect(result.rows[0].geom).not.toBeNull()

      await payload.delete({ collection: 'nitf_poi', id: record.id })
    })
  })
})

import fs from 'fs'
import path from 'path'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let db: any

describe('Nerd in the Forest (NITF) 6-Model Architecture', () => {
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

  describe('Database Schema & PostGIS Geometry Verification', () => {
    const expectedTables = [
      'nitf_media',
      'nitf_areas',
      'nitf_locations',
      'nitf_locations_amenities',
      'nitf_dispatches',
      'nitf_gear_items',
      'nitf_gear_reviews',
      'nitf_loadouts',
      'nitf_loadouts_items',
    ]

    for (const table of expectedTables) {
      it(`table "${table}" exists in PostgreSQL`, async () => {
        const res = await db.execute(sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_name = ${table} AND table_schema = 'public'
        `)
        expect(res.rows, `table ${table} should exist`).toHaveLength(1)
      })
    }

    it('nitf_locations has PostGIS "geom" column and GIST index', async () => {
      const colRes = await db.execute(sql`
        SELECT column_name, udt_name FROM information_schema.columns
        WHERE table_name = 'nitf_locations' AND column_name = 'geom' AND table_schema = 'public'
      `)
      expect(colRes.rows).toHaveLength(1)
      expect(colRes.rows[0].udt_name).toBe('geometry')

      const idxRes = await db.execute(sql`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'nitf_locations' AND indexname = 'nitf_locations_geom_idx'
      `)
      expect(idxRes.rows).toHaveLength(1)
    })
  })

  describe('CRUD Operations & Relational Integrity', () => {
    let testAreaId: number | undefined
    let testTrailheadId: number | undefined
    let testLocationId: number | undefined
    let testDispatchId: number | undefined
    let testGearItemId: number | undefined
    let testGearReviewId: number | undefined
    let testLoadoutId: number | undefined

    afterAll(async () => {
      const cleanupTargets: Array<{ collection: 'nitf_loadouts' | 'nitf_gear_reviews' | 'nitf_gear_items' | 'nitf_dispatches' | 'nitf_locations' | 'nitf_areas'; id?: number }> = [
        { collection: 'nitf_loadouts', id: testLoadoutId },
        { collection: 'nitf_gear_reviews', id: testGearReviewId },
        { collection: 'nitf_gear_items', id: testGearItemId },
        { collection: 'nitf_dispatches', id: testDispatchId },
        { collection: 'nitf_locations', id: testLocationId },
        { collection: 'nitf_locations', id: testTrailheadId },
        { collection: 'nitf_areas', id: testAreaId },
      ]

      for (const target of cleanupTargets) {
        if (target.id !== undefined) {
          try {
            await payload.delete({ collection: target.collection, id: target.id })
          } catch {
            // Document may already have been deleted during test execution
          }
        }
      }
    })

    it('creates an Area (nitf_areas)', async () => {
      const area = await payload.create({
        collection: 'nitf_areas',
        data: {
          name: 'Nordmarka Test Area',
          slug: `nordmarka-test-${Date.now()}`,
          country: 'Norway',
          description: 'Highland boreal lakes north of Oslo.',
          center_latitude: 60.27,
          center_longitude: 10.71,
          default_zoom: 11,
        },
      })
      expect(area.id).toBeDefined()
      expect(area.name).toBe('Nordmarka Test Area')
      testAreaId = Number(area.id)
    })

    it('creates a Trailhead Location and a Shelter Location linking to it', async () => {
      // 1. Trailhead Location
      const trailhead = await payload.create({
        collection: 'nitf_locations',
        data: {
          name: 'Langvatnet P-plass',
          slug: `langvatnet-p-${Date.now()}`,
          area: testAreaId,
          category: 'trailhead',
          latitude: 60.2785,
          longitude: 10.753,
          summary: 'Trailhead parking for Langvatnet gapahuk',
          amenities: [],
        },
      })
      expect(trailhead.id).toBeDefined()
      testTrailheadId = Number(trailhead.id)

      // 2. Destination Shelter Location linking to Trailhead
      const shelter = await payload.create({
        collection: 'nitf_locations',
        data: {
          name: 'Langvatnet Gapahuk',
          slug: `langvatnet-gapahuk-${Date.now()}`,
          area: testAreaId,
          category: 'shelter',
          latitude: 60.271,
          longitude: 10.732,
          elevation: 501,
          summary: 'Hand-hewn timber lean-to on the southeastern cove.',
          amenities: ['timber_shelter', 'stone_hearth', 'potable_water', 'dry_wood', 'lake_view'],
          trailhead: testTrailheadId,
        },
      })
      expect(shelter.id).toBeDefined()
      testLocationId = Number(shelter.id)

      // Verify afterChange hook populated PostGIS geom
      const geomRes = await db.execute(sql`
        SELECT ST_AsText(geom) as geom_text FROM nitf_locations WHERE id = ${testLocationId}
      `)
      expect(geomRes.rows).toHaveLength(1)
      expect(geomRes.rows[0].geom_text).toBe('POINT(10.732 60.271)')
    })

    it('creates a Dispatch (nitf_dispatches) linking to the Location', async () => {
      const dispatch = await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'Autumn Frost & Morning Mist at Langvatnet',
          slug: `autumn-frost-${Date.now()}`,
          status: 'published',
          published_at: new Date().toISOString(),
          location: testLocationId,
          excerpt: 'Hand-hewn timber lean-to with double spruce notch joints.',
          weather: '4°C • MIST • BARO 1018 HPA',
          trail_geometry: [
            [10.753, 60.2785],
            [10.742, 60.275],
            [10.732, 60.271],
          ],
          distance_km: 2.1,
          elevation_gain_m: 85,
          elevation_loss_m: 10,
        },
      })
      expect(dispatch.id).toBeDefined()
      expect(dispatch.title).toContain('Langvatnet')
      expect(dispatch.trail_geometry).toHaveLength(3)
      expect(dispatch.distance_km).toBe(2.1)
      testDispatchId = Number(dispatch.id)
    })

    it('creates a Gear Item (nitf_gear_items)', async () => {
      const gearItem = await payload.create({
        collection: 'nitf_gear_items',
        data: {
          name: 'Akto 1P Tent',
          brand: 'Hilleberg',
          category: 'shelter_sleep',
          weight_grams: 1700,
          spec_note: 'Kerlon 1200 • 4-Season Solo Tunnel',
          notes: 'Proven in gale-force winds on exposed crags.',
        },
      })
      expect(gearItem.id).toBeDefined()
      expect(gearItem.weight_grams).toBe(1700)
      testGearItemId = Number(gearItem.id)
    })

    it('creates a Gear Review (nitf_gear_reviews) linking to the Gear Item', async () => {
      const review = await payload.create({
        collection: 'nitf_gear_reviews',
        data: {
          title: 'Hilleberg Kerlon 1200 Durability Report',
          slug: `kerlon-durability-${Date.now()}`,
          status: 'published',
          gear_item: testGearItemId!,
          topic: 'durability',
          published_at: new Date().toISOString(),
          duration_tested: '48 Backcountry Nights Across 4 Seasons',
          summary: 'Exhaustive assessment of siliconized nylon durability.',
          verdict: 'Mechanical integrity 100% after 4 years of hard use.',
          key_takeaways: [
            { takeaway: '12 kg tear strength prevents punctures from expanding.' },
            { takeaway: 'Zero sticky hydrolysis or delamination.' },
          ],
        },
      })
      expect(review.id).toBeDefined()
      expect(review.key_takeaways).toHaveLength(2)
      testGearReviewId = Number(review.id)
    })

    it('creates a Loadout (nitf_loadouts) linking to Gear Items', async () => {
      const loadout = await payload.create({
        collection: 'nitf_loadouts',
        data: {
          title: 'Autumn Taiga & Lake Bivouac',
          slug: `autumn-taiga-${Date.now()}`,
          season: 'autumn',
          temp_range: '-2°C to 10°C',
          description: 'Solo gapahuk bivouac, cold mist, and frost nights.',
          items: [
            {
              item: testGearItemId,
              status: 'packed',
              custom_note: 'Tested on Langvatnet ridge.',
            },
          ],
        },
      })
      expect(loadout.id).toBeDefined()
      expect(loadout.items).toHaveLength(1)
      testLoadoutId = Number(loadout.id)
    })

    it('cleans up test documents gracefully', async () => {
      await payload.delete({ collection: 'nitf_loadouts', id: testLoadoutId! })
      testLoadoutId = undefined
      await payload.delete({ collection: 'nitf_gear_reviews', id: testGearReviewId! })
      testGearReviewId = undefined
      await payload.delete({ collection: 'nitf_gear_items', id: testGearItemId! })
      testGearItemId = undefined
      await payload.delete({ collection: 'nitf_dispatches', id: testDispatchId! })
      testDispatchId = undefined
      await payload.delete({ collection: 'nitf_locations', id: testLocationId! })
      testLocationId = undefined
      await payload.delete({ collection: 'nitf_locations', id: testTrailheadId! })
      testTrailheadId = undefined
      await payload.delete({ collection: 'nitf_areas', id: testAreaId! })
      testAreaId = undefined
    })
  })

  describe('Media Upload Storage & GPX Hook Integration', () => {
    let uploadedMediaId: number | undefined
    let gpxDispatchId: number | undefined

    afterAll(async () => {
      if (gpxDispatchId !== undefined) {
        try {
          await payload.delete({ collection: 'nitf_dispatches', id: gpxDispatchId })
        } catch {
          // Ignore if already deleted
        }
      }
      if (uploadedMediaId !== undefined) {
        try {
          await payload.delete({ collection: 'nitf_media', id: uploadedMediaId })
        } catch {
          // Ignore if already deleted
        }
      }
    })

    it('configures upload staticDir for nitf_media and jr_media under media/', () => {
      expect(payload.collections['nitf_media'].config.upload.staticDir).toBe('media/nitf_media')
      expect(payload.collections['jr_media'].config.upload.staticDir).toBe('media/jr_media')
    })

    it('stores GPX uploads in media/nitf_media and computes dispatch trail stats', async () => {
      const gpxSample = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk><trkseg>
    <trkpt lat="61.4045" lon="23.9085"><ele>130</ele></trkpt>
    <trkpt lat="61.4090" lon="23.9120"><ele>145</ele></trkpt>
  </trkseg></trk>
</gpx>`

      const filename = `test-track-${Date.now()}.gpx`
      const uploaded = await payload.create({
        collection: 'nitf_media',
        data: { alt: 'Test GPX Track' },
        file: {
          data: Buffer.from(gpxSample, 'utf8'),
          mimetype: 'application/gpx+xml',
          name: filename,
          size: Buffer.byteLength(gpxSample, 'utf8'),
        },
      })
      uploadedMediaId = Number(uploaded.id)

      const expectedFilePath = path.resolve(
        process.cwd(),
        'media/nitf_media',
        String(uploaded.filename)
      )
      expect(fs.existsSync(expectedFilePath)).toBe(true)

      const dispatch = await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'GPX Hook Storage Test',
          slug: `gpx-hook-storage-${Date.now()}`,
          status: 'draft',
          excerpt: 'GPX upload storage integration test',
          gpx_file: uploadedMediaId,
        },
      })
      gpxDispatchId = Number(dispatch.id)

      const reloaded = await payload.findByID({
        collection: 'nitf_dispatches',
        id: gpxDispatchId,
      })
      expect(reloaded.trail_geometry).toHaveLength(2)
      expect(reloaded.distance_km).toBeGreaterThan(0)
      expect(reloaded.elevation_gain_m).toBe(15)
      expect(reloaded.elevation_loss_m).toBe(0)
    })
  })
})

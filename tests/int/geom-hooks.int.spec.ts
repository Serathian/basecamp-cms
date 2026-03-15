import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

describe('Geom Auto-Population — afterChange hooks', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    if (payload?.db) {
      await payload.db.destroy!()
    }
  })

  it('nitf_posts: creating with lat/lon populates geom', async () => {
    const post = await payload.create({
      collection: 'nitf_posts',
      data: {
        title: 'Geom Test Post',
        slug: `geom-test-post-${Date.now()}`,
        status: 'published',
        type: 'general',
        latitude: 60.1699,
        longitude: 24.9384,
      },
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM nitf_posts WHERE id = ${post.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'nitf_posts', id: post.id })
  })

  it('nitf_trails: creating with latitude_start/longitude_start populates geom', async () => {
    const trail = await payload.create({
      collection: 'nitf_trails',
      data: {
        title: 'Geom Test Trail',
        status: 'published',
        latitude_start: 60.5,
        longitude_start: 25.0,
      },
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM nitf_trails WHERE id = ${trail.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'nitf_trails', id: trail.id })
  })

  it('nitf_waypoints: creating with lat/lon populates geom', async () => {
    // Create a trail first (required relationship)
    const trail = await payload.create({
      collection: 'nitf_trails',
      data: {
        title: 'Waypoint Test Trail',
        status: 'published',
      },
    })

    const waypoint = await payload.create({
      collection: 'nitf_waypoints',
      data: {
        name: 'Geom Test Waypoint',
        type: 'camp',
        trail: trail.id,
        latitude: 61.0,
        longitude: 26.0,
      },
      draft: false,
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM nitf_waypoints WHERE id = ${waypoint.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'nitf_waypoints', id: waypoint.id })
    await payload.delete({ collection: 'nitf_trails', id: trail.id })
  })

  it('nitf_locations: creating with lat/lon populates geom', async () => {
    const location = await payload.create({
      collection: 'nitf_locations',
      data: {
        name: 'Geom Test Location',
        place_type: 'town',
        marker_type: 'day-visit',
        latitude: 62.0,
        longitude: 27.0,
      },
      draft: false,
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM nitf_locations WHERE id = ${location.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'nitf_locations', id: location.id })
  })

  it('rotr_posts: creating with lat/lon populates geom', async () => {
    const post = await payload.create({
      collection: 'rotr_posts',
      data: {
        title: 'Geom Test ROTR Post',
        slug: `geom-test-rotr-post-${Date.now()}`,
        status: 'published',
        latitude: 63.0,
        longitude: 28.0,
      },
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM rotr_posts WHERE id = ${post.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'rotr_posts', id: post.id })
  })

  it('rotr_locations: creating with lat/lon populates geom', async () => {
    const location = await payload.create({
      collection: 'rotr_locations',
      data: {
        name: 'Geom Test ROTR Location',
        place_type: 'city',
        marker_type: 'city-stop',
        latitude: 64.0,
        longitude: 29.0,
      },
      draft: false,
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM rotr_locations WHERE id = ${location.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'rotr_locations', id: location.id })
  })

  it('Edge case: creating without coordinates does not error', async () => {
    const post = await payload.create({
      collection: 'nitf_posts',
      data: {
        title: 'No Coords Post',
        slug: `no-coords-${Date.now()}`,
        status: 'published',
        type: 'general',
        // No latitude/longitude
      },
    })

    const db = (payload.db as any).drizzle
    const result = await db.execute(sql`SELECT geom FROM nitf_posts WHERE id = ${post.id}`)
    expect(result.rows[0].geom).toBeNull()

    await payload.delete({ collection: 'nitf_posts', id: post.id })
  })

  it('Update: changing coordinates updates geom', async () => {
    const post = await payload.create({
      collection: 'rotr_posts',
      data: {
        title: 'Update Coords Test',
        slug: `update-coords-${Date.now()}`,
        status: 'published',
        latitude: 60.0,
        longitude: 25.0,
      },
    })

    const db = (payload.db as any).drizzle

    // Verify initial geom
    const initialResult = await db.execute(sql`SELECT geom FROM rotr_posts WHERE id = ${post.id}`)
    expect(initialResult.rows[0].geom).not.toBeNull()

    // Update coordinates
    await payload.update({
      collection: 'rotr_posts',
      id: post.id,
      data: {
        latitude: 65.0,
        longitude: 30.0,
      },
    })

    // Query geom and extract coordinates
    const updatedResult = await db.execute(
      sql`SELECT ST_X(geom) as lon, ST_Y(geom) as lat FROM rotr_posts WHERE id = ${post.id}`,
    )

    expect(updatedResult.rows[0].lat).toBeCloseTo(65.0, 4)
    expect(updatedResult.rows[0].lon).toBeCloseTo(30.0, 4)

    await payload.delete({ collection: 'rotr_posts', id: post.id })
  })
})

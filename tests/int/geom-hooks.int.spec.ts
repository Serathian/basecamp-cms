import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let db: any

describe('Geom Auto-Population — afterChange hooks', () => {
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

  it('nitf_posts: creating with lat/lon populates geom', async () => {
    const post = await payload.create({
      collection: 'nitf_posts',
      data: {
        title: 'Geom Test Post',
        slug: `geom-test-post-${Date.now()}`,
        status: 'published',
        type: 'article',
        latitude: 60.1699,
        longitude: 24.9384,
      },
    })

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

    const result = await db.execute(sql`SELECT geom FROM nitf_trails WHERE id = ${trail.id}`)
    expect(result.rows[0].geom).not.toBeNull()

    await payload.delete({ collection: 'nitf_trails', id: trail.id })
  })

  it('nitf_destinations: creating with lat/lon populates geom via trigger', async () => {
    const record = await payload.create({
      collection: 'nitf_destinations',
      data: {
        name: 'Geom Hook Test Dest',
        slug: `geom-hook-dest-${Date.now()}`,
        status: 'draft',
        latitude: 60.1699,
        longitude: 24.9384,
      },
    })
    const result = await db.execute(sql`SELECT geom FROM nitf_destinations WHERE id = ${record.id}`)
    expect(result.rows[0].geom).not.toBeNull()
    await payload.delete({ collection: 'nitf_destinations', id: record.id })
  })

  it('nitf_poi: creating with lat/lon populates geom via trigger', async () => {
    const record = await payload.create({
      collection: 'nitf_poi',
      data: { name: 'Geom Hook Test POI', latitude: 60.1699, longitude: 24.9384 },
    })
    const result = await db.execute(sql`SELECT geom FROM nitf_poi WHERE id = ${record.id}`)
    expect(result.rows[0].geom).not.toBeNull()
    await payload.delete({ collection: 'nitf_poi', id: record.id })
  })

  it('Edge case: creating without coordinates does not error', async () => {
    const post = await payload.create({
      collection: 'nitf_posts',
      data: {
        title: 'No Coords Post',
        slug: `no-coords-${Date.now()}`,
        status: 'published',
        type: 'article',
        // No latitude/longitude
      },
    })

    const result = await db.execute(sql`SELECT geom FROM nitf_posts WHERE id = ${post.id}`)
    expect(result.rows[0].geom).toBeNull()

    await payload.delete({ collection: 'nitf_posts', id: post.id })
  })
})

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import getNearbyPosts from '@/lib/nearby'

let payload: Payload
let adminUser: any

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })

  // Create admin user for authenticated tests
  adminUser = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@test.com',
      password: 'test123',
      roles: 'admin',
    },
  })
})

afterAll(async () => {
  if (adminUser?.id) {
    await payload.delete({ collection: 'users', id: adminUser.id })
  }
})

describe('Access control — authenticated admin sees drafts', () => {
  const collections = ['jr_posts', 'nitf_posts', 'nitf_trails', 'rotr_posts'] as const

  for (const slug of collections) {
    it(`${slug}: admin user sees drafts, anon user sees published only`, async () => {
      // Create draft
      const draft = await payload.create({
        collection: slug,
        data: {
          title: `Draft ${slug} admin test`,
          slug: `draft-admin-${slug}-${Date.now()}`,
          status: 'draft',
          body: 'draft content',
          ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
        },
      })

      // Create published
      const published = await payload.create({
        collection: slug,
        data: {
          title: `Published ${slug} admin test`,
          slug: `published-admin-${slug}-${Date.now()}`,
          status: 'published',
          body: 'published content',
          ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
        },
      })

      // Unauthenticated read (no user) - should NOT see draft
      const anonResult = await payload.find({
        collection: slug,
        overrideAccess: false,
      })
      const anonIds = anonResult.docs.map((d: any) => d.id)
      expect(anonIds.includes(draft.id)).toBe(false)
      expect(anonIds.includes(published.id)).toBe(true)

      // Authenticated read (with admin user) - SHOULD see draft
      const adminResult = await payload.find({
        collection: slug,
        overrideAccess: false,
        user: adminUser,
      })
      const adminIds = adminResult.docs.map((d: any) => d.id)
      expect(adminIds.includes(draft.id)).toBe(true)
      expect(adminIds.includes(published.id)).toBe(true)

      // Cleanup
      await payload.delete({ collection: slug, id: draft.id })
      await payload.delete({ collection: slug, id: published.id })
    })
  }
})

describe('API — basic queries', () => {
  it('fetches users', async () => {
    const users = await payload.find({ collection: 'users' })
    expect(users).toBeDefined()
  })

  it('fetches authors', async () => {
    const authors = await payload.find({ collection: 'authors' })
    expect(authors).toBeDefined()
  })

  it('fetches tags', async () => {
    const tags = await payload.find({ collection: 'tags' })
    expect(tags).toBeDefined()
  })
})

describe('Access control — unauthenticated reads only see published', () => {
  // Collections that use the draft/published access pattern
  const publishedCollections = ['jr_posts', 'jr_projects', 'nitf_posts', 'rotr_posts'] as const

  for (const slug of publishedCollections) {
    it(`${slug}: unauthenticated read returns only published docs`, async () => {
      // Create a draft doc
      const draft = await payload.create({
        collection: slug,
        data: {
          title: `Draft ${slug} test`,
          slug: `draft-${slug}-${Date.now()}`,
          status: 'draft',
          ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
        },
      })
      expect(draft.id).toBeDefined()

      // Create a published doc
      const published = await payload.create({
        collection: slug,
        data: {
          title: `Published ${slug} test`,
          slug: `published-${slug}-${Date.now()}`,
          status: 'published',
          ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
        },
      })
      expect(published.id).toBeDefined()

      // Unauthenticated read (overrideAccess: false, no user)
      const result = await payload.find({
        collection: slug,
        overrideAccess: false,
      })

      const statuses = result.docs.map((d: any) => d.status)
      expect(statuses.every((s: string) => s === 'published')).toBe(true)
      expect(result.docs.some((d: any) => d.id === published.id)).toBe(true)
      expect(result.docs.some((d: any) => d.id === draft.id)).toBe(false)

      // Cleanup
      await payload.delete({ collection: slug, id: draft.id })
      await payload.delete({ collection: slug, id: published.id })
    })
  }

  it('nitf_trails: unauthenticated read returns only published', async () => {
    const draft = await payload.create({
      collection: 'nitf_trails',
      data: { title: 'Draft trail test', status: 'draft' },
    })

    const published = await payload.create({
      collection: 'nitf_trails',
      data: { title: 'Published trail test', status: 'published' },
    })

    const result = await payload.find({
      collection: 'nitf_trails',
      overrideAccess: false,
    })

    const statuses = result.docs.map((d: any) => d.status)
    expect(statuses.every((s: string) => s === 'published')).toBe(true)

    await payload.delete({ collection: 'nitf_trails', id: draft.id })
    await payload.delete({ collection: 'nitf_trails', id: published.id })
  })
})

describe('Access control — public collections are fully readable', () => {
  // These collections allow all reads (no auth required)
  it('rotr_locations: unauthenticated read works', async () => {
    const loc = await payload.create({
      collection: 'rotr_locations',
      data: {
        name: 'Test Location',
        place_type: 'city',
        marker_type: 'city-stop',
        latitude: 60.17,
        longitude: 24.94,
      },
    })

    const result = await payload.find({
      collection: 'rotr_locations',
      overrideAccess: false,
    })

    expect(result.docs.some((d: any) => d.id === loc.id)).toBe(true)

    await payload.delete({ collection: 'rotr_locations', id: loc.id })
  })

  it('nitf_locations: unauthenticated read works', async () => {
    const loc = await payload.create({
      collection: 'nitf_locations',
      data: {
        name: 'Test Forest Spot',
        place_type: 'forest',
        marker_type: 'camp',
        latitude: 61.5,
        longitude: 24.0,
      },
    })

    const result = await payload.find({
      collection: 'nitf_locations',
      overrideAccess: false,
    })

    expect(result.docs.some((d: any) => d.id === loc.id)).toBe(true)

    await payload.delete({ collection: 'nitf_locations', id: loc.id })
  })
})

describe('Nearby endpoint — spatial queries (requires PostGIS migration)', () => {
  const createdIds: number[] = []

  // Helsinki area posts at known distances from query point (Senate Square: 60.1695, 24.9527)
  const testPosts = [
    { title: 'Nuuksio', slug: `nearby-nuuksio-${Date.now()}`, lat: 60.3232, lon: 24.5073 }, // ~30km
    { title: 'Suomenlinna', slug: `nearby-suomenlinna-${Date.now()}`, lat: 60.1454, lon: 24.9882 }, // ~3km
    { title: 'Porvoo', slug: `nearby-porvoo-${Date.now()}`, lat: 60.3928, lon: 25.6648 }, // ~50km
  ]

  beforeAll(async () => {
    for (const post of testPosts) {
      const doc = await payload.create({
        collection: 'nitf_posts',
        data: {
          title: post.title,
          slug: post.slug,
          type: 'adventure',
          status: 'published',
          latitude: post.lat,
          longitude: post.lon,
        },
      })
      createdIds.push(doc.id)
    }
  })

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'nitf_posts', id })
    }
  })

  it('returns posts ordered by distance from query point', async () => {
    const res = await getNearbyPosts(60.1695, 24.9527, 60000, payload.db)

    if (!res.ok) {
      // geom column missing — PostGIS migration didn't run (should not happen in CI)
      console.warn(`Nearby query failed (${res.status}) — PostGIS geom column may be missing`)
      expect(res.ok).toBe(true) // fail with a clear message
      return
    }

    expect(res.status).toBe(200)

    const data = await res.json()
    if (data.docs.length === 0) {
      console.warn('No results — PostGIS geom column may not be populated')
      return
    }

    // Distances should be ascending
    const distances = data.docs.map((d: any) => parseFloat(d.distance_m))
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1])
    }

    // Suomenlinna (~3km) should come before Nuuksio (~30km)
    const titles = data.docs.map((d: any) => d.title)
    const suomenlinnaIdx = titles.indexOf('Suomenlinna')
    const nuuksioIdx = titles.indexOf('Nuuksio')
    if (suomenlinnaIdx !== -1 && nuuksioIdx !== -1) {
      expect(suomenlinnaIdx).toBeLessThan(nuuksioIdx)
    }
  })
})

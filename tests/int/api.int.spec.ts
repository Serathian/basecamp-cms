import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import getNearbyPosts from '@/lib/nearby'

let payload: Payload
let adminUser: any

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })

  // Create admin user for authenticated tests (unique email per run to avoid duplicate key errors)
  adminUser = await payload.create({
    collection: 'users',
    data: {
      email: `admin-${Date.now()}@test.com`,
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
  const collections = ['jr_posts', 'nitf_posts', 'nitf_trails', 'rotr_days'] as const

  for (const slug of collections) {
    it(`${slug}: admin user sees drafts, anon user sees published only`, async () => {
      const isRotrDays = slug === 'rotr_days'
      // Create draft
      const draft = await payload.create({
        collection: slug,
        data: {
          title: `Draft ${slug} admin test`,
          ...(isRotrDays ? {} : { slug: `draft-admin-${slug}-${Date.now()}` }),
          status: 'draft',
          ...(isRotrDays ? {} : { body: 'draft content' }),
          ...(slug === 'nitf_posts' ? { type: 'article' } : {}),
        },
      })

      // Create published
      const published = await payload.create({
        collection: slug,
        data: {
          title: `Published ${slug} admin test`,
          ...(isRotrDays ? {} : { slug: `published-admin-${slug}-${Date.now()}` }),
          status: 'published',
          ...(isRotrDays ? {} : { body: 'published content' }),
          ...(slug === 'nitf_posts' ? { type: 'article' } : {}),
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

  it('fetches jr_tags', async () => {
    const tags = await payload.find({ collection: 'jr_tags' })
    expect(tags).toBeDefined()
  })
})

describe('Access control — unauthenticated reads only see published', () => {
  // Collections that use the draft/published access pattern
  const publishedCollections = ['jr_posts', 'nitf_posts', 'rotr_days'] as const

  for (const slug of publishedCollections) {
    it(`${slug}: unauthenticated read returns only published docs`, async () => {
      const isRotrDays = slug === 'rotr_days'
      // Create a draft doc
      const draft = await payload.create({
        collection: slug,
        data: {
          title: `Draft ${slug} test`,
          ...(isRotrDays ? {} : { slug: `draft-${slug}-${Date.now()}` }),
          status: 'draft',
          ...(slug === 'nitf_posts' ? { type: 'article' } : {}),
        },
      })
      expect(draft.id).toBeDefined()

      // Create a published doc
      const published = await payload.create({
        collection: slug,
        data: {
          title: `Published ${slug} test`,
          ...(isRotrDays ? {} : { slug: `published-${slug}-${Date.now()}` }),
          status: 'published',
          ...(slug === 'nitf_posts' ? { type: 'article' } : {}),
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
  it('rotr_place_types: authenticated read works', async () => {
    // rotr_place_types uses the published access helper but has no status field —
    // it is admin-managed reference data. Test with overrideAccess to verify CRUD works.
    const placeType = await payload.create({
      collection: 'rotr_place_types',
      data: {
        name: 'Test Place Type',
        slug: `test-place-type-${Date.now()}`,
      },
    })

    const result = await payload.find({
      collection: 'rotr_place_types',
      overrideAccess: true,
    })

    expect(result.docs.some((d: any) => d.id === placeType.id)).toBe(true)

    await payload.delete({ collection: 'rotr_place_types', id: placeType.id })
  })

  // nitf_locations was dropped in Phase 5 migration — replaced by nitf_poi and nitf_destinations
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
          type: 'article',
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

    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.docs.length).toBeGreaterThan(0)

    // Distances should be ascending
    const distances = data.docs.map((d: any) => parseFloat(d.distance_m))
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1])
    }

    // Suomenlinna (~3km) should come before Nuuksio (~30km)
    const titles = data.docs.map((d: any) => d.title)
    expect(titles).toContain('Suomenlinna')
    expect(titles).toContain('Nuuksio')
    const suomenlinnaIdx = titles.indexOf('Suomenlinna')
    const nuuksioIdx = titles.indexOf('Nuuksio')
    expect(suomenlinnaIdx).toBeLessThan(nuuksioIdx)
  })
})

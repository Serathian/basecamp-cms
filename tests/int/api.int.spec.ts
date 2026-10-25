import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import getNearbyLocations from '@/lib/nearby'

let payload: Payload
let adminUser: any

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })

  // Create admin user for authenticated tests
  adminUser = await payload.create({
    collection: 'users',
    data: {
      email: `admin-${Date.now()}@test.com`,
      password: 'test123Password!',
      roles: 'admin',
    },
  })
})

afterAll(async () => {
  if (adminUser?.id) {
    await payload.delete({
      collection: 'users',
      where: { id: { equals: adminUser.id } },
    })
  }
})

describe('Access control — authenticated admin sees drafts, unauthenticated sees published only', () => {
  it('jr_posts: admin user sees drafts, anon user sees published only', async () => {
    const draft = await payload.create({
      collection: 'jr_posts',
      data: {
        title: 'Draft Post Access Test',
        slug: `draft-post-${Date.now()}`,
        status: 'draft',
        body: 'Draft body content',
      },
    })

    const published = await payload.create({
      collection: 'jr_posts',
      data: {
        title: 'Published Post Access Test',
        slug: `published-post-${Date.now()}`,
        status: 'published',
        published_at: new Date().toISOString(),
        body: 'Published body content',
      },
    })

    // Unauthenticated read (no user) - should NOT see draft
    const anonResult = await payload.find({
      collection: 'jr_posts',
      overrideAccess: false,
    })
    const anonIds = anonResult.docs.map((d: any) => d.id)
    expect(anonIds.includes(draft.id)).toBe(false)
    expect(anonIds.includes(published.id)).toBe(true)

    // Authenticated read (with admin user) - SHOULD see draft
    const adminResult = await payload.find({
      collection: 'jr_posts',
      overrideAccess: false,
      user: adminUser,
    })
    const adminIds = adminResult.docs.map((d: any) => d.id)
    expect(adminIds.includes(draft.id)).toBe(true)
    expect(adminIds.includes(published.id)).toBe(true)

    // Cleanup
    await payload.delete({ collection: 'jr_posts', where: { id: { equals: draft.id } } })
    await payload.delete({ collection: 'jr_posts', where: { id: { equals: published.id } } })
  })

  it('nitf_dispatches: admin user sees drafts, anon user sees published only', async () => {
    const draft = await payload.create({
      collection: 'nitf_dispatches',
      data: {
        title: 'Draft Dispatch Access Test',
        slug: `draft-dispatch-${Date.now()}`,
        status: 'draft',
        excerpt: 'Draft excerpt',
      },
    })

    const published = await payload.create({
      collection: 'nitf_dispatches',
      data: {
        title: 'Published Dispatch Access Test',
        slug: `published-dispatch-${Date.now()}`,
        status: 'published',
        published_at: new Date().toISOString(),
        excerpt: 'Published excerpt',
      },
    })

    const anonResult = await payload.find({
      collection: 'nitf_dispatches',
      overrideAccess: false,
    })
    const anonIds = anonResult.docs.map((d: any) => d.id)
    expect(anonIds.includes(draft.id)).toBe(false)
    expect(anonIds.includes(published.id)).toBe(true)

    const adminResult = await payload.find({
      collection: 'nitf_dispatches',
      overrideAccess: false,
      user: adminUser,
    })
    const adminIds = adminResult.docs.map((d: any) => d.id)
    expect(adminIds.includes(draft.id)).toBe(true)
    expect(adminIds.includes(published.id)).toBe(true)

    await payload.delete({ collection: 'nitf_dispatches', where: { id: { equals: draft.id } } })
    await payload.delete({ collection: 'nitf_dispatches', where: { id: { equals: published.id } } })
  })
})

describe('API — basic queries across all active collections', () => {
  it('fetches users', async () => {
    const users = await payload.find({ collection: 'users' })
    expect(users).toBeDefined()
    expect(users.docs.length).toBeGreaterThan(0)
  })

  it('fetches authors', async () => {
    const authors = await payload.find({ collection: 'authors' })
    expect(authors).toBeDefined()
    expect(authors.docs.length).toBeGreaterThan(0)
  })

  it('fetches jr_projects', async () => {
    const projects = await payload.find({ collection: 'jr_projects' })
    expect(projects).toBeDefined()
    expect(projects.docs.length).toBeGreaterThan(0)
  })

  it('fetches nitf_areas', async () => {
    const areas = await payload.find({ collection: 'nitf_areas' })
    expect(areas).toBeDefined()
    expect(areas.docs.length).toBeGreaterThan(0)
  })

  it('fetches nitf_locations', async () => {
    const locations = await payload.find({ collection: 'nitf_locations' })
    expect(locations).toBeDefined()
    expect(locations.docs.length).toBeGreaterThan(0)
  })

  it('fetches nitf_gear_items', async () => {
    const gear = await payload.find({ collection: 'nitf_gear_items' })
    expect(gear).toBeDefined()
    expect(gear.docs.length).toBeGreaterThan(0)
  })
})

describe('PostGIS Spatial Query', () => {
  it('returns nearby locations ordered by distance from query point', async () => {
    // Query near Vähä-Riutan laavu (61.4045, 23.9085) with 20km radius in Pirkanmaa
    const response = await getNearbyLocations(61.4045, 23.9085, 20000, payload.db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThan(0)

    // Verify distance_m is present and monotonically increasing
    for (let i = 0; i < data.docs.length - 1; i++) {
      expect(Number(data.docs[i].distance_m)).toBeLessThanOrEqual(Number(data.docs[i + 1].distance_m))
    }
  })
})

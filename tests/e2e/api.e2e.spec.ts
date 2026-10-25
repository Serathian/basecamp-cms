import { test, expect } from '@playwright/test'

test.describe('REST API Endpoints', () => {
  test('GET /api/jr_posts returns published posts and excludes drafts', async ({ request }) => {
    const res = await request.get('/api/jr_posts?limit=50')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(1)

    // Verify all returned posts are published
    for (const post of data.docs) {
      expect(post.status).toBe('published')
    }

    // Verify draft post is excluded
    const slugs = data.docs.map((d: any) => d.slug)
    expect(slugs).toContain('mapping-pirkanmaa-trails-postgis')
    expect(slugs).not.toContain('upcoming-basecamp-cms-roadmap')
  })

  test('GET /api/jr_projects returns seeded portfolio projects', async ({ request }) => {
    const res = await request.get('/api/jr_projects?limit=50')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(3)

    const slugs = data.docs.map((d: any) => d.slug)
    expect(slugs).toContain('basecamp-cms')
    expect(slugs).toContain('jake-reddy-com')
    expect(slugs).toContain('nerd-in-the-forest')
  })

  test('GET /api/nitf_areas returns Pirkanmaa area', async ({ request }) => {
    const res = await request.get('/api/nitf_areas')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(1)

    const areaNames = data.docs.map((a: any) => a.name)
    expect(areaNames).toContain('Pirkanmaa')
  })

  test('GET /api/nitf_locations returns Vähä-Riutan and Vähä-Kauas laavut with coordinates', async ({ request }) => {
    const res = await request.get('/api/nitf_locations?limit=50')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(2)

    // Verify Vähä-Riutan laavu
    const vahaRiutta = data.docs.find((l: any) => l.slug === 'vaha-riutta-laavu')
    expect(vahaRiutta).toBeDefined()
    expect(vahaRiutta.name).toBe('Vähä-Riutan laavu')
    expect(vahaRiutta.category).toBe('shelter')
    expect(Number(vahaRiutta.latitude)).toBeCloseTo(61.4045, 3)
    expect(Number(vahaRiutta.longitude)).toBeCloseTo(23.9085, 3)
    expect(Array.isArray(vahaRiutta.amenities)).toBe(true)

    // Verify Vähä-Kauas laavu
    const vahaKauas = data.docs.find((l: any) => l.slug === 'vaha-kauas-laavu')
    expect(vahaKauas).toBeDefined()
    expect(vahaKauas.name).toBe('Vähä-Kauas laavu')
    expect(vahaKauas.category).toBe('shelter')
    expect(Number(vahaKauas.latitude)).toBeCloseTo(61.3665, 3)
    expect(Number(vahaKauas.longitude)).toBeCloseTo(23.9246, 3)
  })

  test('GET /api/nitf_dispatches returns published dispatches only', async ({ request }) => {
    const res = await request.get('/api/nitf_dispatches')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(1)

    const slugs = data.docs.map((d: any) => d.slug)
    expect(slugs).toContain('autumn-night-vaha-riutta')
    expect(slugs).toContain('winter-trek-vaha-kauas')
    expect(slugs).not.toContain('surveying-glacial-cleft-helvetinkolu')
  })

  test('GET /api/nitf_gear_items returns field gear catalogue', async ({ request }) => {
    const res = await request.get('/api/nitf_gear_items')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(1)

    const gearNames = data.docs.map((g: any) => g.name)
    expect(gearNames).toContain('Akto 1P Tent')
  })

  test('GET /api/nitf_loadouts returns seasonal pack loadouts', async ({ request }) => {
    const res = await request.get('/api/nitf_loadouts')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.docs)).toBe(true)
    expect(data.docs.length).toBeGreaterThanOrEqual(1)

    const loadout = data.docs.find((l: any) => l.slug === 'autumn-taiga-solo')
    expect(loadout).toBeDefined()
    expect(loadout.season).toBe('autumn')
  })
})

import { test, expect } from '@playwright/test'

test.describe('Nerd in the Forest CMS API & Seeding E2E Tests (Pirkanmaa)', () => {
  test('authenticates admin user seeded by default', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[name="email"], input[type="email"]', 'dev@payloadcms.com')
    await page.fill('input[name="password"], input[type="password"]', 'test')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/)
  })

  test('serves seeded locations including Vähä-Riutan and Vähä-Kauas laavut via REST API', async ({ request }) => {
    const res = await request.get('/api/nitf_locations?limit=50')
    expect(res.ok()).toBeTruthy()

    const body = await res.json()
    expect(body.docs).toBeInstanceOf(Array)
    expect(body.docs.length).toBeGreaterThanOrEqual(2)

    // Verify Vähä-Riutan laavu is present
    const vahaRiutta = body.docs.find((l: any) => l.slug === 'vaha-riutta-laavu')
    expect(vahaRiutta).toBeDefined()
    expect(vahaRiutta.name).toBe('Vähä-Riutan laavu')
    expect(vahaRiutta.category).toBe('shelter')
    expect(vahaRiutta.latitude).toBeCloseTo(61.4045, 3)
    expect(vahaRiutta.longitude).toBeCloseTo(23.9085, 3)

    // Verify Vähä-Kauas laavu is present
    const vahaKauas = body.docs.find((l: any) => l.slug === 'vaha-kauas-laavu')
    expect(vahaKauas).toBeDefined()
    expect(vahaKauas.name).toBe('Vähä-Kauas laavu')
    expect(vahaKauas.category).toBe('shelter')
    expect(vahaKauas.latitude).toBeCloseTo(61.3665, 3)
    expect(vahaKauas.longitude).toBeCloseTo(23.9246, 3)
  })

  test('serves Pirkanmaa dispatches linking to surveyed shelters', async ({ request }) => {
    const res = await request.get('/api/nitf_dispatches?depth=2&limit=50')
    expect(res.ok()).toBeTruthy()

    const body = await res.json()
    expect(body.docs).toBeInstanceOf(Array)

    const dispatch = body.docs.find((d: any) => d.slug === 'autumn-night-vaha-riutta')
    expect(dispatch).toBeDefined()
    expect(dispatch.locations).toBeInstanceOf(Array)
    expect(dispatch.locations.length).toBeGreaterThanOrEqual(1)
  })
})

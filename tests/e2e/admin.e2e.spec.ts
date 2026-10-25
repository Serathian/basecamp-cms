import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/.*\/admin/)
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to users list view', async () => {
    await page.goto('/admin/collections/users')
    await expect(page).toHaveURL(/.*\/admin\/collections\/users/)
    const heading = page.locator('h1', { hasText: 'Users' }).first()
    await expect(heading).toBeVisible()
    // Verify admin user is visible in table
    await expect(page.locator('text=dev@payloadcms.com').first()).toBeVisible()
  })

  test('can navigate to jr_posts list view and see seeded posts', async () => {
    await page.goto('/admin/collections/jr_posts')
    await expect(page).toHaveURL(/.*\/admin\/collections\/jr_posts/)
    const heading = page.locator('h1', { hasText: 'Jr_posts' }).first()
    await expect(heading).toBeVisible()
    // Verify seeded posts appear in table
    await expect(page.locator('text=Building My Personal Site').first()).toBeVisible()
  })

  test('can navigate to nitf_locations list view and see seeded locations', async () => {
    await page.goto('/admin/collections/nitf_locations')
    await expect(page).toHaveURL(/.*\/admin\/collections\/nitf_locations/)
    const heading = page.locator('h1', { hasText: 'Nitf_locations' }).first()
    await expect(heading).toBeVisible()
    // Verify seeded location appears in table
    await expect(page.locator('text=Vähä-Riutan laavu').first()).toBeVisible()
  })

  test('can navigate to create view for users', async () => {
    await page.goto('/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible()
  })
})

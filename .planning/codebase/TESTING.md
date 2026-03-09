# Testing Patterns

**Analysis Date:** 2026-03-09

## Test Framework

**Runner (Integration):**
- Vitest `4.0.18`
- Config: `vitest.config.mts`
- Environment: `jsdom` (configured but integration tests do not use DOM — tests call Payload SDK directly)
- Setup file: `vitest.setup.ts` (loads `.env` via `dotenv/config`)

**Runner (E2E):**
- Playwright `1.58.2`
- Config: `playwright.config.ts`
- Browser: Chromium only (`devices['Desktop Chrome']`)
- Traces collected on first retry

**Assertion Library:**
- Vitest built-in (`expect` from `vitest`) for integration tests
- Playwright built-in (`expect` from `@playwright/test`) for E2E tests

**Run Commands:**
```bash
npm run test             # Runs integration tests (alias for test:int)
npm run test:int         # vitest run --config ./vitest.config.mts
npm run test:e2e         # playwright test --config=playwright.config.ts
```

## Test File Organization

**Location:**
- All tests live in `tests/` at the project root — not co-located with source files
- Integration tests: `tests/int/`
- E2E tests: `tests/e2e/`
- Shared helpers: `tests/helpers/`

**Naming:**
- Integration specs: `*.int.spec.ts` — `api.int.spec.ts`
- E2E specs: `*.e2e.spec.ts` — `admin.e2e.spec.ts`, `frontend.e2e.spec.ts`
- Helper modules: `camelCase.ts` — `login.ts`, `seedUser.ts`

**Structure:**
```
tests/
├── e2e/
│   ├── admin.e2e.spec.ts
│   └── frontend.e2e.spec.ts
├── helpers/
│   ├── login.ts
│   └── seedUser.ts
└── int/
    └── api.int.spec.ts
```

## Test Structure

**Integration Suite Organization (`tests/int/api.int.spec.ts`):**

```typescript
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })
})

describe('API — basic queries', () => {
  it('fetches users', async () => {
    const users = await payload.find({ collection: 'users' })
    expect(users).toBeDefined()
  })
})
```

**E2E Suite Organization (`tests/e2e/admin.e2e.spec.ts`):**

```typescript
import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()
    const context = await browser.newContext()
    page = await context.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })
})
```

**Patterns:**
- Module-level `payload` instance initialized in top-level `beforeAll` (not per-suite)
- `describe` blocks group related access control or feature areas
- `it()` used (not `test()`) in Vitest integration tests
- `test()` used in Playwright E2E tests
- Lifecycle: seed data in `beforeAll`, clean up in `afterAll` (manual cleanup, not transactions)
- Inline cleanup after individual test cases when `beforeAll`/`afterAll` scope is too wide:
  ```typescript
  // Cleanup after each test within a looped describe
  await payload.delete({ collection: slug, id: draft.id })
  await payload.delete({ collection: slug, id: published.id })
  ```

## Mocking

**Framework:** None. No mock library is used.

**Patterns:**
- Integration tests call the real Payload SDK against a real database — no mocking
- E2E tests run against a live dev server (`http://localhost:3000`) — no mocking
- The `vitest.setup.ts` file only loads environment variables

**What to Mock:**
- Nothing is currently mocked. All tests are integration/E2E level.

**What NOT to Mock:**
- Database (Payload SDK called against real Postgres + PostGIS)
- Payload config
- HTTP server (E2E tests require the server running via `webServer` in playwright.config.ts)

## Fixtures and Factories

**Test Data:**

Seed data is created inline within tests using `payload.create(...)`:

```typescript
// Pattern from tests/int/api.int.spec.ts
const draft = await payload.create({
  collection: slug,
  data: {
    title: `Draft ${slug} test`,
    slug: `draft-${slug}-${Date.now()}`,
    status: 'draft',
    ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
  },
})
```

Unique slugs use `Date.now()` to prevent collision across test runs:
```typescript
slug: `draft-${slug}-${Date.now()}`
```

**User Fixture (`tests/helpers/seedUser.ts`):**
```typescript
export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

export async function seedTestUser(): Promise<void> { ... }
export async function cleanupTestUser(): Promise<void> { ... }
```

**Location:**
- User fixtures: `tests/helpers/seedUser.ts`
- Login helper: `tests/helpers/login.ts`
- Inline data factories: within the test file itself

## Coverage

**Requirements:** None enforced. No coverage thresholds configured.

**View Coverage:**
```bash
# No coverage script defined — run manually:
npx vitest run --coverage --config ./vitest.config.mts
```

## Test Types

**Unit Tests:**
- Not present. No isolated unit tests for individual functions.

**Integration Tests:**
- Scope: Payload SDK against a real Postgres database (requires `DATABASE_URL` in `.env`)
- File: `tests/int/api.int.spec.ts`
- Covers: collection reads, access control (draft/published filtering), spatial queries via PostGIS
- Requires: running Postgres with PostGIS extension and applied migrations

**E2E Tests:**
- Framework: Playwright
- File: `tests/e2e/admin.e2e.spec.ts`, `tests/e2e/frontend.e2e.spec.ts`
- Scope: browser navigation through Payload admin panel and frontend
- Requires: `pnpm dev` server running at `http://localhost:3000` (managed by `webServer` in `playwright.config.ts`)
- CI mode: retries 2x, single worker, forbids `test.only`

## Common Patterns

**Async Testing:**
```typescript
// All tests are async — Payload SDK is always awaited
it('fetches users', async () => {
  const users = await payload.find({ collection: 'users' })
  expect(users).toBeDefined()
})
```

**Access Control Testing:**
```typescript
// Pattern: create draft + published, query unauthenticated, assert only published returned
const result = await payload.find({
  collection: slug,
  overrideAccess: false,  // disables Payload's internal override — enforces real access rules
})
const statuses = result.docs.map((d: any) => d.status)
expect(statuses.every((s: string) => s === 'published')).toBe(true)
```

**Graceful Degradation Testing (spatial):**
```typescript
// When a feature may not be available in all environments, warn and conditionally fail
if (!res.ok) {
  console.warn(`Nearby query failed (${res.status}) — PostGIS geom column may be missing`)
  expect(res.ok).toBe(true) // fail with a clear message
  return
}
```

**Parameterized Tests:**
```typescript
// Loop over collection slugs to avoid duplicate test bodies
const publishedCollections = ['jr_posts', 'jr_projects', 'nitf_posts', 'rotr_posts'] as const
for (const slug of publishedCollections) {
  it(`${slug}: unauthenticated read returns only published docs`, async () => { ... })
}
```

**E2E Locator Pattern:**
```typescript
// Use accessible selectors: title attribute, role-based text, input names
page.locator('span[title="Dashboard"]').first()
page.locator('h1', { hasText: 'Users' }).first()
page.locator('input[name="email"]')
```

---

*Testing analysis: 2026-03-09*

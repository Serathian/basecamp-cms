# Coding Conventions

**Analysis Date:** 2026-03-09

## Naming Patterns

**Files:**
- Collection files: PascalCase with site-prefix acronym + domain noun — `NitfPosts.ts`, `RotrLocations.ts`, `JrProjects.ts`
- Access control files: lowercase single-word — `admin.ts`, `editor.ts`, `anyone.ts`, `checkrole.ts`
- Hook files: camelCase — `protectRoles.ts`
- Utility files: camelCase — `nearby.ts`
- Migration files: timestamp prefix + snake_case description — `20260303_214307_add_postgis.ts`
- React components/pages: PascalCase with `.tsx` extension — `HomePage` in `page.tsx`

**Collection Slugs:**
- snake_case with site-prefix acronym — `nitf_posts`, `rotr_locations`, `jr_posts`
- Shared collections without prefix — `authors`, `tags`, `media`, `users`

**Collection Field Names:**
- snake_case for all Payload field names — `cover_image`, `published_at`, `reading_time_minutes`, `seo_title`, `altitude_m`

**Functions:**
- camelCase for utility/helper functions — `getNearbyPosts`, `parseGpxPoints`, `haversineDistance`, `computeTrailStats`
- camelCase for hooks — `computeGpxStats`, `protectRoles`
- camelCase for access exports — `checkRole`, `seedTestUser`, `cleanupTestUser`

**Variables:**
- camelCase throughout — `payloadConfig`, `testUser`, `createdIds`
- Prefixed with underscore to suppress unused warnings — `_unused` (enforced by ESLint)

**Types/Interfaces:**
- PascalCase — `GpxPoint`, `LoginOptions`
- Imported Payload types used directly — `CollectionConfig`, `FieldHook`, `DatabaseAdapter`

**Exported Constants:**
- PascalCase for collection configs — `Users`, `Authors`, `NitfPosts`, `RotrLocations`
- camelCase for access functions used as defaults — `admin`, `editor` (default exports)
- Named exports for all access helpers — `export const anyone`, `export const checkRole`

## Code Style

**Formatting:**
- Prettier is listed as a dev dependency (`^3.4.2`) but no config file is present — defaults apply
- Single quotes for strings (consistent throughout)
- 2-space indentation
- Trailing commas in multi-line objects/arrays (consistent with Prettier defaults)
- Semicolons present

**Linting:**
- ESLint with `next/core-web-vitals` and `next/typescript` presets (`eslint.config.mjs`)
- `@typescript-eslint/ban-ts-comment`: warn
- `@typescript-eslint/no-empty-object-type`: warn
- `@typescript-eslint/no-explicit-any`: warn (violations accepted in access functions and hooks via `any` cast)
- `@typescript-eslint/no-unused-vars`: warn with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'`
- `.next/` directory ignored from linting

**TypeScript:**
- `strict: true` in `tsconfig.json`
- `as any` used sparingly to bridge Payload SDK types where generics are insufficient — `src/lib/nearby.ts`, access functions, hooks
- `type` imports preferred — `import type { CollectionConfig } from 'payload'`

## Import Organization

**Order (observed pattern):**
1. Node built-ins and framework imports — `path`, `url`, `next/headers`, `react`
2. Third-party packages — `payload`, `@payloadcms/*`
3. Internal path-aliased imports — `@/payload.config`, `@/lib/nearby`, `@/payload-types`
4. Relative imports — `../users/access/editor`, `./checkrole`

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- `@payload-config` maps to `./src/payload.config.ts`

**ESM:**
- Project uses `"type": "module"` — all imports use ESM syntax
- `import.meta.url` used for `__filename`/`__dirname` equivalents

## Error Handling

**Patterns:**
- Try/catch in async utility functions with structured error responses:
  ```typescript
  // src/lib/nearby.ts
  try {
    // ...
    return Response.json({ docs: results.rows })
  } catch (err) {
    return Response.json({ error: String(err), docs: [] }, { status: 500 })
  }
  ```
- Payload hook errors logged via `req.payload.logger.error(...)` rather than thrown — allows graceful degradation:
  ```typescript
  // src/collections/nerdintheforest/NitfTrails.ts
  } catch (err) {
    req.payload.logger.error(`GPX stats computation failed for trail ${doc.id}: ${err}`)
  }
  ```
- API endpoint handlers validate inputs and return `Response.json({ error: '...' }, { status: 400 })` for bad input
- Access functions return `false` (not throw) on denial

## Logging

**Framework:** Payload's built-in logger via `req.payload.logger`

**Patterns:**
- Errors use `req.payload.logger.error(message)` with context (document ID, error value)
- `console.warn(...)` used in test files for soft diagnostic messages only
- No explicit logging in access control functions (they return boolean/where-clause)

## Comments

**When to Comment:**
- Inline comments on non-obvious access control logic:
  ```typescript
  // Unauthenticated users should only see published posts — enforce via access control, not API routes
  ```
- Inline comments on structural decisions:
  ```typescript
  // Never auto-push schema — always use explicit migrations.
  // This preserves custom columns (e.g. PostGIS geom) not tracked by Drizzle.
  ```
- JSDoc-style block comments on exported helper functions in test helpers:
  ```typescript
  /**
   * Seeds a test user for e2e admin tests.
   */
  export async function seedTestUser(): Promise<void>
  ```
- Group separator comments in `payload.config.ts`:
  ```typescript
  // Shared
  // jake-reddy.com
  // nerdintheforest.com
  ```

**JSDoc/TSDoc:**
- Used selectively on public test helper functions, not on collection configs or access functions

## Function Design

**Size:** Functions are small and single-purpose. `computeTrailStats` in `src/collections/nerdintheforest/NitfTrails.ts` is the largest (~35 lines). Access functions are 5–15 lines each.

**Parameters:** Named parameters / destructuring for complex inputs:
```typescript
// tests/helpers/login.ts
export async function login({ page, serverURL = 'http://localhost:3000', user }: LoginOptions)
```

**Return Values:**
- Access functions return `boolean` or a Payload where-clause object
- Hooks return `doc` on success, `doc` on skipped, never throw
- Lib functions return `Promise<Response>` using the Web `Response` API

## Module Design

**Exports:**
- Collection configs use named exports — `export const NitfPosts: CollectionConfig`
- Access helpers mix default and named exports — `export default admin`, `export const checkRole`
- Utility functions use default export — `export default getNearbyPosts`
- Test helpers use named exports — `export const testUser`, `export async function seedTestUser`

**Barrel Files:** Not used. Imports reference source files directly (e.g., `import editor from '../users/access/editor'`).

**Collection Organization:**
- Each collection is one file per concept, grouped in subdirectories by site:
  - `src/collections/jake-reddy/` — JrPosts, JrProjects
  - `src/collections/nerdintheforest/` — NitfPosts, NitfTrails, NitfWaypoints, NitfLocations
  - `src/collections/reddyontheroad/` — RotrPosts, RotrLocations
  - `src/collections/shared/` — Authors, Tags
  - `src/collections/users/` — Users + access/ + hooks/

---

*Convention analysis: 2026-03-09*

# Architecture

**Analysis Date:** 2026-03-09

## Pattern Overview

**Overall:** Headless CMS monolith — Payload CMS embedded in a Next.js App Router application, serving multiple distinct websites from a single data store.

**Key Characteristics:**
- Payload CMS is the core: it owns the data model, admin UI, REST API, and GraphQL API
- Next.js App Router hosts both the Payload backend (under `(payload)` route group) and a minimal frontend shell (under `(frontend)` route group)
- All content collections are defined as Payload `CollectionConfig` objects and registered in `src/payload.config.ts`
- PostgreSQL with PostGIS extension is the sole data store; schema migrations are explicit (never auto-pushed)
- A secondary local package `packages/types` re-exports generated TypeScript types as a publishable npm package for consuming frontends

## Layers

**Configuration Layer:**
- Purpose: Declares the entire CMS schema — collections, editor, DB adapter, plugins, and admin settings
- Location: `src/payload.config.ts`
- Contains: `buildConfig` call wiring all collections together
- Depends on: All collection definitions, env vars (`DATABASE_URL`, `PAYLOAD_SECRET`)
- Used by: Next.js via `@payload-config` alias, `getPayload()` calls throughout app routes

**Collections Layer:**
- Purpose: Defines data models (fields, access control, hooks, custom endpoints) for each content type
- Location: `src/collections/`
- Contains: One `CollectionConfig` export per file; grouped by site namespace
- Depends on: Access control helpers in `src/collections/users/access/`, lib utilities in `src/lib/`
- Used by: `src/payload.config.ts` (registered), Payload REST/GraphQL API (served automatically)

**Access Control Layer:**
- Purpose: Centralises role-based permission logic used across all collections
- Location: `src/collections/users/access/`
- Contains:
  - `checkrole.ts` — base role membership check against `User['roles']`
  - `admin.ts` — grants access to `admin` role only
  - `editor.ts` — grants access to `admin` or `editor` roles
  - `user.ts` — grants full access to admin/editor; limits others to own record
  - `anyone.ts` — always returns `true` (public read)
- Depends on: `src/payload-types.ts` (for typed `User`)
- Used by: Every collection that defines access control

**Hooks Layer:**
- Purpose: Lifecycle callbacks that fire on collection events (afterChange, etc.)
- Location: Defined inline within collection files, or in `src/collections/users/hooks/`
- Contains:
  - `src/collections/users/hooks/protectRoles.ts` — prevents non-admins from self-escalating roles
  - `NitfTrails.ts` inline `computeGpxStats` hook — parses uploaded GPX file and writes computed trail statistics back to the record after save
- Depends on: `req.payload` for follow-up data operations
- Used by: Collection `hooks.afterChange` arrays

**Library Layer:**
- Purpose: Reusable utilities with no Payload dependency beyond the DB adapter type
- Location: `src/lib/`
- Contains: `nearby.ts` — raw PostGIS `ST_DWithin` spatial query via Drizzle `sql` tag
- Used by: `NitfPosts` custom endpoint `/nearby`

**App / Route Layer:**
- Purpose: Next.js routes that expose Payload endpoints and a frontend placeholder
- Location: `src/app/`
- Contains:
  - `(payload)/api/[...slug]/route.ts` — catch-all REST handler (generated, do not edit)
  - `(payload)/api/graphql/route.ts` — GraphQL POST handler (generated)
  - `(payload)/api/graphql-playground/route.ts` — GraphQL playground
  - `(payload)/admin/[[...segments]]/page.tsx` — Payload admin UI (generated)
  - `(frontend)/page.tsx` — minimal welcome page using `getPayload()` server-side
  - `my-route/route.ts` — example custom Next.js API route
- Depends on: `@payload-config` alias, `getPayload` from `payload`
- Used by: Browser clients, external frontends via REST/GraphQL

**Migrations Layer:**
- Purpose: Explicit, versioned PostgreSQL schema changes
- Location: `src/migrations/`
- Contains: Timestamped `.ts` migration files with `up`/`down` functions; `index.ts` barrel
- Key migration: `20260303_214307_add_postgis.ts` enables PostGIS extension and adds `geom geometry(Point, 4326)` + GIST index to `nitf_posts`

**Types Package:**
- Purpose: Publishes auto-generated Payload TypeScript types to npm for use by consuming frontend projects
- Location: `packages/types/`
- Generated from: `src/payload.config.export-types.ts` (identical to main config but with `declare: false` to avoid requiring `payload` as a peer dep)
- Published as: `@basecamp-cms/basecamp-cms-types`

## Data Flow

**REST API Read Request:**

1. External client sends `GET /api/nitf_posts` (or similar)
2. Next.js routes to `src/app/(payload)/api/[...slug]/route.ts`
3. Payload resolves collection from slug, evaluates `access.read` function
4. If unauthenticated, `access.read` returns a Payload where clause `{ status: { equals: 'published' } }`
5. Payload executes filtered query against PostgreSQL via the `@payloadcms/db-postgres` Drizzle adapter
6. Results returned as JSON

**GPX Upload → Trail Stats Hook:**

1. Editor uploads a trail record with a `gpx_file` (media upload) via admin or API
2. Payload saves the record and fires `hooks.afterChange`
3. `computeGpxStats` hook fetches the uploaded file URL, fetches raw GPX content
4. Parses track points with regex, computes distance (haversine), elevation gain/loss, bounding box
5. Issues a follow-up `req.payload.update` to write computed stats back to the same trail record

**Nearby Posts Spatial Query:**

1. Client calls `GET /api/nitf_posts/nearby?lat=X&lon=Y&radius=N`
2. Payload routes to the custom `endpoints` handler in `src/collections/nerdintheforest/NitfPosts.ts`
3. Handler delegates to `src/lib/nearby.ts`
4. `getNearbyPosts` executes raw `ST_DWithin` query against the `nitf_posts.geom` PostGIS column
5. Results returned ordered by proximity

**State Management:**
- No client-side state; all data operations go through Payload's REST or GraphQL API
- Admin UI state is managed internally by Payload's React shell

## Key Abstractions

**CollectionConfig:**
- Purpose: The primary building block — declares fields, access rules, hooks, and custom endpoints for one content type
- Examples: `src/collections/nerdintheforest/NitfPosts.ts`, `src/collections/jake-reddy/JrPosts.ts`
- Pattern: Named export of a `CollectionConfig` object; slug uses snake_case with site prefix (e.g., `nitf_posts`, `rotr_locations`)

**Access Control Functions:**
- Purpose: Composable functions passed to `access.read/create/update/delete` that return `true`, `false`, or a Payload query constraint object
- Examples: `src/collections/users/access/editor.ts`, `src/collections/users/access/checkrole.ts`
- Pattern: `({ req: { user } }) => boolean | WhereClause`

**Site Namespace Grouping:**
- Purpose: Collections are siloed by site (`jake-reddy`, `nerdintheforest`, `reddyontheroad`) so a single CMS serves multiple distinct websites
- Enforcement: Slug prefix (e.g., `jr_`, `nitf_`, `rotr_`), directory grouping under `src/collections/`, and `filterOptions` on shared relation fields (Tags, Authors filtered by `site` value)

## Entry Points

**Payload Config:**
- Location: `src/payload.config.ts`
- Triggers: Imported via `@payload-config` alias by any route or page calling `getPayload()`
- Responsibilities: Declares all collections, DB adapter, editor, secret, TypeScript output path

**REST API:**
- Location: `src/app/(payload)/api/[...slug]/route.ts`
- Triggers: Any HTTP request to `/api/*`
- Responsibilities: Delegates all REST verbs (GET, POST, PATCH, PUT, DELETE, OPTIONS) to Payload's route handlers

**GraphQL API:**
- Location: `src/app/(payload)/api/graphql/route.ts`
- Triggers: POST to `/api/graphql`
- Responsibilities: Delegates to Payload's GraphQL handler

**Admin UI:**
- Location: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Triggers: Browser navigation to `/admin/**`
- Responsibilities: Renders Payload's React admin panel

**Frontend Shell:**
- Location: `src/app/(frontend)/page.tsx`
- Triggers: Browser request to `/`
- Responsibilities: Minimal server-rendered page with auth check; placeholder for a real frontend

## Error Handling

**Strategy:** Errors bubble to the caller — Payload handles HTTP error responses for collection operations; custom endpoints and hooks use try/catch with `req.payload.logger.error`.

**Patterns:**
- Hooks swallow non-critical errors (GPX parsing) and log via `req.payload.logger.error`, returning the original `doc` unmodified on failure
- Custom endpoints return `Response.json({ error: ... }, { status: 400/500 })` directly
- No global error boundary or custom error middleware registered

## Cross-Cutting Concerns

**Logging:** `req.payload.logger` (Payload's built-in Pino logger) used in hooks and custom endpoints

**Validation:** Declared inline on fields via Payload's `required`, `unique`, and `type` field properties; no separate validation library

**Authentication:** Payload's built-in JWT-based auth on the `users` collection (`auth: true`); roles (`admin`, `editor`, `user`) stored in JWT via `saveToJWT: true`; `protectRoles` hook prevents non-admins from self-escalating

---

*Architecture analysis: 2026-03-09*

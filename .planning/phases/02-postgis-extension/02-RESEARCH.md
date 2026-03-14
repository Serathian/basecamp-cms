# Phase 2: PostGIS Extension & Auto-Population - Research

**Researched:** 2026-03-14
**Domain:** PostGIS spatial database extension + Payload CMS v3 hooks
**Confidence:** HIGH

## Summary

Phase 2 extends the existing PostGIS migration to cover all 6 geographic collections (currently only `nitf_posts` has the `geom` column) and implements auto-population hooks so spatial queries work immediately after content creation. The existing migration framework is sound — it uses `IF NOT EXISTS` clauses making it safe to re-run, and the spatial query helper in `src/lib/nearby.ts` already demonstrates the correct pattern.

The core challenge is NOT PostGIS itself (the extension and migration pattern already work) but rather implementing `afterChange` hooks that execute raw SQL to populate `geom` columns after Payload saves documents. The existing test infrastructure (Vitest) is already configured for integration tests with the real database.

**Primary recommendation:** Extend the existing migration's `geoTables` array (5 more entries), then add `afterChange` hooks to 5 collections using the same drizzle SQL pattern already demonstrated in `src/lib/nearby.ts`.

## Standard Stack

### Core

| Library                 | Version | Purpose                    | Why Standard                                                       |
| ----------------------- | ------- | -------------------------- | ------------------------------------------------------------------ |
| PostGIS                 | 3.4+    | Spatial database extension | Industry standard for geospatial queries in PostgreSQL             |
| @payloadcms/db-postgres | 3.78.0  | Payload's postgres adapter | Already integrated, provides drizzle access                        |
| drizzle-orm             | 0.44.7  | SQL query builder          | Dependency of Payload postgres adapter, used for raw SQL execution |

### Supporting

| Library             | Version | Purpose                  | When to Use                                   |
| ------------------- | ------- | ------------------------ | --------------------------------------------- |
| Vitest              | 4.0.18  | Testing framework        | Already configured for integration tests      |
| @payloadcms/drizzle | 3.78.0  | Internal drizzle wrapper | Transitive dependency, no direct usage needed |

### Alternatives Considered

| Instead of        | Could Use                            | Tradeoff                                                                                       |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| afterChange hooks | GENERATED ALWAYS AS columns          | Can't use — commented out in existing migration, likely Drizzle/Payload schema incompatibility |
| drizzle-orm sql   | pg-promise or node-postgres directly | Unnecessary — drizzle already available via `(req.payload.db as any).drizzle`                  |
| PostGIS extension | Custom haversine calculations        | PostGIS provides spatial indexes (GIST), much faster for radius queries                        |

**Installation:**
Already installed — no new dependencies required.

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. Hooks and migration updates fit existing patterns:

```
src/
├── migrations/
│   └── 20260303_214307_add_postgis.ts  # Extend geoTables array
├── collections/
│   └── {site}/
│       └── {Collection}.ts             # Add afterChange hooks
└── lib/
    └── nearby.ts                       # Pattern reference for SQL execution
```

### Pattern 1: PostGIS Migration Extension

**What:** Idempotent migration that adds `geom` columns, populates existing rows, creates spatial indexes
**When to use:** Schema changes that add PostGIS support to tables with lat/lon columns
**Example:**

```typescript
// Source: Existing migration (20260303_214307_add_postgis.ts) + AGENTS.md requirements
const geoTables: Array<{
  table: string
  latCol: string
  lonCol: string
  geomCol: string
  indexName: string
}> = [
  {
    table: 'nitf_posts',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_nitf_posts_geom',
  },
  {
    table: 'nitf_trails',
    latCol: 'latitude_start',
    lonCol: 'longitude_start',
    geomCol: 'geom',
    indexName: 'idx_nitf_trails_geom',
  },
  {
    table: 'nitf_waypoints',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_nitf_waypoints_geom',
  },
  {
    table: 'nitf_locations',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_nitf_locations_geom',
  },
  {
    table: 'rotr_posts',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_rotr_posts_geom',
  },
  {
    table: 'rotr_locations',
    latCol: 'latitude',
    lonCol: 'longitude',
    geomCol: 'geom',
    indexName: 'idx_rotr_locations_geom',
  },
]

for (const { table, latCol, lonCol, geomCol, indexName } of geoTables) {
  // 1. Add column (idempotent with IF NOT EXISTS)
  await db.execute(
    sql`ALTER TABLE ${sql.identifier(table)} ADD COLUMN IF NOT EXISTS ${sql.identifier(geomCol)} geometry(Point, 4326)`,
  )

  // 2. Populate existing rows (UPDATE is always safe to re-run)
  await db.execute(sql`
    UPDATE ${sql.identifier(table)}
    SET ${sql.identifier(geomCol)} = ST_SetSRID(ST_MakePoint(${sql.identifier(lonCol)}, ${sql.identifier(latCol)}), 4326)
    WHERE ${sql.identifier(latCol)} IS NOT NULL AND ${sql.identifier(lonCol)} IS NOT NULL
  `)

  // 3. Create spatial index (idempotent with IF NOT EXISTS)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(indexName)} ON ${sql.identifier(table)} USING GIST (${sql.identifier(geomCol)})`,
  )
}
```

### Pattern 2: Auto-Population via afterChange Hook

**What:** Payload collection hook that executes raw SQL to populate `geom` column after save
**When to use:** Collections with latitude/longitude fields that need spatial query support
**Example:**

```typescript
// Source: AGENTS.md issue #2 fix + nearby.ts pattern for drizzle access
import { sql } from '@payloadcms/db-postgres'

hooks: {
  afterChange: [
    async ({ doc, req }: any) => {
      // Check if geo fields exist (field names vary by collection)
      if (doc.latitude != null && doc.longitude != null) {
        const db = (req.payload.db as any).drizzle
        await db.execute(sql`
          UPDATE nitf_posts
          SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
          WHERE id = ${doc.id}
        `)
      }
      return doc
    },
  ],
},
```

**Variation for nitf_trails (different field names):**

```typescript
// latitude_start/longitude_start instead of latitude/longitude
if (doc.latitude_start != null && doc.longitude_start != null) {
  const db = (req.payload.db as any).drizzle
  await db.execute(sql`
    UPDATE nitf_trails
    SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude_start}, ${doc.latitude_start}), 4326)
    WHERE id = ${doc.id}
  `)
}
```

### Pattern 3: Spatial Query with Geography Cast

**What:** PostGIS query using geography cast for accurate distance calculations in meters
**When to use:** "Find items within X meters radius" queries
**Example:**

```typescript
// Source: src/lib/nearby.ts (verified working pattern)
const results = await db.execute(sql`
  SELECT id, title, slug, latitude, longitude,
    ST_Distance(
      geom::geography,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
    ) AS distance_m
  FROM nitf_posts
  WHERE status = 'published'
    AND geom IS NOT NULL
    AND ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
      ${radius}
    )
  ORDER BY geom <-> ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)
`)
```

**Key PostGIS functions:**

- `ST_SetSRID(geometry, srid)` — Set spatial reference system (4326 = WGS 84)
- `ST_MakePoint(lon, lat)` — Create point geometry (longitude first!)
- `::geography` cast — Enables spherical distance calculations in meters
- `ST_Distance(geog1, geog2)` — Returns distance in meters between two geographies
- `ST_DWithin(geog1, geog2, radius)` — Fast filter for items within radius
- `geom <-> point` — Index-optimized distance operator for ORDER BY

### Anti-Patterns to Avoid

- **GENERATED ALWAYS AS columns:** Commented out in existing migration — likely incompatible with Drizzle's schema tracking (push: false constraint means geom is managed outside Drizzle)
- **Accessing geom in Payload queries:** The `geom` column is managed outside Payload's schema — never query it via Payload API, only via raw SQL
- **Forgetting ::geography cast:** Without cast, ST_Distance uses planar coordinates (degrees), not meters
- **Lat/lon reversed:** ST_MakePoint expects (longitude, latitude) — common mistake since latitude is often listed first

## Don't Hand-Roll

| Problem               | Don't Build                               | Use Instead                             | Why                                                                                                   |
| --------------------- | ----------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Distance calculations | Custom haversine formula in JS            | PostGIS ST_Distance with geography cast | PostGIS handles spheroid calculations accurately, uses spatial indexes (GIST) for fast radius queries |
| Spatial indexes       | Application-level caching of nearby items | PostGIS GIST indexes                    | GIST indexes enable ORDER BY distance queries that scan only relevant portions of the table           |
| Coordinate validation | Custom lat/lon bounds checking            | PostGIS geometry constraints            | PostGIS validates SRID compliance and rejects invalid geometries at database level                    |
| Migration rollback    | Manual column drops                       | Existing down() pattern with table list | Already implemented — just extend the tables array                                                    |

**Key insight:** PostGIS is battle-tested for geospatial operations. The existing migration and query patterns already demonstrate the correct approach — extend them, don't rewrite them.

## Common Pitfalls

### Pitfall 1: Forgetting to Check for NULL Before Auto-Population

**What goes wrong:** Hook executes UPDATE with NULL coordinates, creates invalid geometry or fails
**Why it happens:** Not all collection instances will have geo fields populated (e.g., jr_posts doesn't have lat/lon)
**How to avoid:** Always guard hook with null check: `if (doc.latitude != null && doc.longitude != null)`
**Warning signs:** Database errors about invalid geometry, or geom column remains NULL even when lat/lon exist

### Pitfall 2: Using Different Field Names Across Collections

**What goes wrong:** Copy-paste hook from nitf_posts to nitf_trails fails because trails use `latitude_start`/`longitude_start`
**Why it happens:** Collection schemas have different naming conventions (documented in AGENTS.md)
**How to avoid:** Check collection field names before writing hook — reference the collection TypeScript file
**Warning signs:** Hook doesn't populate geom even though coordinates exist in document

### Pitfall 3: Migration Not Idempotent

**What goes wrong:** Running migration twice fails with "column already exists" or "index already exists"
**Why it happens:** Missing `IF NOT EXISTS` clauses in ALTER TABLE or CREATE INDEX statements
**How to avoid:** Existing migration already uses IF NOT EXISTS — don't remove these clauses when extending
**Warning signs:** Migration fails on second run, CI/CD can't re-apply migrations

### Pitfall 4: Testing Spatial Queries Before Migration Runs

**What goes wrong:** Test creates documents but spatial query returns 0 results (test has early-exit guard, doesn't fail)
**Why it happens:** Test suite might run before migration, or migration was rolled back
**How to avoid:** Ensure dev script runs `payload migrate` before tests (already in package.json `dev` script)
**Warning signs:** Test console.warn messages about 0 results, geom column missing errors

### Pitfall 5: Forgetting ::geography Cast in Distance Queries

**What goes wrong:** Distances returned in degrees instead of meters, radius filters don't work correctly
**Why it happens:** PostGIS geometry type uses planar coordinates, geography uses spherical calculations
**How to avoid:** Always cast to geography for distance calculations: `geom::geography`
**Warning signs:** Distance values are tiny decimals (degrees) instead of thousands (meters)

### Pitfall 6: Reversing Latitude and Longitude in ST_MakePoint

**What goes wrong:** Points appear in wrong locations, spatial queries don't find nearby items
**Why it happens:** ST_MakePoint expects (longitude, latitude) but humans think "lat, lon"
**How to avoid:** Always use `ST_MakePoint(longitude, latitude)` — verify with PostGIS docs
**Warning signs:** Points plot at incorrect locations on map, no nearby results when there should be

## Code Examples

Verified patterns from official sources:

### PostGIS Point Creation and Distance Query

```typescript
// Source: https://postgis.net/docs/ST_MakePoint.html + nearby.ts
// Create a point in WGS 84 (SRID 4326) and cast to geography for spherical distance
const queryPoint = sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`

// Calculate distance in meters
const results = await db.execute(sql`
  SELECT 
    id,
    ST_Distance(geom::geography, ${queryPoint}) AS distance_m
  FROM my_table
  WHERE geom IS NOT NULL
  ORDER BY geom <-> ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)
`)
```

### Drizzle SQL Execution in Payload Hooks

```typescript
// Source: https://orm.drizzle.team/docs/sql + nearby.ts pattern
import { sql } from '@payloadcms/db-postgres'

const db = (req.payload.db as any).drizzle
await db.execute(sql`
  UPDATE my_table
  SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
  WHERE id = ${doc.id}
`)
```

### Complete afterChange Hook Example

```typescript
// Source: AGENTS.md issue fix + collection patterns
import type { CollectionAfterChangeHook } from 'payload'
import { sql } from '@payloadcms/db-postgres'

const populateGeom: CollectionAfterChangeHook = async ({ doc, req }) => {
  // Guard against missing coordinates
  if (doc.latitude == null || doc.longitude == null) {
    return doc
  }

  try {
    const db = (req.payload.db as any).drizzle
    await db.execute(sql`
      UPDATE nitf_posts
      SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
      WHERE id = ${doc.id}
    `)
  } catch (err) {
    req.payload.logger.error(`Failed to populate geom for nitf_posts ${doc.id}: ${err}`)
  }

  return doc
}

export const NitfPosts: CollectionConfig = {
  // ... existing config
  hooks: {
    afterChange: [populateGeom],
  },
}
```

## State of the Art

| Old Approach                | Current Approach                  | When Changed                                 | Impact                                                                         |
| --------------------------- | --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| GENERATED ALWAYS AS columns | Manual UPDATE in afterChange hook | Migration created 2026-03-03 (commented out) | Drizzle with push: false can't track generated columns — manual hooks required |
| Direct pg client access     | Drizzle ORM via payload.db        | Payload v3 (3.78.0)                          | Unified query interface, parameterized queries, type safety                    |
| Manual SQL string building  | sql template literals             | drizzle-orm 0.44.7                           | Prevents SQL injection, automatic parameterization                             |

**Deprecated/outdated:**

- **raw SQL strings:** Replaced by drizzle sql template for type safety and SQL injection prevention
- **GENERATED ALWAYS AS for geom:** Commented out in existing migration — Drizzle schema tracking incompatibility

## Open Questions

1. **Should rotr_posts be excluded from Phase 2?**
   - What we know: ROTR-04 requirement says "rotr_locations collection removed" and Phase 4 will split rotr_posts into weeks/days
   - What's unclear: Does rotr_posts currently need geom, or should we skip it and add to rotr_days in Phase 4?
   - Recommendation: Include rotr_posts in Phase 2 (GEO-04 explicitly lists it). Phase 4 migration can copy geom data when splitting.

2. **Do we need /nearby endpoints for all collections?**
   - What we know: Only nitf_posts has a /nearby endpoint currently
   - What's unclear: Do nitf_trails, nitf_waypoints, nitf_locations, rotr_posts, rotr_locations need custom endpoints?
   - Recommendation: Add geom columns and hooks now (enables future queries), defer endpoint creation to when frontends need them (v2 feature)

3. **Should we add geom to collections planned for Phase 5 (nitf_destinations, nitf_poi)?**
   - What we know: Phase 5 will create new collections nitf_destinations and nitf_poi (NITF-03, NITF-04)
   - What's unclear: Should Phase 2 migration pre-create those tables, or leave for Phase 5?
   - Recommendation: Phase 2 only touches existing collections. Phase 5 migration will handle new collections.

## Validation Architecture

### Test Framework

| Property           | Value                                         |
| ------------------ | --------------------------------------------- |
| Framework          | Vitest 4.0.18                                 |
| Config file        | vitest.config.mts                             |
| Quick run command  | `npx vitest run --config ./vitest.config.mts` |
| Full suite command | `npx vitest run`                              |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                | Test Type   | Automated Command                                                         | File Exists?                           |
| ------- | ----------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- | -------------------------------------- |
| GEO-01  | nitf_posts geom auto-populated after create with lat/lon                | integration | `npx vitest run tests/int/api.int.spec.ts -t "nitf_posts.*geom"`          | ✅ Extend existing                     |
| GEO-02  | nitf_destinations geom auto-populated                                   | integration | `npx vitest run tests/int/api.int.spec.ts -t "nitf_destinations.*geom"`   | ❌ Wave 0 (Phase 5 creates collection) |
| GEO-03  | nitf_poi geom auto-populated                                            | integration | `npx vitest run tests/int/api.int.spec.ts -t "nitf_poi.*geom"`            | ❌ Wave 0 (Phase 5 creates collection) |
| GEO-04  | rotr_days geom auto-populated                                           | integration | `npx vitest run tests/int/api.int.spec.ts -t "rotr_days.*geom"`           | ❌ Wave 0 (Phase 4 creates collection) |
| GEO-05  | Spatial queries work for all geo collections                            | integration | `npx vitest run tests/int/api.int.spec.ts -t "spatial"`                   | ✅ Extend existing                     |
| GEO-06  | Migration adds geom to 6 tables (up) and removes from 6 tables (down)   | integration | `npx vitest run tests/int/migration.int.spec.ts`                          | ❌ Wave 0                              |
| TEST-03 | Integration tests verify PostGIS spatial queries on all geo collections | integration | `npx vitest run tests/int/api.int.spec.ts -t "nearby"`                    | ✅ Extend existing                     |
| TEST-04 | TypeScript types regenerated after schema change                        | unit        | `npx payload generate:types && git diff --exit-code src/payload-types.ts` | ✅ npm script                          |
| TEST-05 | Migration down() rolls back all PostGIS changes                         | integration | `npx vitest run tests/int/migration.int.spec.ts -t "rollback"`            | ❌ Wave 0                              |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/int/api.int.spec.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual smoke test of /nearby endpoint

### Wave 0 Gaps

- [ ] `tests/int/migration.int.spec.ts` — covers GEO-06, TEST-05 (migration up/down verification)
- [ ] Extend `tests/int/api.int.spec.ts` — add geom population tests for nitf_trails, nitf_waypoints, nitf_locations, rotr_posts, rotr_locations
- [ ] Extend `tests/int/api.int.spec.ts` — remove early-exit guard in nearby test, assert distance ordering

_(GEO-02, GEO-03, GEO-04 deferred to Phase 4/5 when those collections are created)_

## Sources

### Primary (HIGH confidence)

- PostGIS official docs (https://postgis.net/docs/) - ST_MakePoint, ST_SetSRID, ST_Distance verified
- Drizzle ORM docs (https://orm.drizzle.team/docs/sql) - sql template, execute patterns verified
- Existing codebase files:
  - `src/migrations/20260303_214307_add_postgis.ts` - Migration pattern, geoTables structure
  - `src/lib/nearby.ts` - Drizzle SQL execution pattern, geography cast usage
  - `src/collections/nerdintheforest/NitfPosts.ts` - Collection structure, field names
  - `package.json` - Dependency versions (@payloadcms/db-postgres 3.78.0, drizzle-orm 0.44.7)
  - `AGENTS.md` - Known issues, table names, field name variations

### Secondary (MEDIUM confidence)

- Payload CMS v3 hook patterns - inferred from collection examples (no official v3.78 hook docs fetched)

### Tertiary (LOW confidence)

- None — all findings verified against official docs or existing code

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Existing migration and nearby.ts demonstrate proven patterns
- Pitfalls: HIGH - Known issues documented in AGENTS.md, PostGIS docs clarify common mistakes

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days - stable domain, PostGIS and drizzle-orm are mature)

# Phase 5: Nerd in the Forest Trip Structure - Research

**Researched:** 2026-03-16
**Domain:** Payload v3 collections, PostGIS BEFORE triggers, bidirectional relationships, migration lifecycle
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Collections added in this phase**
- `nitf_trips` — new, flagship trip narrative collection
- `nitf_destinations` — new, broad geographic area (national park, forest, region)
- `nitf_poi` — new, GPS map pin (replaces nitf_locations)
- `nitf_poi_types` — new, admin-managed lookup (same pattern as rotr_place_types)
- `nitf_places` — new, rich content layer for a POI (1:1 with nitf_poi)

**Collections removed in this phase**
- `nitf_locations` — dropped clean (no data to preserve); replaced by nitf_poi
- `nitf_waypoints` — dropped clean (no data to preserve); trail waypoints out of scope

**nitf_posts updates (existing collection)**
- Type options trimmed to: `review`, `recipe`, `article` (drop adventure/tips/general/place)
- Drop `review_meta` and `recipe_meta` JSON fields
- Drop `seo_title`, `seo_description`, `reading_time_minutes` fields
- Drop `trail` relationship field
- Drop `locations` array field (replaced by reference to nitf_poi — see below)
- Keep: status, title, slug, type, excerpt, body, cover_image, author, tags, published_at
- `nitf_posts.locations[]` array: update `relationTo` from `nitf_locations` → `nitf_poi`

**nitf_trips fields**
- `status` — select: draft / published
- `title` — text, required
- `slug` — text, required, unique
- `body` — textarea (markdown)
- `destination` — relationship to `nitf_destinations` (single, not array)
- `cover_image` — upload, relationTo: nitf_media
- `date_range` — group with `start_date` (date) + `end_date` (date)
- `tags` — relationship to nitf_tags, hasMany: true
- `pois` — relationship array to `nitf_poi`, hasMany: true (ordered — this is the ordered side)
- Access: read: published, create/update/delete: admin

**nitf_destinations fields**
- `status` — select: draft / published
- `name` — text, required
- `slug` — text, required, unique
- `description` — textarea (markdown)
- `latitude` — number (for PostGIS geom)
- `longitude` — number (for PostGIS geom)
- `featured_image` — upload, relationTo: nitf_media
- `links` — array with fields: `url` (text) + `label` (text)
- `difficulty` — select: easy / moderate / hard / expert
- `season_info` — textarea
- PostGIS: geom column + BEFORE trigger (GEO-02)
- Access: read: published, create/update/delete: admin

**nitf_poi fields**
- `name` — text, required
- `latitude` — number, required
- `longitude` — number, required
- `type` — relationship to `nitf_poi_types` (admin-managed lookup, not hardcoded select)
- `trips` — relationship array to `nitf_trips`, hasMany: true (reverse lookup — not ordered)
- `place` — relationship to `nitf_places` (optional 1:1 link to enriched content)
- PostGIS: geom column + BEFORE trigger (GEO-03)
- Access: read: published, create/update/delete: admin

**nitf_poi_types fields**
- `name` — text, required
- `slug` — text, required, unique
- Same pattern as rotr_place_types (admin-managed lookup)
- Initial types to create via admin: camp-fire, lean-to, viewpoint, summit, lake, trailhead, cabin, other
- Access: read: () => true, create/update/delete: admin

**nitf_places fields**
- `status` — select: draft / published (independent of parent POI)
- `title` — text, required
- `slug` — text, required, unique
- `body` — textarea (markdown)
- `cover_image` — upload, relationTo: nitf_media
- `tags` — relationship to nitf_tags, hasMany: true
- `poi` — relationship to `nitf_poi` (the parent GPS pin this enriches)
- Access: read: published, create/update/delete: admin

**Bidirectional relationship: nitf_trips ↔ nitf_poi**
- Ordered array: `nitf_trips.pois[]` — trip-specific POI order managed here
- Reverse lookup: `nitf_poi.trips[]` — admin can see all trips referencing a POI; not ordered

**Admin display defaults**
- nitf_trips: useAsTitle: title, defaultColumns: [title, destination, status, date_range]
- nitf_destinations: useAsTitle: name, defaultColumns: [name, difficulty, status]
- nitf_poi: useAsTitle: name, defaultColumns: [name, type, status]
- nitf_poi_types: useAsTitle: name
- nitf_places: useAsTitle: title, defaultColumns: [title, poi, status]

**Migration**
- Drop `nitf_locations` — clean slate, no data migration
- Drop `nitf_waypoints` — clean slate, no data migration
- Create nitf_trips, nitf_destinations, nitf_poi, nitf_poi_types, nitf_places tables
- Add geom columns (raw SQL) for nitf_destinations and nitf_poi
- Update nitf_posts: drop columns (type options update doesn't need migration, just schema change)
- Migration must have tested down() function

### Claude's Discretion
- Exact SQL for migration up()/down()
- Whether nitf_posts type column can be altered or needs clean drop/recreate
- Whether nitf_posts locations array field update requires a migration or just collection config change
- Exact defaultSort settings for each collection
- Whether to add published_at date field to nitf_trips and nitf_places

### Deferred Ideas (OUT OF SCOPE)
- nitf_trails → nitf_trips relationship (future phase)
- GPS boundary polygons for destinations (ADV-02)
- nitf_places photo gallery (photos array)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NITF-01 | `nitf_posts` collection: title, slug, body, type (review/place/recipe), tags, featured_image, publish_date | nitf_posts schema update — trim type options, drop legacy fields; no data migration needed |
| NITF-02 | `nitf_posts` place type has optional latitude/longitude fields | latitude/longitude already exist on nitf_posts; CONTEXT clarifies type options trimmed to review/recipe/article — no new geo fields needed |
| NITF-03 | `nitf_destinations` collection: name, description, latitude, longitude, featured_image, links array, difficulty, season_info | New collection following established PostGIS trigger pattern |
| NITF-04 | `nitf_poi` collection: name, latitude, longitude, type (select), trips (relation array to nitf_trips) | New collection; type is now a relationship to nitf_poi_types, not a hardcoded select |
| NITF-05 | `nitf_trips` collection: title, slug, body, destination relation, cover_image, date_range, tags, pois relation array (ordered) | New collection; ordered pois uses Payload hasMany relationship with order tracking via _rels table |
| NITF-06 | `nitf_trips` ↔ `nitf_poi` bidirectional relationship (trips array on POI, pois array on trip) | Payload _rels table tracks both sides; migration must create both FK columns in nitf_trips_rels and nitf_poi_rels |
| NITF-07 | `nitf_tags` collection: name, slug | Already exists from Phase 3; no changes required |
| GEO-02 | `nitf_destinations` has `geom` column with `afterChange` hook | Use BEFORE INSERT OR UPDATE trigger (same pattern as rotr_days, Phase 4) |
| GEO-03 | `nitf_poi` has `geom` column with `afterChange` hook | Use BEFORE INSERT OR UPDATE trigger (same pattern as rotr_days, Phase 4) |
| TEST-02 | Integration tests verify all bidirectional relationships | Test nitf_trips.pois populated at depth:1; test nitf_poi.trips reverse lookup populated at depth:1 |
| TEST-04 | TypeScript types regenerated after each schema change | `npx payload generate:types` after collection files exist; both payload.config.ts and payload.config.export-types.ts must mirror each other |
</phase_requirements>

---

## Summary

Phase 5 adds five new Payload v3 collections (nitf_trips, nitf_destinations, nitf_poi, nitf_poi_types, nitf_places), removes two collections (nitf_locations, nitf_waypoints), and updates nitf_posts to trim legacy fields. All patterns in this phase have direct precedents in the existing codebase — there are no novel technical challenges.

The most complex aspect is the bidirectional many-to-many relationship between nitf_trips and nitf_poi. Payload v3 handles this via _rels join tables with an `order` INTEGER column for the ordered side (nitf_trips.pois). The migration must create _rels tables for every new collection that has relationship fields — this is a hard lesson from Phase 4 (rotr_days_rels was initially missing). PostGIS BEFORE triggers for nitf_destinations and nitf_poi follow the identical pattern established in Phase 4 (rotr_days).

The geom-hooks.int.spec.ts test file references nitf_locations and nitf_waypoints directly. Dropping these collections means those specific test cases will fail unless the test file is updated to remove or replace the nitf_locations and nitf_waypoints test blocks as part of this phase.

**Primary recommendation:** Use the Phase 4 migration (20260316_rotr_days_split.ts) as the direct template for this phase's migration. Apply the same _rels table pattern to every new collection with relationship fields.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Payload v3 | installed | Collection config, relationship fields, access control | Project CMS framework |
| `@payloadcms/db-postgres` | installed | `sql` tagged template literal, MigrateUpArgs/MigrateDownArgs | PostgreSQL adapter in use throughout |
| `drizzle-orm` | installed | `sql` from drizzle in migration files | Used in all existing migrations |
| PostGIS | DB extension | geom columns, ST_SetSRID, ST_MakePoint, ST_DWithin, ST_MakeEnvelope | Already enabled via `extensions: ['postgis']` in db adapter config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.0.18 | Integration test runner | All tests in tests/int/ |
| `vite-tsconfig-paths` | installed | Path alias `@/` in tests | Required for `import config from '@/payload.config'` to resolve |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| BEFORE trigger for geom | Payload afterChange hook | Triggers win: better transaction visibility, no async timing issues — this was the Phase 2 decision |
| hasMany relationship for pois | Payload array field with nested relationship | hasMany is simpler; Payload manages the _rels order column automatically |

**No installation needed** — all required packages already present.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── collections/nerdintheforest/
│   ├── NitfPosts.ts         # UPDATED — trim type options and legacy fields
│   ├── NitfTrips.ts         # NEW
│   ├── NitfDestinations.ts  # NEW
│   ├── NitfPoi.ts           # NEW
│   ├── NitfPoiTypes.ts      # NEW
│   ├── NitfPlaces.ts        # NEW
│   ├── NitfTrails.ts        # UNCHANGED
│   ├── NitfMedia.ts         # UNCHANGED
│   └── NitfTags.ts          # UNCHANGED
├── migrations/
│   ├── 20260316_nitf_trip_structure.ts  # NEW
│   └── index.ts             # UPDATED — add new migration
└── payload.config.ts        # UPDATED — register new, unregister dropped
src/payload.config.export-types.ts      # UPDATED — must mirror payload.config.ts exactly
```

### Pattern 1: Lookup Collection (nitf_poi_types)

**What:** Minimal name+slug collection; admin-managed, no status field.
**When to use:** Type enumerations that need to be editable without deploys.

```typescript
// Source: src/collections/reddyontheroad/RotrPlaceTypes.ts (direct copy, rename slug/group)
export const NitfPoiTypes: CollectionConfig = {
  slug: 'nitf_poi_types',
  admin: {
    useAsTitle: 'name',
    group: 'Nerd in the Forest',
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
}
```

### Pattern 2: PostGIS BEFORE Trigger (nitf_destinations and nitf_poi)

**What:** PostgreSQL BEFORE INSERT OR UPDATE trigger auto-populates geom from latitude/longitude.
**When to use:** Any collection with lat/lon fields. DO NOT use afterChange hooks.

```typescript
// Source: src/migrations/20260316_rotr_days_split.ts — canonical trigger pattern
// In migration up():

// Step 1: AddGeometryColumn (outside Drizzle schema)
await db.execute(sql`
  SELECT AddGeometryColumn('public', 'nitf_destinations', 'geom', 4326, 'POINT', 2)
`)

// Step 2: Trigger function (must use sql.raw() for $$ PL/pgSQL blocks)
await db.execute(sql.raw(`
  CREATE OR REPLACE FUNCTION trg_nitf_destinations_geom_fn()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
      NEW.geom := NULL;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`))

// Step 3: Bind trigger
await db.execute(sql.raw(`
  DROP TRIGGER IF EXISTS trg_nitf_destinations_geom ON nitf_destinations;
  CREATE TRIGGER trg_nitf_destinations_geom
    BEFORE INSERT OR UPDATE ON nitf_destinations
    FOR EACH ROW
    EXECUTE FUNCTION trg_nitf_destinations_geom_fn();
`))
```

**In migration down(), drop trigger then function then table:**
```sql
DROP TRIGGER IF EXISTS trg_nitf_destinations_geom ON nitf_destinations;
DROP FUNCTION IF EXISTS trg_nitf_destinations_geom_fn();
-- then DROP TABLE
```

### Pattern 3: _rels Table for Relationship Fields

**What:** Every Payload collection with relationship fields requires a companion `_rels` join table in the migration. Without it, the collection fails at runtime.
**When to use:** Any new collection with `type: 'relationship'` fields (including upload fields with relationTo).

**Lesson from Phase 4:** rotr_days_rels was missing from the initial migration. Adding it in 04-03 fixed runtime failures.

**_rels table structure:**
```sql
-- Source: src/migrations/20260316_rotr_days_split.ts — Step 7
CREATE TABLE IF NOT EXISTS nitf_trips_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,                          -- required for hasMany ordering
  parent_id INTEGER NOT NULL REFERENCES nitf_trips(id) ON DELETE CASCADE,
  path VARCHAR(255) NOT NULL,
  nitf_destinations_id INTEGER REFERENCES nitf_destinations(id) ON DELETE SET NULL,
  nitf_poi_id INTEGER REFERENCES nitf_poi(id) ON DELETE SET NULL,
  nitf_media_id INTEGER REFERENCES nitf_media(id) ON DELETE SET NULL,
  nitf_tags_id INTEGER REFERENCES nitf_tags(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)
```

**One FK column per target collection.** The `path` column discriminates which relationship field the row belongs to (e.g., `'pois'`, `'tags'`, `'destination'`, `'cover_image'`).

**Collections and their relationship targets:**

| Collection | FK columns in _rels |
|------------|---------------------|
| nitf_trips_rels | nitf_destinations_id, nitf_poi_id, nitf_media_id, nitf_tags_id |
| nitf_destinations_rels | nitf_media_id |
| nitf_poi_rels | nitf_poi_types_id, nitf_trips_id, nitf_places_id |
| nitf_places_rels | nitf_media_id, nitf_tags_id, nitf_poi_id |
| nitf_poi_types_rels | (none — no relationship fields; may not be required) |

**Note on nitf_poi_types:** It has no relationship fields (only name/slug text fields). A _rels table is probably NOT needed. Verify by analogy with rotr_place_types — that collection has no _rels table.

### Pattern 4: Bidirectional Relationship (nitf_trips ↔ nitf_poi)

**What:** nitf_trips.pois is the ordered, authoritative side. nitf_poi.trips is the read-only reverse lookup.
**How it works in Payload v3:** Both sides declare the relationship in their CollectionConfig. The database tracks them via the _rels tables of both collections. The `"order"` column in nitf_trips_rels maintains POI sequence within a trip.

```typescript
// Source: 05-CONTEXT.md — bidirectional relationship spec

// In NitfTrips.ts:
{
  name: 'pois',
  type: 'relationship',
  relationTo: 'nitf_poi',
  hasMany: true,
}

// In NitfPoi.ts:
{
  name: 'trips',
  type: 'relationship',
  relationTo: 'nitf_trips',
  hasMany: true,
}
```

The ordered resequencing (drag-and-drop in admin) is handled automatically by Payload admin UI — the `"order"` column in the _rels table is updated when the user reorders items.

### Pattern 5: Group Field for date_range

**What:** Payload `group` field type wraps related fields into a named sub-object.
**When to use:** When multiple fields logically belong together (start/end dates).

```typescript
// Source: Payload v3 CollectionConfig field types
{
  name: 'date_range',
  type: 'group',
  fields: [
    { name: 'start_date', type: 'date' },
    { name: 'end_date', type: 'date' },
  ],
}
```

Group fields do NOT create a separate table — they flatten into columns on the parent table (e.g., `date_range_start_date`, `date_range_end_date`). No FK columns in the _rels table.

### Pattern 6: Migration payload_locked_documents_rels Updates

**What:** The `payload_locked_documents_rels` table must be updated whenever collections are added or removed.
**Rule:** ADD a `{slug}_id` column for each new collection; DROP the column for each dropped collection.

```sql
-- Source: src/migrations/20260316_rotr_days_split.ts — Step 8
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_trips_id INTEGER;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_destinations_id INTEGER;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_poi_id INTEGER;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_poi_types_id INTEGER;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS nitf_places_id INTEGER;
ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_locations_id;
ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS nitf_waypoints_id;
```

### Pattern 7: nitf_posts Column Drops

**What:** Dropping columns from an existing table in migration up().
**Key finding:** PostgreSQL does not allow altering an ENUM type's values directly (`ALTER TYPE ... DROP VALUE` is not supported pre-PG15). The `type` column on nitf_posts uses a VARCHAR(255), not a native ENUM — so changing the Payload collection config options is sufficient for the type field (no ALTER needed). However, the physical columns for dropped fields (`review_meta`, `recipe_meta`, `seo_title`, `seo_description`, `reading_time_minutes`, `trail`, `locations` array) must be explicitly dropped.

```sql
-- Physical column drops in migration up():
ALTER TABLE nitf_posts DROP COLUMN IF EXISTS review_meta;
ALTER TABLE nitf_posts DROP COLUMN IF EXISTS recipe_meta;
ALTER TABLE nitf_posts DROP COLUMN IF EXISTS seo_title;
ALTER TABLE nitf_posts DROP COLUMN IF EXISTS seo_description;
ALTER TABLE nitf_posts DROP COLUMN IF EXISTS reading_time_minutes;
-- trail field is a relationship → FK column may live in nitf_posts_rels, not directly on nitf_posts
-- locations array field → lives in nitf_posts_rels with path='locations'
```

**Confirmed:** Payload v3 stores non-relationship fields directly on the collection table. Relationship fields use the _rels join table. The `trail` relationship and the `locations` array-of-relationships are stored in `nitf_posts_rels` (or a nested array table). Dropping them from the CollectionConfig stops Payload from writing them, but the FK column in nitf_posts_rels for `nitf_locations_id` / `nitf_trails_id` may need cleaning.

**Action:** Check nitf_posts_rels for existing FK columns referencing nitf_locations and nitf_trails — drop those FK references when dropping the collections/relationships. This also applies when changing locations `relationTo` from nitf_locations → nitf_poi: add `nitf_poi_id` column to nitf_posts_rels, remove `nitf_locations_id`.

### Anti-Patterns to Avoid

- **Payload afterChange hook for geom population:** Replaced by BEFORE trigger in Phase 2. NitfLocations.ts still uses the old hook pattern — do NOT copy from NitfLocations.ts.
- **Hardcoded select for POI type:** The user explicitly chose admin-managed lookup (nitf_poi_types) over a hardcoded select. Use `type: 'relationship', relationTo: 'nitf_poi_types'`.
- **Missing _rels table in migration:** Any collection with relationship fields (including upload fields) needs a _rels table. This caused a test failure in Phase 4 (missing rotr_days_rels).
- **Forgetting payload_locked_documents_rels:** Every collection add/drop requires updating this table.
- **Using `as any` cast permanently:** New slugs (nitf_trips, nitf_poi, etc.) will not be in CollectionSlug union until types are regenerated. Use `as any` only as a temporary cast pre-regeneration; regenerate types in the types plan.
- **Using `sql` template literal for $$ PL/pgSQL blocks:** Drizzle's `sql` template literal cannot handle `$$` syntax. Use `sql.raw()` for trigger function bodies.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| POI ordering within a trip | Custom order field + manual increment logic | Payload hasMany relationship with `"order"` column in _rels | Payload manages order column automatically in admin UI |
| Geom auto-population | Payload afterChange hook | PostgreSQL BEFORE trigger (established Phase 2 pattern) | Better transaction visibility, no async race conditions |
| Spatial radius queries | Manual Haversine SQL | `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326), radius)` | PostGIS handles spheroid math; GIST index makes it fast |
| Bounding box queries | Manual lat/lon range WHERE clause | `ST_MakeEnvelope(minlon, minlat, maxlon, maxlat, 4326)` with `&&` operator | Uses GIST index; range queries don't |
| Type lookup management | Hardcoded select options | `nitf_poi_types` collection | Admin can add new types without a deploy |

**Key insight:** The existing PostGIS infrastructure (triggers, GIST indexes) from Phase 2 handles all spatial query needs. Phase 5 only needs to create geom columns + triggers for the two new geo collections.

---

## Common Pitfalls

### Pitfall 1: Missing _rels tables in migration
**What goes wrong:** Collection saves silently fail or throw FK constraint errors at runtime because Payload cannot find the join table to store relationship data.
**Why it happens:** Payload generates these tables dynamically from schema when push:true, but push:false means they must be created manually in migrations.
**How to avoid:** For every new collection with any `type: 'relationship'` or `type: 'upload'` (with relationTo) field, create a `_rels` table with the correct FK columns.
**Warning signs:** Runtime errors on create/update that reference missing tables or FK violations.

### Pitfall 2: sql.raw() requirement for PL/pgSQL trigger functions
**What goes wrong:** Migration throws syntax error when using `sql` template literal for trigger function bodies containing `$$`.
**Why it happens:** Drizzle's `sql` template literal tries to parameterize `$` characters.
**How to avoid:** Always use `sql.raw()` for `CREATE OR REPLACE FUNCTION ... $$ ... $$` blocks.
**Warning signs:** Syntax error mentioning `$1` or unexpected token during migration up().

### Pitfall 3: payload.config.export-types.ts not mirrored
**What goes wrong:** TypeScript compilation errors when old imports remain in the export-types config after collections are dropped/added.
**Why it happens:** This file is a near-duplicate of payload.config.ts but with `declare: false`. Both must be kept in sync.
**How to avoid:** Update payload.config.export-types.ts in the same commit as payload.config.ts when adding/removing collections.
**Warning signs:** `npx payload generate:types` succeeds but tsc compilation fails due to import of removed collection.

### Pitfall 4: nitf_posts_rels FK columns for dropped relationships
**What goes wrong:** nitf_posts_rels still has `nitf_locations_id` and `nitf_trails_id` columns referencing dropped tables, causing FK constraint violations when migration drops those tables.
**Why it happens:** Drizzle/Payload manages these FKs; DROP TABLE with CASCADE should handle the FK but the column remains as an orphaned nullable column.
**How to avoid:** Drop the FK columns from nitf_posts_rels explicitly, or rely on CASCADE to drop the constraint. At minimum, add `nitf_poi_id` to nitf_posts_rels when updating locations relationship to point to nitf_poi.
**Warning signs:** FK constraint errors during `DROP TABLE nitf_locations CASCADE` or `DROP TABLE nitf_trails CASCADE`.

### Pitfall 5: geom-hooks test references dropped collections
**What goes wrong:** geom-hooks.int.spec.ts contains tests for nitf_locations and nitf_waypoints, which will fail after the migration drops those tables.
**Why it happens:** The test was written for Phase 2 collections, not updated for Phase 5.
**How to avoid:** Update geom-hooks.int.spec.ts to remove the nitf_locations and nitf_waypoints test blocks, replacing them with nitf_destinations and nitf_poi equivalents.
**Warning signs:** Test suite failure on geom-hooks tests after migration runs.

### Pitfall 6: migration.int.spec.ts references dropped tables
**What goes wrong:** migration.int.spec.ts checks for geom columns on `nitf_locations` and `nitf_waypoints` — both dropped in this phase.
**Why it happens:** The test asserts a static list of tables with geom columns, now stale.
**How to avoid:** Update migration.int.spec.ts to remove nitf_locations/nitf_waypoints from the table list and add nitf_destinations/nitf_poi.
**Warning signs:** Migration integration test failure after Phase 5 migration runs.

### Pitfall 7: defaultSort is a top-level field, not inside admin
**What goes wrong:** TypeScript error when placing `defaultSort` inside the `admin` object.
**Why it happens:** In Payload v3, `defaultSort` is a top-level `CollectionConfig` property.
**How to avoid:** Place `defaultSort` at the top level, not nested inside `admin: {}`.
**Warning signs:** TypeScript error `Property 'defaultSort' does not exist on type 'CollectionAdminOptions'`.

### Pitfall 8: New collection slugs require `as any` cast until types regenerated
**What goes wrong:** TypeScript error `Type '"nitf_poi_types"' is not assignable to type 'CollectionSlug'` when referencing new collection slugs in relationship fields.
**Why it happens:** The CollectionSlug union type is generated from the current payload-types.ts, which doesn't include new collections until `npx payload generate:types` runs.
**How to avoid:** Use `as any` cast for new collection slugs in the collection files during the implementation plan. Regenerate types in the types plan (TEST-04) to remove the casts.
**Warning signs:** TypeScript errors on `relationTo: 'nitf_poi_types'` in new collection files.

---

## Code Examples

Verified patterns from existing codebase:

### PostGIS trigger function (sql.raw pattern)
```typescript
// Source: src/migrations/20260316_rotr_days_split.ts
await db.execute(sql.raw(`
  CREATE OR REPLACE FUNCTION trg_rotr_days_geom_fn()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
      NEW.geom := NULL;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`))
```

### _rels table creation
```typescript
// Source: src/migrations/20260316_rotr_days_split.ts — Step 7
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS rotr_days_rels (
    id SERIAL PRIMARY KEY,
    "order" INTEGER,
    parent_id INTEGER NOT NULL REFERENCES rotr_days(id) ON DELETE CASCADE,
    path VARCHAR(255) NOT NULL,
    rotr_place_types_id INTEGER REFERENCES rotr_place_types(id) ON DELETE SET NULL,
    rotr_tags_id INTEGER REFERENCES rotr_tags(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
  )
`)
```

### Bidirectional relationship integration test pattern
```typescript
// Source: src/tests/int/rotr-days.int.spec.ts — TEST-02 pattern
it('nitf_trips.pois populated as array at depth:1', async () => {
  const dest = await payload.create({ collection: 'nitf_destinations', data: { ... } })
  const poi = await payload.create({ collection: 'nitf_poi', data: { ... } })
  const trip = await payload.create({
    collection: 'nitf_trips',
    data: { title: 'Test Trip', slug: 'test-trip', status: 'draft', destination: dest.id, pois: [poi.id] },
  })
  const fetched = await payload.findByID({ collection: 'nitf_trips', id: trip.id, depth: 1 })
  expect(Array.isArray(fetched.pois)).toBe(true)
  expect(fetched.pois).toHaveLength(1)
  const populatedPoi = fetched.pois[0] as any
  expect(populatedPoi.id).toBe(poi.id)
  // cleanup...
})
```

### Spatial radius query pattern (GEO-02, GEO-03 validation)
```sql
-- Source: PostGIS documentation (verified in project — used in existing nearby.ts endpoint)
SELECT * FROM nitf_destinations
WHERE ST_DWithin(
  geom,
  ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
  :radius_meters
);
```

### Bounding box query pattern (for map route display)
```sql
-- Source: PostGIS ST_MakeEnvelope — for trip route map bounding box queries
SELECT * FROM nitf_poi
WHERE geom && ST_MakeEnvelope(:minlon, :minlat, :maxlon, :maxlat, 4326);
```

### Collection config for ordered hasMany relationship
```typescript
// Source: 05-CONTEXT.md + Payload v3 docs pattern
{
  name: 'pois',
  type: 'relationship',
  relationTo: 'nitf_poi',
  hasMany: true,
}
// Payload admin UI shows a reorderable list; "order" column in _rels table tracks sequence
```

---

## Claude's Discretion — Resolved

### nitf_posts type column: ALTER vs schema-only change
**Verdict: Schema change only, no ALTER SQL needed.**
Payload v3 stores select field values as VARCHAR(255), not as a PostgreSQL ENUM type. Changing the `options` array in the CollectionConfig is sufficient — existing rows with old values (adventure, tips, general) simply become invalid selects but the column itself requires no DDL change. If cleanliness is desired, add an UPDATE to set invalid type values to 'article' before trimming options, but this is optional since there is no production data.

### nitf_posts locations array update: migration or config-only
**Verdict: Migration required for _rels table FK column change.**
The `locations` array field stores data in `nitf_posts_rels` with path `'locations'` and a FK column `nitf_locations_id`. When changing `relationTo` to `nitf_poi`, Payload will look for a `nitf_poi_id` column in nitf_posts_rels. The migration must:
1. Add `nitf_poi_id` column to nitf_posts_rels (if not already present from nitf_poi table creation)
2. The `nitf_locations_id` column will be dropped by CASCADE when `DROP TABLE nitf_locations` runs — but only if a FK constraint exists. Verify and handle explicitly.

### defaultSort recommendations
- nitf_trips: `defaultSort: '-date_range__start_date'` (newest first) — or leave as default ID sort since trips are few; **discretion: omit defaultSort initially, add if needed**
- nitf_destinations: `defaultSort: 'name'` (alphabetical makes sense for a lookup-type list)
- nitf_poi: `defaultSort: 'name'` (alphabetical)
- nitf_poi_types: `defaultSort: 'name'`
- nitf_places: `defaultSort: '-createdAt'` (newest first)

### published_at on nitf_trips and nitf_places
**Verdict: Add published_at to both.**
Consistent with nitf_posts which has `published_at`. Frontends will want to sort/filter by publication date. The cost is zero (one nullable date column). Add to both collections.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.mts` |
| Quick run command | `npm run test:int` |
| Full suite command | `npm run test:int` |

(No separate quick/full split — single integration suite. All tests run sequentially due to `fileParallelism: false`.)

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NITF-01 | nitf_posts schema has correct fields after update | integration | `npm run test:int` (nitf-trip-structure.int.spec.ts) | ❌ Wave 0 |
| NITF-02 | nitf_posts latitude/longitude fields exist | integration | `npm run test:int` | ❌ Wave 0 |
| NITF-03 | nitf_destinations table exists with all columns | integration | `npm run test:int` | ❌ Wave 0 |
| NITF-04 | nitf_poi table exists with all columns | integration | `npm run test:int` | ❌ Wave 0 |
| NITF-05 | nitf_trips table exists, date_range group creates correct columns | integration | `npm run test:int` | ❌ Wave 0 |
| NITF-06 | nitf_trips.pois populated at depth:1; nitf_poi.trips populated at depth:1 | integration | `npm run test:int` | ❌ Wave 0 |
| NITF-07 | nitf_tags unchanged and functional | existing (geom-hooks or api tests cover) | `npm run test:int` | ✅ existing |
| GEO-02 | nitf_destinations: lat/lon → geom auto-populated via trigger | integration | `npm run test:int` | ❌ Wave 0 |
| GEO-03 | nitf_poi: lat/lon → geom auto-populated via trigger | integration | `npm run test:int` | ❌ Wave 0 |
| TEST-02 | Bidirectional trips ↔ poi relationship populates at depth:1 | integration | `npm run test:int` | ❌ Wave 0 |
| TEST-04 | TypeScript compiles after type generation | type check | `npx tsc --noEmit` | ✅ (run in types plan) |

### Sampling Rate
- **Per task commit:** `npm run test:int` (entire suite, sequential, ~30-60 seconds)
- **Per wave merge:** `npm run test:int`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/int/nitf-trip-structure.int.spec.ts` — new test file covering NITF-01 through NITF-06, GEO-02, GEO-03, TEST-02, migration down()/up() cycle
- [ ] Update `tests/int/geom-hooks.int.spec.ts` — remove nitf_locations and nitf_waypoints blocks (those tables dropped); add nitf_destinations and nitf_poi blocks
- [ ] Update `tests/int/migration.int.spec.ts` — remove nitf_locations/nitf_waypoints from geom table list; add nitf_destinations/nitf_poi

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payload afterChange hook for geom | PostgreSQL BEFORE INSERT OR UPDATE trigger | Phase 2 (2026-03-15) | All new geo collections must use trigger pattern; NitfLocations.ts uses old pattern — do not copy |
| Hardcoded select for location type | Admin-managed lookup collection | Phase 4 (rotr_place_types), Phase 5 (nitf_poi_types) | More flexible; type enumeration changes don't require code deploys |
| anyone() / user() access helpers | published() / admin() helpers | Phase 1 (2026-03-12) | NitfLocations.ts still uses old helpers — do not copy |

**Deprecated/outdated:**
- `NitfLocations.ts`: Uses old `anyone()` + `user()` access, old afterChange hook pattern — dropped in this phase, do not use as template.
- `NitfWaypoints.ts`: Same — dropped in this phase.

---

## Open Questions

1. **nitf_posts_rels FK column cleanup**
   - What we know: `nitf_posts_rels` has `nitf_locations_id` and `nitf_trails_id` columns; dropping nitf_locations via CASCADE may or may not remove the FK constraint (depends on whether a FK constraint was declared on the column).
   - What's unclear: Whether a FK constraint was created — the Phase 2 migration that added geom to nitf_locations did not create FKs in nitf_posts_rels explicitly (Payload did this on first sync).
   - Recommendation: During migration authoring, inspect `information_schema.table_constraints` for nitf_posts_rels to determine what FKs exist; use DROP COLUMN IF EXISTS to clean orphaned columns safely.

2. **nitf_waypoints table and geom trigger**
   - What we know: nitf_waypoints has a geom column and trigger from Phase 2.
   - What's unclear: When we DROP TABLE nitf_waypoints CASCADE, does the trigger function `trg_nitf_waypoints_geom_fn` get dropped automatically? PostgreSQL drops the trigger (which is bound to the table) but the standalone function may persist.
   - Recommendation: Explicitly DROP FUNCTION trg_nitf_waypoints_geom_fn() and trg_nitf_locations_geom_fn() in migration up(), same as Phase 4 did for rotr_posts/rotr_locations trigger functions.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/migrations/20260316_rotr_days_split.ts` — canonical migration template for this phase
- Existing codebase: `src/collections/reddyontheroad/RotrPlaceTypes.ts` — lookup collection template
- Existing codebase: `src/collections/nerdintheforest/NitfTrails.ts` — PostGIS afterChange hook pattern (deprecated; trigger pattern is current)
- Existing codebase: `tests/int/rotr-days.int.spec.ts` — integration test structure template
- Existing codebase: `src/payload.config.ts` and `src/payload.config.export-types.ts` — both must be updated
- `.planning/phases/05-nerd-in-the-forest-trip-structure/05-CONTEXT.md` — all field/collection specs

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` accumulated decisions — Phase 4 pitfalls re: _rels tables, defaultSort location, as any cast, export-types mirror requirement
- PostgreSQL documentation: `DROP TABLE ... CASCADE` behavior for dependent triggers and FK constraints (behavior well-established)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, verified in package.json
- Architecture: HIGH — direct code-level evidence for all patterns from existing migrations and collection files
- Pitfalls: HIGH — all critical pitfalls sourced from Phase 3/4 accumulated decisions in STATE.md (observed failures, not hypothetical)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (Payload v3 API stable; PostGIS trigger patterns are database-level and do not change)

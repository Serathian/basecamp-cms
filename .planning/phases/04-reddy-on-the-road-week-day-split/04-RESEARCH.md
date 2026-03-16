# Phase 4: Reddy on the Road Week/Day Split - Research

**Researched:** 2026-03-16
**Domain:** Payload CMS collection design, PostgreSQL migrations, PostGIS triggers
**Confidence:** HIGH

## Summary

Phase 4 replaces the existing `rotr_posts` monolithic collection and `rotr_locations` lookup collection with two new collections: `rotr_days` (the primary diary-entry collection) and `rotr_place_types` (a simple lookup replacing the hardcoded `rotr_locations.place_type` enum). The CONTEXT.md made a scope-narrowing decision: there is no `rotr_weeks` hierarchy — days are standalone entries. This substantially simplifies the work; no bidirectional relationship management, no ordered array, no drag-and-drop reordering.

The implementation is a clean-slate schema change (drop and recreate, no data migration). The patterns for every task in this phase already exist verbatim in the codebase: the `RotrTags.ts` collection is a direct template for `RotrPlaceTypes.ts`; the `RotrPosts.ts` PostGIS afterChange hook becomes a BEFORE trigger on `rotr_days`; and the Phase 3 migration (`20260315_split_media_and_tags.ts`) is the reference for migration structure. The geom trigger approach established in Phase 2 (`20260315_080631_add_geom_triggers.ts`) MUST be used — not the old afterChange hook approach.

The migration must drop `rotr_posts` and `rotr_locations` (and their associated `_rels` and trigger objects), create `rotr_days` and `rotr_place_types`, add the PostGIS `geom` column and BEFORE INSERT OR UPDATE trigger on `rotr_days`, and update `payload_locked_documents_rels` to add `rotr_days_id` and `rotr_place_types_id` columns. The `down()` function must reverse all of this. Integration tests follow the exact patterns established in Phase 3 and the geom-hooks spec.

**Primary recommendation:** Copy `RotrTags.ts` → `RotrPlaceTypes.ts`, build `RotrDays.ts` modelled on `NitfPosts` (geo fields + trigger hook pattern), write one migration that drops old tables/triggers/rels and creates new ones, write integration tests mirroring `geom-hooks.int.spec.ts` and `media-tags-split.int.spec.ts`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope change:** No `rotr_weeks` collection — days are standalone. No week hierarchy, no bidirectional relationship, no drag-and-drop reordering.

**Collections:**
- `rotr_days` — new primary collection (replaces `rotr_posts`)
- `rotr_place_types` — new lookup collection
- `rotr_posts` — dropped (clean slate, no data migration)
- `rotr_locations` — dropped (clean slate, no data migration)

**rotr_days fields (locked):**
- `status` — select: draft / published
- `title` — text, required
- `date` — date field
- `latitude` — number
- `longitude` — number
- `location_name` — text
- `location_type` — relationship to `rotr_place_types`
- `weather` — text (free text)
- `temperature` — number
- `summary` — textarea
- `content` — textarea
- `tags` — relationship to `rotr_tags`, hasMany: true
- No mood field (user decision: removed)
- No photos array (user decision: removed)

**rotr_place_types fields (locked):**
- `name` — text, required
- `slug` — text, required, unique
- Same pattern as `rotr_tags`

**Admin display (locked):**
- Default columns: title, date, location_name, status
- Default sort: descending by date
- `useAsTitle`: title

**PostGIS (locked):**
- `rotr_days` gets a `geom` column via BEFORE INSERT OR UPDATE trigger (same pattern as Phase 2, NOT the old afterChange hook)
- Trigger: if latitude and longitude are set, execute ST_SetSRID(ST_MakePoint(lon, lat), 4326)

**Migration (locked):**
- Drop `rotr_posts` and `rotr_locations` — clean slate, no data migration
- Create `rotr_days` and `rotr_place_types`
- Migration must have a tested `down()` function

**Access control (locked):**
- `rotr_days`: read: published, create/update/delete: admin
- `rotr_place_types`: read: published, create/update/delete: admin

### Claude's Discretion

- Exact SQL for migration up()/down()
- Migration file naming convention
- Test fixture structure for integration tests
- Whether to add `published_at` date field (not explicitly requested)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROTR-01 | `rotr_weeks` collection: title, summary, cover_photo, date_range, days, tags | **SUPERSEDED by CONTEXT.md**: No rotr_weeks. rotr_days is the primary collection. |
| ROTR-02 | `rotr_days` collection: date, lat, lon, location_name, location_type, markdown_body, photos, weather, mood, week | **SUPERSEDED by CONTEXT.md**: rotr_days fields are locked (no photos, no mood, no week relation). See locked decisions above. |
| ROTR-03 | `rotr_weeks` ↔ `rotr_days` bidirectional relationship | **SUPERSEDED by CONTEXT.md**: No weeks hierarchy — eliminated entirely. |
| ROTR-04 | `rotr_locations` collection removed | Implemented by dropping `rotr_locations` in migration up(). |
| ROTR-05 | `rotr_tags` collection: name, slug | Already complete from Phase 3. No action needed. |
| ROTR-06 | Migration splits existing `rotr_posts` into weeks and days | **SUPERSEDED by CONTEXT.md**: Clean-slate drop — no data migration. |
| GEO-04 | `rotr_days` has `geom` column with afterChange hook | Implemented via BEFORE INSERT OR UPDATE trigger (established Phase 2 pattern). Must also add/remove trigger in migration down()/up(). |
| TEST-02 | Integration tests verify all bidirectional relationships | Scope reduced: no bidirectional relationship in this phase. Tests verify rotr_days.location_type relationship populates correctly. |
| TEST-04 | TypeScript types regenerated after each schema change | `npx payload generate:types` after each plan that modifies collections. |
| TEST-05 | All migrations have tested `down()` rollback functions | migration down() must be tested in integration spec (same pattern as media-tags-split.int.spec.ts). |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `payload` | project version | Collection config, CRUD, access control | All collections use CollectionConfig type |
| `@payloadcms/db-postgres` | project version | Migration API, `sql` tagged template, `MigrateUpArgs`/`MigrateDownArgs` | All migrations import from here |
| `drizzle-orm` | project version | `sql` tagged template for raw SQL in migrations | Used in `20260315_split_media_and_tags.ts` |
| `vitest` | project version | Integration test runner | `fileParallelism: false` required |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@payloadcms/db-postgres` `sql` | - | Raw SQL via Payload db access | In collection hooks; note: migration files use `drizzle-orm`'s `sql` |
| `sql.raw()` | - | Dynamic identifier interpolation | Trigger function names with variable table names |

**Import distinction (HIGH confidence — verified in existing migration files):**
- Collection hook files: `import { sql } from '@payloadcms/db-postgres'`
- Migration files: `import { sql } from 'drizzle-orm'`
- Dynamic trigger SQL: `db.execute(sql.raw(\`...\`))`

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| BEFORE trigger for geom | afterChange hook | Triggers are the established project standard as of Phase 2. Never use afterChange hook for geom. |
| Clean slate DROP+CREATE | ALTER TABLE | Project standard (established Phase 1/3). Simpler, less error-prone in dev. |

**Installation:** No new packages required. All dependencies already present.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── collections/reddyontheroad/
│   ├── RotrDays.ts          # new — replaces RotrPosts.ts
│   ├── RotrPlaceTypes.ts    # new — replaces RotrLocations.ts
│   ├── RotrMedia.ts         # unchanged
│   ├── RotrTags.ts          # unchanged
│   ├── RotrPosts.ts         # DELETE this file
│   └── RotrLocations.ts     # DELETE this file
├── migrations/
│   ├── YYYYMMDD_rotr_days_split.ts  # new migration
│   └── index.ts             # add new migration entry
└── payload.config.ts        # swap RotrPosts/RotrLocations for RotrDays/RotrPlaceTypes

tests/int/
└── rotr-days.int.spec.ts    # new integration test file
```

### Pattern 1: Lookup Collection (rotr_place_types)

**What:** Minimal name+slug collection with admin write access and public read.
**When to use:** Any admin-managed lookup list where hardcoded select options would be inflexible.
**Example (copy from RotrTags.ts):**
```typescript
// Source: src/collections/reddyontheroad/RotrTags.ts — exact template
import { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const RotrPlaceTypes: CollectionConfig = {
  slug: 'rotr_place_types',
  admin: {
    useAsTitle: 'name',
    group: 'Reddy on the Road',
  },
  access: {
    read: () => true,
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

**Note:** RotrTags uses `read: () => true`. The CONTEXT.md says `read: published`. Use the `published` access helper from `../users/access/published` for consistency with all other collections.

### Pattern 2: Geo Collection with Trigger (rotr_days)

**What:** Collection with lat/lon fields. Geom is managed by a BEFORE INSERT OR UPDATE PostgreSQL trigger (created in the migration), NOT by an afterChange hook in the collection file.
**When to use:** Any collection with latitude/longitude fields in this project.

```typescript
// Source: established pattern from Phase 2 (NitfPosts, NitfTrails, etc.)
// RotrDays.ts — NO geom hook in the collection file itself
import type { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const RotrDays: CollectionConfig = {
  slug: 'rotr_days',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'location_name', 'status'],
    defaultSort: '-date',
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'date', type: 'date' },
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    { name: 'location_name', type: 'text' },
    { name: 'location_type', type: 'relationship', relationTo: 'rotr_place_types' },
    { name: 'weather', type: 'text' },
    { name: 'temperature', type: 'number' },
    { name: 'summary', type: 'textarea' },
    { name: 'content', type: 'textarea' },
    { name: 'tags', type: 'relationship', relationTo: 'rotr_tags', hasMany: true },
  ],
  timestamps: true,
}
```

### Pattern 3: Migration — Drop old, create new, add trigger

**What:** Migration that drops old collections' tables, triggers, and _rels entries, then creates new tables, populates geom trigger, and updates `payload_locked_documents_rels`.
**Reference:** `20260315_split_media_and_tags.ts` for structure; `20260315_080631_add_geom_triggers.ts` for trigger creation syntax.

```typescript
// Source: src/migrations/20260315_080631_add_geom_triggers.ts (trigger pattern)
// Source: src/migrations/20260315_split_media_and_tags.ts (migration structure)
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Drop old tables (CASCADE handles dependent _rels tables automatically)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_posts CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_locations CASCADE`)

  // 2. Drop old triggers and trigger functions
  await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_rotr_posts_geom ON rotr_posts;`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_rotr_posts_geom_fn();`))
  await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_rotr_locations_geom ON rotr_locations;`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_rotr_locations_geom_fn();`))

  // 3. Create rotr_place_types
  await db.execute(sql`
    CREATE TABLE rotr_place_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // 4. Create rotr_days
  await db.execute(sql`
    CREATE TABLE rotr_days (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      title VARCHAR(255) NOT NULL,
      date TIMESTAMP WITH TIME ZONE,
      latitude NUMERIC,
      longitude NUMERIC,
      location_name VARCHAR(255),
      weather VARCHAR(255),
      temperature NUMERIC,
      summary TEXT,
      content TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // 5. Add geom column (PostGIS, outside Drizzle schema)
  await db.execute(sql`
    SELECT AddGeometryColumn('public', 'rotr_days', 'geom', 4326, 'POINT', 2)
  `)

  // 6. Create BEFORE INSERT OR UPDATE trigger for geom auto-population
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
  await db.execute(sql.raw(`
    DROP TRIGGER IF EXISTS trg_rotr_days_geom ON rotr_days;
    CREATE TRIGGER trg_rotr_days_geom
      BEFORE INSERT OR UPDATE ON rotr_days
      FOR EACH ROW
      EXECUTE FUNCTION trg_rotr_days_geom_fn();
  `))

  // 7. Update payload_locked_documents_rels
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_days_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rotr_place_types_id INTEGER
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_posts_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_locations_id
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reverse: drop new tables/triggers, recreate old tables
  // ... (see Common Pitfalls for down() completeness requirements)
}
```

### Pattern 4: Migration Registration

**What:** Every new migration must be added to `src/migrations/index.ts`.
**Reference:** Current `index.ts` — append new entry following existing naming convention.

```typescript
// Source: src/migrations/index.ts
import * as migration_YYYYMMDD_rotr_days_split from './YYYYMMDD_rotr_days_split'
// ... existing entries ...
export const migrations = [
  // ... existing ...
  {
    up: migration_YYYYMMDD_rotr_days_split.up,
    down: migration_YYYYMMDD_rotr_days_split.down,
    name: 'YYYYMMDD_rotr_days_split',
  },
]
```

### Pattern 5: payload.config.ts — swap collections

**What:** Remove `RotrPosts` and `RotrLocations` imports/registrations; add `RotrDays` and `RotrPlaceTypes`.

```typescript
// Source: src/payload.config.ts — current reddyontheroad block
// reddyontheroad.com — BEFORE
import { RotrMedia } from './collections/reddyontheroad/RotrMedia'
import { RotrTags } from './collections/reddyontheroad/RotrTags'
import { RotrPosts } from './collections/reddyontheroad/RotrPosts'
import { RotrLocations } from './collections/reddyontheroad/RotrLocations'

// reddyontheroad.com — AFTER
import { RotrMedia } from './collections/reddyontheroad/RotrMedia'
import { RotrTags } from './collections/reddyontheroad/RotrTags'
import { RotrDays } from './collections/reddyontheroad/RotrDays'
import { RotrPlaceTypes } from './collections/reddyontheroad/RotrPlaceTypes'
```

### Anti-Patterns to Avoid

- **afterChange hook for geom:** Never put geom population in a collection hook. Phase 2 established PostgreSQL BEFORE triggers as the project standard. The existing `RotrPosts.ts` hook is legacy — do not copy it.
- **Using `sql` from `@payloadcms/db-postgres` in migration files:** Migration files use `import { sql } from 'drizzle-orm'`. Collection files (hooks) use `import { sql } from '@payloadcms/db-postgres'`. Mixing these causes runtime errors.
- **Forgetting `sql.raw()` for trigger DDL:** Trigger function creation with `$$ ... $$` PL/pgSQL blocks cannot be parameterized. Must use `sql.raw()`.
- **Incomplete `down()` functions:** The Phase 2 migration had a bug where `down()` referenced tables it didn't recreate. Tests MUST verify down() and the test must run up() again at the end to restore state (see media-tags-split.int.spec.ts line 311).
- **Missing `payload_locked_documents_rels` column updates:** Phase 3 discovered that Payload generates FK columns in `payload_locked_documents_rels` for every registered collection. When swapping collections, old `*_id` columns must be dropped and new ones added. If skipped, Payload queries will fail.
- **Dropping table before trigger:** Because `rotr_posts CASCADE` drop will already remove dependent triggers and _rels table — do NOT separately drop `rotr_posts_rels` if using CASCADE. However, standalone trigger functions need explicit `DROP FUNCTION`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Geom auto-population | Custom afterChange hook | PostgreSQL BEFORE INSERT OR UPDATE trigger (created in migration) | Project standard, better transaction visibility, no async timing issues |
| Access control | Custom auth logic | `published.ts` and `admin.ts` helpers from `../users/access/` | Already tested, consistent across all collections |
| Lookup/enum collection | Hardcoded select options | `rotr_place_types` collection (same pattern as rotr_tags) | User can manage values without code change |
| FK column management | Manual ALTER per collection | Follow `payload_locked_documents_rels` pattern from Phase 3 | Payload auto-generates references to these columns |

**Key insight:** Everything in this phase has an exact template already in the codebase. Research and prototyping time is zero — the patterns are copy-and-adapt.

## Common Pitfalls

### Pitfall 1: Copying RotrPosts geom hook into RotrDays

**What goes wrong:** RotrDays ends up with a broken/redundant afterChange hook that tries to UPDATE geom after the trigger already set it, or causes double-population.
**Why it happens:** `RotrPosts.ts` still has the old afterChange hook pattern.
**How to avoid:** `RotrDays.ts` must NOT have any geom-related hook. The BEFORE trigger handles everything.
**Warning signs:** Collection file imports `sql` from `@payloadcms/db-postgres` for a geom UPDATE.

### Pitfall 2: Incomplete down() — forgetting triggers and functions

**What goes wrong:** `down()` drops `rotr_days` table but leaves behind the trigger function `trg_rotr_days_geom_fn()`. Re-running `up()` after `down()` succeeds but idempotently causes confusion; or re-running the migration on a clean DB fails with "function already exists".
**Why it happens:** Trigger functions are NOT dropped when the table is dropped (only the trigger binding is dropped with CASCADE).
**How to avoid:** `down()` must explicitly `DROP FUNCTION IF EXISTS trg_rotr_days_geom_fn()`.
**Warning signs:** Integration test passes on first run but fails on re-run.

### Pitfall 3: Missing payload_locked_documents_rels column management

**What goes wrong:** After deploying the new collection, Payload generates SQL that references `rotr_days_id` in `payload_locked_documents_rels` but the column doesn't exist. Admin UI crashes on document locking operations.
**Why it happens:** This was discovered in Phase 3 (decision 2026-03-15 in STATE.md). Easy to forget.
**How to avoid:** Migration `up()` must ADD `rotr_days_id` and `rotr_place_types_id`, DROP `rotr_posts_id` and `rotr_locations_id` in `payload_locked_documents_rels`.
**Warning signs:** Payload throws "column rotr_days_id does not exist" after migration runs.

### Pitfall 4: Forgetting to reset sequences after new table creation

**What goes wrong:** The first INSERT into `rotr_days` or `rotr_place_types` gets id=1 even if there are conflicts from old data. This is only a problem if `down()` restores the old tables with their original IDs and then `up()` is re-run.
**Why it happens:** SERIAL sequences start at 1 by default on a new table.
**How to avoid:** For this clean-slate phase with no data migration, `setval` is not required. But it's worth noting for `down()` testing — after down()+up(), the sequences restart from 1, which is fine since we're in dev and the old tables are empty recreations.
**Warning signs:** PK conflicts only if old table was partially populated in a test then down() restored and up() re-ran.

### Pitfall 5: sql.raw() not used for trigger DDL

**What goes wrong:** `db.execute(sql\`CREATE OR REPLACE FUNCTION ... $$ ... $$\`)` fails because the tagged template tries to parameterize the `$$` delimiters.
**Why it happens:** Drizzle's `sql` template does not support PL/pgSQL block syntax.
**How to avoid:** Always use `db.execute(sql.raw(\`CREATE OR REPLACE FUNCTION ...\`))` for trigger function and trigger DDL.
**Warning signs:** Migration throws a syntax error on the `$$` delimiter.

### Pitfall 6: Integration test parallelism

**What goes wrong:** Integration tests that call `down()` then `up()` within the test interfere with other spec files running concurrently, causing flaky failures.
**Why it happens:** Shared DB state.
**How to avoid:** `vitest.config.mts` already has `fileParallelism: false`. No additional config needed. Just be aware: don't set `concurrent: true` on any describe block in the migration test.
**Warning signs:** Tests pass individually but fail in suite runs.

## Code Examples

Verified patterns from official project sources:

### Trigger creation (rotr_days geom)
```typescript
// Source: src/migrations/20260315_080631_add_geom_triggers.ts
await db.execute(
  sql.raw(`
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
  `),
)

await db.execute(
  sql.raw(`
    DROP TRIGGER IF EXISTS trg_rotr_days_geom ON rotr_days;
    CREATE TRIGGER trg_rotr_days_geom
      BEFORE INSERT OR UPDATE ON rotr_days
      FOR EACH ROW
      EXECUTE FUNCTION trg_rotr_days_geom_fn();
  `),
)
```

### Geom integration test pattern
```typescript
// Source: tests/int/geom-hooks.int.spec.ts
it('rotr_days: creating with lat/lon populates geom', async () => {
  const day = await payload.create({
    collection: 'rotr_days',
    data: {
      title: 'Geom Test Day',
      status: 'published',
      latitude: 38.7169,
      longitude: -9.1399,
    },
  })

  const db = (payload.db as any).drizzle
  const result = await db.execute(sql`SELECT geom FROM rotr_days WHERE id = ${day.id}`)
  expect(result.rows[0].geom).not.toBeNull()

  await payload.delete({ collection: 'rotr_days', id: day.id })
})
```

### Migration down() pattern with trigger cleanup
```typescript
// Source: src/migrations/20260315_080631_add_geom_triggers.ts (trigger removal)
export async function down({ db }: MigrateDownArgs): Promise<void> {
  // 1. Drop trigger and function for rotr_days
  await db.execute(sql.raw(`DROP TRIGGER IF EXISTS trg_rotr_days_geom ON rotr_days;`))
  await db.execute(sql.raw(`DROP FUNCTION IF EXISTS trg_rotr_days_geom_fn();`))

  // 2. Drop new tables
  await db.execute(sql`DROP TABLE IF EXISTS rotr_days CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS rotr_place_types CASCADE`)

  // 3. Restore payload_locked_documents_rels columns
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_days_id
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS rotr_place_types_id
  `)
  // Note: restoring rotr_posts_id and rotr_locations_id only needed if recreating those tables
}
```

### location_type relationship test pattern
```typescript
// Source: tests/int/media-tags-split.int.spec.ts (relationship population pattern)
it('rotr_days.location_type populated relationship returns place_type object', async () => {
  const placeType = await payload.create({
    collection: 'rotr_place_types',
    data: { name: 'City', slug: `city-${Date.now()}` },
  })

  const day = await payload.create({
    collection: 'rotr_days',
    data: {
      title: 'Relationship Test Day',
      status: 'draft',
      location_type: placeType.id,
    },
  })

  const fetched = await payload.findByID({
    collection: 'rotr_days',
    id: day.id,
    depth: 1,
  })

  const populated = fetched.location_type as any
  expect(populated.id).toBe(placeType.id)
  expect(populated.name).toBe('City')

  await payload.delete({ collection: 'rotr_days', id: day.id })
  await payload.delete({ collection: 'rotr_place_types', id: placeType.id })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| afterChange hook for geom | BEFORE INSERT OR UPDATE trigger in migration | Phase 2 (2026-03-15) | Collection files have NO geom-related code; migrations manage triggers |
| Hardcoded select options for place types | `rotr_place_types` relationship collection | Phase 4 | Admin can add place types without a code change |
| Monolithic `rotr_posts` | Standalone `rotr_days` diary entries | Phase 4 | Simplified model, no hierarchy |

**Deprecated/outdated:**
- `RotrPosts.ts` afterChange geom hook: superseded by trigger pattern. Do not replicate.
- `RotrLocations.ts` using `editor` access role: role no longer exists (Phase 1 simplified to single `admin` role). Use `admin` access helper.

## Open Questions

1. **Does `rotr_posts_rels` exist as a separate table or is it `rotr_posts_rels`?**
   - What we know: Phase 3 migration references `rotr_posts_rels` (line 225 of `20260315_split_media_and_tags.ts`). `DROP TABLE rotr_posts CASCADE` should drop it.
   - What's unclear: Whether the `_rels` table has been renamed or modified since Phase 3.
   - Recommendation: The migration should use `DROP TABLE IF EXISTS rotr_posts CASCADE` — the IF EXISTS + CASCADE handles this gracefully regardless.

2. **Should `published_at` be added to rotr_days?**
   - What we know: Claude's discretion — not explicitly requested. `RotrPosts` had `published_at`. Other collections use `status` + `updatedAt`.
   - What's unclear: Whether the frontend will need a publish date separate from `date`.
   - Recommendation: Skip `published_at`. The `date` field serves as the diary entry date. The `createdAt`/`updatedAt` timestamps cover audit needs. Adding fields not requested adds schema noise.

3. **`payload_locked_documents_rels` existing columns for rotr_posts/rotr_locations**
   - What we know: Phase 3 added `rotr_posts_id` is NOT in `payload_locked_documents_rels` — Phase 3 only added media/tags. Phase 1 and 2 migrations should be checked.
   - What's unclear: Whether `rotr_posts_id` and `rotr_locations_id` columns currently exist in `payload_locked_documents_rels`.
   - Recommendation: Use `DROP COLUMN IF EXISTS` (not `DROP COLUMN`) in migration to be safe. If the column doesn't exist, no error.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (version from package.json) |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run tests/int/rotr-days.int.spec.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROTR-04 | `rotr_locations` table does not exist after migration | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| ROTR-04 | `rotr_posts` table does not exist after migration | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| GEO-04 | `rotr_days` geom populated when lat/lon provided | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| GEO-04 | `rotr_days` geom null when lat/lon absent | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| GEO-04 | `rotr_days` geom updates when coords change | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| TEST-02 | `rotr_days.location_type` populates as object at depth:1 | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| TEST-02 | `rotr_days.tags` populates as array at depth:1 | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| TEST-04 | TypeScript compiles clean after type regeneration | build check | `npx tsc --noEmit` | ❌ Wave 0 (task, not test file) |
| TEST-05 | Migration `down()` drops rotr_days, rotr_place_types | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |
| TEST-05 | Migration `down()` + `up()` cycle leaves DB in valid state | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/int/rotr-days.int.spec.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/int/rotr-days.int.spec.ts` — covers GEO-04, TEST-02, TEST-05, ROTR-04 (create with `.todo()` stubs before implementation plans)
- [ ] No framework or config changes needed — Vitest config already includes `tests/int/**/*.int.spec.ts`

## Sources

### Primary (HIGH confidence)
- `src/collections/reddyontheroad/RotrPosts.ts` — existing collection; source for afterChange hook pattern (not to copy for geom) and field reference
- `src/collections/reddyontheroad/RotrTags.ts` — direct template for RotrPlaceTypes
- `src/collections/reddyontheroad/RotrLocations.ts` — documents what is being dropped; `place_type` enum values inform rotr_place_types seed data
- `src/migrations/20260315_split_media_and_tags.ts` — reference for migration structure, `payload_locked_documents_rels` pattern
- `src/migrations/20260315_080631_add_geom_triggers.ts` — reference for BEFORE trigger DDL syntax
- `src/migrations/index.ts` — reference for migration registration
- `src/payload.config.ts` — reference for collection swap pattern
- `tests/int/geom-hooks.int.spec.ts` — template for GEO-04 test
- `tests/int/media-tags-split.int.spec.ts` — template for relationship tests and migration down() test
- `.planning/phases/04-reddy-on-the-road-week-day-split/04-CONTEXT.md` — authoritative decisions source
- `.planning/STATE.md` — project decisions, Phase 3 lessons (payload_locked_documents_rels discovery)
- `vitest.config.mts` — test runner configuration

### Secondary (MEDIUM confidence)
- Payload CMS docs (inferred from codebase patterns): `CollectionConfig.admin.defaultSort` accepts field name with `-` prefix for descending
- PostgreSQL docs: `DROP TABLE ... CASCADE` drops dependent FK constraints and triggers bound to the table; does NOT drop trigger functions

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use in the project
- Architecture: HIGH — every pattern exists verbatim in the codebase
- Pitfalls: HIGH — pitfalls are based on actual bugs and decisions documented in STATE.md
- Test patterns: HIGH — test structure copied from existing passing test files

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable project, no external library concerns)

# Phase 6: Jake Reddy Tech Stack Collection - Research

**Researched:** 2026-03-17
**Domain:** Payload CMS v3 — new collection, upload-based icon field, relationship field update, raw SQL migration
**Confidence:** HIGH

## Summary

Phase 6 introduces `jr_technologies` as a first-class Payload collection. Technologies are reusable entities with a name, icon (uploaded via `jr_media`), a category select, and a description textarea. The existing `jr_posts.tech_stack` field (currently `type: 'json'`) gets replaced with `type: 'relationship', relationTo: 'jr_technologies', hasMany: true` — turning freeform JSON text into structured, icon-carrying entities.

This is the smallest schema phase in the project. No geom triggers, no PostGIS, no bidirectional relationships, no child array tables. The migration creates one main table (`jr_technologies`), one `_rels` join table (`jr_technologies_rels` for `jr_media` icon relationship — only needed if icon is treated as `hasMany`; likely just a direct FK column if `hasMany: false`), updates `jr_posts_rels` to add a `jr_technologies_id` column, and updates `payload_locked_documents_rels`.

Key insight from prior phases: Payload v3 single (non-hasMany) relationship fields are stored as **direct FK columns on the main table** (e.g. `icon_id INTEGER`), NOT in a `_rels` table. A hasMany relationship IS stored in a `_rels` table. The `tech_stack` field on `jr_posts` is `hasMany: true`, so it will use the existing `jr_posts_rels` table with a new `jr_technologies_id` column. The `icon` upload field on `jr_technologies` is a single upload, so it stores as `icon_id INTEGER` directly on `jr_technologies`.

**Primary recommendation:** Follow the exact same pattern as `NitfPoiTypes` + `NitfPoi` (simple lookup collection + upload FK column on main table + `_rels` for hasMany). No new architectural patterns needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JR-01 | `jr_posts` has fields: title, slug, body (markdown), featured_image, publish_date, tags (relation to jr_tags) | `jr_posts` already has these fields per current `JrPosts.ts` — only `tech_stack` update needed |
| JR-02 | `jr_posts` has project fields: github_url, demo_url, tech_stack (relation to jr_technologies) | `tech_stack` currently `type: 'json'` — must become `type: 'relationship', relationTo: 'jr_technologies', hasMany: true`; migration must add `jr_technologies_id` to `jr_posts_rels` |
| JR-03 | `jr_technologies` collection: name, icon (media), category (select), description (textarea) | New collection file `JrTechnologies.ts`; icon uses `type: 'upload', relationTo: 'jr_media'`; category is `type: 'select'` with reasonable options; stored as direct FK column `icon_id` on `jr_technologies` table |
| JR-04 | `jr_tags` collection: name, slug | Already implemented in `JrTags.ts` — verified COMPLETE, no action needed |
| TEST-04 | TypeScript types regenerated after each schema change | Run `npx payload generate:types` after collection file changes, then run `tsc --noEmit` to verify clean; mirror config `payload.config.export-types.ts` must be updated to include `JrTechnologies` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| payload | 3.x | Collection definition, relationship fields, upload fields | Project's CMS — all collections use this |
| @payloadcms/db-postgres | 3.x | Raw SQL migration via `MigrateUpArgs`/`MigrateDownArgs` | All prior migrations use this pattern |
| drizzle-orm `sql` | bundled | SQL template literal in migrations | Established project pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | project version | Integration tests | Wave 0 stubs + implementation verification |

**No new dependencies required.** Phase 6 uses only libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── collections/
│   └── jake-reddy/
│       ├── JrPosts.ts          # UPDATE: tech_stack field type change
│       ├── JrTechnologies.ts   # NEW: jr_technologies collection
│       ├── JrMedia.ts          # unchanged
│       └── JrTags.ts           # unchanged
├── migrations/
│   ├── 20260317_jr_technologies.ts   # NEW: migration
│   └── index.ts                      # UPDATE: register new migration
└── payload.config.ts                 # UPDATE: register JrTechnologies
    payload.config.export-types.ts    # UPDATE: register JrTechnologies (mirror)
tests/
└── int/
    └── jr-tech-stack.int.spec.ts     # NEW: Wave 0 stubs + implementation tests
```

### Pattern 1: Simple Lookup Collection with Upload Field

`JrTechnologies` follows the `NitfPoiTypes` pattern (simple fields only) but adds an `upload` field for the icon:

```typescript
// Source: project pattern — analogous to JrMedia.ts + NitfPoiTypes.ts
export const JrTechnologies: CollectionConfig = {
  slug: 'jr_technologies',
  defaultSort: 'name',
  admin: {
    useAsTitle: 'name',
    group: 'Jake Reddy',
  },
  access: {
    read: () => true,        // lookup data always public (same as JrTags, NitfPoiTypes)
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'icon', type: 'upload', relationTo: 'jr_media' },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Language', value: 'language' },
        { label: 'Framework', value: 'framework' },
        { label: 'Database', value: 'database' },
        { label: 'Infrastructure', value: 'infrastructure' },
        { label: 'Tool', value: 'tool' },
        { label: 'Library', value: 'library' },
      ],
    },
    { name: 'description', type: 'textarea' },
  ],
}
```

### Pattern 2: Updating an Existing Relationship Field

`jr_posts.tech_stack` changes from `type: 'json'` to `type: 'relationship'`:

```typescript
// Source: project pattern — analogous to jr_tags field on JrPosts.ts
{
  name: 'tech_stack',
  type: 'relationship',
  relationTo: 'jr_technologies',
  hasMany: true,
}
```

**Migration implication:** The `jr_posts` table currently has a `tech_stack` JSON column (from Phase 1 merge). The migration must:
1. `ALTER TABLE jr_posts DROP COLUMN IF EXISTS tech_stack` (removes the JSON column)
2. `ALTER TABLE jr_posts_rels ADD COLUMN IF NOT EXISTS jr_technologies_id INTEGER` (adds FK for hasMany relationship)

### Pattern 3: Migration Structure

Established from prior phases — clean-slate add for new table, ALTER for modified table:

```typescript
// Source: project pattern from 20260316_nitf_trip_structure.ts
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Step 1: Create jr_technologies table
  // icon_id is a direct FK column (single upload, not hasMany)
  await db.execute(sql`
    CREATE TABLE jr_technologies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      icon_id INTEGER,
      category VARCHAR(255),
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // Step 2: Drop old json tech_stack column from jr_posts
  await db.execute(sql`ALTER TABLE jr_posts DROP COLUMN IF EXISTS tech_stack`)

  // Step 3: Add jr_technologies_id to jr_posts_rels (for hasMany tech_stack relationship)
  await db.execute(sql`
    ALTER TABLE jr_posts_rels ADD COLUMN IF NOT EXISTS jr_technologies_id INTEGER
  `)

  // Step 4: Update payload_locked_documents_rels
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS jr_technologies_id INTEGER
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Step 1: Remove payload_locked_documents_rels column
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS jr_technologies_id
  `)

  // Step 2: Remove jr_technologies_id from jr_posts_rels
  await db.execute(sql`ALTER TABLE jr_posts_rels DROP COLUMN IF EXISTS jr_technologies_id`)

  // Step 3: Restore tech_stack JSON column (clean-slate — no data to preserve)
  await db.execute(sql`ALTER TABLE jr_posts ADD COLUMN IF NOT EXISTS tech_stack JSONB`)

  // Step 4: Drop jr_technologies table
  await db.execute(sql`DROP TABLE IF EXISTS jr_technologies CASCADE`)
}
```

**No `_rels` table needed for `jr_technologies` itself** — its only relationship is the single `icon` upload field, which becomes a direct `icon_id` FK column on the main table (per STATE.md: "Payload v3 single (non-hasMany) relationship fields stored as direct FK columns").

### Pattern 4: Wave 0 Test Scaffold

Follows exact pattern from Phase 4 and Phase 5 Wave 0 plans:

```typescript
// Source: project pattern from tests/int/nitf-trip-structure.int.spec.ts
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { up, down } from '@/migrations/20260317_jr_technologies'  // file does not exist at Wave 0 — causes file-level skip, which is expected and acceptable

let payload: Payload
let db: any

describe('Phase 6: Jake Reddy Tech Stack Collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    db = (payload.db as any).drizzle
  })
  afterAll(async () => {
    if (payload?.db) { await payload.db.destroy!() }
  })

  // Stubs organized by requirement ID (JR-01/02/03/04, TEST-04)
})
```

### Anti-Patterns to Avoid

- **Creating a `_rels` table for `jr_technologies`:** Not needed. The only relationship on the collection is the single `icon` upload field, which becomes `icon_id` directly on the main table.
- **Forgetting `jr_posts_rels` update:** The `tech_stack` hasMany relationship lives in `jr_posts_rels`, not `jr_posts`. If this column is missing, Payload can't query tech_stack.
- **Forgetting to drop the old `tech_stack` JSON column:** Old column will cause a DB schema conflict with the new relationship-backed field. Must be dropped in migration.
- **Not updating `payload.config.export-types.ts`:** Per STATE.md decision from Phase 4 Plan 04-01 — this mirror config must be kept in sync with `payload.config.ts`.
- **Not updating `migration index.ts`:** Every new migration must be registered in `src/migrations/index.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon storage/serving | Custom file handler | `type: 'upload', relationTo: 'jr_media'` | Payload upload fields handle resize, storage path, and URL generation; `jr_media` already configured |
| Type generation | Manual interface authoring | `npx payload generate:types` | Auto-generated from collection config; manual types drift from actual schema |
| Category enumeration | Runtime string validation | Payload `type: 'select'` options | Enforced at the CMS layer, reflected in generated types |

**Key insight:** `jr_media` is already a configured upload collection for the Jake Reddy site. `jr_technologies.icon` simply points to it — no new upload configuration required.

## Common Pitfalls

### Pitfall 1: _rels Table for Single Upload Field
**What goes wrong:** Developer creates `jr_technologies_rels` table in migration unnecessarily, then Payload can't find `icon_id` on the main table.
**Why it happens:** Confusion between hasMany relationships (which need `_rels`) and single upload fields (which create a direct FK column).
**How to avoid:** Per STATE.md confirmed pattern: single `type: 'upload'` fields → `icon_id INTEGER` directly on `jr_technologies`. Only `hasMany: true` relationship fields go into `_rels` tables.
**Warning signs:** If you find yourself writing `CREATE TABLE jr_technologies_rels`, stop and reconsider.

### Pitfall 2: Forgetting to Drop tech_stack JSON Column
**What goes wrong:** Migration runs without dropping the old `jr_posts.tech_stack JSONB` column. Payload tries to manage `tech_stack` as a relationship but the old JSON column exists with the same name.
**Why it happens:** ALTER TABLE (add column) is easy to remember; DROP COLUMN (cleanup) is easy to skip.
**How to avoid:** Migration up() must include `ALTER TABLE jr_posts DROP COLUMN IF EXISTS tech_stack` before the relationship columns are added.
**Warning signs:** Payload type errors or integration test failures complaining about `tech_stack` column type mismatch.

### Pitfall 3: Missing jr_posts_rels Column
**What goes wrong:** `jr_technologies` table created, `JrPosts.ts` updated, but `jr_posts_rels.jr_technologies_id` column never added. Payload silently stores no technologies on posts.
**Why it happens:** The relationship lives in the _rels table of the *parent* collection (jr_posts), not in the new collection's table.
**How to avoid:** Explicitly verify `jr_posts_rels` has `jr_technologies_id` column in integration test.
**Warning signs:** `payload.find({ collection: 'jr_posts', depth: 1 })` returns `tech_stack: []` even after creating technologies and linking them.

### Pitfall 4: Mirror Config Not Updated
**What goes wrong:** `payload.config.ts` registers `JrTechnologies` but `payload.config.export-types.ts` does not. Types generate without `JrTechnology` type, downstream frontends break.
**Why it happens:** Two config files must stay in sync; easy to update one and forget the other.
**How to avoid:** Update both files atomically in the same plan task (per STATE.md decision from Phase 3 Plan 03-01).
**Warning signs:** `tsc --noEmit` passes against `payload.config.ts` but generates types missing `JrTechnology`.

### Pitfall 5: group: 'Jake Reddy' Missing from Admin Config
**What goes wrong:** Collection appears in the wrong admin sidebar group or ungrouped.
**Why it happens:** New collection file created without copying admin group from `JrMedia.ts` / `JrTags.ts`.
**How to avoid:** `admin: { useAsTitle: 'name', group: 'Jake Reddy' }` is the established pattern for all jr_* collections.
**Warning signs:** Collection appears outside the Jake Reddy section in admin sidebar.

## Code Examples

### Current State: jr_posts.tech_stack (to be replaced)
```typescript
// Source: src/collections/jake-reddy/JrPosts.ts (current)
{ name: 'tech_stack', type: 'json' },
```

### Target State: jr_posts.tech_stack
```typescript
// Source: analogous to tags field on JrPosts.ts
{
  name: 'tech_stack',
  type: 'relationship',
  relationTo: 'jr_technologies',
  hasMany: true,
}
```

### Database Layout After Migration
```
jr_technologies (main table)
├── id SERIAL PRIMARY KEY
├── name VARCHAR(255) NOT NULL
├── icon_id INTEGER             ← direct FK for single upload field
├── category VARCHAR(255)
├── description TEXT
├── updated_at / created_at

jr_posts (modified)
└── tech_stack JSONB            ← DROPPED

jr_posts_rels (modified)
└── jr_technologies_id INTEGER  ← ADDED for tech_stack hasMany relationship

payload_locked_documents_rels
└── jr_technologies_id INTEGER  ← ADDED
```

### Integration Test CRUD Pattern (from prior phases)
```typescript
// Source: tests/int/nitf-trip-structure.int.spec.ts
it('jr_technologies CRUD with icon and relationship to jr_posts', async () => {
  // Create technology
  const tech = await payload.create({
    collection: 'jr_technologies',
    data: { name: 'TypeScript', category: 'language' },
  })
  expect(tech.id).toBeDefined()

  // Create post that references technology
  const post = await payload.create({
    collection: 'jr_posts',
    data: {
      title: 'Test Project',
      slug: `test-project-${Date.now()}`,
      status: 'draft',
      tech_stack: [tech.id],
    },
  })
  expect(post.tech_stack).toHaveLength(1)

  // Read back with depth:1 to get populated technologies
  const populated = await payload.findByID({
    collection: 'jr_posts',
    id: post.id,
    depth: 1,
  })
  const stack = populated.tech_stack as any[]
  expect(stack[0].name).toBe('TypeScript')

  // Cleanup
  await payload.delete({ collection: 'jr_posts', id: post.id })
  await payload.delete({ collection: 'jr_technologies', id: tech.id })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tech_stack: json` on jr_posts | `tech_stack: relationship[] to jr_technologies` | Phase 6 | Enables icon display, structured categories, reusable entities |
| Free-text technology list | Normalized lookup collection | Phase 6 | Admin can select from dropdown instead of typing JSON |

**Deprecated/outdated:**
- `tech_stack JSONB` column on `jr_posts`: replaced by `jr_posts_rels.jr_technologies_id` pattern in this phase.

## Open Questions

1. **Category options for jr_technologies**
   - What we know: Requirement says `category (select)` — options not specified
   - What's unclear: Exact option set (language, framework, database, infrastructure, tool, library, other?)
   - Recommendation: Claude's discretion — use a sensible default set (language/framework/database/infrastructure/tool/library). These can be expanded without a migration since it's just a select config change.

2. **JR-04 status**
   - What we know: `jr_tags` with `name, slug` fields is already fully implemented in `JrTags.ts` with correct fields and migration
   - What's unclear: Nothing — requirement is complete
   - Recommendation: JR-04 is DONE. Planner should mark it verified-complete in Wave 0 or skip entirely.

3. **JR-01 status**
   - What we know: `jr_posts` already has title, slug, body (textarea), cover_image (upload), published_at (date), tags (relationship to jr_tags)
   - What's unclear: Whether "body (markdown)" vs current "body (textarea)" is a field type concern — `textarea` is Payload's plaintext/markdown body type, which is the correct approach per project constraint "markdown bodies must remain markdown"
   - Recommendation: JR-01 is satisfied by the existing schema. No changes needed for JR-01 specifically.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (version from project) |
| Config file | `vitest.config.mts` |
| Quick run command | `npm run test:int -- --reporter=verbose` |
| Full suite command | `npm run test:int` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JR-01 | jr_posts fields: title, slug, body, cover_image, published_at, tags | integration | `npm run test:int` | ❌ Wave 0 — `tests/int/jr-tech-stack.int.spec.ts` |
| JR-02 | jr_posts.tech_stack is relationship to jr_technologies with hasMany | integration | `npm run test:int` | ❌ Wave 0 |
| JR-03 | jr_technologies collection: name, icon (media), category, description | integration | `npm run test:int` | ❌ Wave 0 |
| JR-04 | jr_tags: name, slug | integration | `npm run test:int` | ❌ Wave 0 (already passing via existing tests, but stub needed) |
| TEST-04 | TypeScript types clean after schema change | type-check | `npx tsc --noEmit` | ❌ Wave 0 stub; run after collection + migration implementation |

### Sampling Rate
- **Per task commit:** `npm run test:int` (full suite — Phase 6 is small enough that full suite is fast)
- **Per wave merge:** `npm run test:int && npx tsc --noEmit`
- **Phase gate:** Full suite green + `tsc --noEmit` clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/int/jr-tech-stack.int.spec.ts` — covers JR-01, JR-02, JR-03, JR-04, TEST-04
- [ ] `src/migrations/20260317_jr_technologies.ts` — must exist for migration import in spec (file will cause file-level skip at Wave 0 if not present; acceptable per established pattern)

## Sources

### Primary (HIGH confidence)
- Project source files read directly: `src/collections/jake-reddy/JrPosts.ts`, `JrTags.ts`, `JrMedia.ts`, `NitfTrips.ts`, `NitfPoiTypes.ts`, `NitfPoi.ts`
- Project migration: `src/migrations/20260316_nitf_trip_structure.ts` — verified FK column patterns
- Project state: `.planning/STATE.md` — verified all architectural decisions (direct FK for single relationships, `_rels` for hasMany, group field flattening, enum recreation, idempotent migrations)
- Project test files: `tests/int/nitf-trip-structure.int.spec.ts` — verified test patterns
- `src/payload.config.ts` — verified collection registration pattern and both config files

### Secondary (MEDIUM confidence)
- Payload v3 documentation patterns inferred from 5 prior phases of implementation in this same project — extremely high confidence given empirical verification in STATE.md decisions

### Tertiary (LOW confidence)
- None — all findings are from direct project source inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all patterns proven in prior phases
- Architecture: HIGH — migration pattern directly observed from Phase 5 implementation; column layout confirmed from STATE.md decisions
- Pitfalls: HIGH — all pitfalls derive from documented STATE.md surprises from prior phases (direct FK vs _rels, mirror config, etc.)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable project; patterns won't change mid-project)

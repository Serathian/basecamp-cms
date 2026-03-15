# Phase 3: Site-Specific Media & Tags - Research

**Researched:** 2026-03-15
**Domain:** Payload CMS v3 collection splitting, data migration, admin UI filtering
**Confidence:** HIGH

## Summary

Phase 3 splits the shared `media` (upload collection) and `tags` (simple taxonomy) into three site-namespaced variants each: `jr_media`, `nitf_media`, `rotr_media` and `jr_tags`, `nitf_tags`, `rotr_tags`. The project already has a working pattern for this split that is 80% implemented — `Tags` already has a `site` select field, and every consumer collection already uses `filterOptions: { site: { equals: '...' } }` in its `tags` relationship fields. The tags work in the UI via `filterOptions`, but the underlying table is still shared.

The goal is to complete the isolation: replace the single `media` table and `tags` table with six dedicated collections. Each collection gets its own database table, own Payload slug, and own admin panel section. No `filterOptions` are needed after the split — the relationship `relationTo` directly references the correct collection. Consumer collections (`jr_posts`, `nitf_posts`, `rotr_posts`, etc.) must have their `cover_image` upload fields and `tags` relationship fields updated to point at the new slugs. A migration copies existing rows into new tables and updates all FK references.

The main technical challenge is the data migration: `media` records must be attributed to one of the three sites (likely by inspecting which collection currently references them), and `tags` records have a `site` field that already tells us the destination. Migration must also handle Payload's internal `_rels` join tables (for `relationship` fields using `hasMany: true`) and the `upload` FK columns on consumer tables.

**Primary recommendation:** Create six new collection files, write a single migration that creates the new tables and copies data with attribution logic, then update all consumer collection files and regenerate types.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITESPEC-01 | `media` split into `jr_media`, `nitf_media`, `rotr_media` | New CollectionConfig with `upload: true` per site |
| SITESPEC-02 | `tags` split into `jr_tags`, `nitf_tags`, `rotr_tags` | New CollectionConfig (name + slug fields only) per site |
| SITESPEC-03 | Media uploads filtered by site in admin UI | Upload fields on consumer collections reference site-specific slug directly |
| SITESPEC-04 | Tags filtered by site in admin UI | Relationship fields on consumer collections reference site-specific slug directly |
| SITESPEC-05 | Migration migrates existing media/tags to site-specific collections | SQL INSERT INTO new tables + UPDATE FK columns + update _rels rows |
| TEST-02 | Integration tests verify all bidirectional relationships | Relationship field tests: create post, verify populated tag/media ref resolves |
| TEST-04 | TypeScript types regenerated after each schema change | `npx payload generate:types` after schema files updated |
| TEST-05 | All migrations have tested `down()` rollback functions | Migration must DROP the 6 new tables and restore consumer FK columns |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| payload | 3.78.0 | CMS framework - CollectionConfig API | Already in use |
| @payloadcms/db-postgres | 3.78.0 | PostgreSQL adapter, `MigrateUpArgs` | Already in use |
| drizzle-orm | (via @payloadcms/db-postgres) | `sql` tagged template for raw SQL in migrations | Established pattern in this project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | 0.34.2 | Image processing for upload collections | Required by Payload upload when sharp is configured globally — no per-collection config needed |

### No New Dependencies
This phase requires zero new npm packages. All patterns are implemented with existing Payload v3 APIs and existing project conventions.

**Installation:** None required.

## Architecture Patterns

### New Collection Files

Six new collection files, two groups:

**Media collections** (three files, identical structure, different slug):
```
src/collections/jake-reddy/JrMedia.ts
src/collections/nerdintheforest/NitfMedia.ts
src/collections/reddyontheroad/RotrMedia.ts
```

**Tag collections** (three files, identical structure, different slug):
```
src/collections/jake-reddy/JrTags.ts
src/collections/nerdintheforest/NitfTags.ts
src/collections/reddyontheroad/RotrTags.ts
```

### Pattern 1: Site-Specific Upload Collection (Media)

Each media collection is a near-copy of the existing `Media.ts` with:
- A namespaced `slug`
- `admin.useAsTitle: 'filename'` for usable display in pickers
- Access using existing `admin` helper for write, `() => true` for read (same as current Media)

```typescript
// Source: src/collections/Media.ts (existing, adapted)
import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const JrMedia: CollectionConfig = {
  slug: 'jr_media',
  admin: {
    useAsTitle: 'filename',
    group: 'Jake Reddy',
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
```

The existing `Media.ts` uses `read: () => true` with no auth check. The new collections should use the same read pattern and add the `admin` helper for write operations to match the access pattern used on all other collections in this project.

### Pattern 2: Site-Specific Tag Collection

Tag collections are minimal — just `name` and `slug`. The `site` select field becomes unnecessary because the collection itself is the discriminator.

```typescript
// Source: src/collections/shared/Tags.ts (existing, simplified)
import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const JrTags: CollectionConfig = {
  slug: 'jr_tags',
  admin: {
    useAsTitle: 'name',
    group: 'Jake Reddy',
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

### Pattern 3: Consumer Collection Update (Upload Field)

`cover_image` fields on consumer collections must change `relationTo` from `'media'` to the site-specific slug. No `filterOptions` needed.

```typescript
// Before:
{ name: 'cover_image', type: 'upload', relationTo: 'media' }

// After (for jr_posts):
{ name: 'cover_image', type: 'upload', relationTo: 'jr_media' }
```

Collections to update:
- `jr_posts` → `jr_media`
- `nitf_posts` → `nitf_media`
- `rotr_posts` → `rotr_media`

### Pattern 4: Consumer Collection Update (Tags Relationship Field)

`tags` relationship fields change `relationTo` from `'tags'` to the site-specific slug, and `filterOptions` is removed entirely (no longer needed).

```typescript
// Before (jr_posts):
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'tags',
  hasMany: true,
  filterOptions: { site: { equals: 'jake-reddy' } },
}

// After (jr_posts):
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'jr_tags',
  hasMany: true,
}
```

Collections to update:
- `jr_posts` → `jr_tags`
- `nitf_posts` → `nitf_tags`
- `rotr_posts` → `rotr_tags`

### Pattern 5: payload.config.ts Registration

New collections are imported and added to the `collections` array. Old `Media` and `Tags` entries are removed. The order within each site group is cosmetic but should be consistent.

```typescript
// Remove:
import { Media } from './collections/Media'
import { Tags } from './collections/shared/Tags'

// Add:
import { JrMedia } from './collections/jake-reddy/JrMedia'
import { NitfMedia } from './collections/nerdintheforest/NitfMedia'
import { RotrMedia } from './collections/reddyontheroad/RotrMedia'
import { JrTags } from './collections/jake-reddy/JrTags'
import { NitfTags } from './collections/nerdintheforest/NitfTags'
import { RotrTags } from './collections/reddyontheroad/RotrTags'
```

### Pattern 6: Migration Structure

The migration follows the project's established pattern: raw SQL via `sql` tagged templates from `drizzle-orm`, `MigrateUpArgs`/`MigrateDownArgs` from `@payloadcms/db-postgres`.

**Up logic:**
1. Create 6 new tables by copying structure from `media` and `tags`
2. Migrate `tags` rows: split by existing `site` column value
3. Migrate `media` rows: attribute by inspecting which `_rels` tables reference them (join via `_rels.media_id`)
4. Update FK columns on consumer tables (`jr_posts.cover_image_id`, etc.) to point at new table IDs
5. Update `_rels` tables for tags relationships (`jr_posts_rels.tags_id` → new `jr_tags_id` column)
6. Drop old `media` and `tags` tables

**Down logic:**
1. Recreate `media` and `tags` tables
2. Copy data back (reverse migration)
3. Restore FK columns and `_rels` rows
4. Drop the 6 site-specific tables

**Critical constraint from CLAUDE.md equivalent (STATE.md):** `push: false` on DB adapter — all schema changes require explicit migrations. Never use `payload migrate:fresh` in production.

### Anti-Patterns to Avoid

- **Keeping `filterOptions` after the split:** Unnecessary after `relationTo` points at site-specific collection. Remove them to avoid confusion.
- **Adding a `site` select field to new media/tag collections:** Redundant — the collection slug is the discriminator.
- **Forgetting `_rels` tables:** Payload stores `hasMany: true` relationships in join tables (e.g., `jr_posts_rels`). The `tags_id` column in these tables must be migrated to new `jr_tags_id`, `nitf_tags_id`, or `rotr_tags_id` columns.
- **Assuming media attribution is 1:1:** A media record might theoretically be referenced by multiple collections. The migration must handle this correctly (join to `_rels` to determine site ownership).
- **Dropping the old `media` table while files still exist:** Payload stores uploaded files on disk/S3 using the `media` slug as the path prefix. The new collections use different slugs, which changes the upload directory. Existing file paths in the DB point to `media/` paths, not `jr_media/` etc. The migration must preserve the file data (alt text, filename) but the physical files do not need to move — only the DB rows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Admin UI filtering | Custom admin component | `relationTo` pointing at site-specific collection | Payload's upload/relationship picker already scopes to the referenced collection slug |
| Tag deduplication | Custom merge logic | Simple INSERT from SELECT with `site` filter | Tags already have a `site` column; migration is a direct copy |
| File path migration | File system renaming script | Leave files in place; only migrate DB rows | Payload resolves file URLs from the stored filename, not from the collection slug in the path — the upload directory is configured at the adapter level |
| Type generation | Manual TypeScript types | `npx payload generate:types` | Payload auto-generates all collection types from config |

**Key insight:** The `filterOptions` approach on the shared `tags` collection was a workaround. After the split, the Payload admin UI naturally scopes the picker to the referenced collection — no filtering configuration needed at all.

## Common Pitfalls

### Pitfall 1: Payload _rels Join Table Column Naming
**What goes wrong:** When a `relationship` field with `hasMany: true` points at collection `'tags'`, Payload's internal join table has a column named `tags_id`. After renaming to `jr_tags`, `nitf_tags`, `rotr_tags`, the column names in `_rels` tables change. If the migration does not add and populate the new columns before removing the old `tags_id` column, all tag relationships will be broken.
**Why it happens:** Payload generates `_rels` column names from the collection slug. Changing the slug changes the expected column name.
**How to avoid:** In the migration, add `jr_tags_id`, `nitf_tags_id`, `rotr_tags_id` columns to the relevant `_rels` tables, populate them from the existing `tags_id` column (joined to the `tags.site` value), then drop `tags_id`.
**Warning signs:** After migration, `payload.find({ collection: 'jr_posts' })` returns posts with empty `tags` arrays even though the data existed before.

### Pitfall 2: Upload Directory Paths vs. Collection Slugs
**What goes wrong:** Believing physical media files need to be moved when the collection slug changes.
**Why it happens:** Developer assumes Payload uses the slug as the filesystem directory.
**How to avoid:** Payload stores the full filename (including any subdirectory) in the `filename` column of the media table. The `staticDir` for upload storage is configured on the adapter globally, not per-collection-slug. Rows can be copied to new tables without touching files.
**Warning signs:** Images 404 after migration when no files were moved.

### Pitfall 3: Slug Uniqueness Constraint After Split
**What goes wrong:** Tags from different sites might have the same slug (e.g., `nitf_tags.slug = 'camping'` and `rotr_tags.slug = 'camping'`). Before the split, the shared `tags` table had a single `unique` constraint on `slug`. After the split, each table has its own `unique` constraint, so duplicate slugs across sites are fine — but within a single site-specific table, slugs must remain unique.
**Why it happens:** The original `tags` table had `unique: true` on slug globally. After split, each new table enforces uniqueness independently.
**How to avoid:** Migration does a simple `INSERT INTO jr_tags SELECT id, name, slug FROM tags WHERE site = 'jake-reddy'`. No deduplication needed as slugs were already unique per site.
**Warning signs:** Migration fails with unique constraint violation if tags with the same slug existed in the original shared table for the same site.

### Pitfall 4: Collection Registration Order in payload.config.ts
**What goes wrong:** Consumer collections (e.g., `jr_posts`) that reference `jr_tags` are registered before `JrTags` in the config. Payload v3 resolves collections by slug at config build time.
**Why it happens:** Import order drift when adding new collections.
**How to avoid:** Register all collections that are referenced by others before the collections that reference them, or simply keep the existing order pattern (Users, Media, Tags first, then post collections).
**Warning signs:** Payload throws "Collection with slug 'jr_tags' not found" during startup.

### Pitfall 5: Forgetting the `authors` table
**What goes wrong:** `jr_posts`, `nitf_posts`, `rotr_posts` all have `{ name: 'author', type: 'relationship', relationTo: 'authors' }`. The `Authors` collection is in `src/collections/shared/Authors.ts`. This is a shared collection that stays shared (not split). Do not accidentally rename or remove it.
**Why it happens:** Developer splits all shared collections, but `authors` should stay shared.
**How to avoid:** Only split `media` and `tags`. Leave `Authors` in `src/collections/shared/` untouched.

## Code Examples

Verified patterns from the existing project codebase:

### Migration: Create new table from existing (Tags split)
```typescript
// Source: project migration pattern (established in 20260314_171829)
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create jr_tags table
  await db.execute(sql`
    CREATE TABLE jr_tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `)

  // Populate from existing tags where site = 'jake-reddy'
  await db.execute(sql`
    INSERT INTO jr_tags (id, name, slug, updated_at, created_at)
    SELECT id, name, slug, updated_at, created_at
    FROM tags
    WHERE site = 'jake-reddy'
  `)
  // ... repeat for nitf_tags (site = 'nerdintheforest') and rotr_tags (site = 'reddyontheroad')
}
```

### Migration: Update _rels join table after collection slug change
```typescript
// Source: Payload v3 _rels pattern (observed in existing jr_posts_rels table)
// jr_posts_rels currently has a tags_id column
// After split, it needs a jr_tags_id column

await db.execute(sql`
  ALTER TABLE jr_posts_rels ADD COLUMN IF NOT EXISTS jr_tags_id INTEGER
`)

// Populate jr_tags_id from existing tags_id
// Only rows where the related tag has site='jake-reddy'
await db.execute(sql`
  UPDATE jr_posts_rels r
  SET jr_tags_id = r.tags_id
  WHERE r.path = 'tags'
    AND EXISTS (
      SELECT 1 FROM tags t WHERE t.id = r.tags_id AND t.site = 'jake-reddy'
    )
`)

await db.execute(sql`
  ALTER TABLE jr_posts_rels DROP COLUMN IF EXISTS tags_id
`)
```

### Consumer collection after update (no filterOptions needed)
```typescript
// Source: src/collections/jake-reddy/JrPosts.ts (to be updated)
// Tags field — after split:
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'jr_tags',   // was 'tags'
  hasMany: true,
  // filterOptions removed — no longer needed
}
```

### Type regeneration command
```bash
# Source: package.json scripts
npm run generate:types
# Which runs: cross-env NODE_OPTIONS=--no-deprecation payload generate:types
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shared `media` + `tags` with `filterOptions` | Per-site collections with direct `relationTo` | Phase 3 (this phase) | Simpler admin UI, no accidental cross-site contamination |
| `site` select field on `tags` as discriminator | Separate table per site | Phase 3 (this phase) | `site` field removed from new tag collections; collection slug is the discriminator |

**Deprecated after this phase:**
- `src/collections/Media.ts` — replaced by JrMedia, NitfMedia, RotrMedia
- `src/collections/shared/Tags.ts` — replaced by JrTags, NitfTags, RotrTags
- `filterOptions: { site: { equals: '...' } }` on all tags relationship fields — removed

## Open Questions

1. **Media attribution: are there any media records not referenced by any collection?**
   - What we know: migration needs to attribute media to a site. Records referenced via `_rels` or FK columns can be attributed by inspecting consumer tables.
   - What's unclear: orphaned media records (uploaded but never attached to content) cannot be attributed automatically.
   - Recommendation: Place orphaned media records in `jr_media` as the default site (Jake Reddy is the primary site). Log a count of orphaned records during migration for awareness.

2. **NitfPosts `cover_image` currently points to `media`. Are there other collections referencing `media`?**
   - What we know: JrPosts, NitfPosts, RotrPosts all have `cover_image` → `media`. Other collections (NitfTrails, NitfWaypoints, NitfLocations, RotrLocations) do NOT have media fields currently.
   - What's unclear: Phase 4 will add `rotr_weeks.cover_photo` and `rotr_days.photos` (media array) — these will target `rotr_media` and are out of scope for Phase 3.
   - Recommendation: Only update the three current `cover_image` fields in Phase 3. Phase 4 will add new media references to the new `rotr_media` collection directly.

3. **Does changing `upload: true` collection slug break existing stored file URLs?**
   - What we know: Payload stores the full filename in the DB. The staticURL is configured globally on the DB adapter, not per collection slug. File bytes on disk are unaffected by collection slug changes.
   - What's unclear: Whether Payload v3's `/api/${slug}/${filename}` serve path changes behavior.
   - Recommendation: Test after migration by fetching a known media record and confirming the URL resolves. This is LOW risk given how Payload stores file references.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.mts` |
| Quick run command | `npm run test:int` |
| Full suite command | `npm run test:int` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITESPEC-01 | `jr_media`, `nitf_media`, `rotr_media` tables exist with correct columns | integration | `npm run test:int` | ❌ Wave 0 |
| SITESPEC-02 | `jr_tags`, `nitf_tags`, `rotr_tags` tables exist with correct columns | integration | `npm run test:int` | ❌ Wave 0 |
| SITESPEC-03 | Creating `jr_media` record works; `nitf_media`/`rotr_media` are separate | integration | `npm run test:int` | ❌ Wave 0 |
| SITESPEC-04 | `jr_posts.tags` relationship resolves to `jr_tags` collection, not shared | integration | `npm run test:int` | ❌ Wave 0 |
| SITESPEC-05 | Existing tag/media rows present in new tables after migration | integration | `npm run test:int` | ❌ Wave 0 |
| TEST-02 | jr_post.tags populated relationship returns tag object (not just ID) | integration | `npm run test:int` | ❌ Wave 0 |
| TEST-04 | TypeScript types compile without errors after schema change | build/lint | `npx tsc --noEmit` | manual verify |
| TEST-05 | Migration `down()` successfully drops new tables and restores old state | integration | `npm run test:int` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:int`
- **Per wave merge:** `npm run test:int`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/int/media-tags-split.int.spec.ts` — covers SITESPEC-01 through SITESPEC-05, TEST-02, TEST-05
- [ ] Migration `down()` test block within the spec — covers TEST-05 for this migration

*(No new framework install needed — Vitest and Payload test infrastructure already configured)*

## Sources

### Primary (HIGH confidence)
- `src/collections/Media.ts` — existing upload collection structure
- `src/collections/shared/Tags.ts` — existing tags collection with `site` discriminator field
- `src/collections/jake-reddy/JrPosts.ts` — existing `filterOptions` pattern on tags relationship
- `src/collections/nerdintheforest/NitfPosts.ts` — existing `filterOptions` on tags + `cover_image` pointing to `media`
- `src/collections/reddyontheroad/RotrPosts.ts` — same patterns
- `src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts` — established migration pattern (CREATE TABLE, DROP TABLE, ALTER TABLE, `_rels` table management)
- `src/payload.config.ts` — collection registration pattern
- `package.json` — test commands and Payload version (3.78.0)
- `.planning/STATE.md` — `push: false` constraint, clean-slate migration precedent

### Secondary (MEDIUM confidence)
- Phase 2 migration (`20260315_080631_add_geom_triggers.ts`) — confirms `sql.raw()` vs `sql` tagged template usage patterns in this project

### Tertiary (LOW confidence)
- None — all findings verified from project source files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and existing collection files
- Architecture: HIGH — collection split pattern is fully derivable from existing `filterOptions` approach and `Tags.site` field
- Pitfalls: HIGH — `_rels` table column naming derived from observed `jr_posts_rels.tags_id` in existing migration; upload path concern is LOW risk but documented
- Migration strategy: HIGH — tags migration is deterministic (site column); media migration requires one design decision (orphan attribution) documented in Open Questions

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable Payload v3 APIs, no fast-moving dependencies)

---
phase: 03-site-specific-media-tags
plan: "03"
subsystem: database
tags: [payload, migrations, sql, media, tags, integration-tests]

# Dependency graph
requires:
  - phase: 03-01
    provides: JrMedia, NitfMedia, RotrMedia, JrTags, NitfTags, RotrTags collection registrations
  - phase: 03-02
    provides: consumer post collections updated to site-specific media/tags slugs
provides:
  - src/migrations/20260315_split_media_and_tags.ts — data migration splitting media and tags into 6 site-specific tables
  - Updated src/migrations/index.ts with new migration registered
  - Integration tests in tests/int/media-tags-split.int.spec.ts replacing all .todo() stubs
affects:
  - All 6 post-type collections (jr_posts, nitf_posts, rotr_posts) — jr/nitf/rotr_tags_id FKs in _rels tables
  - payload_locked_documents_rels — media_id/tags_id columns replaced with 6 site-specific columns

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration pattern: CREATE TABLE + INSERT SELECT + ALTER TABLE for each site, then DROP TABLE"
    - "Payload _rels column attribution: tags_id renamed to {site}_tags_id via ALTER TABLE ADD COLUMN + UPDATE + DROP COLUMN"
    - "payload_locked_documents_rels must also be updated when collections are renamed — Payload uses this table for document locking tracking"
    - "vitest fileParallelism: false required when tests call migration down() — shared DB state is not safe for concurrent file execution"

key-files:
  created:
    - src/migrations/20260315_split_media_and_tags.ts
  modified:
    - src/migrations/index.ts
    - tests/int/media-tags-split.int.spec.ts
    - vitest.config.mts

key-decisions:
  - "payload_locked_documents_rels must be updated alongside _posts_rels tables — Payload's Drizzle schema generates queries referencing site-specific IDs (jr_media_id, jr_tags_id) in this table too"
  - "Media attribution strategy: jr-referenced first, then nitf-referenced, then rotr-referenced, then orphans to jr_media — deterministic, no cross-site contamination"
  - "nitf_trails.gpx_file_id included in nitf_media attribution — trails reference media directly, not via _rels"
  - "Use direct SQL INSERT for jr_media test assertion — upload collections reject payload.create without a file, so information_schema query + raw INSERT is the correct test approach"
  - "fileParallelism: false in vitest config to prevent down() test disrupting other concurrent test files sharing the DB"

patterns-established:
  - "When renaming a Payload collection slug, ALL _rels tables (including payload_locked_documents_rels) must be updated"
  - "Migration down() tests require sequential test file execution; add fileParallelism: false"

requirements-completed:
  - SITESPEC-05
  - TEST-02
  - TEST-05

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 03 Plan 03: Media/Tags Split Migration Summary

**Data migration splitting shared `media` and `tags` tables into 6 site-specific tables (jr/nitf/rotr prefixed), with complete down() rollback and integration tests verifying all behaviors**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-15T19:11:03Z
- **Completed:** 2026-03-15T19:17:00Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Created `src/migrations/20260315_split_media_and_tags.ts` with complete `up()` and `down()` functions
- `up()` creates 6 new tables, copies all rows with site attribution, renames tag ID columns in 4 _rels tables, drops old shared tables
- `down()` reverses all steps: recreates media/tags, unions rows back, restores tags_id columns, drops 6 new tables
- Migration registered in `src/migrations/index.ts` and successfully applied to DB via `npm run payload:migrate`
- Replaced all 17 `.todo()` stubs in `tests/int/media-tags-split.int.spec.ts` with real assertions
- All 16 new integration tests pass; existing migration and geom-hooks tests (11 total) remain green

## Task Commits

1. **Task 1: Write migration up() and down()** - `b05e6b4` (feat)
2. **Task 2: Integration tests + migration fix** - `ae6ea11` (feat)

## Files Created/Modified

- `src/migrations/20260315_split_media_and_tags.ts` — Full data migration for media/tags split
- `src/migrations/index.ts` — New migration entry added at end of migrations array
- `tests/int/media-tags-split.int.spec.ts` — All .todo() stubs replaced with real assertions
- `vitest.config.mts` — Added `fileParallelism: false` to prevent concurrent DB state corruption

## Decisions Made

- `payload_locked_documents_rels` requires the same media_id → jr/nitf/rotr_media_id and tags_id → jr/nitf/rotr_tags_id column renames as the post _rels tables — Payload's Drizzle schema generates queries referencing site-specific column names in this table
- Media attribution prioritizes explicit FK references (jr_posts → jr_media, nitf_posts+nitf_trails → nitf_media, rotr_posts → rotr_media) with orphans falling back to jr_media
- Upload collections cannot be tested via `payload.create` without a real file; used direct `db.execute(sql\`INSERT INTO jr_media...\`)` for the create test
- `vitest fileParallelism: false` added because migration down() drops tables that concurrent test files need; sequential execution is required when migration lifecycle tests are included

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added payload_locked_documents_rels column updates to migration**
- **Found during:** Task 2 (initial test run after migration applied)
- **Issue:** Payload's Drizzle schema expected `jr_media_id`, `jr_tags_id`, `nitf_media_id`, `nitf_tags_id`, `rotr_media_id`, `rotr_tags_id` columns in `payload_locked_documents_rels` but the migration only updated the `_posts_rels` tables. Error: `column jr_media_id does not exist`
- **Fix:** Added ALTER TABLE statements in both `up()` and `down()` to rename media_id/tags_id → site-specific IDs in `payload_locked_documents_rels`
- **Files modified:** `src/migrations/20260315_split_media_and_tags.ts`
- **Commit:** `ae6ea11`

**2. [Rule 1 - Bug] Changed media create test from payload.create to direct SQL INSERT**
- **Found during:** Task 2 (test run)
- **Issue:** `payload.create({ collection: 'jr_media', data: { alt: '...' } })` throws `MissingFile: No files were uploaded` — upload collections require an actual file payload
- **Fix:** Replaced with `db.execute(sql\`INSERT INTO jr_media (alt, ...) VALUES (...) RETURNING id, alt\`)` to test DB record creation directly
- **Files modified:** `tests/int/media-tags-split.int.spec.ts`
- **Commit:** `ae6ea11`

**3. [Rule 3 - Blocking] Added fileParallelism: false to vitest config**
- **Found during:** Task 2 (parallel test run)
- **Issue:** When test files ran in parallel, the down() test in media-tags-split.int.spec.ts dropped `rotr_tags_id` column while geom-hooks.int.spec.ts was concurrently updating `rotr_posts` (which queries `rotr_posts_rels`). Error: `column rotr_posts__rels.rotr_tags_id does not exist`
- **Fix:** Added `fileParallelism: false` to vitest config so test files run sequentially
- **Files modified:** `vitest.config.mts`
- **Commit:** `ae6ea11`

## Issues Encountered

- Pre-existing `api.int.spec.ts` failure (`ValidationError: email already exists for admin@test.com`) not addressed — out of scope for this plan, not caused by these changes

## Next Phase Readiness

- All Phase 3 schema and migration work is complete
- The 6 site-specific collections have tables, data migration is applied, and relationships work end-to-end
- Phase 4 (ROTR split) can proceed with clean `rotr_media` and `rotr_tags` tables ready for ROTR content

---
*Phase: 03-site-specific-media-tags*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: src/migrations/20260315_split_media_and_tags.ts
- FOUND: tests/int/media-tags-split.int.spec.ts
- FOUND: commit b05e6b4 (Task 1)
- FOUND: commit ae6ea11 (Task 2)

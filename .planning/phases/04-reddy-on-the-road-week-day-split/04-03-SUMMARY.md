---
phase: 04-reddy-on-the-road-week-day-split
plan: "03"
subsystem: testing
tags: [vitest, integration-tests, payload, postgres, postgis, migrations]

# Dependency graph
requires:
  - phase: 04-02
    provides: 20260316_rotr_days_split migration with rotr_days/rotr_place_types tables and PostGIS trigger

provides:
  - tests/int/rotr-days.int.spec.ts — 11 passing integration tests for Phase 4 behaviors
  - src/payload-types.ts — regenerated with RotrDays and RotrPlaceTypes (RotrPosts/RotrLocations removed)

affects:
  - Phase 5 plans — rotr_days is now fully tested; use rotr_days as the ROTR content type

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration up() must use IF NOT EXISTS and conditional INSERTs for idempotency when tests call up() multiple times"
    - "Payload relationship fields require a _rels join table — must be created in migration, not just schema push"
    - "Polymorphic upload fields (Authors.avatar) require a collection_rels table with FK columns for each target collection"
    - "Use Date.now() suffix on test user emails to avoid unique constraint violations across test runs"

key-files:
  created:
    - tests/int/rotr-days.int.spec.ts
    - .planning/phases/04-reddy-on-the-road-week-day-split/04-03-SUMMARY.md
  modified:
    - src/payload-types.ts
    - src/migrations/20260316_rotr_days_split.ts
    - src/migrations/20260315_split_media_and_tags.ts
    - tests/int/api.int.spec.ts
    - tests/int/migration.int.spec.ts

key-decisions:
  - "rotr_days_rels join table was missing from migration — Payload requires _rels tables for collections with relationship fields; added to both up() and down() as Rule 2 deviation"
  - "authors_rels join table was missing from Phase 3 migration — Authors.avatar polymorphic relationship requires it; created in DB and added to migration as Rule 2 deviation"
  - "Phase 3 migration up() made idempotent with IF NOT EXISTS and conditional DO $$ blocks so down()+up() test cycle succeeds without 'relation already exists' errors"
  - "migration.int.spec.ts updated to check 4 NITF tables instead of 6 (rotr_posts/rotr_locations dropped in Phase 4; rotr_days has no GIST index yet)"
  - "api.int.spec.ts test email uses Date.now() suffix to prevent duplicate key errors on repeated test runs"

patterns-established:
  - "Always create _rels join table in migration for collections with relationship fields"
  - "Always use IF NOT EXISTS on CREATE TABLE in migrations called from test down()+up() cycles"

requirements-completed:
  - GEO-04
  - TEST-02
  - TEST-04
  - TEST-05

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 4 Plan 03: ROTR Days Integration Tests Summary

**11 integration tests for rotr_days (table structure, PostGIS trigger, relationships, migration lifecycle) with regenerated TypeScript types and full 49-test suite green**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T07:56:10Z
- **Completed:** 2026-03-16T08:08:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- All 11 `it.todo()` stubs in `rotr-days.int.spec.ts` replaced with real implementations covering ROTR-04, ROTR-01/02, GEO-04, TEST-02, and TEST-05 behaviors
- `src/payload-types.ts` regenerated with `RotrDays` and `RotrPlaceTypes`; `RotrPosts` and `RotrLocations` removed
- Full 49-test suite passes: all 5 spec files green

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement integration tests in rotr-days.int.spec.ts** - `56168af` (feat)
2. **Task 2: Regenerate TypeScript types and verify full suite** - `5c6cbb2` (feat)

## Files Created/Modified

- `tests/int/rotr-days.int.spec.ts` - 11 passing integration tests for rotr_days
- `src/payload-types.ts` - Regenerated types (RotrDays, RotrPlaceTypes added; RotrPosts, RotrLocations removed)
- `src/migrations/20260316_rotr_days_split.ts` - Added rotr_days_rels join table to up()/down()
- `src/migrations/20260315_split_media_and_tags.ts` - Made up() idempotent; added authors_rels; fixed conditional down() UPDATEs
- `tests/int/api.int.spec.ts` - Updated rotr_posts → rotr_days, rotr_locations → rotr_place_types; unique test email
- `tests/int/migration.int.spec.ts` - Updated geom/index checks to use rotr_days instead of rotr_posts/rotr_locations

## Decisions Made

- `rotr_days_rels` was missing from the Phase 4 migration; required for Payload's relationship tracking for `location_type` and `tags` fields
- Phase 3 migration `up()` needed `IF NOT EXISTS` guards to survive being called twice in a test cycle
- `authors_rels` table was never created (polymorphic avatar requires it); added to Phase 3 migration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] rotr_days_rels join table missing from migration**
- **Found during:** Task 1 (rotr-days integration tests)
- **Issue:** Payload's relationship operations (`location_type`, `tags` fields) fail with "relation rotr_days_rels does not exist" because migration only created the raw table, not the Payload join table
- **Fix:** Added `CREATE TABLE IF NOT EXISTS rotr_days_rels` to migration `up()` and `DROP TABLE IF EXISTS rotr_days_rels` to `down()`; created table directly in DB for current session
- **Files modified:** `src/migrations/20260316_rotr_days_split.ts`
- **Verification:** All 11 rotr-days tests pass including relationship population tests
- **Committed in:** `56168af` (Task 1)

**2. [Rule 3 - Blocking] Phase 3 migration up() not idempotent — full suite blocked**
- **Found during:** Task 2 (full suite run)
- **Issue:** `20260315_split_media_and_tags.ts` `up()` used bare `CREATE TABLE` (no IF NOT EXISTS), causing "relation already exists" when called twice in test down()+up() cycle; `down()` UPDATE also failed when source column didn't exist
- **Fix:** Added `IF NOT EXISTS` to all 6 `CREATE TABLE` statements in `up()`; wrapped INSERT steps in conditional `DO $$ ... $$` blocks; made `down()` UPDATE steps conditional via `DO $$ ... $$`
- **Files modified:** `src/migrations/20260315_split_media_and_tags.ts`
- **Verification:** media-tags-split all 16 tests pass; full suite 49/49 green
- **Committed in:** `5c6cbb2` (Task 2)

**3. [Rule 2 - Missing Critical] authors_rels join table missing from DB and migration**
- **Found during:** Task 2 (full suite run — `fetches authors` failed with "relation authors_rels does not exist")
- **Issue:** `Authors` collection has polymorphic `avatar` upload field (`jr_media | nitf_media | rotr_media`) requiring `authors_rels` join table; table was never created in any migration
- **Fix:** Created `authors_rels` directly in DB; added `CREATE TABLE IF NOT EXISTS authors_rels` to Phase 3 migration `up()` and `DROP TABLE IF EXISTS authors_rels` to `down()`
- **Files modified:** `src/migrations/20260315_split_media_and_tags.ts`
- **Verification:** `fetches authors` test passes; all 49 tests green
- **Committed in:** `5c6cbb2` (Task 2)

**4. [Rule 1 - Bug] Tests referencing removed collections rotr_posts/rotr_locations**
- **Found during:** Task 2 (tsc and full suite run)
- **Issue:** `api.int.spec.ts` referenced `rotr_posts` and `rotr_locations` (dropped in Phase 4); `migration.int.spec.ts` checked geom columns on those tables
- **Fix:** Updated both files to use `rotr_days`/`rotr_place_types`; fixed duplicate user email issue; updated spatial index count from 6→4
- **Files modified:** `tests/int/api.int.spec.ts`, `tests/int/migration.int.spec.ts`
- **Verification:** TypeScript exits 0; all 49 tests green
- **Committed in:** `5c6cbb2` (Task 2)

---

**Total deviations:** 4 auto-fixed (2 missing critical, 1 blocking, 1 bug)
**Impact on plan:** All auto-fixes required for correctness. The missing _rels tables are a systematic gap in the migration strategy (only raw tables were created; Payload join tables were not). This pattern should be applied consistently in future phases.

## Issues Encountered

- DB state was in a hybrid state: Phase 4 migration had been applied manually (rotr_days/rotr_place_types existed) but `payload_migrations` table didn't record it, and `rotr_days_rels` was never created. Tests helped surface both gaps.

## Next Phase Readiness

- Phase 4 complete: all 4 plans executed, all requirements covered
- `rotr_days` collection fully tested end-to-end with PostGIS trigger, relationships, and migration lifecycle
- Full test suite green — clean baseline for Phase 5 (NITF Trips)
- No blockers

---
*Phase: 04-reddy-on-the-road-week-day-split*
*Completed: 2026-03-16*

## Self-Check: PASSED

- tests/int/rotr-days.int.spec.ts: FOUND
- src/payload-types.ts: FOUND
- .planning/phases/04-reddy-on-the-road-week-day-split/04-03-SUMMARY.md: FOUND
- Commit 56168af: FOUND
- Commit 5c6cbb2: FOUND

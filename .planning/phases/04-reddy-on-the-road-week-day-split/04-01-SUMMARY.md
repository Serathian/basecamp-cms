---
phase: 04-reddy-on-the-road-week-day-split
plan: "01"
subsystem: database

tags: [payload, collections, typescript, postgres, postgis]

# Dependency graph
requires:
  - phase: 04-00
    provides: Wave 0 test scaffold (10 it.todo() stubs in rotr-days.int.spec.ts)

provides:
  - RotrDays collection (rotr_days) with 13 fields and no geom hook
  - RotrPlaceTypes collection (rotr_place_types) with name+slug lookup pattern
  - Deleted RotrPosts and RotrLocations collections
  - Updated payload.config.ts and payload.config.export-types.ts registrations
  - geom-hooks spec cleaned of rotr_posts/rotr_locations tests

affects:
  - 04-02-migration (depends on rotr_days schema contract)
  - 04-03-tests (depends on RotrDays collection fields)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "published access helper on new rotr collections (not () => true)"
    - "No geom hook pattern — BEFORE trigger in migration handles geom auto-population"
    - "defaultSort on top-level CollectionConfig, not inside admin object"

key-files:
  created:
    - src/collections/reddyontheroad/RotrDays.ts
    - src/collections/reddyontheroad/RotrPlaceTypes.ts
  modified:
    - src/payload.config.ts
    - src/payload.config.export-types.ts
    - tests/int/geom-hooks.int.spec.ts

key-decisions:
  - "rotr_place_types relationTo cast as any pending type regen — rotr_place_types not yet in CollectionSlug union until types regenerated in 04-02/04-03"
  - "defaultSort is a top-level CollectionConfig field, not inside admin object (Payload v3 API)"
  - "payload.config.export-types.ts must mirror payload.config.ts — updated as auto-fix alongside Task 2"

patterns-established:
  - "All new ROTR collections use published access helper for read (not () => true)"
  - "New collections with no geom hook — geom managed entirely by PostgreSQL BEFORE trigger"

requirements-completed: [ROTR-01, ROTR-02, ROTR-03, ROTR-04, ROTR-05]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 01: RotrDays Collection Schema Summary

**RotrDays (13-field daily travel diary) and RotrPlaceTypes lookup collection defined; RotrPosts and RotrLocations deleted; payload.config.ts and geom-hooks spec updated**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-16T07:46:34Z
- **Completed:** 2026-03-16T07:49:24Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 2 deleted, 3 updated)

## Accomplishments

- Created RotrDays.ts with 13 fields (status, title, date, lat, lon, location_name, location_type, weather, temperature, summary, content, tags) — no geom hook
- Created RotrPlaceTypes.ts using the same name+slug pattern as RotrTags.ts with published read access
- Deleted RotrPosts.ts and RotrLocations.ts, swapped registrations in both config files
- Removed 3 test cases from geom-hooks.int.spec.ts that referenced the dropped collections

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RotrPlaceTypes.ts and RotrDays.ts collection files** - `23b08b4` (feat)
2. **Task 2: Update payload.config.ts and remove old collection files; update geom-hooks spec** - `7a84440` (feat)

## Files Created/Modified

- `src/collections/reddyontheroad/RotrDays.ts` - New primary collection, 13 fields, no geom hook
- `src/collections/reddyontheroad/RotrPlaceTypes.ts` - New lookup collection, name+slug pattern
- `src/collections/reddyontheroad/RotrPosts.ts` - Deleted (replaced by RotrDays)
- `src/collections/reddyontheroad/RotrLocations.ts` - Deleted (replaced by RotrPlaceTypes)
- `src/payload.config.ts` - Swapped RotrPosts/RotrLocations for RotrDays/RotrPlaceTypes
- `src/payload.config.export-types.ts` - Same swap (mirror config)
- `tests/int/geom-hooks.int.spec.ts` - Removed 3 tests referencing dropped collections

## Decisions Made

- `defaultSort` is a top-level `CollectionConfig` field in Payload v3, not nested inside `admin` — moved accordingly
- `rotr_place_types` cast as `any` in `relationTo` because it's not yet in the `CollectionSlug` union until types are regenerated (04-02/04-03 plans)
- `payload.config.export-types.ts` must be kept in sync with `payload.config.ts` — updated as part of Task 2

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] defaultSort placed at top-level, not inside admin**
- **Found during:** Task 1 (TypeScript check after creating RotrDays.ts)
- **Issue:** Plan specified `admin.defaultSort: '-date'` but `defaultSort` is a top-level `CollectionConfig` property, not inside `CollectionAdminOptions`
- **Fix:** Moved `defaultSort: '-date'` to top-level of the collection config
- **Files modified:** src/collections/reddyontheroad/RotrDays.ts
- **Verification:** TypeScript compile error resolved
- **Committed in:** 23b08b4 (Task 1 commit)

**2. [Rule 1 - Bug] rotr_place_types not in CollectionSlug — cast as any**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `rotr_place_types` not yet in generated `CollectionSlug` union; `relationTo: 'rotr_place_types'` fails type check
- **Fix:** Added `as any` cast with comment noting it resolves after type regen in 04-02/04-03
- **Files modified:** src/collections/reddyontheroad/RotrDays.ts
- **Verification:** TypeScript error resolved; cast is temporary, types regenerated in next plan
- **Committed in:** 23b08b4 (Task 1 commit)

**3. [Rule 3 - Blocking] payload.config.export-types.ts also imports deleted collections**
- **Found during:** Task 2 (TypeScript check after deleting RotrPosts/RotrLocations)
- **Issue:** Mirror config file `payload.config.export-types.ts` still referenced the deleted files
- **Fix:** Applied the same import/registration swap as payload.config.ts
- **Files modified:** src/payload.config.export-types.ts
- **Verification:** TypeScript clean (only pre-existing Wave 0 scaffold error)
- **Committed in:** 7a84440 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All auto-fixes necessary for TypeScript correctness. No scope creep.

## Issues Encountered

- Pre-existing error in `tests/int/rotr-days.int.spec.ts`: import of `@/migrations/20260316_rotr_days_split` (non-existent migration file). Documented in STATE.md as expected Wave 0 behavior — migration file created in 04-02.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema contracts for `rotr_days` and `rotr_place_types` are fully defined
- `payload.config.ts` is ready for 04-02 migration (collection slugs known)
- `rotr_place_types` cast will be resolved once types are regenerated after 04-02/04-03

---
*Phase: 04-reddy-on-the-road-week-day-split*
*Completed: 2026-03-16*

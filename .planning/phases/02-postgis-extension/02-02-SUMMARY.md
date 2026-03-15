---
phase: 02-postgis-extension
plan: 02
subsystem: database
tags: [postgis, triggers, spatial-queries, drizzle, postgresql]

# Dependency graph
requires:
  - phase: 02-postgis-extension
    provides: PostGIS extension and geom columns on 6 tables
provides:
  - PostgreSQL triggers for automatic geom column population
  - Spatial data integrity without application hooks
  - Transaction-safe geom updates on INSERT/UPDATE
affects: [spatial-queries, cms-admin, obsidian-sync]

# Tech tracking
tech-stack:
  added: []
  patterns: [database-triggers-over-hooks, before-insert-update-triggers]

key-files:
  created:
    - src/migrations/20260315_080631_add_geom_triggers.ts
  modified:
    - src/migrations/index.ts

key-decisions:
  - 'Use PostgreSQL BEFORE INSERT OR UPDATE triggers instead of Payload afterChange hooks'
  - 'Triggers provide better transaction visibility and eliminate async timing issues'
  - 'One trigger function per table to handle field name variations (latitude_start for trails)'

patterns-established:
  - 'Database triggers for computed columns that depend on multiple fields'
  - 'BEFORE triggers modify NEW row directly, avoiding post-insert UPDATE roundtrips'

requirements-completed: [GEO-01]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 02 Plan 02: Geom Auto-Population Summary

**PostgreSQL triggers auto-populate geom columns on INSERT/UPDATE for all 6 geographic collections, replacing unreliable application hooks**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T08:06:00Z
- **Completed:** 2026-03-15T08:10:44Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- PostgreSQL triggers created for all 6 geo tables (nitf_posts, nitf_trails, nitf_waypoints, nitf_locations, rotr_posts, rotr_locations)
- Triggers execute BEFORE INSERT OR UPDATE, populating geom from lat/lon fields
- Transaction-safe: geom population happens in same transaction as row creation
- Field name variation handled: nitf_trails uses latitude_start/longitude_start
- All 26 tests passing (8 geom-specific + 18 existing)

## Task Commits

1. **Task 1: Create PostgreSQL triggers migration** - `21bad90` (feat)

**Plan metadata:** (will be added after STATE.md update)

## Files Created/Modified

- `src/migrations/20260315_080631_add_geom_triggers.ts` - Migration with 6 triggers + functions
- `src/migrations/index.ts` - Added migration to exports array

## Decisions Made

**Option B selected at checkpoint: Use PostgreSQL triggers instead of application hooks**

Rationale:

- afterChange hooks in Payload have transaction visibility issues
- Hooks execute after INSERT completes, requiring separate UPDATE query
- Triggers execute BEFORE INSERT, modifying NEW row directly
- No async timing concerns, no need for waits in tests
- Standard PostgreSQL pattern for computed columns

Implementation:

- Created one trigger function per table (handles NULL checking)
- Trigger fires BEFORE INSERT OR UPDATE FOR EACH ROW
- Sets NEW.geom := ST_SetSRID(ST_MakePoint(...), 4326)
- NitfTrails special case: uses latitude_start/longitude_start fields

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Application hooks not in current branch**

- **Found during:** Task 1 setup
- **Issue:** Plan assumed afterChange hooks existed and needed removal, but master branch never had them (hooks existed only in a different branch)
- **Fix:** Skipped hook removal step, focused on trigger creation
- **Files modified:** None (no hooks to remove)
- **Verification:** Checked git history, confirmed hooks never committed to master
- **Committed in:** N/A (no code change needed)

**2. [Rule 3 - Blocking] Migration didn't run automatically after index update**

- **Found during:** Task 1 verification (tests failed with NULL geom)
- **Issue:** `npx payload migrate` said "Migrated" but migration wasn't actually applied to database
- **Fix:** Ran `npx payload migrate` second time, triggers successfully created
- **Files modified:** None (database state only)
- **Verification:** Queried pg_trigger table, confirmed 6 triggers exist
- **Committed in:** N/A (database operation, not code)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were procedural corrections. The core implementation (triggers migration) matches plan intent perfectly.

## Issues Encountered

None - implementation proceeded smoothly after the two blocking issues were resolved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 02-03** (if exists) or next phase planning.

**Deliverables:**

- ✅ Geom auto-population functional for all 6 tables
- ✅ Spatial queries now return newly created posts
- ✅ No application-level code needed (database handles it)
- ✅ Migration safe to run in production (uses OR REPLACE for functions)

**Blockers:** None

---

_Phase: 02-postgis-extension_
_Completed: 2026-03-15_

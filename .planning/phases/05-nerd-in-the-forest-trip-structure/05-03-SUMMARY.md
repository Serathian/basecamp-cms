---
phase: 05-nerd-in-the-forest-trip-structure
plan: "03"
subsystem: database
tags: [postgres, migration, postgis, payload, drizzle]

# Dependency graph
requires:
  - phase: 05-01
    provides: 5 new NITF collection schemas (NitfTrips, NitfDestinations, NitfPoi, NitfPoiTypes, NitfPlaces)
  - phase: 05-02
    provides: NitfPosts trimmed schema + both payload configs updated to register new collections
provides:
  - Full Phase 5 database migration: up() creates 9 tables, 2 PostGIS triggers; down() fully reverses
  - Migration registered in migrations/index.ts as last entry
affects:
  - 05-04 (integration tests will execute up()/down() cycle against this migration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "14-step migration pattern: drop old tables/functions → trim existing columns → create lookup table → create main tables → add PostGIS geom columns → create BEFORE triggers → create _rels join tables → update payload_locked_documents_rels"
    - "sql.raw() for $$ PL/pgSQL trigger function bodies; sql`` template literals for standard DDL"
    - "Clean-slate migration: down() drops new tables but does NOT recreate dropped tables (no data to preserve)"
    - "_rels tables required for every collection with relationship fields; nitf_poi_types is the exception (name+slug only)"

key-files:
  created:
    - src/migrations/20260316_nitf_trip_structure.ts
  modified:
    - src/migrations/index.ts

key-decisions:
  - "down() does not recreate nitf_locations or nitf_waypoints — clean-slate migration, no data to preserve; restoring payload_locked_documents_rels columns is sufficient for test down()/up() cycle"
  - "nitf_posts_rels.nitf_poi_id added in up() to support locations field now pointing to nitf_poi; nitf_locations_id and nitf_trails_id dropped"
  - "All 4 new collections with relationship fields get _rels tables; nitf_poi_types gets none (only name+slug)"

patterns-established:
  - "Phase 5 migration pattern matches Phase 4 (rotr_days_split): drop old → create new → PostGIS geom → BEFORE trigger → _rels tables → payload_locked_documents_rels"

requirements-completed: [NITF-03, NITF-04, NITF-05, NITF-06, GEO-02, GEO-03]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 5 Plan 03: NITF Trip Structure Migration Summary

**PostgreSQL migration creating 9 tables (nitf_trips, nitf_destinations, nitf_poi, nitf_poi_types, nitf_places + 4 _rels tables) with PostGIS BEFORE triggers for nitf_destinations and nitf_poi; drops nitf_locations and nitf_waypoints clean-slate**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T16:57:14Z
- **Completed:** 2026-03-16T16:59:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Complete up()/down() migration covering all Phase 5 schema changes in a single atomic file
- PostGIS BEFORE INSERT OR UPDATE triggers for nitf_destinations and nitf_poi auto-populate geom from lat/lon
- All 4 _rels join tables created for collections with relationship fields; nitf_poi_types correctly omitted
- Migration registered as last entry in migrations/index.ts; TypeScript compiles cleanly with --skipLibCheck

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 20260316_nitf_trip_structure.ts migration** - `ac57a9b` (feat)
2. **Task 2: Register migration in migrations/index.ts** - `beee692` (chore)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/migrations/20260316_nitf_trip_structure.ts` - Full up()/down() migration for Phase 5 schema changes; 266 lines
- `src/migrations/index.ts` - Added import and array entry for 20260316_nitf_trip_structure as last migration

## Decisions Made
- down() restores nitf_posts and nitf_posts_rels columns (ADD COLUMN IF NOT EXISTS) but does NOT recreate nitf_locations or nitf_waypoints — clean-slate pattern established in Phase 1, reused through Phase 4
- nitf_posts_rels.nitf_poi_id added (locations field now points to nitf_poi), nitf_locations_id and nitf_trails_id dropped
- nitf_poi_types has no _rels table — only name+slug fields, no relationship fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Migration file ready for integration test execution in Phase 5 Plan 05-04
- up()/down() cycle will be exercised by nitf-trip-structure.int.spec.ts (Wave 0 stubs from 05-00 await implementation)
- No blockers

---
*Phase: 05-nerd-in-the-forest-trip-structure*
*Completed: 2026-03-16*

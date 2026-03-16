---
phase: 05-nerd-in-the-forest-trip-structure
plan: "00"
subsystem: testing
tags: [vitest, integration-tests, wave-0, nitf, postgis, geom]

requires:
  - phase: 04-reddy-on-the-road-week-day-split
    provides: "Pattern for Wave 0 it.todo() scaffolding before implementation runs"

provides:
  - "Wave 0 test scaffold with 23 it.todo() stubs for all Phase 5 NITF requirements"
  - "geom-hooks.int.spec.ts updated — nitf_waypoints/nitf_locations active tests removed, Phase 5 stubs added"
  - "migration.int.spec.ts updated — geom table list updated to replace dropped tables with nitf_destinations/nitf_poi"

affects:
  - 05-nerd-in-the-forest-trip-structure
  - future phases reading test inventory

tech-stack:
  added: []
  patterns:
    - "Wave 0 scaffold: create it.todo() stubs before implementation plans so test inventory is established first (Nyquist Rule)"

key-files:
  created:
    - tests/int/nitf-trip-structure.int.spec.ts
  modified:
    - tests/int/geom-hooks.int.spec.ts
    - tests/int/migration.int.spec.ts

key-decisions:
  - "Wave 0 import of non-existent 20260316_nitf_trip_structure migration causes file-level skip in Vitest — expected and acceptable at Wave 0, consistent with Phase 4 precedent"
  - "nitf_waypoints/nitf_locations removed as active tests in geom-hooks (tables being dropped in Phase 5 migration); replaced with it.todo stubs"
  - "Spatial indexes test in migration.int.spec.ts left unchanged — it documents Phase 2 GIST indexes on old tables which still physically exist in DB"

patterns-established:
  - "Wave 0 scaffold pattern: test stubs created before migration exists; file-level skip is acceptable; stubs appear pending in Vitest summary"
  - "When dropping a collection in a phase, remove its active tests and add it.todo stubs in the same Wave 0 plan"

requirements-completed:
  - NITF-01
  - NITF-02
  - NITF-03
  - NITF-04
  - NITF-05
  - NITF-06
  - GEO-02
  - GEO-03
  - TEST-02
  - TEST-04

duration: 1min
completed: 2026-03-16
---

# Phase 5 Plan 00: NITF Trip Structure Wave 0 Scaffold Summary

**Wave 0 test scaffold with 23 it.todo() stubs for Phase 5 NITF trip structure — nitf_destinations, nitf_poi, nitf_trips, and geom/relationship coverage**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-16T16:42:17Z
- **Completed:** 2026-03-16T16:43:40Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created tests/int/nitf-trip-structure.int.spec.ts with 23 it.todo() stubs covering NITF-01 through NITF-07, GEO-02, GEO-03, TEST-02, TEST-05
- Updated geom-hooks.int.spec.ts to remove active tests for nitf_waypoints and nitf_locations (dropped in Phase 5) and add it.todo replacements for nitf_destinations and nitf_poi
- Updated migration.int.spec.ts tables array to reference nitf_destinations and nitf_poi instead of the dropped tables

## Task Commits

1. **Task 1: Create nitf-trip-structure.int.spec.ts with it.todo() stubs** - `744428f` (test)
2. **Task 2: Update geom-hooks.int.spec.ts and migration.int.spec.ts** - `dbfbdb3` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `tests/int/nitf-trip-structure.int.spec.ts` - New Wave 0 scaffold with 23 it.todo() stubs organized into 9 describe blocks
- `tests/int/geom-hooks.int.spec.ts` - Removed nitf_waypoints and nitf_locations active test blocks; added it.todo stubs for Phase 5 tables
- `tests/int/migration.int.spec.ts` - Updated tables array from nitf_waypoints/nitf_locations to nitf_destinations/nitf_poi

## Decisions Made

- Wave 0 import of non-existent `20260316_nitf_trip_structure` migration causes file-level skip in Vitest — expected and acceptable (same pattern established in Phase 4 Plan 04-00)
- Spatial indexes test in migration.int.spec.ts was left unchanged since it accurately describes Phase 2 GIST indexes that still exist in the DB on old tables

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 5 test stubs exist — Nyquist Rule satisfied
- geom-hooks and migration specs no longer reference dropped tables as active tests
- Ready for Phase 5 implementation plans (05-01 through 05-05)
- nitf-trip-structure.int.spec.ts will produce file-level skip until 05-02 creates the migration file

---
*Phase: 05-nerd-in-the-forest-trip-structure*
*Completed: 2026-03-16*

## Self-Check: PASSED

- tests/int/nitf-trip-structure.int.spec.ts: FOUND
- tests/int/geom-hooks.int.spec.ts: FOUND
- tests/int/migration.int.spec.ts: FOUND
- .planning/phases/05-nerd-in-the-forest-trip-structure/05-00-SUMMARY.md: FOUND
- Commit 744428f: FOUND
- Commit dbfbdb3: FOUND

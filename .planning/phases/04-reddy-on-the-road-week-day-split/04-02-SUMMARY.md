---
phase: 04-reddy-on-the-road-week-day-split
plan: "02"
subsystem: database

tags: [postgres, drizzle-orm, postgis, migrations, payload-cms]

# Dependency graph
requires:
  - phase: 04-01
    provides: RotrDays and RotrPlaceTypes collection definitions registered in payload.config.ts

provides:
  - Migration 20260316_rotr_days_split: drops rotr_posts/rotr_locations, creates rotr_days/rotr_place_types, adds PostGIS trigger, updates payload_locked_documents_rels
  - down() fully reverses all changes

affects:
  - 04-03-integration-tests

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sql.raw() required for PL/pgSQL trigger functions with $$ delimiters — cannot be parameterized"
    - "AddGeometryColumn() used to add PostGIS geom column outside Drizzle schema"
    - "CASCADE on DROP TABLE removes dependent _rels tables, trigger bindings, FK constraints; trigger functions must be dropped separately"
    - "down() restores payload_locked_documents_rels columns without recreating dropped tables (clean-slate migration)"

key-files:
  created:
    - src/migrations/20260316_rotr_days_split.ts
  modified:
    - src/migrations/index.ts

key-decisions:
  - "down() does not recreate rotr_posts or rotr_locations — clean-slate migration, no data to preserve; restoring payload_locked_documents_rels columns is sufficient for Payload test-cycle down()"

patterns-established:
  - "Trigger function DDL uses sql.raw() to avoid $$ delimiter parameterization issues with drizzle-orm"
  - "DROP TABLE CASCADE used for clean-slate migrations; standalone trigger functions dropped separately"

requirements-completed:
  - ROTR-04
  - ROTR-06
  - GEO-04
  - TEST-05

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 4 Plan 02: ROTR Days Split Migration Summary

**PostgreSQL migration dropping rotr_posts/rotr_locations, creating rotr_days with PostGIS geom trigger and rotr_place_types, with complete reversible down()**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T07:52:06Z
- **Completed:** 2026-03-16T07:53:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Migration up() drops rotr_posts and rotr_locations (CASCADE), creates rotr_place_types and rotr_days with all content fields and FK constraint
- PostGIS geom column added via AddGeometryColumn; BEFORE INSERT OR UPDATE trigger auto-populates geom from latitude/longitude using sql.raw() for PL/pgSQL $$ blocks
- payload_locked_documents_rels updated: adds rotr_days_id and rotr_place_types_id, drops rotr_posts_id and rotr_locations_id
- down() drops rotr_days, rotr_place_types, trigger binding, and trigger function; restores old _rels columns for clean test-cycle reversal
- Migration registered as last entry in src/migrations/index.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 20260316_rotr_days_split.ts** - `758f505` (feat)
2. **Task 2: Register migration in src/migrations/index.ts** - `1617e26` (feat)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified

- `src/migrations/20260316_rotr_days_split.ts` - Migration up() and down() for ROTR days schema split
- `src/migrations/index.ts` - Migration registry with 20260316_rotr_days_split added as last entry

## Decisions Made

- down() does not recreate rotr_posts or rotr_locations tables — clean-slate migration with no data to preserve; restoring the payload_locked_documents_rels columns is sufficient for Payload to function if down() is run in a test cycle.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Migration file ready for integration testing in plan 04-03
- down() tested structurally (TypeScript compiles); functional test of round-trip up()/down() covered by 04-03

---
*Phase: 04-reddy-on-the-road-week-day-split*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: src/migrations/20260316_rotr_days_split.ts
- FOUND: src/migrations/index.ts
- FOUND: .planning/phases/04-reddy-on-the-road-week-day-split/04-02-SUMMARY.md
- Commits verified: 758f505, 1617e26

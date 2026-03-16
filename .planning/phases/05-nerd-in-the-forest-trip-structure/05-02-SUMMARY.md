---
phase: 05-nerd-in-the-forest-trip-structure
plan: "02"
subsystem: database
tags: [payload, typescript, collections, schema]

# Dependency graph
requires:
  - phase: 05-01
    provides: "5 new NITF collection schemas (NitfTrips, NitfDestinations, NitfPoi, NitfPoiTypes, NitfPlaces)"
provides:
  - "NitfPosts trimmed to clean schema (3 type options, 7 legacy fields removed)"
  - "payload.config.ts registers 5 new NITF collections, deregisters NitfLocations and NitfWaypoints"
  - "payload.config.export-types.ts mirrors payload.config.ts exactly"
affects:
  - 05-03-migration
  - 05-04-types

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Config mirror: payload.config.export-types.ts always mirrors payload.config.ts — same imports, same collections array"
    - "Schema trim: drop legacy fields and type options before migration runs to avoid dead columns"

key-files:
  created: []
  modified:
    - src/collections/nerdintheforest/NitfPosts.ts
    - src/payload.config.ts
    - src/payload.config.export-types.ts

key-decisions:
  - "NitfPosts type field trimmed from 5 options (adventure/tips/recipe/review/general) to 3 (review/recipe/article) — article replaces the 3 dropped general-purpose types"
  - "7 legacy fields dropped from NitfPosts: reading_time_minutes, trail, locations, review_meta, recipe_meta, seo_title, seo_description"
  - "NitfLocations and NitfWaypoints deregistered from both config files; 5 new collections registered in their place"

patterns-established:
  - "Mirror config: any change to nerdintheforest imports/collections in payload.config.ts must be identically applied to payload.config.export-types.ts"

requirements-completed: [NITF-01, NITF-02, NITF-07]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 5 Plan 02: NitfPosts Schema Trim + Config Registration Summary

**NitfPosts trimmed to review/recipe/article with 7 legacy fields dropped; 5 new NITF collections registered and NitfLocations/NitfWaypoints deregistered in both payload config files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T16:51:49Z
- **Completed:** 2026-03-16T16:54:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- NitfPosts.ts type field reduced from 5 options to 3 (review, recipe, article); adventure/tips/general removed, article added
- 7 legacy fields removed from NitfPosts: reading_time_minutes, trail, locations, review_meta, recipe_meta, seo_title, seo_description; latitude/longitude and afterChange geom hook preserved
- Both payload config files updated to import and register NitfTrips, NitfDestinations, NitfPoi, NitfPoiTypes, NitfPlaces; NitfWaypoints and NitfLocations removed from both

## Task Commits

Each task was committed atomically:

1. **Task 1: Trim NitfPosts type options and drop legacy fields** - `1d49df8` (feat)
2. **Task 2: Register new collections and deregister dropped collections** - `577fbb9` (feat)

**Plan metadata:** *(docs commit follows)*

## Files Created/Modified
- `src/collections/nerdintheforest/NitfPosts.ts` - Type options trimmed to 3; 7 legacy fields removed; latitude/longitude and hooks intact
- `src/payload.config.ts` - NitfTrips, NitfDestinations, NitfPoi, NitfPoiTypes, NitfPlaces added; NitfWaypoints, NitfLocations removed
- `src/payload.config.export-types.ts` - Identical changes to payload.config.ts (mirror maintained)

## Decisions Made
- NitfPosts type options: article replaces adventure/tips/general as single catch-all type alongside review and recipe — cleaner taxonomy matching Phase 5 trip-structure focus
- Both config files updated in one atomic commit — mirroring tightly coupled changes together avoids broken intermediate state (same pattern as Phase 4 Plan 04-01)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compile (`npx tsc --noEmit --skipLibCheck`) produces only the expected Wave 0 error for the not-yet-created migration file (`20260316_nitf_trip_structure`) — documented as acceptable in STATE.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 5 new NITF collections are now registered in Payload — admin UI and type generation will include them
- 05-03 migration can now create nitf_trips, nitf_destinations, nitf_poi, nitf_poi_types, nitf_places tables and drop nitf_locations and nitf_waypoints
- TypeScript types will need regeneration in 05-04 after migration runs

---
*Phase: 05-nerd-in-the-forest-trip-structure*
*Completed: 2026-03-16*

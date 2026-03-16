---
phase: 05-nerd-in-the-forest-trip-structure
plan: "01"
subsystem: database

tags: [payload, typescript, collections, nitf, postgis, relationships]

requires:
  - phase: 05-00
    provides: Wave 0 test scaffold with 23 it.todo() stubs for nitf-trip-structure

provides:
  - NitfPoiTypes collection config (lookup: name + slug, read open to all)
  - NitfDestinations collection config (lat/lon for PostGIS, links array, difficulty, published_at)
  - NitfPoi collection config (GPS pin, lat/lon required, type lookup, bidirectional trips relationship, 1:1 place link)
  - NitfTrips collection config (flagship trip narrative, ordered pois array, date_range group, destination FK)
  - NitfPlaces collection config (rich content layer for POI, poi back-reference)

affects:
  - 05-02 (migration reads these schemas)
  - 05-03 (integration tests verify these collection schemas)
  - 05-04 (type regeneration builds from these slugs)

tech-stack:
  added: []
  patterns:
    - NitfPoiTypes follows rotr_place_types lookup pattern (name + slug, read: () => true)
    - defaultSort at CollectionConfig top-level (not inside admin) — established in Phase 4
    - New collection slugs cast as any until types regenerated (established in Phase 4)
    - Bidirectional relationship: NitfTrips.pois (ordered, authoritative) + NitfPoi.trips (reverse lookup)
    - 1:1 optional relationship: NitfPoi.place → NitfPlaces

key-files:
  created:
    - src/collections/nerdintheforest/NitfPoiTypes.ts
    - src/collections/nerdintheforest/NitfDestinations.ts
    - src/collections/nerdintheforest/NitfPoi.ts
    - src/collections/nerdintheforest/NitfTrips.ts
    - src/collections/nerdintheforest/NitfPlaces.ts
  modified: []

key-decisions:
  - "NitfPoiTypes read access uses () => true (not published helper) since lookup data is always public — no published helper import needed"
  - "NitfDestinations published_at field added (Claude's discretion per 05-CONTEXT.md) — consistent with NitfTrips and NitfPlaces"
  - "NitfTrips has no defaultSort — trips are sorted by title alphabetically by Payload default, which is acceptable for the trip list"

patterns-established:
  - "Lookup collection pattern (name + slug only, read open): NitfPoiTypes mirrors RotrPlaceTypes exactly"
  - "Bidirectional relationship pattern: authoritative ordered array on the parent (trips.pois), reverse lookup on child (poi.trips)"
  - "1:1 optional link: NitfPoi.place → NitfPlaces (GPS pin optionally enriched with blog-style content)"

requirements-completed: [NITF-03, NITF-04, NITF-05, NITF-06, GEO-02, GEO-03]

duration: 2min
completed: 2026-03-16
---

# Phase 5 Plan 01: NITF Collection Schemas Summary

**Five Payload collection configs for nitf_poi_types, nitf_destinations, nitf_poi, nitf_trips, and nitf_places with bidirectional trip-POI relationship and lat/lon fields for PostGIS geom**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T16:46:59Z
- **Completed:** 2026-03-16T16:49:18Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- NitfPoiTypes and NitfDestinations created, following exact field specs from 05-CONTEXT.md
- NitfPoi, NitfTrips, NitfPlaces created with bidirectional relationship and 1:1 optional POI-to-Place link
- All five files compile without TypeScript errors (only pre-existing Wave 0 migration import error remains)
- No `anyone()` or `user()` access helpers used — all collections use `published`/`admin` as required

## Task Commits

Each task was committed atomically:

1. **Task 1: Create NitfPoiTypes and NitfDestinations collection files** - `ba6cedf` (feat)
2. **Task 2: Create NitfPoi, NitfTrips, and NitfPlaces collection files** - `a39c9b9` (feat)

## Files Created/Modified

- `src/collections/nerdintheforest/NitfPoiTypes.ts` - Lookup collection (name + slug), read open to all, slug nitf_poi_types
- `src/collections/nerdintheforest/NitfDestinations.ts` - Destination with lat/lon, links array, difficulty select, published_at
- `src/collections/nerdintheforest/NitfPoi.ts` - GPS pin with required lat/lon, type lookup, bidirectional trips relation, optional 1:1 place
- `src/collections/nerdintheforest/NitfTrips.ts` - Flagship trip with ordered pois array (authoritative), date_range group, destination FK
- `src/collections/nerdintheforest/NitfPlaces.ts` - Rich content layer for POI, poi back-reference, no photo gallery (deferred)

## Decisions Made

- NitfPoiTypes uses `read: () => true` inline (not the published helper) — POI type lookup data is always public, no auth needed, and importing published is unnecessary overhead
- Published_at added to NitfTrips and NitfPlaces per Claude's discretion (05-CONTEXT.md grants this) — consistent pattern across all content collections
- NitfTrips has no defaultSort (Payload default alphabetical by title is acceptable; no explicit sort needed for trips)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The pre-existing `Cannot find module '@/migrations/20260316_nitf_trip_structure'` TS error in the Wave 0 spec is expected and documented in STATE.md (same pattern as Phase 4 Plan 04-00).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All five collection schemas are ready for the migration (05-02) to create the corresponding PostgreSQL tables
- Bidirectional relationship declared on both sides — migration can wire the join tables correctly
- Lat/lon fields present on NitfDestinations and NitfPoi — migration adds geom columns and PostGIS triggers
- New slugs cast as `any` until 05-04 regenerates types — this is expected and will be resolved then

---
*Phase: 05-nerd-in-the-forest-trip-structure*
*Completed: 2026-03-16*

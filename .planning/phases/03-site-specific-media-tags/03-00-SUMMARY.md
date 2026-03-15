---
phase: 03-site-specific-media-tags
plan: "00"
subsystem: testing
tags: [vitest, integration-tests, payload, postgres, nyquist]

# Dependency graph
requires:
  - phase: 02-postgis-extension
    provides: Payload test infrastructure (getPayload, sql, beforeAll/afterAll pattern)
provides:
  - Wave 0 test scaffold: 17 it.todo() stubs covering all Phase 3 requirements before implementation begins
  - Nyquist compliance for Phase 3 (test file exists before any implementation plan runs)
affects:
  - 03-01 (media tables migration)
  - 03-02 (tags tables migration)
  - 03-03 (data preservation + rollback)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 Nyquist scaffold: create test file with it.todo() stubs before any implementation so tests never run blind"
    - "Reuse Payload getPayload/beforeAll/afterAll lifecycle from migration.int.spec.ts across all integration test files"

key-files:
  created:
    - tests/int/media-tags-split.int.spec.ts
  modified: []

key-decisions:
  - "Wave 0 test scaffold uses it.todo() so Vitest reports them as pending (not skipped), creating a visible inventory of planned tests"
  - "Imported sql from @payloadcms/db-postgres even in stub file to match infrastructure pattern (no unused import lint issues since future tests will use it)"

patterns-established:
  - "Phase scaffold pattern: describe blocks mirror requirement IDs (SITESPEC-01 through SITESPEC-05, TEST-02, TEST-05)"
  - "Each requirement gets its own describe block so failures are traceable to specific requirement"

requirements-completed:
  - SITESPEC-01
  - SITESPEC-02
  - SITESPEC-03
  - SITESPEC-04
  - SITESPEC-05
  - TEST-02
  - TEST-05

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 3 Plan 00: Site-Specific Media & Tags Summary

**Vitest integration test scaffold with 17 it.todo() stubs covering SITESPEC-01 through SITESPEC-05, TEST-02, and TEST-05 — Nyquist-compliant before any Phase 3 implementation runs**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T18:53:44Z
- **Completed:** 2026-03-15T18:58:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `tests/int/media-tags-split.int.spec.ts` with 17 it.todo() stubs across 6 describe blocks
- All stubs appear as "17 todo" in Vitest output — suite runs without crash, no errors
- Phase 3 is now Nyquist-compliant: test file exists before any migration or collection implementation begins
- Existing 25 integration tests (migration, geom-hooks, api) continue to pass unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Wave 0 test scaffold** - `c480d23` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `tests/int/media-tags-split.int.spec.ts` - Wave 0 integration test scaffold with 17 it.todo() stubs for Phase 3 requirements

## Decisions Made

- Used `it.todo()` rather than `it.skip()` because todo stubs show as pending in Vitest output, creating a visible inventory; skip would hide them from the summary
- Structured describe blocks to match requirement IDs exactly so test failures will map directly to requirements in VALIDATION.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 0 complete. Phase 3 is Nyquist-compliant.
- Plans 03-01 through 03-04 can now run with a pre-existing test file to fill in.
- Next plan: 03-01 (create jr_media, nitf_media, rotr_media tables via migration and implement collections)

---
*Phase: 03-site-specific-media-tags*
*Completed: 2026-03-15*

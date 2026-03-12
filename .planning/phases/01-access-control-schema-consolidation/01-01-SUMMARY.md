---
phase: 01-access-control-schema-consolidation
plan: 01
subsystem: auth
tags: [payload-cms, access-control, rbac, draft-workflow]

# Dependency graph
requires:
  - phase: none
    provides: none
provides:
  - published.ts access helper for authenticated draft visibility
  - admin.ts simplified access helper for single-role authentication
  - Fixed access control pattern across 5 collections
affects: [01-02, 01-03, 02, 03, 04, 05, 06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Access control: Check user presence first, return query constraint for anon'
    - 'Simplified admin helper: Boolean(user) sufficient with single role'

key-files:
  created:
    - src/collections/users/access/published.ts
  modified:
    - src/collections/users/access/admin.ts
    - src/collections/jake-reddy/JrPosts.ts
    - src/collections/jake-reddy/JrProjects.ts
    - src/collections/nerdintheforest/NitfPosts.ts
    - src/collections/nerdintheforest/NitfTrails.ts
    - src/collections/reddyontheroad/RotrPosts.ts

key-decisions:
  - 'published.ts checks user presence FIRST (fixes broken anyone() pattern)'
  - 'admin.ts simplified to Boolean(user) - no role checking needed with single role'
  - 'Applied pattern consistently to all 5 affected collections'

patterns-established:
  - 'Access helper pattern: ({ req: { user } }) => user ? true : { status: { equals: "published" } }'
  - 'Simplified admin check: Boolean(user) replaces checkRole complexity'

requirements-completed: [ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04]

# Metrics
duration: 8min
completed: 2026-03-12
---

# Phase 1 Plan 1: Access Control Bug Fix Summary

**Fixed broken draft visibility bug by creating correct access helpers that check user presence before applying query constraints**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-03-12T19:26:12Z
- **Completed:** 2026-03-12T19:34:17Z
- **Tasks:** 3 completed
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- Created `published.ts` access helper that properly checks authentication state
- Simplified `admin.ts` to remove unnecessary role checking complexity
- Updated all 5 affected collections to use correct access pattern
- Fixed critical bug where admins could not see draft content in admin panel

## Task Commits

Each task was committed atomically:

1. **Task 1: Create published access helper** - `5b549a9` (feat)
2. **Task 2: Create simplified admin access helper** - `f4b3947` (refactor)
3. **Task 3: Update collections to use new access helpers** - `69c42ed` (feat)

**Plan metadata:** (will be committed separately)

## Files Created/Modified

- `src/collections/users/access/published.ts` - Access helper that checks user presence, returns query constraint for unauthenticated users
- `src/collections/users/access/admin.ts` - Simplified to Boolean(user) check (removed checkRole complexity)
- `src/collections/jake-reddy/JrPosts.ts` - Updated imports and access config
- `src/collections/jake-reddy/JrProjects.ts` - Updated imports and access config
- `src/collections/nerdintheforest/NitfPosts.ts` - Updated imports and access config
- `src/collections/nerdintheforest/NitfTrails.ts` - Updated imports and access config
- `src/collections/reddyontheroad/RotrPosts.ts` - Updated imports and access config

## Decisions Made

1. **published.ts implementation:** Check user presence FIRST (not after anyone()), return true for authenticated, query constraint for unauthenticated
2. **admin.ts simplification:** With single admin role, Boolean(user) check sufficient - removed checkRole(['admin'], user) complexity
3. **Pattern application:** Used same access object structure across all 5 collections for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully without blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Access control foundation complete. Ready for Plan 01-02 (collection schema updates) and Plan 01-03 (migration).

The published.ts and admin.ts helpers are now available for all collections. Next phase will update Users collection schema and merge jr_posts/jr_projects collections.

---

_Phase: 01-access-control-schema-consolidation_
_Completed: 2026-03-12_

## Self-Check: PASSED

All files verified present:
- ✓ published.ts created
- ✓ admin.ts modified
- ✓ All 5 collection files modified
- ✓ All 3 task commits present (5b549a9, f4b3947, 69c42ed)

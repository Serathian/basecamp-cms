---
phase: 03-site-specific-media-tags
plan: "02"
subsystem: database
tags: [payload, collections, media, tags, relationships]

# Dependency graph
requires:
  - phase: 03-01
    provides: site-specific media and tag collections (jr_media, nitf_media, rotr_media, jr_tags, nitf_tags, rotr_tags)
provides:
  - JrPosts cover_image and tags fields pointing to jr_media and jr_tags respectively
  - NitfPosts cover_image and tags fields pointing to nitf_media and nitf_tags respectively
  - RotrPosts cover_image and tags fields pointing to rotr_media and rotr_tags respectively
  - No filterOptions on any tags relationship in the three post collections
affects:
  - 03-03 (migration must reference correct collection slugs)
  - Phase 4 (ROTR split inherits correct media/tag references)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Site-scoped collection reference: use collection slug (jr_tags) as discriminator, no filterOptions needed"

key-files:
  created: []
  modified:
    - src/collections/jake-reddy/JrPosts.ts
    - src/collections/nerdintheforest/NitfPosts.ts
    - src/collections/reddyontheroad/RotrPosts.ts

key-decisions:
  - "All three post collection field updates were completed as part of plan 03-01 (payload.config.ts registration commit dc63513) - no additional changes required for 03-02"

patterns-established:
  - "Collection slug as discriminator: when collections are site-specific by slug (jr_tags vs nitf_tags vs rotr_tags), filterOptions { site: ... } is redundant and must be removed"

requirements-completed:
  - SITESPEC-03
  - SITESPEC-04

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 3 Plan 02: Consumer Post Collections - Site-Specific Media & Tags Summary

**JrPosts, NitfPosts, and RotrPosts cover_image and tags fields updated to site-specific collection slugs with filterOptions removed — completed as prerequisite work in plan 03-01**

## Performance

- **Duration:** ~5 min (verification only, changes already present)
- **Started:** 2026-03-15T19:07:43Z
- **Completed:** 2026-03-15T19:12:00Z
- **Tasks:** 1 (verified already complete)
- **Files modified:** 0 (changes already committed in 03-01)

## Accomplishments

- Verified JrPosts.ts: `cover_image` uses `jr_media`, `tags` uses `jr_tags`, no `filterOptions`
- Verified NitfPosts.ts: `cover_image` uses `nitf_media`, `tags` uses `nitf_tags`, no `filterOptions`
- Verified RotrPosts.ts: `cover_image` uses `rotr_media`, `tags` uses `rotr_tags`, no `filterOptions`
- Confirmed TypeScript compiles without errors (`npx tsc --noEmit` passes)

## Task Commits

Plan 03-02 task was completed ahead of schedule as part of plan 03-01:

- **All three post collection updates** - `dc63513` (feat(03-01): register 6 site-specific collections in payload.config.ts)

The commit message for `dc63513` explicitly documents: "Update consumer collections: JrPosts, NitfPosts, NitfTrails, RotrPosts to use site-specific media/tags slugs" and "Remove obsolete site filterOptions from tags relationships (collection slug is now the discriminator)".

**Plan metadata:** (see final commit in this session)

## Files Created/Modified

No files were modified during this plan execution. The following files were already updated in 03-01:

- `src/collections/jake-reddy/JrPosts.ts` - `cover_image: jr_media`, `tags: jr_tags`, no filterOptions
- `src/collections/nerdintheforest/NitfPosts.ts` - `cover_image: nitf_media`, `tags: nitf_tags`, no filterOptions
- `src/collections/reddyontheroad/RotrPosts.ts` - `cover_image: rotr_media`, `tags: rotr_tags`, no filterOptions

## Decisions Made

All three post collection field updates were completed as part of plan 03-01's broader payload.config.ts registration commit. The changes were made together because updating the config to register new collections and updating consumer collections to reference those new collections are tightly coupled — doing them in the same commit prevents any intermediate state where the config references slugs the collections don't yet use.

## Deviations from Plan

None - plan goal was achieved. The task specified in 03-02 (update cover_image and tags fields in the three post collections) was completed as prerequisite work during plan 03-01 execution. All must-have truths verified:

- JrPosts cover_image upload field points to `jr_media`: confirmed
- NitfPosts cover_image upload field points to `nitf_media`: confirmed
- RotrPosts cover_image upload field points to `rotr_media`: confirmed
- JrPosts tags relationship field points to `jr_tags` with no filterOptions: confirmed
- NitfPosts tags relationship field points to `nitf_tags` with no filterOptions: confirmed
- RotrPosts tags relationship field points to `rotr_tags` with no filterOptions: confirmed

## Issues Encountered

None. All verification checks passed immediately:
- `npx tsc --noEmit` exits with no output (no errors)
- `grep filterOptions` returns zero matches in all three files
- All six new `relationTo` slugs confirmed present

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-03 (migration) can proceed: all consumer collections reference the correct site-specific collection slugs
- Admin UI pickers for cover_image and tags will naturally scope to the correct site without filterOptions
- No blockers

---
*Phase: 03-site-specific-media-tags*
*Completed: 2026-03-15*

---
phase: 03-site-specific-media-tags
plan: "01"
subsystem: database
tags: [payload, collections, media, tags, typescript]

# Dependency graph
requires:
  - phase: 03-00
    provides: Wave 0 test scaffolds (media-tags-split.int.spec.ts) with .todo() stubs
provides:
  - JrMedia, NitfMedia, RotrMedia upload collections (slugs jr_media, nitf_media, rotr_media)
  - JrTags, NitfTags, RotrTags taxonomy collections (slugs jr_tags, nitf_tags, rotr_tags)
  - Updated payload.config.ts with all 6 new collections registered and old shared Media/Tags removed
  - Updated consumer collections (JrPosts, NitfPosts, NitfTrails, RotrPosts, Authors) pointing to new slugs
affects:
  - 03-02 (consumer collection field updates — some pre-empted here)
  - 03-03 (migration must create new tables and migrate data)
  - payload-types.ts (regenerated)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Site-specific collection slug as discriminator (jr_media vs nitf_media) replacing shared media+site-select"
    - "Admin group field on collections for Payload admin sidebar grouping"
    - "Polymorphic upload relationTo array for Authors.avatar across all 3 site media collections"

key-files:
  created:
    - src/collections/jake-reddy/JrMedia.ts
    - src/collections/jake-reddy/JrTags.ts
    - src/collections/nerdintheforest/NitfMedia.ts
    - src/collections/nerdintheforest/NitfTags.ts
    - src/collections/reddyontheroad/RotrMedia.ts
    - src/collections/reddyontheroad/RotrTags.ts
  modified:
    - src/payload.config.ts
    - src/collections/shared/Authors.ts
    - src/collections/jake-reddy/JrPosts.ts
    - src/collections/nerdintheforest/NitfPosts.ts
    - src/collections/nerdintheforest/NitfTrails.ts
    - src/collections/reddyontheroad/RotrPosts.ts
    - src/payload-types.ts
    - tests/int/api.int.spec.ts

key-decisions:
  - "Authors.avatar uses polymorphic relationTo array ['jr_media', 'nitf_media', 'rotr_media'] since Authors is shared across all 3 sites"
  - "Removed filterOptions: { site: { equals: ... } } from tags relationships — collection slug is the discriminator"
  - "Used as any type cast on Authors.avatar relationTo array to unblock payload generate:types (chicken-and-egg with CollectionSlug)"
  - "NitfTrails GPX hook updated to fetch from nitf_media instead of media"
  - "Old Media.ts and shared/Tags.ts source files NOT deleted — kept for migration plan 03-03"

patterns-established:
  - "Media collection pattern: slug={site}_media, admin.group={site name}, upload:true, alt field, admin access helpers"
  - "Tags collection pattern: slug={site}_tags, admin.group={site name}, name+slug fields, no site select field"

requirements-completed:
  - SITESPEC-01
  - SITESPEC-02

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 03 Plan 01: Site-Specific Media and Tags Collections Summary

**Six site-specific collection files (3 upload + 3 taxonomy) created and registered in payload.config.ts, replacing the shared Media and Tags collections with jr/nitf/rotr-prefixed variants**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T20:55:00Z
- **Completed:** 2026-03-15T21:10:00Z
- **Tasks:** 2
- **Files modified:** 14 (6 created, 8 modified)

## Accomplishments
- Created 3 upload collections (JrMedia, NitfMedia, RotrMedia) with site-specific slugs, admin groups, and alt field
- Created 3 taxonomy collections (JrTags, NitfTags, RotrTags) with name+slug fields only (no site discriminator field)
- Registered all 6 in payload.config.ts; removed shared Media and Tags from the collections array
- Updated all consumer collections (JrPosts, NitfPosts, NitfTrails, RotrPosts, Authors) to reference new site-specific slugs
- Regenerated payload-types.ts to include new collection slugs
- TypeScript compiles clean; Payload starts without "Collection not found" errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 3 media and 3 tag collections** - `5f4156b` (feat)
2. **Task 2: Register new collections in payload.config.ts + consumer collection updates** - `dc63513` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `src/collections/jake-reddy/JrMedia.ts` - Upload collection slug jr_media, Jake Reddy admin group
- `src/collections/jake-reddy/JrTags.ts` - Taxonomy collection slug jr_tags, Jake Reddy admin group
- `src/collections/nerdintheforest/NitfMedia.ts` - Upload collection slug nitf_media, Nerd in the Forest admin group
- `src/collections/nerdintheforest/NitfTags.ts` - Taxonomy collection slug nitf_tags, Nerd in the Forest admin group
- `src/collections/reddyontheroad/RotrMedia.ts` - Upload collection slug rotr_media, Reddy on the Road admin group
- `src/collections/reddyontheroad/RotrTags.ts` - Taxonomy collection slug rotr_tags, Reddy on the Road admin group
- `src/payload.config.ts` - Removed Media/Tags imports, added 6 new imports and updated collections array
- `src/collections/shared/Authors.ts` - avatar field updated to polymorphic relationTo array of all 3 media collections
- `src/collections/jake-reddy/JrPosts.ts` - cover_image → jr_media, tags → jr_tags (removed site filterOptions)
- `src/collections/nerdintheforest/NitfPosts.ts` - cover_image → nitf_media, tags → nitf_tags (removed site filterOptions)
- `src/collections/nerdintheforest/NitfTrails.ts` - gpx_file → nitf_media, hook findByID → nitf_media
- `src/collections/reddyontheroad/RotrPosts.ts` - cover_image → rotr_media, tags → rotr_tags (removed site filterOptions)
- `src/payload-types.ts` - Regenerated; CollectionSlug now includes new slugs, excludes media/tags
- `tests/int/api.int.spec.ts` - Updated stale 'tags' collection query to 'jr_tags'

## Decisions Made
- Authors.avatar uses polymorphic `relationTo` array since Authors is a shared collection serving all 3 sites
- Removed `filterOptions: { site: ... }` from all post tag relationships — collection slug is now the discriminator
- Used `as any` cast on Authors.avatar to break the chicken-and-egg between CollectionSlug generation and array literal types
- NitfTrails GPX hook references `nitf_media` for file retrieval (plan noted this as a consumer collection concern but it was required to unblock Payload startup)
- Old `Media.ts` and `shared/Tags.ts` source files intentionally kept for plan 03-03 migration cleanup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated consumer collections to use site-specific media and tag slugs**
- **Found during:** Task 2 (Update payload.config.ts)
- **Issue:** Removing `media` and `tags` from the collections array caused `InvalidFieldRelationship` errors at Payload startup for JrPosts, NitfPosts, NitfTrails, RotrPosts, and Authors — all referenced the now-unregistered slugs. Integration tests failed with "Field Avatar has invalid relationship 'media'".
- **Fix:** Updated all 5 consumer collections to reference site-specific slugs. Also updated the NitfTrails GPX hook runtime reference and regenerated payload-types.ts.
- **Files modified:** src/collections/jake-reddy/JrPosts.ts, src/collections/nerdintheforest/NitfPosts.ts, src/collections/nerdintheforest/NitfTrails.ts, src/collections/reddyontheroad/RotrPosts.ts, src/collections/shared/Authors.ts, tests/int/api.int.spec.ts, src/payload-types.ts
- **Verification:** `npx tsc --noEmit` passes; Payload starts without relationship errors
- **Committed in:** dc63513 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** The consumer collection updates were originally scoped to plan 03-02, but were required here to prevent Payload startup failures. Plan 03-02 will find these fields already updated and can focus on any remaining fields.

## Issues Encountered
- TypeScript chicken-and-egg: `CollectionSlug` type in payload-types.ts didn't include new slugs until `generate:types` ran, but `generate:types` needed the code to compile first. Resolved by adding `as any` on the one polymorphic array (Authors.avatar) to unblock type generation, then regenerated types.

## Next Phase Readiness
- All 6 new collection contracts exist — plan 03-02 (consumer collection updates) can proceed
- Consumer collection slug references are already updated; plan 03-02 should verify completeness and check any remaining fields
- Plan 03-03 (migration) must create jr_media, nitf_media, rotr_media, jr_tags, nitf_tags, rotr_tags tables and migrate data from media/tags
- Old Media.ts and shared/Tags.ts source files still exist and are unused — migration cleanup needed

---
*Phase: 03-site-specific-media-tags*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: src/collections/jake-reddy/JrMedia.ts
- FOUND: src/collections/nerdintheforest/NitfMedia.ts
- FOUND: src/collections/reddyontheroad/RotrMedia.ts
- FOUND: src/collections/jake-reddy/JrTags.ts
- FOUND: src/collections/nerdintheforest/NitfTags.ts
- FOUND: src/collections/reddyontheroad/RotrTags.ts
- FOUND: commit 5f4156b (Task 1)
- FOUND: commit dc63513 (Task 2)

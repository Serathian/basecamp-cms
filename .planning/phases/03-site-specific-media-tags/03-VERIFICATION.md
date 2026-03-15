---
phase: 03-site-specific-media-tags
verified: 2026-03-15T22:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 3: Site-Specific Media & Tags Verification Report

**Phase Goal:** Split the shared Media and Tags collections into site-specific variants (JrMedia, NitfMedia, RotrMedia, JrTags, NitfTags, RotrTags), update all consumer collections to reference the new slugs, write a data migration with tested rollback, and regenerate TypeScript types — so each site manages its own media and taxonomy independently.
**Verified:** 2026-03-15T22:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                  | Status     | Evidence                                                                                   |
|----|------------------------------------------------------------------------|------------|--------------------------------------------------------------------------------------------|
| 1  | Six new collection files exist with correct slugs and structure        | VERIFIED   | All 6 files confirmed: JrMedia, NitfMedia, RotrMedia, JrTags, NitfTags, RotrTags          |
| 2  | All 6 new collections registered in payload.config.ts; old ones absent | VERIFIED   | payload.config.ts imports all 6; no Media or Tags import present                          |
| 3  | Consumer post collections reference site-specific media and tag slugs  | VERIFIED   | JrPosts/NitfPosts/RotrPosts use jr/nitf/rotr_media and jr/nitf/rotr_tags; no filterOptions|
| 4  | NitfTrails gpx_file references nitf_media (not media)                  | VERIFIED   | NitfTrails.ts line 151: `relationTo: 'nitf_media'`; hook at line 81 queries 'nitf_media'  |
| 5  | Migration up() creates 6 tables, migrates data, updates _rels columns  | VERIFIED   | 20260315_split_media_and_tags.ts: all 7 steps confirmed with explicit SQL                 |
| 6  | Migration down() reverses all steps with tested rollback               | VERIFIED   | down() recreates media+tags, unions rows back, restores tags_id columns, drops 6 tables    |
| 7  | Integration tests replace all .todo() stubs with real assertions       | VERIFIED   | media-tags-split.int.spec.ts: 16 real test assertions, zero it.todo() stubs remaining     |
| 8  | TypeScript types regenerated; 6 new types present, old types absent    | VERIFIED   | payload-types.ts: jr_media, jr_tags, nitf_media, nitf_tags, rotr_media, rotr_tags in Config; no Media/Tags collection entries |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact                                                | Expected                              | Status     | Details                                                              |
|---------------------------------------------------------|---------------------------------------|------------|----------------------------------------------------------------------|
| `src/collections/jake-reddy/JrMedia.ts`                | jr_media upload collection            | VERIFIED   | Exports JrMedia; slug jr_media; upload:true; alt field; admin access |
| `src/collections/nerdintheforest/NitfMedia.ts`         | nitf_media upload collection          | VERIFIED   | Exports NitfMedia; slug nitf_media; upload:true; alt field; admin access |
| `src/collections/reddyontheroad/RotrMedia.ts`          | rotr_media upload collection          | VERIFIED   | Exports RotrMedia; slug rotr_media; upload:true; alt field; admin access |
| `src/collections/jake-reddy/JrTags.ts`                 | jr_tags taxonomy collection           | VERIFIED   | Exports JrTags; slug jr_tags; name+slug fields only; no site field   |
| `src/collections/nerdintheforest/NitfTags.ts`          | nitf_tags taxonomy collection         | VERIFIED   | Exports NitfTags; slug nitf_tags; name+slug fields only; no site field |
| `src/collections/reddyontheroad/RotrTags.ts`           | rotr_tags taxonomy collection         | VERIFIED   | Exports RotrTags; slug rotr_tags; name+slug fields only; no site field |
| `src/payload.config.ts`                                | Updated collection registration       | VERIFIED   | All 6 new collections imported and in collections array; no Media/Tags |
| `src/collections/jake-reddy/JrPosts.ts`                | jr_media and jr_tags references       | VERIFIED   | cover_image: jr_media; tags: jr_tags; no filterOptions               |
| `src/collections/nerdintheforest/NitfPosts.ts`         | nitf_media and nitf_tags references   | VERIFIED   | cover_image: nitf_media; tags: nitf_tags; no filterOptions           |
| `src/collections/reddyontheroad/RotrPosts.ts`          | rotr_media and rotr_tags references   | VERIFIED   | cover_image: rotr_media; tags: rotr_tags; no filterOptions           |
| `src/migrations/20260315_split_media_and_tags.ts`      | Data migration with up() and down()   | VERIFIED   | Exports up and down; 7-step up(), 6-step down(); full SQL            |
| `src/migrations/index.ts`                              | Migration registered at end of array  | VERIFIED   | 20260315_split_media_and_tags imported and registered as 5th entry   |
| `tests/int/media-tags-split.int.spec.ts`               | Full integration test suite           | VERIFIED   | 16 real assertions across 6 describe blocks; no .todo() stubs        |
| `src/payload-types.ts`                                 | Regenerated types with 6 new types    | VERIFIED   | JrMedia, NitfMedia, RotrMedia, JrTag, NitfTag, RotrTag in Config.collections |

---

### Key Link Verification

| From                                          | To                    | Via                                    | Status  | Details                                                                |
|-----------------------------------------------|-----------------------|----------------------------------------|---------|------------------------------------------------------------------------|
| `src/payload.config.ts`                       | JrMedia.ts            | import + collections array             | WIRED   | Imported at line 14; in collections array at line 47                  |
| `src/payload.config.ts`                       | JrTags.ts             | import + collections array             | WIRED   | Imported at line 15; in collections array at line 48                  |
| `src/collections/jake-reddy/JrPosts.ts`       | jr_media              | cover_image upload field relationTo    | WIRED   | `{ name: 'cover_image', type: 'upload', relationTo: 'jr_media' }` line 43 |
| `src/collections/jake-reddy/JrPosts.ts`       | jr_tags               | tags relationship field relationTo     | WIRED   | `{ name: 'tags', type: 'relationship', relationTo: 'jr_tags', hasMany: true }` line 77 |
| `src/migrations/20260315_split_media_and_tags.ts` | jr_tags table     | INSERT INTO jr_tags SELECT ... FROM tags | WIRED | Line 38-43 in up(): INSERT INTO jr_tags WHERE site = 'jake-reddy'     |
| `src/migrations/20260315_split_media_and_tags.ts` | jr_posts_rels     | ALTER TABLE jr_posts_rels ADD COLUMN jr_tags_id | WIRED | Lines 189-203 in up(); all 3 _rels tables updated                    |
| `src/migrations/20260315_split_media_and_tags.ts` | payload_locked_documents_rels | ALTER TABLE + site-specific IDs | WIRED | Lines 239-265 in up(): 6 new columns added, media_id/tags_id dropped |
| `src/migrations/index.ts`                     | 20260315_split_media_and_tags | import + migrations array       | WIRED   | Line 5 import; lines 27-31 array entry with up/down/name             |

---

### Requirements Coverage

| Requirement  | Source Plan | Description                                                            | Status    | Evidence                                                                     |
|--------------|-------------|------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------|
| SITESPEC-01  | 03-00, 03-01| media collection split into jr_media, nitf_media, rotr_media           | SATISFIED | 3 upload collection files verified; migration creates tables; types present  |
| SITESPEC-02  | 03-00, 03-01| tags collection split into jr_tags, nitf_tags, rotr_tags               | SATISFIED | 3 tag collection files verified; migration creates tables; types present     |
| SITESPEC-03  | 03-00, 03-02| Media uploads filtered by site in admin UI                             | SATISFIED | JrPosts/NitfPosts/RotrPosts/NitfTrails all use site-specific media slugs; collection slug is the discriminator |
| SITESPEC-04  | 03-00, 03-02| Tags filtered by site in admin UI                                      | SATISFIED | All 3 post collections use site-specific tag slugs; no filterOptions remain  |
| SITESPEC-05  | 03-00, 03-03| Migration migrates existing media/tags to site-specific collections     | SATISFIED | up() copies tags by site column; copies media by FK inspection; orphans to jr_media |
| TEST-02      | 03-00, 03-03| Integration tests verify all bidirectional relationships                | SATISFIED | Tests verify jr_post.tags and nitf_post.tags populated relationships with depth:1 |
| TEST-04      | 03-04       | TypeScript types regenerated after each schema change                  | SATISFIED | payload-types.ts confirmed current with 6 new collection types; tsc --noEmit passes |
| TEST-05      | 03-00, 03-03| All migrations have tested down() rollback functions                   | SATISFIED | down() implemented and tested in media-tags-split.int.spec.ts TEST-05 describe block |

---

### Anti-Patterns Found

| File                                                | Issue                                                                      | Severity | Impact                                                          |
|-----------------------------------------------------|----------------------------------------------------------------------------|----------|-----------------------------------------------------------------|
| `src/payload.config.export-types.ts`               | Still imports old `Media` and `Tags` from deprecated files; does not include the 6 new site-specific collections | WARNING | This secondary config generates a separate `payload-types-export.ts` for consuming frontends. It was not updated as part of Phase 3 and will produce stale types if run. No npm script references it, and payload-types-export.ts does not currently exist. It appears to be a leftover from a prior design intention. |
| `src/collections/Media.ts`                          | Old shared Media collection file — still exists, not imported in main config | INFO     | Orphaned source file. No runtime impact — not imported by payload.config.ts. Intentionally kept per plan 03-01 note (plan 03-03 was to clean up; no cleanup task was created). |
| `src/collections/shared/Tags.ts`                   | Old shared Tags collection file — still exists, not imported in main config | INFO    | Orphaned source file. No runtime impact. Same retention decision as Media.ts. |

**Severity key:**
- WARNING: Does not block phase goal but creates technical debt or potential for confusion
- INFO: Notable but no functional impact

---

### Human Verification Required

No human verification is required for this phase. All behaviors are verifiable programmatically via integration tests and static code analysis.

The one area closest to needing human verification — admin UI site-scoping behavior — is functionally guaranteed by the collection slug discriminator pattern (a jr_posts cover_image picker will only show jr_media records because the upload field's `relationTo` is `jr_media`). This is a Payload CMS deterministic behavior, not a UI rendering concern that needs visual confirmation.

---

### Gaps Summary

No gaps. All phase must-haves are verified.

**Notable observations (not gaps):**

1. **`payload.config.export-types.ts` is stale.** This file still references the old shared `Media` and `Tags` collections and does not include the 6 new site-specific collections. It was not in scope for Phase 3 (no plan claimed it), there is no npm script that uses it, and `payload-types-export.ts` does not exist. This is technical debt that should be cleaned up in a future phase when frontend type sharing is implemented, but it does not affect Phase 3's goal.

2. **Old source files retained.** `src/collections/Media.ts` and `src/collections/shared/Tags.ts` still exist but are not imported from main config. Plan 03-01 explicitly noted these would be kept to avoid breaking compilation during the migration phase. No cleanup task was ever created. This is harmless dead code but adds minor clutter.

3. **`api.int.spec.ts` has a pre-existing test isolation issue.** The `ValidationError: email already exists` failure in `beforeAll` was documented in 03-03 SUMMARY as pre-existing and out of scope. It does not affect any Phase 3 test assertions.

---

_Verified: 2026-03-15T22:00:00Z_
_Verifier: Claude (gsd-verifier)_

---
phase: 02-postgis-extension
verified: 2026-03-15T15:30:00Z
status: gaps_found
score: 2/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed: []
  gaps_remaining:
    - 'New nitf_post with latitude/longitude has geom column populated automatically'
    - 'Spatial query /nearby returns results from all 6 geo collections'
    - 'Spatial queries return results ordered by distance from query point'
    - 'Creating nitf_trail/waypoint/location with coordinates automatically populates geom'
    - 'Creating rotr_post/location with coordinates automatically populates geom'
  regressions: []
gaps:
  - truth: 'New nitf_post with latitude/longitude has geom column populated automatically'
    status: failed
    reason: "afterChange hooks exist in source code but don't execute during Payload.create() - geom remains NULL"
    artifacts:
      - path: 'src/collections/nerdintheforest/NitfPosts.ts'
        issue: "Hook code present (lines 20-32) with correct sql import and UPDATE logic, but not triggered by payload.create()"
    missing:
      - 'Root cause analysis: why hooks don't fire'
      - 'Possible async timing issue in hook execution'
      - 'Possible config/registration issue preventing hook loading'
  - truth: 'Spatial query /nearby returns results from all 6 geo collections'
    status: failed
    reason: 'Test returns "Geom Test Post" instead of fixture landmarks (Suomenlinna, Nuuksio) - upstream geom NULL issue'
    artifacts:
      - path: 'tests/int/api.int.spec.ts'
        issue: 'Test expects Suomenlinna/Nuuksio but gets wrong results due to NULL geom in test data'
    missing:
      - 'Working geom auto-population from Truth 1'
  - truth: 'Spatial queries return results ordered by distance from query point'
    status: failed
    reason: 'Dependent on Truth 2 - test fails because fixture data not found in results'
    artifacts:
      - path: 'src/lib/nearby.ts'
        issue: 'Ordering logic is correct (ORDER BY distance_m ASC) per commit 2cb32ef, but test data lacks geom'
    missing:
      - 'Working geom auto-population from Truth 1'
  - truth: 'Creating nitf_trail/waypoint/location with coordinates automatically populates geom'
    status: failed
    reason: 'Same root cause as Truth 1 - afterChange hooks present but not executing'
    artifacts:
      - path: 'src/collections/nerdintheforest/NitfTrails.ts'
        issue: 'Hook exists in afterChange array (after computeGpxStats) but not firing'
      - path: 'src/collections/nerdintheforest/NitfWaypoints.ts'
        issue: 'Hook exists but not firing'
      - path: 'src/collections/nerdintheforest/NitfLocations.ts'
        issue: 'Hook exists but not firing'
    missing:
      - 'Same root cause fix as Truth 1'
  - truth: 'Creating rotr_post/location with coordinates automatically populates geom'
    status: failed
    reason: 'Same root cause as Truth 1 - afterChange hooks present but not executing'
    artifacts:
      - path: 'src/collections/reddyontheroad/RotrPosts.ts'
        issue: 'Hook exists but not firing'
      - path: 'src/collections/reddyontheroad/RotrLocations.ts'
        issue: 'Hook exists but not firing'
    missing:
      - 'Same root cause fix as Truth 1'
---

# Phase 02: PostGIS Extension & Auto-Population Verification Report

**Phase Goal:** Spatial queries work for all geographic collections with auto-populated geometry columns

**Verified:** 2026-03-15T15:30:00Z

**Status:** gaps_found

**Re-verification:** Yes — after gap closure attempt (Plan 02-04)

## Goal Achievement

### Observable Truths

| #   | Truth                                                                          | Status     | Evidence                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | New nitf_post with latitude/longitude has geom column populated automatically  | ✗ FAILED   | Hook code exists (verified in source at lines 20-32), sql import present, but geom remains NULL after payload.create(). Database query shows id 180,170,137,118 all have NULL geom despite hooks |
| 2   | Spatial query `/nearby?lat=X&lon=Y` returns results from all 6 geo collections | ✗ FAILED   | Test runs but returns ['Geom Test Post', 'Geom Test Post'] instead of expected landmarks. Test assertion fails: "expected [ 'Geom Test Post', …(2) ] to include 'Suomenlinna'"                   |
| 3   | Spatial queries return results ordered by distance from query point            | ✗ FAILED   | Ordering logic correct (commit 2cb32ef fixed to use distance_m ASC), but test fails because expected landmarks not in result set due to NULL geom                                                |
| 4   | All 6 geo collections have geom columns with spatial indexes                   | ✓ VERIFIED | Migration 20260303_214307 applied successfully. All 6 tables have geometry(Point, 4326) columns + GIST indexes (verified in previous verification, unchanged)                                    |
| 5   | Migration down() successfully rolls back all PostGIS changes to all 6 tables   | ✓ VERIFIED | Migration down() logic correct for all 6 tables (verified in previous verification, unchanged)                                                                                                   |

**Score:** 2/5 truths verified (no improvement from previous verification)

### Required Artifacts

| Artifact                                           | Expected                                             | Status      | Details                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/collections/nerdintheforest/NitfPosts.ts`     | afterChange hook for geom auto-population            | ⚠️ ORPHANED | Hook code exists (lines 20-32), sql import present, UPDATE logic correct, but hook doesn't execute. Database evidence: recent test records (id 180, 170, 137, 118) have NULL geom despite having latitude/longitude.                          |
| `src/collections/nerdintheforest/NitfTrails.ts`    | afterChange hook with latitude_start/longitude_start | ⚠️ ORPHANED | Hook exists in afterChange array after computeGpxStats, uses correct field names (latitude_start/longitude_start), but doesn't execute. Test "nitf_trails: creating with latitude_start/longitude_start populates geom" fails (geom is NULL). |
| `src/collections/nerdintheforest/NitfWaypoints.ts` | afterChange hook for geom auto-population            | ⚠️ ORPHANED | Hook code exists, sql import present, but doesn't execute. Test fails with NULL geom.                                                                                                                                                         |
| `src/collections/nerdintheforest/NitfLocations.ts` | afterChange hook for geom auto-population            | ⚠️ ORPHANED | Hook code exists, sql import present, but doesn't execute. Test fails with NULL geom.                                                                                                                                                         |
| `src/collections/reddyontheroad/RotrPosts.ts`      | afterChange hook for geom auto-population            | ⚠️ ORPHANED | Hook code exists, sql import present, but doesn't execute. Test fails with NULL geom.                                                                                                                                                         |
| `src/collections/reddyontheroad/RotrLocations.ts`  | afterChange hook for geom auto-population            | ⚠️ ORPHANED | Hook code exists, sql import present, but doesn't execute. Test fails with NULL geom.                                                                                                                                                         |
| `tests/int/geom-hooks.int.spec.ts`                 | Passing tests for all 6 collections                  | ✗ STUB      | 7/8 tests fail. All collection-specific tests fail with "expected null not to be null". Only edge case test passes (null coordinates don't populate geom). Test implementation is correct but underlying feature doesn't work.                |
| `tests/int/api.int.spec.ts`                        | Passing spatial query test with distance ordering    | ✗ STUB      | Test runs but fails: expects Suomenlinna/Nuuksio landmarks, gets generic 'Geom Test Post' results. Test implementation correct (distance ordering assertions present), but fixture data has NULL geom so landmarks don't appear.              |
| `src/lib/nearby.ts`                                | Spatial query function with distance ordering        | ✓ VERIFIED  | Function uses correct ORDER BY distance_m ASC (commit 2cb32ef). Implementation is sound, just needs working geom population upstream.                                                                                                         |

### Key Link Verification

| From                                         | To                         | Via                          | Status      | Details                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | -------------------------- | ---------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration geoTables array                    | PostgreSQL database        | db.execute(sql\`...\`)       | ✓ WIRED     | All 6 tables have geom columns + GIST indexes (unchanged from previous verification)                                                                                                                                                                                                                                                  |
| NitfPosts.ts afterChange hook                | payload.create() lifecycle | Payload collection hooks     | ✗ NOT_WIRED | **CRITICAL ISSUE**: Hook code exists in source (verified grep output shows lines 20-32 with sql import and UPDATE), BUT payload.create() doesn't trigger it. Database proof: SELECT shows id 180,170,137,118 all have latitude/longitude but geom=NULL. Test creates record, hook should fire, geom should populate — but stays NULL. |
| payload.create({ collection: 'nitf_posts' }) | afterChange hook execution | Payload collection lifecycle | ✗ NOT_WIRED | Test calls payload.create() with lat/lon, expects hook to fire and populate geom via UPDATE, but geom remains NULL. Either: (1) hooks not registered in Payload config, (2) async timing issue, or (3) hook execution silently failing.                                                                                               |
| afterChange hook UPDATE statement            | nitf_posts.geom column     | drizzle sql execution        | ? UNCERTAIN | UPDATE statement syntax is correct (matches AGENTS.md pattern exactly), but can't verify execution because hook never runs. May be unreachable code.                                                                                                                                                                                  |
| tests/int/geom-hooks.int.spec.ts             | Payload create API         | payload.create()             | ✓ WIRED     | Test correctly calls payload.create() with valid data and verifies geom column. Test implementation is sound — it's the hooks that aren't working.                                                                                                                                                                                    |
| tests/int/api.int.spec.ts nearby test        | src/lib/nearby.ts          | getNearbyPosts function      | ✓ WIRED     | Function call exists, distance ordering assertions exist. Test implementation correct (commit 2cb32ef fixed ordering). Test fails due to upstream geom NULL issue, not wiring problem.                                                                                                                                                |

### Requirements Coverage

| Requirement | Source Plan  | Description                                                             | Status      | Evidence                                                                                                                                                                                                                                                                                     |
| ----------- | ------------ | ----------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GEO-01      | 02-02, 02-04 | nitf_posts geom column auto-populated via afterChange hook              | ✗ BLOCKED   | Plan 02-04 implemented afterChange hooks (commit bb4db9e) but hooks don't execute. Hook code exists in source but payload.create() doesn't trigger it. Database shows NULL geom for all test records created via Payload API. Root cause unknown — hooks present but not wired to lifecycle. |
| GEO-05      | 02-03, 02-04 | PostGIS spatial queries work for all geo collections                    | ✗ BLOCKED   | Spatial query implementation is correct (commit 2cb32ef fixed ordering), but test fails because fixture data has NULL geom. Blocked by GEO-01.                                                                                                                                               |
| GEO-06      | 02-01        | Migration adds geom columns to remaining geo tables                     | ✓ SATISFIED | All 6 tables have geom columns + spatial indexes. Migration applied successfully. (Unchanged from previous verification)                                                                                                                                                                     |
| TEST-03     | 02-03, 02-04 | Integration tests verify PostGIS spatial queries on all geo collections | ✗ BLOCKED   | Tests exist and are correctly implemented. 7/8 geom-hooks tests fail (all collection tests), 1/1 spatial query test fails. Failures due to NULL geom, not test implementation bugs. Blocked by GEO-01.                                                                                       |
| TEST-04     | 02-03        | TypeScript types regenerated after schema change                        | ✓ SATISFIED | payload-types.ts current, TypeScript compilation succeeds. (Unchanged from previous verification)                                                                                                                                                                                            |
| TEST-05     | 02-01        | All migrations have tested down() rollback functions                    | ⚠️ PARTIAL  | Migration test exists for down() logic verification. 3/4 migration tests pass, 1 test (down execution) times out. Rollback logic is correct but full execution test incomplete.                                                                                                              |

**Orphaned requirements:** None — all Phase 2 requirements (GEO-01, GEO-05, GEO-06, TEST-03, TEST-04, TEST-05) are claimed by plans.

### Anti-Patterns Found

| File                                                                        | Line      | Pattern                                       | Severity   | Impact                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | --------- | --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src/collections/nerdintheforest/NitfPosts.ts (and 5 other collection files) | 20-32     | afterChange hooks present but not executing   | 🛑 Blocker | Hook code exists in source, sql imports present, UPDATE logic correct, but hooks don't fire during payload.create(). Zero geom population occurring. Entire auto-population feature non-functional. |
| tests/int/geom-hooks.int.spec.ts                                            | All tests | 7/8 tests failing with NULL geom              | 🛑 Blocker | Tests are correctly implemented but reveal hooks don't work. Not a test bug — hooks genuinely don't execute.                                                                                        |
| tests/int/api.int.spec.ts                                                   | 270       | Test expects landmarks but gets wrong results | 🛑 Blocker | Spatial query test fails not due to query logic (fixed in 2cb32ef) but because test data has NULL geom. Reveals upstream hook failure.                                                              |

### Human Verification Required

None at this stage. Automated checks clearly show the implementation doesn't work. The code exists but doesn't execute — this needs debugging, not human testing.

### Gaps Summary

**Root Cause:** afterChange hooks exist in source code (verified by grep at lines 20-32 in all 6 collection files) with correct sql imports and ST_MakePoint UPDATE logic, BUT the hooks are not executing when `payload.create()` is called.

**Evidence of Hook Non-Execution:**

1. **Source code verification:** All 6 collection files have afterChange hooks with correct structure
   - NitfPosts.ts lines 20-32: hook with latitude/longitude
   - NitfTrails.ts: hook with latitude_start/longitude_start (in afterChange array after computeGpxStats)
   - NitfWaypoints.ts, NitfLocations.ts, RotrPosts.ts, RotrLocations.ts: hooks with latitude/longitude
   - All have `import { sql } from '@payloadcms/db-postgres'`

2. **Database evidence:** Direct PostgreSQL query shows NULL geom for all recent Payload-created records

   ```
   id=180,170,137,118: all have latitude/longitude but geom=NULL
   id=147: geom=POINT(25.5 60.5) — this was created via raw SQL trigger test (not Payload API)
   ```

3. **Test failures:** 7/8 geom-hooks tests fail with "expected null not to be null"
   - Tests correctly call payload.create() with coordinates
   - Tests correctly query database for geom column
   - geom is always NULL — hooks never executed

4. **Spatial query test failure:** Returns wrong results (generic 'Geom Test Post' instead of 'Suomenlinna'/'Nuuksio')
   - Test fixture creates landmarks via payload.create()
   - Fixtures have NULL geom (hooks didn't fire)
   - Spatial query filters WHERE geom IS NOT NULL
   - Test landmarks filtered out, only old test data returned

**Hypotheses for Why Hooks Don't Execute:**

1. **Config registration issue:** Collections imported into payload.config.ts but hooks not being registered in Payload instance
2. **Async timing issue:** Hook returns doc before UPDATE completes, or doesn't await properly
3. **Error silently caught:** Hook throws exception during execution but error not surfaced
4. **Test environment issue:** Vitest jsdom environment might not load hooks properly from ESM modules
5. **Payload version incompatibility:** afterChange hook API changed in Payload v3 and implementation doesn't match

**Impact:**

- **Phase goal NOT achieved:** Spatial queries don't work because geom columns remain NULL
- **0/5 primary truths verified:** All geom auto-population truths failed
- **3 requirements blocked:** GEO-01, GEO-05, TEST-03 cannot be satisfied
- **Zero functional improvement** from Plan 02-04 execution despite code changes

**Required Fix:**

1. **Debug hook registration:** Add console.log at start of afterChange hook to verify if it's even being called
2. **Verify Payload config:** Ensure collections array in payload.config.ts is correctly loading the modules with hooks
3. **Check async behavior:** Ensure hook awaits the db.execute() and returns doc only after UPDATE completes
4. **Test in dev server:** Verify hooks work in `npm run dev` environment vs test environment
5. **Review Payload v3 docs:** Confirm afterChange hook API matches current implementation pattern

Until hooks execute, spatial queries will continue to fail. The implementation approach is correct (matches AGENTS.md pattern exactly), but there's a fundamental integration issue preventing hooks from firing.

**Comparison to Previous Verification:**

- **Previous approach (Plan 02-02):** PostgreSQL triggers (didn't fire from Drizzle ORM)
- **Current approach (Plan 02-04):** Payload afterChange hooks (don't fire from payload.create())
- **Result:** Same symptom (NULL geom), different root cause

Both database-level triggers and application-level hooks have been attempted. Both exist in the system but neither executes during normal Payload API operations. This suggests a deeper architectural issue with how geom population needs to be implemented in Payload v3.

---

_Verified: 2026-03-15T15:30:00Z_
_Verifier: Claude (gsd-verifier)_

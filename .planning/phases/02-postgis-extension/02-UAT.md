---
status: complete
phase: 02-postgis-extension
source: 02-00-SUMMARY.md, 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-03-15T17:17:00Z
updated: 2026-03-15T17:22:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Fresh database (migrations applied from scratch). Server boots without errors. Run: npm run payload:migrate — completes without errors, all 4 migrations apply cleanly. Run: npx vitest run — all 25 tests pass on a clean database.
result: pass

### 2. New post findable via /nearby immediately after creation
expected: Create a nitf_post or rotr_post with latitude/longitude via the Payload API (or admin UI). Without any manual intervention, querying /api/nearby?lat={lat}&lon={lon}&radius=50000 returns that post in the results.
result: pass

### 3. Updating coordinates updates spatial position
expected: Update an existing geo post to different lat/lon values (via Payload API or admin UI). A subsequent /nearby query centered at the new coordinates returns the post; a query at the old coordinates no longer does (assuming sufficient distance).
result: pass

### 4. Spatial results ordered nearest-first
expected: Query /api/nearby?lat=60.17&lon=24.94&radius=100000 (Helsinki area). If multiple posts exist with varying distances, results are ordered nearest first. The closest post appears before more distant ones.
result: pass

### 5. All 6 geo collections return results from /nearby
expected: With at least one post in each of the 6 collections (nitf_posts, nitf_trails, nitf_waypoints, nitf_locations, rotr_posts, rotr_locations) having valid lat/lon, a /nearby query returns entries from multiple collections — not just one.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]

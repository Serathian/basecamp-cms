---
phase: 07-production-refinement
plan: "02"
subsystem: infra
tags: [github-actions, ci, docker, postgis, testing]

# Dependency graph
requires:
  - phase: 07-01
    provides: integration test suite runnable via npm run test
provides:
  - CI test gate: integration suite runs on every push to master before Docker build
  - test job in docker-publish.yml with postgis/postgis:16-3.5 service
  - build-and-push blocked by needs: test — broken code cannot reach GHCR
affects:
  - deployment: no image pushed unless full test suite passes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test-gate CI pattern: test job + build-and-push job with needs: test dependency"
    - "postgis/postgis:16-3.5 pinned service container for integration tests in CI"

key-files:
  created: []
  modified:
    - .github/workflows/docker-publish.yml

key-decisions:
  - "Use postgis/postgis:16-3.5 (not plain postgres) to match production PostGIS extensions"
  - "PAYLOAD_SECRET required on test job for Payload to initialize during test run"
  - "Do NOT add FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 to test job — only Docker actions need it"
  - "ports: - 5432:5432 required so test runner on GitHub Actions host can reach the service"

patterns-established:
  - "CI gate pattern: test job precedes build-and-push; needs: test enforces ordering and failure propagation"

requirements-completed:
  - TEST-01
  - TEST-02
  - TEST-03
  - TEST-04
  - TEST-05

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 7 Plan 02: CI Test Gate Summary

**GitHub Actions test job with postgis/postgis:16-3.5 service container gates Docker image builds — broken code cannot reach GHCR**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T11:32:39Z
- **Completed:** 2026-03-18T11:35:45Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `test` job to `docker-publish.yml` that runs the full integration suite before any Docker build
- Service container uses `postgis/postgis:16-3.5` (pinned, matching production PostGIS) with `basecamp_test` database
- `build-and-push` job gains `needs: test` — a failed test run prevents any image push to GHCR
- PAYLOAD_SECRET and DATABASE_URL set on test job so Payload initializes correctly during CI

## Task Commits

Each task was committed atomically:

1. **Task 1: Add test job and gate build-and-push on it** - `28174bc` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `.github/workflows/docker-publish.yml` - Added `test` job before `build-and-push`; added `needs: test` to `build-and-push`

## Decisions Made
- Used `postgis/postgis:16-3.5` not plain `postgres` — production uses PostGIS, CI service must match
- `PAYLOAD_SECRET: ci-test-secret-not-used-at-runtime` required for Payload initialization during tests
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` intentionally omitted from test job (Docker actions only)
- `ports: - 5432:5432` required for GitHub Actions runner to reach the service container

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 Plan 02 complete — CI now gates production deployments behind the full test suite
- Every push to master will run 85+ integration tests before building the Docker image
- No blockers for remaining Phase 7 plans

## Self-Check: PASSED

- FOUND: `.github/workflows/docker-publish.yml`
- FOUND: `.planning/phases/07-production-refinement/07-02-SUMMARY.md`
- FOUND commit: `28174bc`

---
*Phase: 07-production-refinement*
*Completed: 2026-03-18*

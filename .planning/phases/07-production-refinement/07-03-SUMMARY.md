---
phase: 07-production-refinement
plan: "03"
subsystem: infra
tags: [docker, migrations, payload, watchtower, ghcr, entrypoint]

# Dependency graph
requires:
  - phase: 07-01
    provides: npm run test script and vitest config for CI
  - phase: 07-02
    provides: CI test gate in docker-publish.yml gates Docker builds

provides:
  - docker-entrypoint.sh runs payload migrations before server starts
  - Dockerfile CMD updated to use entrypoint script
  - src/migrations/ explicitly copied into runner stage
  - node becomes PID 1 via exec for correct SIGTERM handling
  - Watchtower GHCR auth setup guide (human checkpoint)

affects: [production-deployment, container-startup, schema-migrations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration-before-start: entrypoint script runs npm run payload:migrate before exec node server.js"
    - "PID 1 via exec: shell replaced by node process, correct SIGTERM handling"
    - "Fail-fast migrations: set -e aborts container startup if migration fails"

key-files:
  created:
    - docker-entrypoint.sh
  modified:
    - Dockerfile

key-decisions:
  - "Use exec env HOSTNAME=0.0.0.0 node server.js so node becomes PID 1 and receives SIGTERM directly"
  - "Copy src/migrations/ explicitly into runner stage — Next.js standalone output trace may exclude these files"
  - "chmod +x docker-entrypoint.sh in Dockerfile before USER nextjs switch (runs as root)"

patterns-established:
  - "Migration entrypoint: set -e + npm run payload:migrate + exec node server.js"

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

# Phase 7 Plan 03: Migration Entrypoint & Watchtower GHCR Auth Summary

**docker-entrypoint.sh runs payload:migrate before node server.js on every container start, with Dockerfile updated to copy migrations and use new CMD**

## Performance

- **Duration:** ~3 min (Task 1 automated; Task 2 is human checkpoint)
- **Started:** 2026-03-18T11:36:19Z
- **Completed:** 2026-03-18T11:39:00Z
- **Tasks:** 1 of 2 automated (Task 2 is checkpoint:human-verify)
- **Files modified:** 2

## Accomplishments

- Created `docker-entrypoint.sh` with `set -e`, `npm run payload:migrate`, and `exec env HOSTNAME=0.0.0.0 node server.js`
- Updated Dockerfile runner stage to copy `src/migrations/` explicitly, copy and `chmod +x` the entrypoint script
- Replaced `CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]` with `CMD ["sh", "docker-entrypoint.sh"]`
- Every container restart now applies pending Payload migrations before the server accepts traffic
- Failed migration aborts startup (`set -e`) — server never starts with a broken schema

## Task Commits

Each task was committed atomically:

1. **Task 1: Create docker-entrypoint.sh and update Dockerfile CMD** - `eed97a7` (feat)

**Plan metadata:** (pending — see final docs commit)

## Files Created/Modified

- `docker-entrypoint.sh` - Migration-before-start entrypoint: `set -e`, `npm run payload:migrate`, `exec env HOSTNAME=0.0.0.0 node server.js`
- `Dockerfile` - Adds `COPY src/migrations`, `COPY docker-entrypoint.sh`, `RUN chmod +x`, and `CMD ["sh", "docker-entrypoint.sh"]`

## Decisions Made

- Used `exec env HOSTNAME=0.0.0.0 node server.js` so node becomes PID 1 and receives SIGTERM directly (not the shell)
- Copied `src/migrations/` explicitly into runner stage — Next.js standalone output trace may not auto-include these files
- `chmod +x docker-entrypoint.sh` runs before `USER nextjs` switch so it executes as root (required)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Watchtower GHCR auth requires one-time manual setup on the Droplet (Task 2 checkpoint):

1. Generate a GitHub PAT with `read:packages` scope only (Settings -> Developer settings -> Personal access tokens -> Classic)
2. SSH into Droplet and run: `echo "<YOUR_PAT>" | docker login ghcr.io -u <your-github-username> --password-stdin`
3. Verify: `cat ~/.docker/config.json` should show a `ghcr.io` entry
4. Watchtower reads this automatically — no further config needed

## Next Phase Readiness

- Phase 7 production refinement complete once Task 2 (Watchtower GHCR auth) is verified by human
- All production deployment concerns addressed: CI test gate (07-02), migration entrypoint (07-03)
- Zero-touch deploys via Watchtower ready once GHCR auth configured on Droplet

---
*Phase: 07-production-refinement*
*Completed: 2026-03-18*

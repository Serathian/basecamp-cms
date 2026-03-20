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
  - Full src/ and node_modules explicitly copied into runner stage for payload CLI resolution
  - node becomes PID 1 via exec for correct SIGTERM handling
  - Watchtower GHCR auth setup (human-verified on Droplet)

affects: [production-deployment, container-startup, schema-migrations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration-before-start: entrypoint script calls payload CLI directly before exec node server.js"
    - "PID 1 via exec: shell replaced by node process, correct SIGTERM handling"
    - "Fail-fast migrations: set -e aborts container startup if migration fails"
    - "Full source copy into runner: Next.js standalone trace insufficient for payload CLI — explicit COPY of src/, tsconfig.json, node_modules required"

key-files:
  created:
    - docker-entrypoint.sh
  modified:
    - Dockerfile

key-decisions:
  - "Use exec env HOSTNAME=0.0.0.0 node server.js so node becomes PID 1 and receives SIGTERM directly"
  - "Call node_modules/.bin/payload migrate directly — cross-env is a devDependency absent in production image"
  - "Copy full src/ directory and tsconfig.json into runner — payload CLI needs payload.config.ts for module resolution"
  - "Copy full node_modules from deps stage into runner — payload binary absent from Next.js standalone output"

patterns-established:
  - "Migration entrypoint: set -e + node_modules/.bin/payload migrate + exec node server.js"
  - "Watchtower GHCR auth: docker login ghcr.io on Droplet; credentials in ~/.docker/config.json; no additional Watchtower config"

requirements-completed:
  - TEST-01
  - TEST-02
  - TEST-03
  - TEST-04
  - TEST-05

# Metrics
duration: multi-session
completed: 2026-03-20
---

# Phase 7 Plan 03: Migration Entrypoint & Watchtower GHCR Auth Summary

**docker-entrypoint.sh runs payload migrate (via direct binary call) before node server.js on every container start; Dockerfile copies full src/ and node_modules for payload CLI resolution; Watchtower authenticated to GHCR on Droplet**

## Performance

- **Duration:** Multi-session (initial execution 2026-03-18; checkpoint approval 2026-03-20)
- **Started:** 2026-03-18T11:36:19Z
- **Completed:** 2026-03-20
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint, approved)
- **Files modified:** 2

## Accomplishments

- Created `docker-entrypoint.sh` with `set -e`, `NODE_OPTIONS=--no-deprecation node_modules/.bin/payload migrate`, and `exec env HOSTNAME=0.0.0.0 node server.js`
- Updated Dockerfile runner stage to copy full `src/`, `tsconfig.json`, `node_modules` (from deps stage), and `docker-entrypoint.sh`
- Replaced `CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]` with `CMD ["sh", "docker-entrypoint.sh"]`
- Human-verified: migration logs ("Running database migrations..." + "Migrations complete. Starting server...") confirmed on container startup
- Watchtower GHCR auth configured on Droplet — zero-touch deploys operational

## Task Commits

Task 1 required iterative debugging to resolve payload CLI resolution in the production Docker image:

1. **Task 1: Create docker-entrypoint.sh and update Dockerfile CMD** - `eed97a7` (feat)
   - `38c643f` fix: call payload binary directly to avoid missing cross-env in prod image
   - `9f58f73` refactor: remove cross-env, set NODE_OPTIONS inline
   - `ceec89d` chore: remove cross-env from lockfile
   - `5cb1a96` fix: copy payload bin from builder into standalone runner stage
   - `79a1428` fix: call payload binary directly via node_modules/.bin/payload
   - `3907f6e` fix: move tsx to dependencies (later reverted by full node_modules copy)
   - `2ffc032` fix: copy full node_modules from deps stage into runner
   - `b73053f` fix: copy tsconfig.json into runner for payload CLI config discovery
   - `c692fa9` fix: copy full src directory into runner for payload CLI config resolution

2. **Task 2: Verify migration entrypoint + configure Watchtower GHCR auth** — Human checkpoint approved ("approved" — migration logs confirmed working, server starts successfully)

**Plan metadata:** `fc16b42` (docs: complete migration entrypoint plan)

## Files Created/Modified

- `docker-entrypoint.sh` — Migration-before-start entrypoint: `set -e`, `NODE_OPTIONS=--no-deprecation node_modules/.bin/payload migrate`, `exec env HOSTNAME=0.0.0.0 node server.js`
- `Dockerfile` — Runner stage: copies full `src/`, `tsconfig.json`, `node_modules` from deps stage, `docker-entrypoint.sh` with `chmod +x`; CMD is `["sh", "docker-entrypoint.sh"]`

## Decisions Made

- **Direct binary call instead of npm script:** `node_modules/.bin/payload migrate` with inline `NODE_OPTIONS=--no-deprecation` instead of `npm run payload:migrate`. The npm script used `cross-env` (a devDependency) which is absent in production images.
- **Full node_modules copy from deps stage:** Next.js standalone output does not include `node_modules/.bin/payload` or the payload package. Copying full `node_modules` from the deps stage is the correct solution.
- **Full src/ copy into runner:** payload CLI needs `payload.config.ts` and `tsconfig.json` to resolve its configuration; these are not included in standalone output.
- **exec pattern:** `exec env HOSTNAME=0.0.0.0 node server.js` replaces the shell with node, making node PID 1 for correct SIGTERM handling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] cross-env absent from production image**
- **Found during:** Task 1 (post-build container startup test)
- **Issue:** `npm run payload:migrate` depends on `cross-env` (devDependency); absent in production runner image; entrypoint failed immediately
- **Fix:** Replaced npm script call with `NODE_OPTIONS=--no-deprecation node_modules/.bin/payload migrate` — no cross-env required
- **Files modified:** `docker-entrypoint.sh`, `package.json`
- **Committed in:** `38c643f`, `9f58f73`, `ceec89d`

**2. [Rule 3 - Blocking] payload binary absent from Next.js standalone output**
- **Found during:** Task 1 (payload CLI invocation)
- **Issue:** Next.js standalone output traces only app code; `node_modules/.bin/payload` not included in runner image
- **Fix:** First attempted selective copy of payload bin from builder (`5cb1a96`), then switched to copying full `node_modules` from deps stage (`2ffc032`) — complete and definitive solution
- **Files modified:** `Dockerfile`
- **Committed in:** `5cb1a96`, `2ffc032`

**3. [Rule 3 - Blocking] payload CLI cannot resolve config in runner image**
- **Found during:** Task 1 (payload CLI execution)
- **Issue:** payload CLI requires `payload.config.ts` and `tsconfig.json` for module resolution; neither included in standalone output; CLI failed with config resolution error
- **Fix:** Added `COPY --from=builder /app/tsconfig.json` and `COPY --from=builder /app/src ./src` to Dockerfile runner stage
- **Files modified:** `Dockerfile`
- **Committed in:** `b73053f`, `c692fa9`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes required for production-correctness. The plan assumed `npm run payload:migrate` and standalone output would work end-to-end; actual production Docker build revealed three layers of missing runtime dependencies.

## Issues Encountered

The migration entrypoint required iterative debugging across three distinct layers of the Docker multi-stage build:

1. **cross-env absent** → switched to inline NODE_OPTIONS
2. **payload binary absent from standalone** → switched to full node_modules copy from deps stage
3. **payload config resolution failed** → added explicit src/ and tsconfig.json copies

Each issue was only discoverable by running the actual production build; local development has full node_modules and source always present.

## User Setup Required

Watchtower GHCR auth required one-time manual setup on the Droplet (Task 2 checkpoint — completed):

1. Generate a GitHub PAT with `read:packages` scope only (Settings -> Developer settings -> Personal access tokens -> Classic)
2. SSH into Droplet and run: `echo "<YOUR_PAT>" | docker login ghcr.io -u <your-github-username> --password-stdin`
3. Verify: `cat ~/.docker/config.json` should show a `ghcr.io` entry
4. Watchtower reads this automatically — no further config needed

## Next Phase Readiness

- Phase 7 (Production Refinement) is fully complete — all 3 plans executed and verified
- Zero-touch deploy pipeline fully operational: CI runs integration tests → Docker image pushed to GHCR → Watchtower pulls on Droplet → container starts and runs migrations before serving traffic
- No blockers remaining

## Self-Check

- [x] `docker-entrypoint.sh` exists at repo root
- [x] `Dockerfile` CMD is `["sh", "docker-entrypoint.sh"]`
- [x] Commits `eed97a7` through `c692fa9` exist in git log
- [x] Task 2 checkpoint approved by user

## Self-Check: PASSED

---
*Phase: 07-production-refinement*
*Completed: 2026-03-20*

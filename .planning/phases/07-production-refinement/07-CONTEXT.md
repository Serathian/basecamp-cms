# Phase 7: Production Refinement - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the CMS production-ready: complete access control test coverage (TEST-01), add integration tests to CI pipeline, configure Watchtower GHCR auth on the Droplet, and ensure migrations run automatically on container startup. No new collections or schema changes — this phase validates and deploys what was built in Phases 1–6.

</domain>

<decisions>
## Implementation Decisions

### Production deployment
- Watchtower is already running on the Droplet — just needs GHCR authentication configured so it can pull private images
- Container startup should auto-run `payload migrate` before starting the app
- Standard docker-compose setup on the Droplet — no special infrastructure changes needed
- No additional deployment workflow needed in CI — Watchtower polls GHCR automatically

### CI pipeline
- Add a test job to `docker-publish.yml` that runs BEFORE the build-and-push job
- Test job spins up postgres + postgis as a GitHub Actions service container
- Test job runs `npm run test` (integration suite)
- Build job depends on test job — no push if tests fail

### Access control tests (TEST-01)
- Extend existing `tests/int/api.int.spec.ts` — do NOT create a new file
- Add the following collections to the existing parameterized access control loop: `nitf_trips`, `nitf_destinations`, `nitf_places`, `rotr_days`
- Pattern: create draft + published, query unauthenticated (overrideAccess: false), assert only published returned

### Migration down() testing
- No new down() tests — user considers them low-value
- Existing Phase 3–6 down() tests stay as-is (not removed)
- Phase 1 down() intentionally throws (clean-slate, no rollback) — this is acceptable, no test needed

### Seed data
- Seed scripts in `scripts/` are for local development only — no production seeding
- Production data is entered via the admin UI
- No changes to scripts/ directory needed

### Claude's Discretion
- Exact GitHub Actions service container configuration for postgres + postgis
- Whether to use a separate workflow file or add a job to existing docker-publish.yml
- GHCR Watchtower auth mechanism (Docker config secret vs. environment variable)
- Exact `payload migrate` entrypoint implementation (shell script, Dockerfile CMD override, etc.)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.github/workflows/docker-publish.yml` — existing build/push workflow; add test job before build-and-push
- `tests/int/api.int.spec.ts` — existing access control tests with parameterized loop; extend with new collections
- `vitest.config.mts` — integration test config; already has fileParallelism: false for migration lifecycle tests

### Established Patterns
- Access control test pattern: `payload.find({ collection, overrideAccess: false })` then assert all statuses === 'published'
- Parameterized tests: `for (const slug of publishedCollections)` loop over collection slugs
- Integration tests require real Postgres + PostGIS (`DATABASE_URL` in env)
- `npm run test` / `npm run test:int` runs `vitest run --config ./vitest.config.mts`

### Integration Points
- `.github/workflows/docker-publish.yml` — needs a `test` job added as prerequisite to `build-and-push`
- `Dockerfile` or `docker-entrypoint.sh` — needs `npx payload migrate` before `node server.js`
- Watchtower on Droplet — needs GHCR credentials (GitHub token or PAT with `read:packages` scope)

</code_context>

<specifics>
## Specific Ideas

- The test job in CI needs `postgis/postgis` (not plain postgres) as the service image to support PostGIS
- Watchtower GHCR auth: provide a `~/.docker/config.json` on the Droplet with GHCR credentials, or pass via Watchtower `REPO_USER`/`REPO_PASS` env vars

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-production-refinement*
*Context gathered: 2026-03-18*

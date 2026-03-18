# Phase 7: Production Refinement - Research

**Researched:** 2026-03-18
**Domain:** GitHub Actions CI, Watchtower GHCR auth, Payload migrate entrypoint, Vitest access-control test extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Watchtower is already running on the Droplet — just needs GHCR authentication configured so it can pull private images
- Container startup should auto-run `payload migrate` before starting the app
- Standard docker-compose setup on the Droplet — no special infrastructure changes needed
- No additional deployment workflow needed in CI — Watchtower polls GHCR automatically
- Add a test job to `docker-publish.yml` that runs BEFORE the build-and-push job
- Test job spins up postgres + postgis as a GitHub Actions service container
- Test job runs `npm run test` (integration suite)
- Build job depends on test job — no push if tests fail
- Extend existing `tests/int/api.int.spec.ts` — do NOT create a new file
- Add the following collections to the existing parameterized access control loop: `nitf_trips`, `nitf_destinations`, `nitf_places`, `rotr_days`
- Pattern: create draft + published, query unauthenticated (overrideAccess: false), assert only published returned
- No new down() tests — user considers them low-value
- Existing Phase 3–6 down() tests stay as-is (not removed)
- Phase 1 down() intentionally throws (clean-slate, no rollback) — this is acceptable, no test needed
- Seed scripts in `scripts/` are for local development only — no production seeding
- Production data is entered via the admin UI
- No changes to scripts/ directory needed

### Claude's Discretion
- Exact GitHub Actions service container configuration for postgres + postgis
- Whether to use a separate workflow file or add a job to existing docker-publish.yml
- GHCR Watchtower auth mechanism (Docker config secret vs. environment variable)
- Exact `payload migrate` entrypoint implementation (shell script, Dockerfile CMD override, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Integration tests verify access control changes (admin sees drafts, anon sees published only) | Extend existing parameterized loop in `api.int.spec.ts` to include `nitf_trips`, `nitf_destinations`, `nitf_places`, `rotr_days` |
| TEST-02 | Integration tests verify all bidirectional relationships | Already complete (Phase 3–5); nothing new for Phase 7 |
| TEST-03 | Integration tests verify PostGIS spatial queries on all geo collections | Already complete (Phase 2); nothing new for Phase 7 |
| TEST-04 | TypeScript types regenerated after each schema change | No new schema changes in Phase 7; `payload-types.ts` is current from Phase 6 |
| TEST-05 | All migrations have tested `down()` rollback functions | User confirmed: no new down() tests; existing Phase 2–6 tests satisfy this |
</phase_requirements>

---

## Summary

Phase 7 is a hardening and delivery phase — no new collections, no new schema, no new migrations. The work falls into three distinct areas:

**Area 1 — Access control tests (TEST-01):** The existing `tests/int/api.int.spec.ts` has two parameterized access control loops. Both currently cover `jr_posts`, `nitf_posts`, and `rotr_days`. The `nitf_trips`, `nitf_destinations`, and `nitf_places` collections were added in Phase 5 and use the `published` access helper but are not yet in the test loops. Adding them to both loops is the only code change in the test suite.

**Area 2 — CI pipeline:** The existing `.github/workflows/docker-publish.yml` has a single job (`build-and-push`). A `test` job must be added that runs before `build-and-push` using the `needs:` dependency. The test job requires `postgis/postgis` (not plain postgres) as a service container because integration tests use PostGIS functions. The `DATABASE_URL` for the service must be passed as an env var. The `build-and-push` job already uses `npm run test`-compatible tooling.

**Area 3 — Production deployment:** The Dockerfile's final CMD runs `node server.js` directly. To auto-run migrations on startup, this must become a two-step command: `npx payload migrate && node server.js`. The safest implementation is a shell entrypoint script (`docker-entrypoint.sh`) that the Dockerfile calls. Watchtower needs GHCR credentials on the Droplet — either via `~/.docker/config.json` or Watchtower `REPO_USER`/`REPO_PASS` env vars.

**Primary recommendation:** Add 3 collections to both access control loops in `api.int.spec.ts`, add a `test` job to `docker-publish.yml` with `postgis/postgis` service, and update the Dockerfile CMD to run migrations before starting the server. Use a shell entrypoint script for the migration step to keep the Dockerfile readable.

---

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Vitest | 4.0.18 (already installed) | Integration test runner | Already used project-wide; `fileParallelism: false` set in `vitest.config.mts` |
| GitHub Actions | N/A | CI pipeline | Already in use (`docker-publish.yml`) |
| `postgis/postgis` Docker image | `latest` or `16-3.5` | Service container with PostGIS | Required for PostGIS extension; plain `postgres` image lacks it |
| Watchtower | Already running on Droplet | Auto-pull updated images | Already deployed; just needs GHCR creds |
| `payload migrate` | Payload v3 CLI (3.78.0) | Run pending DB migrations | Official Payload command; `npm run payload:migrate` already exists in package.json |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `docker/login-action@v3` | Authenticate to GHCR | Already used in `build-and-push` job; test job does NOT need it |
| `actions/setup-node@v4` | Set up Node 22 for test job | Standard for npm-based CI jobs |
| `actions/checkout@v4` | Checkout code | Already used in `build-and-push`; repeat in test job |

---

## Architecture Patterns

### Pattern 1: GitHub Actions `needs:` dependency chain

**What:** One job that must pass before another job runs. The `build-and-push` job adds `needs: test` so it only runs if the `test` job exits 0.

**When to use:** When a gating check (tests) must block a publish step.

```yaml
# Source: GitHub Actions official docs
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.5
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test

  build-and-push:
    needs: test          # <-- gates on test success
    runs-on: ubuntu-latest
    # ... existing steps unchanged
```

**Key detail:** `postgis/postgis:16-3.5` matches Postgres 16 (most common). Use `16-3.5` tag for reproducibility rather than `latest`. The `ports:` mapping (`5432:5432`) is required for the test runner on the host to reach the service container.

**Key detail:** The `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` env var currently on `build-and-push` is NOT needed on the test job (it suppresses an Actions deprecation warning for Docker steps, not Node steps).

### Pattern 2: `postgis/postgis` service container health check

**What:** Service containers in GitHub Actions do not wait for readiness by default. The `options` block uses Docker's `--health-cmd` to poll `pg_isready`. The job's steps only start after all services report healthy.

```yaml
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

**Why not plain `postgres` image:** The integration tests run PostGIS spatial queries (e.g., `ST_DWithin`, `ST_MakePoint`). The plain Postgres image does not have PostGIS installed. Tests will fail at migration time if PostGIS extension is absent.

### Pattern 3: Migration-before-start entrypoint

**What:** Replace the bare `node server.js` CMD with a shell script that runs `npx payload migrate` first, then hands off to `node server.js`.

**Recommended implementation** (shell entrypoint, referenced from Dockerfile):

```dockerfile
# Add to Dockerfile, after USER nextjs line:
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
CMD ["sh", "docker-entrypoint.sh"]
```

```bash
#!/bin/sh
# docker-entrypoint.sh
set -e
echo "Running Payload migrations..."
NODE_OPTIONS=--no-deprecation npx payload migrate
echo "Migrations complete. Starting server..."
exec node server.js
```

**Why a shell script, not inline CMD:** Keeps the Dockerfile readable; the `exec` call ensures `node server.js` becomes PID 1 (receives signals correctly for graceful shutdown). `set -e` ensures a failed migration aborts startup instead of running a broken server.

**`NODE_OPTIONS=--no-deprecation` is required** — the project's `payload:migrate` npm script sets this; the entrypoint must replicate it or use `npm run payload:migrate` instead of calling `npx payload migrate` directly.

**Alternative: use npm script directly:**

```bash
#!/bin/sh
set -e
npm run payload:migrate
exec node server.js
```

This is simpler because `npm run payload:migrate` already has `cross-env NODE_OPTIONS=--no-deprecation`. However, `npm` is available in the standalone output image (node:22-slim base includes it), so either approach works. The `npm run` approach is recommended for consistency with local tooling.

**Important constraint:** The Dockerfile uses Next.js standalone output. The `npx payload migrate` command must have access to the built migration files. Check that `COPY --from=builder` includes the migrations directory — if migrations are in `src/migrations/` and the standalone output does not copy them, the CMD will fail.

Verify: does `.next/standalone` include `src/migrations/`? The standalone trace typically includes only files required to run the server. Payload migrations are loaded at runtime via the config. **If migrations are not in the standalone output, they must be explicitly copied in the Dockerfile.**

### Pattern 4: Extend existing parameterized test loop

**What:** The `api.int.spec.ts` file has two `for (const slug of ...)` loops. Both must receive the three new collection slugs.

**Existing loop 1** (line 32) — `collections` array in "authenticated admin sees drafts":
```typescript
const collections = ['jr_posts', 'nitf_posts', 'nitf_trails', 'rotr_days'] as const
```
Extend to include: `'nitf_trips'`, `'nitf_destinations'`, `'nitf_places'`

**Existing loop 2** (line 105) — `publishedCollections` array in "unauthenticated reads only see published":
```typescript
const publishedCollections = ['jr_posts', 'nitf_posts', 'rotr_days'] as const
```
Extend to include: `'nitf_trips'`, `'nitf_destinations'`, `'nitf_places'`

**Required data shape per collection** (confirmed from collection schemas):

| Collection | Required fields | Slug field? | Status field? | Special |
|------------|----------------|-------------|---------------|---------|
| `nitf_trips` | `title`, `status`, `slug` | yes | yes | none |
| `nitf_destinations` | `name`, `status`, `slug` | yes | yes | uses `name` not `title` |
| `nitf_places` | `title`, `status`, `slug` | yes | yes | none |

**Key difference for `nitf_destinations`:** The collection uses `name` as its primary field (`useAsTitle: 'name'`), not `title`. The existing test helper logic uses `title` for all collections. The loop helper will need a conditional for `nitf_destinations` (like the existing `isRotrDays` conditional handles `rotr_days`'s missing `slug`).

**Existing pattern for `rotr_days`** (which has no `slug` field):
```typescript
const isRotrDays = slug === 'rotr_days'
...(isRotrDays ? {} : { slug: `draft-${slug}-${Date.now()}` }),
...(isRotrDays ? {} : { body: 'draft content' }),
```

**New pattern needed for `nitf_destinations`** (which uses `name` not `title`):
```typescript
const isNitfDestinations = slug === 'nitf_destinations'
// Replace `title` with `name` for nitf_destinations
...(isNitfDestinations
  ? { name: `Draft ${slug} admin test` }
  : { title: `Draft ${slug} admin test` }),
```

### Pattern 5: Watchtower GHCR authentication

**What:** Watchtower needs credentials to pull from `ghcr.io` (a private registry). Two mechanisms:

**Option A — Docker config.json on Droplet (HIGH confidence, standard):**
```bash
# On the Droplet, as the user running docker-compose:
echo $GHCR_PAT | docker login ghcr.io -u <github-username> --password-stdin
# This writes credentials to ~/.docker/config.json
# Watchtower reads this file automatically
```
Watchtower mounts the host's Docker socket and reads the host's Docker config by default. No Watchtower configuration change needed.

**Option B — Watchtower environment variables:**
```yaml
# In docker-compose.yml on Droplet
environment:
  - REPO_USER=<github-username>
  - REPO_PASS=<PAT with read:packages scope>
```
This is per-registry credentials in the Watchtower container. Works if Watchtower is already configured in docker-compose.yml.

**Recommendation: Option A.** It is the idiomatic Docker credential approach and requires zero changes to the Watchtower container config. The PAT needs `read:packages` scope only.

### Anti-Patterns to Avoid

- **Running migrations with `npx payload migrate:fresh`** in production: drops all data. Use `payload migrate` only.
- **Using plain `postgres` image** in CI service container: missing PostGIS extension; integration tests will fail at migration time with "extension postgis does not exist."
- **Putting `DATABASE_URL` secret in docker-publish.yml** for the test job: use `localhost` with the service container's mapped port — no secret required for test runs.
- **Skipping `exec` in entrypoint script**: without `exec`, `node` runs as a child of `sh`, signal handling (SIGTERM for graceful shutdown) is broken.
- **Creating a new test file for Phase 7 access control tests**: the CONTEXT.md is explicit — extend `api.int.spec.ts` only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Postgres readiness in CI | Custom polling loop | Docker `--health-cmd pg_isready` in `options:` | Built-in to GitHub Actions service containers; job steps wait for healthy status automatically |
| GHCR login in test job | Custom curl/auth logic | `docker login` on Droplet OR Watchtower env vars | Standard Docker credential flow; test job itself does NOT need registry auth |
| Migration runner in entrypoint | Custom SQL execution script | `npm run payload:migrate` (or `npx payload migrate`) | Official Payload CLI handles migration ordering, state tracking, and idempotency |
| Access control test assertions | New test file | Extend existing parameterized loop in `api.int.spec.ts` | Pattern is already established and working; duplication creates maintenance burden |

---

## Common Pitfalls

### Pitfall 1: `nitf_destinations` uses `name` not `title`

**What goes wrong:** The existing test loop creates docs with `{ title: 'Draft ...' }`. `NitfDestinations` has no `title` field — its primary text field is `name`. Payload will accept the create call but the `name` will be undefined, which may cause `useAsTitle` to render blank in admin, and any assertion on `title` field will be null.

**How to avoid:** Add an `isNitfDestinations` conditional (same pattern as existing `isRotrDays` conditional) to substitute `name` for `title` in the create data.

### Pitfall 2: Standalone Next.js output may not include migration files

**What goes wrong:** The Dockerfile uses `output: 'standalone'` (implied by the existing Dockerfile comment). The standalone trace only copies files that Next.js determines are needed to serve routes. Payload migration files are dynamically loaded at runtime by the Payload config — Next.js static analysis may not trace them.

**How to avoid:** After adding the entrypoint that calls `payload migrate`, test the container locally with `docker build && docker run`. If migrations fail with "Cannot find module" errors, add an explicit COPY step:
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/src/migrations ./src/migrations
```

**Warning signs:** `payload migrate` exits with module resolution errors for migration files.

### Pitfall 3: `postgis/postgis` image tag vs. database name

**What goes wrong:** Using `image: postgis/postgis` without a tag pulls `latest` which may be Postgres 17 with different behavior. More importantly, the `POSTGRES_DB` env var must be set — without it, the default database name is `postgres` which may conflict with other service configuration assumptions.

**How to avoid:** Use a pinned tag like `postgis/postgis:16-3.5`. Set `POSTGRES_DB: basecamp_test` (or any name) and use that in `DATABASE_URL`.

### Pitfall 4: `npm ci` in CI test job needs `.npmrc` and lockfile

**What goes wrong:** The project uses npm (not pnpm in CI despite `package.json` having `engines.pnpm`). The Dockerfile uses `npm ci` successfully. The CI test job should do the same. If pnpm is expected, the job needs `corepack enable` first.

**How to avoid:** Match the Dockerfile's approach — use `npm ci`. The `package-lock.json` is present (Dockerfile COPYs it). Use `npm ci` in the CI test job, not `pnpm install`.

### Pitfall 5: Watchtower PAT scope

**What goes wrong:** Using a PAT with `write:packages` scope when only `read:packages` is needed. Overly permissioned tokens are a security risk.

**How to avoid:** Create a PAT with only `read:packages` scope for Watchtower on the Droplet.

---

## Code Examples

### Extending the parameterized test loop (TEST-01)

```typescript
// In tests/int/api.int.spec.ts — describe 'Access control — authenticated admin sees drafts'
// Current: ['jr_posts', 'nitf_posts', 'nitf_trails', 'rotr_days']
// New:
const collections = [
  'jr_posts', 'nitf_posts', 'nitf_trails', 'rotr_days',
  'nitf_trips', 'nitf_destinations', 'nitf_places',
] as const

// In the loop body, add conditions:
const isRotrDays = slug === 'rotr_days'
const isNitfDestinations = slug === 'nitf_destinations'

// Replace the title/name field:
...(isNitfDestinations
  ? { name: `Draft ${slug} admin test` }
  : { title: `Draft ${slug} admin test` }),
// slug is present on all 3 new collections
...(isRotrDays ? {} : { slug: `draft-admin-${slug}-${Date.now()}` }),
// body: nitf_destinations has no body field; nitf_trips and nitf_places have body
...(isRotrDays || isNitfDestinations ? {} : { body: 'draft content' }),
```

### GitHub Actions service container — complete test job

```yaml
# .github/workflows/docker-publish.yml — test job to add before build-and-push
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.5
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: basecamp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/basecamp_test
      PAYLOAD_SECRET: ci-test-secret-not-used-at-runtime
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test
```

### Dockerfile entrypoint addition

```dockerfile
# At builder stage — copy entrypoint (or create inline)
# At runner stage, after COPY --from=builder lines:
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./

# CMD change:
CMD ["sh", "docker-entrypoint.sh"]
```

```bash
#!/bin/sh
# docker-entrypoint.sh (place in repo root)
set -e
echo "Running database migrations..."
npm run payload:migrate
echo "Starting server..."
exec node server.js
```

### Watchtower GHCR auth (on Droplet)

```bash
# One-time setup on Droplet — creates ~/.docker/config.json
echo "<GHCR_PAT>" | docker login ghcr.io -u <github-username> --password-stdin
# Watchtower reads this automatically via the Docker socket mount
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual `docker pull && docker-compose up -d` for deployments | Watchtower polling GHCR automatically | Zero-touch deploys on every push to master |
| Tests only run locally | Tests gate CI push | Broken code cannot reach GHCR |
| Container starts without running migrations | Entrypoint runs `payload migrate` first | New schema changes applied automatically on container restart |

---

## Open Questions

1. **Does Next.js standalone output include `src/migrations/`?**
   - What we know: The Dockerfile uses standalone output. Migration files are in `src/migrations/`. Payload loads them via dynamic import at runtime.
   - What's unclear: Whether Next.js traces these files or if they must be explicitly copied.
   - Recommendation: Test locally with `docker build && docker run` before deploying. If migrations fail, add `COPY --from=builder --chown=nextjs:nodejs /app/src/migrations ./src/migrations` to the runner stage.

2. **`nitf_destinations` body/description field name in test create data**
   - What we know: `NitfDestinations` has a `description` field (not `body`). The loop currently spreads `{ body: 'draft content' }` for non-rotr_days collections.
   - What's unclear: Whether omitting `description` causes a create failure (it's not required).
   - Recommendation: Simply omit the body/description spread for `nitf_destinations` (same pattern as `isRotrDays` omits `body`). Description is not required.

3. **`PAYLOAD_SECRET` env var in CI test job**
   - What we know: Payload requires `PAYLOAD_SECRET` to initialize. The build job passes a placeholder (`build-secret-not-used-at-runtime`) as a build arg.
   - What's unclear: Whether the test job needs `PAYLOAD_SECRET` set as an env var for `getPayload()` to initialize.
   - Recommendation: Set `PAYLOAD_SECRET: ci-test-secret-not-used-at-runtime` in the test job's `env:` block. This matches the existing build-job pattern and requires no new GitHub secret.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.mts` (project root) |
| Quick run command | `npm run test:int` |
| Full suite command | `npm run test` (alias for `test:int`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | `nitf_trips`, `nitf_destinations`, `nitf_places` hidden from anon when draft; visible when published | integration | `npm run test -- --reporter=verbose` | ✅ `tests/int/api.int.spec.ts` (extend existing loops) |
| TEST-02 | Bidirectional relationships work | integration | `npm run test` | ✅ Already passing in Phase 5 |
| TEST-03 | PostGIS spatial queries on all geo collections | integration | `npm run test` | ✅ Already passing in Phase 2 |
| TEST-04 | `payload-types.ts` current | type check | `npx tsc --noEmit` | ✅ Current from Phase 6; no new schema changes |
| TEST-05 | Migration down() functions tested | integration | `npm run test` | ✅ Already passing in Phases 3–6 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. No new test files needed. Phase 7 extends `api.int.spec.ts` only, which already exists.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection: `tests/int/api.int.spec.ts`, `src/collections/nerdintheforest/NitfTrips.ts`, `NitfDestinations.ts`, `NitfPlaces.ts`, `src/collections/reddyontheroad/RotrDays.ts`, `Dockerfile`, `.github/workflows/docker-publish.yml`, `vitest.config.mts`, `package.json`
- GitHub Actions official docs (service containers): confirmed `--health-cmd pg_isready` pattern is standard
- `postgis/postgis` Docker Hub: confirmed `16-3.5` tag is available and recommended
- Payload v3 docs: `payload migrate` is the correct CLI command; `npm run payload:migrate` is already in `package.json`
- Watchtower docs: confirmed `~/.docker/config.json` is read automatically via Docker socket mount

### Secondary (MEDIUM confidence)
- Next.js standalone output behavior: based on Next.js documentation pattern for standalone output + known behavior of `output: 'standalone'` — migration files may not be auto-traced
- Watchtower `REPO_USER`/`REPO_PASS` env vars: documented in Watchtower README on GitHub

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already present in the project; versions confirmed from `package.json`
- Architecture: HIGH — patterns derived from direct codebase inspection and existing working CI workflow
- Pitfalls: HIGH (most critical ones) / MEDIUM (standalone output tracing) — the standalone output question is a known unknown that requires local validation
- Test extension: HIGH — exact field shapes confirmed from collection schemas

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable tooling; CI/Watchtower patterns are stable)

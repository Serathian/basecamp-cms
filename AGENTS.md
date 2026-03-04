# AGENTS.md — basecamp-cms

Payload CMS v3 serving three personal domains from a single DigitalOcean Droplet.
Content originates in an Obsidian vault and will be pushed via a future GitHub Action.
Frontends read from the CMS REST API. No manual data entry is expected in normal operation.

---

## Repository

| Item | Value |
|---|---|
| GitHub | `github.com/Serathian/basecamp-cms` |
| Docker image | `ghcr.io/Serathian/basecamp:latest` (built by CI on push to `master`) |
| Branch | `master` |
| Local dev | `http://localhost:3000` |
| Production admin | `https://cms.jake-reddy.com/admin` |
| Database | PostgreSQL 16 + PostGIS 3.4 |

## Current status

**Tests: 11/11 passing** (`npx vitest run`)

All three migrations are applied to the local dev database:

| Migration | Purpose |
|---|---|
| `20260303_172001` | Full schema — all tables, enums, indexes |
| `20260303_212719` | `users_roles` join table + `enum_users_roles` |
| `20260303_214307_add_postgis` | PostGIS extension + `geom` column on `nitf_posts` |

---

## Collections

All 12 collections are defined and registered in `src/payload.config.ts`.

| Slug | Domain | Public read |
|---|---|---|
| `users` | — | No (auth collection) |
| `media` | — | Yes |
| `authors` | shared | Yes (`read: () => true`) |
| `tags` | shared | Yes (`read: () => true`) |
| `jr_posts` | jake-reddy.com | Published only for unauthenticated |
| `jr_projects` | jake-reddy.com | Published only for unauthenticated |
| `nitf_posts` | nerdintheforest.com | Published only for unauthenticated |
| `nitf_trails` | nerdintheforest.com | Published only for unauthenticated |
| `nitf_waypoints` | nerdintheforest.com | Yes (`read: () => true`) |
| `nitf_locations` | nerdintheforest.com | Yes (`read: () => true`) |
| `rotr_posts` | reddyontheroad.com | Published only for unauthenticated |
| `rotr_locations` | reddyontheroad.com | Yes (`read: () => true`) |

## Access control helpers

`src/collections/users/access/`

| File | Exported as | Behaviour |
|---|---|---|
| `anyone.ts` | `{ anyone }` | `() => true` — always permits |
| `editor.ts` | default `editor` | `true` for admin/editor role; `false` otherwise |
| `user.ts` | default `user` | admin/editor → `true`; regular user → `{ id: { equals: user.id } }`; anon → `false` |
| `admin.ts` | default `admin` | `true` for admin role only |
| `checkrole.ts` | `{ checkRole }` | boolean helper used by the above |

---

## Known issues

### 1 — Access control: `anyone()` misuse (semantic bug, tests still pass)

Five content collections currently use this pattern:

```typescript
import { anyone } from '../users/access/anyone'

access: {
  read: () => {
    if (anyone()) return { status: { equals: 'published' } }
    return true  // ← dead code — anyone() is always true
  },
```

`anyone()` returns `true` unconditionally, so `return true` is never reached.
**Effect:** Even authenticated admin/editor users only see published documents in the
admin panel. Drafts are invisible to everyone.

The tests pass because they only verify that unauthenticated reads are filtered to
published — they do not verify that authenticated users can read drafts.

**Fix — create `src/collections/users/access/published.ts`:**

```typescript
const published = ({ req: { user } }: any) => {
  if (!user) return { status: { equals: 'published' } }
  return true
}
export default published
```

Then in each affected collection replace:

```typescript
import { anyone } from '../users/access/anyone'
// ...
read: () => {
  if (anyone()) return { status: { equals: 'published' } }
  return true
},
```

with:

```typescript
import published from '../users/access/published'
// ...
read: published,
```

**Affected files (5):**
- `src/collections/jake-reddy/JrPosts.ts`
- `src/collections/jake-reddy/JrProjects.ts`
- `src/collections/nerdintheforest/NitfPosts.ts`
- `src/collections/nerdintheforest/NitfTrails.ts`
- `src/collections/reddyontheroad/RotrPosts.ts`

After the fix, also add a test case in `tests/int/api.int.spec.ts` that verifies
authenticated users (`overrideAccess: false, user: adminUser`) can retrieve draft documents.

---

### 2 — PostGIS `geom` not auto-populated on insert

The `geom` column on `nitf_posts` is a plain `geometry(Point, 4326)` column, not a
`GENERATED ALWAYS AS` column. The migration populates existing rows via `UPDATE`, but rows
inserted after the migration run (including test fixtures) leave `geom = NULL` unless
explicitly set.

**Effect:** The `/nearby` endpoint filters `WHERE geom IS NOT NULL`, so newly saved posts
with `latitude`/`longitude` do not appear in spatial search. The spatial test currently
passes with 0 results — it has a `console.warn` guard and does not fail on empty results.

**Fix — add an `afterChange` hook to `NitfPosts.ts`:**

```typescript
import { sql } from '@payloadcms/db-postgres'

hooks: {
  afterChange: [
    async ({ doc, req }: any) => {
      if (doc.latitude != null && doc.longitude != null) {
        const db = (req.payload.db as any).drizzle
        await db.execute(sql`
          UPDATE nitf_posts
          SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
          WHERE id = ${doc.id}
        `)
      }
      return doc
    },
  ],
},
```

After implementing, update the spatial test to remove the early-exit guard on 0 results
and actually assert distance ordering.

---

### 3 — PostGIS: only `nitf_posts` has `geom`

The migration `down()` references six geo tables, but `up()` only adds `geom` to one.
The `geoTables` array in `src/migrations/20260303_214307_add_postgis.ts` needs five more
entries:

| Table | lat col | lon col |
|---|---|---|
| `nitf_trails` | `latitude_start` | `longitude_start` |
| `nitf_waypoints` | `latitude` | `longitude` |
| `nitf_locations` | `latitude` | `longitude` |
| `rotr_posts` | `latitude` | `longitude` |
| `rotr_locations` | `latitude` | `longitude` |

All migration statements already use `IF NOT EXISTS` so the migration is safe to re-run.
After editing, run `npx payload migrate` (or `migrate:down` then `migrate` for a fresh apply).

---

## Remaining work (priority order)

### P1 — Fix access control (issue 1 above)

Create `published.ts` helper and update the five content collections.
This makes draft content visible to admin/editor users in the admin panel.

### P2 — Auto-populate `geom` on insert (issue 2 above)

Add the `afterChange` hook so spatial queries work for newly created posts.
Update the spatial test to assert ordering once results are reliably present.

### P3 — Extend PostGIS to remaining tables (issue 3 above)

Add five entries to the `geoTables` array and re-apply the migration.

### P4 — Obsidian → CMS pipeline

The Obsidian vault lives at `../Obsidian/` (within the `droplet-stack` mono-repo).
Vault structure relevant to CMS ingestion:

```
01_Diary/     — daily entries; frontmatter: date, location: "lat, lon", markertype
02_Trips/     — compiled trip summaries linking multiple diary entries
04_Projects/  — jr_projects source material
```

A GitHub Action (`obsidian-sync.yml`) should:
1. Trigger on push to the vault (or workflow dispatch)
2. Parse changed `.md` files, extract frontmatter fields
3. Upsert `nitf_locations` for each GPS stop
4. Create/update `nitf_posts` with the `locations[]` array
5. Write the returned `id` back to frontmatter as `cms_id` (commit to vault)

Auth: `cms-writer` API key stored as a GitHub Actions secret.
CMS endpoint: `POST https://cms.jake-reddy.com/api/nitf_posts`

### P5 — Production deploy

Prerequisites: CI green, DNS `cms.jake-reddy.com → <droplet IP>` added.

```bash
# On the Droplet (inside droplet-compose dir)
git pull
docker compose pull cms cms-db
docker compose up -d cms-db cms
docker compose exec cms npx payload migrate
```

Visit `https://cms.jake-reddy.com/admin` on first run to create the admin user.

Required `.env` entries on Droplet:

```
PAYLOAD_SECRET=<openssl rand -hex 32>
CMS_DB_NAME=payload
CMS_DB_USER=payload
CMS_DB_PASSWORD=<strong-random>
GITHUB_OWNER=Serathian
```

### P6 — Connect frontends to live API

The `jake-reddy.com` Next.js frontend (`../jake-reddy.com/`) uses mock data in `src/data/`.
Replace with calls to `https://cms.jake-reddy.com/api/<slug>`.

After any schema change regenerate shared TypeScript types:

```bash
npx payload generate:types
# → src/payload-types.ts (import from this in all three frontends)
```

---

## Local dev setup

```bash
# 1. Start PostGIS
docker compose up -d postgres

# 2. Configure env
cp .env.local.example .env.local
# DATABASE_URL is pre-set to postgresql://payload:payload@localhost:5432/payload

# 3. Apply migrations (first time, or after adding new migrations)
npx payload migrate

# 4. Dev server
npm run dev   # → http://localhost:3000/admin

# 5. Run tests
npx vitest run

# 6. Type check
npx tsc --noEmit
# Expected: zero errors from src/ (layout.tsx has a Payload framework error — safe to ignore)

# 7. Regenerate types after schema changes
npx payload generate:types
```

## Key files

| File | What it does |
|---|---|
| `src/payload.config.ts` | Root config — all collections registered, `push: false` on DB adapter |
| `src/collections/users/access/` | RBAC helpers consumed by all collections |
| `src/lib/nearby.ts` | PostGIS spatial query shared between `/nearby` endpoint and tests |
| `src/migrations/20260303_214307_add_postgis.ts` | PostGIS `geom` column — extend `geoTables` array for P3 |
| `tests/int/api.int.spec.ts` | Vitest integration tests |
| `docker-compose.yml` | Local dev: Payload dev server + PostGIS |
| `Dockerfile` | Multi-stage production build (node:22-alpine, non-root `nextjs` user) |
| `.github/workflows/docker-publish.yml` | CI: build + push to `ghcr.io/Serathian/basecamp` on push to `master` |

## Important constraints

- **`push: false`** on the postgres adapter — Drizzle never auto-syncs schema. Every schema
  change needs a migration: `npx payload migrate:create` then `npx payload migrate`.
- **`geom` is not tracked by Drizzle** — it is added outside Drizzle's schema via raw SQL in
  the PostGIS migration. Any `push: true` or schema reset would drop it.
- **Do not run `npx payload migrate:fresh`** in production — it drops all tables.

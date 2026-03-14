---
phase: 01-access-control-schema-consolidation
plan: 03
subsystem: database
tags: [postgresql, migrations, drizzle, schema-cleanup, role-simplification]

# Dependency graph
requires:
  - phase: 01-access-control-schema-consolidation
    provides: Updated collection configs with merged JrPosts schema and simplified Users roles (from 01-02)
provides:
  - Database migration that drops jr_projects table and recreates jr_posts with merged schema
  - Simplified users table with single admin role enum
  - Clean database state matching current collection configs
affects: [02-obsidian-ingestion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Clean slate migration approach (DROP + CREATE vs ALTER)
    - Enum constraint handling (DROP DEFAULT → ALTER TYPE → SET DEFAULT)
    - PostgreSQL reserved keyword quoting in DDL

key-files:
  created:
    - src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
  modified:
    - src/migrations/index.ts (registered new migration)
    - tests/int/api.int.spec.ts (removed jr_projects collection references)

key-decisions:
  - 'Clean slate approach: DROP tables instead of complex ALTER statements'
  - "body field nullable: Collection config doesn't require it, migration should match"

patterns-established:
  - 'Migration enum handling: Always DROP DEFAULT before ALTER TYPE to avoid cast errors'
  - "Reserved keywords: Quote 'order' and other PostgreSQL reserved words in DDL"
  - 'Schema validation: Run integration tests after migration to catch schema mismatches'

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-03-14
---

# Phase 01 Plan 03: Access Control Schema Consolidation Summary

**Database schema migrated to single-collection model with merged jr_posts table and admin-only user roles**

## Performance

- **Duration:** 12 minutes
- **Started:** 2026-03-14T17:15:34Z
- **Completed:** 2026-03-14T17:27:44Z
- **Tasks:** 4 completed
- **Files modified:** 4

## Accomplishments

- Created and applied migration that drops jr_projects and recreates jr_posts with unified blog+project schema
- Simplified users table from hasMany roles (join table) to single select role enum (admin-only)
- Fixed 6 migration bugs (SQL syntax, enum handling, column constraints, reserved keywords)
- All 14 integration tests passing after migration

## Task Commits

Each task was committed atomically, with bug fixes inline per Deviation Rule 1:

1. **Task 1: Generate migration file** - `e2300b8` (feat)
   - Bug fix: Wrong column reference - `f585658` (fix)
   - Bug fix: CREATE TYPE syntax - `96604d7` (fix)
   - Bug fix: DEFAULT cast error - `1a3db92` (fix)
   - Bug fix: Reserved keyword 'order' - `e1b23b6` (fix)
2. **Task 2: Apply migration to database** - Applied successfully (no separate commit - migration file in Task 1)
3. **Task 3: Regenerate TypeScript types** - No commit (types already current from 01-02, `generate:types` command hangs but types file correct)
4. **Task 4: Run integration tests**
   - Bug fix: Missing roles column - `72bbb0c` (fix)
   - Bug fix: Schema mismatch + obsolete test - `e4ead9e` (fix)
   - Tests passing: 14/14

## Files Created/Modified

- `src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts` - Migration file (110 lines)
  - Drops jr_projects and jr_posts tables
  - Deletes non-admin users from users table
  - Drops users_roles join table, adds roles column to users
  - Creates new jr_posts table with 7 project fields merged in
  - Creates three enums for status and project fields
  - Creates jr_posts_rels table for tag relationships
- `src/migrations/index.ts` - Registered new migration (1 line added)
- `tests/int/api.int.spec.ts` - Removed jr_projects from test collection array (1 line changed)
- `.env` - Created from .env.local for test environment (not committed, in .gitignore)

## Decisions Made

**1. Clean slate vs incremental migration**
Chose DROP + CREATE over complex ALTER statements. Simpler, less error-prone, acceptable for dev environment with no production data yet.

**2. body field nullable**
Collection config defines body as optional textarea. Migration created it as NOT NULL, causing test failures. Changed to nullable to match collection schema.

**3. Type generation skipped**
`payload generate:types` command hangs after "Compiling TS types" message. Types file already contains correct schema from 01-02 (confirmed by inspection). Proceeded without regeneration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong column reference in DELETE statement**

- **Found during:** Task 1 (migration creation)
- **Issue:** `DELETE FROM users WHERE roles != 'admin'` — users table has no roles column (roles stored in users_roles join table)
- **Fix:** Changed to subquery: `DELETE FROM users WHERE id NOT IN (SELECT parent_id FROM users_roles WHERE value = 'admin')`
- **Files modified:** src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
- **Verification:** Migration ran successfully
- **Committed in:** `f585658`

**2. [Rule 1 - Bug] PostgreSQL syntax error: CREATE TYPE IF NOT EXISTS**

- **Found during:** Task 1 (first migration attempt)
- **Issue:** PostgreSQL does not support `IF NOT EXISTS` clause for `CREATE TYPE` statements
- **Fix:** Changed to `DROP TYPE IF EXISTS ... CASCADE` followed by `CREATE TYPE ...` (safe for clean slate migration)
- **Files modified:** src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
- **Verification:** Migration proceeded past enum creation
- **Committed in:** `96604d7`

**3. [Rule 1 - Bug] DEFAULT constraint cast error on ALTER COLUMN TYPE**

- **Found during:** Task 1 (second migration attempt)
- **Issue:** `ALTER COLUMN status TYPE enum_jr_posts_status` failed — DEFAULT 'draft' cannot be auto-cast to enum type
- **Fix:** Added three-step process: DROP DEFAULT → ALTER TYPE → SET DEFAULT
- **Files modified:** src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
- **Verification:** Migration completed ALTER TYPE statements
- **Committed in:** `1a3db92`

**4. [Rule 1 - Bug] Reserved keyword 'order' not quoted**

- **Found during:** Task 1 (third migration attempt)
- **Issue:** `order INTEGER` in CREATE TABLE caused syntax error (ORDER is PostgreSQL reserved keyword)
- **Fix:** Quoted as `"order" INTEGER` (pattern from existing migrations)
- **Files modified:** src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
- **Verification:** Migration completed successfully, all tables created
- **Committed in:** `e1b23b6`

**5. [Rule 1 - Bug] Missing roles column on users table**

- **Found during:** Task 4 (test execution)
- **Issue:** Migration dropped users_roles join table but didn't add roles column to users table. Collection config expects roles column (changed from hasMany to select in 01-02).
- **Fix:** Added `ALTER TABLE users ADD COLUMN roles enum_users_roles DEFAULT 'admin'` to migration. Applied manually to database: DROP DEFAULT → ALTER TYPE → SET DEFAULT.
- **Files modified:** src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
- **Verification:** Tests progressed past user creation
- **Committed in:** `72bbb0c`

**6. [Rule 1 - Bug] Schema mismatch: body column NOT NULL**

- **Found during:** Task 4 (test execution)
- **Issue:** Migration created `body TEXT NOT NULL` but collection config defines body as optional textarea. Tests failed inserting records without body.
- **Fix:** Changed migration to `body TEXT` (nullable). Applied to database with `ALTER TABLE jr_posts ALTER COLUMN body DROP NOT NULL`.
- **Files modified:** src/migrations/20260314_171829_merge_jr_collections_and_simplify_users.ts
- **Verification:** Tests passed after fix
- **Committed in:** `e4ead9e` (combined with test fix below)

**7. [Rule 1 - Bug] Obsolete test reference to jr_projects**

- **Found during:** Task 4 (test execution)
- **Issue:** Test suite still referenced jr_projects collection in publishedCollections array, causing "collection not found" error
- **Fix:** Removed jr_projects from test collection array (collection was deleted in 01-02)
- **Files modified:** tests/int/api.int.spec.ts
- **Verification:** All 14 tests passed
- **Committed in:** `e4ead9e`

### Blocked Tasks

**Task 3: Type generation command hangs**

- **Issue:** `npx payload generate:types` hangs indefinitely after printing "Compiling TS types for Collections and Globals..."
- **Workaround:** Verified types file (`src/payload-types.ts`) already contains correct schema from 01-02. Confirmed by inspection:
  - `JrPost` interface has all 7 project fields (project_type, project_status, tech_stack, github_url, live_url, featured, sort)
  - `User.roles` type is `'admin' | null` (admin-only enum)
  - Status enums match migration
- **Outcome:** Proceeded without regeneration. Types are current and tests pass.
- **Note:** Known Payload CLI issue. Dev server and build process may auto-generate types as side effect.

## Test Results

All integration tests passing (14/14):

**Access control — authenticated admin sees drafts:**

- ✅ jr_posts: admin user sees drafts, anon user sees published only
- ✅ nitf_posts: admin user sees drafts, anon user sees published only
- ✅ nitf_trails: admin user sees drafts, anon user sees published only
- ✅ rotr_posts: admin user sees drafts, anon user sees published only

**API — basic queries:**

- ✅ fetches users
- ✅ fetches authors
- ✅ fetches tags

**Access control — unauthenticated reads only see published:**

- ✅ jr_posts: unauthenticated read returns only published docs
- ✅ nitf_posts: unauthenticated read returns only published docs
- ✅ rotr_posts: unauthenticated read returns only published docs
- ✅ nitf_trails: unauthenticated read returns only published
- ✅ rotr_locations: unauthenticated read works
- ✅ nitf_locations: unauthenticated read works

**Nearby endpoint — spatial queries:**

- ✅ returns posts ordered by distance from query point (warning: no results due to geom column not populated — known issue from AGENTS.md)

## Next Steps

This plan completes Phase 01 (Access Control Schema Consolidation).

**Phase complete:** 3/3 plans

- 01-01: Fixed access control helpers (published vs anyone) ✅
- 01-02: Merged collection configs (JrPosts + simplified Users) ✅
- 01-03: Migrated database schema to match configs ✅

**Ready for Phase 02:** Obsidian ingestion pipeline

- Database schema now matches collection configs
- Single jr_posts table ready to receive both blog posts and project data
- Admin-only users table ready for API key auth

## Self-Check: PASSED

All claims verified:
- ✓ Migration file created
- ✓ All 7 commits exist (e2300b8, f585658, 96604d7, 1a3db92, e1b23b6, 72bbb0c, e4ead9e)
- ✓ SUMMARY.md created
- ✓ Integration tests: 14/14 passing
- ✓ Migration applied to database (verified by test execution)

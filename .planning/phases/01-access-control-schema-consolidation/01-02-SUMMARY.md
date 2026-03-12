---
phase: 01-access-control-schema-consolidation
plan: 02
subsystem: database
tags: [payload-cms, schema-consolidation, collection-merge, access-control, vitest]

# Dependency graph
requires:
  - phase: 01-access-control-schema-consolidation
    plan: 01
    provides: Fixed access control helpers (published.ts, admin.ts)
provides:
  - JrPosts collection with merged blog and project fields (7 project-specific fields added)
  - Users collection simplified to single admin role
  - JrProjects collection removed from config and codebase
  - Authenticated access control tests covering 4 collections
affects: [01-03-PLAN, 03-site-specific-media-tags, 06-tech-stack-collection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optional field pattern for unified collection schema
    - Single-role user authentication pattern
    - Authenticated test fixtures with user context

key-files:
  created: []
  modified:
    - src/collections/jake-reddy/JrPosts.ts
    - src/collections/users/Users.ts
    - src/payload.config.ts
    - tests/int/api.int.spec.ts
  deleted:
    - src/collections/jake-reddy/JrProjects.ts

key-decisions:
  - 'All project-specific fields are optional to support both blog posts and project showcase content'
  - 'Field ordering: metadata, content, media, project-specific, taxonomy, SEO'
  - 'Users collection uses single select (not hasMany) with only admin role option'
  - 'Authenticated tests exclude jr_projects since collection is removed'

patterns-established:
  - 'Optional fields pattern: Makes non-core fields optional to support multiple content types in unified collection'
  - 'Single-role simplification: Remove hasMany and role options when only one role exists'
  - 'Authenticated test pattern: Use user: adminUser in payload.find() to simulate authenticated requests'

requirements-completed: [ACCESS-05, SCHEMA-01, SCHEMA-02, SCHEMA-03, TEST-01]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase 1 Plan 02: Schema Consolidation Summary

**JrPosts unified with 7 project fields, Users simplified to admin-only, JrProjects removed, authenticated access tests added**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T19:37:03Z
- **Completed:** 2026-03-12T19:39:47Z
- **Tasks:** 4
- **Files modified:** 4 (1 deleted)

## Accomplishments

- JrPosts collection now supports both blog posts and project showcase with merged schema (7 project-specific optional fields)
- Users collection simplified to single admin role (removed hasMany, editor, and user options)
- JrProjects collection removed from payload config and file deleted
- Authenticated access control tests added verifying admin users can see drafts while anonymous users see published only

## Task Commits

Each task was committed atomically:

1. **Task 1: Merge JrProjects fields into JrPosts collection** - `aaf4233` (feat)
2. **Task 2: Simplify Users collection to single admin role** - `76c6c76` (feat)
3. **Task 3: Remove JrProjects from payload config and delete file** - `eb4cb1a` (feat)
4. **Task 4: Add authenticated access control tests** - `63c18e4` (test)

## Files Created/Modified

- `src/collections/jake-reddy/JrPosts.ts` - Added 7 project-specific fields (project_type, project_status, tech_stack, github_url, live_url, featured, sort), reorganized field order by logical grouping
- `src/collections/users/Users.ts` - Simplified to single admin role with defaultValue, removed hasMany and multi-role options
- `src/payload.config.ts` - Removed JrProjects import and collection registration
- `tests/int/api.int.spec.ts` - Added adminUser fixture, afterAll cleanup, and authenticated access test covering 4 collections
- `src/collections/jake-reddy/JrProjects.ts` - **DELETED** (merged into JrPosts)

## Decisions Made

1. **Optional project fields** - All 7 project-specific fields added without `required: true`, allowing posts without project data and projects without blog-specific data
2. **Field ordering** - Organized by logical groups: metadata, content, media, project-specific, taxonomy, SEO for better admin UI experience
3. **Single admin role** - Removed `hasMany: true` from Users.roles field since only one role exists, simplifying access control
4. **Test collection exclusion** - Authenticated tests exclude `jr_projects` since that collection is removed in this plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - schema changes applied cleanly, all verification checks passed.

## Next Phase Readiness

Schema preparation complete for migration. Next plan (01-03) will create and apply the migration to:

- Drop `jr_projects` table and relations
- Recreate `jr_posts` with merged schema
- Simplify `users` roles enum to admin-only
- Drop `users_roles` join table

**Note:** Tests will fail until migration runs (database schema doesn't match collection configs yet). This is expected behavior with `push: false` - schema changes require explicit migrations.

---

_Phase: 01-access-control-schema-consolidation_
_Completed: 2026-03-12_

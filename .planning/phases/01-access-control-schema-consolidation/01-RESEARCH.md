# Phase 1: Access Control & Schema Consolidation - Research

**Researched:** 2026-03-12
**Domain:** Payload CMS v3 access control, schema migrations, collection consolidation
**Confidence:** HIGH

## Summary

Phase 1 fixes a critical access control bug where admins cannot see draft content in the admin panel, and consolidates two Jake Reddy collections into one unified schema. The access control issue stems from a broken helper function that always returns `true`, making conditional draft filtering unreachable. The schema consolidation requires merging `jr_posts` and `jr_projects` fields into a single collection while preserving all functionality.

Payload CMS v3.78.0 provides robust patterns for both challenges: access control functions receive `req.user` for authentication checks, and the Drizzle-based migration system (with `push: false`) ensures explicit schema control. The existing test infrastructure (Vitest 4.0.18) covers API-level access control verification, matching the phase requirements perfectly.

**Primary recommendation:** Create a `published.ts` access helper that checks `req.user` presence, write a clean-slate migration that drops `jr_projects` and recreates `jr_posts` with merged schema, update all affected collections to use the new helper, and extend existing Vitest integration tests to verify authenticated admin access to drafts.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Merged Collection Behavior**

- All posts get all fields — `jr_posts` absorbs all `jr_projects` fields, making them optional
- Project-specific fields (tech_stack, project_status, github_url, live_url, featured, sort) available on all posts but not required
- Single flat list in admin UI with standard filters (status, tags)
- Default columns: title, status, published_at (keep existing JrPosts columns)
- Field order: Logical grouping in edit form
  - Metadata: status, title, slug, dates
  - Content: excerpt, body
  - Media: cover_image
  - Project-specific: project_type, project_status, tech_stack, github_url, live_url, featured, sort
  - Taxonomy: author, tags
  - SEO: seo_title, seo_description, reading_time_minutes

**Role Simplification**

- Delete non-admin users during migration (clean slate approach)
- Users collection schema: Single admin role (remove hasMany, remove editor/user options)
- Access helpers: Simplify to user presence check
  - Replace `editor()` with simpler `admin()` that checks `if (user)`
  - Remove checkrole.ts (no longer needed with single role)
- Obsidian sync: Authenticates as admin, creates drafts via `status: 'draft'` default value

**Data Preservation**

- Required fields: title, slug, body, status (core content fields)
- All other fields optional (allows posts without project data, projects without blog-specific data)
- Field consolidation:
  - Standardize on `excerpt` (migrate jr_projects.summary → jr_posts.excerpt)
  - Standardize on `published_at` (remove start_date/end_date — projects don't need them)
- Migration approach: **Clean slate**
  - Drop `jr_projects` table entirely
  - Recreate `jr_posts` with merged schema
  - No data preservation needed (fresh start)

**Access Control Testing**

- Test API responses only (not admin panel visibility)
- Cover published vs draft filtering:
  - Unauthenticated request: only returns `status: 'published'` posts
  - Authenticated request: returns all posts (including drafts)
- Test all 5 affected collections: jr_posts, jr_projects (before removal), nitf_posts, nitf_trails, rotr_posts
- Use Vitest integration tests (add to tests/int/api.int.spec.ts)

### Claude's Discretion

- Exact field ordering within logical groups
- Helper function naming (admin() vs authenticated() vs other)
- Test fixture data structure
- Migration SQL optimization

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                            | Research Support                                                                                         |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ACCESS-01 | Admin users can view draft content in admin panel                      | Access control pattern: `read: ({ req: { user } }) => user ? true : { status: { equals: 'published' } }` |
| ACCESS-02 | Published content visible to unauthenticated API requests              | Query constraint: `{ status: { equals: 'published' } }` returned when `!user`                            |
| ACCESS-03 | Draft content hidden from unauthenticated API requests                 | Same query constraint pattern — unauthenticated users filtered to published only                         |
| ACCESS-04 | `published.ts` access helper replaces broken `anyone()` pattern        | Official pattern from Payload docs: function with `{ req: { user } }` argument                           |
| ACCESS-05 | Users collection simplified to admin-only role                         | Remove `hasMany: true` and role options array — single role eliminates checkRole complexity              |
| SCHEMA-01 | `jr_posts` and `jr_projects` merged into single `jr_posts` collection  | Payload fields array accepts all field types — optional fields enable unified schema                     |
| SCHEMA-02 | Migration preserves all existing jr_posts and jr_projects data         | User decision: clean slate approach — no data preservation needed                                        |
| SCHEMA-03 | `jr_posts` supports both blog posts and project showcase content types | Optional fields pattern: only title, slug, body, status required — all project fields optional           |
| TEST-01   | Integration tests verify access control changes                        | Vitest `payload.find({ collection, overrideAccess: false, user })` pattern                               |
| TEST-04   | TypeScript types regenerated after schema changes                      | `npx payload generate:types` command documented in package.json                                          |

</phase_requirements>

## Standard Stack

### Core

| Library                 | Version     | Purpose                     | Why Standard                                                                                 |
| ----------------------- | ----------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| Payload CMS             | 3.78.0      | Headless CMS framework      | Project foundation — all collections, access control, migrations built on this               |
| @payloadcms/db-postgres | 3.78.0      | PostgreSQL database adapter | Project uses Postgres 16 — adapter provides migration system and Drizzle integration         |
| Drizzle ORM             | via adapter | Schema management           | Payload's Postgres adapter uses Drizzle for schema — `push: false` ensures migration control |
| Vitest                  | 4.0.18      | Testing framework           | Project uses Vitest for integration tests — existing suite at `tests/int/api.int.spec.ts`    |

### Supporting

| Library             | Version                     | Purpose                 | When to Use                                                                     |
| ------------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| drizzle-orm         | via @payloadcms/db-postgres | Raw SQL execution       | Migration raw SQL: `sql` import for DROP TABLE, ALTER TABLE statements          |
| payload (Local API) | 3.78.0                      | Programmatic CMS access | Test fixture creation: `payload.create()`, `payload.find()`, `payload.delete()` |

### Alternatives Considered

| Instead of            | Could Use        | Tradeoff                                                                          |
| --------------------- | ---------------- | --------------------------------------------------------------------------------- |
| Vitest                | Jest             | Vitest already configured, faster, better ESM support — no reason to switch       |
| Migration clean slate | Data migration   | User decided clean slate — fresh start preferred over complex data transformation |
| published.ts helper   | Inline functions | Reusable helper DRYer for 5 affected collections                                  |

**Installation:**
Already installed — no additional dependencies needed for this phase.

## Architecture Patterns

### Recommended Project Structure

Current structure already follows Payload best practices:

```
src/
├── collections/
│   ├── users/
│   │   ├── access/          # Access control helpers (published.ts goes here)
│   │   │   ├── anyone.ts     # REMOVE (broken helper)
│   │   │   ├── editor.ts     # REPLACE with admin.ts
│   │   │   ├── checkrole.ts  # REMOVE (not needed with single role)
│   │   │   └── published.ts  # CREATE (new helper)
│   │   └── Users.ts
│   ├── jake-reddy/
│   │   ├── JrPosts.ts       # UPDATE (merge fields, use published.ts)
│   │   └── JrProjects.ts    # REMOVE (merged into JrPosts)
│   └── [other domains]/     # UPDATE (use published.ts)
├── migrations/              # Migration files (create new for this phase)
└── payload.config.ts        # UPDATE (remove JrProjects from collections array)
```

### Pattern 1: Access Control with User Presence Check

**What:** Access function returns query constraint for unauthenticated users, `true` for authenticated
**When to use:** Collections with draft/published workflow where admins need to see all, public needs filtered
**Example:**

```typescript
// Source: https://payloadcms.com/docs/access-control/collections
// src/collections/users/access/published.ts
const published = ({ req: { user } }: any) => {
  if (!user) return { status: { equals: 'published' } }
  return true
}
export default published
```

**Why this works:**

- Payload executes access functions before operations
- Returning `true` = no restrictions (admin sees everything)
- Returning query object = filter applied (public sees published only)
- `req.user` is populated when JWT token valid, `undefined` otherwise

**Apply to collections:**

```typescript
import published from '../users/access/published'

access: {
  read: published,
  create: admin,
  update: admin,
  delete: admin,
}
```

### Pattern 2: Simplified Admin Access (Single Role)

**What:** Remove role-checking complexity when only one role exists
**When to use:** After simplifying Users collection to admin-only
**Example:**

```typescript
// src/collections/users/access/admin.ts
const admin = ({ req: { user } }: any) => Boolean(user)
export default admin
```

**Why this works:**

- With single role, user presence = admin
- No role array checking needed
- Simpler than checkRole(['admin', 'editor'], user)

### Pattern 3: Payload Migrations with Explicit Schema Control

**What:** `push: false` on adapter + explicit migrations for all schema changes
**When to use:** Always (project constraint) — especially for dropping/merging collections
**Example:**

```typescript
// Source: https://payloadcms.com/docs/database/migrations
// src/migrations/[timestamp]_merge_jr_collections.ts
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Drop jr_projects (and related tables)
  await db.execute(sql`DROP TABLE IF EXISTS jr_projects_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_projects CASCADE`)

  // 2. Recreate jr_posts with merged schema
  // Payload will auto-generate schema via drizzle-kit based on new collection config
  // Migration just handles the DROP — Payload migrate:create will generate new jr_posts schema
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Rollback: recreate jr_projects table
  // In practice, clean slate means down() may not be fully implemented
  throw new Error('Migration rollback not supported for clean slate approach')
}
```

**Migration workflow:**

1. Update collection configs (JrPosts with merged fields, remove JrProjects from payload.config.ts)
2. Run `npx payload migrate:create` — Payload generates migration comparing old → new schema
3. Review generated migration SQL (Payload auto-detects dropped collections)
4. Run `npx payload migrate` to apply

### Pattern 4: Optional Fields for Unified Schema

**What:** Make all non-core fields optional to support multiple content types in one collection
**When to use:** Merging collections with different field sets
**Example:**

```typescript
// jr_posts with merged schema
fields: [
  // REQUIRED: core fields all content needs
  { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: [...] },
  { name: 'title', type: 'text', required: true },
  { name: 'slug', type: 'text', required: true, unique: true },
  { name: 'body', type: 'textarea', required: true },

  // OPTIONAL: shared fields
  { name: 'excerpt', type: 'textarea' },  // was summary in jr_projects
  { name: 'cover_image', type: 'upload', relationTo: 'media' },
  { name: 'published_at', type: 'date' },

  // OPTIONAL: project-specific fields (only populated for projects)
  { name: 'project_type', type: 'select', options: [...] },
  { name: 'project_status', type: 'select', options: [...] },
  { name: 'tech_stack', type: 'json' },
  { name: 'github_url', type: 'text' },
  { name: 'live_url', type: 'text' },
  { name: 'featured', type: 'checkbox', defaultValue: false },
  { name: 'sort', type: 'number' },

  // OPTIONAL: taxonomy
  { name: 'author', type: 'relationship', relationTo: 'authors' },
  { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, filterOptions: { site: { equals: 'jake-reddy' } } },

  // OPTIONAL: SEO
  { name: 'reading_time_minutes', type: 'number' },
  { name: 'seo_title', type: 'text' },
  { name: 'seo_description', type: 'textarea' },
]
```

**Admin UI implications:**

- Single flat list shows all posts and projects
- Standard filters (status, tags) work across both types
- Optional fields render empty for posts without project data

### Pattern 5: Vitest Integration Tests for Access Control

**What:** Use `overrideAccess: false` to test access control, `user` context for authenticated requests
**When to use:** Verifying access control changes work at API level
**Example:**

```typescript
// Source: tests/int/api.int.spec.ts (existing pattern)
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload
let adminUser: any

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })

  // Create admin user for authenticated tests
  adminUser = await payload.create({
    collection: 'users',
    data: { email: 'admin@test.com', password: 'test123' },
  })
})

describe('Access control — draft visibility', () => {
  it('jr_posts: admin sees drafts, anon sees published only', async () => {
    // Create draft
    const draft = await payload.create({
      collection: 'jr_posts',
      data: { title: 'Draft Post', slug: 'draft-post', status: 'draft', body: 'content' },
    })

    // Create published
    const published = await payload.create({
      collection: 'jr_posts',
      data: {
        title: 'Published Post',
        slug: 'published-post',
        status: 'published',
        body: 'content',
      },
    })

    // Unauthenticated read (overrideAccess: false, no user)
    const anonResult = await payload.find({
      collection: 'jr_posts',
      overrideAccess: false,
    })
    const anonStatuses = anonResult.docs.map((d: any) => d.status)
    expect(anonStatuses.every((s: string) => s === 'published')).toBe(true)
    expect(anonResult.docs.some((d: any) => d.id === draft.id)).toBe(false)

    // Authenticated read (overrideAccess: false, user provided)
    const adminResult = await payload.find({
      collection: 'jr_posts',
      overrideAccess: false,
      user: adminUser,
    })
    const adminIds = adminResult.docs.map((d: any) => d.id)
    expect(adminIds.includes(draft.id)).toBe(true)
    expect(adminIds.includes(published.id)).toBe(true)

    // Cleanup
    await payload.delete({ collection: 'jr_posts', id: draft.id })
    await payload.delete({ collection: 'jr_posts', id: published.id })
  })
})
```

**Key points:**

- `overrideAccess: false` = access control enforced (tests the actual behavior)
- `user: adminUser` = simulates authenticated request
- No `user` = simulates unauthenticated request
- Tests verify both paths of conditional access function

### Anti-Patterns to Avoid

**Anti-pattern 1: Inline access functions without reusable helpers**

- **Why it's bad:** DRY violation — 5 collections need same logic, inline = 5 places to maintain
- **What to do instead:** Create `published.ts` helper, import in all affected collections

**Anti-pattern 2: Returning `true` unconditionally (the anyone() bug)**

- **Why it's bad:** Second condition never reached — breaks conditional filtering
- **What to do instead:** Check `user` presence first, return query constraint or `true` based on result

**Anti-pattern 3: Complex role checking with single role**

- **Why it's bad:** `checkRole(['admin'], user)` unnecessary when only one role exists
- **What to do instead:** Simple `Boolean(user)` check sufficient

**Anti-pattern 4: Using `push: true` with custom columns**

- **Why it's bad:** Drizzle auto-sync would drop PostGIS columns not in schema
- **What to do instead:** Keep `push: false`, use explicit migrations (already configured)

**Anti-pattern 5: Testing admin panel visibility instead of API**

- **Why it's bad:** Admin UI tests brittle, require browser automation
- **What to do instead:** Test API access control — same logic controls both

## Don't Hand-Roll

| Problem                          | Don't Build                           | Use Instead                        | Why                                                                                             |
| -------------------------------- | ------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Access control conditional logic | Custom middleware checking user roles | Payload's access control functions | Built-in, executes before operations, returns query constraints, integrates with admin panel    |
| Database schema migrations       | Direct SQL scripts                    | Payload migration system           | Tracks applied migrations, generates diffs, provides up/down functions, integrates with Drizzle |
| Role-based permissions           | Custom RBAC system                    | Payload's access + user roles      | User collection `roles` field + access functions cover all RBAC needs                           |
| Test database reset              | Custom truncate scripts               | Vitest + Payload Local API         | `payload.create/delete` in tests handles fixtures, Drizzle handles schema                       |
| TypeScript types for collections | Hand-written interfaces               | `payload generate:types`           | Auto-generated from collection configs, stays in sync with schema changes                       |

**Key insight:** Payload CMS provides complete access control, migration, and type generation systems. Custom solutions add maintenance burden and lose integration benefits (admin panel respects access functions, migrations auto-track, types auto-update).

## Common Pitfalls

### Pitfall 1: Broken Access Control from Always-True Functions

**What goes wrong:** Conditional access function with unreachable second branch — admins can't see drafts
**Why it happens:** `anyone()` returns `true` unconditionally, so `return true` after conditional never executes
**How to avoid:** Always check user presence FIRST, return constraint for unauthenticated, `true` for authenticated
**Warning signs:** Admin panel filters drafts for everyone, even logged-in admins
**Example from codebase:**

```typescript
// BROKEN (current state)
access: {
  read: () => {
    if (anyone()) return { status: { equals: 'published' } }  // anyone() = true always
    return true  // NEVER REACHED
  }
}

// FIXED
import published from '../users/access/published'
access: {
  read: published,  // checks user, returns constraint or true
}
```

### Pitfall 2: Forgetting to Update payload.config.ts After Collection Removal

**What goes wrong:** Import error or runtime error when Payload tries to load removed collection
**Why it happens:** Collection file deleted but still registered in config
**How to avoid:** After removing collection file, immediately update config's collections array
**Warning signs:** `Cannot find module 'JrProjects'` error on dev server start

### Pitfall 3: Migration Not Reflecting Collection Config Changes

**What goes wrong:** Migration doesn't match actual schema changes needed
**Why it happens:** `migrate:create` compares current DB schema to NEW collection configs — if configs not updated first, migration incomplete
**How to avoid:** Update ALL collection configs BEFORE running migrate:create
**Warning signs:** Migration missing expected columns, relations, or table drops
**Workflow:**

1. Update JrPosts.ts with merged fields
2. Remove JrProjects.ts file
3. Update payload.config.ts (remove JrProjects import and registration)
4. THEN run `npx payload migrate:create`

### Pitfall 4: Not Testing Authenticated Requests

**What goes wrong:** Tests pass for unauthenticated access but fail for admins (opposite problem)
**Why it happens:** Existing tests only check `overrideAccess: false` without `user` context
**How to avoid:** Write paired tests: one unauthenticated, one authenticated with user object
**Warning signs:** Access control "works" in tests but admins complain about broken admin panel

### Pitfall 5: Forgetting to Regenerate Types After Schema Changes

**What goes wrong:** TypeScript errors in code using collection fields (missing properties, wrong types)
**Why it happens:** `payload-types.ts` not regenerated after collection config changes
**How to avoid:** Run `npx payload generate:types` after every collection schema change
**Warning signs:** TS error: `Property 'project_type' does not exist on type 'JrPost'`

### Pitfall 6: User Collection Role Field Still Multi-Value

**What goes wrong:** Access helpers still check role arrays but schema expects single value
**Why it happens:** Removed role options but forgot to remove `hasMany: true` from field config
**How to avoid:** Update Users.ts to remove `hasMany`, change to single select (or remove field entirely if only one role)
**Warning signs:** Admin panel shows multi-select for roles, but only one option available

## Code Examples

Verified patterns from official sources:

### Access Control: Published Helper

```typescript
// Source: https://payloadcms.com/docs/access-control/collections (adapted)
// src/collections/users/access/published.ts
const published = ({ req: { user } }: any) => {
  // Authenticated users see everything
  if (user) return true

  // Unauthenticated users see only published
  return { status: { equals: 'published' } }
}

export default published
```

### Access Control: Simplified Admin (Single Role)

```typescript
// src/collections/users/access/admin.ts
const admin = ({ req: { user } }: any) => Boolean(user)
export default admin
```

### Collection Config: Merged Jr Posts

```typescript
// src/collections/jake-reddy/JrPosts.ts
import type { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const JrPosts: CollectionConfig = {
  slug: 'jr_posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'published_at'],
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    // Metadata
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'published_at', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },

    // Content
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'textarea', required: true },

    // Media
    { name: 'cover_image', type: 'upload', relationTo: 'media' },

    // Project-specific (all optional)
    {
      name: 'project_type',
      type: 'select',
      options: [
        { label: 'Open Source', value: 'open-source' },
        { label: 'Personal', value: 'personal' },
        { label: 'Home Lab', value: 'home-lab' },
        { label: 'Professional', value: 'professional' },
      ],
    },
    {
      name: 'project_status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'tech_stack', type: 'json' },
    { name: 'github_url', type: 'text' },
    { name: 'live_url', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'sort', type: 'number' },

    // Taxonomy
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      filterOptions: { site: { equals: 'jake-reddy' } },
    },

    // SEO
    { name: 'reading_time_minutes', type: 'number' },
    { name: 'seo_title', type: 'text' },
    { name: 'seo_description', type: 'textarea' },
  ],
  timestamps: true,
}
```

### Users Collection: Single Admin Role

```typescript
// src/collections/users/Users.ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // OPTION 1: Keep roles field as single select with only admin
    {
      name: 'roles',
      type: 'select',
      saveToJWT: true,
      options: [{ label: 'Admin', value: 'admin' }],
      defaultValue: 'admin',
    },
    // OPTION 2: Remove roles field entirely (user presence = admin)
    // (no roles field needed if only one role exists)
  ],
}
```

### Migration: Collection Merge (Clean Slate)

```typescript
// Source: https://payloadcms.com/docs/database/migrations
// src/migrations/[timestamp]_merge_jr_collections.ts
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop jr_projects and related tables
  await db.execute(sql`DROP TABLE IF EXISTS jr_projects_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_projects CASCADE`)

  // Drop jr_posts to recreate with merged schema
  await db.execute(sql`DROP TABLE IF EXISTS jr_posts_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS jr_posts CASCADE`)

  // Payload's migrate:create will generate the CREATE statements for new jr_posts schema
  // This migration handles the DROP — Payload auto-generates new schema based on updated collection config
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Clean slate approach: rollback not implemented
  throw new Error('Cannot rollback clean slate migration')
}
```

### Migration: Simplify Users Collection

```typescript
// src/migrations/[timestamp]_simplify_users_role.ts
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Delete all non-admin users (clean slate)
  await db.execute(sql`DELETE FROM users WHERE roles != 'admin'`)

  // Update enum to only include admin
  await db.execute(sql`
    ALTER TYPE enum_users_roles RENAME TO enum_users_roles_old;
    CREATE TYPE enum_users_roles AS ENUM('admin');
    ALTER TABLE users ALTER COLUMN roles TYPE enum_users_roles USING roles::text::enum_users_roles;
    DROP TYPE enum_users_roles_old;
  `)

  // Remove hasMany relationship table if exists
  await db.execute(sql`DROP TABLE IF EXISTS users_roles CASCADE`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Recreate multi-role enum
  await db.execute(sql`
    ALTER TYPE enum_users_roles RENAME TO enum_users_roles_old;
    CREATE TYPE enum_users_roles AS ENUM('admin', 'editor', 'user');
    ALTER TABLE users ALTER COLUMN roles TYPE enum_users_roles USING roles::text::enum_users_roles;
    DROP TYPE enum_users_roles_old;
  `)
}
```

### Vitest Integration Test: Authenticated Access

```typescript
// tests/int/api.int.spec.ts (addition)
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let adminUser: any

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })

  // Create admin user for authenticated tests
  adminUser = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@test.com',
      password: 'test123',
      roles: 'admin', // or omit if roles field removed
    },
  })
})

afterAll(async () => {
  // Cleanup admin user
  await payload.delete({ collection: 'users', id: adminUser.id })
})

describe('Access control — authenticated admin can see drafts', () => {
  const collections = ['jr_posts', 'nitf_posts', 'nitf_trails', 'rotr_posts'] as const

  for (const slug of collections) {
    it(`${slug}: admin user sees drafts, anon user sees published only`, async () => {
      // Create draft doc
      const draft = await payload.create({
        collection: slug,
        data: {
          title: `Draft ${slug} test`,
          slug: `draft-${slug}-${Date.now()}`,
          status: 'draft',
          body: 'draft content',
          ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
        },
      })

      // Create published doc
      const published = await payload.create({
        collection: slug,
        data: {
          title: `Published ${slug} test`,
          slug: `published-${slug}-${Date.now()}`,
          status: 'published',
          body: 'published content',
          ...(slug === 'nitf_posts' ? { type: 'general' } : {}),
        },
      })

      // Unauthenticated read (no user)
      const anonResult = await payload.find({
        collection: slug,
        overrideAccess: false,
      })
      const anonIds = anonResult.docs.map((d: any) => d.id)
      expect(anonIds.includes(draft.id)).toBe(false) // draft NOT visible
      expect(anonIds.includes(published.id)).toBe(true) // published IS visible

      // Authenticated read (admin user)
      const adminResult = await payload.find({
        collection: slug,
        overrideAccess: false,
        user: adminUser,
      })
      const adminIds = adminResult.docs.map((d: any) => d.id)
      expect(adminIds.includes(draft.id)).toBe(true) // draft IS visible
      expect(adminIds.includes(published.id)).toBe(true) // published IS visible

      // Cleanup
      await payload.delete({ collection: slug, id: draft.id })
      await payload.delete({ collection: slug, id: published.id })
    })
  }
})
```

## State of the Art

| Old Approach                      | Current Approach                        | When Changed               | Impact                                                              |
| --------------------------------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| Payload v2 migrations             | Payload v3 + Drizzle migrations         | v3.0 (2024)                | Migration files now use Drizzle `sql` helper, typed `MigrateUpArgs` |
| Manual access control middleware  | Built-in access control functions       | Always in Payload          | Functions return query constraints, integrate with admin panel      |
| Role arrays with checkRole        | Single role pattern                     | Project decision (Phase 1) | Simpler access helpers, no role array checking                      |
| Separate blog/project collections | Unified collection with optional fields | Project decision (Phase 1) | Simpler admin UX, fewer relationship joins                          |

**Deprecated/outdated:**

- `anyone()` helper pattern: Returns `true` unconditionally — never worked as intended, broken for draft filtering
- Multi-role `hasMany` pattern when only one role exists: Unnecessary complexity, simple user presence check sufficient
- Inline access control functions: DRY violation when same logic needed across collections

## Open Questions

**None.** All research areas resolved:

1. ✅ **Access control pattern:** Payload docs confirm `published` helper approach
2. ✅ **Migration workflow:** Clean slate approach via DROP + recreate with new schema
3. ✅ **Optional fields:** All fields except required core work as optional in Payload
4. ✅ **Testing authenticated requests:** `payload.find({ overrideAccess: false, user })` pattern verified in existing tests
5. ✅ **Type generation:** `npx payload generate:types` command documented in package.json

## Validation Architecture

### Test Framework

| Property           | Value                            |
| ------------------ | -------------------------------- |
| Framework          | Vitest 4.0.18                    |
| Config file        | vitest.config.mts                |
| Quick run command  | `npx vitest run`                 |
| Full suite command | `npx vitest run` (no watch mode) |

### Phase Requirements → Test Map

| Req ID    | Behavior                            | Test Type    | Automated Command                                                                           | File Exists?                     |
| --------- | ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------- | -------------------------------- |
| ACCESS-01 | Admin sees drafts in API            | integration  | `npx vitest run tests/int/api.int.spec.ts -t "admin user sees drafts"`                      | ❌ Wave 0                        |
| ACCESS-02 | Anon sees published in API          | integration  | `npx vitest run tests/int/api.int.spec.ts -t "unauthenticated read returns only published"` | ✅ (extend existing)             |
| ACCESS-03 | Anon doesn't see drafts in API      | integration  | `npx vitest run tests/int/api.int.spec.ts -t "unauthenticated read returns only published"` | ✅ (extend existing)             |
| ACCESS-04 | published.ts works correctly        | integration  | `npx vitest run tests/int/api.int.spec.ts -t "admin user sees drafts"`                      | ❌ Wave 0                        |
| ACCESS-05 | Single role users work              | integration  | `npx vitest run tests/int/api.int.spec.ts -t "users"`                                       | ✅ (extend existing)             |
| SCHEMA-01 | Merged collection exists            | unit (smoke) | `npx vitest run tests/int/api.int.spec.ts -t "fetches jr_posts"`                            | ✅ (adapt existing)              |
| SCHEMA-02 | Data preservation (N/A clean slate) | manual-only  | N/A — clean slate decision = no data to preserve                                            | N/A                              |
| SCHEMA-03 | Optional fields support both types  | integration  | `npx vitest run tests/int/api.int.spec.ts -t "jr_posts supports blog and project"`          | ❌ Wave 0                        |
| TEST-01   | Access control tests pass           | integration  | `npx vitest run tests/int/api.int.spec.ts`                                                  | ❌ Wave 0 (extend existing file) |
| TEST-04   | Types regenerated                   | manual-only  | Manual verification: `npx payload generate:types && npx tsc --noEmit`                       | ✅ commands exist                |

### Sampling Rate

- **Per task commit:** `npx vitest run` (full suite fast enough < 10s based on existing tests)
- **Per wave merge:** `npx vitest run` (same)
- **Phase gate:** Full suite green + `npx tsc --noEmit` before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Extend `tests/int/api.int.spec.ts` — add authenticated user tests (ACCESS-01, ACCESS-04)
- [ ] Add jr_posts type validation test — create post with project fields, create post without project fields (SCHEMA-03)
- No new test files needed — extend existing `api.int.spec.ts`

## Sources

### Primary (HIGH confidence)

- Payload CMS v3 Docs: Access Control Collections - https://payloadcms.com/docs/access-control/collections
- Payload CMS v3 Docs: Migrations - https://payloadcms.com/docs/database/migrations
- Payload CMS v3 Docs: Collection Config - https://payloadcms.com/docs/configuration/collections
- Payload CMS v3 Docs: Fields Overview - https://payloadcms.com/docs/fields/overview
- Vitest v4 Docs: Getting Started - https://vitest.dev/guide/
- Project codebase: src/collections/jake-reddy/JrPosts.ts, JrProjects.ts, Users.ts
- Project codebase: tests/int/api.int.spec.ts (existing integration test patterns)
- Project codebase: src/migrations/20260303_214307_add_postgis.ts (migration patterns)

### Secondary (MEDIUM confidence)

- None needed — primary sources sufficient

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Versions verified in package.json, official Payload docs
- Architecture: HIGH - Patterns verified in official docs and existing project code
- Pitfalls: HIGH - Identified from actual broken code in project (anyone() bug)
- Testing: HIGH - Existing test patterns in project, Vitest official docs
- Migration: HIGH - Official Payload migration docs, existing migration files in project

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days — Payload v3 stable, Vitest v4 stable)

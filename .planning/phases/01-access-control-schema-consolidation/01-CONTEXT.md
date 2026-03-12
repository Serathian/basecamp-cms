# Phase 1: Access Control & Schema Consolidation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix admin draft visibility in the CMS (the `anyone()` bug makes drafts invisible to admins) and consolidate Jake Reddy's two collections (`jr_posts` + `jr_projects`) into one unified collection. All schema changes require explicit migrations (`push: false`).

</domain>

<decisions>
## Implementation Decisions

### Merged Collection Behavior

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

### Role Simplification

- Delete non-admin users during migration (clean slate approach)
- Users collection schema: Single admin role (remove hasMany, remove editor/user options)
- Access helpers: Simplify to user presence check
  - Replace `editor()` with simpler `admin()` that checks `if (user)`
  - Remove checkrole.ts (no longer needed with single role)
- Obsidian sync: Authenticates as admin, creates drafts via `status: 'draft'` default value

### Data Preservation

- Required fields: title, slug, body, status (core content fields)
- All other fields optional (allows posts without project data, projects without blog-specific data)
- Field consolidation:
  - Standardize on `excerpt` (migrate jr_projects.summary → jr_posts.excerpt)
  - Standardize on `published_at` (remove start_date/end_date — projects don't need them)
- Migration approach: **Clean slate**
  - Drop `jr_projects` table entirely
  - Recreate `jr_posts` with merged schema
  - No data preservation needed (fresh start)

### Access Control Testing

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

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/collections/users/access/editor.ts` — Current role-checking helper (will be replaced with simpler admin())
- `src/collections/users/access/checkrole.ts` — Role validation logic (can be removed with single role)
- `src/collections/users/access/anyone.ts` — Broken helper (`() => true` always) — identifies the bug
- `tests/int/api.int.spec.ts` — Existing Vitest integration test suite (add access control tests here)

### Established Patterns

- Access control pattern: `read: () => { if (anyone()) return { status: { equals: 'published' } }; return true }`
  - Bug: `anyone()` always returns true, so `return true` is unreachable
  - Fix: Create `published.ts` helper that checks `if (!user) return { status: { equals: 'published' } }; return true`
- Collection structure: CollectionConfig with slug, admin, access, fields, timestamps
- Field relationships: `{ name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, filterOptions: { site: { equals: 'jake-reddy' } } }`

### Integration Points

- `src/payload.config.ts` — Collection registration (remove JrProjects, keep JrPosts)
- `src/collections/users/access/` — Access helper directory (add published.ts, replace editor.ts)
- All collections using `anyone()` import: jr_posts, jr_projects, nitf_posts, nitf_trails, rotr_posts (update all)

</code_context>

<specifics>
## Specific Ideas

- "Drop the table and recreate, this is a clean slate project" — No data migration needed, fresh schema approach
- Obsidian sync creates drafts by default — Sync API doesn't need special role, uses admin role + status field default
- Five collections affected by `anyone()` bug — Fix must be applied consistently across jr_posts, jr_projects, nitf_posts, nitf_trails, rotr_posts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-access-control-schema-consolidation_
_Context gathered: 2026-03-12_

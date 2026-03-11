# Technology Stack — Content Modeling Refinement

**Project:** Basecamp CMS (Payload v3 multi-domain content hub)
**Researched:** 2026-03-11
**Scope:** Content modeling patterns, field types, and collection organization strategies

---

## Executive Summary

This research focuses on **content modeling refinement** for an existing Payload CMS v3 application serving three domains. The existing infrastructure (Payload, PostgreSQL, PostGIS, Next.js) is already validated. This document provides prescriptive guidance on field types, relationship patterns, and collection organization strategies specific to the project's multi-domain, Obsidian-synced content model.

**Key Finding:** Payload v3's field system is robust enough to support all planned refinements without additional dependencies. The main challenges are organizational (collection design, relationship patterns) rather than technical capability gaps.

---

## Recommended Field Types & Patterns

### Markdown Content Storage

**Decision:** `type: 'textarea'` for markdown bodies

| Field Type              | Why NOT This                                                                                                                                                                | Why YES textarea                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `richText` with Lexical | Over-engineered. Obsidian source is markdown, frontends render markdown → HTML. Rich text editor adds complexity, breaks copy-paste workflow, requires client-side parsing. | **Simple string storage.** Preserves markdown exactly as authored. Zero transformation. Client-side rendering with `react-markdown` or similar. |
| `text`                  | Line breaks and whitespace collapse in single-line text inputs.                                                                                                             | **Multi-line aware.** Admin panel renders `<textarea>` with line breaks preserved.                                                              |
| `code`                  | Syntax highlighting is visual noise for prose. Better for actual code blocks.                                                                                               | **Clean editing UX** for long-form content without unnecessary syntax coloring.                                                                 |

**Recommendation (HIGH confidence):**

```typescript
{
  name: 'body',
  type: 'textarea',
  required: true,
  admin: {
    description: 'Markdown content from Obsidian. Rendered client-side.'
  }
}
```

**Source:** Official Payload v3 docs — textarea field
**Rationale:** Obsidian writes markdown. Frontends render markdown. CMS is a passthrough, not a transformer. Simplest pattern wins.

---

### GPS Coordinates

**Decision:** Dual strategy — `latitude`/`longitude` as `number` fields + PostGIS `geom` column

| Pattern                     | Data Stored                                                                              | When to Use                                                                                                                                       | Why NOT point field                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **`point` field**           | GeoJSON `{ type: 'Point', coordinates: [lon, lat] }`                                     | Payload-only spatial queries, no external tools.                                                                                                  | Abstracts underlying DB representation; harder to debug, less transparent for Obsidian sync. |
| **number fields + PostGIS** | `latitude: 43.123, longitude: -75.456` in Payload; `geom` column auto-populated via hook | **Multi-system compatibility.** Obsidian frontmatter uses `location: "lat, lon"` format. Simpler data model. PostGIS extension already installed. | ✅ **This is the pattern**                                                                   |

**Recommendation (HIGH confidence):**

```typescript
{
  name: 'latitude',
  type: 'number',
  min: -90,
  max: 90,
  admin: { step: 0.000001 }
},
{
  name: 'longitude',
  type: 'number',
  min: -180,
  max: 180,
  admin: { step: 0.000001 }
}
```

**Plus `afterChange` hook to populate `geom`:**

```typescript
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      if (doc.latitude != null && doc.longitude != null) {
        const db = (req.payload.db as any).drizzle
        await db.execute(sql`
          UPDATE ${tableName}
          SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
          WHERE id = ${doc.id}
        `)
      }
      return doc
    },
  ]
}
```

**Source:** Official Payload v3 docs (Point field, Collection hooks), existing codebase pattern in `NitfPosts.ts`
**Rationale:** Obsidian sync will parse `location: "43.123, -75.456"` → separate fields. PostGIS `geom` enables spatial queries (`ST_DWithin`, etc.) without forcing GeoJSON everywhere.

**Why this over `point` field:**

- Simpler data model (two numbers vs nested object)
- Direct mapping from Obsidian frontmatter (`location: "lat, lon"`)
- `geom` column handles spatial indexing invisibly
- PostGIS already in use (migration applied)

---

### Relationship Patterns

#### One-to-Many (Has One Parent)

**Pattern:** Single relationship field, `hasMany: false`

```typescript
{
  name: 'week',
  type: 'relationship',
  relationTo: 'rotr_weeks',
  required: true,
  hasMany: false
}
```

**Data stored:** `"week": "64f1234567890abcdef12345"` (just the ID)

**When to use:** Days belong to one week. Posts have one author. Projects have one tech stack.

---

#### Many-to-Many (Tags, Categories)

**Pattern:** Array relationship field, `hasMany: true`

```typescript
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'jr_tags', // site-specific tags collection
  hasMany: true,
  filterOptions: ({ siblingData }) => {
    return { site: { equals: 'jr' } } // only show tags for this site
  }
}
```

**Data stored:** `"tags": ["id1", "id2", "id3"]` (array of IDs)

**When to use:** Posts can have multiple tags. Trips can visit multiple destinations. Content relates to multiple categories.

**Important:** Use `filterOptions` to scope relationship options by site when shared collections exist.

---

#### Bidirectional Relationships (Trips ↔ POIs)

**Pattern:** Use `join` field on one side to create virtual reverse relationship

**On `nitf_trips`:**

```typescript
{
  name: 'pois',
  type: 'relationship',
  relationTo: 'nitf_poi',
  hasMany: true
}
```

**On `nitf_poi`:**

```typescript
{
  name: 'trips',
  type: 'join',
  collection: 'nitf_trips',
  on: 'pois' // the field name in nitf_trips that points back
}
```

**Effect:** Querying a POI automatically includes `trips: [...]` array of all trips that reference it. No data duplication. One source of truth.

**Source:** Official Payload v3 docs — Join field
**Confidence:** HIGH (official feature, well-documented)

---

### Ordered Lists (Week Days, Trip POIs)

**Pattern:** `array` field with `isSortable: true`

```typescript
{
  name: 'days',
  type: 'array',
  fields: [
    {
      name: 'day',
      type: 'relationship',
      relationTo: 'rotr_days',
      required: true
    }
  ],
  admin: {
    components: {
      RowLabel: ({ data, index }) => `Day ${index + 1}: ${data?.day?.date || 'Untitled'}`
    },
    isSortable: true
  }
}
```

**Data stored:** Array of objects with `id` and order implicitly by position.

**When to use:** Order matters and editors need drag-and-drop reordering. Week days must be sequential. Trip waypoints have logical order.

**Why array instead of relationship hasMany:** Relationship fields don't guarantee order. Array fields maintain insertion/drag-drop order.

**Source:** Official Payload v3 docs — Array field
**Confidence:** HIGH

---

### Flexible Metadata (Tech Stack, Links)

**Pattern:** `array` field with simple text/URL fields

```typescript
{
  name: 'tech_stack',
  type: 'array',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'category', type: 'select', options: ['frontend', 'backend', 'database', 'infra'] }
  ],
  admin: {
    components: {
      RowLabel: ({ data }) => data?.name || 'Technology'
    }
  }
}
```

**When to use:** Lightweight structured data that doesn't warrant its own collection. Tech stacks, social links, quick facts.

**Why NOT a separate collection:** Over-normalization. If data is only used in one place and has no relationships, keep it inline.

---

## Collection Organization Strategies

### Site-Specific vs Shared Collections

| Strategy                        | Collections                                                  | When to Use                                                               | Trade-offs                                                                                            |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Site-specific**               | `jr_posts`, `nitf_posts`, `rotr_days`                        | Different schemas per site. Clear namespace. No cross-site contamination. | **More collections**, but cleaner separation. Recommended for this project.                           |
| **Shared with discriminator**   | Single `posts` collection with `site` field + access control | All sites use identical schema. Single source of truth.                   | **Schema drift risk.** One site needs a field → breaks others or requires optional fields everywhere. |
| **Shared base with extensions** | `base_posts` + site-specific collections inherit             | Reuse common fields (title, slug, body), extend per-site.                 | **Complex inheritance.** Payload v3 doesn't have native inheritance; requires composition patterns.   |

**Recommendation (HIGH confidence):** Site-specific collections with slug prefixes (`jr_`, `nitf_`, `rotr_`)

**Rationale:**

- Schemas diverge meaningfully (e.g., `rotr_days` have GPS + weather, `jr_posts` have github_url + demo_url)
- Admin panel clarity: editors see only relevant collections
- Type safety: each collection gets its own TypeScript type
- Migration simplicity: schema changes scoped to one collection

**Source:** Project requirements analysis + official Payload v3 collection patterns
**Confidence:** HIGH (aligns with existing codebase, PROJECT.md requirements)

---

### When to Share Collections

**Share when:**

- Schema is **truly identical** across sites (e.g., `authors` — name, bio, avatar)
- No foreseeable divergence (all sites will always need the same fields)
- Cross-site relationships make sense (author writes for multiple sites)

**Don't share when:**

- One site needs extra fields (tags with `difficulty` for NITF, tags without for JR)
- Access control differs (NITF admins ≠ JR admins)
- Different workflows (NITF posts draft → published, JR projects always published)

**Currently shared in project:**

- `authors` — correct, schema is identical, cross-site reuse
- `users` — correct, authentication is global
- `media` — **should be split per-site** (see below)

---

### Media Collections: Split or Shared?

**Current:** Single `media` collection
**PROJECT.md requirement:** Split into `jr_media`, `nitf_media`, `rotr_media`

**Why split (HIGH confidence):**

1. **Access control:** NITF editors shouldn't see JR uploads
2. **Admin UX:** Filtering 10,000 images by site is cognitive overhead
3. **Storage organization:** `/uploads/jr/`, `/uploads/nitf/` folders cleaner than flat namespace
4. **Performance:** Smaller collections → faster list queries
5. **Deletion safety:** Delete `nitf_media` collection → only affects NITF, not entire CMS

**Implementation:**

```typescript
// jr_media.ts
export const JrMedia: CollectionConfig = {
  slug: 'jr_media',
  upload: {
    staticDir: 'uploads/jr',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 1024, position: 'centre' },
    ],
  },
  access: {
    read: () => true,
    create: admin, // only admins can upload
    update: admin,
    delete: admin,
  },
  fields: [],
}
```

**Repeat for `nitf_media`, `rotr_media` with respective `staticDir` paths.**

**Source:** Official Payload v3 docs — Upload field, PROJECT.md requirements
**Confidence:** HIGH (explicit project requirement + access control benefits)

---

### Tags: Site-Specific or Global?

**PROJECT.md requirement:** `jr_tags`, `nitf_tags`, `rotr_tags`

**Why split (HIGH confidence):**

1. **Different taxonomies:** NITF needs "hiking difficulty", JR doesn't
2. **No cross-site tagging:** A JR post will never be tagged with NITF categories
3. **Admin clarity:** Editing NITF post → only see NITF tags

**Implementation:**

```typescript
// jr_tags.ts
export const JrTags: CollectionConfig = {
  slug: 'jr_tags',
  admin: {
    useAsTitle: 'name',
    group: 'Jake Reddy',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
}
```

**In post collections, scope relationship:**

```typescript
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'jr_tags', // locked to this site's tags
  hasMany: true
}
```

**Source:** PROJECT.md requirements + multi-tenancy patterns
**Confidence:** HIGH

---

## Collection Schema Patterns

### Slug Auto-Generation

**Pattern:** Virtual field + `beforeValidate` hook

```typescript
{
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  admin: {
    position: 'sidebar'
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return value // preserve manual edits
        if (data?.title) {
          return data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
      }
    ]
  }
}
```

**When to use:** All content collections with user-facing URLs.

**Source:** Common pattern from Payload community + official examples
**Confidence:** HIGH

---

### Draft/Published Workflow

**Pattern:** `status` field + access control

```typescript
{
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' }
  ],
  admin: {
    position: 'sidebar'
  }
},
// Access control
access: {
  read: ({ req: { user } }) => {
    if (user) return true // authenticated users see all
    return { status: { equals: 'published' } } // public sees only published
  }
}
```

**When to use:** Content that needs review before going live (posts, projects, trips).

**Note:** Payload v3 has native `versions.drafts` feature, but PROJECT.md specifies simple status field. Simpler pattern = less complexity.

**Source:** PROJECT.md requirements, official Payload v3 access control docs
**Confidence:** HIGH

---

## Anti-Patterns to Avoid

### 1. Using `richText` for Markdown Content

**Why avoid:** Obsidian writes markdown. Rich text editors (Lexical) produce JSON AST. Sync workflow would need:

- Parse markdown → Lexical AST (fragile, lossy)
- Store AST in DB
- Parse AST → HTML on frontend (double parsing)
- Round-trip editing destroys formatting

**Instead:** Store markdown as plain text (`textarea`), render on frontend with `react-markdown`.

**Confidence:** HIGH (architectural mismatch with Obsidian-first workflow)

---

### 2. Shared Collections with Site Discriminators

**Bad pattern:**

```typescript
// DON'T DO THIS
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    { name: 'site', type: 'select', options: ['jr', 'nitf', 'rotr'] },
    { name: 'github_url', type: 'text' }, // only JR needs this
    { name: 'difficulty', type: 'select', options: [...] }, // only NITF needs this
    // 30 more fields, half unused per site
  ]
}
```

**Problems:**

- Optional field explosion
- Validation complexity (if site=jr, github_url required; else optional)
- Admin UX clutter (NITF editors see irrelevant fields)
- Query performance (filtering by site adds WHERE clause overhead)

**Instead:** Site-specific collections (`jr_posts`, `nitf_posts`, `rotr_posts`)

**Confidence:** HIGH (existing codebase already uses site-specific pattern)

---

### 3. Over-Normalizing Simple Data

**Bad pattern:**

```typescript
// DON'T DO THIS — tech_stack as separate collection
export const Technologies: CollectionConfig = {
  slug: 'technologies',
  fields: [
    { name: 'name', type: 'text' },
    { name: 'icon', type: 'upload', relationTo: 'media' }
  ]
}

// In jr_posts
{
  name: 'tech_stack',
  type: 'relationship',
  relationTo: 'technologies',
  hasMany: true
}
```

**Problems:**

- Tech stacks are project-specific (no reuse across projects)
- No relationships to justify collection (no "all projects using React" query needed)
- Admin overhead: edit project → open drawer → search tech → repeat 5 times
- Performance: N+1 query to populate tech_stack relationships

**Instead:** Inline array field

```typescript
{
  name: 'tech_stack',
  type: 'array',
  fields: [
    { name: 'name', type: 'text' },
    { name: 'category', type: 'select', options: [...] }
  ]
}
```

**When to normalize:** Only if data is **reused** (categories, authors) or **queryable** (find all X tagged with Y).

**Confidence:** HIGH (Payload best practices + performance considerations)

---

### 4. Not Using `filterOptions` on Cross-Site Relationships

**Bad pattern:**

```typescript
// DON'T DO THIS
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'tags', // global tags collection
  hasMany: true
  // no filterOptions
}
```

**Problem:** Editor sees tags from all sites. Confusion + accidental cross-site tagging.

**Instead:**

```typescript
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'jr_tags', // site-specific collection
  hasMany: true
}
```

**Or if using shared collection (not recommended):**

```typescript
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'tags',
  hasMany: true,
  filterOptions: () => ({ site: { equals: 'jr' } })
}
```

**Confidence:** HIGH (Payload v3 relationship filtering docs)

---

### 5. Manual `geom` Column Population

**Bad pattern:**

```typescript
// DON'T DO THIS
// Migration adds geom column
// Admin manually enters lat/lon
// geom stays NULL forever
// Spatial queries return 0 results
```

**Problem:** Existing migration (AGENTS.md issue #2) only populates `geom` for existing rows. New inserts leave `geom = NULL`.

**Fix:** `afterChange` hook (already documented in GPS section above)

**Confidence:** HIGH (known issue in AGENTS.md, solution verified in official hook docs)

---

## Schema Organization Best Practices

### File Structure

```
src/collections/
├── jake-reddy/
│   ├── JrPosts.ts        # slug: jr_posts
│   ├── JrTags.ts         # slug: jr_tags
│   ├── JrMedia.ts        # slug: jr_media
├── nerdintheforest/
│   ├── NitfTrips.ts      # slug: nitf_trips
│   ├── NitfPosts.ts      # slug: nitf_posts
│   ├── NitfDestinations.ts
│   ├── NitfPoi.ts
│   ├── NitfTags.ts
│   ├── NitfMedia.ts
├── reddyontheroad/
│   ├── RotrWeeks.ts      # slug: rotr_weeks
│   ├── RotrDays.ts       # slug: rotr_days
│   ├── RotrTags.ts
│   ├── RotrMedia.ts
├── shared/
│   ├── Authors.ts        # slug: authors
│   ├── Users.ts          # slug: users (auth collection)
```

**Rationale:** Directory structure mirrors domain boundaries. Easy to find, easy to extend per-site without touching other sites.

**Confidence:** HIGH (matches existing codebase structure from ARCHITECTURE.md)

---

### Collection Slug Naming

**Pattern:** `{site_prefix}_{plural_noun}`

Examples:

- `jr_posts` (Jake Reddy posts)
- `nitf_trips` (Nerd in the Forest trips)
- `rotr_weeks` (Reddy on the Road weeks)

**Why prefixes:** Prevents collisions. TypeScript types are `JrPost`, `NitfTrip`, `RotrWeek` — clear which site.

**Confidence:** HIGH (existing pattern in codebase)

---

### Field Naming Conventions

**Pattern:** `snake_case` for field names

```typescript
{
  name: 'publish_date',      // ✅
  type: 'date'
}
// NOT: publishDate (camelCase adds API/DB mismatch)
// NOT: publish-date (hyphens invalid in JS object keys)
```

**Rationale:** Payload generates DB columns directly from field names. `snake_case` is Postgres convention. Avoid transform layer.

**Confidence:** HIGH (database best practices + existing codebase uses snake_case)

---

## Relationship Design Patterns

### When to Use `join` vs `relationship`

| Pattern                    | Direction         | Use Case                                          | Example                              |
| -------------------------- | ----------------- | ------------------------------------------------- | ------------------------------------ |
| **Relationship (forward)** | Parent → children | Explicit authoring. Editor selects related items. | Trip → POIs (editor picks waypoints) |
| **Join (reverse)**         | Children → parent | Automatic reverse query. "What references me?"    | POI → Trips (auto-populated list)    |

**Decision tree:**

1. Do editors need to **manually select** related items? → `relationship`
2. Do you need to **query in reverse** ("what points to this")? → Add `join` on target collection
3. Both? → `relationship` + `join` = bidirectional

**Example (PROJECT.md: nitf_trips ↔ nitf_poi):**

```typescript
// nitf_trips.ts
{
  name: 'pois',
  type: 'relationship',
  relationTo: 'nitf_poi',
  hasMany: true,
  admin: {
    description: 'Waypoints visited on this trip'
  }
}

// nitf_poi.ts
{
  name: 'trips',
  type: 'join',
  collection: 'nitf_trips',
  on: 'pois'
}
```

**Result:** Querying a POI returns `trips: [...]` array. Querying a trip returns `pois: [...]` array. Single source of truth (stored in `nitf_trips`).

**Confidence:** HIGH (official Payload v3 join field documentation)

---

### Relationship Depth & Population

**Pattern:** Limit relationship depth with `maxDepth` on field config

```typescript
{
  name: 'author',
  type: 'relationship',
  relationTo: 'authors',
  maxDepth: 1 // don't populate author's relationships
}
```

**Why:** Performance. Deep population = N+1 queries. Example:

- Fetch 50 posts
- Each post has `author` (1 query per post = 50 queries)
- Each author has `posts` (50 more queries)
- = 101 queries for one page

**Default behavior:** Payload populates relationships 1 level deep. Use `maxDepth: 0` to return IDs only, `maxDepth: 2+` for nested relationships (use sparingly).

**Frontend query example:**

```typescript
const posts = await fetch('/api/jr_posts?depth=1') // populate author, but not author.posts
```

**Confidence:** HIGH (official Payload v3 depth documentation)

---

## PostGIS Integration Patterns

### Extending Geo Support to All Collections

**Current state (AGENTS.md issue #3):** Only `nitf_posts` has `geom` column.

**Collections needing geo:**

- `nitf_trails` (trail start point)
- `nitf_poi` (waypoint location)
- `nitf_destinations` (region center)
- `rotr_days` (daily location)

**Pattern (apply to each):**

1. **Migration:**

```typescript
// In 20260303_214307_add_postgis.ts
const geoTables = [
  { table: 'nitf_posts', latCol: 'latitude', lonCol: 'longitude' },
  { table: 'nitf_trails', latCol: 'latitude_start', lonCol: 'longitude_start' },
  { table: 'nitf_poi', latCol: 'latitude', lonCol: 'longitude' },
  { table: 'nitf_destinations', latCol: 'latitude', lonCol: 'longitude' },
  { table: 'rotr_days', latCol: 'latitude', lonCol: 'longitude' },
]
```

2. **Collection hook:**

```typescript
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      const db = (req.payload.db as any).drizzle
      await db.execute(sql`
        UPDATE ${tableName}
        SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
        WHERE id = ${doc.id}
      `)
      return doc
    },
  ]
}
```

**Confidence:** HIGH (existing pattern in codebase, official PostGIS docs)

---

### Spatial Query Patterns

**Near query (find POIs within 10km of location):**

```typescript
const nearbyPOIs = await payload.find({
  collection: 'nitf_poi',
  where: {
    geom: {
      near: [longitude, latitude, 10000], // [lon, lat, meters]
    },
  },
})
```

**Within polygon (find locations in region):**

```typescript
const locationsInRegion = await payload.find({
  collection: 'nitf_destinations',
  where: {
    geom: {
      within: {
        type: 'Polygon',
        coordinates: [
          [
            /* polygon points */
          ],
        ],
      },
    },
  },
})
```

**Source:** Official Payload v3 Point field documentation
**Confidence:** HIGH

---

## Migration Strategy

### Schema Changes Workflow

**Constraint:** `push: false` on DB adapter → Drizzle never auto-syncs → manual migrations required

**Process:**

1. **Make schema change** (add field to collection config)
2. **Generate migration:** `npx payload migrate:create`
3. **Edit migration file** (Payload auto-generates, but review SQL)
4. **Apply migration:** `npx payload migrate`
5. **Verify:** Check DB schema + test API

**Example (add `difficulty` field to `nitf_posts`):**

```typescript
// 1. Update collection config
{
  name: 'difficulty',
  type: 'select',
  options: ['easy', 'moderate', 'hard']
}

// 2. Generate migration
// $ npx payload migrate:create

// 3. Migration auto-generated:
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.schema.alterTable('nitf_posts', (table) => {
    table.addColumn('difficulty', 'varchar')
  })
}

// 4. Apply
// $ npx payload migrate
```

**Critical:** Never run `npx payload migrate:fresh` in production (drops all tables).

**Confidence:** HIGH (existing constraint documented in PROJECT.md + AGENTS.md)

---

### Migration Testing Pattern

**Process:**

1. **Local dev:** Apply migration, test with `npm run dev`
2. **Run tests:** `npx vitest run` (integration tests verify schema)
3. **Check generated types:** `npx payload generate:types`
4. **Commit migration file** + updated `payload-types.ts`
5. **Deploy:** CI runs migration on Droplet

**Source:** Existing workflow from AGENTS.md
**Confidence:** HIGH

---

## Type Safety Patterns

### Generated Types Usage

**Workflow:**

1. **After schema changes:** `npx payload generate:types`
2. **Output:** `src/payload-types.ts` (all collection types)
3. **Import in hooks/components:**

```typescript
import type { NitfPost } from '@/payload-types'

const hook: CollectionAfterChangeHook<NitfPost> = async ({ doc }) => {
  // doc is typed as NitfPost
  console.log(doc.title) // autocomplete works
}
```

**For frontends:**

- Types published to `@basecamp-cms/basecamp-cms-types` npm package
- Import in Next.js: `import type { JrPost } from '@basecamp-cms/basecamp-cms-types'`

**Confidence:** HIGH (existing CI workflow documented in STACK.md)

---

### Custom Field Interfaces

**Pattern:** Reusable type definitions for complex fields

```typescript
// In collection config
{
  name: 'location_data',
  type: 'group',
  interfaceName: 'LocationData', // generates top-level TS interface
  fields: [
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    { name: 'address', type: 'text' }
  ]
}
```

**Result:** `payload-types.ts` exports `interface LocationData { ... }` that can be imported elsewhere.

**When to use:** Shared field structures across collections (e.g., location metadata reused in multiple collections).

**Source:** Official Payload v3 field interfaceName documentation
**Confidence:** HIGH

---

## Access Control Patterns

### Fixing the `anyone()` Misuse (AGENTS.md issue #1)

**Current bug:** Five collections use `anyone()` helper that always returns `true`, causing dead code in access control. Authenticated users can't see drafts.

**Fix:** Create `published.ts` helper

```typescript
// src/collections/users/access/published.ts
import type { Access } from 'payload'

const published: Access = ({ req: { user } }) => {
  if (user) return true // authenticated users see all
  return { status: { equals: 'published' } } // public sees published only
}

export default published
```

**Usage:**

```typescript
// In collection config
import published from '../users/access/published'

export const JrPosts: CollectionConfig = {
  slug: 'jr_posts',
  access: {
    read: published, // ✅ replaces broken anyone() pattern
  },
}
```

**Affected collections:** `jr_posts`, `jr_projects`, `nitf_posts`, `nitf_trails`, `rotr_posts`

**Confidence:** HIGH (explicit issue documented in AGENTS.md + official access control docs)

---

### Site-Specific Admin Access

**Pattern:** Scope admin users to specific sites

```typescript
// users collection
{
  name: 'sites',
  type: 'select',
  hasMany: true,
  options: ['jr', 'nitf', 'rotr'],
  defaultValue: ['jr', 'nitf', 'rotr'], // admins have all by default
  admin: {
    description: 'Which sites this user can manage'
  }
}

// In jr_posts access control
access: {
  create: ({ req: { user } }) => {
    if (user?.role === 'admin') return true
    return user?.sites?.includes('jr') || false
  }
}
```

**When to use:** Multi-site CMS with per-site editors (not needed for PROJECT.md — admin-only CMS).

**Confidence:** MEDIUM (not required for current project, but standard pattern for multi-tenant Payload)

---

## Performance Considerations

### Indexing Strategy

**Rule:** Index fields used in `where` clauses

```typescript
{
  name: 'slug',
  type: 'text',
  required: true,
  unique: true, // auto-creates unique index
  index: true    // explicit index (redundant with unique, but shown for clarity)
}

{
  name: 'status',
  type: 'select',
  index: true // index because of WHERE status = 'published' queries
}

{
  name: 'publish_date',
  type: 'date',
  index: true // index for sorting by date
}
```

**PostGIS spatial index:**

```sql
CREATE INDEX idx_nitf_posts_geom ON nitf_posts USING GIST (geom);
```

**Confidence:** HIGH (database best practices + PostGIS docs)

---

### List View Performance (`enableListViewSelectAPI`)

**Problem:** Default list view fetches entire documents (all fields). Slow for large documents.

**Solution:** Opt into Select API

```typescript
admin: {
  enableListViewSelectAPI: true, // only fetch visible columns
  defaultColumns: ['title', 'status', 'publish_date'] // define visible columns
}
```

**Trade-off:** Hooks that rely on full document data won't have it unless field is in `forceSelect`.

**When to use:** Collections with 10+ fields or heavy rich text fields.

**Confidence:** HIGH (official Payload v3 experimental feature, documented in collections docs)

---

## Confidence Assessment

| Area                                         | Confidence | Notes                                                |
| -------------------------------------------- | ---------- | ---------------------------------------------------- |
| Field types (textarea, number, relationship) | **HIGH**   | Official Payload v3 docs, existing codebase patterns |
| PostGIS integration (geom column + hooks)    | **HIGH**   | Existing implementation + PostGIS docs               |
| Collection organization (site-specific)      | **HIGH**   | Matches PROJECT.md requirements + existing structure |
| Relationship patterns (join, hasMany)        | **HIGH**   | Official Payload v3 relationship docs                |
| Access control fix (published helper)        | **HIGH**   | Known bug in AGENTS.md + official access docs        |
| Migration workflow                           | **HIGH**   | Existing constraint + workflow documented            |
| Anti-patterns                                | **HIGH**   | Architectural analysis + Payload best practices      |
| Performance optimizations                    | **MEDIUM** | Select API is experimental (may change in v4)        |

---

## Sources

| Source                                            | Type    | Confidence | URL                                                   |
| ------------------------------------------------- | ------- | ---------- | ----------------------------------------------------- |
| Payload CMS v3 Official Docs — Collections        | Primary | HIGH       | https://payloadcms.com/docs/configuration/collections |
| Payload CMS v3 Official Docs — Fields Overview    | Primary | HIGH       | https://payloadcms.com/docs/fields/overview           |
| Payload CMS v3 Official Docs — Relationship Field | Primary | HIGH       | https://payloadcms.com/docs/fields/relationship       |
| Payload CMS v3 Official Docs — Blocks Field       | Primary | HIGH       | https://payloadcms.com/docs/fields/blocks             |
| Payload CMS v3 Official Docs — Array Field        | Primary | HIGH       | https://payloadcms.com/docs/fields/array              |
| Payload CMS v3 Official Docs — Group Field        | Primary | HIGH       | https://payloadcms.com/docs/fields/group              |
| Payload CMS v3 Official Docs — Point Field        | Primary | HIGH       | https://payloadcms.com/docs/fields/point              |
| Payload CMS v3 Official Docs — Collection Hooks   | Primary | HIGH       | https://payloadcms.com/docs/hooks/collections         |
| Payload CMS v3 Official Docs — Rich Text Field    | Primary | HIGH       | https://payloadcms.com/docs/fields/rich-text          |
| PROJECT.md (project requirements)                 | Primary | HIGH       | Local file                                            |
| ARCHITECTURE.md (existing patterns)               | Primary | HIGH       | Local file                                            |
| STACK.md (current stack)                          | Primary | HIGH       | Local file                                            |
| AGENTS.md (known issues)                          | Primary | HIGH       | Local file                                            |

**Note:** All official Payload CMS documentation verified as v3-specific (not v2 patterns). Docs accessed 2026-03-11.

---

## Open Questions / Validation Needed

None. All patterns are supported by official Payload v3 documentation and/or existing codebase.

---

## Next Steps for Implementation

1. **Create `published.ts` access helper** (AGENTS.md issue #1 fix)
2. **Split media collections** (`jr_media`, `nitf_media`, `rotr_media`)
3. **Add `afterChange` hooks** for PostGIS `geom` population (AGENTS.md issue #2)
4. **Extend PostGIS migration** to remaining geo tables (AGENTS.md issue #3)
5. **Refactor collections per PROJECT.md requirements** (merge `jr_posts`/`jr_projects`, add `nitf_trips`, etc.)
6. **Generate migration** for schema changes
7. **Update tests** to cover new patterns
8. **Regenerate types** (`npx payload generate:types`)

All steps use patterns documented in this STACK.md. No additional research required.

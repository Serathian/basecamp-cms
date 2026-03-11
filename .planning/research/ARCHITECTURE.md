# Architecture Patterns

**Domain:** Multi-domain Payload CMS
**Researched:** 2026-03-11

## Recommended Architecture

The optimal architecture for a multi-domain Payload CMS uses **namespace-prefixed collections** with **site discriminator fields** for shared resources, combined with **join fields for bidirectional relationships** and **simplified access control patterns**.

### Architectural Principles

#### 1. Collection Organization

**When to Split Collections:**

- Content types serve **different user journeys** (e.g., blog posts vs. projects)
- Content types require **significantly different field schemas** (>50% unique fields)
- Content types have **different relationship patterns** (e.g., ordered vs. unordered)
- Content types need **different access control rules**

**When to Merge Collections:**

- Content types share >70% of their fields
- Only differ by a `type` discriminator field
- Share the same relationship patterns
- Would require duplicate admin UI customizations
- Semantic distinction is author-facing only, not schema-driven

**Current System Assessment:**

- `jr_posts` + `jr_projects` → **MERGE** (share: title, slug, body, tags, author, dates — differ only by github_url/demo_url)
- `nitf_posts` (5 types) → **KEEP MERGED** (correct — shared schema, type discriminator works)
- `nitf_trails` + `nitf_posts` → **KEEP SEPARATE** (correct — fundamentally different: trails are GPS tracks with waypoints; posts are narrative content)
- `rotr_weeks` + `rotr_days` → **NEW SPLIT NEEDED** (week = compilation; day = atomic diary entry with ordered relationship)

#### 2. Namespace Strategy

**Pattern:** `{site}_{entity}` slug convention isolates domain boundaries.

```typescript
// Site-specific content collections
jr_posts // jake-reddy.com
nitf_posts // nerdintheforest.com
nitf_trips // nerdintheforest.com (new)
rotr_weeks // reddyontheroad.com (new)
rotr_days // reddyontheroad.com (new)

// Site-specific taxonomy/metadata
jr_tags
jr_technologies
nitf_tags
nitf_destinations
nitf_poi
rotr_tags

// Site-specific media
jr_media
nitf_media
rotr_media

// Shared (no prefix)
authors
users
```

**Why Not Shared Tags?**

- No vocabulary overlap between domains
- Site-specific filtering eliminates cross-pollution in admin UI
- Simpler data model (no site discriminator field in relationships)
- Clearer ownership boundaries

**Why Not Shared Media?**

- Prevents accidental cross-site asset usage
- Clearer admin UI organization
- Enables site-specific upload validation rules
- Avoids `filterOptions` complexity on every media relationship

**Exceptions to Namespace Prefix:**

- `authors` — true cross-site entity (you write for all three domains)
- `users` — authentication collection (not site-specific)

#### 3. Collection Boundaries by Domain

**Jake-Reddy.com (Personal Promotion):**

- **Single `jr_posts` collection** with `type: ['blog', 'project']`
- Projects get conditional fields: `github_url`, `demo_url`, `tech_stack[]`
- Eliminates artificial jr_posts/jr_projects split
- Simpler API queries: `?where[type][equals]=project`

**NerdInTheForest.com (Outdoor Adventure):**

- **`nitf_trips`** — flagship expedition content with complex structure:
  - Ordered `days[]` array (relationship to `nitf_posts` filtered by type)
  - POIs array (bidirectional many-to-many via join field)
  - Destination relationship
  - Cover image, date range, narrative summary
- **`nitf_posts`** — granular content pieces with `type: ['review', 'place', 'recipe', 'tips', 'general']`:
  - Optional GPS fields for `type: 'place'`
  - Conditional `review_meta` / `recipe_meta` JSON
  - Can stand alone OR be referenced by trips
- **`nitf_destinations`** — reusable location entities:
  - GPS boundary/center
  - Season info, difficulty, featured image
  - Linked from trips
- **`nitf_poi`** — queryable map markers:
  - GPS coordinates, type (camp-fire/lean-to/water/etc.)
  - Bidirectional with trips (join field)

**ReddyOnTheRoad.com (2022 Travel Diary):**

- **`rotr_weeks`** — compilation units:
  - Ordered `days[]` array (relationship to `rotr_days`)
  - Summary markdown, cover photo, date range
- **`rotr_days`** — atomic diary entries:
  - Single GPS point (location_name, location_type)
  - Markdown body, photos array, weather, mood
  - Reverse join to weeks (for "this day appears in week X" UI)

### Component Structure

```
Collection (CollectionConfig)
├── Fields Schema
│   ├── Direct fields
│   ├── Relationship fields (one-way reference)
│   ├── Join fields (virtual bidirectional)
│   └── Array fields (ordered embedded data or relationships)
├── Access Control
│   ├── Operation-level (create/read/update/delete)
│   ├── Field-level (conditional visibility)
│   └── Document-level (query constraints)
├── Hooks
│   ├── beforeValidate (format incoming data)
│   ├── beforeChange (compute derived fields)
│   ├── afterChange (side effects, geom population)
│   └── afterRead (transform outgoing data)
└── Admin Options
    ├── useAsTitle
    ├── defaultColumns
    ├── listSearchableFields
    └── components (custom UI)
```

## Relationship Patterns

### 1. One-Way Relationships (Standard `relationship` Field)

**Use When:**

- Only need to query FROM document A TO document B
- No need to see "where is this used" in admin UI
- Performance-critical read operations (no join overhead)

**Example:**

```typescript
// In nitf_posts collection
{
  name: 'author',
  type: 'relationship',
  relationTo: 'authors',
  required: true,
}

// Query: "Get all posts by author X"
await payload.find({
  collection: 'nitf_posts',
  where: { author: { equals: authorId } }
})

// But NOT: "Get all posts for this author" from the author document
// (would require manual query from nitf_posts collection)
```

**Storage Pattern:**

```typescript
// nitf_posts document
{
  id: "post123",
  author: "author456",  // Just stores ID
  // ...
}

// authors document
{
  id: "author456",
  name: "Jake Reddy",
  // NO automatic posts[] array
}
```

### 2. Bidirectional Relationships (Join Field)

**Use When:**

- Need to query in BOTH directions
- Want admin UI to show related documents on both sides
- "Where is this used?" is valuable information
- Relationship context fields are needed

**Example:**

```typescript
// In nitf_trips collection
{
  name: 'pois',
  type: 'array',
  fields: [
    {
      name: 'poi',
      type: 'relationship',
      relationTo: 'nitf_poi',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',  // Context field on relationship
    },
  ],
}

// In nitf_poi collection
{
  name: 'trips',
  type: 'join',
  collection: 'nitf_trips',
  on: 'pois.poi',  // Dot notation for nested array field
}

// Query FROM trip: "Get all POIs for this trip"
const trip = await payload.findByID({
  collection: 'nitf_trips',
  id: tripId,
  depth: 1,  // Populates pois array
})

// Query FROM POI: "Get all trips that reference this POI"
const poi = await payload.findByID({
  collection: 'nitf_poi',
  id: poiId,
  depth: 1,  // Populates trips join field
})
// Returns: { trips: { docs: [...], hasNextPage: false } }
```

**Storage Pattern:**

```typescript
// nitf_trips document
{
  id: "trip123",
  pois: [
    { poi: "poi456", notes: "Great camp spot" },  // Stores relationship + context
    { poi: "poi789", notes: "Water source" }
  ]
}

// nitf_poi document
{
  id: "poi456",
  // NO stored trips field — computed via join
}
```

**Tradeoffs:**
| Aspect | One-Way | Bidirectional (Join) |
|--------|---------|---------------------|
| Database writes | Single collection | Single collection (join is virtual) |
| Query flexibility | One direction only | Both directions |
| Admin UI | View related docs in one direction | View related docs in both directions |
| Performance | Fastest (no join overhead until depth>0) | Adds join query when depth>0 |
| Context fields | Not supported | Supported via array wrapper |

### 3. Ordered Relationships

**Use When:**

- Order matters (e.g., chapters in a book, days in a trip)
- Admin needs drag-and-drop reordering UI
- API consumers need predictable order

**Pattern: Relationship Array (Preserves Order):**

```typescript
{
  name: 'days',
  type: 'array',
  admin: { isSortable: true },  // Enables drag-and-drop
  fields: [
    {
      name: 'day',
      type: 'relationship',
      relationTo: 'rotr_days',
      required: true,
    },
  ],
}
```

**Pattern: `orderable: true` on Collections (v3 Feature):**

```typescript
// Enable manual document reordering in admin UI
export const RotrDays: CollectionConfig = {
  slug: 'rotr_days',
  orderable: true, // Uses fractional indexing
  // ...
}
```

**Ordered vs Unordered:**
| Pattern | Use Case | API Result |
|---------|----------|-----------|
| `relationship` with `hasMany: true` | Unordered set (tags, categories) | Array (insertion order, not guaranteed) |
| Relationship in `array` field | Ordered list (chapters, days) | Array (preserves order) |
| `orderable: true` on collection | Default sort order in admin lists | Query respects `_order` field |
| Join field with `orderable: true` | Reorderable joined docs | Join query returns ordered results |

### 4. Polymorphic Relationships

**Use When:**

- Relationship target varies by context
- Single field can reference multiple collection types

**Example:**

```typescript
{
  name: 'featured_content',
  type: 'relationship',
  relationTo: ['jr_posts', 'jr_technologies'],  // Multiple possible targets
  hasMany: true,
}

// Saved as:
{
  featured_content: [
    { relationTo: 'jr_posts', value: 'post123' },
    { relationTo: 'jr_technologies', value: 'tech456' },
  ]
}

// Query limitation: Cannot filter by fields inside related documents
// ?where[featured_content.value][equals]=post123  ✓ Works
// ?where[featured_content.value.title][equals]=X  ✗ Fails (field may not exist in all collections)
```

**Recommendation:** Use sparingly. Prefer typed relationships for better query capabilities.

## Access Control Simplification

### Current Pattern (Incorrect)

**Problem:** The `anyone()` helper always returns `true`, making subsequent logic dead code.

```typescript
// src/collections/users/access/anyone.ts
export const anyone = () => true // Always true!

// In collection (INCORRECT):
access: {
  read: () => {
    if (anyone()) return { status: { equals: 'published' } } // Always executes
    return true // Dead code — never reached
  }
}
```

**Effect:** Authenticated users (admin/editor) cannot see drafts in admin UI because access control filters them out.

### Recommended Pattern

**Create `src/collections/users/access/published.ts`:**

```typescript
import type { Access } from 'payload'

/**
 * Unauthenticated users: only published
 * Authenticated users: all documents
 */
const published: Access = ({ req: { user } }) => {
  if (!user) {
    return { status: { equals: 'published' } }
  }
  return true
}

export default published
```

**Usage:**

```typescript
import published from '../users/access/published'

export const NitfPosts: CollectionConfig = {
  // ...
  access: {
    read: published, // Simple, clear, correct
    create: editor,
    update: editor,
    delete: editor,
  },
}
```

### Simplified Role-Based Access Control (RBAC)

**Current State:**

- Roles: `admin`, `editor`, `user`
- Complexity: 5 access helpers, conditional logic per role

**Recommended Simplification:**

- Roles: `admin` only
- Rationale: Solo project, no multi-user collaboration needed
- Impact: Eliminates `editor.ts`, `user.ts`, and `checkrole.ts` complexity

**Migration Path:**

1. Keep `admin.ts` and `published.ts` only
2. Replace all `editor` access with `admin`
3. Remove unused helpers
4. Update `users` collection: `roles` field → single `role: 'admin'` boolean or remove entirely (auth presence = admin)

**Simplified Access Patterns:**

```typescript
// Public read, admin write
access: {
  read: published,   // Unauthenticated: published only; Authenticated: all
  create: admin,
  update: admin,
  delete: admin,
}

// Public read-only (shared resources like authors)
access: {
  read: () => true,
  create: admin,
  update: admin,
  delete: admin,
}
```

**Access Control Decision Matrix:**

| Collection Type                        | Read         | Create  | Update  | Delete  | Rationale                                        |
| -------------------------------------- | ------------ | ------- | ------- | ------- | ------------------------------------------------ |
| **Content** (posts, trips, days)       | `published`  | `admin` | `admin` | `admin` | Public read when published; admin manages drafts |
| **Metadata** (tags, destinations, poi) | `() => true` | `admin` | `admin` | `admin` | Public read always; admin manages taxonomy       |
| **Media** (site-specific)              | `() => true` | `admin` | `admin` | `admin` | Public read for serving assets; admin uploads    |
| **Shared** (authors)                   | `() => true` | `admin` | `admin` | `admin` | Public read; admin manages profiles              |
| **Auth** (users)                       | `admin`      | `admin` | `admin` | `admin` | Admin-only access to user management             |

## PostGIS Integration Patterns

### Spatial Field Architecture

**Pattern:** Store lat/lon as discrete fields, compute `geom` via hook.

```typescript
// Collection schema
fields: [
  { name: 'latitude', type: 'number' },
  { name: 'longitude', type: 'number' },
  // Note: geom column added via migration, NOT in Payload schema
]

// Hook: Auto-populate geom on save
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      if (doc.latitude != null && doc.longitude != null) {
        const db = (req.payload.db as any).drizzle
        await db.execute(sql`
          UPDATE ${collection_table}
          SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
          WHERE id = ${doc.id}
        `)
      }
      return doc
    },
  ],
}
```

**Why Not Drizzle Schema?**

- Payload's Drizzle adapter with `push: false` doesn't track `geom` column
- PostGIS types are not natively supported by Drizzle
- Migration-based approach maintains explicit schema control
- Hook pattern keeps geom in sync without schema complexity

### Collections Requiring PostGIS

| Collection          | Lat Field    | Lon Field    | Use Case                         |
| ------------------- | ------------ | ------------ | -------------------------------- |
| `nitf_posts`        | `latitude`   | `longitude`  | Optional GPS for `type: 'place'` |
| `nitf_destinations` | `center_lat` | `center_lon` | Destination map center point     |
| `nitf_poi`          | `latitude`   | `longitude`  | Map markers for trips            |
| `rotr_days`         | `latitude`   | `longitude`  | Daily GPS coordinates            |

**Note:** `nitf_trails` uses `latitude_start` / `longitude_start` but GPX bounding box is more important (stored as JSON, not geom).

### Spatial Query Pattern

**Custom Endpoint Example:**

```typescript
// In collection config
endpoints: [
  {
    path: '/nearby',
    method: 'get',
    handler: async (req) => {
      const { lat, lon, radius } = parseQueryParams(req)
      return getNearbyPosts(lat, lon, radius, req.payload.db)
    },
  },
]

// In lib/nearby.ts
export async function getNearbyPosts(lat, lon, radius, db) {
  const drizzle = (db as any).drizzle
  const result = await drizzle.execute(sql`
    SELECT * FROM nitf_posts
    WHERE geom IS NOT NULL
      AND ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
        ${radius}
      )
    ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography)
  `)
  return result.rows
}
```

## Refactoring Order (Dependencies)

Refactor in this sequence to minimize migration complexity:

### Phase 1: Fix Access Control (No DB Changes)

1. Create `published.ts` access helper
2. Replace `anyone()` usage in 5 collections:
   - `jr_posts`, `jr_projects`, `nitf_posts`, `nitf_trails`, `rotr_posts`
3. Add test: authenticated user can see drafts
4. **Verify:** Admin can see draft content in UI

### Phase 2: Merge jr_posts + jr_projects (Schema Change)

1. Add `type` field to `jr_posts` with values `['blog', 'project']`
2. Add conditional fields: `github_url`, `demo_url`, `tech_stack`
3. Migration: Copy `jr_projects` data to `jr_posts` with `type='project'`
4. Update collection config: remove `jr_projects`
5. Update frontmatter mapping: `cms_type: project` → `jr_posts` with `type='project'`
6. **Verify:** Both blogs and projects appear in single admin list with type filter

### Phase 3: Split rotr_posts → rotr_weeks + rotr_days (Schema Change)

1. Create `rotr_days` collection (date, GPS, location, body, photos, weather, mood)
2. Create `rotr_weeks` collection (summary, cover, date_range, days array)
3. Add join field to `rotr_days`: `weeks` (reverse relationship)
4. Migration: Analyze `rotr_posts` and split into weeks/days based on date clustering
5. Remove `rotr_posts` and `rotr_locations` collections
6. **Verify:** Weekly summaries link to ordered daily entries

### Phase 4: Add NITF Trip Structure (Schema Change)

1. Create `nitf_destinations` collection
2. Create `nitf_poi` collection with GPS
3. Create `nitf_trips` collection:
   - Relationship to `nitf_destinations`
   - Ordered array of `nitf_posts` (filtered by type)
   - Bidirectional join with `nitf_poi`
4. **Verify:** Trip shows POIs on map; POI shows related trips

### Phase 5: Separate Media Collections (Schema Change)

1. Create `jr_media`, `nitf_media`, `rotr_media` with `upload: true`
2. Migration: Copy `media` docs to site-specific collections based on usage
3. Update all `relationTo: 'media'` → site-specific media collection
4. Remove global `media` collection
5. **Verify:** Upload UI filtered per site; no cross-site asset pollution

### Phase 6: Separate Tag Collections (Schema Change)

1. Create `jr_tags`, `nitf_tags`, `rotr_tags`
2. Migration: Copy `tags` docs to site-specific collections based on `site` field
3. Update all `relationTo: 'tags'` → site-specific tags collection
4. Remove `site` field and `filterOptions` from relationships
5. Remove global `tags` collection
6. **Verify:** Tag picker shows only site-relevant options

### Phase 7: Extend PostGIS Coverage (Schema Enhancement)

1. Add `afterChange` hook to remaining geo collections:
   - `nitf_destinations`, `nitf_poi`, `rotr_days`
2. Migration: Add `geom` column + GIST index to each
3. Backfill `geom` for existing documents with lat/lon
4. **Verify:** Spatial queries work across all geo collections

### Phase 8: Simplify RBAC (Optional Cleanup)

1. Remove `editor` and `user` roles from `users.roles` enum
2. Update all `access: editor` → `access: admin`
3. Delete `editor.ts`, `user.ts`, `checkrole.ts`
4. **Verify:** Admin can still manage all content

## Migration Strategy

### General Principles

1. **One direction only:** Never define `down()` logic that risks data loss
2. **Idempotent operations:** Use `IF NOT EXISTS` / `IF EXISTS` for all DDL
3. **Backfill in migration:** Compute initial `geom` values when adding column
4. **Test on copy first:** Clone production DB, run migration, verify schema
5. **Separate data migrations:** Large data transformations in standalone scripts, not in schema migrations

### Example: Adding geom to a new collection

```typescript
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const db = (payload.db as any).drizzle

  // 1. Add column (idempotent)
  await db.execute(sql`
    ALTER TABLE IF EXISTS rotr_days
    ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)
  `)

  // 2. Create spatial index (idempotent)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS rotr_days_geom_idx
    ON rotr_days USING GIST (geom)
  `)

  // 3. Backfill existing records
  await db.execute(sql`
    UPDATE rotr_days
    SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND geom IS NULL
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Do NOT drop column in down() — data loss risk
  // Document the manual rollback instead:
  // "To rollback: ALTER TABLE rotr_days DROP COLUMN IF EXISTS geom"
}
```

## Performance Considerations

### Query Optimization

**Problem:** Join fields add query overhead when depth > 0.

**Solution:**

```typescript
// Expensive: Populates all join fields
const trip = await payload.findByID({
  collection: 'nitf_trips',
  id: tripId,
  depth: 2, // Populates trips.pois, trips.destination, trips.posts.author...
})

// Optimized: Disable joins when not needed
const trip = await payload.findByID({
  collection: 'nitf_trips',
  id: tripId,
  depth: 0, // No population, just IDs
})

// Optimized: Selective depth via Local API
const trip = await payload.findByID({
  collection: 'nitf_trips',
  id: tripId,
  joins: {
    pois: { limit: 10 }, // Populate join, limit results
    posts: false, // Disable specific join
  },
})
```

### Indexing Strategy

**Index These Fields:**
| Collection | Field | Why |
|-----------|-------|-----|
| All content | `status` | Public read filter: `status = 'published'` |
| All content | `slug` | Frontend routing: unique lookup by slug |
| All with dates | `published_at`, `date` | Sorting/filtering by date |
| Relationship fields | Foreign key columns | Join performance |
| Geo collections | `geom` | Spatial queries (GIST index) |

**Migration Template:**

```typescript
await db.execute(sql`
  CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table} (status)
`)
await db.execute(sql`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_slug ON ${table} (slug)
`)
```

### List View Performance

**Enable Select API:**

```typescript
export const NitfPosts: CollectionConfig = {
  admin: {
    enableListViewSelectAPI: true, // Query only visible columns
  },
}
```

**Effect:** List view queries only fetch columns shown in `defaultColumns`, not full documents. Requires hooks to explicitly `forceSelect` fields they depend on.

## Common Pitfalls

### 1. Relationship Data Assumption

**Pitfall:** Expecting `data` to contain `id` in `beforeChange` hook.

**Reality:**

- On `create`: `data` is new submission; `id` doesn't exist yet
- On `update`: `data` contains only changed fields (delta)

**Solution:**

```typescript
beforeChange: async ({ data, originalDoc, operation }) => {
  // WRONG: const id = data.id  (may be undefined)

  // RIGHT:
  const id = operation === 'update' ? originalDoc.id : undefined

  // If you need the final ID, use afterChange instead
}
```

### 2. Access Control in Access Operation

**Pitfall:** Using `doc`, `data`, or `siblingData` in access functions without checking if defined.

**Reality:** When admin panel loads, Payload runs Access Operation to determine UI state. These arguments are `undefined` during that check.

**Solution:**

```typescript
read: ({ req, doc }) => {
  if (!doc) return true // Access operation — allow for UI check

  // Now safe to use doc fields
  if (doc.status === 'published') return true
  return !!req.user
}
```

### 3. Polymorphic Relationship Queries

**Pitfall:** Trying to filter by fields inside polymorphic relationships.

**Reality:** Payload can't guarantee field exists across multiple collection types.

**Solution:**

```typescript
// WRONG: ?where[featured_content.value.title][equals]=X
// (title may not exist in all related collections)

// RIGHT: ?where[featured_content.value][equals]=postId
// (filter by ID only)

// Or: Use typed relationships instead of polymorphic
```

### 4. Join Field Storage

**Pitfall:** Expecting join fields to store data in the database.

**Reality:** Join fields are **virtual** — computed at query time via SQL joins or aggregations.

**Effect:** You cannot filter/sort collections by join field values in database queries (only in post-query processing).

### 5. Hook Execution Order

**Pitfall:** Relying on `afterChange` to modify `doc` for API response.

**Reality:** `afterChange` return value is **discarded** for the API response. Use `afterRead` to transform output.

**Solution:**

```typescript
// To modify saved data: use beforeChange
beforeChange: async ({ data }) => {
  return { ...data, computed_field: calculateValue(data) }
}

// To modify API response: use afterRead
afterRead: async ({ doc }) => {
  return { ...doc, formatted_date: formatDate(doc.date) }
}
```

## Architecture Anti-Patterns

### ❌ Single Global Media Collection with Site Filter

**Why Avoid:**

- Requires `filterOptions: { site: { equals: 'x' } }` on every relationship
- Admin UI shows all sites' assets (cluttered)
- Risk of cross-site asset references
- Upload validation cannot be site-specific

**Do Instead:** Site-specific media collections (`jr_media`, `nitf_media`, `rotr_media`)

### ❌ Over-Splitting Collections

**Example:** `blog_posts`, `news_posts`, `article_posts` when they share 90% of fields and only differ by `type`.

**Why Avoid:**

- Duplicate schema definitions
- Duplicate access control
- Duplicate admin customizations
- API consumers need multiple endpoints for similar content

**Do Instead:** Single collection with `type` discriminator field.

### ❌ Storing Join Field Data

**Example:** Manually maintaining `posts[]` array on `category` to mirror `category` field on `posts`.

**Why Avoid:**

- Dual writes (must update both sides)
- Data can desync if one update fails
- Join field handles this automatically

**Do Instead:** Store relationship in one direction, use join field for reverse.

### ❌ Bidirectional Relationships Everywhere

**Why Avoid:**

- Join fields add query overhead when populated
- Not all relationships need reverse lookup
- Over-engineering for simple one-way references

**Do Instead:** Use join fields only when admin UI needs "where is this used?" or API needs reverse queries.

### ❌ Custom Geospatial Types in Drizzle Schema

**Why Avoid:**

- Payload's postgres adapter with `push: false` doesn't track custom types
- PostGIS geometry types not natively supported
- Schema drift between Drizzle and actual DB

**Do Instead:** Raw SQL migrations for PostGIS, discrete lat/lon fields in schema, `afterChange` hook to sync `geom`.

## Sources

**Official Documentation (HIGH Confidence):**

- [Collection Configs](https://payloadcms.com/docs/configuration/collections) — Collection organization patterns, admin options
- [Access Control](https://payloadcms.com/docs/access-control/overview) — RBAC patterns, access operation behavior
- [Relationship Field](https://payloadcms.com/docs/fields/relationship) — One-way relationships, polymorphic patterns, storage formats
- [Join Field](https://payloadcms.com/docs/fields/join) — Bidirectional relationships, virtual field behavior, query patterns
- [Collection Hooks](https://payloadcms.com/docs/hooks/collections) — Hook execution order, arguments, use cases
- [Multi-Tenancy](https://payloadcms.com/multi-tenancy) — Namespace patterns, tenant isolation strategies

**Codebase Analysis (MEDIUM Confidence):**

- Current collection structure (`src/collections/`) — Namespace prefix pattern observed
- Shared resources pattern (`Tags.ts`, `Authors.ts`) — Site discriminator field usage
- Access control implementation (`users/access/`) — RBAC helper patterns
- PostGIS integration (`lib/nearby.ts`, migration `20260303_214307`) — Spatial query patterns

**Project Documentation (HIGH Confidence):**

- `.planning/PROJECT.md` — Refinement goals, collection merge/split decisions
- `AGENTS.md` — Known issues (anyone() bug, PostGIS gaps, access control problems)

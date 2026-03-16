# Phase 5: Nerd in the Forest Trip Structure - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add flagship NITF trip content collections: `nitf_trips` (trip narratives), `nitf_destinations` (broad geographic areas), `nitf_poi` (GPS map pins), `nitf_poi_types` (lookup for POI type), and `nitf_places` (rich content layer for POIs). Update `nitf_posts` to clean schema. Drop `nitf_locations` and `nitf_waypoints` (replaced by nitf_poi). Add PostGIS geom to nitf_destinations and nitf_poi.

This phase does NOT touch `nitf_trails`, `nitf_tags`, `nitf_media`, or the Obsidian sync pipeline.

</domain>

<decisions>
## Implementation Decisions

### Collections added in this phase

- **`nitf_trips`** — new, flagship trip narrative collection
- **`nitf_destinations`** — new, broad geographic area (national park, forest, region)
- **`nitf_poi`** — new, GPS map pin (replaces nitf_locations)
- **`nitf_poi_types`** — new, admin-managed lookup (same pattern as rotr_place_types)
- **`nitf_places`** — new, rich content layer for a POI (1:1 with nitf_poi)

### Collections removed in this phase

- **`nitf_locations`** — dropped clean (no data to preserve); replaced by nitf_poi
- **`nitf_waypoints`** — dropped clean (no data to preserve); trail waypoints out of scope

### nitf_posts updates (existing collection)

- Type options trimmed to: `review`, `recipe`, `article` (drop adventure/tips/general/place)
- Drop `review_meta` and `recipe_meta` JSON fields
- Drop `seo_title`, `seo_description`, `reading_time_minutes` fields
- Drop `trail` relationship field
- Drop `locations` array field (replaced by reference to nitf_poi — see below)
- Keep: status, title, slug, type, excerpt, body, cover_image, author, tags, published_at
- `nitf_posts.locations[]` array: update `relationTo` from `nitf_locations` → `nitf_poi`

### nitf_trips fields

- `status` — select: draft / published
- `title` — text, required
- `slug` — text, required, unique
- `body` — textarea (markdown)
- `destination` — relationship to `nitf_destinations` (single, not array)
- `cover_image` — upload, relationTo: nitf_media
- `date_range` — group with `start_date` (date) + `end_date` (date)
- `tags` — relationship to nitf_tags, hasMany: true
- `pois` — relationship array to `nitf_poi`, hasMany: true (ordered — this is the ordered side of the bidirectional relationship)
- Access: read: published, create/update/delete: admin

### nitf_destinations fields

- `status` — select: draft / published
- `name` — text, required
- `slug` — text, required, unique
- `description` — textarea (markdown)
- `latitude` — number (for PostGIS geom)
- `longitude` — number (for PostGIS geom)
- `featured_image` — upload, relationTo: nitf_media
- `links` — array with fields: `url` (text) + `label` (text)
- `difficulty` — select: easy / moderate / hard / expert (same scale as nitf_trails)
- `season_info` — textarea
- PostGIS: geom column + afterChange hook (GEO-02)
- Access: read: published, create/update/delete: admin

### nitf_poi fields

- `name` — text, required
- `latitude` — number, required
- `longitude` — number, required
- `type` — relationship to `nitf_poi_types` (admin-managed lookup, not hardcoded select)
- `trips` — relationship array to `nitf_trips`, hasMany: true (reverse lookup side — not ordered)
- `place` — relationship to `nitf_places` (optional 1:1 link to enriched content)
- PostGIS: geom column + afterChange hook (GEO-03)
- Access: read: published, create/update/delete: admin

### nitf_poi_types fields

- `name` — text, required
- `slug` — text, required, unique
- Same pattern as rotr_place_types (admin-managed lookup)
- Initial types to create via admin: camp-fire, lean-to, viewpoint, summit, lake, trailhead, cabin, other
- Access: read: () => true, create/update/delete: admin

### nitf_places fields

- `status` — select: draft / published (independent of parent POI)
- `title` — text, required
- `slug` — text, required, unique
- `body` — textarea (markdown)
- `cover_image` — upload, relationTo: nitf_media
- `tags` — relationship to nitf_tags, hasMany: true
- `poi` — relationship to `nitf_poi` (the parent GPS pin this enriches)
- Access: read: published, create/update/delete: admin

### Bidirectional relationship: nitf_trips ↔ nitf_poi

- Ordered array: `nitf_trips.pois[]` — this is where the trip-specific POI order is managed
- Reverse lookup: `nitf_poi.trips[]` — admin can see all trips referencing a POI; not ordered

### Admin display defaults

- nitf_trips: useAsTitle: title, defaultColumns: [title, destination, status, date_range]
- nitf_destinations: useAsTitle: name, defaultColumns: [name, difficulty, status]
- nitf_poi: useAsTitle: name, defaultColumns: [name, type, status]
- nitf_poi_types: useAsTitle: name
- nitf_places: useAsTitle: title, defaultColumns: [title, poi, status]

### Migration

- Drop `nitf_locations` — clean slate, no data migration
- Drop `nitf_waypoints` — clean slate, no data migration
- Create `nitf_trips` table
- Create `nitf_destinations` table
- Create `nitf_poi` table
- Create `nitf_poi_types` table
- Create `nitf_places` table
- Add geom columns (raw SQL) for nitf_destinations and nitf_poi
- Update nitf_posts: drop columns (type options update doesn't need migration, just schema change)
- Migration must have tested down() function

### Claude's Discretion

- Exact SQL for migration up()/down()
- Whether nitf_posts type column can be altered or needs clean drop/recreate
- Whether nitf_posts locations array field update requires a migration or just collection config change
- Exact defaultSort settings for each collection
- Whether to add published_at date field to nitf_trips and nitf_places

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `NitfPosts.ts` — existing collection being updated; PostGIS hook pattern reusable
- `NitfTrails.ts` — reference for PostGIS afterChange hook (latitude/longitude → geom)
- `NitfTags.ts` / `src/collections/reddyontheroad/RotrPlaceTypes.ts` — template for nitf_poi_types (name + slug lookup)
- `src/collections/users/access/published.ts` + `admin.ts` — access helpers
- `src/migrations/20260316_rotr_days_split.ts` — recent migration as reference for up()/down() pattern

### Established Patterns

- PostGIS afterChange hook: `if (lat != null && lon != null) → sessions registry db access → ST_SetSRID UPDATE`
- Migration: clean slate (drop/recreate) — established in Phase 1, reused in Phase 4
- Access control: `read: published, create: admin, update: admin, delete: admin`
- Lookup collections (name + slug): rotr_place_types pattern
- Ordered array relationships: Payload's array/relationship with hasMany

### Integration Points

- `src/payload.config.ts` — register new collections, update NitfPosts, unregister NitfLocations/NitfWaypoints
- `src/migrations/index.ts` — add new migration
- `src/collections/nerdintheforest/NitfPosts.ts` — update type options, remove fields, update locations relationTo
- PostGIS: nitf_destinations and nitf_poi tables need geom columns (raw SQL)

</code_context>

<specifics>
## Specific Ideas

- `nitf_places` is the "enriched POI" concept: a POI is the GPS pin, a place is the blog-style content about that pin. 1:1 optional relationship.
- Destination = broad natural area (e.g. "Nuuksio National Park", "Repovesi", "Koli") — not a town or specific GPS point
- Trip has ONE destination (the main area), not many
- Ordered pois managed on the trip side; POI just has a reverse lookup to see which trips reference it
- nitf_poi_types initial seed values (create via admin after deploy): camp-fire, lean-to, viewpoint, summit, lake, trailhead, cabin, other

</specifics>

<deferred>
## Deferred Ideas

- nitf_trails → nitf_trips relationship — flagged for a future phase (trails may eventually relate to trips or POIs)
- GPS boundary polygons for destinations (ADV-02 in v2 requirements) — out of scope for this phase
- nitf_places photo gallery (photos array) — user decided title/slug/body/cover_image is sufficient for now

</deferred>

---

*Phase: 05-nerd-in-the-forest-trip-structure*
*Context gathered: 2026-03-16*

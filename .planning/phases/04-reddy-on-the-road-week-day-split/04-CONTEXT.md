# Phase 4: Reddy on the Road Week/Day Split - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the existing `rotr_posts` monolithic collection with a single `rotr_days` collection (daily travel diary entries). Remove `rotr_locations` and `rotr_posts` entirely. Add `rotr_place_types` as a small lookup collection for location categorization. `rotr_tags` and `rotr_media` (from Phase 3) remain.

**Scope change from original roadmap:** The originally-planned `rotr_weeks` collection has been dropped. There is no week-level hierarchy — days stand alone. This simplifies the relationship model and eliminates the ordered bidirectional relationship requirement.

</domain>

<decisions>
## Implementation Decisions

### Collections in this phase

- **`rotr_days`** — new, primary collection (replaces `rotr_posts`)
- **`rotr_place_types`** — new, small lookup collection (same pattern as tags: name + slug)
- **`rotr_posts`** — removed (dropped in migration)
- **`rotr_locations`** — removed (dropped in migration)

### rotr_days fields

- `status` — select: draft / published (consistent with all other collections)
- `title` — text, required
- `date` — date field
- `latitude` — number (for PostGIS geom auto-population via afterChange hook)
- `longitude` — number (for PostGIS geom auto-population via afterChange hook)
- `location_name` — text (e.g. "Lisbon, Portugal")
- `location_type` — relationship to `rotr_place_types` collection
- `weather` — text (free text, e.g. "Sunny and 28°C")
- `temperature` — number (separate field)
- `summary` — textarea (short excerpt for cards/previews)
- `content` — textarea (full markdown body)
- `tags` — relationship to `rotr_tags`, hasMany: true
- No mood field (removed by user decision)
- No photos array (removed by user decision)

### rotr_place_types fields

- `name` — text, required
- `slug` — text, required, unique
- Same pattern as `rotr_tags` (simple lookup collection)

### Admin display

- `rotr_days` default columns: title, date, location_name, status
- `rotr_days` default sort: newest date first (descending by date)
- `useAsTitle`: title

### PostGIS

- `rotr_days` gets a `geom` column with `afterChange` hook (same pattern as NitfPosts, NitfTrails, RotrPosts)
- Hook: if latitude and longitude are set, execute ST_SetSRID(ST_MakePoint(lon, lat), 4326) UPDATE
- Use transaction-aware db access (sessions registry pattern established in Phase 2)

### Migration

- **Drop `rotr_posts`** — clean slate, no data migration (user decision)
- **Drop `rotr_locations`** — clean slate, no data migration
- **Create `rotr_days`** table with all new fields
- **Create `rotr_place_types`** table
- Migration must have a tested `down()` function (drops rotr_days and rotr_place_types, recreates rotr_posts and rotr_locations)
- Note: `push: false` — all schema changes require explicit migrations

### Access control

- `rotr_days`: read: published, create/update/delete: admin (same pattern as all other collections)
- `rotr_place_types`: read: published, create/update/delete: admin

### Claude's Discretion

- Exact SQL for migration up()/down()
- Migration file naming convention
- Test fixture structure for integration tests
- Whether to add `published_at` date field (not explicitly requested)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `RotrPosts.ts` — existing collection being replaced; use as reference for PostGIS hook pattern and access control imports
- `src/collections/users/access/published.ts` + `admin.ts` — access helpers to import
- `src/collections/reddyontheroad/RotrTags.ts` — exact template for `rotr_place_types` collection (same name+slug pattern)
- `src/collections/reddyontheroad/RotrMedia.ts` — existing media collection (not changed in this phase)
- `src/migrations/20260315_split_media_and_tags.ts` — recent migration as reference for up()/down() pattern
- `tests/int/` — existing integration test suite location

### Established Patterns

- PostGIS afterChange hook: check if lat/lng != null → use transaction-aware db access (sessions registry) → execute ST_SetSRID UPDATE
- Migration: clean slate (drop/recreate) — established in Phase 1
- Access control: `read: published, create: admin, update: admin, delete: admin`
- Tags pattern: `{ slug, admin: { useAsTitle: 'name' }, fields: [name, slug] }` — use for rotr_place_types

### Integration Points

- `src/payload.config.ts` — register `RotrDays` and `RotrPlaceTypes`, unregister `RotrPosts` and `RotrLocations`
- `src/migrations/index.ts` — add new migration
- PostGIS: `rotr_days` table needs geom column (raw SQL, not in Drizzle schema)

</code_context>

<specifics>
## Specific Ideas

- User decision: No weeks hierarchy — rotr_days are standalone diary entries
- User decision: No mood field ("I don't like the idea")
- User decision: No photos array on days
- Weather = two fields: `weather` (text) + `temperature` (number) — not a single structured field
- `rotr_place_types` is the same pattern as `rotr_tags` — admin-managed lookup, no hardcoded select options

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-reddy-on-the-road-week-day-split*
*Context gathered: 2026-03-16*

# Project Research Summary

**Project:** Basecamp CMS - Multi-domain Content Hub
**Domain:** Payload CMS v3 Schema Refinement with PostGIS
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

This research focuses on **refining an existing Payload CMS v3 application** serving three personal domains (jake-reddy.com, nerdintheforest.com, reddyontheroad.com). The infrastructure (Payload, PostgreSQL, PostGIS, Next.js) is proven and deployed. The refinement addresses collection organization, relationship patterns, and access control issues discovered during initial implementation.

The recommended approach uses **namespace-prefixed collections** (`jr_`, `nitf_`, `rotr_`) for site-specific content, **simplified RBAC** (admin-only access), and **dual-storage pattern for GPS data** (discrete lat/lon fields + PostGIS `geom` column auto-populated via hooks). The stack requires **no new dependencies** — all refinements use Payload v3's native field system and PostgreSQL's existing PostGIS extension.

Three critical bugs exist in the current implementation: (1) `anyone()` access control helper breaks draft visibility for admin users, (2) PostGIS `geom` column not auto-populated on new documents, and (3) migration mismatches where `down()` references tables `up()` never populates. All are fixable without data loss. The primary risk is breaking existing relationships during collection merges — mitigated by careful migration planning and data transformation testing.

## Key Findings

### Recommended Stack

The existing stack is complete and requires no additions. The refinement focuses on **better patterns within Payload's field system** rather than new technologies.

**Core technologies (already in place):**

- **Payload CMS v3** — Headless CMS with PostgreSQL adapter (push: false) requires explicit migrations for all schema changes
- **PostgreSQL 16 + PostGIS 3.4** — Spatial extension for GPS queries (ST_DWithin, ST_Distance) via `geom` geometry columns
- **Next.js frontends** — Three separate Next.js sites read from REST API; content rendered client-side from markdown
- **Docker + DigitalOcean Droplet** — Single instance deployment; site isolation via collection namespaces, not multi-tenancy

**Key stack decisions:**

- **Markdown storage:** Use `textarea` field, not `richText` — Obsidian writes markdown, frontends render markdown, CMS is passthrough
- **GPS coordinates:** Dual pattern — `latitude`/`longitude` as `number` fields + PostGIS `geom` column populated via `afterChange` hook
- **Relationship types:** `relationship` field for forward references, `join` field for bidirectional queries (virtual, no storage overhead)
- **Ordered lists:** `array` field with `isSortable: true` for drag-and-drop reordering (week days, trip POIs)

**Migration constraint:** `push: false` on postgres adapter means Drizzle never auto-syncs. Every schema change requires `npx payload migrate:create` followed by `npx payload migrate`. PostGIS columns added outside Drizzle schema via raw SQL.

### Expected Features

**Must have (table stakes):**

- Site-specific collections — Each domain has unique content types (already implemented with `jr_`, `nitf_`, `rotr_` prefixes)
- Draft + publish workflow — Status field with access control (published for public, all docs for authenticated)
- Relationship fields — Posts → tags, posts → author, trips → POIs (Payload native, polymorphic support)
- REST API — Auto-generated endpoints for all collections (no GraphQL needed for sync workflow)
- Upload collections — Media storage per site (needs splitting from single `media` to `jr_media`, `nitf_media`, `rotr_media`)
- GPS coordinates — Numeric lat/lon fields with PostGIS geom for spatial queries (extends to 5 more tables)
- Taxonomy collections — Site-specific tags/categories (needs splitting from shared `tags` to site-specific)

**Should have (competitive differentiators):**

- Bidirectional relationships (Join fields) — Trip → POIs AND POI → trips without data duplication
- PostGIS spatial queries — `/nearby` endpoint for map features, distance calculations (currently only `nitf_posts`, extend to 5 more tables)
- Ordered relationships — Manual sorting of days within weeks, POIs within trips (array fields preserve order)
- Per-site media collections — Prevents cross-site asset pollution, clearer admin UX
- Tech stack collection — Reusable technology references with icons for jake-reddy.com projects
- Image auto-resize — Sharp library generates thumbnails/cards on upload via `imageSizes` config

**Defer (v2+):**

- GPS boundaries on destinations — Point coordinates sufficient for initial release, polygon bounding boxes can come later
- Focal point refinement — Default center crop acceptable, advanced cropping controls not needed yet
- Scheduled publish — Manual publish preferred over automation, reduces complexity
- Version browsing UI — Payload versions enabled for draft/publish only, history browser not needed
- Multi-user roles — Solo project, admin-only access sufficient (remove editor/user role complexity)

### Architecture Approach

The optimal architecture uses **namespace-prefixed collections with site discriminators only for shared resources** (authors, users). Content collections remain site-specific to prevent schema drift and maintain clear ownership boundaries.

**Major components:**

1. **Site-specific content collections** — `jr_posts` (merge with `jr_projects`), `nitf_trips` (new), `nitf_posts`, `rotr_weeks` (new), `rotr_days` (new) — each has unique schema, no forced field sharing
2. **Site-specific taxonomy** — `jr_tags`, `jr_technologies`, `nitf_tags`, `nitf_destinations`, `nitf_poi`, `rotr_tags` — prevents admin UI pollution from irrelevant options
3. **Site-specific media** — `jr_media`, `nitf_media`, `rotr_media` with separate upload directories — eliminates need for `filterOptions` on every relationship
4. **Shared resources** — `authors` (cross-site entity), `users` (auth collection) — true global entities with no site discriminator
5. **Access control layer** — Simplified to `admin` role only; `published.ts` helper for "authenticated sees all, public sees published" pattern
6. **PostGIS integration** — Discrete lat/lon fields in Payload schema + `geom` column added via migration + `afterChange` hook syncs on save

**Key patterns:**

- **Relationship direction:** Use one-way `relationship` field where only forward query needed; add `join` field on target for bidirectional queries
- **Ordered vs. unordered:** Relationship arrays (`array` field with relationship inside) preserve order; bare `relationship` with `hasMany: true` is unordered set
- **GPS dual storage:** Lat/lon fields (Obsidian compatibility, simple data model) + geom column (spatial queries) — hook keeps them in sync
- **Access control simplification:** Replace complex role checks with simple `if (!user) return { status: 'published' }; return true` pattern

**Architecture refinements:**

- Merge `jr_posts` + `jr_projects` into single collection with `type` discriminator (share >70% of fields)
- Split `rotr_posts` → `rotr_weeks` + `rotr_days` (week = compilation; day = atomic entry with ordered relationship)
- Add `nitf_trips` collection with ordered days array and bidirectional POI relationships
- Separate shared `media` → site-specific collections (access control + admin UX)
- Separate shared `tags` → site-specific collections (no vocabulary overlap between sites)

### Critical Pitfalls

1. **Mixing `push: true` and migrations** — Database corruption if Drizzle push mode and explicit migrations both modify schema. Keep `push: false`, use ONLY migrations even in dev. Already configured correctly in basecamp-cms.

2. **Access control without user context** — `anyone()` helper always returns `true`, making "authenticated sees all" logic dead code. Result: admin users can't see drafts. Fix: Create `published.ts` helper that checks `if (!user) return { status: 'published' }; return true`. Affects 5 collections.

3. **PostGIS `geom` not auto-populated** — Migration backfills existing rows but new inserts have `geom = NULL`, breaking spatial queries. Add `afterChange` hook to every geo collection: `UPDATE table SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326) WHERE id = doc.id`. Affects 6 tables (currently only 1 has hook).

4. **Migration `down()` mismatch** — Current PostGIS migration lists 6 tables in `down()` but `geoTables` array in `up()` only has 1. Rollback will fail. Keep arrays in sync or derive `down()` list from `up()` config.

5. **Breaking relationships during refactor** — Renaming collection slug breaks all relationship fields pointing to it. Write data migration to update `_rels` tables: `UPDATE table_rels SET collection_slug = 'new_slug' WHERE collection_slug = 'old_slug'`. Critical for merging `jr_posts` + `jr_projects`.

6. **Forgetting TypeScript types after schema changes** — Payload doesn't auto-regenerate. Run `npx payload generate:types` after EVERY collection/field change and commit `payload-types.ts` to git. Frontend gets stale types otherwise.

7. **Over-engineered RBAC for solo projects** — Three roles (admin, editor, user) add complexity but solo project needs only admin. Simplify to binary: authenticated = admin = full access. Remove `editor.ts`, `user.ts`, `checkrole.ts` helpers.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Access Control & Schema Consolidation

**Rationale:** Fix blocking bug (admin can't see drafts) before any other work. Merge/split collections to match domain boundaries. No external integrations, low risk.

**Delivers:**

- Admin users can see draft content in UI
- `jr_posts` and `jr_projects` merged into single collection with `type` discriminator
- Simplified RBAC (admin role only, remove editor/user)
- Updated tests for authenticated + unauthenticated access

**Addresses (from FEATURES.md):**

- Draft + publish workflow (fix broken access control)
- Site-specific collections (consolidate for simpler admin UX)

**Avoids (from PITFALLS.md):**

- Access control without user context (create `published.ts` helper)
- Over-engineered RBAC (simplify to admin-only)
- Stale TypeScript types (regenerate after changes)

**No deeper research needed** — Patterns documented in official Payload docs.

---

### Phase 2: PostGIS Extension & Auto-Population

**Rationale:** PostGIS already installed but incomplete. Extend to remaining tables and fix auto-population so spatial queries work for new content. Dependency for trip/location features.

**Delivers:**

- `afterChange` hooks on all 6 geo collections
- Migration adds `geom` column + GIST index to 5 remaining tables
- Spatial queries work across `nitf_destinations`, `nitf_poi`, `rotr_days`
- Updated spatial test asserts distance ordering (not 0 results)

**Addresses (from FEATURES.md):**

- PostGIS spatial queries (extend from 1 table to 6)
- GPS coordinates (auto-populate geom on insert/update)

**Avoids (from PITFALLS.md):**

- PostGIS not auto-populated (add hooks)
- Migration down() mismatch (fix geoTables array)

**Uses (from STACK.md):**

- PostGIS 3.4 spatial queries (ST_DWithin, ST_Distance)
- Payload afterChange hooks (execute raw SQL)

**No deeper research needed** — PostGIS patterns already verified in `lib/nearby.ts`.

---

### Phase 3: Site-Specific Media & Tags

**Rationale:** Shared media/tags add admin UX friction and cross-site contamination risk. Split before adding more collections. Simple data migration (copy rows, filter by site).

**Delivers:**

- `jr_media`, `nitf_media`, `rotr_media` collections with separate upload directories
- `jr_tags`, `nitf_tags`, `rotr_tags` collections (no shared vocabulary)
- Migration copies data from shared collections, filters by usage
- Updated relationship fields point to site-specific collections

**Addresses (from FEATURES.md):**

- Per-site media collections (prevents cross-site asset usage)
- Taxonomy collections (site-specific filtering)
- Upload collections (separate directories)

**Avoids (from PITFALLS.md):**

- Breaking relationships during refactor (preserve relationship data in migration)
- Stale TypeScript types (regenerate after collection changes)

**Implements (from ARCHITECTURE.md):**

- Namespace strategy (site-specific collections for all non-shared resources)

**No deeper research needed** — Standard data migration pattern.

---

### Phase 4: Reddy on the Road Week/Day Split

**Rationale:** `rotr_posts` conflates two content types. Week = compilation summary; day = atomic diary entry. Split enables ordered relationship (week contains days).

**Delivers:**

- `rotr_weeks` collection (summary, cover photo, date range, ordered days array)
- `rotr_days` collection (date, GPS, location, body, photos, weather, mood)
- Bidirectional join (week → days, day → weeks)
- Migration analyzes `rotr_posts`, splits based on date clustering

**Addresses (from FEATURES.md):**

- Ordered relationships (days within weeks)
- Bidirectional relationships (join fields)

**Avoids (from PITFALLS.md):**

- Breaking relationships (preserve data in split)
- Field type changes without data migration (structured split logic)

**Implements (from ARCHITECTURE.md):**

- Collection boundaries by domain (week vs. day distinction)
- Ordered relationship pattern (array field for days)

**Research needed:** Phase-specific research to analyze `rotr_posts` data and determine split heuristics (date gaps, content length, photo count?).

---

### Phase 5: Nerd in the Forest Trip Structure

**Rationale:** Flagship content type for NITF. Complex: ordered days, bidirectional POIs, destination relationship. Depends on PostGIS extension (Phase 2).

**Delivers:**

- `nitf_destinations` collection (region metadata, GPS center)
- `nitf_poi` collection (waypoints with GPS, type enum)
- `nitf_trips` collection (ordered days array, bidirectional POI relationships, destination link)
- Join fields on `nitf_poi` (trips that reference this POI)
- Map views show POIs; POI detail shows related trips

**Addresses (from FEATURES.md):**

- Bidirectional relationships (trips ↔ POIs via join fields)
- Ordered relationships (days within trip)
- POI type enum (camp-fire, lean-to, viewpoint, water)

**Avoids (from PITFALLS.md):**

- Field type changes (start with correct schema)
- Over-normalizing simple data (POI metadata inline, not separate collection)

**Implements (from ARCHITECTURE.md):**

- NerdInTheForest.com domain architecture (trips flagship content)
- Relationship pattern (one-way + join for bidirectional)

**Research needed:** Phase-specific research to validate trip structure (what metadata belongs on trip vs. POI vs. destination?).

---

### Phase 6: Jake Reddy Tech Stack Collection

**Rationale:** Simple addition after core refactors. Tech stack is inline array now; extract to collection for reusability and icon management.

**Delivers:**

- `jr_technologies` collection (name, icon upload, category, description)
- Relationship from `jr_posts` (when `type='project'`)
- Admin UI shows tech stack icons on projects

**Addresses (from FEATURES.md):**

- Tech stack collection (reusable tech references)
- GitHub/demo URL fields (already on jr_posts)

**Avoids (from PITFALLS.md):**

- Over-normalizing (this IS reusable — used across multiple projects)

**Implements (from ARCHITECTURE.md):**

- Site-specific metadata collection (jr\_ prefix)

**No deeper research needed** — Straightforward collection + relationship.

---

### Phase 7: Obsidian → CMS Pipeline

**Rationale:** Final integration. All schema refinements complete, safe to build sync workflow. GitHub Action parses frontmatter, upserts content, writes cms_id back to vault.

**Delivers:**

- GitHub Action (`obsidian-sync.yml`) triggered on vault push
- Frontmatter parser extracts fields, maps to CMS collections
- Upsert logic (create if cms_id missing, update if present)
- Write cms_id back to frontmatter, commit to vault
- API key auth (cms-writer secret in GitHub Actions)

**Addresses (from FEATURES.md):**

- Frontmatter-driven sync (Obsidian vault structure drives CMS)

**Avoids (from PITFALLS.md):**

- Obsidian sync overwrites published (sync creates drafts, manual publish as gate)
- API key stored in frontend (server-side secret only)

**Research needed:** Phase-specific research to map Obsidian vault structure to CMS fields, handle GPS parsing (`location: "lat, lon"`), determine sync scope (which folders sync to which collections?).

---

### Phase Ordering Rationale

1. **Fix bugs first** (Phase 1: Access Control) — Access control bug blocks admin usage, must fix before adding complexity
2. **Extend infrastructure** (Phase 2: PostGIS) — Foundation for location features in Phases 4-5
3. **Isolate sites** (Phase 3: Media/Tags Split) — Prevents cross-site pollution before adding more collections
4. **Simpler domain first** (Phase 4: ROTR) — Week/day split is cleaner than trip structure; validate patterns before complex NITF
5. **Complex relationships** (Phase 5: NITF Trips) — Depends on PostGIS + pattern validation from Phase 4
6. **Simple additions** (Phase 6: Tech Stack) — Low-risk after major refactors
7. **Integration last** (Phase 7: Obsidian Sync) — Schema must be stable before automation touches it

**Dependencies:**

- Phase 5 depends on Phase 2 (PostGIS extension for POI GPS queries)
- Phase 7 depends on Phases 1-6 (stable schema for sync mapping)
- Phases 1-3 are independent (can parallelize if needed)

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 4 (ROTR Week/Day Split):** Analyze `rotr_posts` data to determine split heuristics. How to identify week boundaries? What metadata belongs on week vs. day?
- **Phase 5 (NITF Trip Structure):** Validate trip data model. What's the relationship between trip, destination, POI? Do trips have multiple destinations or one per trip?
- **Phase 7 (Obsidian Sync):** Map Obsidian vault folders to CMS collections. Parse frontmatter GPS format. Determine sync scope (full vault or specific folders?).

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Access Control):** Well-documented Payload access control patterns, fix already specified in AGENTS.md
- **Phase 2 (PostGIS Extension):** PostGIS patterns verified in existing `lib/nearby.ts`, just extend to more tables
- **Phase 3 (Media/Tags Split):** Standard data migration (copy rows with filtering), no unique challenges
- **Phase 6 (Tech Stack):** Straightforward collection + relationship, no domain-specific patterns

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                             |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | **HIGH**   | Existing stack verified, all refinements use Payload v3 native features, no new dependencies                                                      |
| Features     | **HIGH**   | Table stakes from official Payload docs, differentiators from existing codebase patterns, anti-features based on project constraints              |
| Architecture | **HIGH**   | Namespace pattern observed in current code, relationship patterns from official docs, access control simplification based on solo-project context |
| Pitfalls     | **HIGH**   | Critical bugs documented in AGENTS.md with verified fixes, performance traps from official docs, security patterns from Payload best practices    |

**Overall confidence:** **HIGH**

### Gaps to Address

**Schema split heuristics (Phase 4):** How to programmatically split `rotr_posts` into weeks + days? Research suggests date clustering but exact logic needs analysis of actual data. **Mitigation:** Phase-specific research to inspect data distribution, identify week boundaries based on date gaps or metadata patterns.

**Trip data model validation (Phase 5):** What's the correct granularity for trips, destinations, POIs? Research suggests trips have ordered days and bidirectional POI relationships, but destination cardinality unclear. **Mitigation:** Phase-specific research to validate with sample trip data, possibly from Obsidian vault structure.

**Obsidian frontmatter mapping (Phase 7):** Which Obsidian frontmatter fields map to which CMS fields? GPS format parsing logic? **Mitigation:** Phase-specific research to document vault structure, create mapping table (frontmatter field → CMS collection field), write parsing functions with tests.

**Migration testing strategy:** Migrations tested on empty dev database, not production-sized datasets. Performance unknowns for 100+ document collections. **Mitigation:** Export production DB before each phase, test migration on local copy, measure query performance after migration.

**Spatial query optimization:** PostGIS GIST indexes created but not verified with EXPLAIN output. Unknown if queries use indexes or fall back to sequential scan. **Mitigation:** Phase 2 should include EXPLAIN query analysis, verify index usage, add additional indexes if needed.

## Sources

### Primary (HIGH confidence)

- [Payload CMS v3 Official Docs](https://payloadcms.com/docs) — Collection configs, field types, relationship patterns, access control, hooks, migrations
- [PostGIS 3.4 Documentation](https://postgis.net/docs/) — Spatial queries (ST_DWithin, ST_Distance), geometry types, GIST indexes
- `AGENTS.md` (project file) — Known issues: anyone() bug, PostGIS gaps, migration mismatches (documented with fix strategies)
- `PROJECT.md` (project file) — Requirements: collection structure, domain boundaries, Obsidian sync workflow
- Existing codebase (`src/collections/`, `src/migrations/`, `tests/`) — Namespace patterns, PostGIS integration, access helpers

### Secondary (MEDIUM confidence)

- Payload GitHub Issues #15820, #15733, #15594 — Type generation quirks, form builder conflicts (inform but not blocking)
- Payload Multi-Tenancy Guide — Namespace strategies, tenant isolation patterns (adapted for single-tenant use case)
- Community patterns (inferred) — Site-specific vs. shared collection trade-offs, access control simplification for solo projects

### Tertiary (LOW confidence)

- Obsidian vault structure (not directly inspected) — Frontmatter format, folder organization (needs validation in Phase 7)

---

**Research completed:** 2026-03-11
**Ready for roadmap:** Yes

**Next steps:** Load this summary as context for roadmap creation. Phase suggestions above inform roadmap structure. Research flags identify which phases need `/gsd-research-phase` during planning.

# Roadmap: Basecamp CMS Refinement

**Project:** Basecamp CMS - Multi-domain Content Hub
**Created:** 2026-03-11
**Granularity:** Standard (5-8 phases)
**Coverage:** 48/48 v1 requirements mapped ✓

## Core Value

The CMS must align perfectly with how content is authored in Obsidian — every collection, field, and relationship should reduce friction between vault structure and frontend needs, never add ceremony.

## Phases

- [x] **Phase 1: Access Control & Schema Consolidation** - Fix admin draft visibility + merge jr collections (completed 2026-03-14)
- [ ] **Phase 2: PostGIS Extension & Auto-Population** - Extend spatial queries to all 6 geo tables
- [x] **Phase 3: Site-Specific Media & Tags** - Split shared collections into namespace-prefixed versions (completed 2026-03-15)
- [ ] **Phase 4: Reddy on the Road Week/Day Split** - Restructure rotr_posts into weeks + days with ordered relationships
- [ ] **Phase 5: Nerd in the Forest Trip Structure** - Add trips, destinations, POIs with bidirectional relationships
- [ ] **Phase 6: Jake Reddy Tech Stack Collection** - Extract tech stack to reusable collection with icons
- [ ] **Phase 7: Production Refinement** - Final testing, type generation, deployment validation

## Phase Details

### Phase 1: Access Control & Schema Consolidation

**Goal**: Admin users can manage draft content and Jake Reddy collections are consolidated for simpler workflow

**Depends on**: Nothing (first phase)

**Requirements**: ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05, SCHEMA-01, SCHEMA-02, SCHEMA-03, TEST-01, TEST-04

**Success Criteria** (what must be TRUE):

1. Admin user can view draft posts in admin panel collections list
2. Admin user can edit draft posts without publishing
3. Unauthenticated API request returns only published posts (draft posts filtered)
4. Authenticated API request returns all posts including drafts
5. `jr_posts` collection contains both blog posts and project showcase content (legacy jr_projects data preserved)
6. Users collection has only admin role (editor/user roles removed)

**Plans**: 3 plans in 2 waves

Plans:

- [x] 01-01-PLAN.md — Fix access control bug (create published.ts and admin.ts helpers)
- [x] 01-02-PLAN.md — Update collection schemas (merge JrPosts, simplify Users, add tests)
- [ ] 01-03-PLAN.md — Create and apply migration (clean slate schema consolidation)

---

### Phase 2: PostGIS Extension & Auto-Population

**Goal**: Spatial queries work for all geographic collections with auto-populated geometry columns

**Depends on**: Phase 1 (clean foundation before geographic extensions)

**Requirements**: GEO-01, GEO-05, GEO-06, TEST-03, TEST-04, TEST-05

**Success Criteria** (what must be TRUE):

1. New nitf_post with latitude/longitude has geom column populated automatically
2. Spatial query `/nearby?lat=X&lon=Y` returns results from all 6 geo collections
3. Spatial queries return results ordered by distance from query point
4. All 6 geo collections have geom columns with spatial indexes
5. Migration down() successfully rolls back all PostGIS changes to all 6 tables

**Plans**: 6 plans in 5 waves

Plans:

- [x] 02-00-PLAN.md — Create test scaffolds (Wave 0 - Nyquist compliance)
- [x] 02-01-PLAN.md — Extend PostGIS migration to 6 tables with test coverage
- [x] 02-02-PLAN.md — Add PostgreSQL triggers for geom auto-population (replaced by 02-04)
- [x] 02-03-PLAN.md — Strengthen spatial tests and regenerate types
- [x] 02-04-PLAN.md — Implement afterChange hooks for geom auto-population (gap closure)
- [ ] 02-05-PLAN.md — Fix remaining 2 test failures (update hook timing, migration down test)

---

### Phase 3: Site-Specific Media & Tags

**Goal**: Each site has isolated media and tag collections preventing cross-site contamination

**Depends on**: Phase 1 (access control must work before splitting collections)

**Requirements**: SITESPEC-01, SITESPEC-02, SITESPEC-03, SITESPEC-04, SITESPEC-05, TEST-02, TEST-04, TEST-05

**Success Criteria** (what must be TRUE):

1. Admin uploading to jr_posts only sees jr_media in media picker (nitf/rotr media hidden)
2. Admin tagging nitf_post only sees nitf_tags in tag picker (jr/rotr tags hidden)
3. Legacy media records migrated to correct site-specific collection based on usage
4. Legacy tag records migrated to correct site-specific collection based on usage
5. All relationship fields point to site-specific collections (no broken references)

**Plans**: 5 plans in 4 waves

Plans:

- [ ] 03-00-PLAN.md — Create Wave 0 test scaffold (Nyquist compliance)
- [ ] 03-01-PLAN.md — Create 6 site-specific collection files and register in payload.config.ts
- [ ] 03-02-PLAN.md — Update consumer post collections (cover_image + tags relationTo fields)
- [ ] 03-03-PLAN.md — Write data migration (split media/tags tables, update _rels, tested down())
- [ ] 03-04-PLAN.md — Regenerate TypeScript types and verify clean build

---

### Phase 4: Reddy on the Road Week/Day Split

**Goal**: rotr_days standalone diary collection replaces rotr_posts, with PostGIS geom and rotr_place_types lookup

**Depends on**: Phase 2 (rotr_days needs PostGIS geom), Phase 3 (needs rotr_media + rotr_tags)

**Requirements**: ROTR-01, ROTR-02, ROTR-03, ROTR-04, ROTR-05, ROTR-06, GEO-04, TEST-02, TEST-04, TEST-05

**Success Criteria** (what must be TRUE):

1. Admin can create rotr_day with GPS coordinates, weather, temperature, and location_type
2. rotr_days geom column auto-populated via BEFORE INSERT OR UPDATE trigger when lat/lon provided
3. rotr_days.location_type relationship populates as rotr_place_type object at depth:1
4. rotr_days.tags relationship populates as array at depth:1
5. rotr_posts and rotr_locations tables dropped (clean slate migration)
6. Migration down() fully reverses all changes

**Plans**: 4 plans in 4 waves

Plans:

- [ ] 04-00-PLAN.md — Create Wave 0 test scaffold (Nyquist compliance)
- [ ] 04-01-PLAN.md — Create RotrDays + RotrPlaceTypes collections, update payload.config.ts
- [ ] 04-02-PLAN.md — Write migration (drop old tables, create new tables, add geom trigger)
- [ ] 04-03-PLAN.md — Implement integration tests and regenerate TypeScript types

---

### Phase 5: Nerd in the Forest Trip Structure

**Goal**: NITF flagship content (trips) with ordered POIs, destinations, and spatial queries

**Depends on**: Phase 2 (POIs need PostGIS), Phase 3 (needs nitf_media + nitf_tags), Phase 4 (validates ordered relationship pattern)

**Requirements**: NITF-01, NITF-02, NITF-03, NITF-04, NITF-05, NITF-06, NITF-07, GEO-02, GEO-03, TEST-02, TEST-04

**Success Criteria** (what must be TRUE):

1. Admin can create nitf_trip with destination, cover image, date range, and ordered POIs
2. Admin can reorder POIs within trip via drag-and-drop
3. Viewing nitf_poi in admin shows all trips that reference it (bidirectional join visible)
4. nitf_post with type="place" can store optional latitude/longitude
5. Spatial query returns nitf_destinations within radius of query point
6. Map view can query all POIs within bounding box for trip route display

**Plans**: TBD

---

### Phase 6: Jake Reddy Tech Stack Collection

**Goal**: Project technology stacks are reusable entities with icons instead of inline text

**Depends on**: Phase 1 (jr_posts must exist), Phase 3 (needs jr_media for icons)

**Requirements**: JR-01, JR-02, JR-03, JR-04, TEST-04

**Success Criteria** (what must be TRUE):

1. Admin can create jr_technology with name, icon upload, category, and description
2. Admin editing jr_post (type=project) can select multiple technologies via relationship field
3. Technology icons display in admin UI when viewing project posts
4. API response for jr_post includes populated technologies array with icon URLs

**Plans**: TBD

---

### Phase 7: Production Refinement

**Goal**: CMS is production-ready with complete test coverage and generated types

**Depends on**: Phase 1-6 (all schema changes complete)

**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05

**Success Criteria** (what must be TRUE):

1. All integration tests pass (11+ tests covering all new collections)
2. TypeScript types file (payload-types.ts) reflects final schema
3. All migrations have tested down() functions that successfully rollback
4. CI/CD pipeline builds and pushes Docker image to GHCR
5. Production deployment completes without errors at cms.jake-reddy.com

**Plans**: TBD

---

## Progress

| Phase                                    | Plans Complete | Status      | Completed  |
| ---------------------------------------- | -------------- | ----------- | ---------- |
| 1. Access Control & Schema Consolidation | 3/3            | Complete    | 2026-03-14 |
| 2. PostGIS Extension & Auto-Population   | 4/6            | Gap Closure |            |
| 3. Site-Specific Media & Tags            | 5/5            | Complete    | 2026-03-15 |
| 4. Reddy on the Road Week/Day Split      | 2/4 | In Progress|  |
| 5. Nerd in the Forest Trip Structure     | 0/TBD          | Not started | -          |
| 6. Jake Reddy Tech Stack Collection      | 0/TBD          | Not started | -          |
| 7. Production Refinement                 | 0/TBD          | Not started | -          |

## Dependencies

```
Phase 1 (Access Control)
  ↓
Phase 2 (PostGIS) ← must complete before Phase 4, 5
  ↓
Phase 3 (Media/Tags) ← must complete before Phase 4, 5, 6
  ↓
Phase 4 (ROTR) ← validates patterns for Phase 5
  ↓
Phase 5 (NITF)
  ↓
Phase 6 (Tech Stack) ← can run parallel with Phase 5
  ↓
Phase 7 (Production)
```

**Critical path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 7

**Parallelization opportunities**: Phase 6 can run concurrently with Phase 5

## Research Flags

Phases requiring deeper research during planning:

- **Phase 5**: Validate trip data model (trip → destination cardinality, POI metadata boundaries)

Phases with standard patterns (skip research):

- **Phase 1**: Access control patterns documented in AGENTS.md
- **Phase 2**: PostGIS extension follows existing `lib/nearby.ts` patterns
- **Phase 3**: Standard data migration (copy + filter)
- **Phase 4**: All patterns exist verbatim in the codebase (researched 2026-03-16)
- **Phase 6**: Straightforward collection + relationship
- **Phase 7**: Standard testing + deployment validation

---

_Roadmap created: 2026-03-11_
_Last updated: 2026-03-16_

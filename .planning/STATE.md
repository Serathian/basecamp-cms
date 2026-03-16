---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-16T07:44:46.427Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 18
  completed_plans: 14
---

# Project State: Basecamp CMS Refinement

**Last updated:** 2026-03-16
**Project phase:** Phase 4 - In Progress

## Project Reference

**Core Value**: The CMS must align perfectly with how content is authored in Obsidian — every collection, field, and relationship should reduce friction between vault structure and frontend needs, never add ceremony.

**Current Focus**: Splitting rotr_posts into rotr_days collection (daily travel diary entries), removing rotr_posts and rotr_locations.

## Current Position

**Milestone**: v1 Refinement
**Phase**: 4 - ROTR Week/Day Split
**Plan**: 1 of 4 plans complete (04-00 Wave 0 scaffold done; 04-01 RotrDays collection, 04-02 migration, 04-03 test implementation remaining)
**Status**: In Progress

**Progress**: [████████░░] 78% (14 of 18 plans complete)

**Blockers**: None

## Performance Metrics

### Roadmap Level

- **Total phases**: 7
- **Phases complete**: 2
- **Phases in progress**: 0
- **Phases remaining**: 5

### Current Phase

- **Phase**: 2 - PostGIS Extension & Auto-Population
- **Plans**: 4 total (02-00, 02-01, 02-02, 02-03)
- **Plans complete**: 4/4
- **Requirements covered**: 6 (GEO-01, GEO-05, GEO-06, TEST-03, TEST-04, TEST-05)
- **Requirements complete**: 5/6 (GEO-01, GEO-05, GEO-06, TEST-03, TEST-04 complete; TEST-05 remaining)

### Velocity

- **Phases completed**: 2 (Phase 1: Access Control & Schema Consolidation, Phase 2: PostGIS Extension & Auto-Population)
- **Plans completed**: 7 total (3 from Phase 1, 4 from Phase 2)
- **Average phase duration**: 2.5 days (5 days across 2 phases, from 2026-03-11 to 2026-03-15)
- **Estimated completion**: ~12 days remaining (5 phases × 2.5 days/phase)

## Accumulated Context

### Key Decisions

| Date       | Decision                                                                                                                                                                 | Rationale                                                                                                              | Impact             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 2026-03-11 | 7 phases for standard granularity                                                                                                                                        | Matches research recommendations, natural requirement groupings                                                        | Roadmap structure  |
| 2026-03-11 | Fix access control first (Phase 1)                                                                                                                                       | Admin can't see drafts - blocking bug must be fixed before other work                                                  | Phase ordering     |
| 2026-03-11 | PostGIS before content splits (Phase 2)                                                                                                                                  | Geographic features depend on working spatial queries                                                                  | Phase ordering     |
| 2026-03-11 | ROTR before NITF (Phase 4 → 5)                                                                                                                                           | Week/day pattern simpler than trip structure, validates approach                                                       | Phase ordering     |
| 2026-03-12 | Use published.ts helper that checks user presence first, returning true for authenticated users (see all content) and status filter for anonymous users (published only) | Fixes broken anyone() pattern while maintaining correct access semantics                                               | Phase 1 Plan 01-01 |
| 2026-03-12 | Simplify admin.ts to use Boolean(user) instead of checkRole since only one admin role exists                                                                             | Reduces complexity without changing behavior                                                                           | Phase 1 Plan 01-01 |
| 2026-03-12 | Merged jr_projects into jr_posts with 7 optional project fields (github_url, demo_url, tech_stack, highlights, challenges, outcomes, featured)                           | Simplifies admin UX and eliminates duplicate patterns                                                                  | Phase 1 Plan 01-02 |
| 2026-03-12 | Simplified Users collection to single admin role, removed hasMany and enum array (editor/user roles eliminated)                                                          | Single-user CMS doesn't need complex RBAC                                                                              | Phase 1 Plan 01-02 |
| 2026-03-14 | Clean slate migration: DROP tables instead of complex ALTER statements                                                                                                   | Simpler, less error-prone, acceptable for dev environment                                                              | Phase 1 Plan 01-03 |
| 2026-03-14 | body field nullable to match collection config (not required)                                                                                                            | Collection defines optional textarea, migration must match schema                                                      | Phase 1 Plan 01-03 |
| 2026-03-14 | Wave 0 test scaffolds with .todo() markers satisfy Nyquist Rule                                                                                                          | Test files exist before implementation plans run, preventing circular dependency                                       | Phase 2 Plan 02-00 |
| 2026-03-15 | Use PostgreSQL BEFORE INSERT OR UPDATE triggers instead of Payload afterChange hooks for geom auto-population                                                            | Triggers provide better transaction visibility, no async timing issues, standard database pattern for computed columns | Phase 2 Plan 02-02 |
| 2026-03-15 | Removed early-exit guards from spatial test to enforce PostGIS trigger reliability                                                                                       | Test should fail explicitly if geom is NULL or migration didn't run, no silent pass with warnings                      | Phase 2 Plan 02-03 |
| 2026-03-15 | Fixed checkRole to handle single 'admin' role instead of role arrays                                                                                                     | Aligns with Phase 1 Users collection simplification (single admin role)                                                | Phase 2 Plan 02-03 |
| 2026-03-15 | Use it.todo() instead of it.skip() for Wave 0 test stubs                                                                                                                 | todo stubs appear as pending in Vitest output, creating a visible inventory; skip would hide them from the summary      | Phase 3 Plan 03-00 |
| 2026-03-15 | Authors.avatar uses polymorphic relationTo array for all 3 site media collections                                                                                        | Authors is shared across all sites so avatar must accept uploads from any site's media collection                       | Phase 3 Plan 03-01 |
| 2026-03-15 | Removed filterOptions: { site: ... } from post tag relationships — collection slug is the discriminator                                                                  | With site-specific tag collections, filtering by site field is redundant and the old site field won't exist             | Phase 3 Plan 03-01 |
| 2026-03-15 | 03-02 consumer post field updates were completed as part of 03-01 payload.config.ts commit — no additional changes required                                               | Registering new collections and updating consumer references are tightly coupled; doing them together avoids broken intermediate state | Phase 3 Plan 03-02 |
| 2026-03-15 | payload_locked_documents_rels must also be updated when renaming collection slugs | Payload generates queries referencing site-specific FK column names (jr_media_id, jr_tags_id, etc.) in this table | Phase 3 Plan 03-03 |
| 2026-03-15 | vitest fileParallelism: false required when integration tests call migration down() | Shared DB state not safe for concurrent file execution when migration lifecycle tests are included | Phase 3 Plan 03-03 |
| 2026-03-16 | Wave 0 scaffold import of 20260316_rotr_days_split (non-existent migration) causes file-level skip in Vitest — expected and acceptable at Wave 0 | Migration file created in 04-02; stubs still reported as pending in Vitest summary | Phase 4 Plan 04-00 |
| Phase 03-site-specific-media-tags P00 | 5 | 1 tasks | 1 files |
| Phase 03-site-specific-media-tags P01 | 15 | 2 tasks | 14 files |
| Phase 03-site-specific-media-tags P02 | 1min | 1 tasks | 0 files |
| Phase 03-site-specific-media-tags P03 | 6min | 2 tasks | 4 files |
| Phase 03-site-specific-media-tags P03 | 6 | 2 tasks | 4 files |
| Phase 03-site-specific-media-tags P04 | 1 | 1 tasks | 0 files |
| Phase 04-reddy-on-the-road-week-day-split P00 | 1 | 1 tasks | 1 files |

### Critical Information

**Known Issues (from AGENTS.md)**:

1. `anyone()` access helper breaks draft visibility (Phase 1 fixes)
2. PostGIS `geom` not auto-populated on insert (Phase 2 fixes)
3. Migration down() mismatch - references 6 tables but only populates 1 (Phase 2 fixes)
4. Only `nitf_posts` has PostGIS geom, 5 more tables need it (Phase 2 fixes)

**Schema Changes Planned**:

- Merge: `jr_posts` + `jr_projects` → `jr_posts` (Phase 1)
- Split: `media` → `jr_media`, `nitf_media`, `rotr_media` (Phase 3)
- Split: `tags` → `jr_tags`, `nitf_tags`, `rotr_tags` (Phase 3)
- Split: `rotr_posts` → `rotr_weeks` + `rotr_days` (Phase 4)
- Add: `nitf_trips`, `nitf_destinations`, `nitf_poi` (Phase 5)
- Add: `jr_technologies` (Phase 6)
- Remove: `rotr_locations` (Phase 4)

**Constraints**:

- `push: false` on DB adapter - all schema changes require explicit migrations
- PostGIS `geom` columns managed via raw SQL (outside Drizzle schema)
- Markdown bodies must remain markdown (clients render to HTML)
- No `migrate:fresh` in production (drops all data)

### Session Continuity

**Last action**: Completed Plan 04-00 (Wave 0 test scaffold for rotr_days — 10 it.todo() stubs) - 2026-03-16
**Next action**: Proceed to Phase 4 Plan 04-01 (RotrDays and RotrPlaceTypes collection implementation)

**Context for next session**:

- **Phase 1 COMPLETE**: All 3 plans executed successfully (01-01 Access Control, 01-02 Schema Consolidation, 01-03 Migration)
- Plan 01-01 commits: 5b549a9 (published helper), f4b3947 (admin simplification), 69c42ed (collection updates), 793543a (metadata)
- Plan 01-02 commits: aaf4233 (JrPosts merge), 76c6c76 (Users simplification), eb4cb1a (JrProjects removal), 63c18e4 (auth tests)
- Plan 01-03 commits: e2300b8 (migration), f585658/96604d7/1a3db92/e1b23b6 (SQL fixes), 72bbb0c (roles column), e4ead9e (schema fixes)
- **Phase 2 COMPLETE**: All 4 plans executed successfully (PostGIS Extension & Auto-Population)
- Plan 02-00 commits: 5c63444 (migration test scaffold), e54288d (geom hooks test scaffold)
- Plan 02-01 commits: 5f7bd6a (TDD RED - failing migration tests), c7bb61e (TDD GREEN - migration extends all 6 tables), 71d2bb9 (metadata)
- Plan 02-02 commits: 5f7bd6a (TDD RED - failing geom tests, shared with 02-01), 21bad90 (PostgreSQL triggers for 6 tables)
- Plan 02-03 commits: fbb57b6 (remove early-exit guards from spatial test), 211a028 (regenerate types and fix blocking type errors)
- **Key achievements**:
  - PostgreSQL triggers auto-populate geom columns for all 6 geographic collections
  - Spatial queries tested end-to-end with explicit failure modes
  - TypeScript types regenerated and all blocking type errors resolved
  - Phase 1 role simplification (single admin) fully propagated through access helpers
- **Blockers resolved**: JrProjects removal and single admin role changes from Phase 1 caused type errors in Phase 2 - fixed via auto-deviation Rule 3
- **Phase 3 COMPLETE**: All 5 plans executed successfully (Site-Specific Media & Tags split)
- Plan 03-00 commits: Wave 0 test scaffolds with .todo() markers
- Plan 03-01 commits: 6 site-specific collections registered, Authors.avatar polymorphic, consumer posts updated
- Plan 03-02 commits: no-op (completed as part of 03-01)
- Plan 03-03 commits: b05e6b4 (migration up/down), ae6ea11 (tests + migration fix + fileParallelism)
- Plan 03-04 commits: 517ea2c (type verification — types already current from 03-01)
- **Phase 4 IN PROGRESS**: Wave 0 scaffold complete
- Plan 04-00 commits: a71c5ab (Wave 0 test scaffold — 10 it.todo() stubs for rotr_days)

## Open Questions

1. **Phase 4 (ROTR Split)**: What heuristics determine week boundaries in existing `rotr_posts` data? Date gaps? Content length? Photo count?
   - **Resolution needed by**: Phase 4 planning
   - **Research required**: Yes - analyze actual `rotr_posts` data

2. **Phase 5 (NITF Trips)**: What's the cardinality of trip → destination relationship? One destination per trip or many?
   - **Resolution needed by**: Phase 5 planning
   - **Research required**: Yes - inspect Obsidian vault trip structure

3. **TypeScript types**: Do frontends import from `payload-types.ts` or have separate type definitions?
   - **Resolution needed by**: Phase 1 execution
   - **Check**: `../jake-reddy.com/` frontend imports

## Todos

### Immediate (Next Session)

- [x] ~~Run `/gsd-plan-phase 1` to create execution plans for access control + schema consolidation~~ ✓ Complete
- [x] ~~Execute Plan 01-01 (Access Control Bug Fix)~~ ✓ Complete
- [x] ~~Execute Plan 01-02 (Schema Consolidation)~~ ✓ Complete
- [x] ~~Execute Plan 01-03 (Create Migration)~~ ✓ Complete
- [x] ~~Run `/gsd-plan-phase 2` to create execution plans for PostGIS gap fixes~~ ✓ Complete
- [x] ~~Execute Phase 2 plans (PostGIS Extension & Auto-Population)~~ ✓ Complete
- [ ] Run `/gsd-plan-phase 3` to create execution plans for Shared Collections Split

### Upcoming (Later Phases)

- [ ] Phase 4 planning: Research week/day split heuristics before creating plans
- [ ] Phase 5 planning: Research trip data model before creating plans
- [ ] Phase 7: Document deployment procedure for production rollout

### Backlog (v2)

- [ ] Obsidian sync GitHub Action (separate project, not in roadmap)
- [ ] Frontend integration (CMS only serves data)
- [ ] Image focal point support (ADV-01)
- [ ] GPS boundary polygons for destinations (ADV-02)

## Risk Register

| Risk                                   | Probability | Impact | Mitigation                                                           | Owner               |
| -------------------------------------- | ----------- | ------ | -------------------------------------------------------------------- | ------------------- |
| Breaking relationships during refactor | Medium      | High   | Write careful migrations with relationship table updates             | Phase 1, 3, 4 plans |
| Data loss in collection splits         | Low         | High   | Test migrations on production DB export before applying              | All schema phases   |
| Spatial query performance degradation  | Low         | Medium | EXPLAIN analysis in Phase 2, add indexes if needed                   | Phase 2 plans       |
| Stale TypeScript types after changes   | High        | Low    | Run `npx payload generate:types` after every schema change           | All phases          |
| Obsidian sync overwrites published     | Medium      | Medium | Sync creates drafts only, manual publish required (already designed) | v2 (out of scope)   |

## Metrics & KPIs

### Success Metrics

- **100% requirement coverage**: All 48 v1 requirements mapped to phases ✓
- **Zero breaking changes**: All migrations preserve existing data
- **Test coverage**: Integration tests for all new collections/relationships
- **Type safety**: payload-types.ts regenerated after each schema change

### Quality Indicators

- All integration tests pass after each phase
- Migrations tested with both up() and down()
- Admin UI shows correct filtered options for site-specific collections
- API responses include populated relationships (not just IDs)

---

_State initialized: 2026-03-11_
_Ready for Phase 1 planning_

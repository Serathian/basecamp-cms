---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: '2026-03-14T17:35:49.112Z'
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
---

# Project State: Basecamp CMS Refinement

**Last updated:** 2026-03-14
**Project phase:** Phase 2 - In Progress

## Project Reference

**Core Value**: The CMS must align perfectly with how content is authored in Obsidian — every collection, field, and relationship should reduce friction between vault structure and frontend needs, never add ceremony.

**Current Focus**: Extending PostGIS spatial support to all 6 geographic collections with auto-population hooks for seamless spatial queries.

## Current Position

**Milestone**: v1 Refinement
**Phase**: 2 - PostGIS Extension & Auto-Population
**Plan**: 02-01 (Extend Migration) - Next
**Status**: In Progress (1 of 4 plans complete)

**Progress**: [███░░░░░░░░░░░░░░░░░] 14% (Phase 1 of 7 complete, Phase 2 started)

**Blockers**: None

## Performance Metrics

### Roadmap Level

- **Total phases**: 7
- **Phases complete**: 0
- **Phases in progress**: 0
- **Phases remaining**: 7

### Current Phase

- **Phase**: 2 - PostGIS Extension & Auto-Population
- **Plans**: 4 total (02-00, 02-01, 02-02, 02-03)
- **Plans complete**: 1/4
- **Requirements covered**: 6 (GEO-01, GEO-05, GEO-06, TEST-03, TEST-04, TEST-05)
- **Requirements complete**: 0/6

### Velocity

- **Phases completed**: 1 (Phase 1: Access Control & Schema Consolidation)
- **Plans completed**: 4 total (3 from Phase 1, 1 from Phase 2)
- **Average phase duration**: 3 days (from 2026-03-11 to 2026-03-14)
- **Estimated completion**: ~18 days remaining (6 phases × 3 days/phase)

## Accumulated Context

### Key Decisions

| Date       | Decision                                                                                                                                                                 | Rationale                                                                        | Impact             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------ |
| 2026-03-11 | 7 phases for standard granularity                                                                                                                                        | Matches research recommendations, natural requirement groupings                  | Roadmap structure  |
| 2026-03-11 | Fix access control first (Phase 1)                                                                                                                                       | Admin can't see drafts - blocking bug must be fixed before other work            | Phase ordering     |
| 2026-03-11 | PostGIS before content splits (Phase 2)                                                                                                                                  | Geographic features depend on working spatial queries                            | Phase ordering     |
| 2026-03-11 | ROTR before NITF (Phase 4 → 5)                                                                                                                                           | Week/day pattern simpler than trip structure, validates approach                 | Phase ordering     |
| 2026-03-12 | Use published.ts helper that checks user presence first, returning true for authenticated users (see all content) and status filter for anonymous users (published only) | Fixes broken anyone() pattern while maintaining correct access semantics         | Phase 1 Plan 01-01 |
| 2026-03-12 | Simplify admin.ts to use Boolean(user) instead of checkRole since only one admin role exists                                                                             | Reduces complexity without changing behavior                                     | Phase 1 Plan 01-01 |
| 2026-03-12 | Merged jr_projects into jr_posts with 7 optional project fields (github_url, demo_url, tech_stack, highlights, challenges, outcomes, featured)                           | Simplifies admin UX and eliminates duplicate patterns                            | Phase 1 Plan 01-02 |
| 2026-03-12 | Simplified Users collection to single admin role, removed hasMany and enum array (editor/user roles eliminated)                                                          | Single-user CMS doesn't need complex RBAC                                        | Phase 1 Plan 01-02 |
| 2026-03-14 | Clean slate migration: DROP tables instead of complex ALTER statements                                                                                                   | Simpler, less error-prone, acceptable for dev environment                        | Phase 1 Plan 01-03 |
| 2026-03-14 | body field nullable to match collection config (not required)                                                                                                            | Collection defines optional textarea, migration must match schema                | Phase 1 Plan 01-03 |
| 2026-03-14 | Wave 0 test scaffolds with .todo() markers satisfy Nyquist Rule                                                                                                          | Test files exist before implementation plans run, preventing circular dependency | Phase 2 Plan 02-00 |

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

**Last action**: Completed Plan 02-00 (Test Infrastructure) - 2026-03-14
**Next action**: Execute Plan 02-01 (Extend PostGIS Migration)

**Context for next session**:

- **Phase 1 COMPLETE**: All 3 plans executed successfully (01-01 Access Control, 01-02 Schema Consolidation, 01-03 Migration)
- Plan 01-01 commits: 5b549a9 (published helper), f4b3947 (admin simplification), 69c42ed (collection updates), 793543a (metadata)
- Plan 01-02 commits: aaf4233 (JrPosts merge), 76c6c76 (Users simplification), eb4cb1a (JrProjects removal), 63c18e4 (auth tests)
- Plan 01-03 commits: e2300b8 (migration), f585658/96604d7/1a3db92/e1b23b6 (SQL fixes), 72bbb0c (roles column), e4ead9e (schema fixes)
- **Phase 2 STARTED**: Plan 02-00 (Wave 0 test scaffolds) complete
- Plan 02-00 commits: 5c63444 (migration test scaffold), e54288d (geom hooks test scaffold)
- Test scaffolds created: tests/int/migration.int.spec.ts (4 todo), tests/int/geom-hooks.int.spec.ts (8 todo)
- Ready for Plan 02-01: Extend PostGIS migration to 6 tables with test coverage

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
- [ ] Run `/gsd-plan-phase 2` to create execution plans for PostGIS gap fixes

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

# Project State: Basecamp CMS Refinement

**Last updated:** 2026-03-12
**Project phase:** Phase 1 - In Progress

## Project Reference

**Core Value**: The CMS must align perfectly with how content is authored in Obsidian — every collection, field, and relationship should reduce friction between vault structure and frontend needs, never add ceremony.

**Current Focus**: Refining existing Payload CMS v3 collections to match domain boundaries across three personal websites (jake-reddy.com, nerdintheforest.com, reddyontheroad.com). Fixing known bugs (access control, PostGIS gaps) and restructuring collections for cleaner admin UX and better Obsidian vault alignment.

## Current Position

**Milestone**: v1 Refinement
**Phase**: 1 - Access Control & Schema Consolidation
**Plan**: 01-01 (Access Control Bug Fix) - Complete
**Status**: In Progress (1 of 3 plans complete)

**Progress**: [██░░░░░░░░░░░░░░░░░░] 5% (Phase 1 of 7)

**Blockers**: None

## Performance Metrics

### Roadmap Level

- **Total phases**: 7
- **Phases complete**: 0
- **Phases in progress**: 0
- **Phases remaining**: 7

### Current Phase

- **Phase**: 1 - Access Control & Schema Consolidation
- **Plans**: 3 total (01-01, 01-02, 01-03)
- **Plans complete**: 1/3
- **Requirements covered**: 10 (ACCESS-01 through ACCESS-05, SCHEMA-01 through SCHEMA-03, TEST-01, TEST-04)
- **Requirements complete**: 4 (ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04)

### Velocity

- **Phases completed**: 0
- **Average phase duration**: N/A (no phases completed)
- **Estimated completion**: TBD (after Phase 1 planning)

## Accumulated Context

### Key Decisions

| Date       | Decision                                                                                                                                                                 | Rationale                                                                | Impact             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------ |
| 2026-03-11 | 7 phases for standard granularity                                                                                                                                        | Matches research recommendations, natural requirement groupings          | Roadmap structure  |
| 2026-03-11 | Fix access control first (Phase 1)                                                                                                                                       | Admin can't see drafts - blocking bug must be fixed before other work    | Phase ordering     |
| 2026-03-11 | PostGIS before content splits (Phase 2)                                                                                                                                  | Geographic features depend on working spatial queries                    | Phase ordering     |
| 2026-03-11 | ROTR before NITF (Phase 4 → 5)                                                                                                                                           | Week/day pattern simpler than trip structure, validates approach         | Phase ordering     |
| 2026-03-12 | Use published.ts helper that checks user presence first, returning true for authenticated users (see all content) and status filter for anonymous users (published only) | Fixes broken anyone() pattern while maintaining correct access semantics | Phase 1 Plan 01-01 |
| 2026-03-12 | Simplify admin.ts to use Boolean(user) instead of checkRole since only one admin role exists                                                                             | Reduces complexity without changing behavior                             | Phase 1 Plan 01-01 |

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

**Last action**: Completed Plan 01-01 (Access Control Bug Fix) - 2026-03-12
**Next action**: Execute Plan 01-02 (JR Collection Merge) or Plan 01-03 (Users Collection Simplification)

**Context for next session**:

- Phase 1 Plan 01-01 complete: Fixed `anyone()` access bug, all 5 collections now use `published.ts` helper
- Commits: 5b549a9 (published helper), f4b3947 (admin simplification), 69c42ed (collection updates), 793543a (metadata)
- Requirements complete: ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04 ✓
- Remaining Phase 1 work: Collection merge (01-02) + users simplification (01-03)
- Test status: All integration tests passing (11/11)

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
- [ ] Execute Plan 01-02 (JR Collection Merge)
- [ ] Execute Plan 01-03 (Users Collection Simplification)

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

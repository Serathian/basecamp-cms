# Basecamp CMS Refinement

## What This Is

A Payload CMS v3 application that serves as a sync target and query layer between an Obsidian vault and three frontend websites. Content is authored in Obsidian with frontmatter, synced to the CMS via GitHub Actions, then served to client sites via REST API. The CMS transforms markdown notes into queryable, structured data while preserving the markdown body for client-side rendering.

## Core Value

The CMS must align perfectly with how content is authored in Obsidian — every collection, field, and relationship should reduce friction between vault structure and frontend needs, never add ceremony.

## Requirements

### Validated

- ✓ Payload CMS v3 with PostgreSQL + PostGIS — existing
- ✓ REST API serving all collections — existing
- ✓ Admin UI for content management — existing
- ✓ JWT-based authentication — existing
- ✓ Docker deployment to DigitalOcean Droplet — existing
- ✓ Integration tests with Vitest — existing
- ✓ Explicit migrations (push: false) — existing

### Active

**Jake-Reddy.com (Personal Promotion Site):**

- [ ] Single `jr_posts` collection (replaces jr_posts + jr_projects split)
- [ ] Fields: title, slug, body (markdown), featured_image, publish_date, tags, github_url, demo_url, tech_stack
- [ ] `jr_tags` collection (site-specific)
- [ ] `jr_technologies` collection (name, icon, category, description)
- [ ] All content static, served via API

**NerdInTheForest.com (Outdoor Adventure Blog):**

- [ ] `nitf_trips` collection: title, slug, body (markdown), destination, POIs array, cover_image, date_range, tags
- [ ] `nitf_posts` collection: title, slug, body (markdown), type (review/place/recipe), tags, optional GPS for places
- [ ] `nitf_destinations` collection: name, description (markdown), GPS boundary/center, featured_image, links, difficulty, season_info
- [ ] `nitf_poi` collection: name, GPS, type (camp-fire/lean-to/etc.), trips array (many-to-many), bidirectional with trips
- [ ] `nitf_tags` collection (site-specific)
- [ ] `nitf_media` collection (site-specific uploads)
- [ ] PostGIS spatial queries for map display

**ReddyOnTheRoad.com (2022 Travel Diary):**

- [ ] `rotr_weeks` collection: title, summary (markdown), cover_photo, date_range, days array (ordered), tags
- [ ] `rotr_days` collection: date, GPS, location_name, location_type, markdown_body, photos array, weather, mood, week link
- [ ] `rotr_tags` collection (site-specific)
- [ ] `rotr_media` collection (site-specific uploads)
- [ ] Remove `rotr_locations` (GPS on days is sufficient)
- [ ] Bidirectional week ↔ days relationships

**Shared:**

- [ ] `authors` collection (you + potential co-authors)
- [ ] `users` collection simplified to admin-only role (remove editor/user roles)
- [ ] All content syncs from Obsidian with `cms_status: ready` → CMS draft → manual publish in admin
- [ ] `jr_media`, `nitf_media`, `rotr_media` replace single shared media collection

**Access Control Refinement:**

- [ ] Fix `anyone()` misuse in published content filters (5 collections affected — see AGENTS.md issue #1)
- [ ] Create `published.ts` access helper for authenticated draft visibility
- [ ] Simplify RBAC to admin-only (remove editor/user complexity)

**PostGIS Fixes:**

- [ ] Auto-populate `geom` on insert via `afterChange` hook (AGENTS.md issue #2)
- [ ] Extend PostGIS to remaining geo tables: `nitf_destinations`, `nitf_poi`, `rotr_days` (AGENTS.md issue #3)

### Out of Scope

- Obsidian sync pipeline (GitHub Action) — separate project
- Frontend implementation — CMS only serves data
- Real-time content updates — static sync workflow
- Multi-user collaboration features — admin-only CMS
- OAuth/SSO login — email/password sufficient
- GraphQL API optimization — REST is primary interface

## Context

**Existing System:**

- Built with minimal instructions; agent interpreted requirements
- 12 collections currently defined, some misaligned with actual needs
- Tests passing (11/11), 3 migrations applied, codebase mapped
- Known issues documented in AGENTS.md (access control bug, PostGIS gaps)

**Content Flow:**

- Obsidian vault (`../Obsidian/`) contains all source content
- Frontmatter: `cms_status: ready`, `cms_site: jr|nitf|rotr`, `cms_type: [content type]`
- GitHub Action (future) syncs changed notes → Payload API
- CMS stores as draft, admin publishes manually
- Frontends query REST API, render markdown client-side

**Tech Environment:**

- Payload CMS v3, Next.js App Router, PostgreSQL 16 + PostGIS 3.4
- Deployed to DigitalOcean Droplet via Docker
- CI/CD via GitHub Actions (build + push to GHCR)
- Local dev: `docker compose up` (postgres + app)

**Vault Structure Relevant to CMS:**

- `01_Diary/` → rotr_days (2022 trip)
- `02_Trips/` → nitf_trips
- `04_Projects/` → jr_posts (projects)
- Frontmatter drives collection routing, markdown body is preserved

## Constraints

- **Schema Evolution**: `push: false` on DB adapter — all schema changes require explicit migrations
- **PostGIS**: `geom` columns managed outside Drizzle via raw SQL migrations
- **Markdown Preservation**: Bodies must remain markdown (clients render to HTML)
- **Obsidian Alignment**: Field structure must match vault frontmatter conventions
- **No Auto-Sync**: Never run `npx payload migrate:fresh` in production
- **Deployment**: Single Droplet serves all three domains via DNS routing

## Key Decisions

| Decision                     | Rationale                                                                            | Outcome   |
| ---------------------------- | ------------------------------------------------------------------------------------ | --------- |
| Merge jr_posts + jr_projects | Both are content types, semantic distinction unnecessary                             | — Pending |
| Separate media per site      | Clearer organization, easier permissions, avoids cross-site leakage                  | — Pending |
| Separate tag collections     | Site-specific taxonomies, no shared vocabulary needed                                | — Pending |
| Two collections for NITF     | Trips are flagship content with complex structure; reviews/places/recipes are simple | — Pending |
| nitf_poi for map display     | Queryable location data decoupled from trip narrative                                | — Pending |
| Bidirectional relationships  | Trips/weeks need ordered arrays; reverse queries also needed                         | — Pending |
| Remove rotr_locations        | GPS on days sufficient; extra collection adds no value                               | — Pending |
| Admin-only roles             | Solo project, editor/user complexity unnecessary                                     | — Pending |
| Draft-then-publish sync      | Manual publish gate maintains content quality control                                | — Pending |

---

_Last updated: 2026-03-11 after initialization_

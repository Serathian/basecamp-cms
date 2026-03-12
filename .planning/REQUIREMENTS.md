# Requirements: Basecamp CMS Refinement

**Defined:** 2026-03-11
**Core Value:** The CMS must align perfectly with how content is authored in Obsidian — every collection, field, and relationship should reduce friction between vault structure and frontend needs, never add ceremony.

## v1 Requirements

Requirements for CMS refinement. Each maps to roadmap phases.

### Access Control

- [x] **ACCESS-01**: Admin users can view draft content in admin panel (fix `anyone()` bug)
- [x] **ACCESS-02**: Published content visible to unauthenticated API requests
- [x] **ACCESS-03**: Draft content hidden from unauthenticated API requests
- [x] **ACCESS-04**: `published.ts` access helper replaces broken `anyone()` pattern
- [ ] **ACCESS-05**: Users collection simplified to admin-only role (remove editor/user)

### Schema Consolidation

- [ ] **SCHEMA-01**: `jr_posts` and `jr_projects` merged into single `jr_posts` collection
- [ ] **SCHEMA-02**: Migration preserves all existing jr_posts and jr_projects data
- [ ] **SCHEMA-03**: `jr_posts` supports both blog posts and project showcase content types

### Site-Specific Resources

- [ ] **SITESPEC-01**: `media` collection split into `jr_media`, `nitf_media`, `rotr_media`
- [ ] **SITESPEC-02**: `tags` collection split into `jr_tags`, `nitf_tags`, `rotr_tags`
- [ ] **SITESPEC-03**: Media uploads filtered by site in admin UI
- [ ] **SITESPEC-04**: Tags filtered by site in admin UI
- [ ] **SITESPEC-05**: Migration migrates existing media/tags to site-specific collections

### Jake-Reddy Collections

- [ ] **JR-01**: `jr_posts` has fields: title, slug, body (markdown), featured_image, publish_date, tags (relation to jr_tags)
- [ ] **JR-02**: `jr_posts` has project fields: github_url, demo_url, tech_stack (relation to jr_technologies)
- [ ] **JR-03**: `jr_technologies` collection: name, icon (media), category (select), description (textarea)
- [ ] **JR-04**: `jr_tags` collection: name, slug

### NITF Collections

- [ ] **NITF-01**: `nitf_posts` collection: title, slug, body (markdown), type (review/place/recipe), tags (relation), featured_image, publish_date
- [ ] **NITF-02**: `nitf_posts` place type has optional latitude/longitude fields
- [ ] **NITF-03**: `nitf_destinations` collection: name, description (markdown), latitude, longitude, featured_image, links (array), difficulty (select), season_info (textarea)
- [ ] **NITF-04**: `nitf_poi` collection: name, latitude, longitude, type (select: camp-fire/lean-to/etc), trips (relation array to nitf_trips)
- [ ] **NITF-05**: `nitf_trips` collection: title, slug, body (markdown), destination (relation to nitf_destinations), cover_image, date_range, tags (relation), pois (relation array to nitf_poi, ordered)
- [ ] **NITF-06**: `nitf_trips` ↔ `nitf_poi` bidirectional relationship (trips array on POI, pois array on trip)
- [ ] **NITF-07**: `nitf_tags` collection: name, slug

### ROTR Collections

- [ ] **ROTR-01**: `rotr_weeks` collection: title, summary (markdown), cover_photo (media), date_range, days (relation array to rotr_days, ordered), tags (relation)
- [ ] **ROTR-02**: `rotr_days` collection: date, latitude, longitude, location_name, location_type (select), markdown_body, photos (media array), weather (text), mood (select), week (relation to rotr_weeks)
- [ ] **ROTR-03**: `rotr_weeks` ↔ `rotr_days` bidirectional relationship (days array on week, week relation on day)
- [ ] **ROTR-04**: `rotr_locations` collection removed (GPS on days sufficient)
- [ ] **ROTR-05**: `rotr_tags` collection: name, slug
- [ ] **ROTR-06**: Migration splits existing `rotr_posts` into weeks and days

### PostGIS Extension

- [ ] **GEO-01**: `nitf_posts` `geom` column auto-populated via `afterChange` hook
- [ ] **GEO-02**: `nitf_destinations` has `geom` column with `afterChange` hook
- [ ] **GEO-03**: `nitf_poi` has `geom` column with `afterChange` hook
- [ ] **GEO-04**: `rotr_days` has `geom` column with `afterChange` hook
- [ ] **GEO-05**: PostGIS spatial queries work for all geo collections
- [ ] **GEO-06**: Migration adds `geom` columns to remaining geo tables

### Types & Testing

- [ ] **TEST-01**: Integration tests verify access control changes (admin sees drafts, anon sees published only)
- [ ] **TEST-02**: Integration tests verify all bidirectional relationships
- [ ] **TEST-03**: Integration tests verify PostGIS spatial queries on all geo collections
- [ ] **TEST-04**: TypeScript types regenerated after each schema change
- [ ] **TEST-05**: All migrations have tested `down()` rollback functions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Obsidian Sync

- **SYNC-01**: GitHub Action triggers on vault push
- **SYNC-02**: Action reads changed markdown files
- **SYNC-03**: Action extracts frontmatter (cms_status, cms_site, cms_type)
- **SYNC-04**: Action POSTs to Payload API with extracted data
- **SYNC-05**: Action writes CMS-assigned IDs back to frontmatter as cms_id
- **SYNC-06**: Sync creates content as draft (manual publish in admin)

### Advanced Features

- **ADV-01**: Image focal point support in media collections
- **ADV-02**: GPS boundary polygons for destinations (not just center point)
- **ADV-03**: Ordered relationship fractional indexing performance validation
- **ADV-04**: Bulk operations in admin UI (bulk publish, bulk tag)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                          | Reason                                                                     |
| -------------------------------- | -------------------------------------------------------------------------- |
| Shared collections (media, tags) | Creates admin UI noise and permission complexity; site-specific is cleaner |
| Multi-user collaboration         | Solo author; editor/user roles add unnecessary complexity                  |
| Localization/i18n                | All content in English                                                     |
| Auto-save                        | Manual save workflow preferred for deliberate publishing                   |
| Content scheduling               | Manual draft→publish workflow sufficient                                   |
| Revision history                 | Not needed for solo author workflow                                        |
| OAuth/SSO login                  | Email/password sufficient for admin-only access                            |
| GraphQL optimization             | REST API is primary interface                                              |
| Real-time sync                   | Static sync workflow from Obsidian is sufficient                           |
| Blocks field for rich content    | Adds query overhead; markdown body handles all needs                       |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase               | Status  |
| ----------- | ------------------- | ------- |
| ACCESS-01   | 1                   | Complete |
| ACCESS-02   | 1                   | Complete |
| ACCESS-03   | 1                   | Complete |
| ACCESS-04   | 1                   | Complete |
| ACCESS-05   | 1                   | Pending |
| SCHEMA-01   | 1                   | Pending |
| SCHEMA-02   | 1                   | Pending |
| SCHEMA-03   | 1                   | Pending |
| SITESPEC-01 | 3                   | Pending |
| SITESPEC-02 | 3                   | Pending |
| SITESPEC-03 | 3                   | Pending |
| SITESPEC-04 | 3                   | Pending |
| SITESPEC-05 | 3                   | Pending |
| JR-01       | 6                   | Pending |
| JR-02       | 6                   | Pending |
| JR-03       | 6                   | Pending |
| JR-04       | 6                   | Pending |
| NITF-01     | 5                   | Pending |
| NITF-02     | 5                   | Pending |
| NITF-03     | 5                   | Pending |
| NITF-04     | 5                   | Pending |
| NITF-05     | 5                   | Pending |
| NITF-06     | 5                   | Pending |
| NITF-07     | 5                   | Pending |
| ROTR-01     | 4                   | Pending |
| ROTR-02     | 4                   | Pending |
| ROTR-03     | 4                   | Pending |
| ROTR-04     | 4                   | Pending |
| ROTR-05     | 4                   | Pending |
| ROTR-06     | 4                   | Pending |
| GEO-01      | 2                   | Pending |
| GEO-02      | 2                   | Pending |
| GEO-03      | 2                   | Pending |
| GEO-04      | 2                   | Pending |
| GEO-05      | 2                   | Pending |
| GEO-06      | 2                   | Pending |
| TEST-01     | 1, 7                | Pending |
| TEST-02     | 3, 4, 5             | Pending |
| TEST-03     | 2                   | Pending |
| TEST-04     | 1, 2, 3, 4, 5, 6, 7 | Pending |
| TEST-05     | 2, 3, 4             | Pending |

**Coverage:**

- v1 requirements: 48 total
- Mapped to phases: 48/48 ✓
- Unmapped: 0

---

_Requirements defined: 2026-03-11_
_Last updated: 2026-03-11 after roadmap creation (traceability updated)_

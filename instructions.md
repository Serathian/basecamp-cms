# Basecamp CMS — Agent Instructions

Basecamp CMS is the headless data authority for Jake Reddy's personal web ecosystem, built on **Payload CMS v3** and Next.js, backed by **PostgreSQL 16 with PostGIS 3.4**.

---

## 1. Architecture & Key Features

* **Headless REST API**: Exposes endpoints under `/api/<slug>` consumed by `nerdintheforest.com`, `jake-reddy.com`, and `reddyontheroad.com`.
* **Spatial Geography**: All spatial entities store coordinates in `latitude`/`longitude` and maintain a synchronized PostGIS `geometry(Point, 4326)` column (`geom`) managed via PostgreSQL BEFORE INSERT/UPDATE triggers.
* **GPX Outing Ingestion**: Uploading a `.gpx` file to `nitf_dispatches` automatically runs an `afterChange` hook in `NitfDispatches.ts` that parses track coordinates, extracts elevation gain/loss, calculates distance in km, outing duration, and creates a GeoJSON `trail_geometry` LineString.
* **Automated Entrypoint**: `docker-entrypoint.sh` executes `payload migrate` before launching `server.js` in production.

---

## 2. Collections Inventory

* **Shared & Auth**: `users` (auth), `authors` (shared).
* **Nerd in the Forest (`nitf_*`)**:
  * `nitf_dispatches`: Trip logs with GPX track upload, elevation telemetry, loadout relation, and surveyed locations.
  * `nitf_locations`: Shelters, camp hearths, potable springs, summits, viewpoints, and trailheads.
  * `nitf_areas`: Forest reserves, national parks, wilderness management units.
  * `nitf_loadouts`: Gear packing manifests for expeditions.
  * `nitf_gear_items`: Master equipment locker items with weights, categories, status.
  * `nitf_gear_reviews`: Long-term field test reviews.
  * `nitf_media`: Image and GPX file uploads.
* **Jake Reddy (`jr_*`)**:
  * `jr_posts`: Blog essays, technical articles, and project highlights.
  * `jr_projects`: Portfolio projects and links.
  * `jr_media`: Portfolio media uploads.

---

## 3. Testing & Verification

Integration tests run against a live PostgreSQL + PostGIS instance:
```bash
# Run full Vitest suite (all 26 tests must pass)
npm run test:int

# Run Playwright E2E tests
npm run test:e2e
```

# AGENTS.md — basecamp-cms

Payload CMS v3 serving three personal domains from a single DigitalOcean Droplet.
Content originates in an Obsidian vault and local CMS ingestion.
Frontends read from the CMS REST API.

---

## Repository

| Item | Value |
|---|---|
| GitHub | `github.com/Serathian/basecamp-cms` |
| Docker image | `ghcr.io/Serathian/basecamp-cms:latest` (built by CI on push to `master`) |
| Branch | `master` |
| Local dev | `http://localhost:3000` |
| Production admin | `https://basecamp.jake-reddy.com/admin` |
| Database | PostgreSQL 16 + PostGIS 3.4 |

## Current Status

**Tests: 26/26 passing** (`npm run test:int`)

All 8 migrations are applied to the local dev database and run automatically on container startup:
1. `20261005_091006_clean_slate_initial_schema`
2. `20261011_110908_add_nitf_collections`
3. `20261025_090908_fix_dispatches`
4. `20261025_173500_add_location_capacity_fields`
5. `20261025_175000_add_location_parking_amenity`
6. `20261025_181200_add_dispatch_date_range`
7. `20261025_190500_add_dispatch_loadout`
8. `20261025_193200_add_dispatch_gpx_and_trail_geometry`

---

## Architectural Rules for Agents

1. **`push: false`**: Drizzle never auto-syncs schema. Every schema change requires a migration (`npx payload migrate:create` then `npx payload migrate`).
2. **PostGIS Triggers**: PostGIS `geom` columns are updated via PostgreSQL BEFORE INSERT OR UPDATE triggers, ensuring instantaneous transaction visibility.
3. **GPX Ingestion**: GPX file uploads to `nitf_dispatches` are automatically parsed into elevation gain/loss, outing duration, distance in km, and GeoJSON `trail_geometry` via an `afterChange` hook in `NitfDispatches.ts`.
4. **Access Control**: Public reads access published documents via `published.ts`; authenticated admin users see all drafts.
5. **Types Generation**: Always run `npm run generate:types` after modifying collection definitions.

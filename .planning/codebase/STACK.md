# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- TypeScript 5.7.3 - All source code in `src/`, tests, config files
- CSS/SCSS - Admin UI customization in `src/app/(payload)/admin/custom.scss`

**Secondary:**
- JavaScript (ESM) - Config files (`next.config.mjs`, `eslint.config.mjs`, `vitest.config.mts`)

## Runtime

**Environment:**
- Node.js `^18.20.2 || >=20.9.0` (Docker image uses `node:22-alpine` / `node:22.17.0-alpine`)
- ESM-first: `"type": "module"` in `package.json`

**Package Manager:**
- npm (primary, used in CI and Docker)
- pnpm also supported (`^9 || ^10`, used for local dev per `engines` field and Playwright `webServer`)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 15.4.11 - App Router, standalone output mode (`next.config.mjs`)
- Payload CMS 3.78.0 - Headless CMS core, mounted via `@payloadcms/next` within Next.js

**Rich Text:**
- `@payloadcms/richtext-lexical` 3.78.0 - Lexical editor for rich text fields

**UI:**
- `@payloadcms/ui` 3.78.0 - Payload admin panel UI components
- React 19.2.1 + React DOM 19.2.1

**Testing:**
- Vitest 4.0.18 - Integration test runner, jsdom environment
- Playwright 1.58.2 - E2E tests, Chromium only
- `@testing-library/react` 16.3.0 - React component testing utilities

**Build/Dev:**
- `cross-env` ^10.1.0 - Cross-platform env var setting in npm scripts
- `tsx` 4.21.0 - TypeScript execution for ESM (used in E2E test runner)
- `sharp` 0.34.2 - Image processing (used by Payload for media uploads)

## Key Dependencies

**Critical:**
- `payload` 3.78.0 - CMS core; all collections, access control, API routes built on this
- `@payloadcms/db-postgres` 3.78.0 - Drizzle-based PostgreSQL adapter; handles migrations and schema
- `@payloadcms/next` 3.78.0 - Next.js integration layer; wraps `nextConfig`, provides REST route handlers
- `graphql` ^16.8.1 - Required peer dep for Payload's GraphQL API (auto-exposed at `/api/graphql`)

**Infrastructure:**
- `dotenv` 16.4.7 - Loads `.env` in tests (`vitest.setup.ts`, `playwright.config.ts`)
- `drizzle-kit` ^0.31.9 - Dev tool for inspecting/managing Drizzle schema (not used for auto-push; migrations are explicit)
- `@vitejs/plugin-react` 4.5.2 - React plugin for Vitest
- `vite-tsconfig-paths` 6.0.5 - Path alias resolution (`@/*`) in Vitest

## Configuration

**Environment:**
- `.env` - Runtime secrets (not committed)
- `.env.example` - Stale template (references MongoDB; outdated)
- `.env.local.example` - Current template with correct PostgreSQL `DATABASE_URL`, `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`
- `test.env` - Minimal test overrides (`NODE_OPTIONS`)

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (e.g. `postgresql://payload:payload@localhost:5432/payload`)
- `PAYLOAD_SECRET` - Must be at least 32 characters
- `PAYLOAD_PUBLIC_SERVER_URL` - Server base URL (used in hooks for self-referencing, e.g. GPX fetch)

**Build:**
- `next.config.mjs` - `output: 'standalone'` for Docker; wrapped with `withPayload()`
- `tsconfig.json` - Strict mode, `ESNext` modules, `bundler` resolution, path aliases `@/*` → `./src/*` and `@payload-config` → `./src/payload.config.ts`
- `eslint.config.mjs` - Flat config, extends `next/core-web-vitals` + `next/typescript`

## Platform Requirements

**Development:**
- Node.js 22 (Docker dev uses `node:22-alpine`)
- PostgreSQL 16 with PostGIS 3.4 extension (via `postgis/postgis:16-3.4` Docker image)
- Docker Compose available for local setup (`docker-compose.yml`)

**Production:**
- Docker container built from `node:22-alpine`, standalone Next.js server (`server.js`)
- Published to GitHub Container Registry (`ghcr.io`) via `docker-publish.yml` on push to `master`
- Payload types published to npm as `@basecamp-cms/basecamp-cms-types` via `publish-types.yml`

---

*Stack analysis: 2026-03-09*

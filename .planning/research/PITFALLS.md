# Pitfalls Research: Payload CMS Refactoring

**Domain:** Payload CMS v3 with PostgreSQL + PostGIS schema refinement
**Researched:** 2026-03-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Mixing `push: true` and Migrations

**What goes wrong:**
Database schema becomes corrupted or out of sync. Drizzle's `push` mode and explicit migrations write to the same migration tracking table, causing conflicts. Results in failed migrations, duplicate column errors, or silent schema drift.

**Why it happens:**

- Developers use `push: true` (dev convenience) in local, then try to run migrations against same database
- Forgetting that push already modified the database before migration runs
- Not understanding that push and migrations are mutually exclusive workflows

**How to avoid:**

- Keep `push: false` in your Postgres adapter config (already set in basecamp-cms)
- Use ONLY migrations for schema changes, even in development
- Run `npx payload migrate:create` after every schema change
- Treat local dev database as migration-managed, not push-managed

**Warning signs:**

- Error: "Column already exists" when running migrations
- Payload warns: "Do not mix push and migrations"
- Migration status shows completed migrations that weren't manually run
- Drizzle push messages appearing in dev server logs

**Phase to address:**
Phase 1 (Schema Consolidation) — verify push is disabled before any collection changes

---

### Pitfall 2: Access Control Functions Without User Context

**What goes wrong:**
Access control returns the same result for authenticated and unauthenticated users. Functions like `anyone()` (which always returns `true`) hide drafts from admin users. Authenticated users cannot see unpublished content they should have access to.

**Why it happens:**

- Misunderstanding that access control must check `req.user` to differentiate
- Helper functions named misleadingly (`anyone()` suggests "anyone can read")
- Tests only verify unauthenticated behavior, missing authenticated edge cases
- Copy-pasting access patterns without understanding the logic

**How to avoid:**

- ALWAYS check `req.user` in access control functions that differentiate by auth state
- Create helper that returns query constraint for anon, `true` for authenticated:
  ```typescript
  const published = ({ req: { user } }) => {
    if (!user) return { status: { equals: 'published' } }
    return true // authenticated users see all
  }
  ```
- Test BOTH authenticated and unauthenticated access in integration tests
- Use descriptive helper names: `publishedOrAuthenticated` not `anyone`

**Warning signs:**

- Admin panel shows no draft documents
- Admin users report "content is missing"
- `anyone()` function in access control (it's always wrong for read filters)
- Access control that returns `true` unconditionally before checking `user`

**Phase to address:**
Phase 1 (Access Control Fix) — already documented in AGENTS.md issue #1, create `published.ts` helper

---

### Pitfall 3: PostGIS Columns Not Auto-Populated on Insert

**What goes wrong:**
New documents with lat/lon fields have `geom IS NULL`, breaking spatial queries. Documents inserted after PostGIS migration don't appear in map views or distance searches. Silent failure — no errors, just missing results.

**Why it happens:**

- Migration only backfills existing rows via `UPDATE`
- `geom` column is plain column, not `GENERATED ALWAYS AS` (Drizzle doesn't support)
- No `afterChange` hook to populate `geom` on create/update
- Developers assume database-level triggers will handle it (Payload doesn't add those)

**How to avoid:**

- Add `afterChange` hook to every collection with lat/lon fields
- Hook should run raw SQL: `UPDATE table SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326) WHERE id = doc.id`
- Hook must check `if (doc.latitude != null && doc.longitude != null)` before executing
- Test spatial queries against newly created documents, not just migrated ones

**Warning signs:**

- Spatial queries return 0 results
- `SELECT COUNT(*) FROM table WHERE geom IS NOT NULL` shows fewer rows than table count
- Distance searches work for old documents but not new ones
- PostGIS index exists but isn't being used (check `EXPLAIN` output)

**Phase to address:**
Phase 2 (PostGIS Auto-Population) — already documented in AGENTS.md issue #2

---

### Pitfall 4: Migration Down() Doesn't Match Up()

**What goes wrong:**
Migration `down()` references tables/columns that `up()` never creates, or vice versa. Rollback fails with "column does not exist" errors. Impossible to revert migration in emergency.

**Why it happens:**

- Copy-pasting migration templates without updating both directions
- Adding to `down()` list but forgetting to update `up()` loop (issue #3 in AGENTS.md)
- Incremental development — adding tables to plan but not implementing yet
- Not testing rollback (most developers never run `migrate:down`)

**How to avoid:**

- `geoTables` array in PostGIS migration should match `tables` array in `down()`
- After writing migration, manually verify: "Does down() undo everything up() does?"
- Run `migrate:down` in local dev immediately after `migrate` to verify rollback works
- Keep arrays in sync — DRY principle: extract shared list, use in both functions

**Warning signs:**

- Migration `down()` has hardcoded table list instead of derived from `up()` config
- Different number of items in `up()` loop vs. `down()` loop
- Comments in migration like "TODO: add remaining tables"
- Migration passes but rollback fails

**Phase to address:**
Phase 2 (PostGIS Extension) — fix `geoTables` array in migration 20260303_214307_add_postgis.ts

---

### Pitfall 5: Breaking Collection Relationships During Refactor

**What goes wrong:**
Renaming or removing a collection breaks all relationship fields pointing to it. Frontends receive `null` or error responses. Data orphaned in database if cascade delete not configured. Migration doesn't preserve relationship data.

**Why it happens:**

- Payload uses collection `slug` in relationship data, not table names
- Changing slug without migrating relationship field data
- Forgetting that other collections reference this one
- No migration to update `_rels` tables when renaming collections

**How to avoid:**

- Before changing collection slug, search codebase for relationship fields referencing it
- Write data migration to update relationship records: `UPDATE table_rels SET collection_slug = 'new_slug' WHERE collection_slug = 'old_slug'`
- Use `dbName` property to change table name without changing slug
- Test all collections that have relationships to changed collection

**Warning signs:**

- Relationship fields return `null` in API responses
- Admin panel shows "Invalid relationship" warnings
- `_rels` tables contain orphaned foreign keys
- Error: "Collection [slug] does not exist" in logs

**Phase to address:**
Phase 1 (Schema Consolidation) — when merging `jr_posts` + `jr_projects`, preserve any existing relationship data

---

### Pitfall 6: Field Type Changes Without Data Migration

**What goes wrong:**
Changing field type (e.g., `text` → `number`, `select` → `relationship`) causes PostgreSQL errors or silent data loss. Existing data doesn't match new type constraints. Queries fail with "invalid input syntax for type integer".

**Why it happens:**

- Assuming Drizzle will cast data automatically (it won't)
- Not checking if existing data is compatible with new type
- Forgetting that field type changes require data transformation
- Migrations only handle schema, not data format changes

**How to avoid:**

- NEVER change field type directly — create migration with data transformation
- Migration steps: (1) add new column with new type, (2) copy data with transformation, (3) drop old column, (4) rename new column
- For risky transforms, add validation in migration: `SELECT * FROM table WHERE new_field IS NULL` after transform
- Test migration against copy of production data, not just empty dev database

**Warning signs:**

- Type definition in config doesn't match database column type
- `npx payload migrate:create` generates `ALTER COLUMN ... TYPE` without data migration logic
- Existing documents fail validation on edit (new type rejects old data)
- PostgreSQL logs show casting errors

**Phase to address:**
Any phase with field type changes — applies to Phase 1 (Schema Consolidation) when restructuring collections

---

### Pitfall 7: Over-Engineered RBAC for Solo Projects

**What goes wrong:**
Complex role hierarchy (admin, editor, user, contributor) with dozens of access control functions creates maintenance burden. Every new field needs 3+ access rules. Access control bugs multiply. Complexity slows feature development.

**Why it happens:**

- Anticipating future multi-user needs that may never materialize
- Copying enterprise patterns from tutorials
- Not questioning "Do I need this role?" for each role
- Thinking "more roles = more professional"

**How to avoid:**

- Start with ONLY roles you need today (for basecamp-cms: just `admin`)
- Add roles when actual user with different permissions appears, not before
- Simplify existing: `admin` + `editor` + `user` → just `admin` for solo project
- Access control should be: authenticated admin sees all, public sees published

**Warning signs:**

- Role enum has 3+ values but only one user in database
- Access control functions checking roles that don't exist in users table
- Every collection has identical complex access logic
- Comments explaining "we might need this later"

**Phase to address:**
Phase 1 (Access Control Simplification) — remove editor/user roles, keep only admin

---

### Pitfall 8: Environment-Specific Config Not Reflected in Migrations

**What goes wrong:**
Migration generated in dev environment misses production-only plugins/collections. Production migration fails because dev config had `if (process.env.NODE_ENV === 'production')` logic. Schema mismatch between environments.

**Why it happens:**

- Running `migrate:create` in dev with `NODE_ENV=development`
- Conditional collection registration based on environment
- Plugins only enabled in production (e.g., cloud storage)
- Not realizing migration generator uses current config to detect changes

**How to avoid:**

- Keep config environment-agnostic — avoid `if (env === 'production')` in collection definitions
- If unavoidable, temporarily enable production features locally when generating migrations
- Document in migration file: "Generated with [ENV_VARS] set to [values]"
- Manually inspect migration before running in production

**Warning signs:**

- Payload docs warn: "Environment-specific configurations can lead to discrepancies"
- Migration adds table that doesn't exist in dev schema
- Production deploy succeeds but admin panel shows different collections than dev
- CI migration fails with "unknown collection"

**Phase to address:**
Phase 1 (Schema Consolidation) — verify no environment-specific config before generating migrations

---

### Pitfall 9: Forgetting to Regenerate TypeScript Types After Schema Changes

**What goes wrong:**
TypeScript types don't match database schema. Frontend uses stale types, expecting fields that no longer exist. Type errors only surface at runtime as API errors. "Property does not exist" bugs in production.

**Why it happens:**

- Schema changes committed without running `npx payload generate:types`
- Git ignore includes `payload-types.ts` (it shouldn't)
- Forgetting that Payload doesn't auto-generate types on schema changes
- Multiple devs changing schema without coordinating type generation

**How to avoid:**

- Run `npx payload generate:types` after EVERY collection/field change
- Commit `src/payload-types.ts` to version control
- Add to git pre-commit hook: check if schema changed but types didn't
- CI should fail if types are out of sync (compare timestamp to migration timestamp)

**Warning signs:**

- TypeScript errors in frontend like "Property 'newField' does not exist"
- Type definitions reference deleted fields
- `payload-types.ts` last modified date is weeks old despite recent schema changes
- API returns fields that TypeScript types don't include

**Phase to address:**
After every phase — make it part of definition of done for any schema change

---

### Pitfall 10: Blocks Stored Relationally Causing Performance Issues

**What goes wrong:**
Collections with many blocks (e.g., rich text, flexible content) generate dozens of JOIN queries. List views timeout with 100+ documents. Each block creates separate table, exponential query complexity.

**Why it happens:**

- Default Payload behavior stores blocks as separate related tables
- Works fine for 10 documents, breaks at 100+
- Not understanding performance implications of `blocks` field type
- Not considering `blocksAsJSON` option introduced in recent Payload versions

**How to avoid:**

- For block-heavy collections (posts, pages), set `blocksAsJSON: true` in postgres adapter
- Stores blocks as JSON column instead of relational structure
- Tradeoff: can't query inside blocks (usually not needed), but massive performance gain
- Test list view performance with 500+ documents before going to production

**Warning signs:**

- List view loads slowly (>3 seconds) with only 50 documents
- PostgreSQL logs show 10+ JOIN statements per document load
- Database has tables like `blocks_fieldName_1`, `blocks_fieldName_2`, etc.
- Query planner shows sequential scans on block tables

**Phase to address:**
Phase 1 (Schema Consolidation) — evaluate if any collections need `blocksAsJSON: true`

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut                                           | Immediate Benefit                 | Long-term Cost                                      | When Acceptable                                      |
| -------------------------------------------------- | --------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| Using `anyone()` in access control                 | Fast initial setup, no auth logic | Drafts invisible to admins, must refactor           | Never — always check `req.user`                      |
| Skipping migration `down()` function               | Saves 2 minutes per migration     | Can't rollback failed deploys, debugging impossible | Never in production, acceptable for solo MVP         |
| Not testing migration rollback                     | Faster iteration                  | Emergency rollback fails when needed most           | Never — takes 30 seconds to test                     |
| Copying access control without understanding       | Consistent patterns               | Bugs multiply across collections                    | Never — understand before copying                    |
| Adding collections without updating PostGIS arrays | Easy to forget                    | Spatial queries broken for new geo collections      | Never — use checklist                                |
| Using `push: true` in dev "just to try something"  | Instant schema sync               | Conflicts with migrations, database corrupted       | Never — use migrations always                        |
| Hardcoding environment config                      | Simpler config file               | Different schema in dev vs. prod                    | Acceptable for DB credentials, never for collections |
| Not documenting migration assumptions              | Saves time writing comments       | Other devs (or future you) break things             | Never — 2-line comment prevents hours of debugging   |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration              | Common Mistake                                      | Correct Approach                                                                         |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Obsidian → CMS sync      | Syncing markdown with wrong frontmatter field names | Match CMS field names exactly, validate in GitHub Action                                 |
| GitHub Action auth       | Storing Payload admin password in secrets           | Generate API key via Payload admin, use in `Authorization: Bearer` header                |
| Frontend REST API        | Assuming fields returned match TypeScript types     | Regenerate types after EVERY schema change, commit to git                                |
| PostGIS spatial queries  | Using lat/lon directly instead of `geom` column     | Always query against `geom`, ensure afterChange hook populates it                        |
| Media upload collections | Single shared `media` collection for all sites      | Separate collections (`jr_media`, `nitf_media`, `rotr_media`) prevent cross-site leakage |
| Docker production deploy | Running migrations during container startup         | Run migrations in CI BEFORE building container, or in init container                     |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap                                           | Symptoms                               | Prevention                                                 | When It Breaks                    |
| ---------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Blocks stored relationally                     | Slow list views, timeout errors        | Use `blocksAsJSON: true` in adapter config                 | >100 documents with blocks        |
| No database indexes on relationship fields     | Slow queries, sequential scans         | Drizzle auto-indexes FKs, verify with `EXPLAIN`            | >1000 documents                   |
| Fetching full relationship depth in list views | 100ms → 5s load times                  | Use `depth: 0` in list queries, expand only in detail view | >500 documents with relationships |
| N+1 queries in `afterRead` hooks               | One query per document                 | Batch queries using `payload.find()` before hook loop      | >50 documents                     |
| No pagination on relationship arrays           | Memory exhaustion loading large arrays | Limit `hasMany` relationships in queries                   | >100 related documents            |
| PostGIS spatial queries without GIST index     | Full table scan on every map load      | Migration creates index, verify with `EXPLAIN`             | >1000 geo documents               |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake                                    | Risk                                              | Prevention                                                |
| ------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| Public read on `users` collection          | Email addresses, hashed passwords exposed via API | Never set `read: () => true` on auth collections          |
| No access control on media fields          | Uploaded files accessible without auth check      | Field-level access control on upload fields               |
| Allowing custom IDs without validation     | ID collision, overwriting existing documents      | Only enable `allowIDOnCreate` with strict validation      |
| Obsidian sync overwrites published content | Accidental content loss                           | Sync creates drafts, manual publish in admin as gate      |
| API key stored in frontend env             | Key exposed in browser, anyone can write to CMS   | API keys only in server-side env (GitHub Actions secrets) |
| No rate limiting on API endpoints          | Brute force attacks, DoS                          | Implement rate limiting at nginx/Docker level             |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall                                   | User Impact                               | Better Approach                                          |
| ----------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Admin can't see own drafts                | Frustration, "Where did my content go?"   | Fix `anyone()` access control, test authenticated access |
| Collection names don't match content type | Confusion, "Is this a post or article?"   | Use semantic naming: `jr_posts` not `jr_content`         |
| No default field values                   | Every new doc requires filling 10+ fields | Use `defaultValue` for author, status, dates             |
| Relationship fields show IDs not titles   | "What is document `64f123...`?"           | Use virtual fields to display relationship names         |
| Media uploads not scoped to site          | Wrong images in wrong site                | Separate media collections per site                      |
| No admin field descriptions               | "What should I put here?"                 | Add `admin.description` to complex fields                |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Access control fix:** Verify authenticated users CAN see drafts (add test case)
- [ ] **PostGIS collections:** All 6 tables in `geoTables` array, not just `nitf_posts`
- [ ] **PostGIS auto-population:** `afterChange` hook on ALL geo collections, not just first one
- [ ] **Migration rollback:** `down()` successfully reverts `up()` (test it)
- [ ] **TypeScript types:** `payload-types.ts` regenerated and committed after schema changes
- [ ] **Relationship preservation:** Data migration when changing collection slugs
- [ ] **Index verification:** PostGIS GIST indexes exist and are used (`EXPLAIN` query output)
- [ ] **Test coverage:** Integration tests for authenticated AND unauthenticated access
- [ ] **Spatial query test:** Asserts distance ordering, not just "0 results OK"
- [ ] **Production migration:** Migration runs successfully against production-sized dataset (100+ docs)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall                      | Recovery Cost | Recovery Steps                                                               |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------- |
| Mixed push + migrations      | HIGH          | Restore DB from backup, re-run all migrations from scratch                   |
| Access control breaks drafts | LOW           | Add `published.ts` helper, update 5 collections, verify with test            |
| PostGIS geom NULL            | MEDIUM        | Backfill: `UPDATE table SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)` |
| Migration down() mismatch    | LOW           | Edit migration file, re-run `migrate:down` to verify                         |
| Broken relationships         | HIGH          | Data migration to update `_rels` tables, may require manual fixes            |
| Wrong field type             | MEDIUM        | Create new migration with data transformation, test thoroughly               |
| Over-engineered RBAC         | MEDIUM        | Remove unused roles, simplify access control, test edge cases                |
| Environment config mismatch  | HIGH          | Regenerate migration with correct env, may need manual schema fix            |
| Stale TypeScript types       | LOW           | Run `npx payload generate:types`, fix resulting type errors in frontend      |
| Blocks performance           | MEDIUM        | Enable `blocksAsJSON: true`, create new migration, requires rebuild          |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall                             | Prevention Phase                        | Verification                                       |
| ----------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Mixed push + migrations             | Phase 1 (Schema Consolidation)          | Verify `push: false` in config                     |
| Access control without user context | Phase 1 (Access Control Fix)            | Test authenticated access returns drafts           |
| PostGIS not auto-populated          | Phase 2 (PostGIS Extension)             | Create new doc, verify `geom IS NOT NULL`          |
| Migration down() mismatch           | Phase 2 (PostGIS Extension)             | Run `migrate:down` successfully                    |
| Breaking relationships              | Phase 1 (Schema Consolidation)          | API returns relationship data after refactor       |
| Field type changes                  | Any phase with schema changes           | Migration includes data transformation             |
| Over-engineered RBAC                | Phase 1 (Access Control Simplification) | Only `admin` role in `users` table                 |
| Environment-specific config         | Phase 1 (Schema Consolidation)          | Config has no `process.env.NODE_ENV` checks        |
| Stale TypeScript types              | After every phase                       | `payload-types.ts` timestamp > migration timestamp |
| Blocks performance                  | Phase 1 (Schema Consolidation)          | List view <500ms with 100+ docs                    |

---

## Sources

**Official Payload Documentation:**

- [Migrations](https://payloadcms.com/docs/database/migrations) — migration workflows, environment-specific configs (MEDIUM confidence — official docs)
- [Access Control](https://payloadcms.com/docs/access-control/overview) — default access, user context in functions (HIGH confidence — official docs)
- [Postgres Adapter](https://payloadcms.com/docs/database/postgres) — push vs. migrations, Drizzle schema hooks (HIGH confidence — official docs)
- [Field Options](https://payloadcms.com/docs/fields/overview) — validation, default values, hooks (HIGH confidence — official docs)

**Known Issues from AGENTS.md:**

- Issue #1: `anyone()` misuse in 5 collections (HIGH confidence — documented in project)
- Issue #2: PostGIS `geom` not auto-populated (HIGH confidence — documented in project)
- Issue #3: Migration `down()` references 6 tables, `up()` only processes 1 (HIGH confidence — code inspection)

**Payload GitHub Issues (2026):**

- #15820: `generate:types` inlines all block types, bloating payload-types.ts
- #15733: `generate:db-schema` produces TypeScript errors on circular references
- #15594: Form Builder plugin breaks collections with common names

**Project Context:**

- Solo developer project, single admin user (informs RBAC simplification)
- Content originates in Obsidian vault, not manual entry (informs sync workflow risks)
- Three separate domains served from single CMS (informs media/tag separation)

---

_Pitfalls research for: Payload CMS v3 refactoring with PostgreSQL + PostGIS_
_Researched: 2026-03-11_
_Confidence: HIGH for Payload-specific patterns (official docs), MEDIUM for recovery strategies (extrapolated from docs), HIGH for project-specific issues (code inspection)_

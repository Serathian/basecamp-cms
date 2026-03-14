---
phase: 2
slug: postgis-extension
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                         |
| ---------------------- | --------------------------------------------- |
| **Framework**          | Vitest 4.0.18                                 |
| **Config file**        | vitest.config.mts                             |
| **Quick run command**  | `npx vitest run --config ./vitest.config.mts` |
| **Full suite command** | `npx vitest run`                              |
| **Estimated runtime**  | ~5-10 seconds                                 |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --config ./vitest.config.mts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                                | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ---------------------------------------------------------------- | ----------- | ---------- |
| 02-00-01 | 00   | 0    | N/A         | scaffold    | `npx vitest run tests/int/migration.int.spec.ts`                 | 🔨 creates  | ⬜ pending |
| 02-00-02 | 00   | 0    | N/A         | scaffold    | `npx vitest run tests/int/geom-hooks.int.spec.ts`                | 🔨 creates  | ⬜ pending |
| 02-01-01 | 01   | 1    | GEO-06      | integration | `npx vitest run tests/int/migration.int.spec.ts`                 | ✅ W0       | ⬜ pending |
| 02-01-02 | 01   | 1    | GEO-01      | integration | `npx vitest run tests/int/api.int.spec.ts -t "nitf_posts.*geom"` | ✅          | ⬜ pending |
| 02-02-01 | 02   | 2    | GEO-01      | integration | `npx vitest run tests/int/geom-hooks.int.spec.ts`                | ✅ W0       | ⬜ pending |
| 02-02-02 | 02   | 2    | GEO-01      | integration | `npx vitest run tests/int/geom-hooks.int.spec.ts`                | ✅ W0       | ⬜ pending |
| 02-01-03 | 01   | 1    | GEO-05      | integration | `npx vitest run tests/int/api.int.spec.ts -t "spatial"`          | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `tests/int/migration.int.spec.ts` — scaffold created by Plan 02-00 Task 1
- [x] `tests/int/geom-hooks.int.spec.ts` — scaffold created by Plan 02-00 Task 2

---

## Manual-Only Verifications

_All phase behaviors have automated verification._

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-14

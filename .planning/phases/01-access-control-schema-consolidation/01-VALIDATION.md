---
phase: 01
slug: access-control-schema-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value             |
| ---------------------- | ----------------- |
| **Framework**          | Vitest 4.0.18     |
| **Config file**        | vitest.config.mts |
| **Quick run command**  | `npx vitest run`  |
| **Full suite command** | `npx vitest run`  |
| **Estimated runtime**  | ~10 seconds       |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green + `npx tsc --noEmit`
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                                                           | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 01-01-01 | 01   | TBD  | ACCESS-01   | integration | `npx vitest run tests/int/api.int.spec.ts -t "admin user sees drafts"`                      | ❌ W0       | ⬜ pending |
| 01-01-02 | 01   | TBD  | ACCESS-02   | integration | `npx vitest run tests/int/api.int.spec.ts -t "unauthenticated read returns only published"` | ✅ extend   | ⬜ pending |
| 01-01-03 | 01   | TBD  | ACCESS-03   | integration | `npx vitest run tests/int/api.int.spec.ts -t "unauthenticated read returns only published"` | ✅ extend   | ⬜ pending |
| 01-01-04 | 01   | TBD  | ACCESS-04   | integration | `npx vitest run tests/int/api.int.spec.ts -t "admin user sees drafts"`                      | ❌ W0       | ⬜ pending |
| 01-01-05 | 01   | TBD  | ACCESS-05   | integration | `npx vitest run tests/int/api.int.spec.ts -t "users"`                                       | ✅ extend   | ⬜ pending |
| 01-02-01 | 02   | TBD  | SCHEMA-01   | unit        | `npx vitest run tests/int/api.int.spec.ts -t "fetches jr_posts"`                            | ✅ adapt    | ⬜ pending |
| 01-02-02 | 02   | TBD  | SCHEMA-03   | integration | `npx vitest run tests/int/api.int.spec.ts -t "jr_posts supports blog and project"`          | ❌ W0       | ⬜ pending |
| 01-03-01 | 03   | TBD  | TEST-01     | integration | `npx vitest run tests/int/api.int.spec.ts`                                                  | ✅ extend   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/int/api.int.spec.ts` — add authenticated user tests (ACCESS-01, ACCESS-04)
- [ ] `tests/int/api.int.spec.ts` — add jr_posts type validation tests (SCHEMA-03)

_Existing infrastructure covers most requirements. Wave 0 extends existing test file._

---

## Manual-Only Verifications

| Behavior              | Requirement | Why Manual                                 | Test Instructions                                                         |
| --------------------- | ----------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| Data preservation N/A | SCHEMA-02   | Clean slate decision = no data to preserve | N/A — verify jr_projects table dropped in migration                       |
| Types regenerated     | TEST-04     | Type generation verification               | Run `npx payload generate:types && npx tsc --noEmit` — verify zero errors |

_Most behaviors have automated verification. Only 2 manual checks required._

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

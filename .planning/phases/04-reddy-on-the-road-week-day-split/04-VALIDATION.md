---
phase: 4
slug: reddy-on-the-road-week-day-split
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run tests/int/rotr-days.int.spec.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/int/rotr-days.int.spec.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-00-01 | 00 | 0 | ROTR-04, GEO-04, TEST-02, TEST-05 | integration stubs | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | ROTR-01, ROTR-02 | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | ROTR-01 | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | ROTR-04, TEST-05, GEO-04 | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | TEST-04 | build check | `npx tsc --noEmit` | n/a | ⬜ pending |
| 4-04-01 | 04 | 2 | ROTR-04, GEO-04, TEST-02, TEST-05 | integration | `npx vitest run tests/int/rotr-days.int.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/int/rotr-days.int.spec.ts` — stubs for ROTR-04, GEO-04, TEST-02, TEST-05

*Existing infrastructure covers all other phase requirements — no new config or framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin UI shows default columns (title, date, location_name, status) | ROTR-02 | UI layout validation requires browser | Open admin, navigate to rotr_days collection, confirm column order |
| Admin UI sorts by date descending by default | ROTR-02 | UI sort behavior requires browser | Open admin rotr_days list, confirm newest entries appear first |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

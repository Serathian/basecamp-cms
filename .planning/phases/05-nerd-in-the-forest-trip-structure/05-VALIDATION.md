---
phase: 5
slug: nerd-in-the-forest-trip-structure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (integration) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- --testPathPattern=nitf` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --testPathPattern=nitf`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-00-01 | 00 | 0 | TEST-02 | scaffold | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-01-01 | 01 | 1 | NITF-01 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | NITF-02 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | NITF-03 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 1 | NITF-04 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | NITF-05 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 2 | GEO-02 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-03-02 | 03 | 2 | GEO-03 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 2 | NITF-06 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-04-02 | 04 | 2 | NITF-07 | integration | `npm run test -- --testPathPattern=nitf-trips` | ❌ W0 | ⬜ pending |
| 5-05-01 | 05 | 3 | TEST-04 | integration | `npm run test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/int/nitf-trips.int.spec.ts` — stubs for NITF-01 through NITF-07, GEO-02, GEO-03, TEST-02, TEST-04

*Existing infrastructure covers framework setup; only new spec file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop POI reordering in admin UI | NITF-02 | Browser interaction not testable in integration tests | Open admin, create trip, add 3+ POIs, drag to reorder, save, verify order persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

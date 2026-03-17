---
phase: 6
slug: jake-reddy-tech-stack-collection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/int/jr-tech-stack.int.spec.ts` |
| **Full suite command** | `npx vitest run tests/int/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/int/jr-tech-stack.int.spec.ts`
- **After every plan wave:** Run `npx vitest run tests/int/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-W0-01 | 01 | 0 | JR-03 | integration stub | `npx vitest run tests/int/jr-tech-stack.int.spec.ts` | ❌ W0 | ⬜ pending |
| 6-01-01 | 01 | 1 | JR-03 | integration | `npx vitest run tests/int/jr-tech-stack.int.spec.ts` | ✅ | ⬜ pending |
| 6-01-02 | 01 | 1 | JR-02 | integration | `npx vitest run tests/int/jr-tech-stack.int.spec.ts` | ✅ | ⬜ pending |
| 6-01-03 | 01 | 1 | TEST-04 | type check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 6-02-01 | 02 | 2 | JR-03, JR-02 | integration | `npx vitest run tests/int/jr-tech-stack.int.spec.ts` | ✅ | ⬜ pending |
| 6-02-02 | 02 | 2 | TEST-04 | type check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/int/jr-tech-stack.int.spec.ts` — stubs for JR-02, JR-03, TEST-04

*Existing test infrastructure (vitest, int test helpers) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Technology icons display in admin UI when viewing project posts | JR-03 | Payload Admin UI rendering cannot be automated in integration tests | Log in to admin, open a jr_post of type=project, verify icon thumbnails appear next to each selected technology |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

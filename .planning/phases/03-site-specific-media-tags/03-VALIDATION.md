---
phase: 3
slug: site-specific-media-tags
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npm run test:int` |
| **Full suite command** | `npm run test:int` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:int`
- **After every plan wave:** Run `npm run test:int`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-W0-01 | 01 | 0 | SITESPEC-01, SITESPEC-02, SITESPEC-03, SITESPEC-04, SITESPEC-05, TEST-02, TEST-05 | integration | `npm run test:int` | ❌ W0 | ⬜ pending |
| 3-01-01 | 01 | 1 | SITESPEC-01 | integration | `npm run test:int` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | SITESPEC-02 | integration | `npm run test:int` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | SITESPEC-03, SITESPEC-04 | integration | `npm run test:int` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | SITESPEC-05 | integration | `npm run test:int` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | TEST-05 | integration | `npm run test:int` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | TEST-04 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/int/media-tags-split.int.spec.ts` — stubs for SITESPEC-01 through SITESPEC-05, TEST-02, TEST-05
- [ ] Migration `down()` test block within the spec — covers TEST-05 rollback verification

*Existing Vitest + Payload test infrastructure already configured — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TypeScript types compile after schema change | TEST-04 | Build-time check, not runtime | Run `npx tsc --noEmit` and confirm 0 errors after `npm run generate:types` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

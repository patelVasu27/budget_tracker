---
phase: 03
slug: voice-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via Vite config) |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/useAmountParser.test.ts src/lib/categoryMatcher.test.ts --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VOIC-01, VOIC-02 | T-03-01 | Mic button never reads or stores audio beyond transcription | component | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VOIC-03 | — | Amount parser doesn't modify app state | unit | `npx vitest run src/hooks/useAmountParser.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | VOIC-04 | T-03-02 | Category matcher doesn't expose raw transcript | unit | `npx vitest run src/lib/categoryMatcher.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | VOIC-05, VOIC-06 | — | Voice data only pre-fills modal, never auto-submits | component | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | VOIC-07 | — | Disabled mic when Web Speech unavailable | component | `npx vitest run` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `src/hooks/useAmountParser.test.ts` — covers VOIC-03
- [ ] `src/lib/categoryMatcher.test.ts` — covers VOIC-04
- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom` — if no Vitest config detected

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hold-to-record activation | VOIC-01 | Requires real mic hardware | Press and hold mic button, speak "50 dollars on food", release. Verify transcription appears. |
| Microphone permission prompt | VOIC-02 | Browser permission dialog (cannot auto-accept) | First mic tap should trigger browser permission prompt. Verify on fresh profile. |
| End-to-end voice flow | VOIC-05, VOIC-06 | Requires real mic + browser | Complete voice entry: speak expense, see pre-filled modal, edit if needed, save. |
| Fallback on unsupported browser | VOIC-07 | Requires browser without Web Speech API (Firefox, Safari) | Open app in Firefox. Verify mic button is disabled with tooltip. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

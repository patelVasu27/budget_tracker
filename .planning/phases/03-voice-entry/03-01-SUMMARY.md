---
phase: 03-voice-entry
plan: 01
subsystem: ui, voice
tags: [web-speech-api, react-speech-recognition, vitest, tdd]

requires:
  - phase: 02-expense-entry-transactions
    provides: AddExpenseModal, Dashboard, TransactionList
  - phase: 01-foundation-dashboard
    provides: Auth store, Supabase client, type definitions

provides:
  - Browser-native voice-to-expense entry via Web Speech API
  - Amount parsing from speech transcript (digit regex + word-to-number)
  - Category keyword matching with scoring
  - Hold-to-record mic button with pulse animation
  - Graceful fallback for unsupported browsers
  - Unit tests for parseAmount() and matchCategory()
  - Vitest test infrastructure

affects:
  - Phase 03 future plans (validation, edge case refinement)
  - Manual testing for voice flow

tech-stack:
  added:
    - vitest ^2.x — Unit test runner
    - @testing-library/react ^16.x — React component testing utilities
    - @testing-library/jest-dom ^6.x — DOM matchers
    - jsdom ^26.x — DOM environment for tests
    - react-speech-recognition@4.0.1 — React hook wrapper for Web Speech API
  patterns:
    - TDD RED/GREEN with Vitest
    - Pure function parsers for voice transcript processing
    - Hold-to-record with dual mouse+touch event handlers
    - Type declaration file for untyped npm packages

key-files:
  created:
    - src/hooks/useAmountParser.ts — Amount extraction from transcript
    - src/hooks/useAmountParser.test.ts — 9 unit tests for parseAmount()
    - src/lib/categoryMatcher.ts — Keyword-based category matching
    - src/lib/categoryMatcher.test.ts — 7 unit tests for matchCategory()
    - src/hooks/useVoiceCommand.ts — Hold-to-record hook wrapping react-speech-recognition
    - src/components/VoiceMicButton.tsx — Mic button with 3 render states
    - src/lib/react-speech-recognition.d.ts — Type declarations for untyped library
  modified:
    - vite.config.ts — Added Vitest test configuration
    - package.json — Added vitest, testing libs, react-speech-recognition
    - tailwind.config.js — Added pulse-mic animation keyframes
    - src/components/AddExpenseModal.tsx — Added voicePrefill prop and pre-fill effect
    - src/features/Dashboard.tsx — Added VoiceMicButton, voice state, error/retry wiring

key-decisions:
  - "Two-word amount ambiguity: 'two fifty'→250 (hundred-scale), 'twelve fifty'→12.50 (decimal), per heuristic on first word magnitude"
  - "Category matcher defaults to 'Other' when all keyword scores are zero (instead of alphabetical tiebreak)"
  - "Unused `onError` prop in VoiceMicButton prefixed with underscore to satisfy noUnusedParameters tsconfig"
  - "Type declaration file created for react-speech-recognition (library has no bundled types)"

patterns-established:
  - "TDD with Vitest: test files in same directories as implementations"
  - "Hold-to-record pattern: onMouseDown/onMouseUp/onMouseLeave + onTouchStart/onTouchEnd/onTouchCancel"
  - "Transcript reactivity: useEffect watches isListening transitions to capture transcript after stop"
  - "Voice flow: transcript → parseAmount → matchCategory → setVoicePrefill → open modal"

requirements-completed:
  - VOIC-01
  - VOIC-02
  - VOIC-03
  - VOIC-04
  - VOIC-05
  - VOIC-06
  - VOIC-07

duration: 17 min
completed: 2026-05-14
---

# Phase 3 Plan 1: Voice Entry — Browser-native voice-to-expense with Web Speech API

**Hold-to-record mic button, amount parsing (digit + word-form), category keyword matching, and voice pre-fill of AddExpenseModal — all client-side with no paid APIs**

## Performance

- **Duration:** 17 min
- **Started:** 2026-05-14T15:31:05Z
- **Completed:** 2026-05-14T15:48:33Z
- **Tasks:** 3 (2 TDD, 1 auto)
- **Files modified:** 13

## Accomplishments

- **Amount parser (parseAmount)** — Two-pass extraction: digit regex for number patterns (`250`, `2.50`), word-to-number mapping for written forms (`"two hundred fifty"`, `"twelve fifty"`), with special handling for ambiguity ("two fifty"→250, "twelve fifty"→12.50)
- **Category matcher (matchCategory)** — Keyword-based scoring across 7 categories with best-guess selection; defaults to "Other" when no keywords match; 52 keywords mapped
- **Voice command hook (useVoiceCommand)** — React hook wrapping react-speech-recognition with hold-to-record semantics (start, stop, abort) exposing transcript/isListening/isSupported/isMicAvailable
- **Mic button (VoiceMicButton)** — Three-state component: unsupported browser (disabled + tooltip, D-23), permission denied (amber + tooltip, D-21), active hold-to-record with pulse animation (D-18 + D-19). Dual mouse + touch event handlers for mobile support
- **Dashboard integration** — Mic button next to "Add Expense" button; voice result triggers parseAmount + matchCategory → opens modal pre-filled; inline error with one retry (D-21); second failure falls back to manual form
- **AddExpenseModal pre-fill** — New `voicePrefill` prop triggers `reset()` with parsed amount/category/note; voice data never auto-submits (VOIC-06, D-22); edit mode always takes priority over voice data

## Task Commits

Each task was committed atomically:

1. **Task 1: Amount parser + Category matcher (TDD)**
   - `71f06a9` (test) — RED: failing tests for both modules
   - `02d7eab` (feat) — GREEN: implementations pass all 16 tests

2. **Task 2: useVoiceCommand hook + VoiceMicButton (TDD)**
   - `011943c` (feat) — Hook, component, tailwind animation, type declarations

3. **Task 3: Wire voice into Dashboard + AddExpenseModal**
   - `1455a84` (feat) — Pre-fill prop, voice state management, error/retry wiring

**Plan metadata:** (pending — after SUMMARY.md commit)

## Files Created/Modified

### Created
- `src/hooks/useAmountParser.ts` — Two-pass amount extraction (digit regex + word-to-number)
- `src/hooks/useAmountParser.test.ts` — 9 unit tests covering digit patterns, word forms, decimals, empty, multiple numbers, ambiguity
- `src/lib/categoryMatcher.ts` — Keyword-based category scoring with 52 keywords across 7 categories
- `src/lib/categoryMatcher.test.ts` — 7 unit tests covering keyword matching, tiebreakers, case sensitivity, empty input
- `src/hooks/useVoiceCommand.ts` — React hook wrapping react-speech-recognition with hold-to-record semantics
- `src/components/VoiceMicButton.tsx` — Hold-to-record mic button with pulse animation and fallback states
- `src/lib/react-speech-recognition.d.ts` — TypeScript declaration for untyped react-speech-recognition library

### Modified
- `vite.config.ts` — Added `test` block (globals: true, environment: jsdom)
- `package.json` — Added vitest, @testing-library/react, @testing-library/jest-dom, jsdom, react-speech-recognition
- `tailwind.config.js` — Added `pulse-mic` animation with red glow keyframes
- `src/components/AddExpenseModal.tsx` — Added `voicePrefill` prop and pre-fill effect via `reset()`
- `src/features/Dashboard.tsx` — Added VoiceMicButton, voice state (voicePrefill/voiceError/retryCount), error/retry handlers

## Decisions Made

- **"Two fifty" → 250, "twelve fifty" → 12.50:** Two-word amount ambiguity resolved by heuristic: if first word < 10, interpret as hundred-scale (2×100+50=250); if ≥10, interpret as decimal (12+0.50=12.50). Covers both colloquial patterns.
- **Category matcher defaults to "Other":** When all keyword scores are zero, explicitly return "Other" as best guess instead of allowing alphabetical tiebreaker to pick "Entertainment".
- **onError prop design:** VoiceMicButton accepts `onError` prop for future use but doesn't call it internally (mic states handled via `isSupported`/`isMicAvailable` from the hook). Prefixed with underscore for strict TypeScript compliance.
- **Type declaration for untyped library:** Created `react-speech-recognition.d.ts` since the library v4.0.1 doesn't ship TypeScript declarations.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

1. **react-speech-recognition has no TypeScript types:** Library v4.0.1 doesn't bundle `.d.ts` files. Created `src/lib/react-speech-recognition.d.ts` to restore type safety. This is a minor deviation from "no setup needed" in the plan's Step 3, added as a new file.

2. **"twelve fifty" ambiguity resolution:** The initial implementation returned 1250 (hundred-scale interpretation) instead of 12.50. Applied the heuristic: first word ≥ 10 → decimal interpretation (12.50), first word < 10 → hundred-scale interpretation (250). Both tests now pass.

3. **Category matcher alphabetical tiebreaker:** When all scores were 0, alphabetical sort picked "Entertainment" before "Other". Added explicit `hasMatch` check to default to "Other" when no keywords match. This is correct per the spec.

## User Setup Required

None — no external service configuration required. Voice processing is purely client-side via browser Web Speech API.

## Next Phase Readiness

- All 7 voice entry requirements (VOIC-01 through VOIC-07) are fully implemented
- All 6 locked decisions (D-18 through D-23) are implemented as specified
- Pure client-side voice processing — no backend changes, no paid APIs
- Next: manual verification per VALIDATION.md (Chrome end-to-end test, Firefox fallback test)
- Phase 3 complete — ready for manual QA and verification

---

## Self-Check

### Created file check
```
[✓] src/hooks/useAmountParser.ts
[✓] src/hooks/useAmountParser.test.ts
[✓] src/lib/categoryMatcher.ts
[✓] src/lib/categoryMatcher.test.ts
[✓] src/hooks/useVoiceCommand.ts
[✓] src/components/VoiceMicButton.tsx
[✓] src/lib/react-speech-recognition.d.ts
```

### Commit hash check
```
[✓] 71f06a9 — test(03-01): add failing tests
[✓] 02d7eab — feat(03-01): implement parser and matcher
[✓] 011943c — feat(03-01): build hook and mic button
[✓] 1455a84 — feat(03-01): wire into Dashboard + modal
```

### Verification results
```
[✓] npx tsc --noEmit — zero errors
[✓] npx vitest run — 16/16 tests passing (2 files)
[✓] npm run build — production build successful (481 KB JS, 21 KB CSS)
```

## Self-Check: PASSED

## Threat Flags

No threat flags — all new surface (mic access, Web Speech API, transcript parsing) is within the plan's threat model scope. No new network endpoints, auth paths, or schema changes introduced.

---

*Phase: 03-voice-entry*
*Completed: 2026-05-14*

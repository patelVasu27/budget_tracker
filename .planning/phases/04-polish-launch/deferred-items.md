# Deferred Items — Phase 04 Polish & Launch

## Pre-existing TypeScript errors in Dashboard.tsx

- **File:** `src/features/Dashboard.tsx`
- **Issue:** `isLoadingSettings` (line 31) and `isLoadingTransactions` (line 47) are declared but never read.
- **Cause:** Uncommitted modifications from Phase 3 introduced `isLoading` destructuring that is not consumed in the render.
- **Impact:** `npm run build` (which runs `tsc && vite build`) fails. `npx tsc --noEmit` also now reports the error.
- **Fix needed:** Remove the unused destructured variables or prefix with underscore.
- **Found during:** Plan 04-01, Task 3 verification.
- **Not fixed because:** Out of scope — file was not created or modified by this plan.
- **Should be fixed by:** Plan 04-02 (a11y/polish) which already modifies Dashboard.tsx, or a dedicated follow-up.
- **RESOLVED:** Commit `ad4b3e7` (a11y polish) resolved the unused variable errors as part of its Dashboard.tsx modifications.

# Phase 3: Voice Entry — Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Browser-native voice-to-expense feature using Web Speech API. Users can speak an expense and have it pre-filled into the expense form for confirmation. No paid APIs, no server-side processing. Graceful fallback when Web Speech API is unavailable.
</domain>

<decisions>
## Implementation Decisions

### Voice Activation
- **D-18:** Hold-to-record — press and hold the mic button while speaking, release to stop. Familiar pattern (like WhatsApp voice notes).

### Listening UI
- **D-19:** Pulsing mic animation while listening. The mic icon pulses/animates with a subtle glow. Simple and non-intrusive.

### Category Matching
- **D-20:** Show all categories as a suggestion grid with the best guess pre-selected. Not auto-save — user picks from the grid.

### Error Handling
- **D-21:** Show a friendly error message and offer to retry recording. If retry also fails, fall back to the manual expense form.

### Confirmation Flow
- **D-22:** Pre-fill the existing AddExpenseModal with voice-parsed data. User reviews all fields and clicks Save. Complies with VOIC-06 (no auto-save).

### Fallback UX
- **D-23:** Show disabled mic button with tooltip: "Voice input not supported in your browser" when Web Speech API is unavailable.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/phases/01-foundation-dashboard/01-CONTEXT.md` — Phase 1 decisions (layout, auth, schema)
- `.planning/phases/02-expense-entry-transactions/02-CONTEXT.md` — Phase 2 decisions (expense form, transaction list)
- `src/components/AddExpenseModal.tsx` — Target form that voice data will pre-fill
- `src/features/Dashboard.tsx` — Dashboard wiring (Add Expense button opens modal)

</canonical_refs>

<code_context>
## Existing Code to Integrate With

### Key Integration Points

- **AddExpenseModal.tsx** — Voice data will pre-fill this form. Currently accepts `editTransaction` prop for edit mode. Voice mode could use a similar approach.
- **Dashboard.tsx** — Contains the "Add Expense" button logic. Voice mic button should sit alongside or near this button.

### Web Speech API Notes

- `webkitSpeechRecognition` / `SpeechRecognition` — browser API
- `recognition.start()` / `.stop()` — control recording
- `recognition.onresult` — get transcript
- `recognition.lang = 'en-US'` — language setting
- `recognition.interimResults = false` — only final results
- Firefox and Safari have limited/partial support (hence fallback)

### Categories for Keyword Matching

```
Food, Transport, Utilities, Entertainment, Shopping, Health, Other
```

Keyword synonyms for matching (implementer's discretion):
- Food: groceries, lunch, dinner, breakfast, eat, restaurant, cafe
- Transport: gas, fuel, uber, taxi, bus, train, parking
- Utilities: electricity, water, bill, phone, internet
- Entertainment: movies, games, netflix, spotify, concert
- Shopping: clothes, amazon, store, mall
- Health: doctor, pharmacy, medicine, gym
</code_context>

<specifics>
## Specific Ideas

- Mic button in the expense form header area, not separate floating button
- Hold-to-record feels natural for quick expense logging
- Pulsing mic animation signals recording is active without being distracting
- Reuse existing modal instead of building a separate confirmation screen
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 3-Voice Entry*
*Context gathered: 2026-05-14*

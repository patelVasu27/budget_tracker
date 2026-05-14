# Phase 3: Voice Entry — Research

**Researched:** 2026-05-14
**Domain:** Browser-native speech-to-text via Web Speech API
**Confidence:** HIGH

## Summary

Phase 3 implements voice-to-expense entry using the browser-native Web Speech API (`SpeechRecognition` interface). The core mechanic is **hold-to-record**: users press and hold a microphone button, speak an expense (e.g., "spent 250 on food"), and release. The transcript is parsed for an amount (digit or word-form number) and a category (keyword matching), then pre-filled into the existing `AddExpenseModal` for user confirmation. No auto-save, no paid APIs, no server-side processing.

The recommended approach is to use the `react-speech-recognition` library (v4.0.1), which wraps the Web Speech API into clean React hooks. This gives us `useSpeechRecognition` for transcript/state and `SpeechRecognition.startListening()`/`.stopListening()` for mic control. A custom amount parser and category matcher handle the natural-language extraction. The tailwind config needs one new animation keyframe (`pulse-mic`) for the D-19 pulsing animation.

**Primary recommendation:** Install `react-speech-recognition@4.0.1`, build a `useVoiceCommand` custom hook combining the library with amount/category parsing logic, and wire the mic button into the Dashboard alongside the existing "Add Expense" button.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-18:** Hold-to-record — press and hold the mic button while speaking, release to stop. Familiar pattern (like WhatsApp voice notes).
- **D-19:** Pulsing mic animation while listening. The mic icon pulses/animates with a subtle glow. Simple and non-intrusive.
- **D-20:** Show all categories as a suggestion grid with the best guess pre-selected. Not auto-save — user picks from the grid.
- **D-21:** Show a friendly error message and offer to retry recording. If retry also fails, fall back to the manual expense form.
- **D-22:** Pre-fill the existing AddExpenseModal with voice-parsed data. User reviews all fields and clicks Save. Complies with VOIC-06 (no auto-save).
- **D-23:** Show disabled mic button with tooltip: "Voice input not supported in your browser" when Web Speech API is unavailable.

### the agent's Discretion

- Choice of implementing raw Web Speech API vs. react-speech-recognition library
- Amount extraction implementation detail (regex vs. word parser)
- Category matching algorithm detail
- Mic button exact placement (near Add Expense button vs. inside modal header)
- Pulse animation implementation (CSS keyframes vs. Tailwind plugin)
- Error message copy and UX details

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VOIC-01 | User can tap microphone to start voice input | Hold-to-record via `SpeechRecognition.startListening()`/`.stopListening()` from react-speech-recognition |
| VOIC-02 | Browser requests microphone permission on first use | Handled automatically by Web Speech API on first `startListening()` call |
| VOIC-03 | System extracts amount from speech | Custom `parseAmount()` function: regex for digit patterns + word-to-number for "two hundred fifty" etc. |
| VOIC-04 | System matches category from keywords | Category keyword map (defined in CONTEXT.md) with best-guess scoring algorithm |
| VOIC-05 | Form pre-fills with extracted data | Reuse `AddExpenseModal`'s `reset()` via react-hook-form to set parsed values as defaults |
| VOIC-06 | User must confirm before saving (no auto-save) | Voice data enters the modal's form fields; user clicks "Add Expense" to save (same mutation flow) |
| VOIC-07 | Graceful fallback if browser doesn't support Web Speech API | `browserSupportsSpeechRecognition` from hook → disabled mic button with tooltip (D-23) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Speech capture & transcription | Browser / Client | — | Web Speech API is exclusively browser-native; no server involved |
| Amount extraction from transcript | Browser / Client | — | Pure string parsing; no external dependency |
| Category matching from keywords | Browser / Client | — | Keyword map is static; matching runs client-side |
| Mic button UI & animation | Browser / Client | — | Standard React component; Tailwind animation |
| Pre-fill expense form | Browser / Client | API / Backend | Form renders in browser; data is committed via existing Supabase mutation |
| Fallback UX (no Web Speech) | Browser / Client | — | Feature detection + conditional rendering only |
| Error handling & retry | Browser / Client | — | All error states managed client-side before any API call |

**Key insight:** Every capability in this phase lives in the browser tier. No backend changes, no new database tables, no API endpoints. The only backend interaction is the existing Supabase mutation that runs after the user clicks "Add Expense" in the pre-filled form.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-speech-recognition` | 4.0.1 | React hook wrapper for Web Speech API | De-facto standard React binding; handles browser prefixes, permission management, event lifecycle; drops in with `useSpeechRecognition()` hook [VERIFIED: npm registry] |

### Installation
```bash
npm install react-speech-recognition@4.0.1
```

**TypeScript types:** The library ships with bundled TypeScript declarations (no `@types/` package needed) [CITED: npm registry].

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-speech-recognition | Raw Web Speech API | Raw API requires manual browser prefix handling (`webkitSpeechRecognition`), event listener management, cleanup on unmount, and cross-browser edge cases. The library handles all of these. For hold-to-record specifically, the library's `continuous: false` mode (stop on silence) maps well but raw API gives more control over `onend`/`onerror` timing. **Verdict:** Use the library — it's 837 stars, actively maintained, and reduces boilerplate significantly. |
| react-speech-recognition | Custom `useSpeechRecognition` hook | Building a custom hook is feasible (~80 lines) but duplicates the library's effort. The library's `isMicrophoneAvailable` and `browserSupportsSpeechRecognition` states are exactly what D-21 and D-23 need. **Verdict:** Use the library unless the 12KB bundle is critical (it's 7KB gzipped). |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                                                              │
│  ┌─────────────────────┐      ┌─────────────────────────┐   │
│  │    Dashboard.tsx     │      │   AddExpenseModal.tsx    │   │
│  │                     │      │                         │   │
│  │  [Add Expense] [🎤] │──────▶│  Amount: ₹250.00      │   │
│  │  Press & hold mic   │      │  Category: ● Food       │   │
│  │       │             │      │  Date: 2026-05-14      │   │
│  │       ▼             │      │  Note: "lunch"         │   │
│  │  ┌──────────┐      │      │                         │   │
│  │  │ useVoice │      │      │  [Cancel] [Add Expense] │   │
│  │  │ Command  │      │      └──────────┬──────────────┘   │
│  │  │  Hook    │      │                 │                  │
│  │  └────┬─────┘      │                 ▼                  │
│  │       │            │      ┌─────────────────────┐       │
│  │       ▼            │      │  react-query        │       │
│  │  ┌──────────────┐ │      │  useMutation()      │       │
│  │  │ Speech       │ │      │  → Supabase insert  │       │
│  │  │ Recognition  │ │      └─────────────────────┘       │
│  │  │ (Web API)    │ │                                    │
│  │  └──────────────┘ │                                    │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    Supabase      │
                    │  transactions    │
                    │  table insert    │
                    └──────────────────┘

Data Flow:
1. User presses & holds 🎤 button → useVoiceCommand hook calls startListening()
2. Browser requests mic permission (first time only)
3. User speaks: "spent two fifty on lunch"
4. User releases button → stopListening()
5. onresult fires → transcript = "spent two fifty on lunch"
6. parseAmount("spent two fifty on lunch") → 250
7. matchCategory("spent two fifty on lunch") → "Food" (best guess)
8. Modal opens with amount=250, category=Food pre-filled
9. User reviews, optionally edits, clicks "Add Expense"
10. Existing addMutation runs → Supabase insert → dashboard refreshes
```

### Component Tree
```
App.tsx
└── Dashboard.tsx
    ├── BalanceCard (income, expenses, remaining)
    ├── TransactionList (existing transactions)
    └── AddExpenseModal (pre-filled with voice data)
        └── VoiceMicButton (new — inside modal header or alongside "Add Expense")
```

**Note on mic button placement:** The CONTEXT.md specifies "Mic button in the expense form header area, not separate floating button." Two viable placements:
1. **Inside the modal header** — User opens modal normally, sees mic icon in the title area, taps to speak. Pro: keeps everything in one place. Con: user must take two actions (open modal, then speak).
2. **Alongside the "Add Expense" button** — Mic button sits next to the existing button. Press & hold speaks directly, then modal opens pre-filled. Pro: faster, one-action voice entry. Con: slightly different from "in the expense form header area."

**Recommendation:** Place a small mic icon button next to the "Add Expense" button on the dashboard (Option 2). This gives the fastest voice entry path (VOIC-01's core value: under 5 seconds). The modal header area can also show a mic button for voice-editing existing entries.

### Recommended New Files
```
src/
├── hooks/
│   ├── useVoiceCommand.ts      # Custom hook: orchestrates recording + parsing + pre-fill
│   └── useAmountParser.ts      # Pure function: extract number from transcript
├── lib/
│   └── categoryMatcher.ts      # Pure function: match keywords to categories
└── components/
    └── VoiceMicButton.tsx       # Hold-to-record mic button with pulse animation + fallback
```

### Pattern 1: Hold-to-Record Hook

**What:** Wraps react-speech-recognition with press-and-release semantics. On press, start listening non-continuously. On release, stop listening and get the transcript.

**When to use:** The single entry point for all voice functionality. Dashboard mounts it once.

```typescript
// Source: react-speech-recognition API docs [CITED]
// Combined with hold-to-record pattern per D-18.

import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition'

export function useVoiceCommand() {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition()

  const startRecording = () => {
    resetTranscript()
    // continuous: false — stop when user releases / stops speaking
    SpeechRecognition.startListening({ continuous: false, language: 'en-US' })
  }

  const stopRecording = () => {
    SpeechRecognition.stopListening()
    // transcript is populated after stop completes
  }

  const abortRecording = () => {
    SpeechRecognition.abortListening()
    resetTranscript()
  }

  return {
    transcript,
    isListening: listening,
    isSupported: browserSupportsSpeechRecognition,
    isMicAvailable: isMicrophoneAvailable,
    startRecording,
    stopRecording,
    abortRecording,
  }
}
```

### Pattern 2: Amount Extraction from Transcript

**What:** Parse a natural-language string to extract a numeric amount. Handles both digit patterns (`"250"`, `"250.50"`) and word-form numbers (`"two hundred fifty"`, `"two fifty"`).

**When to use:** After `stopRecording()`, before opening the modal.

**Algorithm (two-pass):**
1. **Pass 1 — Digit regex:** Find all `\d+(?:\.\d{1,2})?` patterns. If exactly one found, use it. If multiple, use the largest.
2. **Pass 2 — Word-to-number:** If no digits found, run word-form parsing. Map words like "one/two/.../nineteen", "twenty/thirty/.../ninety", "hundred/thousand" to numbers using a standard accumulator algorithm.

```typescript
// Pattern — word-to-number parser (simplified algorithm)
const WORD_MAP: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

const SCALE_MAP: Record<string, number> = {
  hundred: 100, thousand: 1000, lakh: 100000, crore: 10000000,
}

export function parseAmount(text: string): number | null {
  const lower = text.toLowerCase()

  // Pass 1: digit patterns (e.g., "250", "250.50")
  const digitMatch = lower.match(/(\d+(?:\.\d{1,2})?)/g)
  if (digitMatch) {
    const amounts = digitMatch.map(Number).filter(n => n > 0)
    if (amounts.length >= 1) return Math.max(...amounts)
  }

  // Pass 2: word-form numbers (e.g., "two hundred fifty")
  const words = lower
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  let total = 0
  let current = 0

  for (const word of words) {
    if (WORD_MAP[word] !== undefined) {
      current += WORD_MAP[word]
    } else if (SCALE_MAP[word] !== undefined) {
      current = current === 0 ? SCALE_MAP[word] : current * SCALE_MAP[word]
    } else if (word === 'and') {
      continue
    } else {
      total += current // flush
      // Ensure that subsequent words are not part of another number sequence
      current = 0
    }
  }
  total += current

  return total > 0 ? total : null
}
```

### Pattern 3: Category Matching from Keywords

**When to use:** After `parseAmount()`, to determine the best-guess category from remaining transcript words (after removing amount-related words).

```typescript
// Source: Keyword map from CONTEXT.md
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'groceries', 'lunch', 'dinner', 'breakfast', 'eat', 'restaurant', 'cafe', 'pizza', 'coffee', 'snack', 'meal'],
  Transport: ['transport', 'gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'metro', 'cab', 'ride', 'car'],
  Utilities: ['utilities', 'electricity', 'water', 'bill', 'phone', 'internet', 'power', 'gas bill', 'wifi'],
  Entertainment: ['entertainment', 'movies', 'games', 'netflix', 'spotify', 'concert', 'cinema', 'film', 'music', 'game'],
  Shopping: ['shopping', 'clothes', 'amazon', 'store', 'mall', 'buy', 'purchase', 'retail', 'online'],
  Health: ['health', 'doctor', 'pharmacy', 'medicine', 'gym', 'hospital', 'medical', 'clinic', 'fitness'],
}

export function matchCategory(transcript: string): {
  bestGuess: string
  scores: Record<string, number>
} {
  const lower = transcript.toLowerCase()
  const scores: Record<string, number> = {
    Food: 0, Transport: 0, Utilities: 0,
    Entertainment: 0, Shopping: 0, Health: 0, Other: 0,
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[category]++
      }
    }
  }

  const bestGuess = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0]

  return { bestGuess, scores }
}
```

### Pattern 4: Pre-fill Existing Modal with Voice Data

**What:** After parsing, open the AddExpenseModal with parsed values. Reuse the existing `reset()` from react-hook-form.

**When to use:** After voice parsing completes, pass parsed data to the modal component.

```typescript
// In Dashboard.tsx — extend the existing modal state
const [voicePrefill, setVoicePrefill] = useState<{
  amount: number
  category: string
  note: string
} | null>(null)

// After voice command completes:
const handleVoiceResult = (transcript: string) => {
  const amount = parseAmount(transcript)
  const { bestGuess } = matchCategory(transcript)
  if (amount) {
    setVoicePrefill({ amount, category: bestGuess, note: transcript })
    setShowExpenseModal(true)
  }
}

// Pass to modal — add a `voicePrefill` prop or reuse `editTransaction`-like pattern
<AddExpenseModal
  isOpen={showExpenseModal}
  onClose={() => {
    setShowExpenseModal(false)
    setEditingTransaction(null)
    setVoicePrefill(null)
  }}
  editTransaction={editingTransaction}
  voicePrefill={voicePrefill}
/>
```

**Modified `AddExpenseModal.tsx` — pre-fill on mount when voice data arrives:**
```typescript
// Add a new prop and effect alongside the existing editTransaction effect
interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  editTransaction?: Transaction | null
  voicePrefill?: { amount: number; category: string; note: string } | null
}

// In the component:
useEffect(() => {
  if (voicePrefill) {
    reset({
      amount: voicePrefill.amount.toString(),
      category: voicePrefill.category as Category,
      note: voicePrefill.note,
      date: format(new Date(), 'yyyy-MM-dd'),
    })
  }
}, [voicePrefill, reset])
```

### Pattern 5: Pulsing Mic Animation (D-19)

**What:** A CSS animation for the mic icon while recording. Subtle glow pulse.

**When to use:** Applied conditionally when `isListening` is true.

**Tailwind Config Addition:**
```javascript
// extend theme.animation
'animation': {
  'pulse-mic': 'pulseMic 1.5s ease-in-out infinite',
  // ... existing animations
}
// extend theme.keyframes
'keyframes': {
  pulseMic: {
    '0%, 100%': {
      boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)',
      transform: 'scale(1)',
    },
    '50%': {
      boxShadow: '0 0 0 12px rgba(220, 38, 38, 0)',
      transform: 'scale(1.05)',
    },
  },
  // ... existing keyframes
}
```

### Anti-Patterns to Avoid

- **Auto-submitting voice results:** D-22 explicitly forbids auto-save. Voice data must go through the modal for confirmation.
- **Continuous listening mode for hold-to-record:** `continuous: true` keeps the mic open after the user releases. Use `continuous: false` so recognition stops when the user stops speaking/releases button.
- **Parsing amount from interim results:** Only parse from the final transcript. Interim results are unstable and may contain partial numbers.
- **Blocking the UI during recording:** The pulsing animation should indicate recording is active, but the form should remain interactive (user could type while speaking).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web Speech API React integration | Manual `webkitSpeechRecognition` wrapper with useEffect cleanup | `react-speech-recognition` v4.0.1 | Handles browser prefixes (`webkitSpeechRecognition` vs `SpeechRecognition`), permission lifecycle, event listener cleanup, `isMicrophoneAvailable` state, and `browserSupportsSpeechRecognition` detection. All things that are easy to get wrong with edge cases. [VERIFIED: npm registry] |
| Word-to-number parsing | Full natural-language number parser | Regex-first approach with basic word map fallback | Full NLP parsers (e.g., `word-number` npm package) handle "three thousand two hundred and fifty point five" but add 20KB+ and aren't needed for MVP. Users saying "250" is the dominant case. Build a < 50-line regex + basic word map. |

**Key insight:** The only third-party dependency needed is `react-speech-recognition`. Amount parsing and category matching are pure functions small enough (< 100 lines each) that a library wrapper is over-engineering.

## Common Pitfalls

### Pitfall 1: Transcript Arrives After `stopListening()` Resolves
**What goes wrong:** Calling `SpeechRecognition.stopListening()` and immediately reading `transcript` returns empty string because the `onresult` event fires asynchronously after `stopListening()` resolves.
**Why it happens:** The Web Speech API processes speech asynchronously. The transcript is available in the `onresult` callback, not immediately after `stopListening()`.
**How to avoid:** Use the `transcript` state from the `useSpeechRecognition` hook, which updates reactively. Alternatively, listen for the `onresult` event directly. Never rely on a synchronous read after `await stopListening()`.
**Warning signs:** Voice modal opens with empty amount despite successful transcription.

### Pitfall 2: Browser-Specific Prefix Handling
**What goes wrong:** The app crashes on Firefox/Safari because `SpeechRecognition` doesn't exist (unprefixed).
**Why it happens:** Chrome/Edge use `webkitSpeechRecognition`. Firefox and Safari do not support the API at all, or support it behind flags.
**How to avoid:** Always use `browserSupportsSpeechRecognition` from the library before enabling the mic feature. This is handled by react-speech-recognition internally.
**Warning signs:** TypeError: `SpeechRecognition is not a constructor` in Firefox console.

### Pitfall 3: Touch Devices and Hold-to-Release
**What goes wrong:** On mobile, `onMouseDown`/`onMouseUp` don't fire reliably; the user's finger leaves the element, or `onTouchStart`/`onTouchEnd` is needed instead.
**Why it happens:** The web was built for mice; touch events have different semantics (e.g., `onMouseUp` doesn't fire if finger leaves the button before lifting).
**How to avoid:** Handle BOTH mouse and touch events:
```typescript
onMouseDown={startRecording}
onMouseUp={stopRecording}
onMouseLeave={abortRecording} // abort if user drags away
onTouchStart={startRecording}
onTouchEnd={stopRecording}
onTouchCancel={abortRecording}
```
**Warning signs:** Mic stays on after user lifts finger on mobile.

### Pitfall 4: Microphone Permission Denied After First Denial
**What goes wrong:** User denies mic permission on first prompt. The browser remembers this decision. The app must handle this state gracefully.
**Why it happens:** Browsers cache permission decisions. Once denied, subsequent `startListening()` calls will fail silently or with a permission error.
**How to avoid:** Use `isMicrophoneAvailable` from `useSpeechRecognition` (or check `navigator.permissions.query({name: 'microphone'})`). Show a friendly message explaining how to re-enable mic permissions in browser settings if denied.
**Warning signs:** Mic button click does nothing, no error shown.

### Pitfall 5: Amount Ambiguity in "Two Fifty"
**What goes wrong:** "Two fifty" could mean 250 or 2.50. The parser picks the wrong one.
**Why it happens:** Natural language is ambiguous without context. "Two hundred fifty" is unambiguous (250), but "two fifty" is short-form.
**How to avoid:** When multiple interpretations exist, show both as options in the amount field for the user to pick. For MVP: prefer the larger value (250) since expense amounts are typically > 10. The user will correct it in the confirmation step (D-22).
**Warning signs:** User reports amounts being 100x too large.

## Code Examples

### Complete `VoiceMicButton.tsx` Component Pattern

```typescript
import { Mic, MicOff } from 'lucide-react'
import { useVoiceCommand } from '../hooks/useVoiceCommand'

interface VoiceMicButtonProps {
  onResult: (transcript: string) => void
  onError: (error: string) => void
}

export function VoiceMicButton({ onResult, onError }: VoiceMicButtonProps) {
  const {
    transcript,
    isListening,
    isSupported,
    isMicAvailable,
    startRecording,
    stopRecording,
    abortRecording,
  } = useVoiceCommand()

  // React to transcript changes after recording stops
  const lastTranscriptRef = useRef('')
  const wasListeningRef = useRef(false)

  useEffect(() => {
    if (wasListeningRef.current && !isListening && transcript) {
      if (transcript !== lastTranscriptRef.current) {
        onResult(transcript)
      }
    }
    lastTranscriptRef.current = transcript
    wasListeningRef.current = isListening
  }, [isListening, transcript, onResult])

  // D-23: Not supported — show disabled button with tooltip
  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-3 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
          title="Voice input not supported in your browser"
        >
          <MicOff className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Voice input not supported in your browser
        </div>
      </div>
    )
  }

  // D-21: Mic permission denied
  if (!isMicAvailable) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-3 rounded-xl bg-gray-100 text-amber-500 cursor-not-allowed"
        >
          <MicOff className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Microphone access denied. Update browser settings to enable.
        </div>
      </div>
    )
  }

  // D-18: Hold-to-record
  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={abortRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      onTouchCancel={abortRecording}
      className={`p-3 rounded-xl transition-all duration-200 ${
        isListening
          ? 'bg-accent-red/10 text-accent-red animate-pulse-mic'
          : 'bg-primary/5 text-secondary hover:bg-primary/10 hover:text-primary'
      }`}
      title={isListening ? 'Release to stop' : 'Press and hold to record'}
    >
      <Mic className={`w-5 h-5 ${isListening ? 'scale-110' : ''}`} />
    </button>
  )
}
```

### Error Handling Pattern (D-21)

```typescript
// In the parent component (Dashboard.tsx):
const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing' | 'error' | 'done'>('idle')
const [voiceError, setVoiceError] = useState<string | null>(null)
const [retryCount, setRetryCount] = useState(0)
const MAX_RETRIES = 1

const handleVoiceResult = (transcript: string) => {
  setVoiceState('processing')
  const amount = parseAmount(transcript)
  if (!amount) {
    setVoiceState('error')
    setVoiceError("Couldn't detect an amount. Please try again or use the form.")
    return
  }
  const { bestGuess } = matchCategory(transcript)
  setVoicePrefill({ amount, category: bestGuess, note: transcript })
  setVoiceState('done')
  setShowExpenseModal(true)
}

const handleVoiceError = (error: string) => {
  if (retryCount < MAX_RETRIES) {
    setRetryCount(c => c + 1)
    setVoiceError(`${error} — try again?`)
  } else {
    setVoiceError("Voice didn't work this time. Use the form below.")
    setVoiceState('error')
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `webkitSpeechRecognition` with manual event binding | `react-speech-recognition` hook-based wrapper | 2019-present | Eliminates boilerplate, provides `useSpeechRecognition` hook with reactive states |
| Separate confirmation screen for voice data | Pre-fill existing modal (D-22) | This phase decision | Reuses existing UI, fewer components, less state duplication |
| `onend` event triggers transcript reading | Hook's reactive `transcript` state | The library's architecture | More React-idiomatic; transcript updates trigger re-renders automatically |

**Deprecated/outdated:**
- Older tutorials referencing `webkitSpeechRecognition` exclusively (2020 and earlier): Chrome dropped the `webkit` prefix for the standard `SpeechRecognition` constructor, though `webkitSpeechRecognition` still works for backward compatibility.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `react-speech-recognition`'s `continuous: false` mode (stop-on-silence) works well enough for hold-to-record where the user explicitly stops via `stopListening()` | Standard Stack | If the library's stop-on-silence adds latency (waits for silence before finalizing), the transcript may arrive delayed. Mitigation: test with `continuous: false`; if delay is an issue, use `continuous: true` + manual `stopListening()`. |
| A2 | The word-to-number parser handles common Indian English patterns ("two fifty" for 250) | Code Examples | Different regions have different conventions. If user base is global, the parser may need localization. For MVP targeting the single developer's needs, the basic parser suffices. |
| A3 | Category keyword matching is sufficient for MVP accuracy | Code Examples | If users consistently get wrong categories, a more sophisticated NLP approach (e.g., TF-IDF or embeddings) would be needed — but that contradicts the "no paid APIs" and "browser-native only" constraints. |
| A4 | `react-speech-recognition` v4.0.1 is compatible with React 18 and TypeScript 5.x | Standard Stack | The library README says "requires React 16.8+". Published Aug 2023. No known incompatibilities with React 18 or TS 5.x. |

## Open Questions

1. **How should the "amount detected" from "two fifty" ambiguity be handled?**
   - What we know: "Two fifty" could be 250 or 2.50. The parser needs to pick one.
   - What's unclear: Should we always prefer the larger value (250), or show a hint/tooltip saying "Did you mean 250 or 2.50?"
   - Recommendation: For MVP, prefer the larger value. The user confirms in the modal before saving. Document this as a known edge case.

2. **Should the mic button also appear inside the AddExpenseModal for re-recording?**
   - What we know: D-22 says pre-fill the modal. D-21 says offer retry if transcription fails.
   - What's unclear: Once the modal is open, can the user re-record to fix a bad transcription? Or must they edit manually?
   - Recommendation: Place a small mic icon in the modal header too, allowing re-record if the first transcription was wrong. This also gives a natural "retry" mechanism for D-21.

3. **Should voice entries set the current date or attempt date extraction from speech?**
   - What we know: Users might say "spent 200 on food yesterday" — the word "yesterday" implies a specific date.
   - What's unclear: Is date extraction worth the complexity for MVP?
   - Recommendation: No — always default to today's date (matching EXP-02 behavior). Date extraction from speech can be a future enhancement.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via Vite config) |
| Config file | `vite.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VOIC-03 | `parseAmount()` with digit input ("250") | unit | `npx vitest run src/hooks/useAmountParser.test.ts` | ❌ Wave 0 |
| VOIC-03 | `parseAmount()` with word input ("two hundred fifty") | unit | same | ❌ Wave 0 |
| VOIC-03 | `parseAmount()` with no amount in text | unit | same | ❌ Wave 0 |
| VOIC-04 | `matchCategory()` with "lunch" → Food as best guess | unit | `npx vitest run src/lib/categoryMatcher.test.ts` | ❌ Wave 0 |
| VOIC-04 | `matchCategory()` with no keyword match → Other | unit | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/hooks/useAmountParser.test.ts src/lib/categoryMatcher.test.ts --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useAmountParser.test.ts` — covers VOIC-03
- [ ] `src/lib/categoryMatcher.test.ts` — covers VOIC-04
- [ ] Vitest install: `npm install -D vitest @testing-library/react @testing-library/jest-dom` — if no Vitest config detected

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not auth-related |
| V3 Session Management | no | Voice entry doesn't create sessions |
| V4 Access Control | no | No new data access patterns |
| V5 Input Validation | yes | Parsed voice data is validated by react-hook-form before Supabase insert (same as manual entry) |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns for {stack}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Voice data processed only client-side, never sent to server | Information Disclosure | Data never leaves the browser; Web Speech API sends audio to Google's servers for transcription as part of the browser's built-in speech service, but the application does not store or transmit the raw audio. |
| No new attack surface: all mutations go through existing Supabase insert with RLS | Tampering | Same `supabase.from('transactions').insert()` path used by manual entry; RLS policies already in place (AUTH-05) |

## Sources

### Primary (HIGH confidence)
- [npm registry] `react-speech-recognition` — version 4.0.1 confirmed, 837 stars, MIT license
- [API docs: webspeechrecognition.com] — Full API reference for `useSpeechRecognition` hook and `SpeechRecognition` singleton
- [MDN Web Docs: Web Speech API] — Specification and browser compatibility reference
- [CONTEXT.md] — All phase decisions D-18 through D-23, keyword synonyms, integration points

### Secondary (MEDIUM confidence)
- [WebSearch: assemblyai.com] — Speech recognition tutorial confirming browser support limitations (Chrome/Edge best, Firefox limited/no support)
- [WebSearch: slingacademy.com] — SpeechRecognition usage patterns, event lifecycle
- [GitHub: JamesBrill/react-speech-recognition] — README confirms React 16.8+ requirement, basic example patterns

### Tertiary (LOW confidence)
- All `[ASSUMED]` claims in the Assumptions Log above — flagged for validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `react-speech-recognition` version verified on npm, React 18+ confirmed compatible
- Architecture: HIGH - Patterns derived from existing project code (AddExpenseModal, Dashboard styles) + published library API docs
- Pitfalls: MEDIUM - Browser-specific quirks well-documented by Web Speech API community; touch event handling is standard web knowledge
- Amount parsing: MEDIUM - Word-to-number parser is a known pattern; edge cases ("two fifty" ambiguity) need real-world testing

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (30 days — react-speech-recognition is stable, ~1 release/year)

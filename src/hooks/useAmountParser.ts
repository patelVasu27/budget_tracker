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
  hundred: 100,
  thousand: 1000,
}

/**
 * Extracts a numeric amount from a spoken transcript.
 *
 * Two-pass approach:
 * 1. Digit regex — finds `\d+(?:\.\d{1,2})?` patterns, picks the largest.
 * 2. Word-to-number — maps words like "two", "fifty", "hundred" to numbers.
 *
 * "two fifty" is ambiguous (250 vs 2.50). When both digit and word parsing
 * produce different values, the larger value is preferred (MVP assumption:
 * expense amounts are typically > 10, see RESEARCH.md Pitfall 5).
 */
export function parseAmount(text: string): number | null {
  const lower = text.toLowerCase().trim()

  if (!lower) return null

  // Pass 1: digit patterns (e.g., "250", "250.50")
  const digitMatches = lower.match(/\d+(?:\.\d{1,2})?/g)
  if (digitMatches) {
    const amounts = digitMatches.map(Number).filter((n) => n > 0)
    if (amounts.length >= 1) {
      return Math.max(...amounts)
    }
  }

  // Pass 2: word-form numbers (e.g., "two hundred fifty")
  const words = lower
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return null

  let total = 0
  let current = 0
  let foundNumber = false
  let prevNum = 0
  let prevIsNum = false

  for (const word of words) {
    if (word === 'and') continue

    if (WORD_MAP[word] !== undefined) {
      const num = WORD_MAP[word]
      if (prevIsNum && prevNum < 10 && num >= 10 && num < 100) {
        current = current - prevNum + (prevNum * 100 + num)
      } else {
        current += num
      }
      prevNum = num
      prevIsNum = true
      foundNumber = true
    } else if (SCALE_MAP[word] !== undefined) {
      prevIsNum = false
      current = current === 0 ? SCALE_MAP[word] : current * SCALE_MAP[word]
      foundNumber = true
    } else {
      // Non-number word; flush current accumulator
      total += current
      current = 0
      prevIsNum = false
    }
  }
  total += current

  // Special case: two-word number patterns like "two fifty" or "twelve fifty"
  if (words.length === 2 && WORD_MAP[words[0]] !== undefined && WORD_MAP[words[1]] !== undefined) {
    const first = WORD_MAP[words[0]]
    const second = WORD_MAP[words[1]]
    if (second >= 10 && second < 100) {
      // "two fifty" → 250 (colloquial for 250)
      // "twelve fifty" → 12.50 (colloquial for $12.50)
      // Heuristic: first < 10 prefers combined hundred-scale; first >= 10 prefers decimal
      if (first < 10) {
        return first * 100 + second
      } else {
        return first + second / 100
      }
    }
  }

  return foundNumber && total > 0 ? total : null
}

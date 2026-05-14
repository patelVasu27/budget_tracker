const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'groceries', 'lunch', 'dinner', 'breakfast', 'eat', 'restaurant', 'cafe', 'pizza', 'coffee', 'snack', 'meal'],
  Transport: ['transport', 'gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'metro', 'cab', 'ride', 'car'],
  Utilities: ['utilities', 'electricity', 'water', 'bill', 'phone', 'internet', 'power', 'wifi'],
  Entertainment: ['entertainment', 'movies', 'games', 'netflix', 'spotify', 'concert', 'cinema', 'film', 'music', 'game'],
  Shopping: ['shopping', 'clothes', 'amazon', 'store', 'mall', 'buy', 'purchase', 'retail', 'online'],
  Health: ['health', 'doctor', 'pharmacy', 'medicine', 'gym', 'hospital', 'medical', 'clinic', 'fitness'],
}

const DEFAULT_CATEGORIES: Record<string, number> = {
  Food: 0,
  Transport: 0,
  Utilities: 0,
  Entertainment: 0,
  Shopping: 0,
  Health: 0,
  Other: 0,
}

export interface CategoryMatch {
  bestGuess: string
  scores: Record<string, number>
}

/**
 * Matches a spoken transcript to a category using keyword matching.
 *
 * Returns a best-guess category and per-category scores.
 * When all scores are 0 (no keywords matched), "Other" is returned
 * as the best guess by alphabetical tiebreaker after sorting.
 */
export function matchCategory(transcript: string): CategoryMatch {
  const lower = transcript.toLowerCase()
  const scores: Record<string, number> = { ...DEFAULT_CATEGORIES }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[category]++
      }
    }
  }

  // When all scores are 0, default to "Other"
  const hasMatch = Object.values(scores).some((s) => s > 0)
  if (!hasMatch) {
    return { bestGuess: 'Other', scores }
  }

  const bestGuess = Object.entries(scores).sort((a, b) => {
    // Sort by score descending, then alphabetically ascending (tiebreaker)
    const scoreDiff = b[1] - a[1]
    if (scoreDiff !== 0) return scoreDiff
    return a[0].localeCompare(b[0])
  })[0][0]

  return { bestGuess, scores }
}

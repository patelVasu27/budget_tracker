import { describe, it, expect } from 'vitest'
import { matchCategory } from './categoryMatcher'

describe('matchCategory', () => {
  it('matches lunch at restaurant to Food', () => {
    const result = matchCategory('lunch at restaurant')
    expect(result.bestGuess).toBe('Food')
    expect(result.scores.Food).toBeGreaterThanOrEqual(1)
  })

  it('matches multiple keywords to Entertainment', () => {
    const result = matchCategory('netflix and spotify')
    expect(result.bestGuess).toBe('Entertainment')
    expect(result.scores.Entertainment).toBeGreaterThanOrEqual(2)
  })

  it('defaults to Other for unknown keywords', () => {
    const result = matchCategory('something random')
    expect(result.bestGuess).toBe('Other')
  })

  it('matches health keywords', () => {
    const result = matchCategory('went to the gym')
    expect(result.bestGuess).toBe('Health')
  })

  it('matches transport keywords', () => {
    const result = matchCategory('uber ride to airport')
    expect(result.bestGuess).toBe('Transport')
  })

  it('handles empty string with all zero scores and Other as best guess', () => {
    const result = matchCategory('')
    expect(result.bestGuess).toBe('Other')
    expect(result.scores.Food).toBe(0)
    expect(result.scores.Transport).toBe(0)
    expect(result.scores.Utilities).toBe(0)
    expect(result.scores.Entertainment).toBe(0)
    expect(result.scores.Shopping).toBe(0)
    expect(result.scores.Health).toBe(0)
    expect(result.scores.Other).toBe(0)
  })

  it('is case insensitive', () => {
    const result = matchCategory('Lunch at Restaurant')
    expect(result.bestGuess).toBe('Food')
  })
})

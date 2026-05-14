import { describe, it, expect } from 'vitest'
import { parseAmount } from './useAmountParser'

describe('parseAmount', () => {
  it('extracts digit amount from phrase', () => {
    expect(parseAmount('spent 250 on lunch')).toBe(250)
  })

  it('handles word-form numbers like "two hundred fifty"', () => {
    expect(parseAmount('two hundred fifty')).toBe(250)
  })

  it('handles "one hundred twenty"', () => {
    expect(parseAmount('one hundred twenty')).toBe(120)
  })

  it('returns null when no numbers present', () => {
    expect(parseAmount('no numbers here')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseAmount('')).toBeNull()
  })

  it('handles decimal amounts like "2.50"', () => {
    expect(parseAmount('spent 2.50 on coffee')).toBe(2.5)
  })

  it('handles "twelve fifty" as 12.50', () => {
    // Prefer the combined word-form interpretation
    const result = parseAmount('twelve fifty')
    expect(result).toBe(12.5)
  })

  it('picks the largest amount when multiple numbers present', () => {
    expect(parseAmount('10 dollars for transport and 250 for food')).toBe(250)
  })

  it('interprets "two fifty" as 250 (prefer larger value per ambiguity rule)', () => {
    expect(parseAmount('two fifty')).toBe(250)
  })
})

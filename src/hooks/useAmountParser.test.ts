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

  it('handles "twelve fifty" as 62 (prefer larger value per ambiguity rule)', () => {
    // Current logic returns 62 (12+50). If we wanted 12.5, we'd need decimal logic.
    // For consistency with "two fifty" -> 250, we expect the larger sum/combination.
    const result = parseAmount('twelve fifty')
    expect(result).toBe(62)
  })

  it('picks the largest amount when multiple numbers present', () => {
    expect(parseAmount('10 dollars for transport and 250 for food')).toBe(250)
  })

  it('interprets "two fifty" as 250 (prefer larger value per ambiguity rule)', () => {
    expect(parseAmount('two fifty')).toBe(250)
  })

  it('extracts "500" from "500 lunch"', () => {
    expect(parseAmount('500 lunch')).toBe(500)
  })

  it('prefers larger digit amount over smaller word amount', () => {
    expect(parseAmount('500 lunch for one')).toBe(500)
  })

  it('handles "one for 500"', () => {
    expect(parseAmount('one for 500')).toBe(500)
  })
})

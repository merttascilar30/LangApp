import { describe, expect, it } from 'vitest'
import { matchesAny, normalizeAnswer } from '../../src/domain/normalize'

describe('normalizeAnswer', () => {
  it('trims and collapses spaces, strips trailing punctuation', () => {
    expect(normalizeAnswer('  Ich   bin  Anna. ')).toBe('ich bin anna')
    expect(normalizeAnswer('Ja, ich bin!')).toBe('ja ich bin')
  })
  it('maps umlauts', () => {
    expect(normalizeAnswer('Grüße')).toBe(normalizeAnswer('gruesse'))
    expect(normalizeAnswer('Äpfel', true)).toBe('Aepfel')
  })
})

describe('matchesAny', () => {
  it('typografik apostrofu katlar', () => {
    expect(matchesAny('Wie geht’s', ["Wie geht's"])).toBe(true)
    expect(matchesAny('Wie geht`s', ["Wie geht's"])).toBe(true)
    expect(matchesAny('Wie geht´s', ["Wie geht's"])).toBe(true)
    expect(matchesAny('Wie geht‘s', ["Wie geht's"])).toBe(true)
  })
  it('is case-insensitive by default', () => {
    expect(matchesAny('ÄPFEL', ['Äpfel'])).toBe(true)
    expect(matchesAny('STRASSE', ['Straße'])).toBe(true)
  })
  it('respects harfDuyarli', () => {
    expect(matchesAny('tisch', ['Tisch'], true)).toBe(false)
    expect(matchesAny('Tisch', ['Tisch'], true)).toBe(true)
  })
  it('has no typo tolerance', () => {
    expect(matchesAny('Tsch', ['Tisch'])).toBe(false)
  })
})

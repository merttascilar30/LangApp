import { describe, expect, it } from 'vitest'
import { applyCard, buildDeck, cardBox } from '../../src/domain/leitner'
import { emptyProgress } from '../../src/domain/progress'
import { createRng } from '../../src/domain/random'

describe('leitner', () => {
  it('yeni kart kutu 1', () => expect(cardBox(emptyProgress(), 'a')).toBe(1))
  it('biliyorum 3te kalır, tekrar 1e döner', () => {
    let s = emptyProgress()
    for (let i = 0; i < 3; i++) s = applyCard(s, 'a', true)
    expect(cardBox(s, 'a')).toBe(3)
    s = applyCard(s, 'a', true)
    expect(cardBox(s, 'a')).toBe(3)
    s = applyCard(s, 'a', false)
    expect(cardBox(s, 'a')).toBe(1)
  })
  it('buildDeck ağırlıklara göre tekrarlar', () => {
    let s = emptyProgress()
    s = { ...s, kartlar: { a: 1, b: 2, c: 3 } }
    const deck = buildDeck(['a', 'b', 'c'], s, createRng(1))
    expect(deck).toHaveLength(6)
    expect(deck.filter((k) => k === 'a')).toHaveLength(3)
    expect(deck.filter((k) => k === 'b')).toHaveLength(2)
    expect(deck.filter((k) => k === 'c')).toHaveLength(1)
  })
  it('yinelenen anahtarlar tekilleştirilir', () => {
    const deck = buildDeck(['a', 'a'], emptyProgress(), createRng(1))
    expect(deck).toHaveLength(3)
  })
})

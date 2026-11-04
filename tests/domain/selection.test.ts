import { describe, expect, it } from 'vitest'
import type { Question } from '../../src/content/schema'
import { createRng, hashString, shuffle } from '../../src/domain/random'
import { pickExam, pickPartTest } from '../../src/domain/selection'

function q(id: string): Question {
  return { id, tip: 'dogru-yanlis', soru: 's', aciklama: 'a', ifade: 'x', dogru: true }
}
function dinleme(id: string): Question {
  return {
    id,
    tip: 'dinleme',
    soru: 's',
    aciklama: 'a',
    okunacak: 'x',
    mod: 'yaz',
    dogruCevaplar: ['x'],
  }
}
function pool(prefix: string, n: number): Question[] {
  return Array.from({ length: n }, (_, i) => q(`${prefix}-${i}`))
}

describe('createRng / shuffle', () => {
  it('aynı seed aynı çıktı, değerler [0,1)', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 20; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('shuffle deterministik, yeni dizi, aynı elemanlar', () => {
    const src = Array.from({ length: 25 }, (_, i) => i)
    const copy = [...src]
    const r1 = shuffle(src, createRng(1))
    const r2 = shuffle(src, createRng(1))
    const r3 = shuffle(src, createRng(2))
    expect(r1).toEqual(r2)
    expect(r1).not.toBe(src)
    expect(src).toEqual(copy)
    expect(r1).not.toEqual(r3)
    expect([...r1].sort((x, y) => x - y)).toEqual(src)
  })
})

describe('hashString', () => {
  it('deterministik', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
  })
  it('a ve b farklı', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
  })
  it('[0, 2^32) aralığında tamsayı', () => {
    for (const s of ['', 'a', 'modül-1-soru-17', 'ğüşiöç']) {
      const h = hashString(s)
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(2 ** 32)
    }
  })
})

describe('pickPartTest', () => {
  it('20 soruluk havuzdan 10 benzersiz', () => {
    const r = pickPartTest(pool('p', 20), createRng(3))
    expect(r).toHaveLength(10)
    expect(new Set(r.map((x) => x.id)).size).toBe(10)
  })
  it('6 soruluk havuzdan 6', () => {
    expect(pickPartTest(pool('p', 6), createRng(3))).toHaveLength(6)
  })
  it('opts.n kullanılır', () => {
    expect(pickPartTest(pool('p', 20), createRng(3), { n: 4 })).toHaveLength(4)
  })
  it('dinlemeHaric dinleme soruları çıkarılır', () => {
    const list = [...pool('p', 7), ...Array.from({ length: 5 }, (_, i) => dinleme(`d-${i}`))]
    const r = pickPartTest(list, createRng(5), { dinlemeHaric: true })
    expect(r).toHaveLength(7)
    expect(r.some((x) => x.tip === 'dinleme')).toBe(false)
  })
})

describe('pickExam', () => {
  const parts = ['a', 'b', 'c', 'd', 'e'].map((p) => pool(p, 20))
  const ek = pool('ek', 10)

  it('25 benzersiz, her havuzdan en az 4', () => {
    const r = pickExam(parts, ek, 25, createRng(9))
    expect(r).toHaveLength(25)
    expect(new Set(r.map((x) => x.id)).size).toBe(25)
    for (const p of ['a', 'b', 'c', 'd', 'e', 'ek']) {
      expect(r.filter((x) => x.id.startsWith(`${p}-`)).length).toBeGreaterThanOrEqual(4)
    }
  })

  it('toplam 12 soru varken count 25 -> 12', () => {
    const r = pickExam([pool('a', 5), pool('b', 4)], pool('ek', 3), 25, createRng(1))
    expect(r).toHaveLength(12)
    expect(new Set(r.map((x) => x.id)).size).toBe(12)
  })

  it('dinlemeHaric uygulanır', () => {
    const r = pickExam([[...pool('a', 3), dinleme('d1')]], [dinleme('d2')], 25, createRng(1), {
      dinlemeHaric: true,
    })
    expect(r).toHaveLength(3)
    expect(r.some((x) => x.tip === 'dinleme')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { applyAutoHint, autoHint, type AutoHint } from '../../src/domain/hints'
import { createRng } from '../../src/domain/random'
import type { Question } from '../../src/content/schema'

const base = { id: 'q', soru: 's', aciklama: 'a' }
const coktan = (n: number, dogru: number): Question => ({
  ...base,
  tip: 'coktan-secmeli',
  secenekler: Array.from({ length: n }, (_, i) => `s${i}`),
  dogru,
})

describe('autoHint', () => {
  it('coktan-secmeli: 4 şık -> 1 indeks, doğru asla yok', () => {
    for (let seed = 0; seed < 100; seed++) {
      const h = autoHint(coktan(4, 2), createRng(seed))
      expect(h?.tur).toBe('ele')
      if (h?.tur === 'ele') {
        expect(h.indeksler).toHaveLength(1)
        expect(h.indeksler).not.toContain(2)
      }
    }
  })
  it('5 şık -> 2 indeks, 2 şık -> 1 indeks', () => {
    const h5 = autoHint(coktan(5, 0), createRng(1))
    expect(h5?.tur === 'ele' && h5.indeksler.length).toBe(2)
    const h2 = autoHint(coktan(2, 1), createRng(1))
    expect(h2).toEqual({ tur: 'ele', indeksler: [0] })
  })
  it('dinleme sec: doğru seçenek elenmez', () => {
    const q: Question = {
      ...base,
      tip: 'dinleme',
      okunacak: 'x',
      mod: 'sec',
      secenekler: ['a', 'b', 'c', 'd'],
      dogruCevaplar: ['c'],
    }
    for (let seed = 0; seed < 50; seed++) {
      const h = autoHint(q, createRng(seed))
      expect(h?.tur === 'ele' && h.indeksler).toHaveLength(1)
      expect(h?.tur === 'ele' && h.indeksler.includes(2)).toBe(false)
    }
  })
  it('dinleme yaz -> ilkHarf', () => {
    const q: Question = { ...base, tip: 'dinleme', okunacak: 'x', mod: 'yaz', dogruCevaplar: ['Hallo'] }
    expect(autoHint(q, createRng(1))).toEqual({ tur: 'ilkHarf', harf: 'H' })
  })
  it('artikel: tek indeks, doğru değil', () => {
    const q: Question = { ...base, tip: 'artikel', isim: 'Frau', dogru: 'die' }
    for (let seed = 0; seed < 50; seed++) {
      const h = autoHint(q, createRng(seed))
      expect(h?.tur === 'ele' && h.indeksler).toHaveLength(1)
      expect(h?.tur === 'ele' && h.indeksler[0]).not.toBe(1)
    }
  })
  it('bosluk/ceviri -> ilk harf', () => {
    const b: Question = { ...base, tip: 'bosluk-doldurma', metin: 'Ich ___', dogruCevaplar: ['bin'] }
    const c: Question = { ...base, tip: 'ceviri', kaynak: 'x', dogruCevaplar: ['Guten Tag'] }
    expect(autoHint(b, createRng(1))).toEqual({ tur: 'ilkHarf', harf: 'b' })
    expect(autoHint(c, createRng(1))).toEqual({ tur: 'ilkHarf', harf: 'G' })
  })
  it('cumle-dizme -> ilk parça', () => {
    const q: Question = { ...base, tip: 'cumle-dizme', parcalar: ['b', 'a'], dogruSiralar: [['a', 'b']] }
    expect(autoHint(q, createRng(1))).toEqual({ tur: 'ilkParca', parca: 'a' })
  })
  it('eslestirme -> ciftlerden biri', () => {
    const ciftler = [
      { sol: 'a', sag: '1' },
      { sol: 'b', sag: '2' },
      { sol: 'c', sag: '3' },
      { sol: 'd', sag: '4' },
    ]
    const q: Question = { ...base, tip: 'eslestirme', ciftler }
    const h = autoHint(q, createRng(3))
    expect(h?.tur).toBe('cift')
    expect(ciftler).toContainEqual(h?.tur === 'cift' ? { sol: h.sol, sag: h.sag } : null)
  })
  it('fiil-cekimi -> verilen olmayan ilk satır', () => {
    const q: Question = {
      ...base,
      tip: 'fiil-cekimi',
      fiil: 'sein',
      satirlar: [
        { zamir: 'ich', cevap: 'bin', verilen: true },
        { zamir: 'du', cevap: 'bist' },
        { zamir: 'er', cevap: 'ist' },
      ],
    }
    expect(autoHint(q, createRng(1))).toEqual({ tur: 'hucre', satir: 1, cevap: 'bist' })
  })
  it('dogru-yanlis -> null', () => {
    const q: Question = { ...base, tip: 'dogru-yanlis', ifade: 'x', dogru: true }
    expect(autoHint(q, createRng(1))).toBeNull()
  })
  it('aynı seed -> aynı sonuç', () => {
    expect(autoHint(coktan(5, 0), createRng(42))).toEqual(autoHint(coktan(5, 0), createRng(42)))
  })
})

describe('applyAutoHint', () => {
  it('cumle-dizme ilkParca', () => {
    const q: Question = { ...base, tip: 'cumle-dizme', parcalar: ['b', 'a'], dogruSiralar: [['a', 'b']] }
    expect(
      applyAutoHint(q, { tip: 'cumle-dizme', sira: ['b', 'a'] }, { tur: 'ilkParca', parca: 'a' }),
    ).toEqual({ tip: 'cumle-dizme', sira: ['a', 'b'] })
    expect(applyAutoHint(q, null, { tur: 'ilkParca', parca: 'a' })).toEqual({
      tip: 'cumle-dizme',
      sira: ['a'],
    })
  })
  it('eslestirme cift', () => {
    const q: Question = {
      ...base,
      tip: 'eslestirme',
      ciftler: [
        { sol: 'x', sag: '1' },
        { sol: 'y', sag: '2' },
        { sol: 'z', sag: '3' },
        { sol: 'w', sag: '4' },
      ],
    }
    expect(
      applyAutoHint(q, { tip: 'eslestirme', eslesme: { x: '2' } }, { tur: 'cift', sol: 'y', sag: '2' }),
    ).toEqual({ tip: 'eslestirme', eslesme: { y: '2' } })
    expect(applyAutoHint(q, null, { tur: 'cift', sol: 'y', sag: '2' })).toEqual({
      tip: 'eslestirme',
      eslesme: { y: '2' },
    })
  })
  it('fiil hücre', () => {
    const q: Question = {
      ...base,
      tip: 'fiil-cekimi',
      fiil: 'sein',
      satirlar: [
        { zamir: 'ich', cevap: 'bin', verilen: true },
        { zamir: 'du', cevap: 'bist' },
      ],
    }
    expect(applyAutoHint(q, null, { tur: 'hucre', satir: 1, cevap: 'bist' })).toEqual({
      tip: 'fiil-cekimi',
      hucreler: ['', 'bist'],
    })
    expect(
      applyAutoHint(
        q,
        { tip: 'fiil-cekimi', hucreler: ['x', 'y'] },
        { tur: 'hucre', satir: 1, cevap: 'bist' },
      ),
    ).toEqual({ tip: 'fiil-cekimi', hucreler: ['x', 'bist'] })
  })
  it('ele: seçili şık elendiyse null, değilse aynı', () => {
    const q = coktan(4, 0)
    const h: AutoHint = { tur: 'ele', indeksler: [2] }
    expect(applyAutoHint(q, { tip: 'coktan-secmeli', secilen: 2 }, h)).toBeNull()
    const a = { tip: 'coktan-secmeli', secilen: 1 } as const
    expect(applyAutoHint(q, a, h)).toBe(a)
    const art: Question = { ...base, tip: 'artikel', isim: 'x', dogru: 'die' }
    expect(applyAutoHint(art, { tip: 'artikel', secilen: 'das' }, h)).toBeNull()
    const d: Question = {
      ...base,
      tip: 'dinleme',
      okunacak: 'x',
      mod: 'sec',
      secenekler: ['a', 'b', 'c'],
      dogruCevaplar: ['a'],
    }
    expect(applyAutoHint(d, { tip: 'dinleme', metin: 'c' }, h)).toBeNull()
  })
  it('ilkHarf: cevap değişmez', () => {
    const q: Question = { ...base, tip: 'bosluk-doldurma', metin: 'x', dogruCevaplar: ['bin'] }
    const a = { tip: 'bosluk-doldurma', metin: 'b' } as const
    expect(applyAutoHint(q, a, { tur: 'ilkHarf', harf: 'b' })).toBe(a)
  })
})

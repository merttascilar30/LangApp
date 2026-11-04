import { describe, expect, it } from 'vitest'
import { contentFiles } from '../../src/content/files'
import { loadContent } from '../../src/content/loader'

describe('gerçek içerik (modül 1)', () => {
  const sonuc = loadContent(contentFiles)

  it('içerik hatasız yüklenir', () => {
    expect(sonuc.hatalar).toEqual([])
  })

  it('8 modül vardır', () => {
    expect(sonuc.moduller.length).toBe(8)
  })

  it('modül 1: 5 part ve sınav', () => {
    const m1 = sonuc.moduller.find((m) => m.id === 'modul-1')
    expect(m1).toBeDefined()
    expect(m1!.partlar.length).toBe(5)
    expect(m1!.sinav).not.toBeNull()
  })

  it('her partta en az 4 farklı tip ve 5–15 kelime', () => {
    const m1 = sonuc.moduller.find((m) => m.id === 'modul-1')!
    for (const p of m1.partlar) {
      expect(new Set(p.sorular.map((q) => q.tip)).size, `${p.id} tip sayısı`).toBeGreaterThanOrEqual(4)
      expect(p.kelimeler.length, `${p.id} kelime`).toBeGreaterThanOrEqual(5)
      expect(p.kelimeler.length, `${p.id} kelime`).toBeLessThanOrEqual(15)
    }
  })

  it('sınav ekSorular 8–12', () => {
    const s = sonuc.moduller.find((m) => m.id === 'modul-1')!.sinav!
    expect(s.ekSorular.length).toBeGreaterThanOrEqual(8)
    expect(s.ekSorular.length).toBeLessThanOrEqual(12)
    expect(s.soruSayisi).toBe(25)
    expect(s.gecmeNotu).toBe(80)
  })
})

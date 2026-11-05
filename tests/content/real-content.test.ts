import { describe, expect, it } from 'vitest'
import { contentFiles } from '../../src/content/files'
import { loadContent } from '../../src/content/loader'

const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const geciyor = (metin: string, aranan: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${kacis(aranan)}(?![\\p{L}\\p{N}])`, 'iu').test(metin)

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

  const m1 = () => sonuc.moduller.find((m) => m.id === 'modul-1')!
  const m1Sorular = () => [...m1().partlar.flatMap((p) => p.sorular), ...m1().sinav!.ekSorular]

  it('modül 1: her soruda ipucu dolu', () => {
    const eksik = m1Sorular().filter((q) => !q.ipucu?.trim()).map((q) => q.id)
    expect(eksik).toEqual([])
  })

  it('modül 1: her partta 2–4 trick, başlık ≤ 40 karakter', () => {
    for (const p of m1().partlar) {
      expect(p.trickler?.length ?? 0, `${p.id} trick sayısı`).toBeGreaterThanOrEqual(2)
      expect(p.trickler?.length ?? 0, `${p.id} trick sayısı`).toBeLessThanOrEqual(4)
      for (const t of p.trickler ?? []) {
        expect(t.baslik.length, `${p.id} "${t.baslik}"`).toBeLessThanOrEqual(40)
      }
    }
  })

  it('modül 1: ipucu doğru cevabı açık etmez', () => {
    const sizan: string[] = []
    for (const q of m1Sorular()) {
      if (!q.ipucu) continue
      let cevaplar: string[] = []
      if (q.tip === 'bosluk-doldurma' || q.tip === 'ceviri') cevaplar = q.dogruCevaplar
      else if (q.tip === 'dinleme') cevaplar = q.dogruCevaplar
      else if (q.tip === 'coktan-secmeli') cevaplar = [q.secenekler[q.dogru]]
      else if (q.tip === 'artikel') cevaplar = [q.dogru]
      for (const c of cevaplar) if (geciyor(q.ipucu, c)) sizan.push(`${q.id}: "${c}"`)
    }
    expect(sizan).toEqual([])
  })
})

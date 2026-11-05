import { describe, expect, it } from 'vitest'
import bankaJson from '../../content/almanca_a1_goethe_veri_bankasi.json'
import haritaJson from '../../content/ders-haritasi.json'
import { contentFiles } from '../../src/content/files'
import { loadContent } from '../../src/content/loader'
import { GLOSS_DISI } from '../helpers/gloss-disi'
import {
  glossKapsami,
  haritaEksikleri,
  ipucuSizintilari,
  sinavEksikleri,
  tooltipSizintilari,
  type DersHaritasi,
} from '../helpers/icerik-kontrol'
import { bankaCumleleri, cevapKonumuHatalari, dersKaliteHatalari, soruKaynakHatalari } from '../helpers/kalite'

const banka = bankaCumleleri(bankaJson as unknown as Parameters<typeof bankaCumleleri>[0])
const harita = haritaJson as unknown as DersHaritasi
const sonuc = loadContent(contentFiles)
const doluModuller = sonuc.moduller.filter((m) => m.id !== 'modul-1' && m.partlar.length > 0)

describe('Faz 2 kalite testi düzeneği', () => {
  it('banka cümleleri yalnızca modul-2..modul-8 içerir', () => {
    expect(banka.size).toBeGreaterThan(800)
    expect(banka.has('Hallo Inge! Wie geht’s?')).toBe(false) // yalnızca Modül 1'de
  })

  it('harita istisna dersleri gerekçeli', () => {
    const gerekcesiz = harita.dersler.filter((d) => d.istisna && !d.istisnaGerekcesi?.trim())
    expect(gerekcesiz.map((d) => `${d.modulId} ders ${d.ders}`)).toEqual([])
  })
})

describe.each(doluModuller.map((m) => [m.id, m] as const))('Faz 2 içerik: %s', (_id, modul) => {
  const sorular = [...modul.partlar.flatMap((p) => p.sorular), ...(modul.sinav?.ekSorular ?? [])]

  it('her ders haritada', () => {
    expect(haritaEksikleri([modul], harita)).toEqual([])
  })

  it('haritadaki tüm dersler yazıldıysa sınav var', () => {
    expect(sinavEksikleri([modul], harita)).toEqual([])
  })

  it.each(modul.partlar.map((p) => [p.id, p] as const))('%s: kalite kuralları', (_pid, part) => {
    const istisna = harita.dersler.find((d) => d.modulId === modul.id && d.ders === part.ders)?.istisna ?? false
    expect(dersKaliteHatalari({ part, istisna, bankaCumleleri: banka })).toEqual([])
  })

  it.each(modul.partlar.map((p) => [p.id, p] as const))('%s: kelime ve özet sayıları, trickler', (_pid, p) => {
    expect(p.kelimeler.length, `${p.id} kelime`).toBeGreaterThanOrEqual(5)
    expect(p.kelimeler.length, `${p.id} kelime`).toBeLessThanOrEqual(15)
    expect(p.ozet.length, `${p.id} özet`).toBeGreaterThanOrEqual(3)
    expect(p.ozet.length, `${p.id} özet`).toBeLessThanOrEqual(5)
    expect(p.trickler?.length ?? 0, `${p.id} trick sayısı`).toBeGreaterThanOrEqual(2)
    expect(p.trickler?.length ?? 0, `${p.id} trick sayısı`).toBeLessThanOrEqual(4)
    for (const t of p.trickler ?? []) {
      expect(t.baslik.length, `${p.id} "${t.baslik}"`).toBeLessThanOrEqual(40)
    }
  })

  it('sınav ekSorular 8–12 ve kaynak kuralları', () => {
    if (!modul.sinav) return
    const ek = modul.sinav.ekSorular
    expect(ek.length).toBeGreaterThanOrEqual(8)
    expect(ek.length).toBeLessThanOrEqual(12)
    expect(ek.flatMap((q) => soruKaynakHatalari(q, banka))).toEqual([])
  })

  it('sınav ekSorular: doğru şık konumu dağılmış', () => {
    expect(cevapKonumuHatalari(modul.sinav?.ekSorular ?? [])).toEqual([])
  })

  it('backtick yalnızca çeldirici notlarında', () => {
    const bulunan: string[] = []
    for (const p of modul.partlar) {
      for (const o of p.ozet) if (o.includes('`')) bulunan.push(`${p.id} ozet`)
      for (const t of p.trickler ?? []) if (t.baslik.includes('`') || t.metin.includes('`')) bulunan.push(`${p.id} trick`)
    }
    for (const q of sorular) {
      for (const [alan, v] of [['aciklama', q.aciklama], ['ipucu', q.ipucu ?? ''], ['soru', q.soru]] as const) {
        if (v.includes('`')) bulunan.push(`${q.id} ${alan}`)
      }
    }
    expect(bulunan).toEqual([])
  })

  it('her soruda ipucu dolu', () => {
    expect(sorular.filter((q) => !q.ipucu?.trim()).map((q) => q.id)).toEqual([])
  })

  it('ipucu doğru cevabı açık etmez', () => {
    expect(sorular.flatMap((q) => ipucuSizintilari(q))).toEqual([])
  })

  it('tooltip kabul edilen cevabı sızdırmaz', () => {
    expect(sorular.flatMap((q) => tooltipSizintilari(q, modul.sozluk))).toEqual([])
  })

  it('sözlük, Almanca gloss kelimelerinin ≥ %80 ini kapsar', () => {
    const { oran, eksik } = glossKapsami(sorular, modul.sozluk, GLOSS_DISI[modul.id] ?? new Set())
    expect(oran, `kapsama ${(oran * 100).toFixed(1)}%; anlamsız: ${eksik.join(' ')}`).toBeGreaterThanOrEqual(0.8)
  })
})

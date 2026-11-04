import type { Question } from '../content/schema'
import type { Answer } from './answers'
import { shuffle } from './random'

export type AutoHint =
  | { tur: 'ele'; indeksler: number[] }
  | { tur: 'ilkHarf'; harf: string }
  | { tur: 'ilkParca'; parca: string }
  | { tur: 'cift'; sol: string; sag: string }
  | { tur: 'hucre'; satir: number; cevap: string }

const ARTIKELLER = ['der', 'die', 'das'] as const

/** Yanlış indekslerden max(1, floor(n/2)) tanesini rastgele seçer. */
function eleYanlis(yanlislar: number[], rng: () => number): AutoHint | null {
  if (yanlislar.length === 0) return null
  const adet = Math.max(1, Math.floor(yanlislar.length / 2))
  const indeksler = shuffle(yanlislar, rng).slice(0, adet).sort((a, b) => a - b)
  return { tur: 'ele', indeksler }
}

function ilkHarf(s: string | undefined): AutoHint | null {
  const harf = s?.[0]
  return harf ? { tur: 'ilkHarf', harf } : null
}

export function autoHint(q: Question, rng: () => number): AutoHint | null {
  switch (q.tip) {
    case 'coktan-secmeli': {
      const yanlislar = q.secenekler.map((_, i) => i).filter((i) => i !== q.dogru)
      return eleYanlis(yanlislar, rng)
    }
    case 'dinleme': {
      if (q.mod === 'yaz') return ilkHarf(q.dogruCevaplar[0])
      const secenekler = q.secenekler ?? []
      const yanlislar = secenekler.map((_, i) => i).filter((i) => secenekler[i] !== q.dogruCevaplar[0])
      return eleYanlis(yanlislar, rng)
    }
    case 'artikel': {
      const yanlislar = ARTIKELLER.map((_, i) => i).filter((i) => ARTIKELLER[i] !== q.dogru)
      return { tur: 'ele', indeksler: [shuffle(yanlislar, rng)[0]] }
    }
    case 'bosluk-doldurma':
    case 'ceviri':
      return ilkHarf(q.dogruCevaplar[0])
    case 'cumle-dizme': {
      const parca = q.dogruSiralar[0]?.[0]
      return parca === undefined ? null : { tur: 'ilkParca', parca }
    }
    case 'eslestirme': {
      const c = shuffle(q.ciftler, rng)[0]
      return c ? { tur: 'cift', sol: c.sol, sag: c.sag } : null
    }
    case 'fiil-cekimi': {
      const satir = q.satirlar.findIndex((s) => !s.verilen)
      return satir < 0 ? null : { tur: 'hucre', satir, cevap: q.satirlar[satir].cevap }
    }
    case 'dogru-yanlis':
      return null
  }
}

export function applyAutoHint(q: Question, cevap: Answer | null, h: AutoHint): Answer | null {
  switch (h.tur) {
    case 'ele': {
      if (!cevap) return cevap
      if (cevap.tip === 'coktan-secmeli') {
        return h.indeksler.includes(cevap.secilen) ? null : cevap
      }
      if (cevap.tip === 'artikel') {
        return h.indeksler.includes(ARTIKELLER.indexOf(cevap.secilen)) ? null : cevap
      }
      if (cevap.tip === 'dinleme' && q.tip === 'dinleme') {
        const secenekler = q.secenekler ?? []
        return h.indeksler.some((i) => secenekler[i] === cevap.metin) ? null : cevap
      }
      return cevap
    }
    case 'ilkHarf':
      return cevap
    case 'ilkParca': {
      const eski = cevap?.tip === 'cumle-dizme' ? [...cevap.sira] : []
      const i = eski.indexOf(h.parca)
      if (i >= 0) eski.splice(i, 1)
      return { tip: 'cumle-dizme', sira: [h.parca, ...eski] }
    }
    case 'cift': {
      const eslesme: Record<string, string> = {}
      if (cevap?.tip === 'eslestirme') {
        for (const [sol, sag] of Object.entries(cevap.eslesme)) {
          if (sol !== h.sol && sag !== h.sag) eslesme[sol] = sag
        }
      }
      eslesme[h.sol] = h.sag
      return { tip: 'eslestirme', eslesme }
    }
    case 'hucre': {
      const uzunluk = q.tip === 'fiil-cekimi' ? q.satirlar.length : h.satir + 1
      const hucreler = Array.from({ length: uzunluk }, (_, i) =>
        cevap?.tip === 'fiil-cekimi' ? (cevap.hucreler[i] ?? '') : '',
      )
      hucreler[h.satir] = h.cevap
      return { tip: 'fiil-cekimi', hucreler }
    }
  }
}

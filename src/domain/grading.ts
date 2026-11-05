import type { Question } from '../content/schema'
import type { Answer } from './answers'
import { matchesAny } from './normalize'

export function gradeQuestion(q: Question, a: Answer | null): boolean {
  if (a === null || a.tip !== q.tip) return false
  switch (q.tip) {
    case 'coktan-secmeli':
      return a.tip === 'coktan-secmeli' && a.secilen === q.dogru
    case 'bosluk-doldurma':
    case 'ceviri':
    case 'dinleme':
      return (
        (a.tip === 'bosluk-doldurma' || a.tip === 'ceviri' || a.tip === 'dinleme') &&
        matchesAny(a.metin, q.dogruCevaplar, q.harfDuyarli)
      )
    case 'artikel':
      return a.tip === 'artikel' && a.secilen === q.dogru
    case 'fiil-cekimi': {
      if (a.tip !== 'fiil-cekimi') return false
      const h = a.hucreler
      return q.satirlar.every(
        (s, i) => s.verilen === true || matchesAny(h[i] ?? '', [s.cevap], q.harfDuyarli),
      )
    }
    case 'cumle-dizme': {
      if (a.tip !== 'cumle-dizme') return false
      const sira = a.sira
      return q.dogruSiralar.some(
        (d) => d.length === sira.length && d.every((tok, i) => tok === sira[i]),
      )
    }
    case 'eslestirme':
      return (
        a.tip === 'eslestirme' &&
        q.ciftler.every((c) => a.eslesme[c.sol] === c.sag) &&
        Object.keys(a.eslesme).length === q.ciftler.length
      )
    case 'dogru-yanlis':
      return a.tip === 'dogru-yanlis' && a.secilen === q.dogru
  }
}

export function celdiriciNotu(q: Question, a: Answer | null): string | null {
  if (q.tip !== 'coktan-secmeli' || a === null || a.tip !== 'coktan-secmeli') return null
  if (a.secilen === q.dogru) return null
  const not = q.celdiriciNotlari?.[a.secilen]
  return not ? not : null
}

/** Boşluklu çoktan seçmeli sorunun doğru şıkla dolu cümlesi (metin / diyalog); yoksa null. */
export function doluCumle(q: Question): string | null {
  if (q.tip !== 'coktan-secmeli') return null
  const dogru = q.secenekler[q.dogru] ?? ''
  const doldur = (m: string) => m.split('___').join(dogru)
  if (q.metin !== undefined) return doldur(q.metin)
  const satir = q.diyalog?.find((s) => s.metin.includes('___'))
  return satir ? doldur(satir.metin) : null
}

export function correctAnswerText(q: Question): string {
  switch (q.tip) {
    case 'coktan-secmeli':
      return q.secenekler[q.dogru]
    case 'bosluk-doldurma':
    case 'ceviri':
    case 'dinleme':
      return q.dogruCevaplar[0]
    case 'artikel':
      return `${q.dogru} ${q.isim}`
    case 'fiil-cekimi':
      return q.satirlar.map((s) => `${s.zamir} ${s.cevap}`).join(', ')
    case 'cumle-dizme':
      return q.dogruSiralar[0].join(' ')
    case 'eslestirme':
      return q.ciftler.map((c) => `${c.sol} = ${c.sag}`).join('; ')
    case 'dogru-yanlis':
      return q.dogru ? 'Doğru' : 'Yanlış'
  }
}

export function scorePercent(dogru: number, toplam: number): number {
  return toplam === 0 ? 0 : (dogru * 100) / toplam
}

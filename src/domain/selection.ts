import type { Question } from '../content/schema'
import { shuffle } from './random'

function filtrele(sorular: readonly Question[], dinlemeHaric?: boolean): Question[] {
  return dinlemeHaric ? sorular.filter((s) => s.tip !== 'dinleme') : [...sorular]
}

export function pickPartTest(
  sorular: Question[],
  rng: () => number,
  opts: { n?: number; dinlemeHaric?: boolean } = {},
): Question[] {
  const n = opts.n ?? 10
  return shuffle(filtrele(sorular, opts.dinlemeHaric), rng).slice(0, n)
}

export function pickExam(
  partHavuzlari: Question[][],
  ekSorular: Question[],
  count: number,
  rng: () => number,
  opts: { dinlemeHaric?: boolean } = {},
): Question[] {
  const havuzlar = [...partHavuzlari, ekSorular].map((h) =>
    shuffle(filtrele(h, opts.dinlemeHaric), rng),
  )
  const secilen: Question[] = []
  let idx = 0
  while (secilen.length < count && havuzlar.some((h) => idx < h.length)) {
    for (const h of havuzlar) {
      if (secilen.length >= count) break
      if (idx < h.length) secilen.push(h[idx])
    }
    idx++
  }
  return shuffle(secilen, rng)
}

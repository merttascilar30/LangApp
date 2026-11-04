import type { Part, Question } from './schema'

export type ContentError = { dosya: string; soruId?: string; mesaj: string }

const MIN_SORU = 15

function sortedKey(arr: string[]): string {
  return JSON.stringify([...arr].sort())
}

export function checkQuestionRules(dosya: string, q: Question): ContentError[] {
  const err = (mesaj: string): ContentError => ({ dosya, soruId: q.id, mesaj })
  const errors: ContentError[] = []

  switch (q.tip) {
    case 'coktan-secmeli':
      if (!Number.isInteger(q.dogru) || q.dogru < 0 || q.dogru >= q.secenekler.length) {
        errors.push(err(`dogru indeksi seçenekler aralığında değil (0-${q.secenekler.length - 1})`))
      }
      break
    case 'bosluk-doldurma': {
      const count = q.metin.split('___').length - 1
      if (count !== 1) {
        errors.push(err(`metin tam olarak bir tane ___ içermeli (bulunan: ${count})`))
      }
      break
    }
    case 'dinleme':
      if (q.mod === 'sec') {
        if (!q.secenekler || q.secenekler.length === 0) {
          errors.push(err("mod 'sec' iken secenekler zorunlu"))
        } else if (!q.secenekler.includes(q.dogruCevaplar[0])) {
          errors.push(err('dogruCevaplar[0] secenekler içinde yok'))
        }
      }
      break
    case 'cumle-dizme': {
      const expected = sortedKey(q.parcalar)
      q.dogruSiralar.forEach((siralama, i) => {
        if (sortedKey(siralama) !== expected) {
          errors.push(err(`dogruSiralar[${i}] parcalar'ın bir permütasyonu değil`))
        }
      })
      break
    }
    default:
      break
  }
  return errors
}

export function checkPartRules(dosya: string, part: Part): ContentError[] {
  const errors: ContentError[] = []
  if (part.sorular.length < MIN_SORU) {
    errors.push({ dosya, mesaj: `sorular en az ${MIN_SORU} olmalı (bulunan: ${part.sorular.length})` })
  }
  for (const q of part.sorular) errors.push(...checkQuestionRules(dosya, q))
  return errors
}

export function checkUniqueIds(all: { dosya: string; q: Question }[]): ContentError[] {
  const seen = new Map<string, string>()
  const errors: ContentError[] = []
  for (const { dosya, q } of all) {
    const first = seen.get(q.id)
    if (first !== undefined) {
      errors.push({ dosya, soruId: q.id, mesaj: `id tekrar ediyor (ilk: ${first})` })
    } else {
      seen.set(q.id, dosya)
    }
  }
  return errors
}

import type { ZodType, ZodTypeDef } from 'zod'
import { checkPartRules, checkQuestionRules, checkUniqueIds, type ContentError } from './rules'
import {
  modulesIndexSchema,
  partSchema,
  sinavSchema,
  type Part,
  type Question,
  type Sinav,
} from './schema'

export type Modul = {
  id: string
  sira: number
  baslik: string
  partlar: (Part & { dosya: string })[]
  sinav: Sinav | null
}

export type SoruKaydi = { soru: Question; modulId: string; partId: string | null }

export type LoadResult = {
  moduller: Modul[]
  hatalar: ContentError[]
  soruIndex: Map<string, SoruKaydi>
}

const MODULES_KEY = '/content/modules.json'

function parse<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  dosya: string,
  data: unknown,
): { ok: true; value: T } | { ok: false; error: ContentError } {
  const r = schema.safeParse(data)
  if (r.success) return { ok: true, value: r.data }
  const issue = r.error.issues[0]
  const path = issue.path.join('.')
  return {
    ok: false,
    error: { dosya, mesaj: `Şema hatası: ${path ? `${path}: ` : ''}${issue.message}` },
  }
}

export function loadContent(files: Record<string, unknown>): LoadResult {
  const hatalar: ContentError[] = []
  const soruIndex = new Map<string, SoruKaydi>()

  if (!(MODULES_KEY in files)) {
    return { moduller: [], hatalar: [{ dosya: MODULES_KEY, mesaj: 'modules.json bulunamadı' }], soruIndex }
  }
  const idx = parse(modulesIndexSchema, MODULES_KEY, files[MODULES_KEY])
  if (!idx.ok) return { moduller: [], hatalar: [idx.error], soruIndex }

  const all: { dosya: string; q: Question }[] = []
  const moduller: Modul[] = []

  for (const m of [...idx.value.moduller].sort((a, b) => a.sira - b.sira)) {
    const partlar: Modul['partlar'] = []

    for (const partName of m.partlar) {
      const dosya = `/content/${m.id}/${partName}.json`
      if (!(dosya in files)) {
        hatalar.push({ dosya, mesaj: 'Dosya bulunamadı' })
        continue
      }
      const p = parse(partSchema, dosya, files[dosya])
      if (!p.ok) {
        hatalar.push(p.error)
        continue
      }
      hatalar.push(...checkPartRules(dosya, p.value))
      partlar.push({ ...p.value, dosya })
      for (const q of p.value.sorular) {
        all.push({ dosya, q })
        if (!soruIndex.has(q.id)) soruIndex.set(q.id, { soru: q, modulId: m.id, partId: p.value.id })
      }
    }

    let sinav: Sinav | null = null
    const sinavKey = `/content/${m.id}/sinav.json`
    if (sinavKey in files) {
      const s = parse(sinavSchema, sinavKey, files[sinavKey])
      if (s.ok) {
        sinav = s.value
        for (const q of s.value.ekSorular) {
          hatalar.push(...checkQuestionRules(sinavKey, q))
          all.push({ dosya: sinavKey, q })
          if (!soruIndex.has(q.id)) soruIndex.set(q.id, { soru: q, modulId: m.id, partId: null })
        }
      } else {
        hatalar.push(s.error)
      }
    }

    moduller.push({ id: m.id, sira: m.sira, baslik: m.baslik, partlar, sinav })
  }

  hatalar.push(...checkUniqueIds(all))
  return { moduller, hatalar, soruIndex }
}

// Bir sorudaki sözcüklerin öğrenciye daha önce gösterilip gösterilmediğini bulur.
// scripts/ogretilenler.mjs de kullanır, bu yüzden yalnızca sade TypeScript içerir.

type Kayit = Record<string, unknown>

const dizgiler = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : typeof v === 'string' ? [v] : []

export const sozcukler = (s: string): string[] =>
  (s.replace(/_+/g, ' ').match(/\p{L}+/gu) ?? []).map((w) => w.toLocaleLowerCase('de'))

/** Sorunun cevap olarak seçilen ya da yazılan alanları. Eşleştirme hem Türkçe hem Almanca içerdiği için katılmaz. */
const cevapMetni = (q: Kayit): string[] => [
  ...dizgiler(q.secenekler),
  ...dizgiler(q.dogruCevaplar),
  ...dizgiler(q.parcalar),
  ...dizgiler(q.isim),
  ...dizgiler(q.fiil),
]

/** Sorunun okunan Almanca alanları. `soru` Türkçe yönerge olduğu için katılmaz. */
const okunanMetin = (q: Kayit): string[] => [
  ...dizgiler(q.metin),
  ...dizgiler(q.ifade),
  ...dizgiler(q.okunacak),
  ...((q.diyalog as { metin: string }[] | undefined) ?? []).map((d) => d.metin),
]

/**
 * Bir dersin öğrenciye gösterdiği metin. `tamami` önceki dersler içindir: sözlük listesi ve sorular
 * da görülmüştür. Yazılan dersin `kelimeler` alanı testten önce görünmediği için sayılmaz.
 */
export function gosterimMetni(part: Kayit, tamami: boolean): string[] {
  const temel = [
    ...dizgiler(part.ozet),
    ...((part.trickler as { baslik: string; metin: string }[] | undefined) ?? []).flatMap((t) => [t.baslik, t.metin]),
  ]
  if (!tamami) return temel
  return [
    ...temel,
    ...((part.kelimeler as { de: string; artikel?: string }[] | undefined) ?? []).flatMap((k) => [k.de, k.artikel ?? '']),
    ...((part.sorular as Kayit[] | undefined) ?? []).flatMap((q) => [...cevapMetni(q), ...okunanMetin(q)]),
  ]
}

const yeni = (metinler: string[], bilinen: Set<string>): string[] =>
  [...new Set(metinler.flatMap(sozcukler))].filter((w) => !bilinen.has(w))

export function gosterilmemisler(q: Kayit, bilinen: Set<string>): { cevap: string[]; metin: string[] } {
  const cevap = yeni(cevapMetni(q), bilinen)
  return { cevap, metin: yeni(okunanMetin(q), bilinen).filter((w) => !cevap.includes(w)) }
}

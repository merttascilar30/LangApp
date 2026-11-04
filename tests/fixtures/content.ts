import { STORAGE_KEY } from '../../src/storage/storage'

export function makeQuestion(id: string, tip: 'dogru-yanlis' | 'coktan-secmeli' = 'dogru-yanlis') {
  if (tip === 'coktan-secmeli') {
    return {
      id,
      tip,
      soru: 'Hangisi?',
      aciklama: 'açıklama',
      secenekler: ['a', 'b', 'c'],
      dogru: 0,
    }
  }
  return {
    id,
    tip,
    soru: 'Doğru mu?',
    aciklama: 'açıklama',
    ifade: 'Ich bin Anna.',
    dogru: true,
  }
}

export function makePart(id: string, n = 15, ders = 1) {
  return {
    id,
    ders,
    baslik: `Ders ${ders}`,
    videoId: 'abc',
    ozet: ['a', 'b', 'c'],
    kelimeler: [],
    sorular: Array.from({ length: n }, (_, i) => makeQuestion(`${id}-q${i}`)),
  }
}

export type FilesOpts = {
  /** Ek/override dosyalar (yol -> içerik). */
  extra?: Record<string, unknown>
  /** modul-1'in part sayısı (varsayılan 1). 0 -> partsız. Diğer modüller partsızdır. */
  modul1Partlar?: number
}

export function makeFiles(opts: FilesOpts = {}): Record<string, unknown> {
  const n = opts.modul1Partlar ?? 1
  const partNames = Array.from({ length: n }, (_, i) => `ders-0${i + 1}`)
  const moduller = Array.from({ length: 8 }, (_, i) => ({
    id: `modul-${i + 1}`,
    sira: i + 1,
    baslik: `Başlık ${i + 1}`,
    partlar: i === 0 ? partNames : [],
  }))
  const files: Record<string, unknown> = { '/content/modules.json': { moduller } }
  partNames.forEach((name, i) => {
    files[`/content/modul-1/${name}.json`] = makePart(`m1-d${i + 1}`, 15, i + 1)
  })
  return { ...files, ...opts.extra }
}

export type FakeStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {
  raw(): string | null
}

/** Bellek içi store. `initial`: ham string ya da JSON'a çevrilecek nesne. */
export function makeStore(initial?: unknown): FakeStore {
  const map = new Map<string, string>()
  if (initial !== undefined) {
    map.set(STORAGE_KEY, typeof initial === 'string' ? initial : JSON.stringify(initial))
  }
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    raw: () => map.get(STORAGE_KEY) ?? null,
  }
}

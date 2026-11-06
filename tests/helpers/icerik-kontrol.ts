import type { Question } from '../../src/content/schema'
import { glossTokens } from '../../src/domain/gloss'

const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** `aranan`, `metin` içinde tam kelime olarak (harf/rakam sınırlı) geçiyor mu? */
export const geciyor = (metin: string, aranan: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${kacis(aranan)}(?![\\p{L}\\p{N}])`, 'iu').test(metin)

export const sade = (s: string) => s.normalize('NFD').replace(/̇/g, '').toLowerCase()

/** Gloss (kelime baloncuğu) uygulanan metin alanları. */
export function glossAlanlari(q: Question): string[] {
  switch (q.tip) {
    case 'bosluk-doldurma':
      return [q.metin]
    case 'dogru-yanlis':
      return [q.ifade]
    case 'artikel':
      return [q.isim]
    case 'coktan-secmeli':
      return [...q.secenekler, ...(q.metin !== undefined ? [q.metin] : []), ...(q.diyalog?.map((s) => s.metin) ?? [])]
    case 'cumle-dizme':
      return q.parcalar
    case 'eslestirme':
      return q.ciftler.map((c) => c.sol)
    case 'fiil-cekimi':
      return [q.fiil]
    default:
      return []
  }
}

/** İpucu, kabul edilen doğru cevabı açık ediyorsa her sızıntı için bir satır. */
export function ipucuSizintilari(q: Question): string[] {
  if (!q.ipucu) return []
  let cevaplar: string[] = []
  if (q.tip === 'bosluk-doldurma' || q.tip === 'ceviri') cevaplar = q.dogruCevaplar
  else if (q.tip === 'dinleme') cevaplar = q.dogruCevaplar
  else if (q.tip === 'coktan-secmeli') cevaplar = [q.secenekler[q.dogru]]
  else if (q.tip === 'artikel') cevaplar = [q.dogru]
  return cevaplar.filter((c) => geciyor(q.ipucu!, c)).map((c) => `${q.id}: "${c}"`)
}

/** Kelime baloncuğu (tooltip) kabul edilen cevabı sızdırıyorsa her sızıntı için bir satır. */
export function tooltipSizintilari(q: Question, sozluk: Record<string, string>): string[] {
  if (q.glossKapali) return []
  let cevaplar: string[] = []
  if (q.tip === 'bosluk-doldurma') cevaplar = q.dogruCevaplar
  else if (q.tip === 'eslestirme') cevaplar = q.ciftler.map((c) => c.sag)
  else if (q.tip === 'coktan-secmeli' && (q.metin !== undefined || q.diyalog !== undefined)) {
    cevaplar = [q.secenekler[q.dogru]]
  }
  cevaplar = cevaplar.filter((c) => [...c.replace(/[^\p{L}]/gu, '')].length >= 3)
  const sizan: string[] = []
  for (const alan of glossAlanlari(q)) {
    for (const t of glossTokens(alan, sozluk, q.sozlukEk)) {
      if (t.anlam === undefined) continue
      for (const c of cevaplar) {
        if (geciyor(t.anlam, c)) sizan.push(`${q.id}: kelime "${t.metin}" tooltip "${t.anlam}" cevap "${c}"`)
      }
    }
  }
  return sizan
}

/** Almanca gloss kelimelerinden kaçına anlam bağlandı. Hiç kelime yoksa oran 1. */
export function glossKapsami(
  sorular: readonly Question[],
  sozluk: Record<string, string>,
  disi: ReadonlySet<string>,
): { oran: number; eksik: string[] } {
  let toplam = 0
  let anlamli = 0
  const eksik: string[] = []
  for (const q of sorular) {
    for (const alan of glossAlanlari(q)) {
      for (const t of glossTokens(alan, sozluk, q.sozlukEk)) {
        if (!/\p{L}/u.test(t.metin) || t.metin.includes('___')) continue
        const k = sade(t.metin.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''))
        if (k === '' || disi.has(k)) continue
        toplam++
        if (t.anlam !== undefined) anlamli++
        else eksik.push(`${q.id}:${t.metin}`)
      }
    }
  }
  return { oran: toplam === 0 ? 1 : anlamli / toplam, eksik }
}

// ---------- Ders haritası ----------
export type HaritaDers = {
  ders: number
  modulId: string
  dosya: string
  baslik: string
  videoId: string
  temalar: string[]
  aramaKaliplari: string[]
  gramer: string[]
  istisna: boolean
  istisnaGerekcesi?: string
}
export type DersHaritasi = { dersler: HaritaDers[] }

type ModulOzeti = { id: string; partlar: { ders: number }[]; sinav?: unknown }

/** modul-1 dışındaki modüllerde partı olup haritada kaydı olmayan dersler. */
export function haritaEksikleri(moduller: readonly ModulOzeti[], harita: DersHaritasi): string[] {
  const hatalar: string[] = []
  for (const m of moduller) {
    if (m.id === 'modul-1') continue
    for (const p of m.partlar) {
      if (!harita.dersler.some((d) => d.modulId === m.id && d.ders === p.ders)) {
        hatalar.push(`${m.id}: ders ${p.ders} haritada yok`)
      }
    }
  }
  return hatalar
}

/** Haritadaki bir modülün tüm dersleri partlardaysa o modülün sınavı bulunmalı. */
export function sinavEksikleri(moduller: readonly ModulOzeti[], harita: DersHaritasi): string[] {
  const hatalar: string[] = []
  for (const m of moduller) {
    if (m.id === 'modul-1' || m.partlar.length === 0) continue
    const haritaDersleri = harita.dersler.filter((d) => d.modulId === m.id)
    if (haritaDersleri.length === 0) continue
    const tamam = haritaDersleri.every((d) => m.partlar.some((p) => p.ders === d.ders))
    if (tamam && !m.sinav) hatalar.push(`${m.id}: tüm dersler yazıldı ama sinav.json yok`)
  }
  return hatalar
}

/** `istisna: true` olup gerekçesi boş olan dersler (`modul-N ders M`). */
export function istisnaGerekcesizler(harita: DersHaritasi): string[] {
  return harita.dersler.filter((d) => d.istisna && !d.istisnaGerekcesi?.trim()).map((d) => `${d.modulId} ders ${d.ders}`)
}

/** Baloncuk araması harf büyüklüğüne duyarsızdır; aynı anahtara düşen farklı anlamlar yanlış baloncuk üretir. */
export function sozlukCakismalari(girdiler: Record<string, string>): string[] {
  const gruplar = new Map<string, string[]>()
  for (const anahtar of Object.keys(girdiler)) {
    const k = anahtar.toLowerCase()
    gruplar.set(k, [...(gruplar.get(k) ?? []), anahtar])
  }
  return [...gruplar.entries()]
    .filter(([, a]) => new Set(a.map((x) => girdiler[x])).size > 1)
    .map(([k, a]) => `sözlük çakışması "${k}": ${a.map((x) => `${x}=${girdiler[x]}`).join(' / ')}`)
}

import { describe, expect, it } from 'vitest'
import { contentFiles } from '../../src/content/files'
import { loadContent } from '../../src/content/loader'
import type { Question } from '../../src/content/schema'
import { glossTokens } from '../../src/domain/gloss'

const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const geciyor = (metin: string, aranan: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${kacis(aranan)}(?![\\p{L}\\p{N}])`, 'iu').test(metin)

// Gloss alanlarında geçen ama sözlüğe girmeyecek, Almanca OLMAYAN normalize tokenlar:
// Türkçe kelimeler, tek harfler, harf adları/okunuş yazımları, harflenmiş biçimler ve ses grupları.
// Buraya gerçek bir Almanca kelime eklenmez.
const GLOSS_DISI = new Set([
  'c', 'g', 'j', 'q', 'w', 'z', 'harfine', 'denir', 'harflerine', 'k', 'h', 'a', 'r', 'v', 'x',
  'y', 's', 'harfi', "almanca'da", 'ci', 'diye', 'okunur', 'fau', 've', 'dabıl', 'yu', 'çe',
  'zed', 'ze', 'tset', 'zi', 'harfleri', 'olarak', 'adlandırılır', 'harfinin', 'adı', 'b', 't',
  'e', 'tüm', 'isimler', 'büyük', 'harfle', 'başlar', 'bu', 'ne', 'kadar', 'bunu', 'nasıl',
  'yazarsınız', 'nereli', 'kim', 's-h-u-l-e', 's-k-u-l-e', 's-c-h-u-l-e', 'ş-u-l-e', 'telefonda',
  'isimleri', 'harflerken', 'gibi', 'kalıplar', 'kullanılabilir', 'tek', 'iki', 'tane', 'tt',
  'ile', 'd', 'hali', 'sorusuna', 'cevap', 'verilebilir', 'ş', 'ç', 'ay', 'i-e', 'ayrı', 'ses',
  'uzun', 'i', 'oy', 'ie', 'ünlü', 'sch', 'ei', 'eu', 'st', 'şt', 'sd', 'zt', 'kelime',
  'başındaki', 'sp', 'şp', 'ts', 'türkçe', 'ingilizce', 'f', 'u', 'aynı', 'sesi', 'verir',
  'qu', 'kv', 'kelimelerindeki', 'ch', 'vermez', '-ig', 'sesiyle', '-ik', '-iş', '-iç',
  "ich'teki", 'resmi', 'ortamlarda', 'kullanılan', 'en', 'saygılı', 'selamdır', 'güney',
  'almanya', "avusturya'da", 'bir', 'selamlaşma', 'sözüdür', 'sabah', 'saatlerinde', 'telefon',
  'görüşmesinin', 'sonunda', 'kullanılır', 'uygun', 'veda', 'gün', 'içinde', 'biriyle',
  'karşılaşınca', 'yarın', 'tekrar', 'görüşeceğin', 'birine', 'söylenir', 'durumda',
  'kelimesi', 'başta', 'değil',
])
const sade = (s: string) => s.normalize('NFD').replace(/\u0307/g, '').toLowerCase()

function glossAlanlari(q: Question): string[] {
  switch (q.tip) {
    case 'bosluk-doldurma':
      return [q.metin]
    case 'dogru-yanlis':
      return [q.ifade]
    case 'artikel':
      return [q.isim]
    case 'coktan-secmeli':
      return q.secenekler
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

  it('modül 1: sözlük, Almanca gloss kelimelerinin ≥ %80 ini kapsar', () => {
    const m = m1()
    let toplam = 0
    let anlamli = 0
    const eksik: string[] = []
    for (const q of m1Sorular()) {
      for (const alan of glossAlanlari(q)) {
        for (const t of glossTokens(alan, m.sozluk, q.sozlukEk)) {
          if (!/\p{L}/u.test(t.metin) || t.metin.includes('___')) continue
          const k = sade(t.metin.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''))
          if (k === '' || GLOSS_DISI.has(k)) continue
          toplam++
          if (t.anlam !== undefined) anlamli++
          else eksik.push(`${q.id}:${t.metin}`)
        }
      }
    }
    const oran = anlamli / toplam
    expect(oran, `kapsama ${(oran * 100).toFixed(1)}%; anlamsız: ${eksik.join(' ')}`).toBeGreaterThanOrEqual(0.8)
  })
  it('modül 1: glossKapali olmayan sorularda tooltip kabul edilen cevabı sızdırmaz', () => {
    const m = m1()
    const sizan: string[] = []
    for (const q of m1Sorular()) {
      if (q.glossKapali) continue
      let cevaplar: string[] = []
      if (q.tip === 'bosluk-doldurma') cevaplar = q.dogruCevaplar
      else if (q.tip === 'eslestirme') cevaplar = q.ciftler.map((c) => c.sag)
      cevaplar = cevaplar.filter((c) => [...c.replace(/[^\p{L}]/gu, '')].length >= 3)
      for (const alan of glossAlanlari(q)) {
        for (const t of glossTokens(alan, m.sozluk, q.sozlukEk)) {
          if (t.anlam === undefined) continue
          for (const c of cevaplar) {
            if (geciyor(t.anlam, c)) sizan.push(`${q.id}: kelime "${t.metin}" tooltip "${t.anlam}" cevap "${c}"`)
          }
        }
      }
    }
    expect(sizan).toEqual([])
  })
})

import type { Part, Question } from '../../src/content/schema'

/** Karşılaştırma için: küçük harf; ’‘→'; . , ! ? ; : " ( ) – — - silinir; boşluklar teke iner. */
export function normCumle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:"()–—-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type KaliteGirdisi = { part: Part; istisna: boolean; bankaCumleleri: ReadonlySet<string> }

type BankaJson = Record<string, { kelimeler?: { ornekCumleler?: string[] }[] }>

/** Yalnızca modul-2..modul-8 bölümlerinin ornekCumleler değerleri (birebir). */
export function bankaCumleleri(banka: BankaJson): Set<string> {
  const sonuc = new Set<string>()
  for (const [anahtar, modul] of Object.entries(banka)) {
    const m = /^modul-(\d+)$/.exec(anahtar)
    if (!m || Number(m[1]) < 2 || Number(m[1]) > 8) continue
    for (const k of modul.kelimeler ?? []) for (const c of k.ornekCumleler ?? []) sonuc.add(c)
  }
  return sonuc
}

const kelimeSayisi = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const doldur = (metin: string, cevap: string) => metin.split('___').join(cevap)

/** Senaryo sorusunun "doğru cevap" metni. */
function senaryoCevabi(q: Question): string {
  switch (q.tip) {
    case 'coktan-secmeli':
      return q.secenekler[q.dogru] ?? ''
    case 'dinleme':
      return q.okunacak
    case 'ceviri':
      return q.dogruCevaplar[0] ?? ''
    case 'dogru-yanlis':
      return q.ifade
    default:
      return ''
  }
}

/** `bicim` ile soru tipinin uyumu (spec §2 tablosu). `bicim` boşsa burada denetlenmez. */
export function bicimHatalari(q: Question): string[] {
  if (q.bicim === undefined) return []
  const hatalar: string[] = []
  let uygun: boolean
  switch (q.bicim) {
    case 'bosluk':
      uygun = (q.tip === 'coktan-secmeli' && q.metin !== undefined) || q.tip === 'bosluk-doldurma'
      break
    case 'diyalog':
      uygun = q.tip === 'coktan-secmeli' && q.diyalog !== undefined
      break
    case 'siralama':
      uygun = q.tip === 'cumle-dizme'
      break
    case 'senaryo':
      uygun =
        (q.tip === 'coktan-secmeli' && q.metin === undefined && q.diyalog === undefined) ||
        q.tip === 'dinleme' ||
        q.tip === 'ceviri' ||
        q.tip === 'dogru-yanlis'
      break
    case 'kelime':
      uygun = true
      break
  }
  if (!uygun) {
    hatalar.push(`${q.id}: bicim '${q.bicim}' ile tip '${q.tip}' uyumsuz`)
  } else if (q.bicim === 'senaryo' && kelimeSayisi(senaryoCevabi(q)) < 2) {
    hatalar.push(`${q.id}: senaryo doğru cevabı en az 2 kelime olmalı`)
  }
  return hatalar
}

/** goethe kaynaklı sorunun doğru cevabı kaynakCumle ile örtüşmüyorsa mesaj, aksi halde null. */
function goetheTutarsizligi(q: Question): string | null {
  const kaynak = normCumle(q.kaynakCumle ?? '')
  const esit = (s: string) => normCumle(s) === kaynak
  let tutarli: boolean
  switch (q.tip) {
    case 'coktan-secmeli': {
      const dogru = q.secenekler[q.dogru] ?? ''
      if (q.metin !== undefined) tutarli = esit(doldur(q.metin, dogru))
      else if (q.diyalog !== undefined) {
        tutarli = normCumle(q.diyalog.map((s) => doldur(s.metin, dogru)).join(' ')).includes(kaynak)
      } else tutarli = esit(dogru)
      break
    }
    case 'bosluk-doldurma':
      tutarli = esit(doldur(q.metin, q.dogruCevaplar[0] ?? ''))
      break
    case 'cumle-dizme':
      tutarli = q.dogruSiralar.some((s) => esit(s.join(' ')))
      break
    case 'dinleme':
      tutarli = esit(q.okunacak)
      break
    case 'ceviri':
      tutarli = esit(q.dogruCevaplar[0] ?? '')
      break
    case 'dogru-yanlis':
      tutarli = esit(q.ifade)
      break
    default:
      return `${q.id}: '${q.tip}' tipi goethe olarak işaretlenemez`
  }
  return tutarli ? null : `${q.id}: goethe tutarsız: doğru cevap kaynakCumle ile eşleşmiyor`
}

/** Tek sorunun kaynak/biçim kuralları (ders partları ve sınav ekSoruları için). */
export function soruKaynakHatalari(q: Question, banka: ReadonlySet<string>): string[] {
  const hatalar: string[] = []
  const hata = (m: string) => hatalar.push(`${q.id}: ${m}`)

  if (q.bicim === undefined) hata('bicim boş')
  if (q.kaynakTuru === undefined) hata('kaynakTuru boş')
  hatalar.push(...bicimHatalari(q))

  if (q.kaynakTuru === 'goethe' || q.kaynakTuru === 'uyarlama') {
    if (!q.kaynakCumle) hata(`kaynakTuru '${q.kaynakTuru}' iken kaynakCumle boş`)
    else if (!banka.has(q.kaynakCumle)) hata(`kaynakCumle bankada yok: "${q.kaynakCumle}"`)
  }
  if (q.kaynakTuru === 'goethe' && q.kaynakCumle) {
    const t = goetheTutarsizligi(q)
    if (t) hatalar.push(t)
  }

  if (q.tip === 'coktan-secmeli' && (q.metin !== undefined || q.diyalog !== undefined)) {
    const n = q.celdiriciNotlari
    if (n === undefined) hata('celdiriciNotlari eksik')
    else if (n.length !== q.secenekler.length) hata('celdiriciNotlari uzunluğu secenekler ile aynı değil')
    else {
      n.forEach((not, i) => {
        if (i === q.dogru) {
          if (not !== '') hata("celdiriciNotlari doğru şıkta '' olmalı")
        } else if (not.trim() === '') hata(`celdiriciNotlari[${i}] boş (yanlış şık)`)
      })
    }
  }
  return hatalar
}

/**
 * Çoktan seçmeli sorularda doğru şık hep aynı konumda olmasın: soru sayısı >= 4 ise
 * hiçbir konum cevapların %50'sinden fazlasını taşıyamaz.
 */
export function cevapKonumuHatalari(sorular: readonly Question[]): string[] {
  const cs = sorular.filter((q) => q.tip === 'coktan-secmeli')
  if (cs.length < 4) return []
  const sayac = new Map<number, number>()
  for (const q of cs) if (q.tip === 'coktan-secmeli') sayac.set(q.dogru, (sayac.get(q.dogru) ?? 0) + 1)
  const hatalar: string[] = []
  for (const [konum, n] of sayac) {
    if (n / cs.length > 0.5) {
      hatalar.push(`doğru şık konum ${konum + 1} içinde yığılmış: ${n}/${cs.length} çoktan seçmeli soru (en fazla %50)`)
    }
  }
  return hatalar
}

/** Spec §5 tablosu: tek bir dersin (part) kalite hataları. */
export function dersKaliteHatalari(g: KaliteGirdisi): string[] {
  const { part, istisna, bankaCumleleri: banka } = g
  const sorular = part.sorular
  const toplam = sorular.length
  const hatalar: string[] = []
  const pHata = (m: string) => hatalar.push(`${part.id}: ${m}`)

  if (toplam < 15 || toplam > 25) pHata(`soru sayısı 15–25 olmalı (bulunan: ${toplam})`)
  const tipSayisi = new Set(sorular.map((q) => q.tip)).size
  if (tipSayisi < 4) pHata(`tip çeşitliliği en az 4 olmalı (bulunan: ${tipSayisi})`)

  for (const q of sorular) hatalar.push(...soruKaynakHatalari(q, banka))

  const say = (f: (q: Question) => boolean) => sorular.filter(f).length
  const kelime = say((q) => q.bicim === 'kelime')
  if (toplam > 0 && kelime / toplam > 0.15) pHata(`kelime biçimi en fazla %15 olmalı (bulunan: ${kelime}/${toplam})`)

  for (const b of ['bosluk', 'diyalog', 'siralama', 'senaryo'] as const) {
    const n = say((q) => q.bicim === b)
    if (n < 2) pHata(`"${b}" biçimi en az 2 soru olmalı (bulunan: ${n})`)
  }
  const senaryoCoktan = say((q) => q.bicim === 'senaryo' && q.tip === 'coktan-secmeli')
  if (senaryoCoktan < 2) pHata(`senaryo en az 2 coktan-secmeli içermeli (bulunan: ${senaryoCoktan})`)

  const goethe = say((q) => q.kaynakTuru === 'goethe')
  if (!istisna && toplam > 0 && goethe / toplam < 0.5) {
    pHata(`goethe oranı en az %50 olmalı (bulunan: ${goethe}/${toplam})`)
  }
  const yazildi = say((q) => q.kaynakTuru === 'yazildi')
  const yazildiSiniri = istisna ? 0.4 : 0.15
  if (toplam > 0 && yazildi / toplam > yazildiSiniri) {
    pHata(`yazildi oranı en fazla %${yazildiSiniri * 100} olmalı (bulunan: ${yazildi}/${toplam})`)
  }

  for (const h of cevapKonumuHatalari(sorular)) pHata(h)

  const kullanim = new Map<string, number>()
  for (const q of sorular) {
    if (!q.kaynakCumle) continue
    const k = normCumle(q.kaynakCumle)
    kullanim.set(k, (kullanim.get(k) ?? 0) + 1)
  }
  for (const [k, n] of kullanim) {
    if (n > 2) pHata(`kaynakCumle tekrarı: "${k}" ${n} soruda (en fazla 2)`)
  }

  return hatalar
}

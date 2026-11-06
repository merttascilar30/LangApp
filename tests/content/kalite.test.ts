import { describe, expect, it } from 'vitest'
import type { Part, Question } from '../../src/content/schema'
import { sozlukCakismalari } from '../helpers/icerik-kontrol'
import {
  bankaCumleleri,
  bicimHatalari,
  buyukHarfliParcaHatalari,
  cevapKonumuHatalari,
  dersKaliteHatalari,
  dogruYanlisDengesi,
  enAzUcSikHatalari,
  ipucuTekrari,
  modulKaliteHatalari,
  normCumle,
  sinavKopyaHatalari,
  soruKaynakHatalari,
} from '../helpers/kalite'
import {
  haritaEksikleri,
  istisnaGerekcesizler,
  sinavEksikleri,
  tooltipSizintilari,
} from '../helpers/icerik-kontrol'

// ---------- Fixture kurucuları ----------
const S = {
  s0: 'Ich heiße Anna.',
  s1: 'Wir kommen aus Berlin.',
  s2: 'Er wohnt in Hamburg.',
  s3: 'Wie geht es dir?',
  s4: 'Woher kommen Sie?',
  s5: 'Ich bin Student.',
  s6: 'Das ist mein Bruder.',
  s7: 'Ich habe Hunger.',
  s8: 'Wo wohnst du?',
  s9: 'Ich komme aus der Türkei.',
  s10: 'Sie ist Lehrerin.',
  s11: 'Er heißt Paul.',
}
const BANKA: ReadonlySet<string> = new Set(Object.values(S))

type KT = 'goethe' | 'uyarlama' | 'yazildi'
const ortak = (id: string, bicim: Question['bicim'], kt: KT, kaynak?: string) => ({
  id,
  soru: 'Soru',
  aciklama: 'Açıklama',
  ipucu: 'İpucu',
  bicim,
  kaynakTuru: kt,
  kaynakCumle: kaynak,
})
const bosalt = (s: string, kelime: string) => s.replace(kelime, '___')

// kaynak: kaynakCumle (varsayılan s). Uyumsuzluk testlerinde içerik s'den, kaynak başka cümleden gelir.
function metinQ(id: string, kt: KT, s: string, ans: string, kaynak: string = s): Question {
  return {
    ...ortak(id, 'bosluk', kt, kaynak),
    tip: 'coktan-secmeli',
    metin: bosalt(s, ans),
    secenekler: [ans, 'falsch', 'nein'],
    dogru: 0,
    celdiriciNotlari: ['', 'Yanlış biçim', 'Yanlış kelime'],
  }
}
function yazQ(id: string, kt: KT, s: string, ans: string, kaynak: string = s): Question {
  return { ...ortak(id, 'bosluk', kt, kaynak), tip: 'bosluk-doldurma', metin: bosalt(s, ans), dogruCevaplar: [ans] }
}
function diyQ(id: string, kt: KT, s: string, ans: string, kaynak: string = s): Question {
  return {
    ...ortak(id, 'diyalog', kt, kaynak),
    tip: 'coktan-secmeli',
    diyalog: [
      { kim: 'A', metin: 'Hallo!' },
      { kim: 'B', metin: bosalt(s, ans) },
    ],
    secenekler: [ans, 'falsch', 'nein'],
    dogru: 0,
    celdiriciNotlari: ['', 'Yanlış biçim', 'Yanlış kelime'],
  }
}
/** Parçalar cümle içi doğal yazımla: ilk sözcük küçük (yalnızca Sie büyük kalır). */
function dizQ(id: string, kt: KT, s: string, kaynak: string = s): Question {
  const parcalar = s.split(' ').map((p, i) => (i === 0 && p !== 'Sie' ? p[0].toLowerCase() + p.slice(1) : p))
  return {
    ...ortak(id, 'siralama', kt, kaynak),
    tip: 'cumle-dizme',
    parcalar: [...parcalar].reverse(),
    dogruSiralar: [parcalar],
  }
}
function senCoktanQ(id: string, kt: KT, s: string, kaynak: string = s): Question {
  return {
    ...ortak(id, 'senaryo', kt, kaynak),
    tip: 'coktan-secmeli',
    soru: 'Açlığını söylemek istiyorsun.',
    secenekler: [s, 'Ich habe Durst.', 'Ich bin müde.'],
    dogru: 0,
    celdiriciNotlari: ['', 'Durst susuzluktur', 'müde yorgunluktur'],
  }
}
function senDinQ(id: string, kt: KT, s: string, kaynak: string = s): Question {
  return { ...ortak(id, 'senaryo', kt, kaynak), tip: 'dinleme', okunacak: s, mod: 'yaz', dogruCevaplar: [s] }
}
function senCevQ(id: string, kt: KT, s: string, kaynak: string = s): Question {
  return { ...ortak(id, 'senaryo', kt, kaynak), tip: 'ceviri', kaynak: 'Türkçe cümle', dogruCevaplar: [s] }
}
function senDYQ(id: string, kt: KT, s: string, kaynak: string = s): Question {
  return { ...ortak(id, 'senaryo', kt, kaynak), tip: 'dogru-yanlis', ifade: s, dogru: true }
}
const kelCeviri = (id: string, kt: KT = 'yazildi', kaynak?: string): Question => ({
  ...ortak(id, 'kelime', kt, kaynak),
  tip: 'ceviri',
  kaynak: 'ev',
  dogruCevaplar: ['Haus'],
})
const kelArtikel = (id: string, kt: KT = 'yazildi', kaynak?: string): Question => ({
  ...ortak(id, 'kelime', kt, kaynak),
  tip: 'artikel',
  isim: 'Haus',
  dogru: 'das',
})
const kelEsles = (id: string, kt: KT = 'yazildi', kaynak?: string): Question => ({
  ...ortak(id, 'kelime', kt, kaynak),
  tip: 'eslestirme',
  ciftler: [
    { sol: 'Haus', sag: 'ev' },
    { sol: 'Hund', sag: 'köpek' },
    { sol: 'Katze', sag: 'kedi' },
    { sol: 'Buch', sag: 'kitap' },
  ],
})

/** coktan-secmeli sorunun doğru şıkkını (ve notunu) verilen konuma taşır. */
function konumla(q: Question, slot: number): Question {
  if (q.tip !== 'coktan-secmeli' || q.dogru === slot) return q
  const sec = [...q.secenekler]
  ;[sec[q.dogru], sec[slot]] = [sec[slot], sec[q.dogru]]
  const out: Question = { ...q, secenekler: sec, dogru: slot }
  if (q.celdiriciNotlari) {
    const n = [...q.celdiriciNotlari]
    ;[n[q.dogru], n[slot]] = [n[slot], n[q.dogru]]
    out.celdiriciNotlari = n
  }
  return out
}

function gecerli20(): Question[] {
  const SLOTLAR = [0, 1, 2, 0, 1, 2, 1]
  let k = 0
  return ham20().map((q) => (q.tip === 'coktan-secmeli' ? konumla(q, SLOTLAR[k++ % SLOTLAR.length]) : q))
}

function ham20(): Question[] {
  return [
    metinQ('q00', 'goethe', S.s0, 'heiße'),
    metinQ('q01', 'goethe', S.s1, 'kommen'),
    yazQ('q02', 'goethe', S.s2, 'wohnt'),
    diyQ('q03', 'goethe', S.s3, 'geht'),
    diyQ('q04', 'goethe', S.s4, 'kommen'),
    dizQ('q05', 'goethe', S.s5),
    dizQ('q06', 'goethe', S.s6),
    senCoktanQ('q07', 'goethe', S.s7),
    senDinQ('q08', 'goethe', S.s8),
    senCevQ('q09', 'goethe', S.s9),
    senDYQ('q10', 'goethe', S.s10),
    metinQ('q11', 'uyarlama', 'Du heißt Anna.', 'heißt', S.s0),
    diyQ('q12', 'uyarlama', 'Er heißt Paul.', 'heißt', S.s11),
    dizQ('q13', 'uyarlama', 'Sie heißt Paul.', S.s11),
    senCoktanQ('q14', 'uyarlama', 'Wir wohnen in Berlin.', S.s1),
    kelCeviri('q15'),
    kelArtikel('q16'),
    kelEsles('q17'),
    yazQ('q18', 'uyarlama', 'Sie wohnt in Hamburg.', 'wohnt', S.s2),
    senDinQ('q19', 'uyarlama', 'Wo wohnt er?', S.s8),
  ]
}

function degistir(sorular: Question[], idx: number, yama: object | Question): Question[] {
  return sorular.map((q, i) => (i === idx ? ({ ...q, ...yama } as Question) : q))
}
const degistirTam = (sorular: Question[], idx: number, yeni: Question): Question[] =>
  sorular.map((q, i) => (i === idx ? yeni : q))

const partOlustur = (sorular: Question[]): Part => ({
  id: 'ders-t',
  ders: 99,
  baslik: 'Test',
  videoId: 'abc',
  ozet: ['a', 'b', 'c'],
  kelimeler: [],
  sorular,
})
const ders = (sorular: Question[], istisna = false) =>
  dersKaliteHatalari({ part: partOlustur(sorular), istisna, bankaCumleleri: BANKA })
const icerir = (hatalar: string[], parca: string) => hatalar.some((h) => h.includes(parca))

// ---------- Testler ----------
describe('normCumle', () => {
  it('büyük-küçük harf, noktalama ve kıvrık kesme farkını yok sayar', () => {
    expect(normCumle('Wie geht’s?')).toBe(normCumle("wie geht's"))
    expect(normCumle('Wie  geht’s?')).toBe("wie geht's")
    expect(normCumle('Woher kommen Sie? – Aus Frankreich.')).toBe('woher kommen sie aus frankreich')
    expect(normCumle('‘Hallo’, sagt er')).toBe("'hallo' sagt er")
  })
})

describe('bankaCumleleri', () => {
  it('yalnızca modul-2..modul-8 ornekCumleler', () => {
    const banka = {
      'modul-1': { kelimeler: [{ ornekCumleler: ['Nur eins.'] }] },
      'modul-2': { kelimeler: [{ ornekCumleler: ['Zwei A.', 'Zwei B.'] }, { ornekCumleler: [] }] },
      'modul-8': { kelimeler: [{ ornekCumleler: ['Acht.'] }, {}] },
    }
    expect([...bankaCumleleri(banka)].sort()).toEqual(['Acht.', 'Zwei A.', 'Zwei B.'])
  })
})

describe('dersKaliteHatalari', () => {
  it('geçerli 20 soruluk fixture hatasız', () => {
    expect(ders(gecerli20())).toEqual([])
  })

  it('soru sayısı 15–25', () => {
    expect(icerir(ders(gecerli20().slice(0, 14)), 'soru sayısı')).toBe(true)
    expect(icerir(ders([...gecerli20(), ...gecerli20().slice(0, 6).map((q, i) => ({ ...q, id: `x${i}` }) as Question)]), 'soru sayısı')).toBe(true)
    expect(icerir(ders(gecerli20().slice(0, 15)), 'soru sayısı')).toBe(false)
  })

  it('en az 4 soru tipi', () => {
    // tek tipe (bosluk-doldurma) indir
    const hepsiYaz = gecerli20().map((_q, i) => yazQ(`y${i}`, 'yazildi', 'Ich bin hier.', 'bin'))
    expect(icerir(ders(hepsiYaz), 'tip çeşitliliği')).toBe(true)
  })

  it('kelime biçimi: 20 soruda 4 hata, 3 geçer', () => {
    const dort = degistirTam(gecerli20(), 18, kelArtikel('q18', 'uyarlama', S.s2))
    expect(icerir(ders(dort), 'kelime biçimi')).toBe(true)
    expect(icerir(ders(gecerli20()), 'kelime biçimi')).toBe(false)
  })

  it('bir cümle biçiminden tek soru olunca hata', () => {
    let s = degistirTam(gecerli20(), 12, metinQ('q12', 'uyarlama', 'Du heißt Paul.', 'heißt', S.s11))
    s = degistirTam(s, 4, metinQ('q04', 'goethe', S.s4, 'kommen'))
    const h = ders(s)
    expect(icerir(h, '"diyalog" biçimi en az 2')).toBe(true)
    expect(icerir(h, '"bosluk" biçimi en az 2')).toBe(false)
  })

  it('senaryo: coktan-secmeli sayısı < 2 ise hata', () => {
    // q14'ü ceviri yap: senaryo sorusu 6 kalır ama coktan-secmeli yalnızca q07
    const s = degistirTam(gecerli20(), 14, senCevQ('q14', 'uyarlama', 'Wir wohnen in Berlin.', S.s1))
    expect(icerir(ders(s), 'senaryo en az 2 coktan-secmeli')).toBe(true)
  })

  it('düz coktan-secmeli diyalog etiketli → hata', () => {
    const s = degistir(gecerli20(), 14, { bicim: 'diyalog' })
    const h = ders(s)
    expect(h.some((m) => m.startsWith('q14:') && m.includes('bicim'))).toBe(true)
  })

  it('artikel senaryo etiketli → hata; tek kelimelik ceviri senaryo etiketli → hata', () => {
    expect(ders(degistir(gecerli20(), 16, { bicim: 'senaryo' })).some((m) => m.startsWith('q16:'))).toBe(true)
    const tek = degistir(gecerli20(), 15, { bicim: 'senaryo' })
    expect(ders(tek).some((m) => m.startsWith('q15:') && m.includes('2 kelime'))).toBe(true)
  })

  it('goethe oranı: 9/20 hata, istisnada geçer', () => {
    const dokuz = degistir(degistir(gecerli20(), 9, { kaynakTuru: 'uyarlama' }), 10, { kaynakTuru: 'uyarlama' })
    expect(icerir(ders(dokuz), 'goethe oranı')).toBe(true)
    expect(ders(dokuz, true)).toEqual([])
    expect(icerir(ders(gecerli20()), 'goethe oranı')).toBe(false)
  })

  const yazilduYap = (s: Question[], idxler: number[]) =>
    idxler.reduce((acc, i) => degistir(acc, i, { kaynakTuru: 'yazildi', kaynakCumle: undefined }), s)

  it('yazildi oranı: 4/20 hata; istisnada 8/20 geçer, 9/20 hata', () => {
    const dort = yazilduYap(gecerli20(), [18])
    expect(icerir(ders(dort), 'yazildi oranı')).toBe(true)
    expect(icerir(ders(dort, true), 'yazildi oranı')).toBe(false)
    const sekiz = yazilduYap(gecerli20(), [11, 12, 13, 14, 18])
    expect(icerir(ders(sekiz, true), 'yazildi oranı')).toBe(false)
    const dokuz = yazilduYap(gecerli20(), [11, 12, 13, 14, 18, 19])
    expect(icerir(ders(dokuz, true), 'yazildi oranı')).toBe(true)
  })

  it('bankada olmayan kaynakCumle → hata', () => {
    const h = ders(degistir(gecerli20(), 0, { kaynakCumle: 'Das steht nicht in der Bank.' }))
    expect(h.some((m) => m.startsWith('q00:') && m.includes('bankada'))).toBe(true)
  })

  it('aynı kaynakCumle 3 soruda → hata, 2 soruda geçer', () => {
    const uc = degistirTam(gecerli20(), 18, yazQ('q18', 'uyarlama', 'Ich heiße Anna', 'heiße', S.s0))
    expect(icerir(ders(uc), 'kaynakCumle tekrarı')).toBe(true)
    expect(icerir(ders(gecerli20()), 'kaynakCumle tekrarı')).toBe(false)
  })

  it('celdiriciNotlari tek sayıda backtick → hata', () => {
    const q = degistir(gecerli20(), 0, { celdiriciNotlari: ['', '`mir bana', 'Gerekçe'] })
    expect(ders(q).some((m) => m.startsWith('q00:') && m.includes('backtick'))).toBe(true)
  })
  it('celdiriciNotlari eksik veya boş → hata', () => {
    const eksik = degistir(gecerli20(), 0, { celdiriciNotlari: undefined })
    expect(ders(eksik).some((m) => m.startsWith('q00:') && m.includes('celdiriciNotlari'))).toBe(true)
    const bos = degistir(gecerli20(), 3, { celdiriciNotlari: ['', 'Gerekçe', ''] })
    expect(ders(bos).some((m) => m.startsWith('q03:') && m.includes('celdiriciNotlari'))).toBe(true)
  })

  it('kaynakTuru / bicim boşsa hata', () => {
    expect(ders(degistir(gecerli20(), 1, { kaynakTuru: undefined })).some((m) => m.startsWith('q01:') && m.includes('kaynakTuru'))).toBe(true)
    expect(ders(degistir(gecerli20(), 1, { bicim: undefined })).some((m) => m.startsWith('q01:') && m.includes('bicim'))).toBe(true)
  })

  it('tutarlılık hataları soru id sini taşır', () => {
    const h = ders(degistir(gecerli20(), 8, { okunacak: 'Etwas ganz anderes.' }))
    expect(h.some((m) => m.startsWith('q08:'))).toBe(true)
  })
})

describe('cevapKonumuHatalari', () => {
  const dort = (slotlar: number[]) =>
    slotlar.map((s, i) => konumla(metinQ(`k${i}`, 'goethe', S.s0, 'heiße'), s))

  it('4 çoktan seçmeli sorunun hepsi aynı konumdaysa hata ve konumu adlandırır', () => {
    const h = cevapKonumuHatalari(dort([0, 0, 0, 0]))
    expect(h).toHaveLength(1)
    expect(h[0]).toContain('konum 1')
    expect(h[0]).toContain('4/4')
  })

  it('doğru cevaplar dağılmışsa hata yok; yarı yarıya sınırda da geçer', () => {
    expect(cevapKonumuHatalari(dort([0, 1, 2, 0]))).toEqual([])
    expect(cevapKonumuHatalari(dort([0, 0, 1, 2]))).toEqual([])
  })

  it('4 çoktan seçmeliden azsa denetlenmez', () => {
    expect(cevapKonumuHatalari(dort([0, 0, 0]))).toEqual([])
  })

  it('dersKaliteHatalari 20 soruluk derste yığılmayı yakalar', () => {
    const yigin = gecerli20().map((q) => (q.tip === 'coktan-secmeli' ? konumla(q, 0) : q))
    expect(icerir(ders(yigin), 'konum')).toBe(true)
    expect(icerir(ders(gecerli20()), 'konum')).toBe(false)
  })
})

describe('bicimHatalari', () => {
  const sec = (q: Question, bicim: Question['bicim']) => ({ ...q, bicim }) as Question
  it('uyumlu eşleşmeler hatasız', () => {
    for (const q of gecerli20()) expect(bicimHatalari(q), q.id).toEqual([])
  })
  it('uyumsuzlar hata verir', () => {
    expect(bicimHatalari(sec(metinQ('a', 'goethe', S.s0, 'heiße'), 'diyalog'))).not.toEqual([])
    expect(bicimHatalari(sec(diyQ('a', 'goethe', S.s3, 'geht'), 'bosluk'))).not.toEqual([])
    expect(bicimHatalari(sec(yazQ('a', 'goethe', S.s2, 'wohnt'), 'siralama'))).not.toEqual([])
    expect(bicimHatalari(sec(dizQ('a', 'goethe', S.s5), 'bosluk'))).not.toEqual([])
    expect(bicimHatalari(sec(kelEsles('a'), 'bosluk'))).not.toEqual([])
    expect(bicimHatalari(sec(kelArtikel('a'), 'senaryo'))).not.toEqual([])
    expect(bicimHatalari(sec(kelCeviri('a'), 'senaryo'))).not.toEqual([])
  })
  it('senaryo coktan-secmeli metin veya diyalog içeremez', () => {
    expect(bicimHatalari(sec(metinQ('a', 'goethe', S.s0, 'heiße'), 'senaryo'))).not.toEqual([])
    expect(bicimHatalari(sec(diyQ('a', 'goethe', S.s3, 'geht'), 'senaryo'))).not.toEqual([])
  })
  it('senaryo cevabı en az 2 kelime (her tip için)', () => {
    expect(bicimHatalari(senCoktanQ('a', 'yazildi', 'Hunger'))).not.toEqual([])
    expect(bicimHatalari(senDinQ('a', 'yazildi', 'Hallo'))).not.toEqual([])
    expect(bicimHatalari(senCevQ('a', 'yazildi', 'Hallo'))).not.toEqual([])
    expect(bicimHatalari(senDYQ('a', 'yazildi', 'Hallo'))).not.toEqual([])
    expect(bicimHatalari(senCevQ('a', 'yazildi', 'Guten Tag'))).toEqual([])
  })
  it('kelime biçimi her tipi kabul eder', () => {
    expect(bicimHatalari(sec(dizQ('a', 'yazildi', S.s5), 'kelime'))).toEqual([])
  })
})

describe('goethe tutarlılığı (soruKaynakHatalari)', () => {
  const tut = (q: Question) => soruKaynakHatalari(q, BANKA)
  const uyumsuz = (q: Question) => tut(q).some((m) => m.includes('goethe tutarsız'))

  it('metin', () => {
    expect(tut(metinQ('a', 'goethe', S.s0, 'heiße'))).toEqual([])
    expect(uyumsuz(metinQ('a', 'goethe', S.s0, 'heiße', S.s1))).toBe(true)
  })
  it('bosluk-doldurma', () => {
    expect(tut(yazQ('a', 'goethe', S.s2, 'wohnt'))).toEqual([])
    expect(uyumsuz(yazQ('a', 'goethe', S.s2, 'wohnt', S.s1))).toBe(true)
  })
  it('diyalog', () => {
    expect(tut(diyQ('a', 'goethe', S.s3, 'geht'))).toEqual([])
    expect(uyumsuz(diyQ('a', 'goethe', S.s3, 'geht', S.s1))).toBe(true)
  })
  it('cumle-dizme', () => {
    expect(tut(dizQ('a', 'goethe', S.s5))).toEqual([])
    expect(uyumsuz(dizQ('a', 'goethe', S.s5, S.s6))).toBe(true)
  })
  it('cumle-dizme: kaynakla eşleşen yalnızca dogruSiralar[0] olabilir', () => {
    const dogru = dizQ('a', 'goethe', S.s5)
    const baska = dizQ('a', 'goethe', S.s6)
    if (dogru.tip !== 'cumle-dizme' || baska.tip !== 'cumle-dizme') throw new Error('fixture')
    const ikinci: Question = { ...dogru, dogruSiralar: [baska.dogruSiralar[0], dogru.dogruSiralar[0]] }
    expect(uyumsuz(ikinci)).toBe(true)
    const alternatifli: Question = { ...dogru, dogruSiralar: [dogru.dogruSiralar[0], baska.dogruSiralar[0]] }
    expect(uyumsuz(alternatifli)).toBe(false)
  })
  it('senaryo coktan-secmeli', () => {
    expect(tut(senCoktanQ('a', 'goethe', S.s7))).toEqual([])
    expect(uyumsuz(senCoktanQ('a', 'goethe', S.s7, S.s1))).toBe(true)
  })
  it('dinleme', () => {
    expect(tut(senDinQ('a', 'goethe', S.s8))).toEqual([])
    expect(uyumsuz(senDinQ('a', 'goethe', S.s8, S.s1))).toBe(true)
  })
  it('ceviri', () => {
    expect(tut(senCevQ('a', 'goethe', S.s9))).toEqual([])
    expect(uyumsuz(senCevQ('a', 'goethe', S.s9, S.s1))).toBe(true)
  })
  it('dogru-yanlis', () => {
    expect(tut(senDYQ('a', 'goethe', S.s10))).toEqual([])
    expect(uyumsuz(senDYQ('a', 'goethe', S.s10, S.s1))).toBe(true)
  })
  it('eslestirme, fiil-cekimi ve artikel goethe olamaz', () => {
    expect(tut(kelEsles('a', 'goethe', S.s1)).some((m) => m.includes('goethe'))).toBe(true)
    expect(tut(kelArtikel('a', 'goethe', S.s1)).some((m) => m.includes('goethe'))).toBe(true)
    const fiil: Question = {
      ...ortak('f', 'kelime', 'goethe', S.s1),
      tip: 'fiil-cekimi',
      fiil: 'kommen',
      satirlar: [{ zamir: 'ich', cevap: 'komme' }],
    }
    expect(tut(fiil).some((m) => m.includes('goethe'))).toBe(true)
  })
  it('noktalama, büyük-küçük harf ve kıvrık kesme farkı yok sayılır', () => {
    const b = new Set(['Hallo Inge! Wie geht’s?'])
    const q = yazQ('a', 'goethe', "hallo inge wie geht's", 'Inge', 'Hallo Inge! Wie geht’s?')
    expect(soruKaynakHatalari(q, b)).toEqual([])
  })
  it('diyalog: boşluklu satır kaynakCumle içinde değilse tutarsız (kaynak başka satırdaysa bile)', () => {
    const b = new Set(['Wie geht es dir?'])
    const q: Question = {
      ...ortak('d', 'diyalog', 'goethe', 'Wie geht es dir?'),
      tip: 'coktan-secmeli',
      diyalog: [
        { kim: 'A', metin: 'Wie geht es dir?' },
        { kim: 'B', metin: 'Ich ___ gut.' },
      ],
      secenekler: ['bin', 'habe', 'heiße'],
      dogru: 0,
      celdiriciNotlari: ['', 'haben değil', 'heißen değil'],
    }
    expect(soruKaynakHatalari(q, b).some((m) => m.includes('goethe tutarsız'))).toBe(true)
    expect(soruKaynakHatalari({ ...q, kaynakTuru: 'uyarlama' }, b)).toEqual([])
  })
  it('diyalog: kaynak sözcük sınırında aranır (kısmi sözcük eşleşmesi sayılmaz)', () => {
    const b = new Set(['Ich bin Anna.'])
    const q: Question = {
      ...ortak('d', 'diyalog', 'goethe', 'Ich bin Anna.'),
      tip: 'coktan-secmeli',
      diyalog: [
        { kim: 'A', metin: 'Hallo!' },
        { kim: 'B', metin: 'Ich bin ___' },
      ],
      secenekler: ['An', 'Anna', 'Ann'],
      dogru: 0,
      celdiriciNotlari: ['', 'Anna yazılışı', 'Ann yazılışı'],
    }
    expect(soruKaynakHatalari(q, b).some((m) => m.includes('goethe tutarsız'))).toBe(true)
    expect(soruKaynakHatalari({ ...q, dogru: 1, celdiriciNotlari: ['Eksik', '', 'Ann yazılışı'] }, b)).toEqual([])
  })
  it('diyalog: boşluklu satır yoksa goethe tutarsız', () => {
    const q: Question = {
      ...ortak('d', 'diyalog', 'goethe', S.s3),
      tip: 'coktan-secmeli',
      secenekler: ['geht', 'gehe', 'gehst'],
      dogru: 0,
      celdiriciNotlari: ['', 'Yanlış biçim', 'Yanlış kişi'],
      diyalog: [
        { kim: 'A', metin: 'Hallo!' },
        { kim: 'B', metin: S.s3 },
      ],
    }
    expect(uyumsuz(q)).toBe(true)
  })
  it('diyalog: banka cümlesi iki satıra bölünmüş olabilir', () => {
    const b = new Set(['Woher kommen Sie? – Aus Frankreich.'])
    const q: Question = {
      ...ortak('d', 'diyalog', 'goethe', 'Woher kommen Sie? – Aus Frankreich.'),
      tip: 'coktan-secmeli',
      diyalog: [
        { kim: 'A', metin: 'Woher ___ Sie?' },
        { kim: 'B', metin: 'Aus Frankreich.' },
      ],
      secenekler: ['kommen', 'komme', 'kommt'],
      dogru: 0,
      celdiriciNotlari: ['', 'Sie ile komme olmaz', 'Sie ile kommt olmaz'],
    }
    expect(soruKaynakHatalari(q, b)).toEqual([])
  })
  it('uyarlama içeriği tutarlılık kontrolüne girmez', () => {
    expect(tut(metinQ('a', 'uyarlama', 'Du heißt Anna.', 'heißt', S.s0))).toEqual([])
  })
})

describe('tooltipSizintilari', () => {
  it('metin sorusunda tooltip doğru şıkkı içeriyorsa hata', () => {
    const q = metinQ('t1', 'goethe', 'Ich heiße Anna.', 'heiße')
    // "Anna" kelimesinin tooltip'i doğru şıkkı (heiße) açık eder
    expect(tooltipSizintilari(q, { Anna: 'adı: heiße' })).toHaveLength(1)
    expect(tooltipSizintilari(q, { Anna: 'kız ismi' })).toEqual([])
  })
  it('glossKapali sorular atlanır', () => {
    const q = { ...metinQ('t2', 'goethe', 'Ich heiße Anna.', 'heiße'), glossKapali: true } as Question
    expect(tooltipSizintilari(q, { Anna: 'adı: heiße' })).toEqual([])
  })
  it('bosluk-doldurma ve eslestirme sağ sütun', () => {
    const y = yazQ('t3', 'goethe', 'Er wohnt in Hamburg.', 'wohnt')
    expect(tooltipSizintilari(y, { Hamburg: 'wohnt orada' })).toHaveLength(1)
    const e = kelEsles('t4')
    expect(tooltipSizintilari(e, { Haus: 'köpek ve kitap' })).toHaveLength(2)
    expect(tooltipSizintilari(e, { Haus: 'ev' })).toEqual([]) // 3 harften kısa cevaplar sayılmaz
  })
})

describe('haritaEksikleri / sinavEksikleri', () => {
  const dersKaydi = (ders: number, modulId: string) => ({
    ders,
    modulId,
    dosya: `ders-${ders}`,
    baslik: 'b',
    videoId: 'v',
    temalar: [],
    aramaKaliplari: [],
    gramer: [],
    istisna: false,
  })
  const moduller = [
    { id: 'modul-1', partlar: [{ ders: 1 }], sinav: null },
    { id: 'modul-2', partlar: [{ ders: 6 }, { ders: 7 }], sinav: null },
  ]
  it('haritada olmayan ders hata verir', () => {
    const harita = { dersler: [dersKaydi(6, 'modul-2')] }
    const h = haritaEksikleri(moduller, harita)
    expect(h).toHaveLength(1)
    expect(h[0]).toContain('7')
  })
  it('modul-1 atlanır; harita tamsa hata yok', () => {
    const harita = { dersler: [dersKaydi(6, 'modul-2'), dersKaydi(7, 'modul-2')] }
    expect(haritaEksikleri(moduller, harita)).toEqual([])
  })
  it('başka modülün aynı numaralı dersi sayılmaz', () => {
    const harita = { dersler: [dersKaydi(6, 'modul-2'), dersKaydi(7, 'modul-3')] }
    expect(haritaEksikleri(moduller, harita)).toHaveLength(1)
  })
  it('haritadaki tüm dersler partlardaysa sınav zorunlu', () => {
    const tam = { dersler: [dersKaydi(6, 'modul-2'), dersKaydi(7, 'modul-2')] }
    expect(sinavEksikleri(moduller, tam)).toHaveLength(1)
    const yarim = { dersler: [dersKaydi(6, 'modul-2'), dersKaydi(7, 'modul-2'), dersKaydi(8, 'modul-2')] }
    expect(sinavEksikleri(moduller, yarim)).toEqual([])
    const sinavli = [{ id: 'modul-2', partlar: [{ ders: 6 }, { ders: 7 }], sinav: {} }]
    expect(sinavEksikleri(sinavli, tam)).toEqual([])
  })
})

// ---------- Pilottan kalan negatif testler ----------
describe('soruKaynakHatalari: kaynakCumle ve çeldirici notu negatifleri', () => {
  const tut = (q: Question) => soruKaynakHatalari(q, BANKA)
  it('goethe veya uyarlamada boş / eksik kaynakCumle → hata', () => {
    expect(tut({ ...metinQ('a', 'goethe', S.s0, 'heiße'), kaynakCumle: '' } as Question).some((m) => m.includes('kaynakCumle boş'))).toBe(true)
    expect(tut({ ...metinQ('a', 'goethe', S.s0, 'heiße'), kaynakCumle: undefined } as Question).some((m) => m.includes('kaynakCumle boş'))).toBe(true)
    expect(tut({ ...yazQ('b', 'uyarlama', 'Du wohnst hier.', 'wohnst'), kaynakCumle: undefined } as Question).some((m) => m.includes('kaynakCumle boş'))).toBe(true)
  })
  it('bankada olmayan uyarlama kaynakCumle → hata', () => {
    const q = metinQ('a', 'uyarlama', 'Du heißt Anna.', 'heißt', 'Das steht nicht in der Bank.')
    expect(tut(q).some((m) => m.startsWith('a:') && m.includes('bankada yok'))).toBe(true)
  })
  it('yazildi için kaynakCumle gerekmez', () => {
    expect(tut({ ...yazQ('a', 'yazildi', 'Du wohnst hier.', 'wohnst'), kaynakCumle: undefined } as Question)).toEqual([])
  })
  it('celdiriciNotlari uzunluğu secenekler ile uyuşmuyorsa hata', () => {
    const q = { ...metinQ('a', 'goethe', S.s0, 'heiße'), celdiriciNotlari: ['', 'Tek not'] } as Question
    expect(tut(q).some((m) => m.includes('uzunluğu'))).toBe(true)
    const fazla = { ...metinQ('a', 'goethe', S.s0, 'heiße'), celdiriciNotlari: ['', 'a', 'b', 'c'] } as Question
    expect(tut(fazla).some((m) => m.includes('uzunluğu'))).toBe(true)
  })
  it('celdiriciNotlari doğru şıkta dolu → hata', () => {
    const q = { ...metinQ('a', 'goethe', S.s0, 'heiße'), celdiriciNotlari: ['Gerek yok', 'Yanlış biçim', 'Yanlış kelime'] } as Question
    expect(tut(q).some((m) => m.includes("doğru şıkta '' olmalı"))).toBe(true)
  })
  it('senaryo coktan-secmeli: celdiriciNotlari zorunlu', () => {
    expect(tut(senCoktanQ('a', 'goethe', S.s7))).toEqual([])
    const yok = { ...senCoktanQ('a', 'goethe', S.s7), celdiriciNotlari: undefined } as Question
    expect(tut(yok).some((m) => m.includes('celdiriciNotlari eksik'))).toBe(true)
    const kisa = { ...senCoktanQ('a', 'goethe', S.s7), celdiriciNotlari: ['', 'Tek'] } as Question
    expect(tut(kisa).some((m) => m.includes('uzunluğu'))).toBe(true)
    const bosNot = { ...senCoktanQ('a', 'goethe', S.s7), celdiriciNotlari: ['', 'Dolu', ' '] } as Question
    expect(tut(bosNot).some((m) => m.includes('celdiriciNotlari[2] boş'))).toBe(true)
  })
  it('kelime biçimli coktan-secmeli notsuz olabilir', () => {
    const q: Question = {
      ...ortak('k', 'kelime', 'yazildi'),
      tip: 'coktan-secmeli',
      secenekler: ['a', 'b', 'c'],
      dogru: 0,
    }
    expect(tut(q)).toEqual([])
  })
})

describe('istisnaGerekcesizler', () => {
  const kayit = (ders: number, istisna: boolean, gerekce?: string) => ({
    ders,
    modulId: 'modul-2',
    dosya: `ders-${ders}`,
    baslik: 'b',
    videoId: 'v',
    temalar: [],
    aramaKaliplari: [],
    gramer: [],
    istisna,
    istisnaGerekcesi: gerekce,
  })
  it('gerekçesiz veya boşluk gerekçeli istisna hata verir', () => {
    const h = istisnaGerekcesizler({ dersler: [kayit(6, true), kayit(7, true, '  '), kayit(8, true, 'Bankada az cümle var.'), kayit(9, false)] })
    expect(h).toEqual(['modul-2 ders 6', 'modul-2 ders 7'])
  })
  it('istisna olmayan ders gerekçe istemez', () => {
    expect(istisnaGerekcesizler({ dersler: [kayit(6, false)] })).toEqual([])
  })
})

describe('buyukHarfliParcaHatalari', () => {
  const dz = (parcalar: string[], siralar: string[][] = [parcalar]): Question => ({
    ...ortak('b1', 'siralama', 'yazildi'),
    tip: 'cumle-dizme',
    parcalar,
    dogruSiralar: siralar,
  })
  const KAPALI_LISTE = [
    'Ich', 'Du', 'Er', 'Es', 'Wir', 'Wer', 'Was', 'Wo', 'Woher', 'Wohin', 'Wann', 'Wie', 'Warum', 'Welche',
    'Im', 'In', 'Am', 'An', 'Auf', 'Mit', 'Aus', 'Von', 'Bei', 'Nach', 'Zu', 'Zum', 'Zur', 'Für',
    'Der', 'Die', 'Das', 'Den', 'Dem', 'Ein', 'Eine', 'Einen', 'Mein', 'Meine', 'Dein', 'Deine', 'Heute', 'Gestern',
  ]

  it('doğal yazımlı parçalar hatasız', () => {
    expect(buyukHarfliParcaHatalari(dz(['ich', 'im Februar', 'Kaffee', 'Sie', 'Ihr Beruf']))).toEqual([])
  })
  it('Ihr ve Sie listede değildir (elle incelenir)', () => {
    expect(buyukHarfliParcaHatalari(dz(['Ihr Beruf', 'ist']))).toEqual([])
    expect(buyukHarfliParcaHatalari(dz(['Sie', 'kommen']))).toEqual([])
  })
  it.each(KAPALI_LISTE)('listedeki büyük harfli ilk sözcük hata verir: %s', (w) => {
    const h = buyukHarfliParcaHatalari(dz([`${w} Haus`, 'ist']))
    expect(h).toHaveLength(1)
    expect(h[0]).toContain('b1:')
    expect(h[0]).toContain(`${w} Haus`)
  })
  it('yalnızca parçanın İLK sözcüğüne bakar; tek sözcük ve noktalama da yakalanır', () => {
    expect(buyukHarfliParcaHatalari(dz(['Ich', 'bin']))).toHaveLength(1)
    expect(buyukHarfliParcaHatalari(dz(['Wie?', 'geht']))).toHaveLength(1)
    expect(buyukHarfliParcaHatalari(dz(['aus Berlin', 'ich']))).toEqual([])
    expect(buyukHarfliParcaHatalari(dz(['Guten Tag', 'Berlin']))).toEqual([])
  })
  it('küçük harfli ilk sözcük listede olsa da hatasız', () => {
    expect(buyukHarfliParcaHatalari(dz(['wir', 'im Februar', 'heute', 'in Berlin']))).toEqual([])
  })
  it('Morgen: tam parça ve bir dogruSiralar ilk öğesi ise hata', () => {
    expect(buyukHarfliParcaHatalari(dz(['Morgen', 'komme', 'ich']))).toHaveLength(1)
    expect(buyukHarfliParcaHatalari(dz(['Morgen', 'komme', 'ich'], [['ich', 'komme', 'Morgen'], ['Morgen', 'komme', 'ich']]))).toHaveLength(1)
  })
  it('Morgen: hiçbir dizilimde başta değilse (isim) hata değil; Guten Morgen ve morgen hata değil', () => {
    expect(buyukHarfliParcaHatalari(dz(['Guten', 'Morgen']))).toEqual([])
    expect(buyukHarfliParcaHatalari(dz(['Morgen', 'ist', 'schön'], [['ist', 'Morgen', 'schön']]))).toEqual([])
    expect(buyukHarfliParcaHatalari(dz(['morgen', 'komme', 'ich']))).toEqual([])
  })
  it('cumle-dizme dışındaki tipler denetlenmez', () => {
    expect(buyukHarfliParcaHatalari(yazQ('y', 'yazildi', 'Ich bin hier.', 'bin'))).toEqual([])
  })
  it('soruKaynakHatalari ve dersKaliteHatalari bu kuralı çalıştırır', () => {
    const q = dz(['Ich', 'bin', 'Anna'])
    expect(soruKaynakHatalari(q, BANKA).some((m) => m.includes('Ich'))).toBe(true)
    const kotu = degistirTam(gecerli20(), 5, {
      ...dizQ('q05', 'goethe', S.s5),
      parcalar: ['Ich', 'bin', 'Student.'],
      dogruSiralar: [['Ich', 'bin', 'Student.']],
    } as Question)
    expect(ders(kotu).some((m) => m.includes('q05') && m.includes('Ich'))).toBe(true)
  })
})

describe('enAzUcSikHatalari', () => {
  const sik = (n: number): Question => ({
    ...ortak('s1', 'kelime', 'yazildi'),
    tip: 'coktan-secmeli',
    secenekler: Array.from({ length: n }, (_, i) => `opt${i}`),
    dogru: 0,
  })
  it('2 şık hata, 3 ve 4 şık geçer', () => {
    expect(enAzUcSikHatalari(sik(2))).toHaveLength(1)
    expect(enAzUcSikHatalari(sik(2))[0]).toContain('s1:')
    expect(enAzUcSikHatalari(sik(3))).toEqual([])
    expect(enAzUcSikHatalari(sik(4))).toEqual([])
  })
  it('coktan-secmeli olmayan tipler etkilenmez', () => {
    expect(enAzUcSikHatalari(kelCeviri('c'))).toEqual([])
  })
})

describe('dogruYanlisDengesi', () => {
  const dy = (dogru: boolean, i: number): Question => ({
    ...ortak(`dy${i}`, 'senaryo', 'yazildi'),
    tip: 'dogru-yanlis',
    ifade: `Ich bin hier ${i}.`,
    dogru,
  })
  const dizi = (dogruSayisi: number, toplam: number) => Array.from({ length: toplam }, (_, i) => dy(i < dogruSayisi, i))
  it('4 ve fazlası varsa doğru oranı %30–%70', () => {
    expect(dogruYanlisDengesi(dizi(4, 4))).toHaveLength(1)
    expect(dogruYanlisDengesi(dizi(0, 4))).toHaveLength(1)
    expect(dogruYanlisDengesi(dizi(2, 4))).toEqual([])
    expect(dogruYanlisDengesi(dizi(1, 4))).toHaveLength(1)
    expect(dogruYanlisDengesi(dizi(3, 4))).toHaveLength(1)
  })
  it('sınırlar dahildir: 3/10 ve 7/10 geçer, 2/10 ve 8/10 hata', () => {
    expect(dogruYanlisDengesi(dizi(3, 10))).toEqual([])
    expect(dogruYanlisDengesi(dizi(7, 10))).toEqual([])
    expect(dogruYanlisDengesi(dizi(2, 10))).toHaveLength(1)
    expect(dogruYanlisDengesi(dizi(8, 10))).toHaveLength(1)
  })
  it('4’ten azsa denetlenmez; dogru-yanlis olmayanlar sayılmaz', () => {
    expect(dogruYanlisDengesi(dizi(3, 3))).toEqual([])
    expect(dogruYanlisDengesi([...dizi(3, 3), kelCeviri('x'), kelArtikel('y')])).toEqual([])
  })
})

describe('ipucuTekrari', () => {
  const ip = (id: string, ipucu?: string): Question => ({ ...kelCeviri(id), ipucu })
  it('aynı ipucu iki kez → hata, iki id yi söyler', () => {
    const h = ipucuTekrari([ip('a', 'Fiile bak.'), ip('b', 'Başka'), ip('c', 'Fiile bak.')])
    expect(h).toHaveLength(1)
    expect(h[0]).toContain('a')
    expect(h[0]).toContain('c')
  })
  it('boşluk ve büyük-küçük harf farkı yok sayılır', () => {
    expect(ipucuTekrari([ip('a', 'Fiile bak.'), ip('b', '  fiile bak. ')])).toHaveLength(1)
  })
  it('farklı veya boş ipuçları geçer', () => {
    expect(ipucuTekrari([ip('a', 'Bir'), ip('b', 'İki'), ip('c'), ip('d')])).toEqual([])
  })
})

describe('sinavKopyaHatalari', () => {
  it('aynı kaynakCumle + tip → hata, iki id yi söyler', () => {
    const h = sinavKopyaHatalari([metinQ('s1', 'goethe', S.s0, 'Anna')], [metinQ('d1', 'goethe', S.s0, 'heiße')])
    expect(h.length).toBeGreaterThan(0)
    expect(h[0]).toContain('s1')
    expect(h[0]).toContain('d1')
  })
  it('aynı kaynakCumle farklı tip → geçer', () => {
    expect(sinavKopyaHatalari([senDinQ('s1', 'goethe', S.s0)], [metinQ('d1', 'goethe', S.s0, 'heiße')])).toEqual([])
  })
  it('kaynakCumle yoksa kaynakCumle ile eşleşmez', () => {
    const a = { ...kelCeviri('s1'), dogruCevaplar: ['Katze'] } as Question
    const b = { ...kelCeviri('d1'), dogruCevaplar: ['Hund'] } as Question
    expect(sinavKopyaHatalari([a], [b])).toEqual([])
  })
  it('aynı metin → hata (kaynakCumle farklı olsa da)', () => {
    const d = metinQ('d1', 'goethe', S.s0, 'heiße')
    const s = metinQ('s1', 'uyarlama', S.s0, 'heiße', S.s11)
    expect(sinavKopyaHatalari([s], [d]).length).toBeGreaterThan(0)
  })
  it('aynı metin yalnızca büyük-küçük harf / noktalama farkıyla → hata', () => {
    const d = yazQ('d1', 'yazildi', 'Ich wohne in Berlin.', 'wohne')
    const s = yazQ('s1', 'yazildi', 'ich wohne in berlin', 'wohne')
    expect(sinavKopyaHatalari([s], [d]).length).toBeGreaterThan(0)
  })
  it('aynı parcalar (sıra ve büyük-küçük harf fark etmez) → hata', () => {
    const d: Question = { ...ortak('d1', 'siralama', 'yazildi'), tip: 'cumle-dizme', parcalar: ['ich', 'bin', 'Anna'], dogruSiralar: [['ich', 'bin', 'Anna']] }
    const s: Question = { ...ortak('s1', 'siralama', 'yazildi'), tip: 'cumle-dizme', parcalar: ['Anna', 'ich', 'bin'], dogruSiralar: [['ich', 'bin', 'Anna']] }
    expect(sinavKopyaHatalari([s], [d]).length).toBeGreaterThan(0)
  })
  it('aynı ifade → hata', () => {
    const d = senDYQ('d1', 'goethe', S.s10)
    const s = { ...senDYQ('s1', 'yazildi', S.s10), kaynakCumle: undefined } as Question
    expect(sinavKopyaHatalari([s], [d]).length).toBeGreaterThan(0)
  })
  it('farklı sorular → hata yok', () => {
    const dersler = [metinQ('d1', 'goethe', S.s0, 'heiße'), senDYQ('d2', 'goethe', S.s10), dizQ('d3', 'goethe', S.s5)]
    const sinav = [metinQ('s1', 'goethe', S.s1, 'kommen'), senDYQ('s2', 'goethe', S.s11), dizQ('s3', 'goethe', S.s6)]
    expect(sinavKopyaHatalari(sinav, dersler)).toEqual([])
  })
})

describe('modulKaliteHatalari (modül düzeyi kuralların bağlantısı)', () => {
  const iki = (id: string): Question => ({
    ...ortak(id, 'kelime', 'yazildi'),
    tip: 'coktan-secmeli',
    secenekler: ['a', 'b'],
    dogru: 0,
    ipucu: `ipucu ${id}`,
  })
  const dyler = (dogruSayisi: number, n: number, onek = 'dy'): Question[] =>
    Array.from({ length: n }, (_, i) => ({
      ...ortak(`${onek}${i}`, 'senaryo', 'yazildi'),
      tip: 'dogru-yanlis' as const,
      ifade: `Ich bin ${onek} ${i}.`,
      dogru: i < dogruSayisi,
      ipucu: `${onek} ipucu ${i}`,
    }))
  const girdi = (modulNo: number, dersSorulari: Question[], ekSorular: Question[] = []) => ({ modulNo, dersSorulari, ekSorular })

  it('Modül 2 iki şıklı soruya izin verir, Modül 3 ve sonrası vermez', () => {
    expect(modulKaliteHatalari(girdi(2, [iki('a')]))).toEqual([])
    expect(modulKaliteHatalari(girdi(3, [iki('a')])).length).toBeGreaterThan(0)
    expect(modulKaliteHatalari(girdi(8, [], [iki('s')])).length).toBeGreaterThan(0)
  })
  it('doğru-yanlış dengesini tüm modül sorularında (ders + sınav) arar', () => {
    expect(modulKaliteHatalari(girdi(2, dyler(4, 4))).length).toBeGreaterThan(0)
    expect(modulKaliteHatalari(girdi(2, dyler(2, 4)))).toEqual([])
    // ders ve sınav ayrı ayrı 2'şer soru (4'ten az), birlikte 4/4 doğru → hata
    expect(modulKaliteHatalari(girdi(2, dyler(2, 2, 'a'), dyler(2, 2, 'e'))).length).toBeGreaterThan(0)
    expect(modulKaliteHatalari(girdi(2, dyler(1, 2, 'a'), dyler(1, 2, 'e')))).toEqual([])
  })
  it('modülde tekrarlanan ipucunu yakalar (dersler arası ve sınavla)', () => {
    const a = { ...kelCeviri('a'), ipucu: 'Aynı' } as Question
    const b = { ...kelCeviri('b'), ipucu: 'Aynı' } as Question
    expect(modulKaliteHatalari(girdi(2, [a], [b])).length).toBeGreaterThan(0)
    expect(modulKaliteHatalari(girdi(2, [a, b])).length).toBeGreaterThan(0)
  })
  it('sınavın ders sorusunu kopyalamasını yakalar', () => {
    const d = metinQ('d1', 'goethe', S.s0, 'heiße')
    const s = metinQ('s1', 'goethe', S.s0, 'heiße')
    expect(modulKaliteHatalari(girdi(2, [d], [s])).length).toBeGreaterThan(0)
  })
  it('temiz modül hatasız', () => {
    const d = { ...metinQ('d1', 'goethe', S.s0, 'heiße'), ipucu: 'bir' } as Question
    const s = { ...metinQ('s1', 'goethe', S.s1, 'kommen'), ipucu: 'iki' } as Question
    expect(modulKaliteHatalari(girdi(3, [d], [s]))).toEqual([])
  })
})

describe('sozlukCakismalari', () => {
  it('büyük-küçük harf farkıyla farklı anlam taşıyan anahtarları bulur', () => {
    const h = sozlukCakismalari({ ihr: 'siz (samimi)', Ihr: 'sizin (resmî)', gut: 'iyi' })
    expect(h).toHaveLength(1)
    expect(h[0]).toContain('ihr')
  })
  it('aynı anlamlı veya çakışmayan anahtarlara hata vermez', () => {
    expect(sozlukCakismalari({ sie: 'o; siz', Sie: 'o; siz', gut: 'iyi' })).toEqual([])
  })
})

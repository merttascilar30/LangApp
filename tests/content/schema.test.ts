import { describe, expect, it } from 'vitest'
import { partSchema, questionSchema, sinavSchema, sozlukSchema } from '../../src/content/schema'

const base = { id: 'q1', soru: 'Soru?', aciklama: 'Açıklama' }

const samples: Record<string, unknown> = {
  'coktan-secmeli': { ...base, tip: 'coktan-secmeli', secenekler: ['a', 'b'], dogru: 0 },
  'bosluk-doldurma': { ...base, tip: 'bosluk-doldurma', metin: 'Ich ___ Anna.', dogruCevaplar: ['bin'] },
  artikel: { ...base, tip: 'artikel', isim: 'Tisch', dogru: 'der' },
  'fiil-cekimi': {
    ...base,
    tip: 'fiil-cekimi',
    fiil: 'sein',
    satirlar: [{ zamir: 'ich', cevap: 'bin' }, { zamir: 'du', cevap: 'bist', verilen: true }],
  },
  'cumle-dizme': {
    ...base,
    tip: 'cumle-dizme',
    parcalar: ['Ich', 'bin', 'Anna'],
    dogruSiralar: [['Ich', 'bin', 'Anna']],
  },
  eslestirme: {
    ...base,
    tip: 'eslestirme',
    ciftler: [1, 2, 3, 4].map((i) => ({ sol: `s${i}`, sag: `r${i}` })),
  },
  'dogru-yanlis': { ...base, tip: 'dogru-yanlis', ifade: 'Der Tisch', dogru: true },
  dinleme: { ...base, tip: 'dinleme', okunacak: 'Hallo', mod: 'yaz', dogruCevaplar: ['Hallo'] },
  ceviri: { ...base, tip: 'ceviri', kaynak: 'Merhaba', dogruCevaplar: ['Hallo'] },
}

describe('questionSchema', () => {
  for (const [tip, sample] of Object.entries(samples)) {
    it(`accepts ${tip}`, () => {
      expect(() => questionSchema.parse(sample)).not.toThrow()
    })
  }

  it('rejects empty aciklama', () => {
    expect(() => questionSchema.parse({ ...(samples['artikel'] as object), aciklama: '' })).toThrow()
  })

  it('rejects unknown tip', () => {
    expect(() => questionSchema.parse({ ...base, tip: 'bilinmeyen' })).toThrow()
  })
})

describe('Faz 2 alanları', () => {
  const cs = samples['coktan-secmeli'] as object
  it('accepts bicim / kaynakTuru / kaynakCumle', () => {
    const r = questionSchema.parse({ ...cs, bicim: 'diyalog', kaynakTuru: 'goethe', kaynakCumle: 'Wie heißt du?' })
    expect(r.bicim).toBe('diyalog')
    expect(r.kaynakTuru).toBe('goethe')
    expect(r.kaynakCumle).toBe('Wie heißt du?')
  })
  it('rejects bad bicim, kaynakTuru and empty kaynakCumle', () => {
    expect(() => questionSchema.parse({ ...cs, bicim: 'x' })).toThrow()
    expect(() => questionSchema.parse({ ...cs, kaynakTuru: 'x' })).toThrow()
    expect(() => questionSchema.parse({ ...cs, kaynakCumle: '' })).toThrow()
  })
  it('accepts metin / diyalog / celdiriciNotlari on coktan-secmeli', () => {
    const r = questionSchema.parse({
      ...cs,
      metin: 'Ich ___ Anna.',
      diyalog: [{ kim: 'A', metin: 'Hallo' }, { kim: 'B', metin: '___' }],
      celdiriciNotlari: ['', 'not'],
    })
    expect(r.tip === 'coktan-secmeli' && r.celdiriciNotlari).toEqual(['', 'not'])
  })
  it('rejects diyalog with fewer than 2 lines', () => {
    expect(() => questionSchema.parse({ ...cs, diyalog: [{ kim: 'A', metin: 'x' }] })).toThrow()
  })
  it('keeps ceviri.kaynak intact', () => {
    const r = questionSchema.parse({ ...(samples['ceviri'] as object), kaynakTuru: 'yazildi' })
    expect(r.tip === 'ceviri' && r.kaynak).toBe('Merhaba')
  })
})

describe('sinavSchema', () => {
  it('applies defaults', () => {
    expect(sinavSchema.parse({ ekSorular: [] })).toEqual({ soruSayisi: 25, gecmeNotu: 80, ekSorular: [] })
  })
})

describe('ipucu / sozlukEk / trickler / sozluk', () => {
  it('accepts ipucu and sozlukEk on a question', () => {
    const r = questionSchema.parse({ ...(samples['artikel'] as object), ipucu: 'ipucu', sozlukEk: { geht: 'gidiyor' } })
    expect(r.ipucu).toBe('ipucu')
    expect(r.sozlukEk).toEqual({ geht: 'gidiyor' })
  })

  it('rejects empty ipucu', () => {
    expect(() => questionSchema.parse({ ...(samples['artikel'] as object), ipucu: '' })).toThrow()
  })

  it('accepts part with trickler', () => {
    const part = {
      id: 'p',
      ders: 1,
      baslik: 'b',
      videoId: 'v',
      ozet: ['a', 'b', 'c'],
      kelimeler: [],
      sorular: [],
      trickler: [{ baslik: 'T', metin: 'M' }],
    }
    expect(partSchema.parse(part).trickler).toEqual([{ baslik: 'T', metin: 'M' }])
    expect(() => partSchema.parse({ ...part, trickler: [{ baslik: '', metin: 'M' }] })).toThrow()
  })

  it('sozlukSchema', () => {
    expect(sozlukSchema.parse({ girdiler: { a: 'b' } })).toEqual({ girdiler: { a: 'b' } })
    expect(() => sozlukSchema.parse({ girdiler: 5 })).toThrow()
  })
})

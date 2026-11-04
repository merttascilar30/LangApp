import { describe, expect, it } from 'vitest'
import { questionSchema, sinavSchema } from '../../src/content/schema'

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

describe('sinavSchema', () => {
  it('applies defaults', () => {
    expect(sinavSchema.parse({ ekSorular: [] })).toEqual({ soruSayisi: 25, gecmeNotu: 80, ekSorular: [] })
  })
})

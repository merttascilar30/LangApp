import { describe, expect, it } from 'vitest'
import { loadContent } from '../../src/content/loader'

function q(id: string) {
  return {
    id,
    tip: 'dogru-yanlis',
    soru: 'Doğru mu?',
    aciklama: 'açıklama',
    ifade: 'Ich bin Anna.',
    dogru: true,
  }
}

function part(id: string, ders: number, n = 15, prefix = id) {
  return {
    id,
    ders,
    baslik: `Ders ${ders}`,
    videoId: 'abc',
    ozet: ['a', 'b', 'c'],
    kelimeler: [],
    sorular: Array.from({ length: n }, (_, i) => q(`${prefix}-q${i}`)),
  }
}

const index = {
  moduller: [
    { id: 'modul-2', sira: 2, baslik: 'İkinci', partlar: ['ders-01'] },
    { id: 'modul-1', sira: 1, baslik: 'Birinci', partlar: ['ders-01', 'ders-02'] },
  ],
}

function base(): Record<string, unknown> {
  return {
    '/content/modules.json': index,
    '/content/modul-1/ders-01.json': part('m1-d1', 1),
    '/content/modul-1/ders-02.json': part('m1-d2', 2),
    '/content/modul-1/sinav.json': { ekSorular: [q('ek-1')] },
    '/content/modul-2/ders-01.json': part('m2-d1', 1),
  }
}

describe('loadContent', () => {
  it('yükler, modülleri sıralar, soruIndex doldurur', () => {
    const r = loadContent(base())
    expect(r.hatalar).toEqual([])
    expect(r.moduller.map((m) => m.id)).toEqual(['modul-1', 'modul-2'])
    expect(r.moduller[0].partlar.map((p) => p.dosya)).toEqual([
      '/content/modul-1/ders-01.json',
      '/content/modul-1/ders-02.json',
    ])
    expect(r.moduller[0].sinav?.ekSorular).toHaveLength(1)
    expect(r.moduller[1].sinav).toBeNull()
    expect(r.soruIndex.size).toBe(15 * 3 + 1)
    expect(r.soruIndex.get('m1-d1-q0')).toMatchObject({ modulId: 'modul-1', partId: 'm1-d1' })
    expect(r.soruIndex.get('ek-1')).toMatchObject({ modulId: 'modul-1', partId: null })
  })

  it('şemaya uymayan partı atlar', () => {
    const f = base()
    f['/content/modul-1/ders-02.json'] = { id: 'x' }
    const r = loadContent(f)
    expect(r.moduller[0].partlar).toHaveLength(1)
    expect(r.hatalar).toHaveLength(1)
    expect(r.hatalar[0].dosya).toBe('/content/modul-1/ders-02.json')
    expect(r.hatalar[0].mesaj).toContain('Şema hatası')
  })

  it('eksik dosya için bulunamadı hatası verir', () => {
    const f = base()
    delete f['/content/modul-1/ders-02.json']
    const r = loadContent(f)
    expect(r.hatalar).toHaveLength(1)
    expect(r.hatalar[0].dosya).toBe('/content/modul-1/ders-02.json')
    expect(r.hatalar[0].mesaj).toContain('bulunamadı')
    expect(r.moduller[0].partlar).toHaveLength(1)
  })

  it('tüm partları eksik modül yine de listelenir', () => {
    const f = base()
    delete f['/content/modul-2/ders-01.json']
    const r = loadContent(f)
    expect(r.moduller[1].partlar).toEqual([])
  })

  it('modules.json yok veya bozuksa tek hata', () => {
    expect(loadContent({})).toMatchObject({ moduller: [], hatalar: [{ dosya: '/content/modules.json' }] })
    const r = loadContent({ '/content/modules.json': { moduller: 5 } })
    expect(r.moduller).toEqual([])
    expect(r.hatalar).toHaveLength(1)
  })

  it('kural hatasında part yine yüklenir', () => {
    const f = base()
    f['/content/modul-1/ders-02.json'] = part('m1-d2', 2, 14)
    const r = loadContent(f)
    expect(r.moduller[0].partlar).toHaveLength(2)
    expect(r.hatalar).toHaveLength(1)
    expect(r.hatalar[0].dosya).toBe('/content/modul-1/ders-02.json')
  })

  it('sinav ekSorular kural hatası listelenir', () => {
    const f = base()
    f['/content/modul-1/sinav.json'] = {
      ekSorular: [{ ...q('ek-1'), tip: 'coktan-secmeli', secenekler: ['a', 'b'], dogru: 5 }],
    }
    const r = loadContent(f)
    expect(r.hatalar).toHaveLength(1)
    expect(r.hatalar[0].soruId).toBe('ek-1')
  })

  it('farklı partlarda aynı soru id hatası, iki part da yüklenir', () => {
    const f = base()
    f['/content/modul-1/ders-02.json'] = part('m1-d2', 2, 15, 'm1-d1')
    const r = loadContent(f)
    expect(r.moduller[0].partlar).toHaveLength(2)
    expect(r.hatalar.length).toBeGreaterThan(0)
    expect(r.hatalar.every((h) => h.mesaj.includes('tekrar'))).toBe(true)
    expect(r.soruIndex.get('m1-d1-q0')?.partId).toBe('m1-d1')
  })

  describe('sozluk', () => {
    function withKelime(): Record<string, unknown> {
      const f = base()
      f['/content/modul-1/ders-01.json'] = {
        ...part('m1-d1', 1),
        kelimeler: [{ de: 'der Tisch', tr: 'masa' }],
      }
      return f
    }

    it('kelimeler + sozluk.json birleşir, sozluk.json üzerine yazar', () => {
      const f = withKelime()
      f['/content/modul-1/sozluk.json'] = { girdiler: { 'der Tisch': 'masa (sözlük)', geht: 'gidiyor' } }
      const r = loadContent(f)
      expect(r.hatalar).toEqual([])
      expect(r.moduller[0].sozluk).toEqual({ 'der Tisch': 'masa (sözlük)', geht: 'gidiyor' })
    })

    it('sozluk.json yoksa sadece kelimeler', () => {
      const r = loadContent(withKelime())
      expect(r.hatalar).toEqual([])
      expect(r.moduller[0].sozluk).toEqual({ 'der Tisch': 'masa' })
      expect(r.moduller[1].sozluk).toEqual({})
    })

    it('bozuk sozluk.json şema hatası verir, sözlük kelimelerden oluşur', () => {
      const f = withKelime()
      f['/content/modul-1/sozluk.json'] = { girdiler: 5 }
      const r = loadContent(f)
      expect(r.hatalar).toHaveLength(1)
      expect(r.hatalar[0].dosya).toBe('/content/modul-1/sozluk.json')
      expect(r.hatalar[0].mesaj).toContain('Şema hatası')
      expect(r.moduller[0].sozluk).toEqual({ 'der Tisch': 'masa' })
    })
  })
})

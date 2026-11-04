import { describe, expect, it } from 'vitest'
import { checkPartRules, checkQuestionRules, checkUniqueIds } from '../../src/content/rules'
import type { Part, Question } from '../../src/content/schema'

const base = { id: 'q1', soru: 'Soru?', aciklama: 'Açıklama' }

describe('checkQuestionRules', () => {
  it('coktan-secmeli: dogru out of range', () => {
    const q: Question = { ...base, tip: 'coktan-secmeli', secenekler: ['a', 'b', 'c'], dogru: 3 }
    const errs = checkQuestionRules('d.json', q)
    expect(errs).toHaveLength(1)
    expect(errs[0].soruId).toBe('q1')
    expect(errs[0].mesaj).toContain('dogru')
  })

  it.each(['Ich bin Anna.', 'Ich ___ ___ Anna.'])('bosluk-doldurma placeholder count: %s', (metin) => {
    const q: Question = { ...base, tip: 'bosluk-doldurma', metin, dogruCevaplar: ['bin'] }
    const errs = checkQuestionRules('d.json', q)
    expect(errs).toHaveLength(1)
    expect(errs[0].soruId).toBe('q1')
    expect(errs[0].mesaj).toContain('metin')
  })

  it('dinleme sec without secenekler', () => {
    const q: Question = { ...base, tip: 'dinleme', okunacak: 'Hallo', mod: 'sec', dogruCevaplar: ['Hallo'] }
    const errs = checkQuestionRules('d.json', q)
    expect(errs).toHaveLength(1)
    expect(errs[0].soruId).toBe('q1')
    expect(errs[0].mesaj).toContain('secenekler')
  })

  it('dinleme sec with answer not in secenekler', () => {
    const q: Question = {
      ...base, tip: 'dinleme', okunacak: 'Hallo', mod: 'sec', secenekler: ['Tschüss', 'Danke'], dogruCevaplar: ['Hallo'],
    }
    const errs = checkQuestionRules('d.json', q)
    expect(errs).toHaveLength(1)
    expect(errs[0].soruId).toBe('q1')
    expect(errs[0].mesaj).toContain('dogruCevaplar')
  })

  it('cumle-dizme non-permutation', () => {
    const q: Question = {
      ...base, tip: 'cumle-dizme', parcalar: ['Ich', 'bin', 'Anna'],
      dogruSiralar: [['Ich', 'bin', 'Anna'], ['Ich', 'bin', 'Hans']],
    }
    const errs = checkQuestionRules('d.json', q)
    expect(errs).toHaveLength(1)
    expect(errs[0].soruId).toBe('q1')
    expect(errs[0].mesaj).toContain('dogruSiralar')
  })

  it('valid question gives no errors', () => {
    const q: Question = { ...base, tip: 'dogru-yanlis', ifade: 'x', dogru: true }
    expect(checkQuestionRules('d.json', q)).toEqual([])
  })
})

const mkPart = (n: number): Part => ({
  id: 'p1', ders: 1, baslik: 'B', videoId: 'v', ozet: ['a', 'b', 'c'], kelimeler: [],
  sorular: Array.from({ length: n }, (_, i) => ({
    ...base, id: `q${i}`, tip: 'dogru-yanlis' as const, ifade: 'x', dogru: true,
  })),
})

describe('checkPartRules', () => {
  it('14 questions -> en az 15 error', () => {
    const errs = checkPartRules('d.json', mkPart(14))
    expect(errs).toHaveLength(1)
    expect(errs[0].mesaj).toContain('en az 15')
  })
  it('15 questions -> ok', () => {
    expect(checkPartRules('d.json', mkPart(15))).toEqual([])
  })
})

describe('checkUniqueIds', () => {
  it('duplicate id is attributed to second file', () => {
    const q: Question = { ...base, tip: 'dogru-yanlis', ifade: 'x', dogru: true }
    const errs = checkUniqueIds([{ dosya: 'a.json', q }, { dosya: 'b.json', q }])
    expect(errs).toHaveLength(1)
    expect(errs[0].dosya).toBe('b.json')
    expect(errs[0].soruId).toBe('q1')
  })
})

import { describe, expect, it } from 'vitest'
import { correctAnswerText, gradeQuestion, scorePercent } from '../../src/domain/grading'
import type { Question } from '../../src/content/schema'

const base = { id: 'q', soru: 's', aciklama: 'a' }

const cs: Question = { ...base, tip: 'coktan-secmeli', secenekler: ['a', 'b', 'c'], dogru: 1 }
const bd: Question = { ...base, tip: 'bosluk-doldurma', metin: 'Ich ___ Anna', dogruCevaplar: ['bin'] }
const ar: Question = { ...base, tip: 'artikel', isim: 'Tisch', dogru: 'der' }
const fc: Question = {
  ...base,
  tip: 'fiil-cekimi',
  fiil: 'sein',
  satirlar: [
    { zamir: 'ich', cevap: 'bin', verilen: true },
    { zamir: 'du', cevap: 'bist' },
    { zamir: 'er', cevap: 'ist' },
  ],
}
const cd: Question = {
  ...base,
  tip: 'cumle-dizme',
  parcalar: ['bin', 'Ich', 'Anna'],
  dogruSiralar: [['Ich', 'bin', 'Anna'], ['Anna', 'bin', 'Ich']],
}
const es: Question = {
  ...base,
  tip: 'eslestirme',
  ciftler: [
    { sol: 'Hallo', sag: 'Merhaba' },
    { sol: 'Danke', sag: 'Teşekkürler' },
    { sol: 'Bitte', sag: 'Lütfen' },
    { sol: 'Tschüss', sag: 'Hoşça kal' },
  ],
}
const dy: Question = { ...base, tip: 'dogru-yanlis', ifade: 'x', dogru: true }
const dnSec: Question = {
  ...base,
  tip: 'dinleme',
  okunacak: 'drei',
  mod: 'sec',
  secenekler: ['zwei', 'drei'],
  dogruCevaplar: ['drei'],
}
const dnYaz: Question = {
  ...base,
  tip: 'dinleme',
  okunacak: '23',
  mod: 'yaz',
  dogruCevaplar: ['dreiundzwanzig', '23'],
}
const cv: Question = { ...base, tip: 'ceviri', kaynak: 'Merhaba', dogruCevaplar: ['Hallo', 'Guten Tag'] }

describe('gradeQuestion', () => {
  it('null and type mismatch are false', () => {
    expect(gradeQuestion(cs, null)).toBe(false)
    expect(gradeQuestion(cs, { tip: 'artikel', secilen: 'der' })).toBe(false)
  })
  it('coktan-secmeli', () => {
    expect(gradeQuestion(cs, { tip: 'coktan-secmeli', secilen: 1 })).toBe(true)
    expect(gradeQuestion(cs, { tip: 'coktan-secmeli', secilen: 0 })).toBe(false)
  })
  it('bosluk-doldurma', () => {
    expect(gradeQuestion(bd, { tip: 'bosluk-doldurma', metin: ' BIN ' })).toBe(true)
    expect(gradeQuestion(bd, { tip: 'bosluk-doldurma', metin: 'bist' })).toBe(false)
  })
  it('artikel', () => {
    expect(gradeQuestion(ar, { tip: 'artikel', secilen: 'der' })).toBe(true)
    expect(gradeQuestion(ar, { tip: 'artikel', secilen: 'die' })).toBe(false)
  })
  it('fiil-cekimi', () => {
    expect(gradeQuestion(fc, { tip: 'fiil-cekimi', hucreler: ['', 'bist', 'ist'] })).toBe(true)
    expect(gradeQuestion(fc, { tip: 'fiil-cekimi', hucreler: ['', 'bist', ''] })).toBe(false)
    expect(gradeQuestion(fc, { tip: 'fiil-cekimi', hucreler: ['bin', 'bist', 'bin'] })).toBe(false)
  })
  it('cumle-dizme', () => {
    expect(gradeQuestion(cd, { tip: 'cumle-dizme', sira: ['Ich', 'bin', 'Anna'] })).toBe(true)
    expect(gradeQuestion(cd, { tip: 'cumle-dizme', sira: ['Anna', 'bin', 'Ich'] })).toBe(true)
    expect(gradeQuestion(cd, { tip: 'cumle-dizme', sira: ['bin', 'Ich', 'Anna'] })).toBe(false)
  })
  it('eslestirme', () => {
    const ok = Object.fromEntries(es.ciftler.map((c) => [c.sol, c.sag]))
    expect(gradeQuestion(es, { tip: 'eslestirme', eslesme: ok })).toBe(true)
    expect(gradeQuestion(es, { tip: 'eslestirme', eslesme: { ...ok, Bitte: 'Merhaba' } })).toBe(false)
  })
  it('dogru-yanlis', () => {
    expect(gradeQuestion(dy, { tip: 'dogru-yanlis', secilen: true })).toBe(true)
    expect(gradeQuestion(dy, { tip: 'dogru-yanlis', secilen: false })).toBe(false)
  })
  it('dinleme sec and yaz', () => {
    expect(gradeQuestion(dnSec, { tip: 'dinleme', metin: 'drei' })).toBe(true)
    expect(gradeQuestion(dnSec, { tip: 'dinleme', metin: 'zwei' })).toBe(false)
    expect(gradeQuestion(dnYaz, { tip: 'dinleme', metin: 'dreiundzwanzig' })).toBe(true)
    expect(gradeQuestion(dnYaz, { tip: 'dinleme', metin: '23' })).toBe(true)
    expect(gradeQuestion(dnYaz, { tip: 'dinleme', metin: '24' })).toBe(false)
  })
  it('ceviri', () => {
    expect(gradeQuestion(cv, { tip: 'ceviri', metin: 'guten tag!' })).toBe(true)
    expect(gradeQuestion(cv, { tip: 'ceviri', metin: 'Tschüss' })).toBe(false)
  })
})

describe('correctAnswerText', () => {
  it('formats each type', () => {
    expect(correctAnswerText(cs)).toBe('b')
    expect(correctAnswerText(bd)).toBe('bin')
    expect(correctAnswerText(ar)).toBe('der Tisch')
    expect(correctAnswerText(fc)).toBe('ich bin, du bist, er ist')
    expect(correctAnswerText(cd)).toBe('Ich bin Anna')
    expect(correctAnswerText(es)).toBe('Hallo = Merhaba; Danke = Teşekkürler; Bitte = Lütfen; Tschüss = Hoşça kal')
    expect(correctAnswerText(dy)).toBe('Doğru')
    expect(correctAnswerText({ ...dy, dogru: false })).toBe('Yanlış')
    expect(correctAnswerText(dnSec)).toBe('drei')
    expect(correctAnswerText(dnYaz)).toBe('dreiundzwanzig')
    expect(correctAnswerText(cv)).toBe('Hallo')
  })
})

describe('scorePercent', () => {
  it('computes raw ratio', () => {
    expect(scorePercent(7, 10)).toBe(70)
    expect(scorePercent(2, 3)).toBeCloseTo(66.6667, 3)
    expect(scorePercent(0, 0)).toBe(0)
  })
})

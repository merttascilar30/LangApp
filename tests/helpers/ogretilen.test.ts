import { describe, expect, it } from 'vitest'
import { gosterilmemisler, gosterimMetni, sozcukler } from './ogretilen'

const onceki = {
  ozet: ['Das Kind geliyor.'],
  kelimeler: [{ de: 'die Schwester', tr: 'kız kardeş' }],
  sorular: [{ tip: 'coktan-secmeli', soru: 'Seç', secenekler: ['der', 'die'], dogru: 0 }],
}
const bu = {
  ozet: ['Çoğul: die Kinder.'],
  trickler: [{ baslik: 'Not', metin: 'das Haus' }],
  kelimeler: [{ de: 'der Tisch', tr: 'masa' }],
}

describe('gosterilmemisler', () => {
  const bilinen = new Set([...gosterimMetni(onceki, true), ...gosterimMetni(bu, false)].flatMap(sozcukler))

  it('yalnızca çoğulu görülmemiş sözcüğü cevapta işaretler', () => {
    const q = { id: 'q1', tip: 'coktan-secmeli', soru: 'Seç', secenekler: ['die Schwestern', 'die Kinder'], dogru: 0 }
    expect(gosterilmemisler(q, bilinen)).toEqual({ cevap: ['schwestern'], metin: [] })
  })

  it('bu dersin kelimeler alanını gösterilmiş saymaz, önceki dersin sorularını sayar', () => {
    const q = { id: 'q2', tip: 'bosluk-doldurma', soru: 'Yaz', metin: 'der ___', dogruCevaplar: ['Tisch'] }
    expect(gosterilmemisler(q, bilinen)).toEqual({ cevap: ['tisch'], metin: [] })
  })

  it('metin sözcüklerini cevaptan ayrı verir, soru alanındaki Türkçeyi saymaz', () => {
    const q = { id: 'q3', tip: 'dogru-yanlis', soru: 'Bambaşka Türkçe yönerge', ifade: 'Das Auto', dogru: true }
    expect(gosterilmemisler(q, bilinen)).toEqual({ cevap: [], metin: ['auto'] })
  })

  it('cümle dizme ve diyalog alanlarını okur', () => {
    const dizme = { id: 'q4', tip: 'cumle-dizme', soru: 'Diz', parcalar: ['das Haus', 'kommt'], dogruSiralar: [['das Haus', 'kommt']] }
    expect(gosterilmemisler(dizme, bilinen).cevap).toEqual(['kommt'])
    const diyalog = { id: 'q5', tip: 'coktan-secmeli', soru: 'Seç', secenekler: ['der', 'die'], dogru: 0, diyalog: [{ kim: 'A', metin: 'Hallo' }, { kim: 'B', metin: 'das Kind' }] }
    expect(gosterilmemisler(diyalog, bilinen).metin).toEqual(['hallo'])
  })
})

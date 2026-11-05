import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { CumleDizme } from '../../src/questions/CumleDizme'
import { GlossContext } from '../../src/questions/Gloss'
import { correctAnswerText, gradeQuestion, ilkBuyuk } from '../../src/domain/grading'
import type { CumleDizmeQuestion } from '../../src/content/schema'

const base = { aciklama: 'a', soru: 'Soru metni' }
const subat: CumleDizmeQuestion = {
  ...base,
  id: 'k1',
  tip: 'cumle-dizme',
  parcalar: ['im Februar', 'habe', 'ich', 'Geburtstag'],
  dogruSiralar: [
    ['im Februar', 'habe', 'ich', 'Geburtstag'],
    ['ich', 'habe', 'im Februar', 'Geburtstag'],
  ],
}
const kaffee: CumleDizmeQuestion = {
  ...base,
  id: 'k2',
  tip: 'cumle-dizme',
  parcalar: ['Kaffee', 'trinke', 'ich'],
  dogruSiralar: [['Kaffee', 'trinke', 'ich'], ['ich', 'trinke', 'Kaffee']],
}
const modul1: CumleDizmeQuestion = {
  ...base,
  id: 'm1',
  tip: 'cumle-dizme',
  parcalar: ['bin', 'Ich', 'Anna'],
  dogruSiralar: [['Ich', 'bin', 'Anna']],
}

const satir = () => within(screen.getByTestId('cevap-satiri'))
const havuz = () => within(screen.getByTestId('cip-havuzu'))

describe('ilkBuyuk', () => {
  it('yalnızca ilk harfi büyütür, gerisine dokunmaz', () => {
    expect(ilkBuyuk('im Februar')).toBe('Im Februar')
    expect(ilkBuyuk('Kaffee')).toBe('Kaffee')
    expect(ilkBuyuk('')).toBe('')
    expect(ilkBuyuk('ärgerlich')).toBe('Ärgerlich')
    expect(ilkBuyuk('wiE geht')).toBe('WiE geht')
  })
})

describe('CumleDizme: ilk parça ekranda büyük harfle gösterilir', () => {
  it('ilk sırada büyük, ikinci sırada değişmez', () => {
    render(
      <CumleDizme
        soru={subat}
        cevap={{ tip: 'cumle-dizme', sira: ['im Februar', 'habe'] }}
        onCevap={vi.fn()}
        kilitli={false}
      />,
    )
    expect(satir().getByRole('button', { name: 'Im Februar' })).toBeInTheDocument()
    expect(satir().getByRole('button', { name: 'habe' })).toBeInTheDocument()
    expect(satir().queryByRole('button', { name: 'im Februar' })).toBeNull()
  })

  it('havuzdaki parça ham haliyle görünür', () => {
    render(<CumleDizme soru={subat} cevap={null} onCevap={vi.fn()} kilitli={false} />)
    expect(havuz().getByRole('button', { name: 'im Februar' })).toBeInTheDocument()
    expect(havuz().getByRole('button', { name: 'ich' })).toBeInTheDocument()
  })

  it('havuzdan eklenen parça ham haliyle onCevap a gider', () => {
    const onCevap = vi.fn()
    render(<CumleDizme soru={subat} cevap={null} onCevap={onCevap} kilitli={false} />)
    fireEvent.click(havuz().getByRole('button', { name: 'im Februar' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: ['im Februar'] })
  })

  it('büyük gösterilen ilk çipi kaldırmak ham sırayı korur', () => {
    const onCevap = vi.fn()
    render(
      <CumleDizme
        soru={subat}
        cevap={{ tip: 'cumle-dizme', sira: ['im Februar', 'habe', 'ich'] }}
        onCevap={onCevap}
        kilitli={false}
      />,
    )
    fireEvent.click(satir().getByRole('button', { name: 'habe' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: ['im Februar', 'ich'] })
    fireEvent.click(satir().getByRole('button', { name: 'Im Februar' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: ['habe', 'ich'] })
  })

  it('isim parçası (Kaffee) olduğu gibi kalır ve eklenip kaldırılır', () => {
    const onCevap = vi.fn()
    const { rerender } = render(<CumleDizme soru={kaffee} cevap={null} onCevap={onCevap} kilitli={false} />)
    fireEvent.click(havuz().getByRole('button', { name: 'Kaffee' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: ['Kaffee'] })
    rerender(
      <CumleDizme soru={kaffee} cevap={{ tip: 'cumle-dizme', sira: ['Kaffee'] }} onCevap={onCevap} kilitli={false} />,
    )
    fireEvent.click(satir().getByRole('button', { name: 'Kaffee' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: [] })
  })

  it('ilkParca ipucuyla kilitli ilk çip büyük görünür ve kilitli kalır', () => {
    const onCevap = vi.fn()
    render(
      <CumleDizme
        soru={kaffee}
        cevap={{ tip: 'cumle-dizme', sira: ['ich'] }}
        onCevap={onCevap}
        kilitli={false}
        ipucu={{ tur: 'ilkParca', parca: 'ich' }}
      />,
    )
    const chip = satir().getByRole('button', { name: 'Ich' })
    expect(chip).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(chip)
    expect(onCevap).not.toHaveBeenCalled()
  })

  it('baloncuk büyük harfli ilk parçada da çalışır (küçük harfle eşleşir)', () => {
    render(
      <GlossContext.Provider value={{ sozluk: { wir: 'biz', ich: 'ben' } }}>
        <CumleDizme
          soru={{ ...base, id: 'g', tip: 'cumle-dizme', parcalar: ['wir', 'kommen'], dogruSiralar: [['wir', 'kommen']] }}
          cevap={{ tip: 'cumle-dizme', sira: ['wir'] }}
          onCevap={vi.fn()}
          kilitli={false}
        />
      </GlossContext.Provider>,
    )
    const gloss = satir().getByRole('button', { name: /Wir/ }).querySelector('.gloss')
    expect(gloss).not.toBeNull()
    expect(gloss).toHaveAttribute('data-anlam', 'biz')
    expect(gloss?.textContent).toContain('Wir')
  })
})

describe('puanlama ham parçaları birebir karşılaştırır', () => {
  it('doğal yazımlı dizilim doğru, ekranda görünen büyük yazım yanlış', () => {
    const doğru = { tip: 'cumle-dizme' as const, sira: ['im Februar', 'habe', 'ich', 'Geburtstag'] }
    const gorunen = { tip: 'cumle-dizme' as const, sira: ['Im Februar', 'habe', 'ich', 'Geburtstag'] }
    expect(gradeQuestion(subat, doğru)).toBe(true)
    expect(gradeQuestion(subat, gorunen)).toBe(false)
  })

  it('alternatif dizilim kabul edilir', () => {
    expect(gradeQuestion(subat, { tip: 'cumle-dizme', sira: ['ich', 'habe', 'im Februar', 'Geburtstag'] })).toBe(true)
  })

  it('Modül 1 biçimli büyük harfli parçalar hâlâ doğru puanlanır', () => {
    expect(gradeQuestion(modul1, { tip: 'cumle-dizme', sira: ['Ich', 'bin', 'Anna'] })).toBe(true)
    expect(gradeQuestion(modul1, { tip: 'cumle-dizme', sira: ['ich', 'bin', 'Anna'] })).toBe(false)
    expect(gradeQuestion(modul1, { tip: 'cumle-dizme', sira: ['bin', 'Ich', 'Anna'] })).toBe(false)
  })

  it('correctAnswerText ilk harfi büyütür; Modül 1 metni değişmez', () => {
    expect(correctAnswerText(subat)).toBe('Im Februar habe ich Geburtstag')
    expect(correctAnswerText(kaffee)).toBe('Kaffee trinke ich')
    expect(correctAnswerText(modul1)).toBe('Ich bin Anna')
  })
})

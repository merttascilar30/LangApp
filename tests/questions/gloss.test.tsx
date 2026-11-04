import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Question } from '../../src/content/schema'
import { CoktanSecmeli } from '../../src/questions/CoktanSecmeli'
import { BoslukDoldurma } from '../../src/questions/BoslukDoldurma'
import { Dinleme } from '../../src/questions/Dinleme'
import { GlossContext } from '../../src/questions/Gloss'
import { QuestionView } from '../../src/questions/QuestionView'
import { SozlukContext } from '../../src/state/SozlukContext'

const base = { aciklama: 'a', soru: 'Soru' }
const cs = { ...base, id: 'q1', tip: 'coktan-secmeli' as const, secenekler: ['bin', 'bist'], dogru: 0 }
const bd = { ...base, id: 'q2', tip: 'bosluk-doldurma' as const, metin: 'Ich ___ Anna', dogruCevaplar: ['bin'] }
const sozluk = { bin: '(ben) -im', Ich: 'ben' }

describe('Gloss', () => {
  it('seçenekte gloss, hover tooltip, tıklama seçimi yapar', () => {
    const onCevap = vi.fn()
    const { container } = render(
      <GlossContext.Provider value={{ sozluk }}>
        <CoktanSecmeli soru={cs} cevap={null} onCevap={onCevap} kilitli={false} />
      </GlossContext.Provider>,
    )
    const g = container.querySelector('.gloss') as HTMLElement
    expect(g.textContent).toBe('bin')
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(screen.getByRole('button', { name: 'bin' })).toBeInTheDocument()
    fireEvent.mouseEnter(g)
    expect(screen.getByRole('tooltip')).toHaveTextContent('(ben) -im')
    fireEvent.mouseLeave(g)
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.click(g)
    expect(onCevap).toHaveBeenCalledWith({ tip: 'coktan-secmeli', secilen: 0 })
  })
  it('boşluk doldurmada metin gloss, input yerinde', () => {
    const { container } = render(
      <GlossContext.Provider value={{ sozluk }}>
        <BoslukDoldurma soru={bd} cevap={null} onCevap={() => {}} kilitli={false} />
      </GlossContext.Provider>,
    )
    expect(container.querySelector('.gloss')?.textContent).toBe('Ich')
    expect(screen.getByLabelText('Boşluk')).toBeInTheDocument()
  })
  it('dinleme seçeneklerinde gloss yok', () => {
    const d = { ...base, id: 'q3', tip: 'dinleme' as const, metin: 'bin', secenekler: ['bin', 'bist'], dogru: 0 }
    const { container } = render(
      <GlossContext.Provider value={{ sozluk }}>
        <Dinleme soru={d as never} cevap={null} onCevap={() => {}} kilitli={false} />
      </GlossContext.Provider>,
    )
    expect(container.querySelector('.gloss')).toBeNull()
  })
  it('provider yoksa gloss yok', () => {
    const { container } = render(<CoktanSecmeli soru={cs} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(container.querySelector('.gloss')).toBeNull()
  })
  it('sozlukEk modül sözlüğünü ezer (QuestionView)', () => {
    const soru = { ...cs, sozlukEk: { bin: 'özel' } } as Question
    const { container } = render(
      <SozlukContext.Provider value={() => sozluk}>
        <QuestionView soru={soru} cevap={null} onCevap={() => {}} kilitli={false} />
      </SozlukContext.Provider>,
    )
    expect(container.querySelector('.gloss')?.getAttribute('data-anlam')).toBe('özel')
  })
})

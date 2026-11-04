import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Answer } from '../../src/domain/answers'
import type { Question } from '../../src/content/schema'
import { CoktanSecmeli } from '../../src/questions/CoktanSecmeli'
import { DogruYanlis } from '../../src/questions/DogruYanlis'
import { Artikel } from '../../src/questions/Artikel'
import { Eslestirme } from '../../src/questions/Eslestirme'
import { QuestionView } from '../../src/questions/QuestionView'

const base = { aciklama: 'a', soru: 'Soru metni' }
const cs = { ...base, id: 'q1', tip: 'coktan-secmeli' as const, secenekler: ['A', 'B', 'C'], dogru: 0 }
const dy = { ...base, id: 'q2', tip: 'dogru-yanlis' as const, ifade: 'Ich bin Anna.', dogru: true }
const ar = { ...base, id: 'q3', tip: 'artikel' as const, isim: 'Haus', dogru: 'das' as const }
const es = {
  ...base,
  id: 'q4',
  tip: 'eslestirme' as const,
  ciftler: [
    { sol: 'Hund', sag: 'köpek' },
    { sol: 'Katze', sag: 'kedi' },
    { sol: 'Vogel', sag: 'kuş' },
    { sol: 'Fisch', sag: 'balık' },
  ],
}

describe('CoktanSecmeli', () => {
  it('ikinci seçeneğe tıklayınca onCevap çağrılır', () => {
    const onCevap = vi.fn()
    render(<CoktanSecmeli soru={cs} cevap={null} onCevap={onCevap} kilitli={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'coktan-secmeli', secilen: 1 })
  })
  it('seçimi gösterir', () => {
    render(<CoktanSecmeli soru={cs} cevap={{ tip: 'coktan-secmeli', secilen: 2 }} onCevap={() => {}} kilitli={false} />)
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'false')
  })
  it('kilitli iken düğmeler disabled', () => {
    render(<CoktanSecmeli soru={cs} cevap={null} onCevap={() => {}} kilitli />)
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled()
  })
})

describe('DogruYanlis', () => {
  it('Yanlış -> secilen false', () => {
    const onCevap = vi.fn()
    render(<DogruYanlis soru={dy} cevap={null} onCevap={onCevap} kilitli={false} />)
    expect(screen.getByText('Ich bin Anna.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yanlış' }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'dogru-yanlis', secilen: false })
  })
})

describe('Artikel', () => {
  it('die -> secilen die', () => {
    const onCevap = vi.fn()
    render(<Artikel soru={ar} cevap={null} onCevap={onCevap} kilitli={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'die' }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'artikel', secilen: 'die' })
  })
})

describe('Eslestirme', () => {
  it('4 çiftin hepsi eşleşince son çağrıda 4 anahtar', () => {
    const calls: Answer[] = []
    function W() {
      const [c, setC] = useState<Answer | null>(null)
      return (
        <Eslestirme
          soru={es}
          cevap={c}
          onCevap={(a) => {
            calls.push(a)
            setC(a)
          }}
          kilitli={false}
        />
      )
    }
    render(<W />)
    for (const p of es.ciftler) {
      fireEvent.click(screen.getByRole('button', { name: p.sol }))
      fireEvent.click(screen.getByRole('button', { name: p.sag }))
    }
    const last = calls[calls.length - 1]
    expect(last.tip).toBe('eslestirme')
    if (last.tip === 'eslestirme') {
      expect(Object.keys(last.eslesme)).toHaveLength(4)
      expect(last.eslesme.Hund).toBe('köpek')
    }
  })
  it('eşleşmiş sol öğe tıklanınca çözülür', () => {
    const calls: Answer[] = []
    function W() {
      const [c, setC] = useState<Answer | null>(null)
      return <Eslestirme soru={es} cevap={c} onCevap={(a) => { calls.push(a); setC(a) }} kilitli={false} />
    }
    render(<W />)
    fireEvent.click(screen.getByRole('button', { name: 'Hund' }))
    fireEvent.click(screen.getByRole('button', { name: 'köpek' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hund' }))
    const last = calls[calls.length - 1]
    expect(last).toEqual({ tip: 'eslestirme', eslesme: {} })
  })
})

describe('QuestionView', () => {
  it('artikel için der/die/das render eder', () => {
    render(<QuestionView soru={ar as Question} cevap={null} onCevap={() => {}} kilitli={false} />)
    for (const n of ['der', 'die', 'das']) expect(screen.getByRole('button', { name: n })).toBeInTheDocument()
  })
  it('desteklenmeyen tip', () => {
    const q = { ...base, id: 'x', tip: 'bilinmeyen' } as unknown as Question
    render(<QuestionView soru={q} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(screen.getByText('Desteklenmeyen soru tipi')).toBeInTheDocument()
  })
})

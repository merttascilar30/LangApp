import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Question } from '../../src/content/schema'
import { TestRunner } from '../../src/test-runner/TestRunner'
import { ResultsView } from '../../src/test-runner/ResultsView'
import { NotMetni } from '../../src/test-runner/NotMetni'

vi.mock('../../src/speech/speech', () => ({ speak: vi.fn() }))

const soru = {
  id: 'c1',
  tip: 'coktan-secmeli',
  soru: 'Seç',
  aciklama: 'açıklama',
  secenekler: ['bin', 'bist', 'ist'],
  dogru: 0,
  celdiriciNotlari: ['', 'bist du ile kullanılır', 'ist er/sie içindir'],
} as Question
const notsuz = { ...soru, id: 'c2', celdiriciNotlari: undefined } as Question

describe('çeldirici notu pratik modda', () => {
  it('yanlış şık + Kontrol et -> Neden olmadı', () => {
    render(<TestRunner sorular={[soru]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'bist' }))
    expect(screen.queryByText(/Neden olmadı/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.getByRole('status')).toHaveTextContent('Neden olmadı: bist du ile kullanılır')
  })
  it('doğru şıkta yok', () => {
    render(<TestRunner sorular={[soru]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'bin' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.queryByText(/Neden olmadı/)).toBeNull()
  })
  it('sınav modunda bitirmeden önce yok', () => {
    render(<TestRunner sorular={[soru]} mod="sinav" onBitti={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'bist' }))
    expect(screen.queryByText(/Neden olmadı/)).toBeNull()
  })
})

describe('çeldirici notu ResultsView', () => {
  const goster = (sorular: Question[], sonuclar: Parameters<typeof ResultsView>[0]['sonuclar']) =>
    render(<ResultsView sorular={sorular} sonuclar={sonuclar} gecmeNotu={80} baslik="Sonuç" />)
  it('yanlış şıkta var', () => {
    goster([soru], [{ soruId: 'c1', dogru: false, cevap: { tip: 'coktan-secmeli', secilen: 2 } }])
    expect(screen.getByText(/Neden olmadı: ist er\/sie içindir/)).toBeInTheDocument()
  })
  it('cevapsızda yok', () => {
    goster([soru], [{ soruId: 'c1', dogru: false, cevap: null }])
    expect(screen.queryByText(/Neden olmadı/)).toBeNull()
  })
  it('celdiriciNotlari olmayan soruda yok', () => {
    goster([notsuz], [{ soruId: 'c2', dogru: false, cevap: { tip: 'coktan-secmeli', secilen: 1 } }])
    expect(screen.queryByText(/Neden olmadı/)).toBeNull()
  })
})

describe('ResultsView cümle gösterimi', () => {
  const sonuc = [{ soruId: 'm1', dogru: false, cevap: null }]
  it('metin: doldurulmuş cümle görünür', () => {
    const q = { id: 'm1', tip: 'coktan-secmeli', soru: 'Boşluğu doldur', aciklama: 'a', metin: 'Wir ___ aus Berlin.', secenekler: ['kommen', 'kommt'], dogru: 0 } as Question
    render(<ResultsView sorular={[q]} sonuclar={sonuc} gecmeNotu={80} baslik="S" />)
    expect(screen.getByText('Wir kommen aus Berlin.')).toBeInTheDocument()
  })
  it('diyalog: satırlar kim ile, boşluk dolu', () => {
    const q = {
      id: 'm1', tip: 'coktan-secmeli', soru: 'Diyalog', aciklama: 'a',
      diyalog: [{ kim: 'A', metin: 'Woher ___ Sie?' }, { kim: 'B', metin: 'Aus Rom.' }],
      secenekler: ['kommt', 'kommen'], dogru: 1,
    } as Question
    render(<ResultsView sorular={[q]} sonuclar={sonuc} gecmeNotu={80} baslik="S" />)
    expect(screen.getByText('A: Woher kommen Sie?')).toBeInTheDocument()
    expect(screen.getByText('B: Aus Rom.')).toBeInTheDocument()
  })
})

describe('NotMetni', () => {
  it('backtick arası em[lang=de]', () => {
    const { container } = render(<NotMetni metin={'`mir` "bana" demektir'} />)
    expect(container.querySelector('em[lang="de"]')?.textContent).toBe('mir')
    expect(container.textContent).toBe('mir "bana" demektir')
    expect(container.textContent).not.toContain('`')
  })
  it('backtick yoksa aynı', () => {
    const { container } = render(<NotMetni metin="düz not" />)
    expect(container.textContent).toBe('düz not')
    expect(container.querySelector('em')).toBeNull()
  })
  it('dengesiz backtick düz yazılır', () => {
    const { container } = render(<NotMetni metin={'`mir bana'} />)
    expect(container.textContent).toBe('`mir bana')
    expect(container.querySelector('em')).toBeNull()
  })
})

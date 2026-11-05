import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Question } from '../../src/content/schema'
import { TestRunner } from '../../src/test-runner/TestRunner'
import { ResultsView } from '../../src/test-runner/ResultsView'

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

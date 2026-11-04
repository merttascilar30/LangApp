import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestRunner } from '../../src/test-runner/TestRunner'
import { ResultsView } from '../../src/test-runner/ResultsView'
import type { SoruSonucu } from '../../src/test-runner/TestRunner'
import type { Question } from '../../src/content/schema'
import { makeQuestion } from '../fixtures/content'

vi.mock('../../src/speech/speech', () => ({ speak: vi.fn() }))
import { speak } from '../../src/speech/speech'

const qs = (n: number) => Array.from({ length: n }, (_, i) => makeQuestion(`q${i}`)) as Question[]

beforeEach(() => {
  vi.mocked(speak).mockClear()
  vi.restoreAllMocks()
})

describe('TestRunner pratik', () => {
  it('Kontrol et cevap yokken disabled; kontrol sonrası geri bildirim ve kilit', () => {
    render(<TestRunner sorular={qs(2)} mod="pratik" onBitti={vi.fn()} />)
    expect(screen.getByText('Soru 1 / 2')).toBeInTheDocument()
    const kontrol = screen.getByRole('button', { name: 'Kontrol et' })
    expect(kontrol).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    expect(kontrol).toBeEnabled()
    fireEvent.click(kontrol)
    expect(screen.getByRole('status')).toHaveTextContent('Doğru!')
    expect(screen.getByRole('status')).toHaveTextContent('Doğru cevap: Doğru')
    expect(screen.getByRole('status')).toHaveTextContent('açıklama')
    expect(screen.queryByRole('button', { name: 'Kontrol et' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Yanlış' })).toBeDisabled()
  })

  it('yanlış cevapta Yanlış gösterir', () => {
    render(<TestRunner sorular={qs(1)} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Yanlış' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.getByRole('status')).toHaveTextContent('Yanlış')
  })

  it('Devam sonraki soruya geçer; sonda onBitti bir kez', () => {
    const onBitti = vi.fn()
    render(<TestRunner sorular={qs(2)} mod="pratik" onBitti={onBitti} />)
    fireEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
    expect(screen.getByText('Soru 2 / 2')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Yanlış' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    const devam = screen.getByRole('button', { name: 'Devam' })
    fireEvent.click(devam)
    fireEvent.click(devam)
    expect(onBitti).toHaveBeenCalledTimes(1)
    const s = onBitti.mock.calls[0][0] as SoruSonucu[]
    expect(s.map((x) => x.soruId)).toEqual(['q0', 'q1'])
    expect(s.map((x) => x.dogru)).toEqual([true, false])
    expect(s[0].cevap).toEqual({ tip: 'dogru-yanlis', secilen: true })
  })
})

describe('TestRunner sınav', () => {
  it('geri bildirim yok, gezinme cevabı korur', () => {
    render(<TestRunner sorular={qs(2)} mod="sinav" onBitti={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Kontrol et' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Geri' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'İleri' }))
    expect(screen.getByText('Soru 2 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Doğru' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Geri' }))
    expect(screen.getByRole('button', { name: 'Doğru' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Bitir cevapsızda onay ister; iptal kalır, onay bitirir', () => {
    const onBitti = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TestRunner sorular={qs(3)} mod="sinav" onBitti={onBitti} />)
    fireEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(confirm).toHaveBeenCalledWith('2 soru cevapsız. Yine de bitir?')
    expect(onBitti).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(onBitti).toHaveBeenCalledTimes(1)
    const s = onBitti.mock.calls[0][0] as SoruSonucu[]
    expect(s).toHaveLength(3)
    expect(s[0]).toMatchObject({ soruId: 'q0', dogru: true })
    expect(s[1]).toEqual({ soruId: 'q1', dogru: false, cevap: null })
  })

  it('hepsi cevaplıysa onaysız biter', () => {
    const onBitti = vi.fn()
    const confirm = vi.spyOn(window, 'confirm')
    render(<TestRunner sorular={qs(1)} mod="sinav" onBitti={onBitti} />)
    fireEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(confirm).not.toHaveBeenCalled()
    expect(onBitti).toHaveBeenCalledTimes(1)
  })
})

describe('ResultsView', () => {
  const sonuc = (qsl: Question[], dogruSayi: number): SoruSonucu[] =>
    qsl.map((q, i) => ({ soruId: q.id, dogru: i < dogruSayi, cevap: null }))

  it('7/10 gecmeNotu 70 -> Geçti', () => {
    const q = qs(10)
    render(<ResultsView sorular={q} sonuclar={sonuc(q, 7)} gecmeNotu={70} baslik="Sonuç" />)
    expect(screen.getByRole('heading', { name: 'Sonuç' })).toBeInTheDocument()
    expect(screen.getByText('7 / 10 (%70)')).toBeInTheDocument()
    expect(screen.getByText('Geçti')).toBeInTheDocument()
  })

  it('2/3 -> %66 ve Kaldı', () => {
    const q = qs(3)
    render(<ResultsView sorular={q} sonuclar={sonuc(q, 2)} gecmeNotu={70} baslik="S">
      <button>Ekstra</button>
    </ResultsView>)
    expect(screen.getByText('2 / 3 (%66)')).toBeInTheDocument()
    expect(screen.getByText('Kaldı')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ekstra' })).toBeInTheDocument()
    expect(screen.getAllByText('Doğru cevap: Doğru')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Dinle' })).toBeNull()
  })

  it('çoktan seçmelide 🔊 doğru cevabı okur', () => {
    const q = [makeQuestion('c1', 'coktan-secmeli')] as Question[]
    render(<ResultsView sorular={q} sonuclar={sonuc(q, 1)} gecmeNotu={50} baslik="S" />)
    fireEvent.click(screen.getByRole('button', { name: 'Dinle' }))
    expect(speak).toHaveBeenCalledWith('a')
  })
})

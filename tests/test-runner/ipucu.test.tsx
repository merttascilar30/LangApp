import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TestRunner } from '../../src/test-runner/TestRunner'
import type { SoruSonucu } from '../../src/test-runner/TestRunner'
import type { Question } from '../../src/content/schema'

vi.mock('../../src/speech/speech', () => ({ speak: vi.fn() }))

const secmeli = (id: string, ipucu?: string) =>
  ({
    id,
    tip: 'coktan-secmeli',
    soru: 'Seç',
    aciklama: 'açıklama',
    secenekler: ['A', 'B', 'C', 'D'],
    dogru: 1,
    ...(ipucu ? { ipucu } : {}),
  }) as Question

const bosluk = (id: string, ipucu?: string) =>
  ({
    id,
    tip: 'bosluk-doldurma',
    soru: 'Doldur',
    aciklama: 'açıklama',
    metin: 'Ich ___ Anna.',
    dogruCevaplar: ['bin'],
    ...(ipucu ? { ipucu } : {}),
  }) as Question

const dy = (id: string, ipucu?: string) =>
  ({
    id,
    tip: 'dogru-yanlis',
    soru: 'D/Y',
    ifade: 'Ein Satz.',
    aciklama: 'açıklama',
    dogru: true,
    ...(ipucu ? { ipucu } : {}),
  }) as Question

const ipucuDugme = () => screen.queryByRole('button', { name: '💡 İpucu' })
const dahaFazla = () => screen.queryByRole('button', { name: '🔍 Daha fazla' })

describe('TestRunner ipucu düğmesi', () => {
  it('iki kademe: not kutusu, sonra şık eleme; ipucuyla çözüldü ve sonuç işareti', () => {
    const onBitti = vi.fn()
    render(<TestRunner sorular={[secmeli('s1', 'Dikkatli oku')]} mod="pratik" onBitti={onBitti} />)
    fireEvent.click(ipucuDugme()!)
    const not = screen.getByRole('note')
    expect(not).toHaveTextContent('Dikkatli oku')
    expect(not).toHaveClass('ipucu-kutu')
    expect(ipucuDugme()).toBeNull()
    fireEvent.click(dahaFazla()!)
    expect(dahaFazla()).toBeNull()
    expect(screen.getByRole('button', { name: 'B' })).toBeEnabled()
    const elenen = ['A', 'C', 'D'].filter((s) => (screen.getByRole('button', { name: s }) as HTMLButtonElement).disabled)
    expect(elenen).toHaveLength(1)
    expect(screen.getByRole('button', { name: elenen[0] })).toHaveClass('elendi')
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.getByRole('status')).toHaveTextContent('💡 İpucuyla çözüldü')
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
    const sonuc = onBitti.mock.calls[0][0] as SoruSonucu[]
    expect(sonuc[0].dogru).toBe(true)
    expect(sonuc[0].ipucu).toBe(true)
  })

  it('ipucu alanı olmayan boşluk-doldurma: tek tıkla ilk harf', () => {
    render(<TestRunner sorular={[bosluk('b1')]} mod="pratik" onBitti={vi.fn()} />)
    expect(screen.queryByRole('note')).toBeNull()
    fireEvent.click(ipucuDugme()!)
    expect(screen.getByText('İlk harf: b')).toBeInTheDocument()
    expect(dahaFazla()).toBeNull()
  })

  it('dogru-yanlis: ipucu yoksa düğme yok; varsa yalnızca kademe 1', () => {
    const { unmount } = render(<TestRunner sorular={[dy('d1')]} mod="pratik" onBitti={vi.fn()} />)
    expect(ipucuDugme()).toBeNull()
    unmount()
    render(<TestRunner sorular={[dy('d2', 'Not')]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(ipucuDugme()!)
    expect(screen.getByRole('note')).toHaveTextContent('Not')
    expect(dahaFazla()).toBeNull()
  })

  it('ipucusuz çözülen soruda ipucu işareti yok', () => {
    const onBitti = vi.fn()
    render(<TestRunner sorular={[secmeli('s1', 'x')]} mod="pratik" onBitti={onBitti} />)
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.getByRole('status')).not.toHaveTextContent('İpucuyla')
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
    expect((onBitti.mock.calls[0][0] as SoruSonucu[])[0].ipucu).toBeFalsy()
  })

  it('sınav modunda ipucu düğmesi yok', () => {
    render(<TestRunner sorular={[secmeli('s1', 'x')]} mod="sinav" onBitti={vi.fn()} />)
    expect(ipucuDugme()).toBeNull()
  })

  it('kontrol sonrası düğme yok; yeni soruda kademe 0', () => {
    render(<TestRunner sorular={[secmeli('s1', 'x'), secmeli('s2', 'y')]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(ipucuDugme()!)
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(ipucuDugme()).toBeNull()
    expect(dahaFazla()).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
    expect(screen.queryByRole('note')).toBeNull()
    expect(ipucuDugme()).not.toBeNull()
  })

  it('kademe 2 elenen seçili şıkkı temizler', () => {
    const cevapli = ['A', 'C', 'D']
    let temizlendi = false
    for (const id of ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']) {
      const { unmount } = render(<TestRunner sorular={[secmeli(id)]} mod="pratik" onBitti={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'D' }))
      fireEvent.click(ipucuDugme()!)
      const d = screen.getByRole('button', { name: 'D' }) as HTMLButtonElement
      const kontrol = screen.getByRole('button', { name: 'Kontrol et' })
      expect(kontrol.hasAttribute('disabled')).toBe(d.disabled)
      if (d.disabled) temizlendi = true
      unmount()
    }
    expect(cevapli).toHaveLength(3)
    expect(temizlendi).toBe(true)
  })

  it('ipucu + yanlış cevap: etiket yok, Yanlış görünür', () => {
    render(<TestRunner sorular={[secmeli('s1', 'x')]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(ipucuDugme()!)
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.getByRole('status')).toHaveTextContent('Yanlış')
    expect(screen.getByRole('status')).not.toHaveTextContent('İpucuyla')
  })

  it('cumle-dizme cevapsızken Daha fazla ilk parçayı yerleştirir', () => {
    const q = {
      id: 'c1',
      tip: 'cumle-dizme',
      soru: 'Diz',
      aciklama: 'a',
      parcalar: ['Ich', 'bin', 'Anna'],
      dogruSiralar: [['Ich', 'bin', 'Anna']],
      ipucu: 'not',
    } as Question
    render(<TestRunner sorular={[q]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(ipucuDugme()!)
    fireEvent.click(dahaFazla()!)
    expect(within(screen.getByTestId('cevap-satiri')).getByRole('button', { name: 'Ich' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kontrol et' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Kontrol et' })).toHaveFocus()
  })
})

describe('TestRunner ilk harf ipucu odağı', () => {
  it('ilk harf ipucundan sonra odak yazı girdisine gider, Kontrol et’e değil', () => {
    render(<TestRunner sorular={[bosluk('b1')]} mod="pratik" onBitti={vi.fn()} />)
    fireEvent.click(ipucuDugme()!)
    expect(screen.getByText(/İlk harf/)).toBeInTheDocument()
    expect(screen.getByLabelText('Boşluk')).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Kontrol et' })).not.toHaveFocus()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { CumleDizme } from '../../src/questions/CumleDizme'
import { Eslestirme } from '../../src/questions/Eslestirme'
import { FiilCekimi } from '../../src/questions/FiilCekimi'

const base = { aciklama: 'a', soru: 'Soru metni' }
const cd = {
  ...base,
  id: 'k1',
  tip: 'cumle-dizme' as const,
  parcalar: ['Ich', 'bin', 'Anna'],
  dogruSiralar: [['Ich', 'bin', 'Anna']],
}
const es = {
  ...base,
  id: 'e1',
  tip: 'eslestirme' as const,
  ciftler: [
    { sol: 'Hund', sag: 'köpek' },
    { sol: 'Katze', sag: 'kedi' },
    { sol: 'Haus', sag: 'ev' },
    { sol: 'Buch', sag: 'kitap' },
  ],
}
const fc = {
  ...base,
  id: 'f1',
  tip: 'fiil-cekimi' as const,
  fiil: 'sein',
  satirlar: [
    { zamir: 'ich', cevap: 'bin', verilen: true },
    { zamir: 'du', cevap: 'bist' },
    { zamir: 'er', cevap: 'ist' },
  ],
}

describe('CumleDizme ilkParca', () => {
  const ipucu = { tur: 'ilkParca' as const, parca: 'Ich' }
  const cevap = { tip: 'cumle-dizme' as const, sira: ['Ich'] }

  it('ilk çip kilitli: aria-disabled ve tıklama onCevap çağırmaz', () => {
    const onCevap = vi.fn()
    render(<CumleDizme soru={cd} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    const chip = within(screen.getByTestId('cevap-satiri')).getByRole('button', { name: 'Ich' })
    expect(chip).toHaveAttribute('aria-disabled', 'true')
    expect(chip).toHaveClass('ipucu-kilitli')
    fireEvent.click(chip)
    expect(onCevap).not.toHaveBeenCalled()
  })

  it('diğer çipler eklenir ve kaldırılır', () => {
    const onCevap = vi.fn()
    const { rerender } = render(<CumleDizme soru={cd} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    fireEvent.click(within(screen.getByTestId('cip-havuzu')).getByRole('button', { name: 'bin' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: ['Ich', 'bin'] })
    rerender(
      <CumleDizme soru={cd} cevap={{ tip: 'cumle-dizme', sira: ['Ich', 'bin'] }} onCevap={onCevap} kilitli={false} ipucu={ipucu} />,
    )
    fireEvent.click(within(screen.getByTestId('cevap-satiri')).getByRole('button', { name: 'bin' }))
    expect(onCevap).toHaveBeenLastCalledWith({ tip: 'cumle-dizme', sira: ['Ich'] })
  })

  it('ipucu yoksa ilk çip kaldırılabilir', () => {
    const onCevap = vi.fn()
    render(<CumleDizme soru={cd} cevap={cevap} onCevap={onCevap} kilitli={false} />)
    fireEvent.click(within(screen.getByTestId('cevap-satiri')).getByRole('button', { name: 'Ich' }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'cumle-dizme', sira: [] })
  })
})

describe('Eslestirme cift', () => {
  const ipucu = { tur: 'cift' as const, sol: 'Hund', sag: 'köpek' }
  const cevap = { tip: 'eslestirme' as const, eslesme: { Hund: 'köpek' } }

  it('kilitli çiftin düğmeleri disabled, tıklama etkisiz', () => {
    const onCevap = vi.fn()
    render(<Eslestirme soru={es} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    const sol = screen.getByRole('button', { name: /Hund/ })
    const sag = screen.getByRole('button', { name: /köpek/ })
    expect(sol).toBeDisabled()
    expect(sag).toBeDisabled()
    expect(sol).toHaveClass('ipucu-kilitli')
    expect(sag).toHaveClass('ipucu-kilitli')
    fireEvent.click(sol)
    fireEvent.click(sag)
    expect(onCevap).not.toHaveBeenCalled()
  })

  it('diğer çiftler normal eşleşir', () => {
    const onCevap = vi.fn()
    render(<Eslestirme soru={es} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    fireEvent.click(screen.getByRole('button', { name: /Katze/ }))
    fireEvent.click(screen.getByRole('button', { name: /kedi/ }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'eslestirme', eslesme: { Hund: 'köpek', Katze: 'kedi' } })
    expect(screen.getByRole('button', { name: /Katze/ })).not.toBeDisabled()
  })
})

describe('FiilCekimi hucre', () => {
  const ipucu = { tur: 'hucre' as const, satir: 1, cevap: 'bist' }
  const cevap = { tip: 'fiil-cekimi' as const, hucreler: ['', 'bist', ''] }

  it('kilitli satır readOnly ve cevabı gösterir; yazma onCevap çağırmaz', () => {
    const onCevap = vi.fn()
    render(<FiilCekimi soru={fc} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    const input = screen.getByLabelText('du') as HTMLInputElement
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveAttribute('aria-readonly', 'true')
    expect(input).toHaveClass('ipucu-kilitli')
    expect(input.value).toBe('bist')
    fireEvent.change(input, { target: { value: 'xyz' } })
    expect(onCevap).not.toHaveBeenCalled()
  })

  it('umlaut tuşu kilitli hücreye yazmaz', () => {
    const onCevap = vi.fn()
    render(<FiilCekimi soru={fc} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    const input = screen.getByLabelText('du')
    input.focus()
    fireEvent.click(screen.getByRole('button', { name: 'ä' }))
    for (const c of onCevap.mock.calls) expect(c[0].hucreler[1]).toBe('bist')
  })

  it('diğer satır normal çalışır', () => {
    const onCevap = vi.fn()
    render(<FiilCekimi soru={fc} cevap={cevap} onCevap={onCevap} kilitli={false} ipucu={ipucu} />)
    const er = screen.getByLabelText('er')
    expect(er).not.toHaveAttribute('readonly')
    fireEvent.change(er, { target: { value: 'ist' } })
    expect(onCevap).toHaveBeenCalledWith({ tip: 'fiil-cekimi', hucreler: ['', 'bist', 'ist'] })
  })
})

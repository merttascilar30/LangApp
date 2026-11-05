import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Answer } from '../../src/domain/answers'
import { BoslukDoldurma } from '../../src/questions/BoslukDoldurma'
import { Ceviri } from '../../src/questions/Ceviri'
import { Dinleme } from '../../src/questions/Dinleme'
import { FiilCekimi } from '../../src/questions/FiilCekimi'
import { CumleDizme } from '../../src/questions/CumleDizme'
import { QuestionView } from '../../src/questions/QuestionView'
import { speak } from '../../src/speech/speech'

vi.mock('../../src/speech/speech', () => ({ speak: vi.fn() }))

const base = { aciklama: 'a', soru: 'Soru metni' }
const bd = { ...base, id: 'b1', tip: 'bosluk-doldurma' as const, metin: 'Ich habe ___ Euro.', dogruCevaplar: ['bin'] }
const cv = { ...base, id: 'c1', tip: 'ceviri' as const, kaynak: 'Ben Anna', dogruCevaplar: ['Ich bin Anna'] }
const dsec = {
  ...base,
  id: 'd1',
  tip: 'dinleme' as const,
  okunacak: 'Guten Morgen',
  mod: 'sec' as const,
  secenekler: ['Günaydın', 'İyi akşamlar', 'Hoşça kal'],
  dogruCevaplar: ['Günaydın'],
}
const dyaz = { ...dsec, id: 'd2', mod: 'yaz' as const, secenekler: undefined }
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
const cd = {
  ...base,
  id: 'k1',
  tip: 'cumle-dizme' as const,
  parcalar: ['Ich', 'bin', 'Anna'],
  dogruSiralar: [['Ich', 'bin', 'Anna']],
}

function Wrap({
  children,
  calls,
}: {
  children: (c: Answer | null, set: (a: Answer) => void) => React.ReactNode
  calls?: Answer[]
}) {
  const [c, setC] = useState<Answer | null>(null)
  return (
    <>
      {children(c, (a) => {
        calls?.push(a)
        setC(a)
      })}
    </>
  )
}

describe('BoslukDoldurma', () => {
  it('yazılan metin onCevap ile gider', () => {
    const calls: Answer[] = []
    render(<Wrap calls={calls}>{(c, set) => <BoslukDoldurma soru={bd} cevap={c} onCevap={set} kilitli={false} />}</Wrap>)
    fireEvent.change(screen.getByLabelText('Boşluk'), { target: { value: 'bin' } })
    expect(calls.at(-1)).toEqual({ tip: 'bosluk-doldurma', metin: 'bin' })
  })
  it('ü tuşu sona ekler', () => {
    render(<Wrap>{(c, set) => <BoslukDoldurma soru={bd} cevap={c} onCevap={set} kilitli={false} />}</Wrap>)
    const input = screen.getByLabelText('Boşluk') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'bin' } })
    fireEvent.click(screen.getByRole('button', { name: 'ü' }))
    expect(input.value).toBe('binü')
  })
  it('imleç konumuna ekler', () => {
    render(<Wrap>{(c, set) => <BoslukDoldurma soru={bd} cevap={c} onCevap={set} kilitli={false} />}</Wrap>)
    const input = screen.getByLabelText('Boşluk') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'bn' } })
    input.focus()
    input.setSelectionRange(1, 1)
    fireEvent.click(screen.getByRole('button', { name: 'ä' }))
    expect(input.value).toBe('bän')
    expect(input.selectionStart).toBe(2)
  })
  it('kilitli iken input ve tuşlar disabled', () => {
    render(<BoslukDoldurma soru={bd} cevap={null} onCevap={() => {}} kilitli />)
    expect(screen.getByLabelText('Boşluk')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ß' })).toBeDisabled()
  })
})

describe('Ceviri', () => {
  it('kaynağı gösterir ve yazılanı gönderir', () => {
    const onCevap = vi.fn()
    render(<Ceviri soru={cv} cevap={null} onCevap={onCevap} kilitli={false} />)
    expect(screen.getByText('Ben Anna')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Çeviri'), { target: { value: 'Ich' } })
    expect(onCevap).toHaveBeenCalledWith({ tip: 'ceviri', metin: 'Ich' })
  })
})

describe('Dinleme', () => {
  it('Dinle ve Yavaş dinle speak çağırır, okunacak gösterilmez', () => {
    render(<Dinleme soru={dsec} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(screen.queryByText('Guten Morgen')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Dinle' }))
    expect(speak).toHaveBeenCalledWith('Guten Morgen')
    fireEvent.click(screen.getByRole('button', { name: 'Yavaş dinle' }))
    expect(speak).toHaveBeenCalledWith('Guten Morgen', { yavas: true })
  })
  it('sec modunda seçenek metni gönderilir', () => {
    const onCevap = vi.fn()
    render(<Dinleme soru={dsec} cevap={null} onCevap={onCevap} kilitli={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Günaydın' }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'dinleme', metin: 'Günaydın' })
  })
  it('yaz modunda input', () => {
    const onCevap = vi.fn()
    render(<Dinleme soru={dyaz} cevap={null} onCevap={onCevap} kilitli={false} />)
    fireEvent.change(screen.getByLabelText('Cevap'), { target: { value: 'x' } })
    expect(onCevap).toHaveBeenCalledWith({ tip: 'dinleme', metin: 'x' })
  })
  it('kilitli iken dinle düğmeleri açık, seçenekler disabled', () => {
    render(<Dinleme soru={dsec} cevap={null} onCevap={() => {}} kilitli />)
    expect(screen.getByRole('button', { name: 'Dinle' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Yavaş dinle' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Günaydın' })).toBeDisabled()
  })
})

describe('FiilCekimi', () => {
  it('verilen satır input değil: 2 input', () => {
    render(<FiilCekimi soru={fc} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getByText('bin')).toBeInTheDocument()
    expect(screen.getByText('sein')).toBeInTheDocument()
  })
  it('hücreler satır sırasında, uzunluk satır sayısı', () => {
    const calls: Answer[] = []
    render(<Wrap calls={calls}>{(c, set) => <FiilCekimi soru={fc} cevap={c} onCevap={set} kilitli={false} />}</Wrap>)
    fireEvent.change(screen.getByLabelText('er'), { target: { value: 'ist' } })
    expect(calls.at(-1)).toEqual({ tip: 'fiil-cekimi', hucreler: ['', '', 'ist'] })
    fireEvent.change(screen.getByLabelText('du'), { target: { value: 'bist' } })
    expect(calls.at(-1)).toEqual({ tip: 'fiil-cekimi', hucreler: ['', 'bist', 'ist'] })
  })
  it('kilitli iken input disabled', () => {
    render(<FiilCekimi soru={fc} cevap={null} onCevap={() => {}} kilitli />)
    for (const i of screen.getAllByRole('textbox')) expect(i).toBeDisabled()
  })
})

describe('CumleDizme', () => {
  const chip = (n: string) => screen.getByRole('button', { name: n })
  it('tıklama sırası sira olur; cevap satırından çıkarılır', () => {
    const calls: Answer[] = []
    render(<Wrap calls={calls}>{(c, set) => <CumleDizme soru={cd} cevap={c} onCevap={set} kilitli={false} />}</Wrap>)
    fireEvent.click(chip('Anna'))
    fireEvent.click(chip('Ich'))
    fireEvent.click(chip('bin'))
    expect(calls.at(-1)).toEqual({ tip: 'cumle-dizme', sira: ['Anna', 'Ich', 'bin'] })
    fireEvent.click(within(screen.getByTestId('cevap-satiri')).getByRole('button', { name: 'Ich' }))
    expect(calls.at(-1)).toEqual({ tip: 'cumle-dizme', sira: ['Anna', 'bin'] })
  })
  it('tekrarlayan parçalar ayrı izlenir', () => {
    const calls: Answer[] = []
    const s = { ...cd, id: 'k2', parcalar: ['a', 'a', 'b'], dogruSiralar: [['a', 'a', 'b']] }
    render(<Wrap calls={calls}>{(c, set) => <CumleDizme soru={s} cevap={c} onCevap={set} kilitli={false} />}</Wrap>)
    const havuz = () => within(screen.getByTestId('cip-havuzu'))
    fireEvent.click(havuz().getAllByRole('button', { name: 'a' })[0])
    fireEvent.click(havuz().getAllByRole('button', { name: 'a' })[0])
    expect(calls.at(-1)).toEqual({ tip: 'cumle-dizme', sira: ['a', 'a'] })
    // İlk cevap çipi ekranda büyük harfle görünür ('A'), ikincisi ham kalır ('a').
    const satir = within(screen.getByTestId('cevap-satiri'))
    expect(satir.getAllByRole('button').map((b) => b.textContent)).toEqual(['A', 'a'])
  })
  it('kilitli iken çipler disabled', () => {
    render(<CumleDizme soru={cd} cevap={null} onCevap={() => {}} kilitli />)
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled()
  })
})

describe('QuestionView', () => {
  it('yeni tipleri çizer', () => {
    const { unmount } = render(<QuestionView soru={bd} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(screen.getByLabelText('Boşluk')).toBeInTheDocument()
    unmount()
    render(<QuestionView soru={cd} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(screen.getByTestId('cevap-satiri')).toBeInTheDocument()
  })
})

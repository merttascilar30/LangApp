import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Question } from '../../src/content/schema'
import { CoktanSecmeli } from '../../src/questions/CoktanSecmeli'
import { GlossContext } from '../../src/questions/Gloss'
import { QuestionView } from '../../src/questions/QuestionView'
import { SozlukContext } from '../../src/state/SozlukContext'

const base = { id: 'q1', aciklama: 'a', soru: 'Boşluğu doldur', tip: 'coktan-secmeli' as const }
const eski = { ...base, secenekler: ['bin', 'bist'], dogru: 0 }
const metinli = { ...base, metin: 'Ich ___ Anna.', secenekler: ['bin', 'bist'], dogru: 0 }
const diyalog = {
  ...base,
  diyalog: [
    { kim: 'Anna', metin: 'Wie ___ es dir?' },
    { kim: 'Tom', metin: 'Gut, danke.' },
  ],
  secenekler: ['geht', 'gehst'],
  dogru: 0,
}
const sozluk = { Gut: 'iyi', danke: 'teşekkürler', Ich: 'ben' }

describe('CoktanSecmeli metin ve diyalog', () => {
  it('metin görünür', () => {
    const { container } = render(<CoktanSecmeli soru={metinli} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(container.querySelector('p.soru-almanca')).toHaveTextContent('Ich ___ Anna.')
  })
  it('alanlar yoksa .diyalog ve .soru-almanca yok', () => {
    const { container } = render(<CoktanSecmeli soru={eski} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(container.querySelector('.diyalog')).toBeNull()
    expect(container.querySelector('.soru-almanca')).toBeNull()
  })
  it('diyalog: satırlar, kim etiketleri, boş balonda …', () => {
    const { container } = render(<CoktanSecmeli soru={diyalog} cevap={null} onCevap={() => {}} kilitli={false} />)
    expect(container.querySelectorAll('ol.diyalog > li.balon')).toHaveLength(2)
    expect(screen.getByText('Anna')).toHaveClass('kim')
    expect(screen.getByText('Tom')).toHaveClass('kim')
    const bos = container.querySelector('li.balon[data-bos="true"]') as HTMLElement
    expect(bos).toHaveTextContent('Wie … es dir?')
    expect(container.querySelectorAll('li.balon[data-bos]')).toHaveLength(1)
  })
  it('ikinci şık seçilince balonda o şık ve onCevap', () => {
    const onCevap = vi.fn()
    const { container, rerender } = render(
      <CoktanSecmeli soru={diyalog} cevap={null} onCevap={onCevap} kilitli={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'gehst' }))
    expect(onCevap).toHaveBeenCalledWith({ tip: 'coktan-secmeli', secilen: 1 })
    rerender(
      <CoktanSecmeli soru={diyalog} cevap={{ tip: 'coktan-secmeli', secilen: 1 }} onCevap={onCevap} kilitli={false} />,
    )
    expect(container.querySelector('.bos-yer')).toHaveTextContent('gehst')
  })
  it('geht seçilince Wie geht es dir? görünür', () => {
    const { container } = render(
      <CoktanSecmeli soru={diyalog} cevap={{ tip: 'coktan-secmeli', secilen: 0 }} onCevap={() => {}} kilitli={false} />,
    )
    const bos = container.querySelector('li.balon[data-bos="true"]') as HTMLElement
    expect(bos.textContent).toContain('Wie geht es dir?')
    expect(bos.querySelector('.bos-yer')).toHaveTextContent('geht')
  })
  it('kilitliyken balon seçili şıkkı korur', () => {
    const { container } = render(
      <CoktanSecmeli soru={diyalog} cevap={{ tip: 'coktan-secmeli', secilen: 1 }} onCevap={() => {}} kilitli={true} />,
    )
    expect(container.querySelector('li.balon[data-bos="true"]')?.textContent).toContain('Wie gehst es dir?')
  })
  it('cevap null olunca (ipucu eledi) balon …', () => {
    const { container } = render(
      <CoktanSecmeli
        soru={diyalog}
        cevap={null}
        onCevap={() => {}}
        kilitli={false}
        ipucu={{ tur: 'ele', indeksler: [1] }}
      />,
    )
    expect(container.querySelector('.bos-yer')).toHaveTextContent('…')
  })
  it('GlossContext ile diyalog ve metin kelimeleri .gloss', () => {
    const d = render(
      <GlossContext.Provider value={{ sozluk }}>
        <CoktanSecmeli soru={diyalog} cevap={null} onCevap={() => {}} kilitli={false} />
      </GlossContext.Provider>,
    ).container
    expect(d.querySelector('.diyalog .gloss')).not.toBeNull()
    const m = render(
      <GlossContext.Provider value={{ sozluk }}>
        <CoktanSecmeli soru={metinli} cevap={null} onCevap={() => {}} kilitli={false} />
      </GlossContext.Provider>,
    ).container
    expect(m.querySelector('.soru-almanca .gloss')).not.toBeNull()
  })
  it('glossKapali: QuestionView üzerinden .gloss yok', () => {
    const goster = (kilitli: boolean) =>
      render(
        <SozlukContext.Provider value={() => sozluk}>
          <QuestionView
            soru={{ ...diyalog, glossKapali: true } as Question}
            cevap={null}
            onCevap={() => {}}
            kilitli={kilitli}
          />
        </SozlukContext.Provider>,
      ).container
    expect(goster(false).querySelector('.gloss')).toBeNull()
  })
})

import type { ArtikelQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { Gloss } from './Gloss'

const ARTIKELLER = ['der', 'die', 'das'] as const

export function Artikel({ soru, cevap, onCevap, kilitli, ipucu }: QuestionProps<ArtikelQuestion>) {
  const secilen = cevap?.tip === 'artikel' ? cevap.secilen : null
  const elenen = ipucu?.tur === 'ele' ? ipucu.indeksler : []
  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      <p className="ifade">___ <Gloss metin={soru.isim} /></p>
      <div className="secenekler">
        {ARTIKELLER.map((a, i) => (
          <button
            key={a}
            type="button"
            className={`secenek artikel-${a}${elenen.includes(i) ? ' elendi' : ''}`}
            data-artikel={a}
            aria-pressed={secilen === a}
            disabled={kilitli || elenen.includes(i)}
            onClick={() => onCevap({ tip: 'artikel', secilen: a })}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}

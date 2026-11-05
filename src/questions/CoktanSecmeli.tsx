import type { CoktanSecmeliQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { Gloss } from './Gloss'

export function CoktanSecmeli({ soru, cevap, onCevap, kilitli, ipucu }: QuestionProps<CoktanSecmeliQuestion>) {
  const secilen = cevap?.tip === 'coktan-secmeli' ? cevap.secilen : null
  const elenen = ipucu?.tur === 'ele' ? ipucu.indeksler : []
  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      <div className="secenekler">
        {soru.secenekler.map((s, i) => (
          <button
            key={i}
            type="button"
            className={elenen.includes(i) ? 'secenek elendi' : 'secenek'}
            aria-pressed={secilen === i}
            disabled={kilitli || elenen.includes(i)}
            onClick={() => onCevap({ tip: 'coktan-secmeli', secilen: i })}
          >
            <Gloss metin={s} odaklanabilir={false} />
          </button>
        ))}
      </div>
    </div>
  )
}

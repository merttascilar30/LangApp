import type { CoktanSecmeliQuestion } from '../content/schema'
import type { QuestionProps } from './types'

export function CoktanSecmeli({ soru, cevap, onCevap, kilitli }: QuestionProps<CoktanSecmeliQuestion>) {
  const secilen = cevap?.tip === 'coktan-secmeli' ? cevap.secilen : null
  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      <div className="secenekler">
        {soru.secenekler.map((s, i) => (
          <button
            key={i}
            type="button"
            className="secenek"
            aria-pressed={secilen === i}
            disabled={kilitli}
            onClick={() => onCevap({ tip: 'coktan-secmeli', secilen: i })}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

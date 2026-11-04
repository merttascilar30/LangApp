import type { DogruYanlisQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { Gloss } from './Gloss'

export function DogruYanlis({ soru, cevap, onCevap, kilitli }: QuestionProps<DogruYanlisQuestion>) {
  const secilen = cevap?.tip === 'dogru-yanlis' ? cevap.secilen : null
  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      <p className="ifade"><Gloss metin={soru.ifade} /></p>
      <div className="secenekler">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            className="secenek"
            aria-pressed={secilen === v}
            disabled={kilitli}
            onClick={() => onCevap({ tip: 'dogru-yanlis', secilen: v })}
          >
            {v ? 'Doğru' : 'Yanlış'}
          </button>
        ))}
      </div>
    </div>
  )
}

import type { BoslukDoldurmaQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { UmlautKeys, useUmlautInsert } from './UmlautKeys'

export function BoslukDoldurma({ soru, cevap, onCevap, kilitli }: QuestionProps<BoslukDoldurmaQuestion>) {
  const deger = cevap?.tip === 'bosluk-doldurma' ? cevap.metin : ''
  const yaz = (metin: string) => onCevap({ tip: 'bosluk-doldurma', metin })
  const { kapsayici, izle, insert } = useUmlautInsert((_, v) => yaz(v))
  const idx = soru.metin.indexOf('___')
  const once = idx >= 0 ? soru.metin.slice(0, idx) : soru.metin
  const sonra = idx >= 0 ? soru.metin.slice(idx + 3) : ''

  return (
    <div className="soru" ref={kapsayici} onFocusCapture={izle}>
      <p className="soru-metni">{soru.soru}</p>
      <p className="bosluk-cumle">
        {once}
        <input
          type="text"
          className="yazi-girdisi"
          aria-label="Boşluk"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={deger}
          disabled={kilitli}
          onChange={(e) => yaz(e.target.value)}
        />
        {sonra}
      </p>
      <UmlautKeys onInsert={insert} disabled={kilitli} />
    </div>
  )
}

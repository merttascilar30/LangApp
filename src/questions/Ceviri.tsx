import type { CeviriQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { UmlautKeys, useUmlautInsert } from './UmlautKeys'

export function Ceviri({ soru, cevap, onCevap, kilitli }: QuestionProps<CeviriQuestion>) {
  const deger = cevap?.tip === 'ceviri' ? cevap.metin : ''
  const yaz = (metin: string) => onCevap({ tip: 'ceviri', metin })
  const { kapsayici, izle, insert } = useUmlautInsert((_, v) => yaz(v))

  return (
    <div className="soru" ref={kapsayici} onFocusCapture={izle}>
      <p className="soru-metni">{soru.soru}</p>
      <p className="ceviri-kaynak">{soru.kaynak}</p>
      <input
        type="text"
        className="yazi-girdisi"
        aria-label="Çeviri"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        value={deger}
        disabled={kilitli}
        onChange={(e) => yaz(e.target.value)}
      />
      <UmlautKeys onInsert={insert} disabled={kilitli} />
    </div>
  )
}

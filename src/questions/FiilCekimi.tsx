import type { FiilCekimiQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { Gloss } from './Gloss'
import { UmlautKeys, useUmlautInsert } from './UmlautKeys'

export function FiilCekimi({ soru, cevap, onCevap, kilitli, ipucu }: QuestionProps<FiilCekimiQuestion>) {
  const n = soru.satirlar.length
  const mevcut = cevap?.tip === 'fiil-cekimi' ? cevap.hucreler : []
  const hucreler = Array.from({ length: n }, (_, i) => mevcut[i] ?? '')
  const kilitSatir = ipucu?.tur === 'hucre' ? ipucu.satir : -1
  const yaz = (i: number, v: string) => {
    const yeni = [...hucreler]
    yeni[i] = v
    onCevap({ tip: 'fiil-cekimi', hucreler: yeni })
  }
  const { kapsayici, izle, insert } = useUmlautInsert((el, v) => {
    const i = Number(el.dataset.satir)
    if (i !== kilitSatir) yaz(i, v)
  })

  return (
    <div className="soru" ref={kapsayici} onFocusCapture={izle}>
      <p className="soru-metni">{soru.soru}</p>
      <table className="fiil-tablosu">
        <thead>
          <tr>
            <th colSpan={2}><Gloss metin={soru.fiil} /></th>
          </tr>
        </thead>
        <tbody>
          {soru.satirlar.map((s, i) => (
            <tr key={i}>
              <th scope="row">{s.zamir}</th>
              <td>
                {s.verilen ? (
                  <span>{s.cevap}</span>
                ) : (
                  <input
                    type="text"
                    className={i === kilitSatir ? 'yazi-girdisi ipucu-kilitli' : 'yazi-girdisi'}
                    aria-label={s.zamir}
                    data-satir={i}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={hucreler[i]}
                    disabled={kilitli}
                    readOnly={i === kilitSatir}
                    aria-readonly={i === kilitSatir ? true : undefined}
                    onChange={(e) => {
                      if (i !== kilitSatir) yaz(i, e.target.value)
                    }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <UmlautKeys onInsert={insert} disabled={kilitli} />
    </div>
  )
}

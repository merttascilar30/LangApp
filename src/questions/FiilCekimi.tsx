import type { FiilCekimiQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { UmlautKeys, useUmlautInsert } from './UmlautKeys'

export function FiilCekimi({ soru, cevap, onCevap, kilitli }: QuestionProps<FiilCekimiQuestion>) {
  const n = soru.satirlar.length
  const mevcut = cevap?.tip === 'fiil-cekimi' ? cevap.hucreler : []
  const hucreler = Array.from({ length: n }, (_, i) => mevcut[i] ?? '')
  const yaz = (i: number, v: string) => {
    const yeni = [...hucreler]
    yeni[i] = v
    onCevap({ tip: 'fiil-cekimi', hucreler: yeni })
  }
  const { kapsayici, izle, insert } = useUmlautInsert((el, v) => yaz(Number(el.dataset.satir), v))

  return (
    <div className="soru" ref={kapsayici} onFocusCapture={izle}>
      <p className="soru-metni">{soru.soru}</p>
      <table className="fiil-tablosu">
        <thead>
          <tr>
            <th colSpan={2}>{soru.fiil}</th>
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
                    className="yazi-girdisi"
                    aria-label={s.zamir}
                    data-satir={i}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={hucreler[i]}
                    disabled={kilitli}
                    onChange={(e) => yaz(i, e.target.value)}
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

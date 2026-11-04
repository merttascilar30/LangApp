import { useMemo, useState } from 'react'
import type { EslestirmeQuestion } from '../content/schema'
import { createRng, hashString, shuffle } from '../domain/random'
import type { QuestionProps } from './types'

export function Eslestirme({ soru, cevap, onCevap, kilitli }: QuestionProps<EslestirmeQuestion>) {
  const [secili, setSecili] = useState<string | null>(null)
  const eslesme = cevap?.tip === 'eslestirme' ? cevap.eslesme : {}
  const sagListe = useMemo(
    () => shuffle(soru.ciftler.map((c) => c.sag), createRng(hashString(soru.id))),
    [soru.id, soru.ciftler],
  )
  const solSirasi = soru.ciftler.map((c) => c.sol)
  const numara = (sol: string) => solSirasi.indexOf(sol) + 1
  const solOf = (sag: string) => Object.keys(eslesme).find((k) => eslesme[k] === sag)

  const yayinla = (m: Record<string, string>) => onCevap({ tip: 'eslestirme', eslesme: m })

  const solTikla = (sol: string) => {
    if (sol in eslesme) {
      const kalan = { ...eslesme }
      delete kalan[sol]
      setSecili(null)
      yayinla(kalan)
    } else {
      setSecili(secili === sol ? null : sol)
    }
  }
  const sagTikla = (sag: string) => {
    if (secili === null || solOf(sag) !== undefined) return
    setSecili(null)
    yayinla({ ...eslesme, [secili]: sag })
  }

  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      <div className="eslestirme">
        <div className="eslestirme-kolon">
          {solSirasi.map((sol) => (
            <button
              key={sol}
              type="button"
              className="secenek"
              aria-pressed={secili === sol || sol in eslesme}
              disabled={kilitli}
              onClick={() => solTikla(sol)}
            >
              {sol}
              {sol in eslesme && (
                <span className="rozet" aria-hidden="true">
                  {numara(sol)}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="eslestirme-kolon">
          {sagListe.map((sag) => {
            const s = solOf(sag)
            return (
              <button
                key={sag}
                type="button"
                className="secenek"
                aria-pressed={s !== undefined}
                disabled={kilitli}
                onClick={() => sagTikla(sag)}
              >
                {sag}
                {s !== undefined && (
                  <span className="rozet" aria-hidden="true">
                    {numara(s)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

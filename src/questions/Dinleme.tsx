import { useMemo } from 'react'
import type { DinlemeQuestion } from '../content/schema'
import { createRng, hashString, shuffle } from '../domain/random'
import { speak } from '../speech/speech'
import type { QuestionProps } from './types'
import { UmlautKeys, useUmlautInsert } from './UmlautKeys'

export function Dinleme({ soru, cevap, onCevap, kilitli }: QuestionProps<DinlemeQuestion>) {
  const metin = cevap?.tip === 'dinleme' ? cevap.metin : ''
  const yaz = (m: string) => onCevap({ tip: 'dinleme', metin: m })
  const { kapsayici, izle, insert } = useUmlautInsert((_, v) => yaz(v))
  const secenekler = useMemo(
    () => shuffle(soru.secenekler ?? [], createRng(hashString(soru.id))),
    [soru.id, soru.secenekler],
  )

  return (
    <div className="soru" ref={kapsayici} onFocusCapture={izle}>
      <p className="soru-metni">{soru.soru}</p>
      <div className="dinleme-dugmeleri">
        <button type="button" className="secenek" aria-label="Dinle" onClick={() => speak(soru.okunacak)}>
          <span aria-hidden="true">🔊</span>
        </button>
        <button
          type="button"
          className="secenek"
          aria-label="Yavaş dinle"
          onClick={() => speak(soru.okunacak, { yavas: true })}
        >
          <span aria-hidden="true">🐢</span>
        </button>
      </div>
      {soru.mod === 'sec' ? (
        <div className="secenekler">
          {secenekler.map((s) => (
            <button
              key={s}
              type="button"
              className="secenek"
              aria-pressed={metin === s}
              disabled={kilitli}
              onClick={() => yaz(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <>
          <input
            type="text"
            className="yazi-girdisi"
            aria-label="Cevap"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={metin}
            disabled={kilitli}
            onChange={(e) => yaz(e.target.value)}
          />
          <UmlautKeys onInsert={insert} disabled={kilitli} />
        </>
      )}
    </div>
  )
}

import { useRef, useState } from 'react'
import type { Question } from '../content/schema'
import type { Answer } from '../domain/answers'
import { gradeQuestion } from '../domain/grading'
import { QuestionView } from '../questions/QuestionView'
import { FeedbackPanel } from './FeedbackPanel'

export type SoruSonucu = { soruId: string; dogru: boolean; cevap: Answer | null }

type Props = {
  sorular: Question[]
  mod: 'pratik' | 'sinav'
  onBitti: (sonuclar: SoruSonucu[]) => void
}

export function TestRunner({ sorular, mod, onBitti }: Props) {
  const [index, setIndex] = useState(0)
  const [cevaplar, setCevaplar] = useState<(Answer | null)[]>(() => sorular.map(() => null))
  const [kontrolEdildi, setKontrolEdildi] = useState<boolean[]>(() => sorular.map(() => false))
  const bitti = useRef(false)

  const soru = sorular[index]
  const cevap = cevaplar[index]
  const son = index === sorular.length - 1
  const pratik = mod === 'pratik'
  const kilitli = pratik && kontrolEdildi[index]

  const bitir = () => {
    if (bitti.current) return
    bitti.current = true
    onBitti(
      sorular.map((q, i) => ({
        soruId: q.id,
        dogru: gradeQuestion(q, cevaplar[i]),
        cevap: cevaplar[i],
      })),
    )
  }

  const onCevap = (a: Answer) => {
    if (kilitli) return
    setCevaplar((c) => c.map((x, i) => (i === index ? a : x)))
  }

  const kontrolEt = () => {
    if (kilitli || cevap === null) return
    setKontrolEdildi((k) => k.map((x, i) => (i === index ? true : x)))
  }

  const bitirSinav = () => {
    const bos = cevaplar.filter((c) => c === null).length
    if (bos > 0 && !window.confirm(`${bos} soru cevapsız. Yine de bitir?`)) return
    bitir()
  }

  return (
    <div className="test-runner">
      <p className="ilerleme">{`Soru ${index + 1} / ${sorular.length}`}</p>
      <QuestionView key={soru.id} soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
      {pratik ? (
        <>
          {kilitli ? (
            <>
              <FeedbackPanel dogru={gradeQuestion(soru, cevap)} soru={soru} />
              <button
                type="button"
                onClick={() => (son ? bitir() : setIndex(index + 1))}
              >
                Devam
              </button>
            </>
          ) : (
            <button type="button" disabled={cevap === null} onClick={kontrolEt}>
              Kontrol et
            </button>
          )}
        </>
      ) : (
        <div className="test-nav">
          <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Geri
          </button>
          <button type="button" disabled={son} onClick={() => setIndex(index + 1)}>
            İleri
          </button>
          <button type="button" onClick={bitirSinav}>
            Bitir
          </button>
        </div>
      )}
    </div>
  )
}

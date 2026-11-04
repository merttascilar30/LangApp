import type { ReactNode } from 'react'
import type { Question } from '../content/schema'
import { correctAnswerText, scorePercent } from '../domain/grading'
import { speak } from '../speech/speech'
import type { SoruSonucu } from './TestRunner'

type Props = {
  sorular: Question[]
  sonuclar: SoruSonucu[]
  gecmeNotu: number
  baslik: string
  children?: ReactNode
}

export function ResultsView({ sorular, sonuclar, gecmeNotu, baslik, children }: Props) {
  const dogru = sonuclar.filter((s) => s.dogru).length
  const yuzde = scorePercent(dogru, sorular.length)
  const gecti = yuzde >= gecmeNotu
  return (
    <section className="sonuc">
      <h2>{baslik}</h2>
      <p className="skor">{`${dogru} / ${sorular.length} (%${Math.floor(yuzde)})`}</p>
      <p className={gecti ? 'ok' : 'hata'}>{gecti ? 'Geçti' : 'Kaldı'}</p>
      {children}
      <ul className="sonuc-listesi">
        {sorular.map((q, i) => {
          const ok = sonuclar[i]?.dogru ?? false
          const sesli = q.tip !== 'dogru-yanlis' && q.tip !== 'eslestirme'
          const metin = correctAnswerText(q)
          return (
            <li key={q.id} className={ok ? 'ok' : 'hata'}>
              <span aria-label={ok ? 'Doğru' : 'Yanlış'}>{ok ? '✓' : '✗'}</span> {q.soru}
              <div>
                Doğru cevap: {metin}{' '}
                {sesli && (
                  <button type="button" aria-label="Dinle" onClick={() => speak(metin)}>
                    🔊
                  </button>
                )}
              </div>
              <div className="aciklama">{q.aciklama}</div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

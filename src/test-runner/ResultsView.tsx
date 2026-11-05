import type { ReactNode } from 'react'
import type { Question } from '../content/schema'
import { celdiriciNotu, correctAnswerText, doluCumle, scorePercent } from '../domain/grading'
import { speak } from '../speech/speech'
import { NotMetni } from './NotMetni'
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
          const dolu = doluCumle(q)
          const not = celdiriciNotu(q, sonuclar[i]?.cevap ?? null)
          return (
            <li key={q.id} className={ok ? 'ok' : 'hata'}>
              <span aria-label={ok ? 'Doğru' : 'Yanlış'}>{ok ? '✓' : '✗'}</span> {q.soru}
              {q.tip === 'coktan-secmeli' && dolu !== null && (
                <div className="dolu-cumle" lang="de">
                  {q.metin !== undefined ? (
                    <p>{dolu}</p>
                  ) : (
                    q.diyalog?.map((s, j) => <p key={j}>{`${s.kim}: ${s.metin.split('___').join(q.secenekler[q.dogru] ?? '')}`}</p>)
                  )}
                </div>
              )}
              <div>
                Doğru cevap: {metin}{' '}
                {sesli && (
                  <button type="button" aria-label="Dinle" onClick={() => speak(dolu ?? metin)}>
                    🔊
                  </button>
                )}
              </div>
              {not && <div className="celdirici-notu">Neden olmadı: <NotMetni metin={not} /></div>}
              <div className="aciklama">{q.aciklama}</div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

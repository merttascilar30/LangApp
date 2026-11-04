import type { Question } from '../content/schema'
import { correctAnswerText } from '../domain/grading'

export function FeedbackPanel({ dogru, soru }: { dogru: boolean; soru: Question }) {
  return (
    <div role="status" className={`geri-bildirim ${dogru ? 'ok' : 'hata'}`}>
      <strong>{dogru ? 'Doğru!' : 'Yanlış'}</strong>
      <p>Doğru cevap: {correctAnswerText(soru)}</p>
      <p>{soru.aciklama}</p>
    </div>
  )
}

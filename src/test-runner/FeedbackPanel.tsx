import type { Question } from '../content/schema'
import { correctAnswerText } from '../domain/grading'

export function FeedbackPanel({ dogru, soru, ipucuyla }: { dogru: boolean; soru: Question; ipucuyla?: boolean }) {
  return (
    <div role="status" className={`geri-bildirim ${dogru ? 'ok' : 'hata'}`}>
      <strong>{dogru ? 'Doğru!' : 'Yanlış'}</strong>
      {ipucuyla && <p>💡 İpucuyla çözüldü</p>}
      <p>Doğru cevap: {correctAnswerText(soru)}</p>
      <p>{soru.aciklama}</p>
    </div>
  )
}

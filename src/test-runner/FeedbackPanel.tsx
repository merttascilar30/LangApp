import type { Question } from '../content/schema'
import type { Answer } from '../domain/answers'
import { NotMetni } from './NotMetni'
import { celdiriciNotu, correctAnswerText } from '../domain/grading'

export function FeedbackPanel({
  dogru,
  soru,
  ipucuyla,
  cevap,
}: {
  dogru: boolean
  soru: Question
  ipucuyla?: boolean
  cevap?: Answer | null
}) {
  const not = celdiriciNotu(soru, cevap ?? null)
  return (
    <div role="status" className={`geri-bildirim ${dogru ? 'ok' : 'hata'}`}>
      <strong>{dogru ? 'Doğru!' : 'Yanlış'}</strong>
      {ipucuyla && <p>💡 İpucuyla çözüldü</p>}
      <p>Doğru cevap: {correctAnswerText(soru)}</p>
      {not && (
        <p className="celdirici-notu">
          Neden olmadı: <NotMetni metin={not} />
        </p>
      )}
      <p>{soru.aciklama}</p>
    </div>
  )
}

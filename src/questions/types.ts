import type { Question } from '../content/schema'
import type { Answer } from '../domain/answers'
import type { AutoHint } from '../domain/hints'

export type QuestionProps<Q extends Question> = {
  soru: Q
  cevap: Answer | null
  onCevap: (a: Answer) => void
  kilitli: boolean
  /** Uygulanmış otomatik ipucu (kademe 2). */
  ipucu?: AutoHint | null
}

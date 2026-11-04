import type { Question } from '../content/schema'
import type { Answer } from '../domain/answers'

export type QuestionProps<Q extends Question> = {
  soru: Q
  cevap: Answer | null
  onCevap: (a: Answer) => void
  kilitli: boolean
}

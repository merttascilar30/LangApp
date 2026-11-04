import { shuffle } from './random'
import type { ProgressState } from './progress'

export function cardBox(s: ProgressState, key: string): 1 | 2 | 3 {
  return s.kartlar[key] ?? 1
}

export function applyCard(s: ProgressState, key: string, biliyorum: boolean): ProgressState {
  const box = cardBox(s, key)
  const next: 1 | 2 | 3 = biliyorum ? (Math.min(box + 1, 3) as 1 | 2 | 3) : 1
  return { ...s, kartlar: { ...s.kartlar, [key]: next } }
}

export function buildDeck(keys: string[], s: ProgressState, rng: () => number): string[] {
  const deck: string[] = []
  for (const key of new Set(keys)) {
    const times = 4 - cardBox(s, key)
    for (let i = 0; i < times; i++) deck.push(key)
  }
  return shuffle(deck, rng)
}

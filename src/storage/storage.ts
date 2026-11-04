import { z } from 'zod'
import { emptyProgress, type ProgressState } from '../domain/progress'

export const STORAGE_KEY = 'langapp:v1'

export const progressSchema = z.object({
  surum: z.literal(1),
  sinavlar: z.record(z.object({ enIyi: z.number(), deneme: z.number(), gecti: z.boolean() })),
  partlar: z.record(z.object({ enIyi: z.number(), izlendi: z.boolean() })),
  defter: z.record(z.object({ ardisikDogru: z.number() })),
  kartlar: z.record(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  ayarlar: z.object({ ttsUyariGosterildi: z.boolean() }),
})

// Compile-time: şema ile ProgressState birebir uyumlu olmalı.
type Inferred = z.infer<typeof progressSchema>
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const _sema1: Equal<Inferred, ProgressState> = true
void _sema1

export type LoadDurum = 'ok' | 'bos' | 'bozuk' | 'erisilemez'

export function loadProgress(store?: Pick<Storage, 'getItem'>): {
  state: ProgressState
  durum: LoadDurum
} {
  let raw: string | null
  try {
    const s = store ?? window.localStorage
    raw = s.getItem(STORAGE_KEY)
  } catch {
    return { state: emptyProgress(), durum: 'erisilemez' }
  }
  if (raw === null) return { state: emptyProgress(), durum: 'bos' }
  try {
    const parsed = progressSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return { state: parsed.data, durum: 'ok' }
  } catch {
    // bozuk JSON
  }
  return { state: emptyProgress(), durum: 'bozuk' }
}

export function saveProgress(state: ProgressState, store?: Pick<Storage, 'setItem'>): boolean {
  try {
    const s = store ?? window.localStorage
    s.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2)
}

export function parseImport(
  text: string,
): { ok: true; state: ProgressState } | { ok: false; hata: string } {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, hata: 'Dosya geçerli bir JSON değil.' }
  }
  const parsed = progressSchema.safeParse(json)
  if (!parsed.success) {
    return {
      ok: false,
      hata: 'Dosya bu uygulamanın ilerleme dosyası değil veya sürümü uyumsuz.',
    }
  }
  return { ok: true, state: parsed.data }
}

export function clearProgress(store?: Pick<Storage, 'removeItem'>): void {
  try {
    const s = store ?? window.localStorage
    s.removeItem(STORAGE_KEY)
  } catch {
    // yut
  }
}

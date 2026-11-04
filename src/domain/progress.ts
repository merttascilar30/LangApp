export type ProgressState = {
  surum: 1
  sinavlar: Record<string, { enIyi: number; deneme: number; gecti: boolean }>
  partlar: Record<string, { enIyi: number; izlendi: boolean }>
  defter: Record<string, { ardisikDogru: number }>
  kartlar: Record<string, 1 | 2 | 3>
  ayarlar: { ttsUyariGosterildi: boolean }
}

export const PART_GECME = 70

export function emptyProgress(): ProgressState {
  return {
    surum: 1,
    sinavlar: {},
    partlar: {},
    defter: {},
    kartlar: {},
    ayarlar: { ttsUyariGosterildi: false },
  }
}

export function recordPartTest(s: ProgressState, partId: string, yuzde: number): ProgressState {
  const prev = s.partlar[partId]
  const next = prev
    ? { ...prev, enIyi: Math.max(prev.enIyi, yuzde) }
    : { enIyi: yuzde, izlendi: false }
  return { ...s, partlar: { ...s.partlar, [partId]: next } }
}

export function setWatched(s: ProgressState, partId: string, izlendi: boolean): ProgressState {
  const prev = s.partlar[partId] ?? { enIyi: 0, izlendi: false }
  return { ...s, partlar: { ...s.partlar, [partId]: { ...prev, izlendi } } }
}

export function recordExam(
  s: ProgressState,
  modulId: string,
  yuzde: number,
  gecmeNotu: number,
): ProgressState {
  const prev = s.sinavlar[modulId] ?? { enIyi: 0, deneme: 0, gecti: false }
  const next = {
    enIyi: Math.max(prev.enIyi, yuzde),
    deneme: prev.deneme + 1,
    gecti: prev.gecti || yuzde >= gecmeNotu,
  }
  return { ...s, sinavlar: { ...s.sinavlar, [modulId]: next } }
}

export function isModuleUnlocked(
  siraliModulIds: string[],
  modulId: string,
  s: ProgressState,
): boolean {
  const i = siraliModulIds.indexOf(modulId)
  if (i < 0) return false
  if (i === 0) return true
  return s.sinavlar[siraliModulIds[i - 1]]?.gecti === true
}

export function applyAnswer(s: ProgressState, soruId: string, dogru: boolean): ProgressState {
  if (!dogru) return { ...s, defter: { ...s.defter, [soruId]: { ardisikDogru: 0 } } }
  const prev = s.defter[soruId]
  if (!prev) return { ...s, defter: { ...s.defter } }
  const n = prev.ardisikDogru + 1
  const defter = { ...s.defter }
  if (n >= 2) delete defter[soruId]
  else defter[soruId] = { ardisikDogru: n }
  return { ...s, defter }
}

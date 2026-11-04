import { describe, expect, it } from 'vitest'
import {
  PART_GECME,
  applyAnswer,
  emptyProgress,
  isModuleUnlocked,
  recordExam,
  recordPartTest,
  setWatched,
} from '../../src/domain/progress'

describe('recordPartTest', () => {
  it('en iyi sonucu tutar ve izlendi korunur', () => {
    let s = setWatched(emptyProgress(), 'p1', true)
    s = recordPartTest(s, 'p1', 60)
    s = recordPartTest(s, 'p1', 80)
    s = recordPartTest(s, 'p1', 70)
    expect(s.partlar['p1']).toEqual({ enIyi: 80, izlendi: true })
  })
  it('bilinmeyen part için izlendi false oluşturur', () => {
    const s = recordPartTest(emptyProgress(), 'p9', 50)
    expect(s.partlar['p9']).toEqual({ enIyi: 50, izlendi: false })
  })
  it('PART_GECME 70', () => expect(PART_GECME).toBe(70))
})

describe('setWatched', () => {
  it('bilinmeyen part için enIyi 0 oluşturur', () => {
    const s = setWatched(emptyProgress(), 'p1', true)
    expect(s.partlar['p1']).toEqual({ enIyi: 0, izlendi: true })
  })
  it('enIyi korunur', () => {
    let s = recordPartTest(emptyProgress(), 'p1', 90)
    s = setWatched(s, 'p1', true)
    expect(s.partlar['p1']).toEqual({ enIyi: 90, izlendi: true })
  })
})

describe('recordExam', () => {
  it('gecti yapışkandır', () => {
    let s = recordExam(emptyProgress(), 'modul-1', 79, 80)
    expect(s.sinavlar['modul-1']).toEqual({ enIyi: 79, deneme: 1, gecti: false })
    s = recordExam(s, 'modul-1', 85, 80)
    expect(s.sinavlar['modul-1']).toEqual({ enIyi: 85, deneme: 2, gecti: true })
    s = recordExam(s, 'modul-1', 50, 80)
    expect(s.sinavlar['modul-1']).toEqual({ enIyi: 85, deneme: 3, gecti: true })
  })
})

describe('isModuleUnlocked', () => {
  const ids = ['modul-1', 'modul-2']
  it('ilk modül açık, ikinci kilitli', () => {
    const s = emptyProgress()
    expect(isModuleUnlocked(ids, 'modul-1', s)).toBe(true)
    expect(isModuleUnlocked(ids, 'modul-2', s)).toBe(false)
  })
  it('önceki geçilince açılır', () => {
    const s = recordExam(emptyProgress(), 'modul-1', 90, 80)
    expect(isModuleUnlocked(ids, 'modul-2', s)).toBe(true)
  })
  it('listede olmayan modül kilitli', () => {
    expect(isModuleUnlocked(ids, 'x', emptyProgress())).toBe(false)
  })
})

describe('applyAnswer', () => {
  it('yanlış deftere ekler, iki doğru siler', () => {
    let s = applyAnswer(emptyProgress(), 'q', false)
    expect(s.defter['q']).toEqual({ ardisikDogru: 0 })
    s = applyAnswer(s, 'q', true)
    expect(s.defter['q']).toEqual({ ardisikDogru: 1 })
    s = applyAnswer(s, 'q', true)
    expect(s.defter['q']).toBeUndefined()
  })
  it('doğru-yanlış-doğru → 1', () => {
    let s = applyAnswer(emptyProgress(), 'q', false)
    s = applyAnswer(s, 'q', true)
    s = applyAnswer(s, 'q', false)
    s = applyAnswer(s, 'q', true)
    expect(s.defter['q']).toEqual({ ardisikDogru: 1 })
  })
  it('defterde olmayan doğru cevap defteri değiştirmez', () => {
    const s = applyAnswer(emptyProgress(), 'q', true)
    expect(s.defter).toEqual({})
  })
  it('girdiyi değiştirmez', () => {
    const s = emptyProgress()
    const snap = JSON.stringify(s)
    applyAnswer(s, 'q', false)
    recordPartTest(s, 'p', 50)
    recordExam(s, 'm', 90, 80)
    setWatched(s, 'p', true)
    expect(JSON.stringify(s)).toBe(snap)
  })
})

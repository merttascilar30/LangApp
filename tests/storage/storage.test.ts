import { describe, expect, it } from 'vitest'
import { emptyProgress, type ProgressState } from '../../src/domain/progress'
import {
  STORAGE_KEY,
  clearProgress,
  exportProgress,
  loadProgress,
  parseImport,
  saveProgress,
} from '../../src/storage/storage'

function fakeStore() {
  const data: Record<string, string> = {}
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v
    },
    removeItem: (k: string) => {
      delete data[k]
    },
  }
}

function sample(): ProgressState {
  return {
    surum: 1,
    sinavlar: { m1: { enIyi: 80, deneme: 2, gecti: true } },
    partlar: { p1: { enIyi: 90, izlendi: true } },
    defter: { s1: { ardisikDogru: 1 } },
    kartlar: { k1: 2, k2: 3 },
    ayarlar: { ttsUyariGosterildi: true },
  }
}

describe('storage', () => {
  it('key', () => {
    expect(STORAGE_KEY).toBe('langapp:v1')
  })

  it('kayıt yok -> bos', () => {
    const r = loadProgress(fakeStore())
    expect(r.durum).toBe('bos')
    expect(r.state).toEqual(emptyProgress())
  })

  it('save -> load gidiş-dönüş', () => {
    const s = fakeStore()
    expect(saveProgress(sample(), s)).toBe(true)
    const r = loadProgress(s)
    expect(r.durum).toBe('ok')
    expect(r.state).toEqual(sample())
  })

  it('export -> parseImport gidiş-dönüş', () => {
    const text = exportProgress(sample())
    expect(text).toBe(JSON.stringify(sample(), null, 2))
    const r = parseImport(text)
    expect(r).toEqual({ ok: true, state: sample() })
  })

  it('bozuk JSON -> bozuk', () => {
    const s = fakeStore()
    s.data[STORAGE_KEY] = '{xyz'
    const r = loadProgress(s)
    expect(r.durum).toBe('bozuk')
    expect(r.state).toEqual(emptyProgress())
  })

  it('şemaya uymayan veri -> bozuk', () => {
    const s = fakeStore()
    s.data[STORAGE_KEY] = JSON.stringify({ surum: 1 })
    expect(loadProgress(s).durum).toBe('bozuk')
    s.data[STORAGE_KEY] = JSON.stringify({ ...sample(), kartlar: { k: 4 } })
    expect(loadProgress(s).durum).toBe('bozuk')
  })

  it('getItem exception -> erisilemez', () => {
    const r = loadProgress({
      getItem: () => {
        throw new Error('x')
      },
    })
    expect(r.durum).toBe('erisilemez')
    expect(r.state).toEqual(emptyProgress())
  })

  it('setItem exception -> false', () => {
    expect(
      saveProgress(sample(), {
        setItem: () => {
          throw new Error('quota')
        },
      }),
    ).toBe(false)
  })

  it('clearProgress siler ve exception yutar', () => {
    const s = fakeStore()
    saveProgress(sample(), s)
    clearProgress(s)
    expect(s.data[STORAGE_KEY]).toBeUndefined()
    expect(() =>
      clearProgress({
        removeItem: () => {
          throw new Error('x')
        },
      }),
    ).not.toThrow()
  })

  it.each([
    ['{"surum":2,"sinavlar":{},"partlar":{},"defter":{},"kartlar":{},"ayarlar":{"ttsUyariGosterildi":false}}'],
    ['{"surum":1}'],
    ['xyz'],
  ])('parseImport reddeder: %s', (text) => {
    const r = parseImport(text)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.hata.length).toBeGreaterThan(0)
      expect(r.hata).toMatch(/Dosya/)
    }
  })

  it('varsayılan store window.localStorage', () => {
    window.localStorage.clear()
    expect(saveProgress(sample())).toBe(true)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(sample()))
    expect(loadProgress().durum).toBe('ok')
    clearProgress()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

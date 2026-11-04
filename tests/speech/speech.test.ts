import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectGermanVoice, speak } from '../../src/speech/speech'

type G = Record<string, unknown>
const g = globalThis as unknown as G
const w = window as unknown as G

function voice(lang: string) {
  return { lang, name: lang } as SpeechSynthesisVoice
}

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  voice: SpeechSynthesisVoice | null = null
  constructor(text: string) {
    this.text = text
  }
}

function installSynth(voices: SpeechSynthesisVoice[]) {
  const listeners = new Map<string, Set<() => void>>()
  const synth = {
    voices,
    getVoices: vi.fn(function (this: unknown) {
      return synth.voices
    }),
    speak: vi.fn(),
    cancel: vi.fn(),
    addEventListener: vi.fn((t: string, cb: () => void) => {
      if (!listeners.has(t)) listeners.set(t, new Set())
      listeners.get(t)!.add(cb)
    }),
    removeEventListener: vi.fn((t: string, cb: () => void) => {
      listeners.get(t)?.delete(cb)
    }),
    emit(t: string) {
      listeners.get(t)?.forEach((cb) => cb())
    },
    count(t: string) {
      return listeners.get(t)?.size ?? 0
    },
  }
  w.speechSynthesis = synth
  w.SpeechSynthesisUtterance = FakeUtterance
  g.SpeechSynthesisUtterance = FakeUtterance
  return synth
}

describe('speech', () => {
  let origSynth: unknown
  let origUtt: unknown
  let origGUtt: unknown
  beforeEach(() => {
    origSynth = w.speechSynthesis
    origUtt = w.SpeechSynthesisUtterance
    origGUtt = g.SpeechSynthesisUtterance
  })
  afterEach(() => {
    w.speechSynthesis = origSynth
    w.SpeechSynthesisUtterance = origUtt
    g.SpeechSynthesisUtterance = origGUtt
    vi.useRealTimers()
  })

  it('de-DE sesi varken true', async () => {
    installSynth([voice('en-US'), voice('de-DE')])
    expect(await detectGermanVoice()).toBe(true)
  })

  it('de_DE ve de-AT gibi varyantlar kabul edilir', async () => {
    installSynth([voice('DE_de')])
    expect(await detectGermanVoice()).toBe(true)
  })

  it('yalnızca en-US ise false (ses listesi dolu, hemen karar)', async () => {
    installSynth([voice('en-US')])
    expect(await detectGermanVoice()).toBe(false)
  })

  it('speechSynthesis undefined ise false', async () => {
    w.speechSynthesis = undefined
    expect(await detectGermanVoice()).toBe(false)
  })

  it('ses listesi boşsa voiceschanged bekler ve dinleyiciyi kaldırır', async () => {
    const synth = installSynth([])
    const p = detectGermanVoice()
    expect(synth.count('voiceschanged')).toBe(1)
    synth.voices = [voice('de-DE')]
    synth.emit('voiceschanged')
    expect(await p).toBe(true)
    expect(synth.count('voiceschanged')).toBe(0)
  })

  it('voiceschanged gelmezse zaman aşımında false', async () => {
    vi.useFakeTimers()
    const synth = installSynth([])
    const p = detectGermanVoice(1500)
    await vi.advanceTimersByTimeAsync(1500)
    expect(await p).toBe(false)
    expect(synth.count('voiceschanged')).toBe(0)
  })

  it("speak('Hallo',{yavas:true}) rate 0.7 ve lang de-DE", () => {
    const synth = installSynth([voice('en-US'), voice('de-DE')])
    speak('Hallo', { yavas: true })
    expect(synth.cancel).toHaveBeenCalledTimes(1)
    expect(synth.speak).toHaveBeenCalledTimes(1)
    expect(synth.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      synth.speak.mock.invocationCallOrder[0],
    )
    const u = synth.speak.mock.calls[0][0] as FakeUtterance
    expect(u.text).toBe('Hallo')
    expect(u.rate).toBe(0.7)
    expect(u.lang).toBe('de-DE')
    expect(u.voice?.lang).toBe('de-DE')
  })

  it('yavas yoksa rate 1; Almanca ses yoksa voice atanmaz', () => {
    const synth = installSynth([voice('en-US')])
    speak('Hallo')
    const u = synth.speak.mock.calls[0][0] as FakeUtterance
    expect(u.rate).toBe(1)
    expect(u.voice).toBeNull()
  })

  it('speechSynthesis yoksa speak sessizce hiçbir şey yapmaz', () => {
    w.speechSynthesis = undefined
    expect(() => speak('Hallo')).not.toThrow()
  })
})

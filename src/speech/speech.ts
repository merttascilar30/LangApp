// Web Speech API ile Almanca metin okuma sarmalayıcısı.
// speechSynthesis tembel erişilir (modül yüklenirken değil), böylece testler mock kurabilir.

function getSynth(): SpeechSynthesis | undefined {
  if (typeof window === 'undefined') return undefined
  return window.speechSynthesis ?? undefined
}

function findGermanVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const isGerman = (v: SpeechSynthesisVoice) => /^de([-_]|$)/i.test(v.lang)
  return (
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === 'de-de') ??
    voices.find(isGerman)
  )
}

export function detectGermanVoice(timeoutMs = 1500): Promise<boolean> {
  const synth = getSynth()
  if (!synth) return Promise.resolve(false)

  const decide = () => findGermanVoice(synth.getVoices()) !== undefined
  if (synth.getVoices().length > 0) return Promise.resolve(decide())

  return new Promise<boolean>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = () => {
      if (timer !== undefined) clearTimeout(timer)
      synth.removeEventListener('voiceschanged', finish)
      resolve(decide())
    }
    synth.addEventListener('voiceschanged', finish)
    timer = setTimeout(finish, timeoutMs)
  })
}

export function speak(text: string, opts?: { yavas?: boolean }): void {
  const synth = getSynth()
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = opts?.yavas ? 0.7 : 1
  const voice = findGermanVoice(synth.getVoices())
  if (voice) utterance.voice = voice

  synth.cancel()
  synth.speak(utterance)
}

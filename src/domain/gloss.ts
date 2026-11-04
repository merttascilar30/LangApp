export type GlossToken = { metin: string; anlam?: string }

const PUNCT = /^[.,!?;:"'()]+|[.,!?;:"'()]+$/g

function normalize(s: string): string {
  return s.replace(PUNCT, '').toLowerCase()
}

function buildIndex(...kaynaklar: (Record<string, string> | undefined)[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const kaynak of kaynaklar) {
    if (!kaynak) continue
    const kendi = new Map<string, string>()
    const turemis = new Map<string, string>()
    for (const [anahtar, anlam] of Object.entries(kaynak)) {
      const k = normalize(anahtar)
      kendi.set(k, anlam)
      const m = /^(?:der|die|das)\s+(.+)$/.exec(k)
      if (m) turemis.set(m[1], anlam)
    }
    // Kaynak içinde açık anahtar > artikelden türeyen; sonraki kaynak öncekini ezer.
    for (const [k, v] of turemis) index.set(k, v)
    for (const [k, v] of kendi) index.set(k, v)
  }
  return index
}

export function glossTokens(
  metin: string,
  sozluk: Record<string, string>,
  sozlukEk?: Record<string, string>,
): GlossToken[] {
  const index = buildIndex(sozluk, sozlukEk)
  return metin
    .split(/(\s+)/)
    .filter((p) => p !== '')
    .map((p) => {
      if (/^\s+$/.test(p) || p.includes('___')) return { metin: p }
      const k = normalize(p)
      const anlam = k === '' ? undefined : index.get(k)
      return anlam === undefined ? { metin: p } : { metin: p, anlam }
    })
}

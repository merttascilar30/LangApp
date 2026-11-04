const UMLAUTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
  Ä: 'Ae',
  Ö: 'Oe',
  Ü: 'Ue',
  ẞ: 'SS',
}

export function normalizeAnswer(s: string, harfDuyarli = false): string {
  let r = s.trim().replace(/\s+/g, ' ')
  r = r.replace(/[.!?]+$/, '').replace(/,/g, '')
  r = r.replace(/[äöüßÄÖÜẞ]/g, (c) => UMLAUTS[c])
  r = r.replace(/\s+/g, ' ').trim()
  return harfDuyarli ? r : r.toLowerCase()
}

export function matchesAny(input: string, accepted: string[], harfDuyarli = false): boolean {
  const n = normalizeAnswer(input, harfDuyarli)
  return accepted.some((a) => normalizeAnswer(a, harfDuyarli) === n)
}

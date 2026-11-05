import { describe, expect, it } from 'vitest'
import { glossTokens } from '../../src/domain/gloss'

const join = (t: { metin: string }[]) => t.map((x) => x.metin).join('')

describe('glossTokens', () => {
  it('tokenlar birleşince orijinal; anlamlar eşleşir', () => {
    const t = glossTokens('Wie geht es dir?', { geht: 'gidiyor', dir: 'sana' })
    expect(join(t)).toBe('Wie geht es dir?')
    expect(t.find((x) => x.metin === 'geht')?.anlam).toBe('gidiyor')
    expect(t.find((x) => x.metin === 'dir?')?.anlam).toBe('sana')
    expect(t.find((x) => x.metin === 'Wie')?.anlam).toBeUndefined()
  })
  it('büyük/küçük harf duyarsız', () => {
    expect(glossTokens('morgen', { Morgen: 'sabah' })[0].anlam).toBe('sabah')
  })
  it('artikelli anahtar artiksiz de eşleşir', () => {
    const t = glossTokens('Guten Morgen!', { 'der Morgen': 'sabah' })
    expect(t.find((x) => x.metin === 'Morgen!')?.anlam).toBe('sabah')
  })
  it('sozlukEk sözlüğü ezer', () => {
    expect(glossTokens('geht', { geht: 'gidiyor' }, { geht: 'gider' })[0].anlam).toBe('gider')
  })
  it('___ anlam almaz; ardışık boşluklar korunur', () => {
    const t = glossTokens('Ich ___ Anna.', { '___': 'x', ich: 'ben' })
    expect(t.find((x) => x.metin === '___')?.anlam).toBeUndefined()
    expect(join(glossTokens('a  b', {}))).toBe('a  b')
  })
  it('boş sözlük -> anlamsız', () => {
    expect(glossTokens('Wie geht es dir?', {}).every((x) => x.anlam === undefined)).toBe(true)
  })
})

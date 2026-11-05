import { describe, expect, it } from 'vitest'
import { contentFiles } from '../../src/content/files'

describe('contentFiles', () => {
  const keys = Object.keys(contentFiles)

  it('loads only modules.json and modul-*/*.json', () => {
    expect(keys).toContain('/content/modules.json')
    expect(keys).toContain('/content/modul-1/ders-01.json')
    for (const k of keys) {
      expect(k).not.toContain('almanca_')
      expect(k).not.toContain('ders-haritasi')
      expect(k === '/content/modules.json' || /^\/content\/modul-[^/]+\/[^/]+\.json$/.test(k)).toBe(true)
    }
  })
})

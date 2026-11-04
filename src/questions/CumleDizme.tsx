import { useMemo } from 'react'
import type { CumleDizmeQuestion } from '../content/schema'
import { createRng, hashString, shuffle } from '../domain/random'
import type { QuestionProps } from './types'
import { Gloss } from './Gloss'

export function CumleDizme({ soru, cevap, onCevap, kilitli, ipucu }: QuestionProps<CumleDizmeQuestion>) {
  const sira = cevap?.tip === 'cumle-dizme' ? cevap.sira : []
  const yayinla = (s: string[]) => onCevap({ tip: 'cumle-dizme', sira: s })

  // Tekrarlayan parçalar olabilir: indeksle izle; sira'dan ilk kullanılmamış eşit indeksi eşle.
  const kullanilan = useMemo(() => {
    const used = new Set<number>()
    return sira.map((tok) => {
      const i = soru.parcalar.findIndex((p, k) => p === tok && !used.has(k))
      if (i >= 0) used.add(i)
      return i
    })
  }, [sira, soru.parcalar])

  const karisik = useMemo(
    () => shuffle(soru.parcalar.map((_, i) => i), createRng(hashString(soru.id))),
    [soru.id, soru.parcalar],
  )
  const kullanilanKume = new Set(kullanilan)
  const havuz = karisik.filter((i) => !kullanilanKume.has(i))

  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      <div className="cevap-satiri" data-testid="cevap-satiri">
        {sira.map((tok, pos) => {
          const kilitliParca = pos === 0 && ipucu?.tur === 'ilkParca'
          return (
          <button
            key={`${pos}-${kullanilan[pos]}`}
            type="button"
            className={kilitliParca ? 'cip secili ipucu-kilitli' : 'cip secili'}
            disabled={kilitli}
            aria-disabled={kilitliParca ? true : undefined}
            onClick={() => {
              if (kilitliParca) return
              yayinla(sira.filter((_, p) => p !== pos))
            }}
          >
            <Gloss metin={tok} odaklanabilir={false} />
          </button>
          )
        })}
      </div>
      <div className="cip-havuzu" data-testid="cip-havuzu">
        {havuz.map((i) => (
          <button
            key={i}
            type="button"
            className="cip"
            disabled={kilitli}
            onClick={() => yayinla([...sira, soru.parcalar[i]])}
          >
            <Gloss metin={soru.parcalar[i]} odaklanabilir={false} />
          </button>
        ))}
      </div>
    </div>
  )
}

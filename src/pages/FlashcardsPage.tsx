import { useMemo, useState } from 'react'
import type { z } from 'zod'
import type { kelimeSchema } from '../content/schema'
import { isModuleUnlocked } from '../domain/progress'
import { applyCard, buildDeck, cardBox } from '../domain/leitner'
import { createRng } from '../domain/random'
import { speak } from '../speech/speech'
import { useAppState } from '../state/AppState'

type Kelime = z.infer<typeof kelimeSchema>

const TUM = 'tum'

export function FlashcardsPage() {
  const { moduller, progress, update } = useAppState()
  const [kapsam, setKapsam] = useState(TUM)
  const [arka, setArka] = useState(false)

  const acik = useMemo(() => {
    const idler = moduller.map((m) => m.id)
    return moduller.filter((m) => isModuleUnlocked(idler, m.id, progress))
  }, [moduller, progress])

  const kelimeli = acik.filter((m) => m.partlar.some((p) => p.kelimeler.length > 0))
  const aktifKapsam = kelimeli.some((m) => m.id === kapsam) ? kapsam : TUM

  const kartlar = useMemo(() => {
    const harita = new Map<string, Kelime>()
    for (const m of aktifKapsam === TUM ? acik : acik.filter((x) => x.id === aktifKapsam)) {
      for (const p of m.partlar) {
        for (const k of p.kelimeler) if (!harita.has(k.de)) harita.set(k.de, k)
      }
    }
    return harita
  }, [acik, aktifKapsam])

  const yeniDeste = (h: Map<string, Kelime>) => buildDeck([...h.keys()], progress, createRng(Date.now()))

  const [deste, setDeste] = useState<{ anahtar: string; keys: string[] }>(() => ({
    anahtar: '',
    keys: [],
  }))
  const [index, setIndex] = useState(0)

  // Kapsam (ya da kart kümesi) değişince deste bir kez yeniden kurulur.
  const anahtar = `${aktifKapsam}|${[...kartlar.keys()].join('\u0000')}`
  let keys = deste.keys
  if (deste.anahtar !== anahtar) {
    keys = yeniDeste(kartlar)
    setDeste({ anahtar, keys })
    setIndex(0)
    setArka(false)
  }

  const yenidenBasla = () => {
    setDeste({ anahtar, keys: yeniDeste(kartlar) })
    setIndex(0)
    setArka(false)
  }

  const kapsamSecici = (
    <label>
      Kapsam:{' '}
      <select aria-label="Kapsam" value={aktifKapsam} onChange={(e) => setKapsam(e.target.value)}>
        <option value={TUM}>Tüm açık modüller</option>
        {kelimeli.map((m) => (
          <option key={m.id} value={m.id}>{`Modül ${m.sira}`}</option>
        ))}
      </select>
    </label>
  )

  let icerik
  if (kartlar.size === 0) {
    icerik = <p>Bu kapsamda kelime yok</p>
  } else if (index >= keys.length) {
    const ogrenilen = [...kartlar.keys()].filter((k) => cardBox(progress, k) === 3).length
    icerik = (
      <div>
        <p>Deste bitti</p>
        <p>{`${ogrenilen} kart öğrenildi`}</p>
        <button type="button" onClick={yenidenBasla}>
          Yeniden başla
        </button>
      </div>
    )
  } else {
    const de = keys[index]
    const kelime = kartlar.get(de)
    if (!kelime) return null
    const cevapla = (biliyorum: boolean) => {
      update((s) => applyCard(s, de, biliyorum))
      setArka(false)
      setIndex((i) => i + 1)
    }
    icerik = (
      <div>
        <p>{`Kart ${index + 1} / ${keys.length}`}</p>
        <div className="kart">
          {arka ? (
            <p className="kart-arka">{kelime.tr}</p>
          ) : (
            <p
              className={`kart-on${kelime.artikel ? ` artikel-${kelime.artikel}` : ''}`}
              data-artikel={kelime.artikel}
            >
              {kelime.de}
            </p>
          )}
        </div>
        <button type="button" onClick={() => setArka((a) => !a)}>
          Kartı çevir
        </button>{' '}
        <button type="button" aria-label="Dinle" onClick={() => speak(kelime.de)}>
          🔊
        </button>
        <div>
          <button type="button" onClick={() => cevapla(true)}>
            Biliyorum
          </button>{' '}
          <button type="button" onClick={() => cevapla(false)}>
            Tekrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Kelime Kartları</h1>
      {kapsamSecici}
      {icerik}
    </div>
  )
}

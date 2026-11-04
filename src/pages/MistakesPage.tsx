import { useMemo, useState } from 'react'
import type { Question } from '../content/schema'
import { applyAnswer } from '../domain/progress'
import { createRng, shuffle } from '../domain/random'
import { useAppState } from '../state/AppState'
import { ResultsView } from '../test-runner/ResultsView'
import { TestRunner, type SoruSonucu } from '../test-runner/TestRunner'

type Oturum = { sorular: Question[]; sonuclar: SoruSonucu[] | null }

export function MistakesPage() {
  const { progress, soruIndex, moduller, ttsVar, update } = useAppState()
  const [filtre, setFiltre] = useState('tumu')
  const [oturum, setOturum] = useState<Oturum | null>(null)

  const girdiler = useMemo(
    () =>
      Object.keys(progress.defter).flatMap((id) => {
        const k = soruIndex.get(id)
        return k ? [{ id, ...k }] : []
      }),
    [progress.defter, soruIndex],
  )

  const modulSeceneklari = moduller.filter((m) => girdiler.some((g) => g.modulId === m.id))
  const aktifFiltre = modulSeceneklari.some((m) => m.id === filtre) ? filtre : 'tumu'
  const gorunen = girdiler.filter((g) => aktifFiltre === 'tumu' || g.modulId === aktifFiltre)

  const tekrarSorulari = gorunen
    .map((g) => g.soru)
    .filter((q) => !(ttsVar === false && q.tip === 'dinleme'))

  const baslat = () => {
    setOturum({ sorular: shuffle(tekrarSorulari, createRng(Date.now())), sonuclar: null })
  }

  const bitti = (sonuclar: SoruSonucu[]) => {
    update((p) => {
      let next = p
      for (const x of sonuclar) next = applyAnswer(next, x.soruId, x.dogru)
      return next
    })
    setOturum((o) => (o ? { ...o, sonuclar } : o))
  }

  if (oturum) {
    return (
      <div>
        <h1>Hata Defteri</h1>
        {oturum.sonuclar ? (
          <ResultsView
            sorular={oturum.sorular}
            sonuclar={oturum.sonuclar}
            gecmeNotu={70}
            baslik="Tekrar sonucu"
          >
            <button type="button" onClick={() => setOturum(null)}>
              Deftere dön
            </button>
          </ResultsView>
        ) : (
          <TestRunner sorular={oturum.sorular} mod="pratik" onBitti={bitti} />
        )}
      </div>
    )
  }

  if (girdiler.length === 0) {
    return (
      <div>
        <h1>Hata Defteri</h1>
        <p>Hata defterin boş 🎉</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Hata Defteri</h1>
      <label>
        Modül:{' '}
        <select
          aria-label="Modül filtresi"
          value={aktifFiltre}
          onChange={(e) => setFiltre(e.target.value)}
        >
          <option value="tumu">Tümü</option>
          {modulSeceneklari.map((m) => (
            <option key={m.id} value={m.id}>{`Modül ${m.sira}`}</option>
          ))}
        </select>
      </label>
      <p>{`${gorunen.length} soru`}</p>
      <button
        type="button"
        disabled={ttsVar === null || tekrarSorulari.length === 0}
        onClick={baslat}
      >
        Tekrar çöz
      </button>
      <ul>
        {gorunen.map((g) => {
          const m = moduller.find((x) => x.id === g.modulId)
          const part = m?.partlar.find((p) => p.id === g.partId)
          const kaynak = g.partId === null ? 'Sınav' : `Ders ${part?.ders ?? ''}`
          return (
            <li key={g.id}>
              <div>{g.soru.soru}</div>
              <small>{`Modül ${m?.sira ?? ''} · ${kaynak}`}</small>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

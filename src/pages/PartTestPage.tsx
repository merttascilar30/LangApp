import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Modul } from '../content/loader'
import type { Question } from '../content/schema'
import { scorePercent } from '../domain/grading'
import { applyAnswer, PART_GECME, recordPartTest } from '../domain/progress'
import { createRng } from '../domain/random'
import { pickPartTest } from '../domain/selection'
import { useAppState } from '../state/AppState'
import { ResultsView } from '../test-runner/ResultsView'
import { TestRunner, type SoruSonucu } from '../test-runner/TestRunner'
import { ModuleGate, NotFound } from './ModulePage'
import { useTtsUyari } from './useTtsUyari'

function PartTest({ modul, part }: { modul: Modul; part: Modul['partlar'][number] }) {
  const { ttsVar, update } = useAppState()
  const [deneme, setDeneme] = useState(0)
  const [sorular, setSorular] = useState<Question[] | null>(null)
  const [sonuclar, setSonuclar] = useState<SoruSonucu[] | null>(null)
  const uyari = useTtsUyari()

  useEffect(() => {
    if (ttsVar === null) return
    setSorular(
      pickPartTest(part.sorular, createRng(Date.now()), { dinlemeHaric: ttsVar === false }),
    )
    // Her denemede (ve ses algılaması çözülünce) bir kez seçilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsVar, deneme, part.id])

  const partLink = `/modul/${modul.id}/part/${part.id}`

  const bitti = (s: SoruSonucu[]) => {
    const dogru = s.filter((x) => x.dogru).length
    const yuzde = scorePercent(dogru, s.length)
    update((p) => {
      let next = p
      for (const x of s) next = applyAnswer(next, x.soruId, x.dogru)
      return recordPartTest(next, part.id, yuzde)
    })
    setSonuclar(s)
  }

  const tekrar = () => {
    setSonuclar(null)
    setSorular(null)
    setDeneme((d) => d + 1)
  }

  let icerik
  if (ttsVar === null || sorular === null) {
    icerik = <p>Hazırlanıyor…</p>
  } else if (sorular.length === 0) {
    icerik = <p>Bu derste gösterilecek soru yok.</p>
  } else if (sonuclar) {
    icerik = (
      <ResultsView sorular={sorular} sonuclar={sonuclar} gecmeNotu={PART_GECME} baslik="Test sonucu">
        <button type="button" onClick={tekrar}>
          Tekrar çöz
        </button>{' '}
        <Link to={partLink}>Parta dön</Link>
      </ResultsView>
    )
  } else {
    icerik = <TestRunner key={deneme} sorular={sorular} mod="pratik" onBitti={bitti} />
  }

  return (
    <div>
      <h1>{`Ders ${part.ders}: ${part.baslik} - Test`}</h1>
      {uyari}
      {icerik}
    </div>
  )
}

export function PartTestPage() {
  const state = useAppState()
  const { modulId, partId } = useParams()
  return (
    <ModuleGate state={state} modulId={modulId}>
      {(m) => {
        const p = m.partlar.find((x) => x.id === partId)
        if (!p) return <NotFound />
        return <PartTest modul={m} part={p} />
      }}
    </ModuleGate>
  )
}

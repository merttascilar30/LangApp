import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TrickList } from '../components/TrickList'
import type { Modul } from '../content/loader'
import type { Question } from '../content/schema'
import { scorePercent } from '../domain/grading'
import { applyAnswer, recordExam } from '../domain/progress'
import { createRng } from '../domain/random'
import { pickExam } from '../domain/selection'
import { useAppState } from '../state/AppState'
import { ResultsView } from '../test-runner/ResultsView'
import { TestRunner, type SoruSonucu } from '../test-runner/TestRunner'
import { ModuleGate } from './ModulePage'
import { useTtsUyari } from './useTtsUyari'

function Exam({ modul }: { modul: Modul }) {
  const { ttsVar, progress, update, moduller } = useAppState()
  const uyari = useTtsUyari()
  const [deneme, setDeneme] = useState(0)
  const [sorular, setSorular] = useState<Question[] | null>(null)
  const [sonuclar, setSonuclar] = useState<SoruSonucu[] | null>(null)

  const sinav = modul.sinav
  const modulLink = `/modul/${modul.id}`
  if (!sinav) {
    return (
      <div>
        <p>Bu modülün sınavı henüz yok</p>
        <Link to={modulLink}>Modüle dön</Link>
      </div>
    )
  }

  const baslat = () => {
    setSonuclar(null)
    setSorular(
      pickExam(
        modul.partlar.map((p) => p.sorular),
        sinav.ekSorular,
        sinav.soruSayisi,
        createRng(Date.now()),
        { dinlemeHaric: ttsVar === false },
      ),
    )
    setDeneme((d) => d + 1)
  }

  const bitti = (s: SoruSonucu[]) => {
    const yuzde = scorePercent(s.filter((x) => x.dogru).length, s.length)
    update((p) => {
      let next = p
      for (const x of s) next = applyAnswer(next, x.soruId, x.dogru, x.ipucu === true)
      return recordExam(next, modul.id, yuzde, sinav.gecmeNotu)
    })
    setSonuclar(s)
  }

  const sonraki = moduller.find((m) => m.sira === modul.sira + 1)
  const kayit = progress.sinavlar[modul.id]

  let icerik
  if (sorular === null) {
    icerik = (
      <div>
        <p>{`${sinav.soruSayisi} soru, geçme notu %${sinav.gecmeNotu}, sonuçlar sınav sonunda gösterilir`}</p>
        {kayit && <p>{`En iyi skor: %${Math.floor(kayit.enIyi)} · Deneme: ${kayit.deneme}`}</p>}
        <button type="button" className="ana-eylem" disabled={ttsVar === null} onClick={baslat}>
          Başla
        </button>
        {ttsVar === null && <span> Hazırlanıyor…</span>}
        {modul.partlar
          .filter((p) => p.trickler && p.trickler.length > 0)
          .map((p) => (
            <section key={p.id}>
              <h3>{`Ders ${p.ders}: ${p.baslik}`}</h3>
              <TrickList trickler={p.trickler} />
            </section>
          ))}
      </div>
    )
  } else if (sorular.length === 0) {
    icerik = <p>Bu sınavda gösterilecek soru yok.</p>
  } else if (sonuclar) {
    const yuzde = scorePercent(sonuclar.filter((x) => x.dogru).length, sorular.length)
    const gecti = yuzde >= sinav.gecmeNotu
    icerik = (
      <ResultsView
        sorular={sorular}
        sonuclar={sonuclar}
        gecmeNotu={sinav.gecmeNotu}
        baslik="Sınav sonucu"
      >
        {gecti && sonraki && (
          <p>
            {`Modül ${sonraki.sira} açıldı!`}{' '}
            <Link className="ana-eylem" to={`/modul/${sonraki.id}`}>{`Sonraki modüle geç (Modül ${sonraki.sira})`}</Link>
          </p>
        )}
        {gecti && !sonraki && <p>Tebrikler, A1 tamamlandı!</p>}
        <button type="button" onClick={baslat}>
          Tekrar dene
        </button>{' '}
        <Link to={modulLink}>Modüle dön</Link>
      </ResultsView>
    )
  } else {
    icerik = <TestRunner key={deneme} sorular={sorular} mod="sinav" onBitti={bitti} />
  }

  return (
    <div>
      <h1>{`Modül ${modul.sira} Sınavı`}</h1>
      {uyari}
      {icerik}
    </div>
  )
}

export function ExamPage() {
  const state = useAppState()
  const { modulId } = useParams()
  return (
    <ModuleGate state={state} modulId={modulId}>
      {(m) => <Exam modul={m} />}
    </ModuleGate>
  )
}

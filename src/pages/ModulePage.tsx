import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isModuleUnlocked } from '../domain/progress'
import { useAppState, type AppState } from '../state/AppState'
import type { Modul } from '../content/loader'

export function NotFound() {
  return (
    <div>
      <p>Bulunamadı</p>
      <Link to="/">Modüllere dön</Link>
    </div>
  )
}

export function Locked() {
  return (
    <div>
      <p>Bu modül kilitli</p>
      <Link to="/">Modüllere dön</Link>
    </div>
  )
}

/** Modülü bulur ve kilidi kontrol eder; yalnızca açık modül için children çağrılır. */
export function ModuleGate({
  state,
  modulId,
  children,
}: {
  state: AppState
  modulId: string | undefined
  children: (modul: Modul) => ReactNode
}) {
  const modul = state.moduller.find((m) => m.id === modulId)
  if (!modul) return <NotFound />
  const acik = isModuleUnlocked(
    state.moduller.map((m) => m.id),
    modul.id,
    state.progress,
  )
  if (!acik) return <Locked />
  return <>{children(modul)}</>
}

export function ModulePage() {
  const state = useAppState()
  const { modulId } = useParams()
  return (
    <ModuleGate state={state} modulId={modulId}>
      {(m) => {
        const partlar = [...m.partlar].sort((a, b) => a.ders - b.ders)
        return (
          <div>
            <h1>{`Modül ${m.sira}: ${m.baslik}`}</h1>
            <ul className="part-listesi">
              {partlar.map((p) => {
                const kayit = state.progress.partlar[p.id]
                return (
                  <li key={p.id}>
                    <Link to={`/modul/${m.id}/part/${p.id}`}>{`Ders ${p.ders}: ${p.baslik}`}</Link>
                    {kayit?.enIyi !== undefined && (
                      <span className="etiket">{` %${Math.floor(kayit.enIyi)}`}</span>
                    )}
                    {kayit?.izlendi && <span className="etiket"> ✓ İzlendi</span>}
                  </li>
                )
              })}
            </ul>
            <p>
              <Link className="ana-eylem" to={`/modul/${m.id}/sinav`}>Modül sınavına gir</Link>
            </p>
          </div>
        )
      }}
    </ModuleGate>
  )
}

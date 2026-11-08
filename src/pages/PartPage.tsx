import { Link, useParams } from 'react-router-dom'
import { TrickList } from '../components/TrickList'
import { setWatched } from '../domain/progress'
import { useAppState } from '../state/AppState'
import { ModuleGate, NotFound } from './ModulePage'

export function PartPage() {
  const state = useAppState()
  const { modulId, partId } = useParams()
  return (
    <ModuleGate state={state} modulId={modulId}>
      {(m) => {
        const p = m.partlar.find((x) => x.id === partId)
        if (!p) return <NotFound />
        const izlendi = state.progress.partlar[p.id]?.izlendi ?? false
        return (
          <div>
            <p>
              <Link to={`/modul/${m.id}`}>{`← Modüle dön`}</Link>
            </p>
            <h1>{`Ders ${p.ders}: ${p.baslik}`}</h1>
            <iframe
              title="Ders videosu"
              src={`https://www.youtube-nocookie.com/embed/${p.videoId}`}
              allowFullScreen
            />
            <p>
              <a
                href={`https://www.youtube.com/watch?v=${p.videoId}`}
                target="_blank"
                rel="noopener"
              >
                YouTube'da aç
              </a>
            </p>
            <ul>
              {p.ozet.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
            {p.trickler && p.trickler.length > 0 && (
              <section>
                <h2>🎯 Trickler</h2>
                <TrickList trickler={p.trickler} />
              </section>
            )}
            <label>
              <input
                type="checkbox"
                checked={izlendi}
                onChange={(e) => state.update((s) => setWatched(s, p.id, e.target.checked))}
              />{' '}
              İzledim
            </label>
            <p>
              <Link className="ana-eylem" to={`/modul/${m.id}/part/${p.id}/test`}>Teste başla</Link>
            </p>
          </div>
        )
      }}
    </ModuleGate>
  )
}

import { Link } from 'react-router-dom'
import { emptyProgress, isModuleUnlocked } from '../domain/progress'
import { useAppState } from '../state/AppState'

export function HomePage() {
  const { moduller, hatalar, progress, depolamaDurumu, replaceProgress } = useAppState()
  const siraliIds = moduller.map((m) => m.id)

  return (
    <div>
      <h1>Almanca A1</h1>

      {depolamaDurumu === 'bozuk' && (
        <div className="uyari" role="alert">
          <p>Kayıtlı ilerleme okunamadı.</p>
          <Link to="/ayarlar">Ayarlar'dan yedek içe aktar</Link>{' '}
          <button type="button" onClick={() => replaceProgress(emptyProgress())}>
            Sıfırdan başla
          </button>
        </div>
      )}
      {depolamaDurumu === 'erisilemez' && (
        <div className="uyari" role="alert">
          <p>İlerleme bu tarayıcıda kaydedilemiyor.</p>
        </div>
      )}

      {hatalar.length > 0 && (
        <section className="hatalar">
          <h2>İçerik hataları</h2>
          <ul>
            {hatalar.map((h, i) => (
              <li key={i}>
                <code>{h.dosya}</code>
                {h.soruId ? ` (${h.soruId})` : ''}: {h.mesaj}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="modul-listesi">
        {moduller.map((m) => {
          const acik = isModuleUnlocked(siraliIds, m.id, progress)
          const baslik = `Modül ${m.sira}: ${m.baslik}`
          return (
            <li key={m.id} className={acik ? 'modul' : 'modul kilitli'}>
              {acik ? <Link to={`/modul/${m.id}`}>{baslik}</Link> : <span>{baslik}</span>}
              {!acik && <span className="etiket"> Kilitli</span>}
              {acik && m.partlar.length === 0 && <span className="etiket"> İçerik yakında</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

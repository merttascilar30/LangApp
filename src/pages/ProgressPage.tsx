import { isModuleUnlocked } from '../domain/progress'
import { useAppState } from '../state/AppState'

export function ProgressPage() {
  const { moduller, soruIndex, progress } = useAppState()
  const ids = moduller.map((m) => m.id)
  const gecilen = moduller.filter((m) => progress.sinavlar[m.id]?.gecti === true).length
  const defterSayisi = Object.keys(progress.defter).filter((id) => soruIndex.has(id)).length
  const ogrenilen = Object.values(progress.kartlar).filter((v) => v === 3).length

  return (
    <div>
      <h1>İlerleme</h1>
      <ul>
        <li>{`Geçilen modül ${gecilen}/${moduller.length}`}</li>
        <li>{`Defterdeki soru ${defterSayisi}`}</li>
        <li>{`Öğrenilen kart ${ogrenilen}`}</li>
      </ul>
      {[...moduller]
        .sort((a, b) => a.sira - b.sira)
        .map((m) => {
          const sinav = progress.sinavlar[m.id]
          const durum = sinav?.gecti
            ? 'Geçildi'
            : isModuleUnlocked(ids, m.id, progress)
              ? 'Açık'
              : 'Kilitli'
          const partlar = [...m.partlar].sort((a, b) => a.ders - b.ders)
          return (
            <details key={m.id}>
              <summary>
                <span>{`Modül ${m.sira}: ${m.baslik}`}</span> <span>{durum}</span>
              </summary>
              {sinav && (
                <p>{`Sınav: en iyi %${Math.floor(sinav.enIyi)} · ${sinav.deneme} deneme`}</p>
              )}
              <ul>
                {partlar.map((p) => {
                  const kayit = progress.partlar[p.id]
                  return (
                    <li key={p.id}>
                      <span>{`Ders ${p.ders}: ${p.baslik}`}</span>{' '}
                      <span>{kayit?.enIyi !== undefined ? `%${Math.floor(kayit.enIyi)}` : '—'}</span>
                      {kayit?.izlendi && <span> ✓ İzlendi</span>}
                    </li>
                  )
                })}
              </ul>
            </details>
          )
        })}
    </div>
  )
}

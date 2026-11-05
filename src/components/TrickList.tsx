import type { Trick } from '../content/schema'

export function TrickList({ trickler }: { trickler?: Trick[] }) {
  if (!trickler || trickler.length === 0) return null
  return (
    <div className="trick-list">
      {trickler.map((t, i) => (
        <details key={i} className="trick-kart">
          <summary>{`🎯 ${t.baslik}`}</summary>
          <p>{t.metin}</p>
        </details>
      ))}
    </div>
  )
}

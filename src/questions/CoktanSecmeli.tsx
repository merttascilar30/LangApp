import type { CoktanSecmeliQuestion } from '../content/schema'
import type { QuestionProps } from './types'
import { Gloss } from './Gloss'

const BOSLUK = '___'

function Balon({ metin, secilenMetin }: { metin: string; secilenMetin: string | null }) {
  const i = metin.indexOf(BOSLUK)
  if (i === -1) return <Gloss metin={metin} />
  return (
    <>
      <Gloss metin={metin.slice(0, i)} />
      <span className="bos-yer">{secilenMetin ?? '…'}</span>
      <Gloss metin={metin.slice(i + BOSLUK.length)} />
    </>
  )
}

export function CoktanSecmeli({ soru, cevap, onCevap, kilitli, ipucu }: QuestionProps<CoktanSecmeliQuestion>) {
  const secilen = cevap?.tip === 'coktan-secmeli' ? cevap.secilen : null
  const elenen = ipucu?.tur === 'ele' ? ipucu.indeksler : []
  const secilenMetin = secilen === null ? null : (soru.secenekler[secilen] ?? null)
  return (
    <div className="soru">
      <p className="soru-metni">{soru.soru}</p>
      {soru.metin !== undefined && (
        <p className="soru-almanca">
          <Gloss metin={soru.metin} />
        </p>
      )}
      {soru.diyalog && (
        <ol className="diyalog">
          {soru.diyalog.map((s, i) => (
            <li key={i} className="balon" data-bos={s.metin.includes(BOSLUK) ? 'true' : undefined}>
              <span className="kim">{s.kim}</span>
              <Balon metin={s.metin} secilenMetin={secilenMetin} />
            </li>
          ))}
        </ol>
      )}
      <div className="secenekler">
        {soru.secenekler.map((s, i) => (
          <button
            key={i}
            type="button"
            className={elenen.includes(i) ? 'secenek elendi' : 'secenek'}
            aria-pressed={secilen === i}
            disabled={kilitli || elenen.includes(i)}
            onClick={() => onCevap({ tip: 'coktan-secmeli', secilen: i })}
          >
            <Gloss metin={s} odaklanabilir={false} />
          </button>
        ))}
      </div>
    </div>
  )
}

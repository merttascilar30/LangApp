import { Fragment, createContext, useContext, useMemo, useState } from 'react'
import { glossTokens } from '../domain/gloss'

export type GlossDeger = { sozluk: Record<string, string>; ek?: Record<string, string> }

// Varsayılan null: provider yoksa gloss uygulanmaz.
export const GlossContext = createContext<GlossDeger | null>(null)

function GlossKelime({ metin, anlam, odaklanabilir }: { metin: string; anlam: string; odaklanabilir: boolean }) {
  const [acik, setAcik] = useState(false)
  return (
    <span
      className={acik ? 'gloss acik' : 'gloss'}
      tabIndex={odaklanabilir ? 0 : undefined}
      data-anlam={anlam}
      onMouseEnter={() => setAcik(true)}
      onMouseLeave={() => setAcik(false)}
      onFocus={() => setAcik(true)}
      onBlur={() => setAcik(false)}
    >
      {metin}
      <span role="tooltip" className="gloss-ipucu" aria-hidden={acik ? undefined : true}>
        {anlam}
      </span>
    </span>
  )
}

export function Gloss({ metin, odaklanabilir = true }: { metin: string; odaklanabilir?: boolean }) {
  const ctx = useContext(GlossContext)
  const tokens = useMemo(() => (ctx ? glossTokens(metin, ctx.sozluk, ctx.ek) : null), [ctx, metin])
  if (!tokens) return <>{metin}</>
  return (
    <>
      {tokens.map((t, i) =>
        t.anlam === undefined ? (
          <Fragment key={i}>{t.metin}</Fragment>
        ) : (
          <GlossKelime key={i} metin={t.metin} anlam={t.anlam} odaklanabilir={odaklanabilir} />
        ),
      )}
    </>
  )
}

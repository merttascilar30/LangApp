import { Fragment } from 'react'

/** `kelime` biçimindeki backtick aralıklarını <em lang="de"> ile gösterir; dengesizse düz yazar. */
export function NotMetni({ metin }: { metin: string }) {
  const parcalar = metin.split('`')
  if (parcalar.length % 2 === 0) return <>{metin}</>
  return (
    <>
      {parcalar.map((p, i) =>
        i % 2 === 1 ? (
          <em key={i} lang="de">
            {p}
          </em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

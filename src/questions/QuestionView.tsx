import { Artikel } from './Artikel'
import { CoktanSecmeli } from './CoktanSecmeli'
import { DogruYanlis } from './DogruYanlis'
import { BoslukDoldurma } from './BoslukDoldurma'
import { Ceviri } from './Ceviri'
import { CumleDizme } from './CumleDizme'
import { Dinleme } from './Dinleme'
import { Eslestirme } from './Eslestirme'
import { FiilCekimi } from './FiilCekimi'
import type { Question } from '../content/schema'
import type { QuestionProps } from './types'
import { useContext, useMemo } from 'react'
import { GlossContext } from './Gloss'
import { SozlukContext } from '../state/SozlukContext'

export function QuestionView(props: QuestionProps<Question>) {
  const sozlukFor = useContext(SozlukContext)
  const kapali = props.soru.glossKapali === true && !props.kilitli
  const glossDeger = useMemo(
    () => (kapali ? null : { sozluk: sozlukFor(props.soru.id), ek: props.soru.sozlukEk }),
    [kapali, sozlukFor, props.soru.id, props.soru.sozlukEk],
  )
  return (
    <GlossContext.Provider value={glossDeger}>
      <QuestionBody {...props} />
    </GlossContext.Provider>
  )
}

function QuestionBody(props: QuestionProps<Question>) {
  const { soru, cevap, onCevap, kilitli, ipucu } = props
  switch (soru.tip) {
    case 'coktan-secmeli':
      return <CoktanSecmeli soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'dogru-yanlis':
      return <DogruYanlis soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'artikel':
      return <Artikel soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'eslestirme':
      return <Eslestirme soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'bosluk-doldurma':
      return <BoslukDoldurma soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'ceviri':
      return <Ceviri soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'dinleme':
      return <Dinleme soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'fiil-cekimi':
      return <FiilCekimi soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    case 'cumle-dizme':
      return <CumleDizme soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} ipucu={ipucu} />
    default:
      return <p>Desteklenmeyen soru tipi</p>
  }
}

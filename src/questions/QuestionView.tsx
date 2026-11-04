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

export function QuestionView(props: QuestionProps<Question>) {
  const { soru, cevap, onCevap, kilitli } = props
  switch (soru.tip) {
    case 'coktan-secmeli':
      return <CoktanSecmeli soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'dogru-yanlis':
      return <DogruYanlis soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'artikel':
      return <Artikel soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'eslestirme':
      return <Eslestirme soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'bosluk-doldurma':
      return <BoslukDoldurma soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'ceviri':
      return <Ceviri soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'dinleme':
      return <Dinleme soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'fiil-cekimi':
      return <FiilCekimi soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    case 'cumle-dizme':
      return <CumleDizme soru={soru} cevap={cevap} onCevap={onCevap} kilitli={kilitli} />
    default:
      return <p>Desteklenmeyen soru tipi</p>
  }
}

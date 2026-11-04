import { Artikel } from './Artikel'
import { CoktanSecmeli } from './CoktanSecmeli'
import { DogruYanlis } from './DogruYanlis'
import { Eslestirme } from './Eslestirme'
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
    default:
      // bosluk-doldurma, ceviri, dinleme, fiil-cekimi, cumle-dizme: Task 11
      return <p>Desteklenmeyen soru tipi</p>
  }
}

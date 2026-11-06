// Kullanım: node scripts/baloncuklar.mjs modul-3 [ders-14]
// Her soru için ekranda çıkacak kelime baloncuklarını listeler. Dosya yazmaz.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glossTokens } from '../src/domain/gloss.ts'

const kok = join(dirname(fileURLToPath(import.meta.url)), '..')
const [modul, tekDers] = process.argv.slice(2)
const klasor = join(kok, 'content', modul ?? '')
if (!modul || !existsSync(klasor)) {
  console.error('Kullanım: node scripts/baloncuklar.mjs modul-N [ders-NN]')
  process.exit(1)
}

const oku = (dosya) => JSON.parse(readFileSync(join(klasor, dosya), 'utf8'))
const dosyalar = readdirSync(klasor).filter((f) => /^(ders-\d+|sinav)\.json$/.test(f)).sort()

const sozluk = {}
for (const f of dosyalar.filter((x) => x.startsWith('ders-'))) {
  for (const k of oku(f).kelimeler ?? []) sozluk[k.de] = k.tr
}
if (existsSync(join(klasor, 'sozluk.json'))) Object.assign(sozluk, oku('sozluk.json').girdiler)

function alanlar(q) {
  switch (q.tip) {
    case 'bosluk-doldurma':
      return [q.metin]
    case 'dogru-yanlis':
      return [q.ifade]
    case 'artikel':
      return [q.isim]
    case 'coktan-secmeli':
      return [...q.secenekler, q.metin, ...(q.diyalog ?? []).map((s) => s.metin)].filter(Boolean)
    case 'cumle-dizme':
      return q.parcalar
    case 'eslestirme':
      return q.ciftler.map((c) => c.sol)
    case 'fiil-cekimi':
      return [q.fiil]
    default:
      return []
  }
}

for (const f of dosyalar) {
  if (tekDers && f !== `${tekDers}.json`) continue
  const icerik = oku(f)
  console.log(`\n## ${f}`)
  for (const q of icerik.sorular ?? icerik.ekSorular ?? []) {
    const kapali = q.glossKapali === true
    const baloncuk = alanlar(q)
      .flatMap((m) => glossTokens(m, sozluk, q.sozlukEk))
      .filter((t) => t.anlam)
      .map((t) => `${t.metin}=${t.anlam}`)
    const durum = kapali ? 'KAPALI (cevap sonrası açık)' : baloncuk.join(' | ') || 'baloncuk yok'
    console.log(`${q.id} [${q.tip}/${q.bicim ?? '-'}]: ${durum}`)
  }
}

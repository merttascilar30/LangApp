#!/usr/bin/env node
// Kullanım: node scripts/modul-raporu.mjs modul-N      (veya: npm run rapor -- modul-N)
// Bir modülün incelenme raporunu markdown olarak stdout'a yazar. Yalnızca okur, dosya yazmaz.
// Bilinmeyen modül için çıkış kodu 1'dir.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const kok = join(dirname(fileURLToPath(import.meta.url)), '..')
const icerik = join(kok, 'content')
const oku = (p) => JSON.parse(readFileSync(p, 'utf8'))

const modulId = process.argv[2]
const index = oku(join(icerik, 'modules.json'))
const sirali = [...index.moduller].sort((a, b) => a.sira - b.sira)
const modul = sirali.find((m) => m.id === modulId)
if (!modul) {
  console.error(`Bilinmeyen modül: ${modulId ?? '(belirtilmedi)'}. Mevcut: ${sirali.map((m) => m.id).join(', ')}`)
  process.exit(1)
}

if (modul.partlar.length === 0) {
  console.log(`# ${modul.id} raporu: ${modul.baslik}

Bu modülde henüz ders yok (modules.json partlar boş).`)
  process.exit(0)
}
const partlar = modul.partlar.map((p) => oku(join(icerik, modul.id, `${p}.json`)))
const sinavYolu = join(icerik, modulId, 'sinav.json')
const sinav = existsSync(sinavYolu) ? oku(sinavYolu) : null

const out = []
const yaz = (s = '') => out.push(s)
const yuzde = (a, b) => (b === 0 ? '0%' : `${Math.round((a * 1000) / b) / 10}%`)
const sayac = (liste) => {
  const m = new Map()
  for (const x of liste) m.set(x, (m.get(x) ?? 0) + 1)
  return m
}
const dagilim = (liste, anahtarlar) => {
  const m = sayac(liste)
  return anahtarlar.map((k) => `${k} ${m.get(k) ?? 0}`).join(', ')
}

const BICIMLER = ['bosluk', 'diyalog', 'siralama', 'senaryo', 'kelime']
const KAYNAKLAR = ['goethe', 'uyarlama', 'yazildi']

/** Kaynağı tek satır olan (içinde ` – ` diyalog ayracı bulunmayan) goethe diyalog sorusu. */
const tekSatirGoetheDiyalog = (q) =>
  q.kaynakTuru === 'goethe' && q.bicim === 'diyalog' && !/\s[–—]\s/.test(q.kaynakCumle ?? '')

yaz(`# ${modul.id} raporu: ${modul.baslik}`)
yaz()
yaz(`Dersler: ${partlar.length} / ${modul.partlar.length} dosya. Sınav: ${sinav ? `${sinav.ekSorular.length} ekSoru` : 'yok'}.`)
yaz()

// ---- Ders başına dağılım ----
yaz('## Ders başına dağılım')
yaz()
yaz('Katı goethe: kaynağı tek satır olan (` – ` ayracı içermeyen) goethe diyaloglar sayılmaz; payda toplam sorudur.')
yaz()
yaz('| Ders | Soru | Biçim | Kaynak | goethe | Katı goethe |')
yaz('|---|---|---|---|---|---|')
let topSoru = 0
let topGoethe = 0
let topKati = 0
for (const p of partlar) {
  const s = p.sorular
  const goethe = s.filter((q) => q.kaynakTuru === 'goethe').length
  const kati = s.filter((q) => q.kaynakTuru === 'goethe' && !tekSatirGoetheDiyalog(q)).length
  topSoru += s.length
  topGoethe += goethe
  topKati += kati
  yaz(
    `| ${p.ders} ${p.baslik} | ${s.length} | ${dagilim(s.map((q) => q.bicim), BICIMLER)} | ${dagilim(s.map((q) => q.kaynakTuru), KAYNAKLAR)} | ${yuzde(goethe, s.length)} | ${kati}/${s.length} = ${yuzde(kati, s.length)} |`,
  )
}
if (sinav) {
  const s = sinav.ekSorular
  const goethe = s.filter((q) => q.kaynakTuru === 'goethe').length
  const kati = s.filter((q) => q.kaynakTuru === 'goethe' && !tekSatirGoetheDiyalog(q)).length
  yaz(
    `| Sınav (ekSorular) | ${s.length} | ${dagilim(s.map((q) => q.bicim), BICIMLER)} | ${dagilim(s.map((q) => q.kaynakTuru), KAYNAKLAR)} | ${yuzde(goethe, s.length)} | ${kati}/${s.length} = ${yuzde(kati, s.length)} |`,
  )
}
yaz()
yaz(`Ders toplamı: ${topSoru} soru, goethe ${yuzde(topGoethe, topSoru)}, katı goethe ${yuzde(topKati, topSoru)}.`)
yaz()

// ---- Doğru şık konumları ----
yaz('## Doğru şık konumları (çoktan seçmeli)')
yaz()
const konumSatiri = (etiket, sorular) => {
  const cs = sorular.filter((q) => q.tip === 'coktan-secmeli')
  const say = sayac(cs.map((q) => q.dogru + 1))
  const konumlar = [...say.keys()].sort((a, b) => a - b)
  let en = 0
  let enKonum = 0
  let uzunluk = 0
  let onceki = -1
  for (const q of cs) {
    uzunluk = q.dogru === onceki ? uzunluk + 1 : 1
    onceki = q.dogru
    if (uzunluk > en) {
      en = uzunluk
      enKonum = q.dogru + 1
    }
  }
  const dizilis = cs.map((q) => q.dogru + 1).join('')
  const uyari = en >= 3 ? `  **art arda ${en} kez konum ${enKonum}**` : ''
  return `- ${etiket}: ${cs.length} soru; ${konumlar.map((k) => `konum ${k}: ${say.get(k)}`).join(', ') || 'yok'}; sıra: ${dizilis || '-'}${uyari}`
}
for (const p of partlar) yaz(konumSatiri(`Ders ${p.ders}`, p.sorular))
if (sinav) yaz(konumSatiri('Sınav', sinav.ekSorular))
yaz()

// ---- Öğretilmemiş sözcükler (inceleme listesi) ----
yaz('## Önceden gösterilmemiş şık sözcükleri (inceleme listesi; otomatik kural değildir)')
yaz()
yaz('Doğru şık ve çeldiricilerdeki sözcükler, ilgili dersin ve önceki derslerin (önceki modüller dahil) `ozet`, `trickler` ve `kelimeler` alanlarında geçmiyorsa listelenir. Sınav soruları için modülün tüm dersleri sayılır.')
yaz()

const kucuk = (s) => s.toLocaleLowerCase('de')
const sozcukler = (s) => (s.match(/[\p{L}]+/gu) ?? []).map(kucuk)
const partMetni = (p) => [
  ...(p.ozet ?? []),
  ...(p.trickler ?? []).flatMap((t) => [t.baslik, t.metin]),
  ...(p.kelimeler ?? []).flatMap((k) => [k.de, k.tr, k.artikel ?? '']),
]
const oncekiModuller = sirali.filter((m) => m.sira < modul.sira)
const oncekiPartlar = oncekiModuller.flatMap((m) =>
  m.partlar.map((p) => ({ ders: Number(/\d+/.exec(p)?.[0] ?? 0), veri: oku(join(icerik, m.id, `${p}.json`)) })),
)
const bilinen = new Set()
for (const o of oncekiPartlar) for (const t of partMetni(o.veri)) for (const w of sozcukler(t)) bilinen.add(w)

const incele = (etiket, q, kume) => {
  if (q.tip !== 'coktan-secmeli') return
  const satirlar = []
  q.secenekler.forEach((sec, i) => {
    const yeni = [...new Set(sozcukler(sec))].filter((w) => !kume.has(w))
    if (yeni.length > 0) satirlar.push(`${i === q.dogru ? 'doğru' : 'çeldirici'} "${sec}": ${yeni.join(', ')}`)
  })
  if (satirlar.length > 0) {
    yaz(`- ${q.id}`)
    for (const s of satirlar) yaz(`  - ${s}`)
  }
}
const kumeler = new Map()
const tumKume = new Set(bilinen)
const buModulKume = new Set(bilinen)
for (const p of [...partlar].sort((a, b) => a.ders - b.ders)) {
  for (const t of partMetni(p)) for (const w of sozcukler(t)) buModulKume.add(w)
  kumeler.set(p.id, new Set(buModulKume))
}
for (const w of buModulKume) tumKume.add(w)

let listeBos = true
for (const p of partlar) {
  const basla = out.length
  yaz()
  yaz(`### Ders ${p.ders}`)
  const oncekiUzunluk = out.length
  for (const q of p.sorular) incele(p.id, q, kumeler.get(p.id))
  if (out.length === oncekiUzunluk) out.splice(basla, 2)
  else listeBos = false
}
if (sinav) {
  const basla = out.length
  yaz()
  yaz('### Sınav')
  const oncekiUzunluk = out.length
  for (const q of sinav.ekSorular) incele('sinav', q, tumKume)
  if (out.length === oncekiUzunluk) out.splice(basla, 2)
  else listeBos = false
}
if (listeBos) yaz('_Listelenecek sözcük yok._')

console.log(out.join('\n'))

#!/usr/bin/env node
// Kullanım: node scripts/ders-adaylari.mjs <ders>
// Dersin aday cümlelerini markdown olarak stdout'a yazar. Dosya yazmaz.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const kok = join(dirname(fileURLToPath(import.meta.url)), '..')
const icerik = join(kok, 'content')
const oku = (p) => JSON.parse(readFileSync(p, 'utf8'))

const ders = Number(process.argv[2])
const harita = oku(join(icerik, 'ders-haritasi.json'))
const girdi = harita.dersler.find((d) => d.ders === ders)
if (!Number.isInteger(ders) || !girdi) {
  console.error(`Haritada ders ${process.argv[2] ?? '(belirtilmedi)'} yok. Mevcut: ${harita.dersler.map((d) => d.ders).join(', ')}`)
  process.exit(1)
}

const desenler = girdi.aramaKaliplari.map((k) => new RegExp(k, 'iu'))
const eslesir = (s) => desenler.some((r) => r.test(s))

// Bankanın modul-2..modul-8 bölümü (Modül 1 hariç)
const banka = oku(join(icerik, 'almanca_a1_goethe_veri_bankasi.json'))
const moduller = Object.keys(banka)
  .filter((k) => /^modul-\d+$/.test(k) && k !== 'modul-1')
  .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))

// kaynakCumle kullanımı: mevcut içerik dosyalarında
const kullanim = new Map()
const gez = (v, etiket) => {
  if (Array.isArray(v)) return v.forEach((x) => gez(x, etiket))
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (k === 'kaynakCumle' && typeof x === 'string') {
        if (!kullanim.has(x)) kullanim.set(x, new Set())
        kullanim.get(x).add(etiket)
      } else gez(x, etiket)
    }
  }
}
for (const d of readdirSync(icerik, { withFileTypes: true })) {
  if (!d.isDirectory() || !/^modul-\d+$/.test(d.name)) continue
  for (const f of readdirSync(join(icerik, d.name))) {
    if (/^ders-.*\.json$/.test(f)) gez(oku(join(icerik, d.name, f)), `${d.name}/${f.replace('.json', '')}`)
  }
}

// Aday cümleler: cümle -> { kelimeler: Set<wort>, temalar: Set }
const topla = (modulId) => {
  const harita = new Map()
  for (const k of banka[modulId]?.kelimeler ?? []) {
    for (const c of k.ornekCumleler ?? []) {
      if (!eslesir(c)) continue
      if (!harita.has(c)) harita.set(c, { kelimeler: new Set(), temalar: new Set() })
      const e = harita.get(c)
      e.kelimeler.add(k.wort)
      e.temalar.add(k.tema)
    }
  }
  return harita
}

const kendi = girdi.modulId
const out = []
const yaz = (s = '') => out.push(s)

yaz(`# Ders ${girdi.ders}: ${girdi.baslik}`)
yaz()
yaz(`- Modül: ${kendi}`)
yaz(`- Dosya: ${girdi.dosya}`)
yaz(`- Gramer: ${girdi.gramer.join('; ')}`)
yaz(`- Arama kalıpları: ${girdi.aramaKaliplari.map((k) => '`' + k + '`').join(', ')}`)
yaz()

const hepsi = process.argv.includes('--hepsi')
const KENDI_SINIR = 40
const DIGER_SINIR = 20
let digerGosterilen = 0
let atlanan = 0
let toplam = 0
const sirali = [kendi, ...moduller.filter((m) => m !== kendi)]
const ilgili = new Map()
const sayilar = []
for (const m of sirali) {
  const adaylar = topla(m)
  sayilar.push([m, adaylar.size])
  toplam += adaylar.size
  // Çıktı sınırı: kullanılmamış cümleler önce; kalan sayı açıkça yazılır.
  const siniri = hepsi ? Infinity : m === kendi ? KENDI_SINIR : Math.max(0, DIGER_SINIR - digerGosterilen)
  const sirali2 = [...adaylar].sort(([a], [b]) => (kullanim.has(a) ? 1 : 0) - (kullanim.has(b) ? 1 : 0))
  const gosterilen = sirali2.slice(0, siniri)
  if (m !== kendi) digerGosterilen += gosterilen.length
  if (gosterilen.length === 0 && adaylar.size > 0) {
    atlanan += adaylar.size
    continue
  }
  if (adaylar.size === 0) continue
  yaz(`## Aday cümleler: ${m}${m === kendi ? ' (kendi modülü)' : ''} (${gosterilen.length}/${adaylar.size})`)
  yaz()
  let i = 0
  for (const [c, e] of gosterilen) {
    i++
    const kul = kullanim.get(c)
    yaz(`${i}. ${c} [${[...e.kelimeler].join(', ')}]${kul ? ` (kullanıldı: ${[...kul].map((x) => x.split('/')[1]).join(', ')})` : ''}`)
  }
  for (const [, e] of adaylar) if (m === kendi) for (const w of e.kelimeler) ilgili.set(w, true)
  atlanan += adaylar.size - gosterilen.length
  yaz()
}

yaz(`## İlgili kelimeler (${kendi})`)
yaz()
const kel = (banka[kendi]?.kelimeler ?? []).filter((k) => ilgili.has(k.wort) || eslesir(k.wort))
if (kel.length === 0) yaz('_Yok._')
for (const k of kel) {
  yaz(`- ${k.artikel ? k.artikel + ' ' : ''}${k.wort}${k.plural ? ` (çoğul: ${k.plural})` : ''} = ${k.turkce}${k.perfekt ? ` | perfekt: ${k.perfekt}` : ''}`)
}
yaz()
yaz(`## Toplam`)
yaz()
yaz(`Toplam aday: ${toplam} (${sayilar.map(([m, n]) => `${m}: ${n}`).join(', ')})`)
if (atlanan > 0) yaz(`Gösterilmeyen: ${atlanan} aday. Yetmezse: node scripts/ders-adaylari.mjs ${ders} --hepsi`)
console.log(out.join('\n'))

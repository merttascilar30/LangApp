#!/usr/bin/env node
// Kullanım: node scripts/ogretilenler.mjs modul-N ders-NN|sinav
// Sorulardaki, öğrenciye henüz gösterilmemiş sözcükleri listeler. Otomatik kural değil, kontrol listesidir.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gosterilmemisler, gosterimMetni, sozcukler } from '../tests/helpers/ogretilen.ts'

const icerik = join(dirname(fileURLToPath(import.meta.url)), '..', 'content')
const oku = (p) => JSON.parse(readFileSync(p, 'utf8'))

const [modulId, birim] = process.argv.slice(2)
const moduller = oku(join(icerik, 'modules.json')).moduller.sort((a, b) => a.sira - b.sira)
const modul = moduller.find((m) => m.id === modulId)
const yol = modul && birim ? join(icerik, modulId, `${birim}.json`) : null
if (!yol || !existsSync(yol)) {
  console.error('Kullanım: node scripts/ogretilenler.mjs modul-N ders-NN|sinav')
  process.exit(1)
}

const hedef = oku(yol)
const sinav = birim === 'sinav'
const parcaOku = (m, p) => oku(join(icerik, m.id, `${p}.json`))
const bilinen = new Set()
const ekle = (metinler) => {
  for (const w of metinler.flatMap(sozcukler)) bilinen.add(w)
}
for (const m of moduller.filter((x) => x.sira < modul.sira)) {
  for (const p of m.partlar) ekle(gosterimMetni(parcaOku(m, p), true))
}
for (const p of modul.partlar) {
  const part = parcaOku(modul, p)
  if (sinav || part.ders < hedef.ders) ekle(gosterimMetni(part, true))
}
if (!sinav) ekle(gosterimMetni(hedef, false))

const sorular = sinav ? hedef.ekSorular : hedef.sorular
let sayi = 0
for (const q of sorular) {
  const { cevap, metin } = gosterilmemisler(q, bilinen)
  if (cevap.length === 0 && metin.length === 0) continue
  sayi++
  const parcalar = [cevap.length ? `cevap: ${cevap.join(', ')}` : '', metin.length ? `metin: ${metin.join(', ')}` : '']
  console.log(`${q.id} ${parcalar.filter(Boolean).join(' | ')}`)
}
console.log(`${sorular.length} sorunun ${sayi} tanesinde gösterilmemiş sözcük var.`)

#!/usr/bin/env node
// Kullanım: node scripts/modul-sonu.mjs modul-N
// Tür denetimi, test ve build çalıştırır; kısa sonuç ve modül raporunun özetini yazar.
// Bir adım başarısızsa son satırlarını gösterir ve çıkış kodu 1 olur.
import { spawnSync } from 'node:child_process'

const modulId = process.argv[2]
if (!/^modul-\d+$/.test(modulId ?? '')) {
  console.error('Kullanım: node scripts/modul-sonu.mjs modul-N')
  process.exit(1)
}

const calistir = (komut) => spawnSync(komut, { shell: true, encoding: 'utf8' })
let hata = false
for (const [ad, komut, ozet] of [
  ['typecheck', 'npm run typecheck', null],
  ['test', 'npm test', /^\s*(Test Files|Tests)\s.*$/gm],
  ['build', 'npm run build', null],
]) {
  const r = calistir(komut)
  const cikti = `${r.stdout}\n${r.stderr}`
  // Renk kodları özet satırını bölebilir.
  const temiz = cikti.replace(/\u001b\[[0-9;]*m/g, '')
  const ayrinti = ozet ? (temiz.match(ozet) ?? []).map((s) => s.trim()).join('; ') : ''
  console.log(`${r.status === 0 ? 'OK  ' : 'FAIL'} ${ad}${ayrinti ? `: ${ayrinti}` : ''}`)
  if (r.status !== 0) {
    hata = true
    console.log(temiz.trim().split('\n').slice(-30).join('\n'))
  }
}

const rapor = calistir(`node scripts/modul-raporu.mjs ${modulId}`)
if (rapor.status !== 0) {
  console.log(rapor.stderr.trim())
  process.exit(1)
}
console.log(`\n${rapor.stdout.split('## Doğru şık konumları')[0].trim()}`)
process.exit(hata ? 1 : 0)

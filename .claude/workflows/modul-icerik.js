export const meta = {
  name: 'modul-icerik',
  description: 'Bir modülün derslerini ve sınavını sırayla yazar, inceler, düzeltir.',
  whenToUse: 'args: { modul: "modul-4", dersler: [19, 20], sinav: true }',
  phases: [{ title: 'Dersler' }, { title: 'Sınav' }],
}

const BULGULAR = {
  type: 'object',
  properties: {
    bulgular: {
      type: 'array',
      items: {
        type: 'object',
        properties: { soruId: { type: 'string' }, sorun: { type: 'string' }, duzeltme: { type: 'string' } },
        required: ['soruId', 'sorun', 'duzeltme'],
      },
    },
  },
  required: ['bulgular'],
}
const SONUC = {
  type: 'object',
  properties: {
    durum: { type: 'string', enum: ['DONE', 'BLOCKED'] },
    commit: { type: 'string' },
    ozet: { type: 'string' },
  },
  required: ['durum', 'ozet'],
}

const { modul, dersler, sinav } = args
const n = modul.split('-')[1]
const ad = (d) => `ders-${String(d).padStart(2, '0')}`

async function isle(birim, yazPrompt, incelePrompt, faz) {
  const yaz = await agent(yazPrompt, { label: `yaz:${birim}`, phase: faz, agentType: 'icerik-yazar', schema: SONUC })
  if (!yaz || yaz.durum !== 'DONE') {
    log(`${birim}: yazım durdu, modül durduruluyor`)
    return { birim, durum: 'BLOCKED', yaz }
  }
  const inc = await agent(incelePrompt, { label: `incele:${birim}`, phase: faz, agentType: 'icerik-inceleyici', schema: BULGULAR })
  const bulgular = inc?.bulgular ?? null
  if (bulgular === null) {
    log(`${birim}: inceleme tamamlanamadı`)
    return { birim, durum: 'INCELENMEDI', yaz }
  }
  if (bulgular.length === 0) return { birim, durum: 'DONE', yaz, bulgular: 0 }
  const fix = await agent(
    `Modül ${n}, ${birim}: yalnızca şu inceleme bulgularını Edit ile düzelt, dosyanın tamamını yeniden yazma. ` +
      `Commit mesajı: "fix(content): modül ${n} ${birim} inceleme düzeltmeleri".\n${JSON.stringify(bulgular)}`,
    { label: `duzelt:${birim}`, phase: faz, agentType: 'icerik-yazar', schema: SONUC },
  )
  return { birim, durum: fix?.durum ?? 'BLOCKED', yaz, bulgular: bulgular.length, liste: bulgular, fix }
}

const sonuclar = []
phase('Dersler')
for (const d of dersler) {
  const r = await isle(
    ad(d),
    `Modül ${n}, Ders ${d} yaz: content/${modul}/${ad(d)}.json. Commit mesajı: "content: modül ${n} ders ${d}".`,
    `content/${modul}/${ad(d)}.json dosyasını incele (Ders ${d}, ${modul}). Baloncuk: node scripts/baloncuklar.mjs ${modul} ${ad(d)}`,
    'Dersler',
  )
  sonuclar.push(r)
  if (r.durum === 'BLOCKED') return { sonuclar, durdu: ad(d) }
}

if (sinav) {
  phase('Sınav')
  const r = await isle(
    'sinav',
    `Modül ${n} sınavını yaz: content/${modul}/sinav.json. Modülün ders dosyalarını yalnızca kopya önlemek için tara (Grep). Commit mesajı: "content: modül ${n} sınav".`,
    `content/${modul}/sinav.json dosyasını incele (${modul} sınavı). Baloncuk: node scripts/baloncuklar.mjs ${modul} sinav`,
    'Sınav',
  )
  sonuclar.push(r)
}
return { sonuclar }

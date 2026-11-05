import { z } from 'zod'

const artikelEnum = z.enum(['der', 'die', 'das'])

const common = {
  id: z.string().min(1),
  soru: z.string(),
  aciklama: z.string().min(1),
  harfDuyarli: z.boolean().optional(),
  ipucu: z.string().min(1).optional(),
  glossKapali: z.literal(true).optional(),
  sozlukEk: z.record(z.string()).optional(),
}

const coktanSecmeli = z.object({
  ...common,
  tip: z.literal('coktan-secmeli'),
  secenekler: z.array(z.string()).min(2),
  dogru: z.number(),
})

const boslukDoldurma = z.object({
  ...common,
  tip: z.literal('bosluk-doldurma'),
  metin: z.string(),
  dogruCevaplar: z.array(z.string()).min(1),
})

const artikel = z.object({
  ...common,
  tip: z.literal('artikel'),
  isim: z.string(),
  dogru: artikelEnum,
})

const fiilCekimi = z.object({
  ...common,
  tip: z.literal('fiil-cekimi'),
  fiil: z.string(),
  satirlar: z
    .array(z.object({ zamir: z.string(), cevap: z.string(), verilen: z.boolean().optional() }))
    .min(1),
})

const cumleDizme = z.object({
  ...common,
  tip: z.literal('cumle-dizme'),
  parcalar: z.array(z.string()).min(2),
  dogruSiralar: z.array(z.array(z.string())).min(1),
})

const eslestirme = z.object({
  ...common,
  tip: z.literal('eslestirme'),
  ciftler: z.array(z.object({ sol: z.string(), sag: z.string() })).min(4).max(6),
})

const dogruYanlis = z.object({
  ...common,
  tip: z.literal('dogru-yanlis'),
  ifade: z.string(),
  dogru: z.boolean(),
})

const dinleme = z.object({
  ...common,
  tip: z.literal('dinleme'),
  okunacak: z.string(),
  mod: z.enum(['sec', 'yaz']),
  secenekler: z.array(z.string()).optional(),
  dogruCevaplar: z.array(z.string()).min(1),
})

const ceviri = z.object({
  ...common,
  tip: z.literal('ceviri'),
  kaynak: z.string(),
  dogruCevaplar: z.array(z.string()).min(1),
})

export const questionSchema = z.discriminatedUnion('tip', [
  coktanSecmeli,
  boslukDoldurma,
  artikel,
  fiilCekimi,
  cumleDizme,
  eslestirme,
  dogruYanlis,
  dinleme,
  ceviri,
])

export const kelimeSchema = z.object({
  de: z.string(),
  tr: z.string(),
  artikel: artikelEnum.optional(),
})

export const trickSchema = z.object({
  baslik: z.string().min(1),
  metin: z.string().min(1),
})

export const sozlukSchema = z.object({
  girdiler: z.record(z.string()),
})

export const partSchema = z.object({
  id: z.string(),
  ders: z.number(),
  baslik: z.string(),
  videoId: z.string(),
  ozet: z.array(z.string()).min(3).max(5),
  kelimeler: z.array(kelimeSchema),
  sorular: z.array(questionSchema),
  trickler: z.array(trickSchema).optional(),
})

export const sinavSchema = z.object({
  soruSayisi: z.number().default(25),
  gecmeNotu: z.number().default(80),
  ekSorular: z.array(questionSchema),
})

export const modulesIndexSchema = z.object({
  moduller: z.array(
    z.object({
      id: z.string(),
      sira: z.number(),
      baslik: z.string(),
      partlar: z.array(z.string()),
    }),
  ),
})

export type Question = z.infer<typeof questionSchema>
export type QuestionTip = Question['tip']
export type CoktanSecmeliQuestion = z.infer<typeof coktanSecmeli>
export type BoslukDoldurmaQuestion = z.infer<typeof boslukDoldurma>
export type ArtikelQuestion = z.infer<typeof artikel>
export type FiilCekimiQuestion = z.infer<typeof fiilCekimi>
export type CumleDizmeQuestion = z.infer<typeof cumleDizme>
export type EslestirmeQuestion = z.infer<typeof eslestirme>
export type DogruYanlisQuestion = z.infer<typeof dogruYanlis>
export type DinlemeQuestion = z.infer<typeof dinleme>
export type CeviriQuestion = z.infer<typeof ceviri>
export type Kelime = z.infer<typeof kelimeSchema>
export type Trick = z.infer<typeof trickSchema>
export type Sozluk = z.infer<typeof sozlukSchema>
export type Part = z.infer<typeof partSchema>
export type Sinav = z.infer<typeof sinavSchema>
export type ModulesIndex = z.infer<typeof modulesIndexSchema>

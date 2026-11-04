export type Answer =
  | { tip: 'coktan-secmeli'; secilen: number }
  | { tip: 'bosluk-doldurma' | 'ceviri' | 'dinleme'; metin: string } // dinleme 'sec' modunda seçilen seçeneğin metni
  | { tip: 'artikel'; secilen: 'der' | 'die' | 'das' }
  | { tip: 'fiil-cekimi'; hucreler: string[] } // satirlar ile aynı uzunluk; verilen satırlar yok sayılır
  | { tip: 'cumle-dizme'; sira: string[] }
  | { tip: 'eslestirme'; eslesme: Record<string, string> } // sol -> sag
  | { tip: 'dogru-yanlis'; secilen: boolean }

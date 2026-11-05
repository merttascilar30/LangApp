# Faz 2: Altyapı ve Modül 2 Pilotu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Şıklı boşluk, mini diyalog, çeldirici notları ve otomatik kalite testini eklemek; Modül 2'nin 8 dersini (6–13) ve sınavını Goethe veri bankasından üretmek.

**Architecture:** Şema isteğe bağlı alanlarla genişler, zorunluluk Modül 2+ içeriğini tarayan bir kalite testiyle sağlanır. Kalite kuralları test yardımcısında saf fonksiyon olarak durur; banka yalnızca testlere ve scripte girer, uygulama paketine girmez. Sorular bir aday scriptinden gelen cümlelerle elle yazılır.

**Tech Stack:** Mevcut — React 19, TypeScript strict, Zod 3, Vitest + RTL, Node 24 (script).

**Spec:** `docs/superpowers/specs/2026-11-05-faz2-icerik-design.md`

## Global Constraints

- Modül 1 içerik dosyaları (`content/modul-1/*`) ve banka/CSV dosyaları değiştirilmez.
- Yeni şema alanlarının hepsi isteğe bağlı; Modül 1 ve eski kayıtlar değişmeden çalışır.
- `kelime` biçimi ders başına en fazla %15; dört cümle biçiminin her birinden en az 2 soru.
- `goethe` ≥ %50 ve `yazildi` ≤ %15; `istisna` derste `goethe` aranmaz, `yazildi` ≤ %40. Modül 2'de istisna ders yok.
- `kaynakCumle` bankada birebir bulunur; bir derste aynı `kaynakCumle` en fazla 2 soruda.
- Ders başına 15–25 soru, en az 4 soru tipi, 3–5 `ozet`, 5–15 `kelimeler`, 2–4 `trickler`, her soruda `ipucu`.
- Kümülatif dilbilgisi: boşluk ve çeldiriciler yalnızca o derse kadar öğretilen konudan seçilir.
- Geçerli her V2 dizilimi `dogruSiralar`'da bulunur.
- Sınav sırasında çeldirici notu gösterilmez.
- UI ve açıklama metinleri Türkçe. Model yönlendirme (CLAUDE.md): implementasyon sonnet, gate opus.

## Review Focus

1. **Diyalog sorusunda otomatik ipucu seçili şıkkı elerse** boş balon yine boş görünmeli. → Task 2 testi.
2. **Sınavda cevapsız bırakılan soru, ya da hata defterinde notsuz eski soru**: "Neden olmadı" satırı çıkmamalı, hata vermemeli. → Task 3 testi.
3. **Baloncuk `metin`/`diyalog` satırında cevabı söylerse** sızıntı testi yakalamalı. → Task 4 testi.
4. **Banka cümlesinde kıvrık kesme işareti ve `–` varken** tutarlılık denetimi yanlış alarm vermemeli. → Task 4 testi.
5. **`ders-haritasi.json` içinde içeriği olan bir ders eksikse** kalite testi sessizce geçmemeli, hata vermeli. → Task 4 testi.

---

### Task 1: Şema, kurallar ve içerik yükleme

**Files:**
- Modify: `src/content/schema.ts`, `src/content/rules.ts`, `src/content/files.ts`
- Test: `tests/content/schema.test.ts`, `tests/content/rules.test.ts`, `tests/content/files.test.ts` (yeni)

**Interfaces:**
- Produces, ortak alanlar: `bicim?: 'bosluk'|'diyalog'|'siralama'|'senaryo'|'kelime'`, `kaynakTuru?: 'goethe'|'uyarlama'|'yazildi'`, `kaynakCumle?: string` (min 1).
- Produces, `coktan-secmeli`: `metin?: string`, `diyalog?: {kim: string; metin: string}[]` (min 2), `celdiriciNotlari?: string[]`.
- Produces, `checkQuestionRules` ek kuralları: `metin` tam bir `___` içerir; `diyalog` satırlarından tam biri `___` içerir; `metin` ve `diyalog` birlikte olamaz; `celdiriciNotlari.length === secenekler.length`, doğru şıkta `''`; `kaynakTuru` `goethe`/`uyarlama` ise `kaynakCumle` dolu.
- Produces: `contentFiles` yalnızca `/content/modules.json` ve `/content/modul-*/*.json`.

- [ ] **Step 1: Failing testler.** Her yeni alan için geçerli örnek parse edilir; her yeni kural tek hata üretir ve `soruId` doludur; `Object.keys(contentFiles)` hiçbir anahtarında `almanca_` veya `ders-haritasi` geçmez ve `/content/modul-1/ders-01.json` vardır.
- [ ] **Step 2:** `npx vitest run tests/content` → FAIL.
- [ ] **Step 3:** Uygula (`import.meta.glob` dizi biçiminde).
- [ ] **Step 4:** `npx vitest run tests/content` → PASS; `npm run typecheck`; `npm run build` sonrası `dist/assets` içinde `"ornekCumleler"` geçmediğini `grep` ile doğrula.
- [ ] **Step 5:** Commit `feat(content): Faz 2 soru alanları ve içerik yükleme kapsamı`

---

### Task 2: Şıklı boşluk ve mini diyalog arayüzü

**Files:**
- Modify: `src/questions/CoktanSecmeli.tsx`, `src/index.css`
- Test: `tests/questions/coktan-diyalog.test.tsx` (yeni)

**Interfaces:**
- Consumes: `metin`, `diyalog` (Task 1), `Gloss`, `QuestionProps`.
- Produces: `metin` soru yönergesinin altında `<p className="soru-almanca"><Gloss/></p>`. `diyalog` → `<ol className="diyalog">`, her satır `<li className="balon">`: `<span className="kim">{kim}</span>` + `Gloss`. `___` içeren satır `data-bos="true"`; satırdaki `___` yerine seçili şık, yoksa `…` yazılır, satırın kalanı korunur.

- [ ] **Step 1: Failing testler:**
  - `metin` görünür; alanlar yoksa eski soru DOM'u değişmez (Modül 1 biçimli soru için `.diyalog` ve `.soru-almanca` yok).
  - Diyalog: iki satır, `kim` etiketleri görünür; seçim yokken boş balonda `…`; ikinci şık seçilince balonda o şık, `onCevap({tip:'coktan-secmeli', secilen:1})`; `Wie ___ es dir?` satırında `geht` seçilince `Wie geht es dir?` görünür.
  - `cevap` `null` olunca (ipucu seçili şıkkı eledi) balon yine `…` (Review Focus 1).
  - `GlossContext` sağlanınca diyalog ve `metin` kelimeleri `.gloss`; `glossKapali` için `QuestionView` üzerinden `.gloss` yok.
- [ ] **Step 2:** `npx vitest run tests/questions/coktan-diyalog.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npx vitest run tests/questions` → PASS.
- [ ] **Step 5:** Commit `feat(questions): şıklı boşluk ve mini diyalog`

---

### Task 3: Çeldirici notları

**Files:**
- Modify: `src/domain/grading.ts`, `src/test-runner/FeedbackPanel.tsx`, `src/test-runner/TestRunner.tsx`, `src/test-runner/ResultsView.tsx`
- Test: `tests/domain/grading.test.ts`, `tests/test-runner/celdirici.test.tsx` (yeni)

**Interfaces:**
- Produces: `celdiriciNotu(q: Question, a: Answer | null): string | null` — yalnızca `coktan-secmeli`, `a.tip` eşleşir, seçilen şık yanlış, not dolu ise notu döner; aksi `null`.
- Produces: `FeedbackPanel({dogru, soru, ipucuyla, cevap?: Answer | null})` — not varsa `Neden olmadı: {not}`. `ResultsView` aynı satırı `sonuclar[i].cevap` ile gösterir.

- [ ] **Step 1: Failing testler:** `celdiriciNotu` doğru şıkta, `null` cevapta, notsuz soruda ve başka tipte `null`; yanlış şıkta not. Pratik modda yanlış şık + Kontrol → "Neden olmadı: …"; doğru şıkta yok. Sınav modunda bitirmeden önce yok; `ResultsView`'da yanlış şıkta var, cevapsız (`cevap: null`) ve `celdiriciNotlari` olmayan soruda yok (Review Focus 2).
- [ ] **Step 2:** `npx vitest run tests/domain/grading.test.ts tests/test-runner/celdirici.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npm test`, `npm run typecheck` → temiz.
- [ ] **Step 5:** Commit `feat(test-runner): çeldirici notları`

---

### Task 4: Kalite testi

**Files:**
- Create: `tests/helpers/kalite.ts`, `tests/helpers/icerik-kontrol.ts`, `tests/helpers/gloss-disi.ts`, `tests/content/kalite.test.ts`, `tests/content/faz2-icerik.test.ts`, `content/ders-haritasi.json` (yalnızca `{ "dersler": [] }`)
- Modify: `tests/content/real-content.test.ts`

**Interfaces:**
- Produces (`kalite.ts`):
  ```ts
  normCumle(s: string): string  // küçük harf; ’‘→'; . , ! ? ; : " ( ) – — - sil; boşlukları teke indir
  type KaliteGirdisi = { part: Part; istisna: boolean; bankaCumleleri: ReadonlySet<string> }
  dersKaliteHatalari(g: KaliteGirdisi): string[]   // spec §5 tablosu + goethe tutarlılığı; her hata soru id veya part id içerir
  soruKaynakHatalari(q: Question, banka: ReadonlySet<string>): string[]  // bicim/kaynakTuru dolu, bicimHatalari, kaynakCumle birebir bankada, goethe tutarlılığı, celdiriciNotlari; sınav ekSorular için de kullanılır
  bicimHatalari(q: Question): string[]  // bosluk: coktan+metin veya bosluk-doldurma; diyalog: coktan+diyalog; siralama: cumle-dizme; senaryo: coktan (metin/diyalog yok), dinleme, ceviri, dogru-yanlis; kelime: her tip. eslestirme/fiil-cekimi/artikel yalnızca kelime; senaryonun doğru cevabı (coktan: doğru şık, dinleme: okunacak, ceviri: dogruCevaplar[0], dogru-yanlis: ifade) en az 2 kelime
  bankaCumleleri(banka): Set<string>  // yalnızca modul-2..modul-8 ornekCumleler
  ```
- Produces (`icerik-kontrol.ts`), `real-content.test.ts`'teki Modül 1 mantığı buraya taşınır, davranışı aynı kalır: `glossAlanlari(q): string[]` (Modül 1 alanları + `coktan-secmeli.metin`, `diyalog[].metin`), `ipucuSizintilari(q): string[]`, `tooltipSizintilari(q, sozluk): string[]` (`bosluk-doldurma`, `eslestirme` sağ sütun, ek olarak `metin`/`diyalog` sorularında doğru şık), `glossKapsami(sorular, sozluk, disi): { oran: number; eksik: string[] }`.
- Produces (`gloss-disi.ts`): `GLOSS_DISI: Record<string, ReadonlySet<string>>`; `modul-1` listesi `real-content.test.ts`'ten taşınır.
- Produces (`ders-haritasi.json` şeması, Task 5 doldurur): `{dersler: {ders, modulId, dosya, baslik, videoId, temalar: string[], aramaKaliplari: string[], gramer: string[], istisna: boolean, istisnaGerekcesi?: string}[]}`.
- `faz2-icerik.test.ts`: banka ve harita `import` ile okunur. `modul-1` dışında `partlar`'ı dolu her modül için: her part `dersKaliteHatalari` boş; `sinav` varsa `ekSorular` 8–12 ve `soruKaynakHatalari` boş; haritadaki tüm dersleri `partlar`'daysa `sinav` zorunlu; `ipucu` dolu; sızıntılar boş; `glossKapsami` ≥ 0.8; `kelimeler` ve `ozet` sayıları. Dolu modülün her dersi haritada olmalı.

- [ ] **Step 1: Failing testler (`kalite.test.ts`, fixture'larla):**
  - Geçerli 20 soruluk fixture → `[]`.
  - Her kural tek başına: 4 `kelime` / 20 soru → hata, 3 → geçer; bir biçimden 1 soru → hata; `senaryo` 2 soru ama biri `ceviri` → hata; düz `coktan-secmeli` `diyalog` etiketli → hata; `artikel` `senaryo` etiketli → hata; tek kelimelik `ceviri` `senaryo` etiketli → hata; `goethe` 9/20 → hata, istisnada geçer; `yazildi` 4/20 → hata, istisnada 8/20 geçer, 9/20 hata; bankada olmayan `kaynakCumle` → hata; aynı `kaynakCumle` 3 soruda → hata; `celdiriciNotlari` eksik → hata.
  - Tutarlılık: `metin`, `bosluk-doldurma`, `diyalog`, `cumle-dizme`, senaryo, `dinleme`, `ceviri` ve `dogru-yanlis` için eşleşen ve eşleşmeyen birer örnek; `eslestirme` `goethe` etiketli → hata.
  - `normCumle("Wie geht’s?") === normCumle("wie geht's")`; banka cümlesi `Woher kommen Sie? – Aus Frankreich.` için diyalog satırları `Woher kommen Sie?` + `Aus Frankreich.` → geçer (Review Focus 4).
  - `tooltipSizintilari`: `metin` sorusunda tooltip doğru şıkkı içeriyorsa hata (Review Focus 3).
  - Haritada olmayan ders için `faz2-icerik` mantığı hata üretir; bunu test edilebilir saf `haritaEksikleri(moduller, harita): string[]` ile sına (Review Focus 5).
- [ ] **Step 2:** `npx vitest run tests/content/kalite.test.ts` → FAIL.
- [ ] **Step 3:** Yardımcıları yaz, `real-content.test.ts`'i bunları kullanacak şekilde sadeleştir, `faz2-icerik.test.ts`'i ekle.
- [ ] **Step 4:** `npx vitest run tests/content` → PASS, Modül 1 testleri aynı sayıda geçer; `npm run typecheck`.
- [ ] **Step 5:** Commit `test(content): Faz 2 kalite kuralları`

---

### Task 5: Ders haritası (Modül 2), aday scripti ve README

**Files:**
- Create: `scripts/ders-adaylari.mjs`
- Modify: `content/ders-haritasi.json`, `README.md`

**Interfaces:**
- Produces: `node scripts/ders-adaylari.mjs <ders>`: stdout'a markdown — başlık, gramer; kendi modülünden aday cümleler (kelime ve tema ile), sonra diğer modüllerden (Modül 1 hariç); ilgili kelimeler (`wort`, artikel, plural, `turkce`, perfekt); her cümlenin mevcut `content/modul-*/ders-*.json` içinde `kaynakCumle` olarak kullanıldığı dersler; toplam aday sayısı. Bilinmeyen ders → çıkış kodu 1. Dosya yazmaz. `aramaKaliplari` `iu` bayraklarıyla derlenir (cümle başındaki `Ich` kaçmasın); bankanın `modul-2`..`modul-8` bölümüne uygulanır.

Harita girdileri (hepsi `modulId: modul-2`, `istisna: false`, `temalar: ["Kişi zamirleri, fiil çekimi ve kendini tanıtma"]`):

| ders | dosya | videoId | başlık | aramaKaliplari | gramer |
|---|---|---|---|---|---|
| 6 | ders-06 | `PzQq3g5JHyU` | Kişi Zamirleri | `\b(ich\|du\|er\|sie\|es\|wir\|ihr\|Sie)\b` | kişi zamirleri |
| 7 | ders-07 | `bIwRfIAtjLc` | Fiil Çekimleri | `\b(ich\|du\|er\|sie\|wir\|ihr)\b` | düzenli fiil çekimi |
| 8 | ders-08 | `PuQ6czK0YAY` | Fiil Çekimleri Alıştırma | aynı | düzenli fiil çekimi, V2 |
| 9 | ders-09 | `vDQht96Rp0k` | sein Fiili | `\b(bin\|bist\|ist\|sind\|seid)\b` | sein çekimi |
| 10 | ders-10 | `YFXBI1-aDsE` | haben ve sein Farkı | `\b(habe\|hast\|hat\|haben\|habt\|bin\|bist\|ist\|sind\|seid)\b` | haben ve sein |
| 11 | ders-11 | `prCfES7w7wQ` | Artikel Nedir? | `\b(der\|die\|das\|ein\|eine)\b` | der/die/das, ein/eine |
| 12 | ders-12 | `cP4s88B_DWI` | Kendini Tanıtma | `heiß\|komm\|wohn\|Jahre\|Name\|sprech` | kendini tanıtma kalıpları |
| 13 | ders-13 | `uARcADpIlsA` | Nasılsın Kalıpları | `\bgeht\b\|geht's\|geht’s\|\bgut\b\|danke\|schlecht` | hal hatır kalıpları |

- [ ] **Step 1:** Haritayı doldur. `node scripts/ders-adaylari.mjs 9` → en az 20 aday ve "toplam" satırı; `node scripts/ders-adaylari.mjs 7` adaylarında `Ich` ile başlayan cümle var; `node scripts/ders-adaylari.mjs 99` → çıkış kodu 1.
- [ ] **Step 2:** Her ders için scripti çalıştır, aday sayılarını raporla. Bir dersin kendi modülü + diğer modüllerle 12'den az adayı varsa `BLOCKED` değil, raporda belirt (controller karar verir).
- [ ] **Step 3:** README'ye Faz 2 içerik kuralları, biçim ve kaynak etiketleri, kota tablosu ve script kullanımını ekle.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(content): Modül 2 ders haritası ve aday scripti`

---

### Task 6: Modül 2 — Dersler 6, 7, 8

### Task 7: Modül 2 — Dersler 9, 10, 11

### Task 8: Modül 2 — Dersler 12, 13 ve sınav

Üçü aynı kalıpta:

**Files:**
- Create: ilgili `content/modul-2/ders-NN.json`; Task 6'da `content/modul-2/sozluk.json`, Task 8'de `content/modul-2/sinav.json`
- Modify: `content/modules.json` (`modul-2.partlar`'a eklenen dersler), `content/modul-2/sozluk.json`, `tests/helpers/gloss-disi.ts` (`modul-2`)

**Interfaces:**
- Consumes: `node scripts/ders-adaylari.mjs <ders>`, Task 1–4 alanları ve testleri. Dosya biçimi için `content/modul-1/ders-04.json`; `id` biçimi `m2-d06`, sorular `m2-d06-q01`, sınav `m2-s-q01`.

**Soru yazım kuralları** (Global Constraints'e ek):
- Şıklı boşlukta şıklar aynı fiilin farklı kişi çekimleri veya aynı gruptan zamir/artikel; ikinci bir doğru şık bulunamaz, bağlam tek doğruyu zorunlu kılar. Her yanlış şıkkın notu neden yanlış olduğunu söyler (`du` ile `kommst` gelir), yalnızca "yanlış" demez.
- Banka cümlesinde bulunmayan fiil çekimi şıkkı kullanılabilir; çekim doğru olmalı. Çekim tablosu sorusu `fiil-cekimi` tipinde ve `kelime` biçimindedir.
- Diyalog en az 2 satır, doğal bir konuşma. İki banka cümlesi eşleştirilirse `uyarlama`.
- Senaryo: Türkçe gerçek hayat durumu, Almanca şıklar.
- `ipucu` tek Türkçe cümle, cevabı ve çevirisini söylemez. Anlamı ölçen soruda `glossKapali: true`. Yazmadan sonra her soru için tüm baloncukları listeleyip oku.
- Banka verisinde hata görürsen düzeltme, raporla.

- [ ] **Step 1:** `tests/content/faz2-icerik.test.ts` zaten denetler; `modules.json`'a dersleri ekleyince `npx vitest run tests/content` → FAIL (dosya yok).
- [ ] **Step 2:** Her ders için scripti çalıştır, soruları, `ozet`, `kelimeler`, `trickler`, sözlüğü yaz.
- [ ] **Step 3:** `npx vitest run tests/content` → PASS. Her ders için biçim ve kaynak dağılımını raporla.
- [ ] **Step 4:** `npm test`, `npm run typecheck` → temiz.
- [ ] **Step 5:** Commit `content: modül 2 dersler N–M`. Task 8: `content: modül 2 dersler 12–13 ve sınav`.

**Task 8 ek:** `sinav.json` `soruSayisi 25`, `gecmeNotu 80`, 8–12 `ekSorular`; soruların her biri bu modülün en az iki dersini birleştirir veya senaryo/diyalog biçimindedir.

---

### Task 9: Uçtan uca doğrulama (controller)

- [ ] **Step 1:** `npm run typecheck && npm test && npm run build` → temiz.
- [ ] **Step 2:** Dev sunucusunda: Modül 1 sınavını geç, Modül 2 açılır. Ders 7 → şıklı boşlukta yanlış şık → "Neden olmadı"; Ders 13 → diyalog balonları, ipucuyla eleme, boş balon; cümle dizme; baloncuk; Modül 2 sınavı → sınav sırasında not yok, sonuçta not var. Modül 1 dersi eskisi gibi çalışır.
- [ ] **Step 3:** Modül 2 kota raporunu (ders başına biçim ve kaynak dağılımı) kullanıcıya sun ve dur; Modül 3–8 ayrı plan.

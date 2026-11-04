# Almanca A1 Uygulaması — Faz 1 (Motor + Modül 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tarayıcıda çalışan, 8 modüllük Almanca A1 çalışma uygulamasının tüm motorunu ve Modül 1 (ders 1–5 + sınav) içeriğini teslim etmek.

**Architecture:** Sunucusuz React + TypeScript SPA. İçerik `content/` altında JSON; Zod ile doğrulanır. İş kuralları `src/domain/` içinde saf fonksiyonlardır (React/tarayıcı bağımlılığı yok); UI bunları çağırır. İlerleme localStorage'da tek sürümlü anahtarda tutulur.

**Tech Stack:** Node 24, Vite (react-ts şablonu), React 18, TypeScript (strict), React Router 6, Zod 3, Vitest + @testing-library/react + @testing-library/user-event + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-04-almanca-a1-app-design.md`

## Global Constraints

- UI metinleri Türkçe; içerik alan adları spec'teki Türkçe adlarla birebir (`sorular`, `aciklama`, `dogruCevaplar` …).
- Sunucu, hesap, AI çağrısı yok; tek dış kaynak YouTube embed (`https://www.youtube-nocookie.com/embed/<videoId>`).
- localStorage anahtarı: `langapp:v1`; kök nesnede `surum: 1`.
- Part testi: havuzdan rastgele 10 soru; "Geçti" eşiği %70; hiçbir şeyi kilitlemez.
- Modül sınavı: varsayılan `soruSayisi` 25, `gecmeNotu` 80; Modül 1 baştan açık; deneme sınırı yok.
- Kısmi puan yok; yazım hatası toleransı yok.
- Hata defterinden çıkış: art arda 2 doğru.
- Leitner: 3 kutu, deste ağırlıkları kutu1 ×3, kutu2 ×2, kutu3 ×1.
- TTS: `lang = "de-DE"`, yavaş hız `0.7`.
- Artikel renkleri: der mavi, die kırmızı, das yeşil.
- Model yönlendirme (CLAUDE.md): test çalıştırma/arama → haiku; implementasyon → sonnet; gate review → opus.

## Review Focus

1. **Büyük harfli umlaut / ß girişi** (`ÄPFEL`, `STRASSE` vs `Straße`) — normalizasyon büyük harfleri de eşlemeli. → Task 3 testi.
2. **Almanca ses yokken dinleme soruları çıkarılınca havuz 10'un / sınav sayısının altına düşer** — hata vermeden kalan tüm sorular dönmeli, tekrar olmamalı. → Task 4 testi.
3. **localStorage erişimi exception atar** (kota dolu, gizli mod) — uygulama bellekte çalışmaya devam etmeli, `saveProgress` `false` dönmeli. → Task 6 testi.
4. **İçe aktarılan dosya geçerli JSON ama yanlış `surum`/eksik alan** — reddedilmeli, mevcut durum değişmemeli. → Task 6 testi.
5. **Pratik testte "Kontrol et"e iki kez basmak / kontrol sonrası cevabı değiştirmek** — sonuç bir kez kaydedilmeli, cevap kilitlenmeli. → Task 12 testi.

---

## Dosya Haritası

```
content/modules.json                 modül listesi (8 modül; 2–8'in partları boş)
content/modul-1/ders-01..05.json     Modül 1 partları
content/modul-1/sinav.json           Modül 1 sınav ayarları + ekSorular
src/content/schema.ts                Zod şemaları + TS tipleri
src/content/rules.ts                 şemanın ötesindeki içerik kuralları
src/content/loader.ts                glob sonuçlarını doğrulayıp Modul[] üretir
src/domain/normalize.ts              yazılı cevap normalizasyonu
src/domain/answers.ts                Answer tipi
src/domain/grading.ts                gradeQuestion, correctAnswerText, scorePercent
src/domain/random.ts                 createRng, shuffle
src/domain/selection.ts              pickPartTest, pickExam
src/domain/progress.ts               ProgressState + kayıt/kilit/hata defteri
src/domain/leitner.ts                kart kutuları + deste
src/storage/storage.ts               load/save/export/import
src/speech/speech.ts                 Web Speech sarmalayıcı
src/state/AppState.tsx               context: içerik, ilerleme, tts durumu
src/questions/*.tsx                  9 soru bileşeni + QuestionView + UmlautKeys
src/test-runner/TestRunner.tsx       pratik/sınav akışı
src/test-runner/ResultsView.tsx      sonuç listesi
src/pages/*.tsx                      sayfalar
src/App.tsx, src/main.tsx            router
tests/**                             src yapısını yansıtır
```

---

### Task 1: Proje iskeleti

**Files:**
- Create: Vite react-ts şablonu (kök dizinde), `vitest.config.ts`, `tests/setup.ts`, `tests/smoke.test.ts`, `.gitignore`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `npm test` (= `vitest run`), `npm run dev`, `npm run build` (= `tsc -b && vite build`), `npm run typecheck` (= `tsc -b --noEmit`).

- [ ] **Step 1:** Kök dizinde `npm create vite@latest . -- --template react-ts` (mevcut `docs/`, `Claude.md` korunur; şablon sorarsa "ignore files and continue"). `npm i react-router-dom@6 zod@3`; `npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`.
- [ ] **Step 2:** `vitest.config.ts`: `environment: 'jsdom'`, `setupFiles: ['tests/setup.ts']`, `include: ['tests/**/*.test.{ts,tsx}']`. `tests/setup.ts` jest-dom'u import eder. `tsconfig` strict açık kalır; `resolveJsonModule: true`.
- [ ] **Step 3:** `tests/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Çalıştır: `npm test` → 1 passed.
- [ ] **Step 4:** Şablonun demo içeriğini (`App.css`, sayaç) temizle; `App.tsx` "Almanca A1" başlığı render etsin. `npm run build` → hatasız.
- [ ] **Step 5:** Commit: `chore: vite react-ts iskeleti ve vitest kurulumu`

---

### Task 2: İçerik şeması ve kurallar

**Files:**
- Create: `src/content/schema.ts`, `src/content/rules.ts`
- Test: `tests/content/schema.test.ts`, `tests/content/rules.test.ts`

**Interfaces:**
- Produces (schema.ts), Zod şemaları ve `z.infer` tipleri:
  - `Question` = discriminated union on `tip`; ortak: `id: string(min 1)`, `soru: string`, `aciklama: string(min 1)`, `harfDuyarli?: boolean`.
  - `coktan-secmeli`: `secenekler: string[] (min 2)`, `dogru: number`
  - `bosluk-doldurma`: `metin: string`, `dogruCevaplar: string[] (min 1)`
  - `artikel`: `isim: string`, `dogru: 'der'|'die'|'das'` *(spec tablosunda örtük; seçimin karşılaştırılacağı alan)*
  - `fiil-cekimi`: `fiil: string`, `satirlar: {zamir: string; cevap: string; verilen?: boolean}[] (min 1)`
  - `cumle-dizme`: `parcalar: string[] (min 2)`, `dogruSiralar: string[][] (min 1)`
  - `eslestirme`: `ciftler: {sol: string; sag: string}[] (4–6)`
  - `dogru-yanlis`: `ifade: string`, `dogru: boolean`
  - `dinleme`: `okunacak: string`, `mod: 'sec'|'yaz'`, `secenekler?: string[]`, `dogruCevaplar: string[] (min 1)`
  - `ceviri`: `kaynak: string`, `dogruCevaplar: string[] (min 1)`
  - `Kelime = {de: string; tr: string; artikel?: 'der'|'die'|'das'}`
  - `Part = {id; ders: number; baslik; videoId; ozet: string[] (3–5); kelimeler: Kelime[]; sorular: Question[]}`
  - `Sinav = {soruSayisi: number (default 25); gecmeNotu: number (default 80); ekSorular: Question[]}`
  - `ModulesIndex = {moduller: {id: string; sira: number; baslik: string; partlar: string[]}[]}` (`partlar` = dosya adları, uzantısız, ör. `"ders-01"`)
  - Exports: `questionSchema, partSchema, sinavSchema, modulesIndexSchema` ve tipler `Question, QuestionTip, Part, Sinav, Kelime, ModulesIndex`.
- Produces (rules.ts): `type ContentError = {dosya: string; soruId?: string; mesaj: string}`; `checkPartRules(dosya: string, part: Part): ContentError[]`; `checkQuestionRules(dosya: string, q: Question): ContentError[]`; `checkUniqueIds(all: {dosya: string; q: Question}[]): ContentError[]`.

- [ ] **Step 1: Failing testler.** `schema.test.ts`: her 9 tip için bir geçerli örnek `questionSchema.parse` ile geçer; `aciklama: ""` reddedilir; bilinmeyen `tip` reddedilir; `sinavSchema.parse({ekSorular: []})` → `{soruSayisi: 25, gecmeNotu: 80, ekSorular: []}`.
  `rules.test.ts` — her biri tek hata döndürür ve `soruId` dolu:
  - `coktan-secmeli` `dogru: 3`, 3 seçenek → mesaj "dogru" içerir
  - `bosluk-doldurma` `metin` içinde `___` yok ya da iki tane → hata
  - `dinleme` `mod: 'sec'` ve `secenekler` yok → hata; `mod: 'sec'` ve `dogruCevaplar[0]` seçeneklerde yok → hata
  - `cumle-dizme` bir `dogruSiralar` elemanı `parcalar`ın permütasyonu değil → hata
  - `checkPartRules` 14 soruluk part → "en az 15" hatası; 15 soru → `[]`
  - `checkUniqueIds` iki dosyada aynı id → hata ikinci dosyaya atanır
- [ ] **Step 2:** `npx vitest run tests/content` → FAIL (modül yok).
- [ ] **Step 3:** `schema.ts` ve `rules.ts`'yi yukarıdaki imzalarla yaz.
- [ ] **Step 4:** `npx vitest run tests/content` → PASS.
- [ ] **Step 5:** Commit: `feat(content): zod şemaları ve içerik kuralları`

---

### Task 3: Cevap normalizasyonu ve değerlendirme

**Files:**
- Create: `src/domain/normalize.ts`, `src/domain/answers.ts`, `src/domain/grading.ts`
- Test: `tests/domain/normalize.test.ts`, `tests/domain/grading.test.ts`

**Interfaces:**
- Consumes: `Question` (Task 2).
- Produces:
  - `normalizeAnswer(s: string, harfDuyarli = false): string`
  - `matchesAny(input: string, accepted: string[], harfDuyarli = false): boolean`
  - `Answer` (answers.ts):
    ```ts
    type Answer =
      | { tip: 'coktan-secmeli'; secilen: number }
      | { tip: 'bosluk-doldurma' | 'ceviri' | 'dinleme'; metin: string } // dinleme 'sec' modunda seçilen seçeneğin metni
      | { tip: 'artikel'; secilen: 'der' | 'die' | 'das' }
      | { tip: 'fiil-cekimi'; hucreler: string[] }   // satirlar ile aynı uzunluk; verilen satırlar yok sayılır
      | { tip: 'cumle-dizme'; sira: string[] }
      | { tip: 'eslestirme'; eslesme: Record<string, string> } // sol -> sag
      | { tip: 'dogru-yanlis'; secilen: boolean };
    ```
  - `gradeQuestion(q: Question, a: Answer | null): boolean` — `null` veya `tip` uyuşmazlığı → `false`.
  - `correctAnswerText(q: Question): string`
  - `scorePercent(dogru: number, toplam: number): number` — ham oran ×100, yuvarlama yok; `toplam === 0` → `0`.

- [ ] **Step 1: Failing testler.** `normalize.test.ts`:
  ```ts
  expect(normalizeAnswer('  Ich   bin  Anna. ')).toBe('ich bin anna');
  expect(normalizeAnswer('Ja, ich bin!')).toBe('ja ich bin');
  expect(normalizeAnswer('Grüße')).toBe(normalizeAnswer('gruesse'));
  expect(matchesAny('ÄPFEL', ['Äpfel'])).toBe(true);           // Review Focus 1
  expect(matchesAny('STRASSE', ['Straße'])).toBe(true);        // Review Focus 1
  expect(normalizeAnswer('Äpfel', true)).toBe('Aepfel');
  expect(matchesAny('tisch', ['Tisch'], true)).toBe(false);
  expect(matchesAny('Tsch', ['Tisch'])).toBe(false);            // yazım toleransı yok
  ```
  `grading.test.ts`: her tip için bir doğru ve bir yanlış cevap; ek olarak:
  - `gradeQuestion(q, null) === false`; tip uyuşmazlığı `false`
  - `fiil-cekimi`: `verilen: true` satırın hücresi boş olsa da doğru sayılır; bir boş hücre → yanlış
  - `eslestirme`: 4 çiftten 3'ü doğru → `false`
  - `cumle-dizme`: ikinci `dogruSiralar` ile eşleşen sıra → `true`
  - `dinleme` `mod: 'yaz'`: `'dreiundzwanzig'` vs `['dreiundzwanzig', '23']` → `true` ; `'23'` → `true`
  - `correctAnswerText`: artikel → `'der Tisch'`; dogru-yanlis → `'Doğru'`/`'Yanlış'`; cumle-dizme → `dogruSiralar[0].join(' ')`; fiil-cekimi → `'ich bin, du bist, …'` (zamir + cevap, `, ` ile); eslestirme → `'sol = sag; …'`; diğerleri → `dogruCevaplar[0]` / `secenekler[dogru]`
  - `scorePercent(7, 10) === 70`, `scorePercent(2, 3)` ≈ `66.666…`, `scorePercent(0, 0) === 0`
- [ ] **Step 2:** `npx vitest run tests/domain/normalize.test.ts tests/domain/grading.test.ts` → FAIL.
- [ ] **Step 3:** Uygula. Normalizasyon sırası (spec §5): trim → ardışık boşluk teke → sondaki `.!?` ve tüm `,` kaldır → `ä→ae ö→oe ü→ue ß→ss Ä→Ae Ö→Oe Ü→Ue ẞ→SS` → `harfDuyarli` değilse `toLowerCase()`. `coktan-secmeli`/`artikel`/`dogru-yanlis` doğrudan eşitlik; diğer metinler `matchesAny`; `cumle-dizme` token bazlı tam eşitlik.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(domain): cevap normalizasyonu ve soru değerlendirme`

---

### Task 4: Soru seçimi

**Files:**
- Create: `src/domain/random.ts`, `src/domain/selection.ts`
- Test: `tests/domain/selection.test.ts`

**Interfaces:**
- Consumes: `Question`.
- Produces:
  - `createRng(seed: number): () => number` (mulberry32, [0,1))
  - `shuffle<T>(arr: readonly T[], rng: () => number): T[]` (Fisher–Yates, yeni dizi)
  - `pickPartTest(sorular: Question[], rng: () => number, opts?: { n?: number; dinlemeHaric?: boolean }): Question[]` — varsayılan `n = 10`
  - `pickExam(partHavuzlari: Question[][], ekSorular: Question[], count: number, rng: () => number, opts?: { dinlemeHaric?: boolean }): Question[]`

- [ ] **Step 1: Failing testler.**
  - Aynı seed → aynı çıktı; farklı seed → (25 elemanlı dizide) farklı sıra.
  - `pickPartTest` 20 soruluk havuzdan 10 benzersiz soru; 6 soruluk havuzdan 6.
  - `dinlemeHaric: true` → sonuçta `tip === 'dinleme'` yok; 12 sorunun 5'i dinleme ise 7 döner, hata yok (Review Focus 2).
  - `pickExam` 5 part × 20 soru + 10 ek, `count 25` → 25 benzersiz id; her parttan en az 4, ek havuzdan en az 4 (round-robin dengesi).
  - `pickExam` toplam 12 soru varken `count 25` → 12 benzersiz soru (Review Focus 2).
- [ ] **Step 2:** `npx vitest run tests/domain/selection.test.ts` → FAIL.
- [ ] **Step 3:** Uygula. `pickExam`: havuzlar = `[...partHavuzlari, ekSorular]`, her biri filtrelenip karıştırılır; havuzlar arasında sırayla birer soru alınır, boşalan atlanır, `count`a ya da tümü bitene kadar; sonuç tekrar karıştırılır.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(domain): part testi ve modül sınavı soru seçimi`

---

### Task 5: İlerleme durumu, kilit, hata defteri, Leitner

**Files:**
- Create: `src/domain/progress.ts`, `src/domain/leitner.ts`
- Test: `tests/domain/progress.test.ts`, `tests/domain/leitner.test.ts`

**Interfaces:**
- Produces (progress.ts) — tüm fonksiyonlar saf, yeni nesne döner:
  ```ts
  type ProgressState = {
    surum: 1;
    sinavlar: Record<string, { enIyi: number; deneme: number; gecti: boolean }>; // modulId
    partlar: Record<string, { enIyi: number; izlendi: boolean }>;                // partId
    defter: Record<string, { ardisikDogru: number }>;                            // soruId
    kartlar: Record<string, 1 | 2 | 3>;                                          // Kelime.de
    ayarlar: { ttsUyariGosterildi: boolean };
  };
  ```
  `emptyProgress(): ProgressState`; `recordPartTest(s, partId, yuzde)`; `recordExam(s, modulId, yuzde, gecmeNotu)`; `setWatched(s, partId, izlendi: boolean)`; `isModuleUnlocked(siraliModulIds: string[], modulId: string, s): boolean`; `applyAnswer(s, soruId, dogru: boolean)`; `PART_GECME = 70`.
- Produces (leitner.ts): `cardBox(s, key): 1|2|3` (yoksa 1); `applyCard(s, key, biliyorum: boolean): ProgressState`; `buildDeck(keys: string[], s, rng): string[]`.

- [ ] **Step 1: Failing testler.**
  - `recordPartTest`: 60 sonra 80 sonra 70 → `enIyi 80`; `izlendi` korunur.
  - `recordExam(s,'modul-1',79,80)` → `gecti false, deneme 1`; sonra `85` → `gecti true, enIyi 85, deneme 2`; sonra `50` → `gecti` **true kalır**, `deneme 3`.
  - `isModuleUnlocked(['modul-1','modul-2'],'modul-1', empty) === true`; `'modul-2'` → false; modul-1 `gecti` → true.
  - `applyAnswer`: yanlış → `defter[id] = {ardisikDogru: 0}`; doğru → 1; doğru → silinir; doğru-yanlış-doğru → `ardisikDogru 1` ve defterde; defterde olmayan soru doğru → `defter` değişmez.
  - Leitner: yeni kart kutu 1; `biliyorum` ×3 → 3 (aşmaz); `tekrar` → 1.
  - `buildDeck(['a','b','c'])` kutular 1,2,3 → uzunluk 6; `a` 3 kez, `b` 2, `c` 1.
- [ ] **Step 2:** `npx vitest run tests/domain/progress.test.ts tests/domain/leitner.test.ts` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(domain): ilerleme, modül kilidi, hata defteri ve leitner`

---

### Task 6: Kalıcı depolama

**Files:**
- Create: `src/storage/storage.ts`
- Test: `tests/storage/storage.test.ts`

**Interfaces:**
- Consumes: `ProgressState`, `emptyProgress` (Task 5).
- Produces:
  - `STORAGE_KEY = 'langapp:v1'`
  - `progressSchema` (Zod; `surum: z.literal(1)`)
  - `loadProgress(store?: Pick<Storage,'getItem'>): { state: ProgressState; durum: 'ok' | 'bos' | 'bozuk' | 'erisilemez' }`
  - `saveProgress(state: ProgressState, store?: Pick<Storage,'setItem'>): boolean`
  - `exportProgress(state: ProgressState): string` (2 boşluk girintili JSON)
  - `parseImport(text: string): { ok: true; state: ProgressState } | { ok: false; hata: string }`
  - `clearProgress(store?: Pick<Storage,'removeItem'>): void`
  Varsayılan `store` = `window.localStorage`.

- [ ] **Step 1: Failing testler.**
  - kayıt yok → `durum 'bos'`, `state` = `emptyProgress()`
  - `saveProgress` → `loadProgress` gidiş-dönüş eşit; `exportProgress` → `parseImport` gidiş-dönüş eşit
  - bozuk JSON / şemaya uymayan veri → `durum 'bozuk'`, `state` boş
  - `getItem` exception atarsa → `durum 'erisilemez'`; `setItem` exception atarsa → `saveProgress` `false`, exception dışarı sızmaz (Review Focus 3)
  - `parseImport('{"surum":2,...}')` ve `parseImport('{"surum":1}')` (eksik alan) ve `parseImport('xyz')` → `ok: false`, `hata` Türkçe ve boş değil (Review Focus 4)
- [ ] **Step 2:** `npx vitest run tests/storage` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(storage): localStorage kaydı, dışa/içe aktarma`

---

### Task 7: İçerik yükleyici

**Files:**
- Create: `src/content/loader.ts`, `src/content/files.ts`
- Test: `tests/content/loader.test.ts`

**Interfaces:**
- Consumes: şemalar ve kurallar (Task 2).
- Produces:
  - `type Modul = { id: string; sira: number; baslik: string; partlar: (Part & { dosya: string })[]; sinav: Sinav | null }`
  - `type SoruKaydi = { soru: Question; modulId: string; partId: string | null }` (`null` = sınav ek sorusu)
  - `loadContent(files: Record<string, unknown>): { moduller: Modul[]; hatalar: ContentError[]; soruIndex: Map<string, SoruKaydi> }` — anahtarlar `/content/modules.json`, `/content/<modulId>/<dosya>.json` biçiminde.
  - `files.ts`: `export const contentFiles = import.meta.glob('/content/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;`

- [ ] **Step 1: Failing testler** (fixture nesneleriyle, gerçek dosya yok):
  - 2 modül, modul-1'de 2 geçerli part + sinav → `moduller` sıraya göre, `hatalar []`, `soruIndex` tüm id'leri içerir.
  - bir part şemaya uymuyor → o part atlanır, diğeri yüklenir, `hatalar[0].dosya === '/content/modul-1/ders-02.json'`.
  - `modules.json`'da listelenen ama olmayan dosya → hata "bulunamadı".
  - `modules.json` yok/bozuk → `moduller []`, tek hata.
  - kural hatası (ör. 14 soru) → part **yine yüklenir**, hata listelenir (kural hataları uyarıdır; şema hataları partı düşürür).
  - `sinav.json` yoksa `sinav: null`.
  - iki farklı partta aynı soru `id` → `checkUniqueIds` hatası listelenir (her iki part yüklenir).
- [ ] **Step 2:** `npx vitest run tests/content/loader.test.ts` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(content): içerik yükleyici`

---

### Task 8: Konuşma (TTS) sarmalayıcı

**Files:**
- Create: `src/speech/speech.ts`
- Test: `tests/speech/speech.test.ts`

**Interfaces:**
- Produces: `detectGermanVoice(timeoutMs = 1500): Promise<boolean>` (voices boşsa `voiceschanged` bekler; `speechSynthesis` yoksa `false`); `speak(text: string, opts?: { yavas?: boolean }): void` (`lang 'de-DE'`, Almanca ses, `rate` yavaşta `0.7` yoksa `1`; önce `cancel()`).

- [ ] **Step 1: Failing testler** — `window.speechSynthesis` ve `SpeechSynthesisUtterance` mock'lanır: `de-DE` sesi varken `true`; yalnızca `en-US` → `false`; `speechSynthesis` undefined → `false`; `speak('Hallo',{yavas:true})` → `speak` çağrısındaki utterance `rate 0.7`, `lang 'de-DE'`.
- [ ] **Step 2:** `npx vitest run tests/speech` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(speech): almanca tts sarmalayıcı`

---

### Task 9: Uygulama durumu, yönlendirme ve ana sayfa

**Files:**
- Create: `src/state/AppState.tsx`, `src/pages/HomePage.tsx`, `src/components/Layout.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `tests/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `loadContent`, `contentFiles`, `loadProgress`, `saveProgress`, `detectGermanVoice`, `isModuleUnlocked`.
- Produces:
  - `AppStateProvider({ files?, store?, detectVoice?, children })` — `files` varsayılanı `contentFiles`, `store` varsayılanı `localStorage`, `detectVoice?: () => Promise<boolean>` varsayılanı `detectGermanVoice` (testlerde enjekte edilir; Task 13–15 testleri `ttsVar`'ı bu prop'a kontrol edilebilir bir promise vererek yönetir: çözülmeden önce `null`, çözülünce `true/false`).
  - `useAppState(): { moduller; hatalar; soruIndex; progress: ProgressState; depolamaDurumu: 'ok'|'bos'|'bozuk'|'erisilemez'; update(fn: (s: ProgressState) => ProgressState): void; replaceProgress(s: ProgressState): void; ttsVar: boolean | null }` — `update` her çağrıda `saveProgress` yapar, **ancak `depolamaDurumu === 'bozuk'` iken kaydetmez** (bozuk veri kullanıcı seçim yapmadan ezilmesin). `replaceProgress` kaydeder ve `depolamaDurumu`'nu `'ok'` yapar. `ttsVar` `null` = algılama sürüyor.
  - Rotalar (`App.tsx`, `HashRouter` — statik dosya olarak da çalışsın): `/`, `/modul/:modulId`, `/modul/:modulId/part/:partId`, `/modul/:modulId/part/:partId/test`, `/modul/:modulId/sinav`, `/defter`, `/kartlar`, `/ilerleme`, `/ayarlar`. Henüz yazılmamış sayfalar için geçici `<p>Yakında</p>`.
  - `Layout`: üst menü (Modüller, Hata Defteri, Kartlar, İlerleme, Ayarlar).

- [ ] **Step 1: Failing testler** (fixture içerik + bellek store ile):
  - 8 modül listelenir; Modül 1 açık (link), Modül 2 "Kilitli" etiketli ve link değil.
  - progress'te modul-1 `gecti` → Modül 2 link olur.
  - `hatalar` doluysa "İçerik hataları" paneli dosya adını gösterir.
  - `depolamaDurumu 'bozuk'` → "Kayıtlı ilerleme okunamadı" uyarısı, "Ayarlar'dan yedek içe aktar" linki ve "Sıfırdan başla" düğmesi (`replaceProgress(emptyProgress())`, uyarı kaybolur); `'erisilemez'` → "İlerleme bu tarayıcıda kaydedilemiyor" uyarısı.
  - `'bozuk'` durumunda bir `update` çağrısı sonrası store'daki ham değer **değişmemiş** olmalı; "Sıfırdan başla" sonrası store `emptyProgress()` içerir.
  - Partı olmayan açık modül kartında "İçerik yakında".
- [ ] **Step 2:** `npx vitest run tests/pages/HomePage.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS; `npm run build` → hatasız.
- [ ] **Step 5:** Commit: `feat(app): uygulama durumu, yönlendirme ve ana sayfa`

---

### Task 10: Seçmeli soru bileşenleri

**Files:**
- Create: `src/questions/types.ts`, `src/questions/CoktanSecmeli.tsx`, `src/questions/DogruYanlis.tsx`, `src/questions/Artikel.tsx`, `src/questions/Eslestirme.tsx`, `src/questions/QuestionView.tsx`
- Test: `tests/questions/secmeli.test.tsx`

**Interfaces:**
- Consumes: `Question`, `Answer`.
- Produces:
  - `type QuestionProps<Q extends Question> = { soru: Q; cevap: Answer | null; onCevap: (a: Answer) => void; kilitli: boolean }` — bileşenler **kontrollü**; her değişiklikte `onCevap`; `kilitli` iken tüm girişler `disabled`. Doğru/yanlış kararı bileşende **verilmez**.
  - `QuestionView(props: QuestionProps<Question>)` — `tip`e göre ilgili bileşeni seçer (Task 11 tipleri de buraya eklenir).
  - Artikel düğmeleri renkli: der mavi, die kırmızı, das yeşil.
  - Eslestirme: önce soldan, sonra sağdan tıklayarak eşleştirme; sağ sütun `soru.id` tohumlu `shuffle` ile karışık; eşleşmiş çift tıklanınca çözülür.

- [ ] **Step 1: Failing testler:** CoktanSecmeli ikinci seçeneğe tıklayınca `onCevap({tip:'coktan-secmeli', secilen:1})`; `kilitli` → düğmeler disabled; DogruYanlis "Yanlış" → `{secilen:false}`; Artikel "die" → `{secilen:'die'}`; Eslestirme 4 çiftin hepsi eşleşince son `onCevap` çağrısında `eslesme` 4 anahtarlı; QuestionView `tip: 'artikel'` için der/die/das düğmelerini render eder.
- [ ] **Step 2:** `npx vitest run tests/questions/secmeli.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(questions): seçmeli soru bileşenleri`

---

### Task 11: Yazılı ve çok parçalı soru bileşenleri

**Files:**
- Create: `src/questions/UmlautKeys.tsx`, `src/questions/BoslukDoldurma.tsx`, `src/questions/Ceviri.tsx`, `src/questions/Dinleme.tsx`, `src/questions/FiilCekimi.tsx`, `src/questions/CumleDizme.tsx`
- Modify: `src/questions/QuestionView.tsx`
- Test: `tests/questions/yazili.test.tsx`

**Interfaces:**
- Consumes: `QuestionProps` (Task 10), `speak` (Task 8).
- Produces:
  - `UmlautKeys({ onInsert: (ch: string) => void })` — `ä ö ü ß Ä Ö Ü` düğmeleri; bir input'un imleç konumuna eklemek için kullanılır (son odaklanan input'u ref ile takip et).
  - BoslukDoldurma: `metin` `___` ile ikiye bölünür, araya input.
  - Dinleme: 🔊 (`speak(okunacak)`) ve 🐢 (`speak(okunacak,{yavas:true})`); `mod 'sec'` → seçenek düğmeleri, seçilen metin `{tip:'dinleme', metin}`; `mod 'yaz'` → input + UmlautKeys.
  - FiilCekimi: tablo; `verilen` satırlar salt-okunur metin, diğerleri input; `hucreler` satır sırasında.
  - CumleDizme: karışık parça çipleri (tohum `soru.id`); tıklanan çip cevap satırına geçer, cevap satırındaki çip tıklanınca geri döner.

- [ ] **Step 1: Failing testler:** Bosluk input'una "bin" yaz → son `onCevap` `{tip:'bosluk-doldurma', metin:'bin'}`; UmlautKeys "ü" → input değeri sonuna "ü" eklenir; Dinleme 🔊 → mock `speak` `okunacak` ile çağrılır; FiilCekimi 3 satırdan biri `verilen` → 2 input; CumleDizme üç çipe sırayla tıkla → `sira` tıklama sırasında; cevap satırındaki bir çipe tıkla → `sira`dan çıkar; `kilitli` → tüm input'lar disabled.
- [ ] **Step 2:** `npx vitest run tests/questions/yazili.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npx vitest run tests/questions` → PASS.
- [ ] **Step 5:** Commit: `feat(questions): yazılı, dinleme, fiil çekimi ve cümle dizme bileşenleri`

---

### Task 12: Test yürütücü ve sonuç görünümü

**Files:**
- Create: `src/test-runner/TestRunner.tsx`, `src/test-runner/ResultsView.tsx`, `src/test-runner/FeedbackPanel.tsx`
- Test: `tests/test-runner/TestRunner.test.tsx`

**Interfaces:**
- Consumes: `QuestionView`, `gradeQuestion`, `correctAnswerText`, `scorePercent`, `speak`.
- Produces:
  - `type SoruSonucu = { soruId: string; dogru: boolean; cevap: Answer | null }`
  - `TestRunner({ sorular: Question[]; mod: 'pratik' | 'sinav'; onBitti: (sonuclar: SoruSonucu[]) => void })`
  - `ResultsView({ sorular: Question[]; sonuclar: SoruSonucu[]; gecmeNotu: number; baslik: string })` — skor `X / N (%Y)` (Y tam sayıya aşağı yuvarlanmış **gösterim**), geçti/kaldı, her soru için ✓/✗, doğru cevap metni, `aciklama`, Almanca doğru cevap için 🔊.
  - `FeedbackPanel({ dogru: boolean; soru: Question })` — yeşil "Doğru!" / kırmızı "Yanlış" + doğru cevap + açıklama.

- [ ] **Step 1: Failing testler:**
  - **Pratik:** "Kontrol et" cevap yokken disabled; cevap verip tıklayınca FeedbackPanel görünür, soru `kilitli`; "Kontrol et" artık görünmez/disabled, cevap değiştirilemez; "Devam" → sonraki soru; son soruda "Devam" → `onBitti` **bir kez**, sonuç dizisi soru sayısı uzunluğunda, her `soruId` bir kez (Review Focus 5).
  - **Sınav:** geri bildirim panelı hiç görünmez; "İleri"/"Geri" ile gezinilir ve önceki cevap korunur; "Bitir" cevapsız soru varken "N soru cevapsız. Yine de bitir?" onayı ister; onaylanınca cevapsız soru `dogru: false, cevap: null`.
  - ResultsView `7/10`, `gecmeNotu 70` → "Geçti"; `2/3` → "%66" gösterir ve `gecmeNotu 70` ile "Kaldı".
- [ ] **Step 2:** `npx vitest run tests/test-runner` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(test-runner): pratik ve sınav akışı, sonuç görünümü`

---

### Task 13: Modül, part ve part testi sayfaları

**Files:**
- Create: `src/pages/ModulePage.tsx`, `src/pages/PartPage.tsx`, `src/pages/PartTestPage.tsx`
- Modify: `src/App.tsx`
- Test: `tests/pages/module-part.test.tsx`

**Interfaces:**
- Consumes: `useAppState`, `isModuleUnlocked`, `pickPartTest`, `createRng`, `TestRunner`, `ResultsView`, `applyAnswer`, `recordPartTest`, `setWatched`, `PART_GECME`.
- Produces: sayfalar. PartTestPage soruları **yalnızca `ttsVar !== null` olduktan sonra** seçer (o zamana dek "Hazırlanıyor…"), `dinlemeHaric: ttsVar === false` ile; bitince her sonuç için `applyAnswer`, ardından `recordPartTest` tek `update` içinde; ResultsView `gecmeNotu 70`, "Tekrar çöz" ve "Parta dön". `ttsVar === false && !ayarlar.ttsUyariGosterildi` ise test başında bir kerelik uyarı: "Bilgisayarında Almanca ses yok. Windows Ayarlar > Saat ve dil > Dil ve bölge'den Almanca'yı ekle. Dinleme soruları şimdilik atlanacak." ve bayrak set edilir.

- [ ] **Step 1: Failing testler:**
  - Kilitli modül URL'sine doğrudan gidince "Bu modül kilitli" ve sınav/part linkleri yok.
  - ModulePage: partlar ders sırasıyla, en iyi skor (`%80`) ve izlendi işareti; "Modül sınavına gir" linki her zaman görünür (C kuralı).
  - PartPage: iframe `src` = `https://www.youtube-nocookie.com/embed/<videoId>`; "YouTube'da aç" linki `https://www.youtube.com/watch?v=<videoId>`; özet maddeleri; "İzledim" checkbox → `partlar[id].izlendi true` kaydedilir.
  - PartTestPage: `ttsVar` önce `null` → "Hazırlanıyor…" ve soru yok; `false` olunca dinleme soruları seçilmez ve Almanca ses uyarısı bir kez görünür (ikinci girişte görünmez).
  - PartTestPage: 12 soruluk fixture part → 10 soru render edilir; tamamı doğru cevaplanınca progress `partlar[id].enIyi === 100`, yanlış yapılan soru `defter`e girer.
- [ ] **Step 2:** `npx vitest run tests/pages/module-part.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(pages): modül, part ve part testi sayfaları`

---

### Task 14: Modül sınavı sayfası

**Files:**
- Create: `src/pages/ExamPage.tsx`
- Modify: `src/App.tsx`
- Test: `tests/pages/ExamPage.test.tsx`

**Interfaces:**
- Consumes: `pickExam`, `TestRunner (mod 'sinav')`, `ResultsView`, `recordExam`, `applyAnswer`, `isModuleUnlocked`.
- Produces: giriş ekranı ("25 soru, geçme notu %80, sonuçlar sınav sonunda gösterilir" — sayılar `sinav`dan), "Başla" (`ttsVar === null` iken disabled, "Hazırlanıyor…"); seçim `pickExam(..., { dinlemeHaric: ttsVar === false })`; PartTestPage'deki bir kerelik ses uyarısı burada da uygulanır; bitince tek `update` ile `applyAnswer` ×N + `recordExam`; geçtiyse ve sonraki modül varsa "Modül N açıldı!" ve linki. `sinav === null` → "Bu modülün sınavı henüz yok".

- [ ] **Step 1: Failing testler** (fixture: 2 modül, `soruSayisi 5`, `gecmeNotu 80`): tüm doğru → `sinavlar['modul-1']` `{enIyi:100, deneme:1, gecti:true}` ve "Modül 2 açıldı!"; 3/5 doğru → `gecti false`, "Kaldı", "Tekrar dene" yeni seçimle sınavı baştan başlatır ve `deneme` 2 olur; kilitli modülün sınav URL'si → "Bu modül kilitli"; `ttsVar false` iken render edilen sınavda `dinleme` sorusu yok; `ttsVar null` iken "Başla" disabled.
- [ ] **Step 2:** `npx vitest run tests/pages/ExamPage.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(pages): modül sınavı ve modül kilidi açma`

---

### Task 15: Hata defteri ve kelime kartları

**Files:**
- Create: `src/pages/MistakesPage.tsx`, `src/pages/FlashcardsPage.tsx`
- Modify: `src/App.tsx`
- Test: `tests/pages/mistakes-cards.test.tsx`

**Interfaces:**
- Consumes: `soruIndex`, `TestRunner (pratik)`, `applyAnswer`, `cardBox`, `applyCard`, `buildDeck`, `speak`, `isModuleUnlocked`.
- Produces:
  - MistakesPage: modül filtresi (Tümü + modüller), defterdeki sorular (soru metni + modül/ders adı), sayıları; "Tekrar çöz" → filtredeki tüm sorular karışık, pratik modda (`ttsVar === false` ise `dinleme` soruları çıkarılır; `ttsVar === null` iken düğme disabled); bitince `applyAnswer` ×N. `soruIndex`'te olmayan id'ler sessizce gösterilmez. Boşsa "Hata defterin boş 🎉".
  - FlashcardsPage: kapsam seçici (açık modüller tek tek + "Tüm açık modüller"); kart: ön yüz Almanca (artikel rengiyle), tıklayınca arka yüz Türkçe; 🔊; "Biliyorum"/"Tekrar" → `applyCard`, sonraki kart; deste bitince özet (kaç kart kutu 3'te). Kart anahtarı `Kelime.de`; aynı `de` farklı partlarda tekrar ederse destede bir kez.

- [ ] **Step 1: Failing testler:** defterde 2 soru → 2 satır; "Tekrar çöz" ve ikisini doğru cevapla → `ardisikDogru 1` ile defterde kalırlar; aynı akış ikinci kez → defter boş, "Hata defterin boş" görünür; defterde 1 dinleme + 1 çoktan seçmeli, `ttsVar false` → tekrar testinde yalnızca çoktan seçmeli. Kartlar: `der Tisch` ön yüzde, mavi renk sınıfı/`data-artikel="der"`; tıklayınca "masa"; "Biliyorum" → `kartlar['der Tisch'] === 2`; kilitli modül kapsam seçicide yok.
- [ ] **Step 2:** `npx vitest run tests/pages/mistakes-cards.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(pages): hata defteri ve kelime kartları`

---

### Task 16: İlerleme ve ayarlar sayfaları

**Files:**
- Create: `src/pages/ProgressPage.tsx`, `src/pages/SettingsPage.tsx`
- Modify: `src/App.tsx`
- Test: `tests/pages/progress-settings.test.tsx`

**Interfaces:**
- Consumes: `useAppState` (`replaceProgress`), `exportProgress`, `parseImport`, `clearProgress`, `emptyProgress`, `isModuleUnlocked`, `cardBox`.
- Produces:
  - ProgressPage: modül başına durum (Kilitli / Açık / Geçildi), sınav en iyi skoru ve deneme sayısı; açılır part listesi (en iyi skor, izlendi); genel: "Geçilen modül X/8", "Defterdeki soru N" (yalnızca `soruIndex`'te bulunan id'ler sayılır), "Öğrenilen kart K" (kutu 3).
  - SettingsPage: "İlerlemeyi dışa aktar" → `langapp-ilerleme-YYYY-MM-DD.json` indirme (Blob + `a[download]`); "İçe aktar" → dosya seçimi → `parseImport` → hata ise mesaj, değilse `confirm("Mevcut ilerlemenin üzerine yazılacak. Emin misin?")` → `replaceProgress`; "İlerlemeyi sıfırla" → `confirm` → `replaceProgress(emptyProgress())`.

- [ ] **Step 1: Failing testler:** modul-1 geçilmiş fixture → "Geçildi", modul-2 "Açık", modul-3 "Kilitli", "Geçilen modül 1/8"; defterde 2 geçerli + 1 silinmiş (indekste olmayan) id → "Defterdeki soru 2"; geçersiz içe aktarma dosyası → hata mesajı görünür ve progress değişmez; geçerli dosya + onay → progress dosyadakiyle eşit; sıfırla + onay iptal → değişmez, onay → `emptyProgress()`.
- [ ] **Step 2:** `npx vitest run tests/pages/progress-settings.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `feat(pages): ilerleme ve ayarlar sayfaları`

---

### Task 17: Modül 1 içeriği ve içerik doğrulama testi

**Files:**
- Create: `content/modules.json`, `content/modul-1/ders-01.json` … `ders-05.json`, `content/modul-1/sinav.json`
- Test: `tests/content/real-content.test.ts`

**Interfaces:**
- Consumes: `loadContent` (Task 7) — test, gerçek dosyaları `import.meta.glob` ile okur.

`modules.json`: spec §2'deki 8 modül, `id` `modul-1`…`modul-8`, `baslik` tablodaki konu, `modul-1.partlar = ["ders-01",…,"ders-05"]`, diğerleri `[]`.

| Dosya | `videoId` | Başlık | Ağırlıklı tipler |
|---|---|---|---|
| ders-01 | `-ZlcZkXzB-o` | Alman Alfabesi | dinleme (harf okunuşu), çoktan seçmeli, eşleştirme |
| ders-02 | `_kYWayfO91g` | Alfabe ile Kodlama (harfleme) | dinleme `yaz` (harflenen kelime), boşluk doldurma |
| ders-03 | `kS5YPHW7uoI` | Harf Kombinasyonları ve Telaffuz (sch, ch, ei, ie, eu/äu, sp/st, z, v, w) | dinleme, çoktan seçmeli, doğru-yanlış |
| ders-04 | `fnDgOuiHBno` | Selamlaşma Kalıpları | eşleştirme, cümle dizme, çeviri, boşluk doldurma |
| ders-05 | `7DYGI5ld1_A` | Vedalaşma Kalıpları | eşleştirme, cümle dizme, çeviri, doğru-yanlış |

Kurallar (spec §10): part başına 15–25 soru, en az 4 farklı tip, her soruda Türkçe 1–2 cümle `aciklama`, 3–5 madde `ozet`, 5–15 `kelimeler`; `sinav.json` `soruSayisi 25`, `gecmeNotu 80`, 8–12 `ekSorular` (selamlaşma + veda + telaffuzu birleştiren). Soru id biçimi `m1-d01-q01`, sınav `m1-s-q01`. İçerik konu başlığından özgün yazılır, videodan metin kopyalanmaz.

- [ ] **Step 1: Failing test** `real-content.test.ts`: `loadContent(gerçek glob)` → `hatalar` boş; `moduller.length === 8`; modul-1'de 5 part ve `sinav !== null`; her partta `new Set(sorular.map(q=>q.tip)).size >= 4`; `kelimeler.length` 5–15; `sinav.ekSorular.length` 8–12.
- [ ] **Step 2:** `npx vitest run tests/content/real-content.test.ts` → FAIL.
- [ ] **Step 3:** `modules.json` ve ders-01…05 + sinav.json'u yaz.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit: `content: modül 1 (ders 1–5) soru bankası ve sınav`

---

### Task 18: Uçtan uca doğrulama

**Files:**
- Create: `.claude/launch.json` (`npm run dev`, port 5173), `README.md` (kurulum: `npm install`, `npm run dev`; içerik ekleme kuralları özeti)

- [ ] **Step 1:** `npm run typecheck && npm test && npm run build` → üçü de hatasız.
- [ ] **Step 2:** Dev sunucusunu aç; tarayıcıda elle: Modül 1 → Ders 4 → video görünür → test çöz (bir yanlış yap) → geri bildirim ve açıklama → sonuç; Hata Defteri'nde yanlış soru görünür; Modül 1 sınavını %80+ ile geç → Modül 2 açılır ("İçerik yakında"); Kartlar'da bir kart çevir, 🔊 çalışır; Ayarlar'dan dışa aktar, sıfırla, içe aktar → ilerleme geri gelir; sayfayı yenile → ilerleme korunur.
- [ ] **Step 3:** Commit: `docs: README ve launch yapılandırması`

---

## Faz 2 (bu planın dışında)

Modül 2–8 içerikleri, her biri Task 17 kalıbıyla ayrı bir görev: `modules.json`'a part dosyalarını ekle, ders JSON'larını + `sinav.json`'u yaz, `real-content.test.ts`'deki modül-1'e özel kontrolleri ilgili modül için genişlet. Her modül sonrası kullanıcı incelemesi.

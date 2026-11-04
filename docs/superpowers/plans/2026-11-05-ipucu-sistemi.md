# İpucu Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ders içi testlere iki kademeli ipucu düğmesi, kelime üzerine gelince Türkçe anlam ve Trick kartları eklemek; Modül 1 içeriğini bunlarla doldurmak.

**Architecture:** Yeni saf domain modülleri (`hints.ts`, `gloss.ts`) karar verir; içerik şeması isteğe bağlı alanlarla genişler; sözlük `AppStateProvider` içinden bir context ile soru bileşenlerine ulaşır (bileşenler provider olmadan da çalışır); `TestRunner` ipucu kademesini yönetir ve sonucu `SoruSonucu.ipucu` ile bildirir.

**Tech Stack:** Mevcut — React 19, TypeScript strict, Vite 8, react-router 6, Zod 3, Vitest + RTL + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-05-ipucu-sistemi-design.md` (üst spec: `2026-11-04-almanca-a1-app-design.md`)

## Global Constraints

- UI metinleri Türkçe; yeni içerik alan adları spec'teki gibi: `ipucu`, `sozlukEk`, `trickler` (`baslik`, `metin`), `sozluk.json` → `girdiler`.
- Tüm yeni şema alanları isteğe bağlı; mevcut içerik ve kayıtlar değişmeden geçerli kalmalı.
- İpucu bedelsiz: puan değişmez; ipucuyla doğru → `defter[id] = { ardisikDogru: 0, ipucuyla: true }`.
- İpucu düğmesi sadece `mod 'pratik'`; sınavda render edilmez.
- Gloss sadece Almanca alanlara: `bosluk-doldurma.metin`, `dogru-yanlis.ifade`, `artikel.isim`, `coktan-secmeli.secenekler`, `cumle-dizme.parcalar`, `eslestirme` sol, `fiil-cekimi.fiil`. `dinleme` seçenekleri ve Türkçe alanlar hariç.
- Otomatik ipucu deterministik: `autoHint(q, createRng(hashString(q.id)))`.
- Doğruluk kararı yalnızca `src/domain/`; bileşenler karar vermez.
- Model yönlendirme (CLAUDE.md): implementasyon sonnet; test/arama haiku; gate opus.

## Review Focus

1. **Gloss'lu seçenek düğmesine tıklama** — iç `<span>` tıklamayı yutmamalı; seçim yine yapılmalı. → Task 5 testi.
2. **İpucu sonrası cevabı değiştirmeye çalışma** (kilitli ilk parçayı/çifti/hücreyi kaldırma) — mümkün olmamalı. → Task 7 testi.
3. **`ipucu` alanı olmayan eski soru** — düğme doğrudan kademe 2'ye geçmeli; `autoHint` `null` ise (doğru-yanlış, ipucu yok) düğme hiç gösterilmemeli. → Task 6 testi.
4. **Trick paneli açılınca devam eden test sıfırlanmamalı.** → Task 8 testi.
5. **`ipucuyla` alanı olan/olmayan kayıtların içe aktarılması** ve eski kayıtların yüklenmesi. → Task 4 testi.

---

## Dosya Haritası

```
src/content/schema.ts        + ipucu, sozlukEk, trickler, sozlukSchema
src/content/loader.ts        + Modul.sozluk (sozluk.json + kelimeler birleşimi)
src/domain/hints.ts          YENİ: AutoHint, autoHint, applyAutoHint
src/domain/gloss.ts          YENİ: GlossToken, glossTokens
src/domain/progress.ts       applyAnswer(.., ipucuKullanildi)
src/storage/storage.ts       defter ipucuyla?: true
src/state/SozlukContext.tsx  YENİ: SozlukContext (sozlukFor), GlossContext
src/state/AppState.tsx       SozlukContext.Provider
src/questions/Gloss.tsx      YENİ: <Gloss metin/>
src/questions/*.tsx          Gloss uygulama + ipucu prop
src/test-runner/*.tsx        ipucu düğmesi, kademe, SoruSonucu.ipucu
src/components/TrickList.tsx YENİ
src/pages/*.tsx              applyAnswer ipucu, rozet, trick yerleşimi
content/modul-1/*            sozluk.json, ipucu, trickler
```

---

### Task 1: Şema ve yükleyici

**Files:**
- Modify: `src/content/schema.ts`, `src/content/loader.ts`
- Test: `tests/content/schema.test.ts`, `tests/content/loader.test.ts`

**Interfaces:**
- Produces: `questionSchema` ortak alanlara `ipucu: z.string().min(1).optional()`, `sozlukEk: z.record(z.string()).optional()`; `trickSchema = {baslik: string(min1), metin: string(min1)}`, `Trick` tipi; `partSchema.trickler: z.array(trickSchema).optional()`; `sozlukSchema = z.object({ girdiler: z.record(z.string()) })`, `Sozluk` tipi.
- Produces: `Modul.sozluk: Record<string, string>`. Birleştirme: önce tüm partların `kelimeler` (`de` → `tr`), sonra `sozluk.json` girdileri üzerine yazar. Anahtar dosyası `/content/<modulId>/sozluk.json`.

- [ ] **Step 1: Failing testler.** schema: `ipucu`/`sozlukEk` içeren soru ve `trickler` içeren part geçer; `ipucu: ""` reddedilir; alanlar olmadan mevcut fixture'lar geçmeye devam eder. loader: `kelimeler` `{de:'der Tisch', tr:'masa'}` + `sozluk.json` `{girdiler:{'der Tisch':'masa (sözlük)', geht:'gidiyor'}}` → `modul.sozluk` `{ 'der Tisch': 'masa (sözlük)', geht: 'gidiyor' }`; `sozluk.json` yok → sadece kelimeler, `hatalar` boş; bozuk `sozluk.json` (`{girdiler: 5}`) → `hatalar`'da `"Şema hatası"` ile dosya, `sozluk` kelimelerden oluşur.
- [ ] **Step 2:** `npx vitest run tests/content` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npx vitest run tests/content` → PASS; `npm run typecheck`.
- [ ] **Step 5:** Commit `feat(content): ipucu, sözlük ve trick alanları`

---

### Task 2: Otomatik ipucu

**Files:**
- Create: `src/domain/hints.ts`
- Test: `tests/domain/hints.test.ts`

**Interfaces:**
- Consumes: `Question`, `Answer`, `createRng`.
- Produces:
  ```ts
  type AutoHint =
    | { tur: 'ele'; indeksler: number[] }
    | { tur: 'ilkHarf'; harf: string }
    | { tur: 'ilkParca'; parca: string }
    | { tur: 'cift'; sol: string; sag: string }
    | { tur: 'hucre'; satir: number; cevap: string }
  autoHint(q: Question, rng: () => number): AutoHint | null
  applyAutoHint(q: Question, cevap: Answer | null, h: AutoHint): Answer | null
  ```
  `applyAutoHint`: `ilkParca` → `{tip:'cumle-dizme', sira:[parca, ...(eski sira'dan parca'nın ilk geçişi çıkarılmış)]}`; `cift` → eslesme'ye çifti ekler (aynı sol ya da sağın eski eşleşmesini kaldırarak); `hucre` → `hucreler[satir] = cevap` (uzunluk `satirlar.length`); `ele`/`ilkHarf` → `cevap` değişmeden (seçili şık elendiyse `null`).

- [ ] **Step 1: Failing testler** (spec §3 kurallarıyla):
  - 4 şıklı coktan-secmeli → `ele` 1 indeks, doğru indeks asla yok (100 farklı seed); 5 şıklı → 2 indeks; 2 şıklı → 1 indeks.
  - dinleme `sec` → doğru seçenek (`dogruCevaplar[0]`'a eşit) elenmez; dinleme `yaz` → `{tur:'ilkHarf', harf: dogruCevaplar[0][0]}`.
  - artikel `dogru:'die'` → `ele` tek indeks, `1` değil.
  - bosluk/ceviri → ilk harf; cumle-dizme → `dogruSiralar[0][0]`; eslestirme → `ciftler` içinden bir çift; fiil-cekimi (ilk satır `verilen`) → `satir: 1`; dogru-yanlis → `null`.
  - aynı seed → aynı sonuç.
  - `applyAutoHint`: cumle-dizme `sira ['b','a']` + ilkParca `'a'` → `['a','b']`; eslestirme mevcut `{x:'2'}` + çift `{sol:'y', sag:'2'}` → `{y:'2'}`; fiil hücre doldurulur; coktan `secilen` elenen indeks ise `null`.
- [ ] **Step 2:** `npx vitest run tests/domain/hints.test.ts` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit `feat(domain): otomatik ipucu`

---

### Task 3: Gloss tokenları

**Files:**
- Create: `src/domain/gloss.ts`
- Test: `tests/domain/gloss.test.ts`

**Interfaces:**
- Produces: `type GlossToken = { metin: string; anlam?: string }`; `glossTokens(metin: string, sozluk: Record<string,string>, sozlukEk?: Record<string,string>): GlossToken[]`.

- [ ] **Step 1: Failing testler:**
  - `glossTokens('Wie geht es dir?', {geht:'gidiyor', dir:'sana'})` → tokenlar birleşince `'Wie geht es dir?'`; `geht`→`gidiyor`, `dir?`→`sana`, `Wie` anlamsız.
  - Büyük harf: `{Morgen: 'sabah'}` ile `'morgen'` eşleşir; `{'der Morgen':'sabah'}` ile `'Guten Morgen!'` içindeki `Morgen!` → `sabah`.
  - `sozlukEk {geht:'gider'}` sözlüğü ezer.
  - `'Ich ___ Anna.'` → `___` anlam almaz; ardışık boşluklar korunur (`'a  b'` yeniden birleşince aynı).
  - Boş sözlük → tüm tokenlar anlamsız.
- [ ] **Step 2:** `npx vitest run tests/domain/gloss.test.ts` → FAIL.
- [ ] **Step 3:** Uygula (`split(/(\s+)/)`; anahtar normalizasyonu: baş/son `.,!?;:"'()` sil + `toLowerCase()`; artikelli anahtarlar `der|die|das ` önekiyle ek anahtar üretir).
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit `feat(domain): kelime anlamı tokenları`

---

### Task 4: İpucuyla cevap kaydı

**Files:**
- Modify: `src/domain/progress.ts`, `src/storage/storage.ts`
- Test: `tests/domain/progress.test.ts`, `tests/storage/storage.test.ts`

**Interfaces:**
- Produces: `ProgressState.defter: Record<string, { ardisikDogru: number; ipucuyla?: true }>`; `applyAnswer(s, soruId, dogru: boolean, ipucuKullanildi = false): ProgressState`; `progressSchema` defter girdisine `ipucuyla: z.literal(true).optional()` (iki yönlü tip eşitliği korunur).

- [ ] **Step 1: Failing testler:**
  - deftere olmayan soru, `dogru true, ipucu true` → `{ardisikDogru:0, ipucuyla:true}`.
  - `ipucuyla` kayıt + ipucusuz doğru ×2 → silinir; ipucusuz doğru ×1 → `{ardisikDogru:1, ipucuyla:true}`.
  - `ipucuyla` kayıt + yanlış → `{ardisikDogru:0}` (`ipucuyla` yok).
  - defterde `ardisikDogru:1` + ipucuyla doğru → `{ardisikDogru:0, ipucuyla:true}`.
  - storage: `ipucuyla` alanlı kayıt round-trip; alanı olmayan eski kayıt `'ok'` yüklenir; `parseImport` ipucuyla:`false` içeren dosyayı reddeder (Review Focus 5).
- [ ] **Step 2:** `npx vitest run tests/domain/progress.test.ts tests/storage` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** Aynı komut → PASS; `npm test` (mevcut çağrılar varsayılan parametreyle geçmeli).
- [ ] **Step 5:** Commit `feat(domain): ipucuyla çözülen soruları deftere işaretle`

---

### Task 5: Gloss bileşeni ve sözlük context'i

**Files:**
- Create: `src/state/SozlukContext.tsx`, `src/questions/Gloss.tsx`
- Modify: `src/state/AppState.tsx`, `src/questions/QuestionView.tsx`, `src/questions/{BoslukDoldurma,DogruYanlis,Artikel,CoktanSecmeli,CumleDizme,Eslestirme,FiilCekimi}.tsx`, `src/index.css`
- Test: `tests/questions/gloss.test.tsx`

**Interfaces:**
- Consumes: `glossTokens` (Task 3), `Modul.sozluk` (Task 1), `soruIndex`.
- Produces:
  - `SozlukContext = createContext<(soruId: string) => Record<string,string>>(() => ({}))` — `AppStateProvider` değeri: `soruId => moduller.find(m => m.id === soruIndex.get(soruId)?.modulId)?.sozluk ?? {}`.
  - `GlossContext = createContext<{sozluk: Record<string,string>; ek?: Record<string,string>}>({sozluk:{}})` — `QuestionView` her soru için `{ sozluk: sozlukFor(soru.id), ek: soru.sozlukEk }` sağlar.
  - `Gloss({ metin }: { metin: string })` — `GlossContext`'ten okur; anlamlı token → `<span className="gloss" tabIndex={0} data-anlam={anlam}>` + hover/focus'ta `<span role="tooltip">{anlam}</span>`; anlamsız → düz metin. Provider yoksa düz metin (mevcut testler etkilenmez).
  - Global Constraints'teki alanlar `Gloss` ile render edilir; `Dinleme`, `Ceviri.kaynak`, `soru.soru` değişmez.

- [ ] **Step 1: Failing testler:** `GlossContext` sağlanmış CoktanSecmeli (`secenekler ['bin','bist']`, sözlük `{bin:'(ben) -im'}`) → `bin` `.gloss`; hover → `role=tooltip` "(ben) -im"; düğmedeki gloss span'a tıklama → `onCevap({secilen:0})` (Review Focus 1). BoslukDoldurma metni gloss'lu, input yerinde. Dinleme seçenekleri sözlükte olsa da gloss yok. Provider yok → `.gloss` yok. `sozlukEk` öncelikli.
- [ ] **Step 2:** `npx vitest run tests/questions` → FAIL (yeni testler).
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npx vitest run tests/questions` → PASS; `npm test`.
- [ ] **Step 5:** Commit `feat(questions): kelime üzerine gelince anlam`

---

### Task 6: İpucu düğmesi (TestRunner) ve seçmeli/yazılı tiplerde gösterim

**Files:**
- Modify: `src/test-runner/TestRunner.tsx`, `src/test-runner/FeedbackPanel.tsx`, `src/questions/types.ts`, `src/questions/QuestionView.tsx`, `src/questions/{CoktanSecmeli,Artikel,Dinleme,BoslukDoldurma,Ceviri}.tsx`, `src/index.css`
- Test: `tests/test-runner/ipucu.test.tsx`

**Interfaces:**
- Consumes: `autoHint`, `applyAutoHint`, `AutoHint` (Task 2), `createRng`, `hashString`.
- Produces:
  - `QuestionProps` + `ipucu?: AutoHint | null` (uygulanmış otomatik ipucu).
  - `SoruSonucu` + `ipucu?: boolean` (herhangi bir kademe kullanıldıysa `true`).
  - `FeedbackPanel({dogru, soru, ipucuyla?: boolean})` — `ipucuyla` ise "💡 İpucuyla çözüldü".
  - TestRunner pratik modda soru başına `kademe: 0|1|2`. Düğme: kademe 0 "💡 İpucu", kademe 1 "🔍 Daha fazla". Tıklama: 0→ `soru.ipucu` varsa 1 (`role="note"` kutuda metin) yoksa 2; 1→2. Kademe 2'de `h = autoHint(soru, createRng(hashString(soru.id)))`, `cevap = applyAutoHint(soru, cevap, h)`, `ipucu={h}` bileşene. Düğme gösterilmez: sınav modu, kontrol edildi, ya da (`!soru.ipucu && autoHint===null`); kademe 1'de `autoHint===null` ise "Daha fazla" gösterilmez.
  - Bileşenler: `ele` → ilgili seçenek düğmeleri `disabled` + `className` `elendi`; `ilkHarf` → girişin altında "İlk harf: {harf}".

- [ ] **Step 1: Failing testler:**
  - `ipucu` metinli coktan-secmeli: "💡 İpucu" → note metni; "🔍 Daha fazla" → bir yanlış şık disabled, doğru şık enabled; doğru cevap + Kontrol → FeedbackPanel "💡 İpucuyla çözüldü"; `onBitti` sonucu `ipucu: true`.
  - `ipucu` alanı olmayan bosluk-doldurma: tek tık → "İlk harf: b" (Review Focus 3).
  - `ipucu` alanı olmayan dogru-yanlis → düğme yok; `ipucu` alanlı dogru-yanlis → kademe 1 var, "Daha fazla" yok (Review Focus 3).
  - İpucusuz çözülen soru `ipucu` falsy.
  - `mod 'sinav'` → "💡 İpucu" yok.
  - Kontrol sonrası düğme yok; yeni soruya geçince kademe 0.
- [ ] **Step 2:** `npx vitest run tests/test-runner` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npx vitest run tests/test-runner tests/questions` → PASS; `npm test`.
- [ ] **Step 5:** Commit `feat(test-runner): iki kademeli ipucu düğmesi`

---

### Task 7: Çok parçalı tiplerde kilitli ipucu parçaları

**Files:**
- Modify: `src/questions/{CumleDizme,Eslestirme,FiilCekimi}.tsx`
- Test: `tests/questions/ipucu-parcalar.test.tsx`

**Interfaces:**
- Consumes: `QuestionProps.ipucu` (Task 6).
- Produces: `ilkParca` → cevap satırındaki ilk çip kilitli (tıklanınca kaldırılmaz, `aria-disabled="true"`); `cift` → o sol ve sağ düğmeler disabled, eşleşme korunur; `hucre` → o satırın input'u `readOnly`/disabled ve değer `cevap`. (Cevaba yazma TestRunner'da `applyAutoHint` ile yapılır; bileşen sadece kilitler.)

- [ ] **Step 1: Failing testler:** her tip için `ipucu` + ilgili cevapla render → kilitli parçaya tıklama/yazma `onCevap`'ı çağırmaz ya da kilitli parçayı değiştirmez (Review Focus 2); kilitli olmayan parçalar normal çalışır.
- [ ] **Step 2:** `npx vitest run tests/questions/ipucu-parcalar.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npx vitest run tests/questions` → PASS.
- [ ] **Step 5:** Commit `feat(questions): ipucuyla gelen parçaları kilitle`

---

### Task 8: Sayfalar — kayıt, rozet, Trick kartları

**Files:**
- Create: `src/components/TrickList.tsx`
- Modify: `src/pages/{PartTestPage,ExamPage,MistakesPage,PartPage}.tsx`, `src/index.css`
- Test: `tests/pages/ipucu-sayfalar.test.tsx`

**Interfaces:**
- Consumes: `SoruSonucu.ipucu` (Task 6), `applyAnswer(.., ipucuKullanildi)` (Task 4), `Part.trickler` (Task 1).
- Produces:
  - Üç sayfada `applyAnswer(next, x.soruId, x.dogru, x.ipucu === true)`.
  - `TrickList({ trickler }: { trickler: Trick[] })` → her biri `<details><summary>🎯 {baslik}</summary><p>{metin}</p></details>`; boş/undefined → hiçbir şey.
  - PartPage: özetin altında `<h2>🎯 Trickler</h2>` + TrickList (trick yoksa bölüm yok).
  - PartTestPage: başlık yanında "🎯 Trickler" düğmesi (`aria-expanded`), panel TrickList; panel state TestRunner'dan bağımsız.
  - ExamPage giriş ekranı: partı trick'i olan her part için `<h3>Ders {ders}: {baslik}</h3>` + TrickList; sınav başlayınca gizli.
  - MistakesPage satırı: `ipucuyla` ise "💡 ipucuyla" rozeti.

- [ ] **Step 1: Failing testler:**
  - Part testinde ipucu kullanıp doğru cevapla bitir → kayıtta `defter[id].ipucuyla === true`; Hata Defteri'nde "💡 ipucuyla".
  - PartPage trick başlıkları görünür; trick'siz partta "🎯 Trickler" yok.
  - PartTestPage: 1. soruyu cevapla + Kontrol, "🎯 Trickler" aç/kapat → hâlâ "Soru 1 / N" ve FeedbackPanel görünür (Review Focus 4).
  - ExamPage giriş ekranında trick başlığı var; "Başla" sonrası yok.
- [ ] **Step 2:** `npx vitest run tests/pages/ipucu-sayfalar.test.tsx` → FAIL.
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run build` → temiz.
- [ ] **Step 5:** Commit `feat(pages): ipucu kaydı, rozet ve trick kartları`

---

### Task 9: Modül 1 içeriği — sözlük, ipuçları, trickler

**Files:**
- Create: `content/modul-1/sozluk.json`
- Modify: `content/modul-1/ders-01..05.json`, `content/modul-1/sinav.json`
- Test: `tests/content/real-content.test.ts`

**Interfaces:**
- Consumes: `loadContent`, `contentFiles`, `glossTokens`.

İçerik kuralları: her soruya `ipucu` (Türkçe, tek cümle, cevabı doğrudan söylemez, `aciklama`yı kopyalamaz); her partta 2–4 `trickler` (`baslik` ≤ 40 karakter, `metin` 1–2 cümle, akılda kalıcı "hile"); `sozluk.json` Modül 1'deki Global Constraints gloss alanlarında geçen Almanca kelimeleri kapsar (çekimli biçimler ayrı anahtar: `bin`, `bist`, `geht`…; isimler artikelli).

- [ ] **Step 1: Failing testler** (`real-content.test.ts`'e ekle):
  - modul-1'deki her soruda (sınav ekSorular dahil) `ipucu` dolu.
  - her partta `trickler.length` 2–4.
  - Kapsama: modul-1 tüm sorularının gloss alanlarından üretilen tokenlardan, harf içeren (`/\p{L}/u`) ve `___` olmayanların ≥ %80'i `glossTokens(..., modul.sozluk, q.sozlukEk)` ile `anlam` alır; test başarısızlıkta anlamsız kelimeleri listeler.
- [ ] **Step 2:** `npx vitest run tests/content/real-content.test.ts` → FAIL.
- [ ] **Step 3:** İçeriği yaz.
- [ ] **Step 4:** Aynı komut → PASS; `npm test`.
- [ ] **Step 5:** Commit `content: modül 1 ipuçları, trickler ve sözlük`

---

### Task 10: Uçtan uca doğrulama (controller)

- [ ] **Step 1:** `npm run typecheck && npm test && npm run build` → temiz.
- [ ] **Step 2:** Dev sunucusunda: Ders 4 → Trickler görünür → teste başla → bir kelimenin üzerine gel (anlam baloncuğu) → "💡 İpucu" → "🔍 Daha fazla" → doğru cevapla → "💡 İpucuyla çözüldü" → testi bitir → Hata Defteri'nde "💡 ipucuyla" rozeti → Modül 1 sınav girişinde trickler, sınavda ipucu düğmesi yok.
- [ ] **Step 3:** README'deki içerik kurallarına `ipucu`, `trickler`, `sozluk.json` ekle; commit `docs: README ipucu içerik kuralları`.

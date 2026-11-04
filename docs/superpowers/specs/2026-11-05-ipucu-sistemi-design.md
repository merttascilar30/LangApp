# İpucu Sistemi (Trick / İpucu) — Tasarım (Spec)

Tarih: 2026-11-05
Durum: Onay bekliyor
Üst spec: `docs/superpowers/specs/2026-11-04-almanca-a1-app-design.md`

## 1. Amaç

Ders içi testlere Duolingo tarzı üç yardım katmanı eklemek:

- **A) İpucu düğmesi:** takılınca kademeli yardım (önce kural, sonra otomatik ipucu).
- **B) Kelime üzerine gelince anlam:** Almanca kelimelerin Türkçe karşılığı.
- **C) Trick kartları:** her ders için kısa kural/hile kartları.

**Başarı ölçütü:** Kullanıcı bir part testinde takıldığında cevabı doğrudan görmeden
kuralı hatırlayabilir; gerekirse otomatik ipucuyla ilerleyebilir; ipucuyla çözdüğü soru
daha sonra tekrar karşısına çıkar.

### Kararlaştırılanlar
- Kapsam: A + B + C.
- İpucu bedeli: **bedelsiz** — ipucuyla verilen doğru cevap tam puan sayılır, ama soru
  "ipucuyla" işaretiyle hata defterine düşer.
- Kelime anlamı kaynağı: **modül sözlüğü + soru bazlı istisna** (soru istisnası sözlüğü ezer).
- İpucu içeriği: **karma** — 1. kademe yazılı `ipucu` metni, 2. kademe otomatik.
- İpucu düğmesi sadece pratik modda (part testi, hata defteri tekrarı); modül sınavında yok.
- Kelime anlamı her yerde (sınav dahil); Trick kartları sınavda yalnızca giriş ekranında.

## 2. Veri modeli

### Soru (tüm tiplere ortak, isteğe bağlı)
- `ipucu?: string` — Türkçe, 1 cümle kural hatırlatması. Cevabı doğrudan söylememeli.
- `sozlukEk?: Record<string, string>` — bu soruya özel kelime anlamları; anahtar Almanca kelime.

### Part (isteğe bağlı)
- `trickler?: { baslik: string; metin: string }[]` — 2–4 kart (Modül 1 içerik kuralı).

### Modül sözlüğü — `content/<modulId>/sozluk.json`
```json
{ "girdiler": { "geht": "gidiyor", "dir": "sana", "der Morgen": "sabah" } }
```
- Anahtarlar tek kelime (`geht`) veya artikelli isim (`der Morgen`) olabilir. Artikelli
  anahtar eşleştirmede artikel olmadan (`Morgen`) da eşleşir.
- Partların `kelimeler` listesi (`de` → `tr`) yükleme sırasında sözlüğe eklenir; aynı anahtar
  `sozluk.json`'da da varsa `sozluk.json` kazanır.
- Dosya yoksa sözlük = sadece `kelimeler`; hata üretilmez.

### İlerleme
- `defter` girdisi: `{ ardisikDogru: number; ipucuyla?: true }`.
- `progressSchema` buna göre güncellenir; eski kayıtlar (alan yok) geçerli kalır.

## 3. İş kuralları (`src/domain/`, saf fonksiyonlar)

### `hints.ts`
```ts
type AutoHint =
  | { tur: 'ele'; indeksler: number[] }        // coktan-secmeli, dinleme(sec), artikel
  | { tur: 'ilkHarf'; harf: string }            // bosluk-doldurma, ceviri, dinleme(yaz)
  | { tur: 'ilkParca'; parca: string }          // cumle-dizme
  | { tur: 'cift'; sol: string; sag: string }   // eslestirme
  | { tur: 'hucre'; satir: number; cevap: string } // fiil-cekimi
autoHint(q: Question, rng: () => number): AutoHint | null
```
- `coktan-secmeli`: yanlış şıkların `max(1, floor(yanlisSayisi / 2))` tanesi rastgele elenir.
  `indeksler` orijinal `secenekler` indeksleridir.
- `dinleme` `mod 'sec'`: aynı kural; doğru şık `dogruCevaplar[0]`'a eşit olan seçenektir.
- `artikel`: der/die/das içinden bir yanlış (indeks 0=der, 1=die, 2=das).
- `bosluk-doldurma` / `ceviri` / `dinleme` `mod 'yaz'`: `dogruCevaplar[0]`'ın ilk harfi.
- `cumle-dizme`: `dogruSiralar[0][0]`.
- `eslestirme`: rastgele bir çift.
- `fiil-cekimi`: `verilen` olmayan ilk satır.
- `dogru-yanlis`: `null` (otomatik ipucu cevabı ele verir).

### `gloss.ts`
```ts
type GlossToken = { metin: string; anlam?: string }
glossTokens(metin: string, sozluk: Record<string,string>, sozlukEk?: Record<string,string>): GlossToken[]
```
- Metin boşluklarla bölünür; boşluklar ayrı token olarak korunur (yeniden birleştirince
  orijinal metin elde edilir).
- Eşleştirme: kelimenin başındaki/sonundaki noktalama (`.,!?;:"'()`) çıkarılır, küçük harfe
  çevrilir; sözlük anahtarları da küçük harfle karşılaştırılır. Artikelli anahtarlar
  (`der X`) için `x` de anahtar sayılır.
- Öncelik: `sozlukEk` > modül sözlüğü.
- `___` ve sadece noktalamadan oluşan tokenlar anlam almaz.

### `progress.ts`
- `applyAnswer(s, soruId, dogru, ipucuKullanildi = false)`:
  - `ipucuKullanildi && dogru` → `defter[soruId] = { ardisikDogru: 0, ipucuyla: true }`.
  - `!dogru` → mevcut davranış (`ardisikDogru: 0`), `ipucuyla` kaldırılır.
  - `dogru && !ipucuKullanildi` → mevcut davranış (sayaç +1, 2'de çıkar), `ipucuyla` korunur.
- Puan hesabı değişmez.

### `SoruSonucu`
- `{ soruId; dogru; cevap; ipucu?: boolean }` — ipucu kullanıldıysa `true`. Sayfalar
  `applyAnswer`'a bunu geçirir.

## 4. Yükleyici
- `partSchema` ve `questionSchema` yeni isteğe bağlı alanlarla güncellenir.
- `sozlukSchema = { girdiler: Record<string,string> }`; hatalı dosya → `ContentError`,
  sözlük `kelimeler`'den oluşur.
- `Modul` tipine `sozluk: Record<string,string>` eklenir (birleştirilmiş).
- İçerik kuralları (`rules.ts`), yalnızca Modül 1 gerçek-içerik testinde zorunlu:
  her soruda boş olmayan `ipucu`; her partta 2–4 `trickler`.

## 5. Arayüz

### İpucu düğmesi (`TestRunner`, sadece `mod 'pratik'`)
- "Kontrol et" yanında "💡 İpucu" düğmesi.
- Kademe 0 → tıklama: soruda `ipucu` varsa kademe 1 (sarı kutu, `role="note"`, metin);
  yoksa doğrudan kademe 2.
- Kademe 1 → düğme etiketi "🔍 Daha fazla"; tıklama: kademe 2, `autoHint` uygulanır.
  `autoHint` `null` ise düğme kademe 1'den sonra devre dışı.
- Kademe 2 uygulama:
  - `ele`: ilgili seçenek düğmeleri soluk ve `disabled`.
  - `ilkHarf`: girişin altında "İlk harf: {harf}".
  - `ilkParca` / `cift` / `hucre`: mevcut cevaba yazılır ve o parça kilitlenir (kaldırılamaz/
    değiştirilemez).
- Herhangi bir kademe kullanıldıysa sonuç `ipucu: true`. "Kontrol et" sonrası düğme gizlenir;
  FeedbackPanel'de "💡 İpucuyla çözüldü" satırı.
- Sınav modunda düğme render edilmez.
- Soru bileşenlerine yeni prop: `ipucu?: AutoHint | null` (uygulanmış otomatik ipucu).
  Kilitli parçaları bileşen uygular; doğruluk kararı yine `domain/`'de.

### Kelime anlamı (`GlossText` bileşeni)
- `GlossText({ metin, sozlukEk? })` — `useAppState()` üzerinden aktif modülün sözlüğünü alır
  (sayfa, modül id'sini bir context ile sağlar; hata defteri her soru için kendi modülünü).
- Anlamı olan kelime: `<span class="gloss" tabindex="0">` alt noktalı çizgi; hover/focus'ta
  `role="tooltip"` baloncuk.
- Uygulandığı alanlar: `bosluk-doldurma.metin`, `dogru-yanlis.ifade`, `artikel.isim`,
  `coktan-secmeli.secenekler`, `cumle-dizme.parcalar`, `eslestirme` sol sütun,
  `fiil-cekimi.fiil`. Türkçe alanlara (`soru`, `kaynak`, `aciklama`) uygulanmaz.
  `dinleme` seçeneklerine uygulanmaz.
- Seçenek düğmesi içindeki gloss, düğme tıklamasını engellemez.

### Trick kartları
- `TrickList({ trickler })`: `<details>` kartları ("🎯 {baslik}").
- PartPage: özetin altında "🎯 Trickler" başlığıyla.
- PartTestPage: başlıkta "🎯 Trickler" düğmesi → açılır panel (testi sıfırlamaz).
- ExamPage: giriş ekranında modülün tüm partlarının trickleri (part başlığına göre gruplu);
  sınav başlayınca gösterilmez.
- MistakesPage satırında `ipucuyla` ise "💡 ipucuyla" rozeti.

## 6. İçerik işi (Modül 1)
- `content/modul-1/sozluk.json`: Modül 1 sorularının Almanca alanlarında geçen kelimeler.
- 116 sorunun hepsine `ipucu` (Türkçe, 1 cümle, cevabı söylemez).
- Her derse 2–4 `trickler`.
- Gerçek-içerik testi ek olarak: her soruda `ipucu`; her partta 2–4 trick; Modül 1
  Almanca alanlarındaki (yukarıdaki gloss alanları) kelime tokenlarının ≥ %80'i gloss alır.

## 7. Testler
- Domain: `autoHint` her tip için (eleme sayısı, doğru şık asla elenmez, `null` durumu);
  `glossTokens` (noktalama, harf, artikelli anahtar, istisna önceliği, yeniden birleştirme);
  `applyAnswer` ipucu kuralları.
- Yükleyici: sözlük birleştirme ve öncelik, eksik/bozuk `sozluk.json`.
- Storage: `ipucuyla` alanlı ve alansız kayıt yüklenir.
- Bileşen/sayfa: iki kademeli akış; `ipucu` olmayan soruda doğrudan kademe 2; elenen şık
  disabled; kilitli parça değiştirilemez; sınavda düğme yok; ipucuyla doğru → deftere
  `ipucuyla`; gloss tooltip; seçenek tıklaması gloss varken çalışır; Trick paneli testi
  sıfırlamaz; sınav giriş ekranında trickler var, sınav sırasında yok.

## 8. Kapsam dışı
İpucu sayısı/limiti, ipucu puan kesintisi, telaffuz ipucu, gloss'ta TTS, Modül 2–8 içeriği
(Faz 2'de aynı kurallarla yazılır).

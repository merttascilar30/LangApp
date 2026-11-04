# Almanca A1 Öğrenme Uygulaması — Tasarım (Spec)

Tarih: 2026-11-04
Durum: Onay bekliyor

## 1. Amaç ve bağlam

Kişisel kullanım için, bilgisayarda tarayıcıda çalışan bir Almanca A1 çalışma uygulaması.
Kaynak: BeGi Almanca "A1 Başlangıç Seviyesi Almanca Dersleri" YouTube playlist'i
(`PLA3O0gt-qHTNN7-iN6UykKW5rnaliMI8y`, 61 içerik dersi + 1 kapanış videosu).

**Başarı ölçütü:** Kullanıcı 8 modülü sırayla ilerler; her derste videoyu uygulama içinde izler,
pratik testi çözer, anında geri bildirim ve açıklama alır; modül sınavından ≥ %80 alarak
sonraki modülü açar. İlerleme kaybolmaz (dışa/içe aktarma).

### Kullanıcının belirttikleri
- A1 seviyesi 8 modüle bölünecek, her modülde video başına bir "part" olacak.
- Her partın testi, her modül sonunda tüm modülü kapsayan bir sınav olacak.
- Modül sınavında belirli notu alınca sonraki modül açılacak.
- Cevaplar test sonrası direkt kontrol edilecek.
- Test içerikleri (soru tipleri) Claude'a bırakıldı.

### Kararlaştırılanlar (soru-cevapla)
- Tek kullanıcı (sadece kendisi), sunucu/hesap yok.
- Platform: bilgisayar, tarayıcı.
- Kilit kuralı **C**: part testleri pratik (kilitlemez); yalnızca modül sınavı sonraki modülü açar.
- Sorular: Claude tarafından yazılmış **sabit soru bankası** (JSON).
- İlk sürümde 4 ekstra: dinleme, hata defteri, kelime kartları, ilerleme ekranı.
- Teknoloji: React + TypeScript + Vite.

## 2. Modül gruplaması

| Modül | Dersler | Konu |
|---|---|---|
| 1 | 1–5 | Alfabe, kodlama, harf kombinasyonları/telaffuz, selamlaşma, vedalaşma |
| 2 | 6–13 | Kişi zamirleri, fiil çekimleri (+ek alıştırma), sein, haben/sein farkı, artikel nedir, kendini tanıtma, nasılsın kalıpları |
| 3 | 14–18 | Sayılar, sayı alıştırmaları, aylar/doğum günü/sıra sayıları, günler/aylar/mevsimler, alıştırma |
| 4 | 19–25 | Artikel kuralları, çoğul, belirli/belirsiz artikel, önemli fiiller, ülkeler/uyruklar/diller, sprechen, W-Fragen |
| 5 | 26–30 | Meslekler, medeni durum, nicht, nicht/kein farkı, saatler |
| 6 | 31–39 | Nominativ, Akkusativ, Dativ, kişi zamirleri (N/A/D), possessivartikel (mein/dein, sein/ihr, unser/euer, Ihr), trennbare Verben |
| 7 | 40–51 | Perfekt (+alıştırma), modalverben (dürfen, können, mögen, möchten/wollen, müssen/sollen), ja/nein/doch, Dativ edatları (mit/aus/von, bei, nach/zu), Imperativ |
| 8 | 52–61 | Sıklık zarfları, Akkusativ edatları (bis/durch/für, gegen/ohne/um), yer edatları, Präteritum, Komparativ/Superlativ, Akk/Dat alan fiiller, zaman edatları (an; in/um/von…bis; nach/vor/seit/ab) |

Ders 62 (kapanış videosu) dahil edilmez. Video ID'leri içerik yazılırken playlist'ten alınır.

## 3. Mimari ve klasör yapısı

Tek sayfalık (SPA) React + TypeScript + Vite uygulaması. Sunucu yok. Router: React Router.

```
content/
  modules.json            # 8 modül: id, sıra, başlık, part dosyaları listesi
  modul-1/
    ders-01.json ...      # part dosyaları
    sinav.json            # sınava özel sorular + ayarlar
src/
  domain/                 # saf TS: cevap kontrolü, puanlama, kilit, soru seçimi,
                          # hata defteri kuralları, Leitner — UI bağımsız, testli
  content/                # Zod şemaları + içerik yükleme/doğrulama
  questions/              # 9 soru tipi bileşeni, her biri ayrı dosya
  pages/                  # Ana sayfa, Modül, Part, PartTesti, ModülSınavı,
                          # HataDefteri, KelimeKartları, İlerleme, Ayarlar
  storage/                # localStorage erişimi, sürümlü şema, dışa/içe aktarma
  speech/                 # Web Speech API sarmalayıcı (de-DE)
```

Birim sınırları:
- `domain/` hiçbir React veya tarayıcı API'sine bağlı değildir; girdi → çıktı fonksiyonlarıdır.
- `questions/*` bileşenleri ortak bir arayüz uygular: `{ soru, onCevap(cevap), kilitli, sonuç? }`.
  Doğru/yanlış kararını bileşen değil `domain/` verir.
- `storage/` uygulamanın geri kalanına tipli bir API sunar (`getProgress`, `recordAttempt` …);
  localStorage ayrıntısı dışarı sızmaz.

## 4. İçerik modeli

### Part dosyası (`ders-NN.json`)
```jsonc
{
  "id": "m1-d04",
  "ders": 4,
  "baslik": "Selamlaşma Kalıpları",
  "videoId": "<YouTube ID>",
  "ozet": ["Guten Morgen — günaydın", "..."],      // 3–5 madde
  "kelimeler": [{ "de": "der Morgen", "tr": "sabah", "artikel": "der" }],
  "sorular": [ /* 15–25 soru */ ]
}
```

### Ortak soru alanları
`id` (global benzersiz, ör. `m1-d04-q07`), `tip`, `soru` (yönerge/metin), `aciklama` (zorunlu,
yanlışta gösterilir), opsiyonel `harfDuyarli` (varsayılan `false`).

### Soru tipleri
| `tip` | Ek alanlar | Doğru sayılma |
|---|---|---|
| `coktan-secmeli` | `secenekler[]`, `dogru` (index) | seçilen index = `dogru` |
| `bosluk-doldurma` | `metin` (`___` içerir), `dogruCevaplar[]` | normalize edilmiş cevap listede |
| `artikel` | `isim` | seçilen ∈ {der, die, das} = `dogru` |
| `fiil-cekimi` | `fiil`, `satirlar[{zamir, cevap, verilen?}]` | tüm boş hücreler doğru |
| `cumle-dizme` | `parcalar[]`, `dogruSiralar[][]` | dizilim kabul edilen sıralardan biri |
| `eslestirme` | `ciftler[{sol, sag}]` (4–6) | tüm eşleşmeler doğru |
| `dogru-yanlis` | `ifade`, `dogru` (bool) | seçim = `dogru` |
| `dinleme` | `okunacak`, `mod` (`sec`\|`yaz`), `secenekler[]?`, `dogruCevaplar[]` | moda göre seçim/yazı kontrolü |
| `ceviri` | `kaynak` (TR), `dogruCevaplar[]` | normalize edilmiş cevap listede |

### Sınav dosyası (`sinav.json`)
`{ "soruSayisi": 25, "gecmeNotu": 80, "ekSorular": [ ... ] }`

### Doğrulama
Tüm içerik Zod şemalarıyla doğrulanır: uygulama açılışında ve bir Vitest testinde.
Ek kurallar: `id` benzersizliği; `coktan-secmeli.dogru` geçerli index; `bosluk-doldurma.metin`
tam bir `___` içerir; part başına ≥ 15 soru; her soruda boş olmayan `aciklama`.

## 5. Test ve sınav akışı

### Part testi (pratik)
- Partın havuzundan rastgele 10 soru (havuz < 10 ise tamamı), sırası karışık.
- Tek tek gösterilir; cevaplanınca anında kontrol: yeşil/kırmızı + doğru cevap + `aciklama`, sonra "Devam".
- Sonuç ekranı: skor, yanlışlar listesi. ≥ %70 → "Geçti" rozeti. **Hiçbir şeyi kilitlemez/açmaz.**

### Modül sınavı
- `soruSayisi` (varsayılan 25) soru: modülün partlarından dengeli dağıtılmış (round-robin, tekrarsız)
  + `ekSorular` havuzundan. Her denemede yeniden seçilir.
- Sınav sırasında geri bildirim yok; tüm sorular cevaplanıp "Bitir"e basılınca toplu kontrol
  ve her soru için doğru cevap + açıklama gösterilir. Cevapsız soru yanlış sayılır.
- ≥ `gecmeNotu` (varsayılan %80) → sonraki modül açılır. Deneme sınırı/bekleme yok.
- Modül 1 baştan açıktır. Modül sınavına her an girilebilir.

### Puanlama
Her soru 1 puan; çok parçalı sorularda (eşleştirme, fiil çekimi) tüm parçalar doğru olmalı.
Kısmi puan yok. Yüzde = doğru / toplam × 100, aşağı yuvarlanmaz (karşılaştırma ham oranla).

### Cevap normalizasyonu (yazılı cevaplar)
Sırayla: trim → ardışık boşlukları teke indir → sondaki `. ! ?` ve iç `,` kaldır →
`ä→ae, ö→oe, ü→ue, ß→ss` (hem cevap hem beklenen) → `harfDuyarli` değilse küçük harf.
Yazım hatası toleransı yok. Yazılı girişlerin altında `ä ö ü ß Ä Ö Ü` tuşları.

## 6. Ekstralar

### Dinleme
- `speechSynthesis`, `lang = "de-DE"`, Almanca ses seçilir. 🔊 normal, 🐢 yavaş (rate 0.7).
- Almanca ses yoksa: bir kerelik uyarı (Windows Ayarlar > Dil'den Almanca ekleme), dinleme
  soruları test seçiminden çıkarılır.
- 🔊 ayrıca kelime kartlarında ve sonuç açıklamalarında.

### Hata defteri
- Part testinde veya sınavda yanlış yapılan her soru eklenir (soru `id`'si ile).
- Modül filtresi + "Tekrar çöz" (anında geri bildirimli test modu).
- Defterdeki bir soru **art arda 2 kez** doğru cevaplanınca çıkar; arada yanlış sayacı sıfırlar.
- Defter dışında (normal testte) doğru cevaplamak da sayaca katkı yapar.

### Kelime kartları
- Kaynak: partların `kelimeler` listeleri. Kapsam: tek modül veya tüm açık modüller.
- Ön: Almanca (artikel renkli: der mavi, die kırmızı, das yeşil); arka: Türkçe.
- Leitner, 3 kutu: yeni kart kutu 1; "Biliyorum" → bir üst kutu (maks 3); "Tekrar" → kutu 1.
  Oturum destesi ağırlıkları: kutu 1 ×3, kutu 2 ×2, kutu 3 ×1. Kutu 3 = "öğrenildi".

### İlerleme ekranı
- Modül: durum (kilitli/açık/geçildi), sınav en iyi skor, deneme sayısı.
- Part: en iyi test skoru, "video izlendi" (elle işaret).
- Genel: geçilen modül sayısı, defterdeki soru sayısı, öğrenilen kart sayısı.

## 7. Veri saklama

- localStorage, tek anahtar `langapp:v1`, kök nesnede `surum: 1`.
- İçerik: modül sınav denemeleri, part test en iyi skorları, izlendi işaretleri, hata defteri
  (soru id → ardışık doğru sayısı), kart kutuları (kelime anahtarı → kutu), ayarlar.
- Kayıtlar soru `id`'si ile tutulur; soru metni düzeltmek ilerlemeyi bozmaz.
- Silinen soru id'leri yüklemede sessizce yok sayılır.
- Dışa aktar: `.json` indirme. İçe aktar: dosya seçme → şema doğrulama → onay → üzerine yaz.
- Ayarlar: "İlerlemeyi sıfırla" (onaylı).

## 8. Hata durumları

| Durum | Davranış |
|---|---|
| Bozuk/eksik içerik JSON'u | Çökmez; hata panelinde dosya + soru id + hata; sorunlu part atlanır |
| Bozuk localStorage verisi | Uyarı; "sıfırdan başla" veya "yedekten içe aktar" seçenekleri |
| Almanca TTS sesi yok | Uyarı; dinleme soruları atlanır |
| YouTube embed yüklenmiyor | "YouTube'da aç" linki |
| Geçersiz içe aktarma dosyası | Reddedilir, mevcut veri değişmez |

## 9. Test stratejisi (Vitest + React Testing Library)

- **Domain (TDD):** normalizasyon, her tip için doğru/yanlış kararı, puanlama, kilit kuralı,
  sınav soru seçimi (dengeli, tekrarsız, deterministik seed ile test), hata defteri kuralı, Leitner.
- **İçerik doğrulama:** tüm `content/` dosyaları şemaya ve ek kurallara uyar.
- **Bileşen:** her soru tipi için doğru→yeşil, yanlış→kırmızı + açıklama görünür.
- **Storage:** dışa aktar → içe aktar gidiş-dönüşü aynı durumu verir; bozuk veri yakalanır.

## 10. Teslim fazları

**Faz 1 — Motor + Modül 1**
Tüm uygulama (9 soru tipi, part testi, sınav, kilit, hata defteri, kartlar, ilerleme,
dışa/içe aktarma, hata durumları) ve Modül 1 içeriği (ders 1–5 + sınav). Kullanıcı uçtan uca dener.

**Faz 2 — İçerik (Modül 2–8)**
Modül modül soru bankaları; her modül sonrası kullanıcı kontrolü. Kod değişikliği minimum.

### İçerik yazım kuralları (her part)
- 15–25 soru; en az 4 farklı tip.
- Konuya uygun tipler öncelikli (ör. sayılar/saat/alfabe → `dinleme`; artikel konuları →
  `artikel`; fiil konuları → `fiil-cekimi`; cümle yapısı → `cumle-dizme`).
- Her soruda Türkçe, 1–2 cümlelik kural açıklaması.
- 5–15 kelime kartı (`kelimeler`).
- Sınav `ekSorular`: modül konularını birleştiren 8–12 soru.
- Video içeriği kopyalanmaz; sorular konu başlığına göre özgün yazılır. Videolar yalnızca embed edilir.

## 11. Kapsam dışı (YAGNI)

Kullanıcı hesabı, sunucu, cihazlar arası senkron, mobil uygulama/PWA, AI ile soru üretimi,
konuşma/telaffuz değerlendirme, kısmi puan, yazım hatası toleransı, sınav deneme sınırı.

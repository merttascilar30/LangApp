# LangApp — Almanca A1

Kişisel Almanca A1 çalışma uygulaması. BeGi Almanca playlist'ine dayalıdır ve 8 modülden oluşur (şu an Modül 1 içeriği hazır). Dersler, testler, kartlar, hata defteri ve modül sınavları içerir.

## Gereksinimler

- Node 24

## Komutlar

```
npm install
npm run dev       # http://localhost:5173
npm test          # tüm testler (içerik doğrulaması dahil)
npm run build     # üretim derlemesi (dist/)
```

## İlerleme nerede saklanır?

İlerleme tarayıcının localStorage'ında tutulur. Ayarlar sayfasından dışa aktarılıp (JSON) içe aktarılabilir veya sıfırlanabilir.

## İçerik ekleme

```
content/
  modules.json            # modül ve ders listesi
  modul-N/
    ders-NN.json          # ders içeriği ve soru bankası
    sinav.json            # modül sınavı
```

Kurallar:

- Her ders için 15–25 soru, en az 4 farklı soru tipi
- Her soruda Türkçe açıklama zorunlu
- 3–5 özet maddesi
- 5–15 kelime
- `ipucu`: her soruda zorunlu, tek cümle; doğru cevabı açık etmez
- `trickler`: her partta 2–4 adet (başlık ≤ 40 karakter)
- `sozluk.json`: modülün kelime/kalıp anlamları; sorulardaki Almanca metinlerde anlam balonu olarak çıkar
- `sozlukEk`: bir soruya özel anlam ekleri veya modül sözlüğünü ezen girdiler
- `glossKapali: true`: kelime/kalıp anlamını test eden sorularda kullan; anlamlar cevap verildikten sonra geri gelir

Her yeni modülde anlam balonlarının tam listesi elle okunmalıdır: otomatik koruma testi yalnızca birebir sızıntıları yakalar. Anlam balonu metni boşluklara göre parçalar; bu yüzden `an`, `er`, `in` gibi kısa Almanca anahtarlar, Türkçe ile Almanca karışık alanlarda Türkçe kelimelerle çakışabilir.

`npm test`, gerçek içeriği `tests/content/real-content.test.ts` ile doğrular.

Soru `tip` değerleri: `coktan-secmeli`, `bosluk-doldurma`, `artikel`, `fiil-cekimi`, `cumle-dizme`, `eslestirme`, `dogru-yanlis`, `dinleme`, `ceviri`.

## Faz 2 içerik kuralları (Modül 2–8)

Modül 1 dışındaki her ders `npm test` ile `tests/content/faz2-icerik.test.ts` tarafından denetlenir. Ders listesi ve her dersin arama kalıpları `content/ders-haritasi.json` içindedir (`istisna: true` dersler için `istisnaGerekcesi` zorunludur).

### Soru biçimi ve kaynak etiketleri

Her soruda `bicim` ve `kaynakTuru` dolu olmalıdır.

- `bicim`: `bosluk` (cümle içi boşluk: şıklı `coktan-secmeli` + `metin` veya `bosluk-doldurma`), `diyalog` (`coktan-secmeli` + `diyalog`), `siralama` (`cumle-dizme`), `senaryo` (Türkçe durum tarifi, Almanca şıklar; tam cümleli `dinleme`/`ceviri`, `dogru-yanlis`), `kelime` (tek kelime: çeviri, `eslestirme`, `fiil-cekimi`, `artikel`).
- `kaynakTuru`: `goethe` (bankadaki cümle, birebir), `uyarlama` (banka cümlesinden türetilmiş), `yazildi` (tamamen yeni).
- `kaynakCumle`: `goethe` ve `uyarlama` için zorunlu; bankanın `modul-2`..`modul-8` bölümünde birebir bulunmalıdır. Aynı cümle bir derste en fazla 2 soruda kullanılır.
- Şıklı `bosluk` ve `diyalog` sorularında `celdiriciNotlari` zorunludur (doğru şıkta boş, yanlış şıklarda kısa Türkçe gerekçe).

### Kota tablosu (ders başına)

| Kural | Değer |
|---|---|
| Soru sayısı, tip çeşitliliği | 15–25, en az 4 soru tipi |
| `kelime` biçimi | en fazla %15 |
| `bosluk`, `diyalog`, `siralama`, `senaryo` | her biri en az 2 soru (`senaryo` için en az 2'si `coktan-secmeli`) |
| `goethe` | en az %50 (`istisna` derste aranmaz) |
| `yazildi` | en fazla %15 (`istisna` derste %40) |
| İpucu, trick, sözlük | Modül 1 kuralları: her soruda `ipucu`, 2–4 trick, Almanca kelime kapsaması en az %80 |

### Aday cümle scripti

```
node scripts/ders-adaylari.mjs 9     # veya: npm run adaylar -- 9
```

Dersin gramerini, kendi modülünden sonra diğer modüllerden (Modül 1 hariç) aday banka cümlelerini, ilgili kelimeleri ve her cümlenin mevcut derslerde `kaynakCumle` olarak kullanıldığı yerleri markdown olarak yazar. Bilinmeyen ders için çıkış kodu 1'dir. Yalnızca okur, dosya yazmaz.

## Ayrıntılar

Tasarım ve uygulama planları için `docs/superpowers/specs` ve `docs/superpowers/plans` klasörlerine bakın.

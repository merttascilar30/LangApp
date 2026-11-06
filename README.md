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
- Şıklı `bosluk`, `diyalog` ve `senaryo` çoktan seçmeli sorularında `celdiriciNotlari` zorunludur (doğru şıkta boş, yanlış şıklarda kısa Türkçe gerekçe). Modül 3 ve sonrasında her çoktan seçmeli en az 3 şıklıdır.
- `goethe` diyalog: yalnızca boşluklu satır doldurulunca `kaynakCumle`nin içinde olmalıdır; değilse soru `uyarlama` olur. `goethe` cümle dizmede `dogruSiralar[0]`, `kaynakCumle` ile eşleşir.
- Cümle dizme parçaları cümle içindeki doğal yazımla yazılır (`im Februar`, `wir`; isimler ve `Sie` büyük). Ekran, cevap satırının ilk parçasını ve `Doğru cevap` metnini büyük harfle gösterir; puanlama ham parçalarla çalışır. `Ich`, `Wir`, `Im`, `Der` gibi büyük harfli parçalar kalite testinde hata verir.
- Modül düzeyinde: en az 4 `dogru-yanlis` varsa doğru oranı %30–%70; aynı `ipucu` iki kez kullanılamaz; sınav, ders sorularının kopyası olamaz.

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

Dersin gramerini, kendi modülünden sonra diğer modüllerden (Modül 1 hariç) aday banka cümlelerini, ilgili kelimeleri ve her cümlenin mevcut derslerde `kaynakCumle` olarak kullanıldığı yerleri markdown olarak yazar. Çıktı kendi modülünden en fazla 40, diğer modüllerden toplam 20 cümleyle sınırlıdır, kullanılmamış cümleler önce gelir ve gösterilmeyen sayı yazılır; tamamı için `--hepsi` ekleyin. Bilinmeyen ders için çıkış kodu 1'dir. Yalnızca okur, dosya yazmaz.

Yeni modül içeriği `.claude/workflows/modul-icerik.js` workflow'u ve `.claude/agents/` altındaki `icerik-yazar`, `icerik-inceleyici`, `icerik-kapi` ajanlarıyla yazılır.

### Öğretilenler ve modül sonu scriptleri

```
node scripts/ogretilenler.mjs modul-4 ders-19     # veya: sinav
node scripts/modul-sonu.mjs modul-4
```

`ogretilenler` soruların cevap ve metin alanlarında henüz gösterilmemiş sözcükleri listeler; otomatik kural değil kontrol listesidir, dilbilgisi hâllerini göremez. `modul-sonu` tür denetimi, test ve build sonucunu ve modül raporunun özetini kısa olarak yazar, bir adım başarısızsa çıkış kodu 1'dir.

### Modül raporu scripti

```
node scripts/modul-raporu.mjs modul-2     # veya: npm run rapor -- modul-2
```

Ders başına soru sayısı, biçim ve kaynak dağılımı, katı `goethe` oranı (kaynağı tek satır olan `goethe` diyaloglar sayılmaz), doğru şık konumları ve ders anlatımında hiç geçmeyen şık sözcükleri (otomatik kural değil, inceleme listesi) yazar. Bilinmeyen modül için çıkış kodu 1'dir. Yalnızca okur, dosya yazmaz.

## Ayrıntılar

Tasarım ve uygulama planları için `docs/superpowers/specs` ve `docs/superpowers/plans` klasörlerine bakın.

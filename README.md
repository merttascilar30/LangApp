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

`npm test`, gerçek içeriği `tests/content/real-content.test.ts` ile doğrular.

Soru `tip` değerleri: `coktan-secmeli`, `bosluk-doldurma`, `artikel`, `fiil-cekimi`, `cumle-dizme`, `eslestirme`, `dogru-yanlis`, `dinleme`, `ceviri`.

## Ayrıntılar

Tasarım ve uygulama planları için `docs/superpowers/specs` ve `docs/superpowers/plans` klasörlerine bakın.

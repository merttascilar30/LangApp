# Faz 2 İçeriği: Modül 2–8 Soru Bankaları — Tasarım (Spec)

Tarih: 2026-11-05
Durum: Onay bekliyor
Üst spec'ler: `2026-11-04-almanca-a1-app-design.md`, `2026-11-05-ipucu-sistemi-design.md`

## 1. Amaç

Modül 2–8'in 56 dersi (6–61) için, gerçek Goethe A1 cümlelerine dayalı, kaliteli soru bankaları
üretmek. Yaklaşık 1100 soru ve 7 modül sınavı.

**Başarı ölçütü:** Kullanıcı bir dersin testini çözerken soruların büyük çoğunluğunda gerçek
cümlelerle dilbilgisi ve iletişim becerisi çalışır; kuru kelime çevirisi azınlıkta kalır. Yanlış
yaptığında neden yanlış olduğunu öğrenir. Oranlar her ders için otomatik testle garanti edilir.

### Kullanıcının belirttikleri
- Modül 1'e dokunulmaz.
- Ana kaynak: `content/almanca_a1_goethe_veri_bankasi.json` (`modul-2`..`modul-8`). Kelime, artikel,
  fiil ve örnek cümleler buradan alınır; `ornekCumleler` esas alınır.
- Önce bankaya bakılır; yalnızca gerekince yeni cümle yazılır.
- Tek kelimelik kuru sözlük çevirisi bir dersin %15'ini geçemez.
- Soruların %85'i gerçek cümlelerle dört biçimde olur: akıllı gramer çeldiricili boşluk doldurma,
  mini diyalog tamamlama, cümle öğesi sıralama (V2), gerçek hayat senaryosu.

### Kararlaştırılanlar
- **Kota sayımı:** Cümle içinde geçen her soru %85'e sayılır (`___ Tisch ist neu.` artikel sorusu,
  tam cümleli dinleme dahil). Tek kelimelik her şey %15'e sayılır (kuru çeviri, kelime eşleştirme,
  çekim tablosu, tek isimli artikel sorusu).
- **Banka dışı cümle sınırı ders başınadır** (bkz. §5).
- **Üretim:** Script aday cümle çıkarır, sorular elle yazılır, testler denetler.
- **Teslim:** Önce altyapı ve Modül 2 pilotu; kullanıcı denedikten sonra Modül 3–8.

### Veri bankası bulguları (Modül 2–8)
- 782 kelime, 860 farklı cümle. Tüm isimlerde artikel ve çoğul, tüm fiillerde Perfekt dolu.
- Banka temaya göre düzenlidir, derslere göre değil; eşleme bu spec'te tanımlanır.
- Kişi çekimi tablosu yoktur: çekimler yazarak üretilir, cümleler bankadan alınır.
- Hazır diyalog biçimli yalnızca yaklaşık 17 cümle vardır: diyaloglar banka cümlelerini eşleştirerek
  ve eksik karşılığı yazarak kurulur.
- Yaklaşık sayılarla (kalıp aramasıyla) cümlesi az konular: Perfekt 10, Präteritum 9, Komparativ 1,
  `doch` 2, `dürfen` 8, `kein` 11.

## 2. Soru modeli

Tüm yeni alanlar şemada isteğe bağlıdır; Modül 1 dosyaları değişmeden geçerli kalır. Modül 2–8 için
zorunluluk kalite testiyle sağlanır (§5).

### Tüm soru tiplerine ortak
- `bicim`: `bosluk` | `diyalog` | `siralama` | `senaryo` | `kelime`
- `kaynakTuru`: `goethe` | `uyarlama` | `yazildi`
  - `goethe`: bankadaki cümle, birebir.
  - `uyarlama`: banka cümlesinden veya banka alanından türetilmiş (Perfekt'e çevrilmiş, özne
    değiştirilmiş, iki cümle diyalog olarak eşleştirilmiş).
  - `yazildi`: tamamen yeni.
- `kaynakCumle?: string`: kullanılan banka cümlesi; `goethe` ve `uyarlama` için zorunlu.

### `coktan-secmeli`e eklenenler
- `metin?: string`: tam bir `___` içeren Almanca cümle.
- `diyalog?: { kim: string; metin: string }[]`: en az 2 satır; tam bir satır `___` içerir (satırın tamamı ya da bir parçası boş olabilir, `Wie ___ es dir?`).
- `celdiriciNotlari?: string[]`: `secenekler` ile aynı uzunlukta; doğru şıkta boş string, yanlış
  şıklarda kısa Türkçe gerekçe.

`metin` ve `diyalog` aynı soruda birlikte bulunamaz.

### Biçimlerin soru tiplerine karşılığı
| Biçim | Soru tipi |
|---|---|
| `bosluk` | `coktan-secmeli` + `metin` (cümle içi artikel soruları dahil) veya yazılı `bosluk-doldurma` |
| `diyalog` | `coktan-secmeli` + `diyalog` |
| `siralama` | `cumle-dizme` |
| `senaryo` | `coktan-secmeli` (Türkçe durum tarifi, Almanca şıklar; `metin` ve `diyalog` yok); tam cümleli `dinleme`, tam cümleli `ceviri`, Almanca cümle içeren `dogru-yanlis` |
| `kelime` | tek kelimelik çeviri, `eslestirme`, `fiil-cekimi`, `artikel` |

## 3. Arayüz

- `CoktanSecmeli`:
  - `metin` varsa soru yönergesinin altında `Gloss` ile gösterilir.
  - `diyalog` varsa konuşma balonları olarak gösterilir (`kim` etiketi + metin, `Gloss` ile).
    Satırdaki `___` yerine seçim yokken `…`, şık seçilince seçilen şık gösterilir; satırın kalanı korunur.
- Geri bildirim (`FeedbackPanel`) ve sınav sonu (`ResultsView`): seçilen şık yanlış ve o şıkkın
  `celdiriciNotlari` değeri doluysa, "Neden olmadı: {not}" satırı gösterilir. Cevap verilmemişse ya
  da seçilen şık doğruysa gösterilmez. Sınav sırasında hiçbir not gösterilmez.
- Otomatik ipucu değişmez; `coktan-secmeli` şık eleme kuralı aynen uygulanır.
- `glossKapali` davranışı değişmez ve `metin`, `diyalog` alanlarını da kapsar.

## 4. Üretim hattı

- **İçerik yükleme:** `src/content/files.ts` yalnızca `/content/modules.json` ve
  `/content/modul-*/*.json` dosyalarını yükler. Banka ve CSV uygulama paketine girmez, `content/`
  altında yerinde kalır.
- **Ders haritası (`content/ders-haritasi.json`):** her ders için `ders`, `modulId`, `dosya`, `baslik`,
  `videoId`, `temalar` (banka temaları), `aramaKaliplari` (regex listesi), `gramer` (o derste
  sorulabilecek dilbilgisi), `istisna` (bool) ve `istisnaGerekcesi`. Modül 2 pilotta tam yazılır;
  sonraki modüller başlarken doldurulur.
- **Aday scripti (`scripts/ders-adaylari.mjs <ders>`):** dersin aday cümlelerini (önce kendi modülü,
  sonra diğerleri), ilgili kelimeleri ve her cümlenin daha önce kullanıldığı dersleri listeler.
  Yalnızca okuma yapar; içerik dosyası yazmaz.
- **Kümülatif dilbilgisi:** boşluk ve çeldiriciler yalnızca o derse kadar öğretilen konudan seçilir.
  Cümlenin geri kalanında ileri dilbilgisi geçebilir, ama sorulmaz.
- **V2 sıralama:** geçerli her dizilim `dogruSiralar`'a yazılır.

## 5. Otomatik kalite testi (Modül 2–8'in içeriği olan her dersi)

| Kural | Değer |
|---|---|
| Soru sayısı, tip çeşitliliği | 15–25, en az 4 soru tipi |
| `bicim` ve `kaynakTuru` | Her soruda dolu |
| `kelime` biçimi | En fazla %15 |
| Her cümle biçimi (`bosluk`, `diyalog`, `siralama`, `senaryo`) | En az 2 soru; `senaryo` için en az 2'si `coktan-secmeli` |
| `bicim` ile soru tipi | §2 tablosuyla uyumlu; `eslestirme`, `fiil-cekimi`, `artikel` yalnızca `kelime` olabilir; `senaryo` sorusunun doğru cevabı en az 2 kelime |
| `goethe` | En az %50; `istisna` derste aranmaz |
| `yazildi` | En fazla %15; `istisna` derste en fazla %40 |
| `kaynakCumle` | `goethe` ve `uyarlama` için dolu ve bankanın `modul-2`..`modul-8` bölümünde birebir mevcut |
| `goethe` tutarlılığı | Doğru cevap yerine konunca oluşan metin `kaynakCumle` ile eşleşir (bkz. aşağı) |
| Cümle tekrarı | Aynı `kaynakCumle` bir derste en fazla 2 soruda |
| `celdiriciNotlari` | Şıklı `bosluk`, `diyalog` ve `senaryo` `coktan-secmeli` sorularında zorunlu; yanlış şıkların her biri dolu, doğru şıkta boş |
| Cümle dizme büyük harf | `parcalar` cümle içindeki doğal yazımla yazılır (bkz. aşağı); ilk sözcüğü kapalı listede olan büyük harfli parça hata |
| Şık sayısı (Modül 3+) | Her `coktan-secmeli` en az 3 şıklı (Modül 2 pilotu muaf) |
| `dogru-yanlis` dengesi (modül) | Modülde en az 4 `dogru-yanlis` varsa doğru oranı %30–%70 |
| `ipucu` tekrarı (modül) | Aynı `ipucu` modülde iki kez kullanılamaz |
| Sınav kopyası (modül) | Sınav `ekSorular`ı bir ders sorusuyla aynı `kaynakCumle` + `tip` ya da aynı `metin`, `parcalar`, `ifade` taşıyamaz |
| İpucu, trick, sözlük | Modül 1 kuralları: her soruda `ipucu`, 2–4 trick, baloncuk sızıntı testi, cevap ipucunda geçmez, Almanca kelime kapsaması ≥ %80 |

%85 kuralı, `kelime` üst sınırı ile aynı anlama gelir; ayrı denetlenmez.

**`goethe` tutarlılık karşılaştırması** (noktalama, boşluk ve büyük-küçük harf farkı yok sayılır;
`’` ile `'` eşit sayılır):
- `metin`: `___` doğru şıkla doldurulur, `kaynakCumle` ile eşit olmalı.
- `bosluk-doldurma`: `___`, `dogruCevaplar[0]` ile doldurulur, `kaynakCumle` ile eşit olmalı.
- `diyalog`: yalnızca `___` içeren satır doğru şıkla doldurulur; bu satırın normalize hâli
  `kaynakCumle`nin içinde (sözcük sınırında) geçmeli. Boşluk banka satırındadır; banka cümlesi
  başka satırdaysa ya da boşluklu satır bankadan fazlasını içeriyorsa soru `uyarlama` olur.
- `cumle-dizme`: `dogruSiralar[0]`, `kaynakCumle` ile eşit olmalı (diğer geçerli dizilimler serbest).
- `coktan-secmeli` senaryo: doğru şık `kaynakCumle` ile eşit olmalı.
- `dinleme`: `okunacak`, `kaynakCumle` ile eşit olmalı.
- `ceviri`: `dogruCevaplar[0]`, `kaynakCumle` ile eşit olmalı.
- `dogru-yanlis`: `ifade`, `kaynakCumle` ile eşit olmalı.
- `kelime` biçimindeki diğer tipler: `goethe` olarak işaretlenemez.

**Cümle dizme büyük harf kuralı.** `parcalar` ve `dogruSiralar` cümle içindeki doğal yazımla yazılır:
isimler ve resmî `Sie`/`Ihnen` büyük, geri kalan her şey küçük harfle (`im Februar`, `wir`, `der Zug`).
Cevap satırının ilk parçası ekranda büyük harfle gösterilir (`ilkBuyuk`, yalnızca ilk harf), `Doğru cevap`
metni de aynı biçimdedir; seçilen cevap (`sira`) ve puanlama ham parçalarla çalışır. Test, parçanın ilk
sözcüğü şu kapalı listedeyse hata verir: `Ich, Du, Er, Es, Wir, Wer, Was, Wo, Woher, Wohin, Wann, Wie,
Warum, Welche, Im, In, Am, An, Auf, Mit, Aus, Von, Bei, Nach, Zu, Zum, Zur, Für, Der, Die, Das, Den, Dem,
Ein, Eine, Einen, Mein, Meine, Dein, Deine, Heute, Gestern`. `Ihr` ve `Sie` listede değildir (elle
incelenir). `Morgen`, yalnızca parça tam `Morgen` ise ve bir `dogruSiralar` dizilimini açıyorsa hata
sayılır. Kural Modül 2 ve sonrasına uygulanır; Modül 1 içeriğine dokunulmaz.

Test, cevabın doğru mantıkta olduğunu bilemez; bu nedenle elle inceleme zorunludur (§6). Yardımcı
olarak `node scripts/modul-raporu.mjs modul-N` ders başına biçim ve kaynak dağılımını, katı `goethe`
oranını (kaynağı tek satır olan `goethe` diyaloglar sayılmaz), doğru şık konumlarını ve ders
anlatımında (`ozet`, `trickler`, `kelimeler`) hiç geçmeyen şık sözcüklerini listeler. Son liste bir
inceleme aracıdır, otomatik kural değildir.

### Beklenen istisna dersler
Perfekt (40, 41), Präteritum (56), Komparativ (57), `dürfen` (42), Ja/Nein ve `doch` (47), `kein` (29).
Her biri haritada gerekçesiyle işaretlenir. Liste, ilgili modül başlarken aday sayısına bakılarak
daraltılabilir; genişletmek gerekirse gerekçesi modül raporunda belirtilir. Modül 2'de istisna
ders beklenmez.

## 6. İnceleme ve teslim

- Her ders grubu Almanca öğretmeni gözüyle okunur: doğru cevap, ikinci doğru şık, çeldirici notu,
  ipucu, V2 dizilimleri, baloncuk sızıntısı.
- Her modül sonunda opus onayı ve kullanıcı kontrolü.

**Teslim sırası:**
1. **Altyapı:** şema, diyalog arayüzü, çeldirici notları, içerik yükleme düzeltmesi, kalite testi,
   script, README.
2. **Modül 2 pilotu:** dersler 6–13 ve sınav. Durulur, kullanıcı dener.
3. **Modül 3–8:** kullanıcı onayından sonra, pilot derslerini içeren ayrı plan(lar)la; her modül
   ayrı dal ve PR.

Bu spec'in ilk uygulama planı yalnızca 1. ve 2. adımı kapsar.

## 7. Kapsam dışı
Modül 1 içeriğinde değişiklik (cümle dizme büyük harf kuralı ve diğer yeni kurallar dahil: yalnızca
Modül 2 ve sonrası denetlenir); banka dosyasında değişiklik (hatalı veri görülürse raporlanır);
yeni soru tipi eklemek (mevcut tipler genişletilir); telaffuz değerlendirme; videoların
izlenip cümlelerle eşleştirilmesi (sorular videoyla birebir uyumlu olmaz, konuyu kapsar).

# SDD ledger — plan: docs/superpowers/plans/2026-11-06-faz2-modul3-8.md

Spec: docs/superpowers/specs/2026-11-05-faz2-icerik-design.md
Branch for Task 1: feat/faz2-kurallar (base master @ aac87b7; plan commits 00369ec, b33bd74)
Models: implementers sonnet; task reviewers sonnet; module gate opus. Claude.md user edit is never staged.

## Pre-flight scan
| Pair / task | Produces → consumes | Finding |
|---|---|---|
| T1 → T2-18 | ilkBuyuk, chip rule, guards, modul-raporu | consistent; module branches cut from master after T1 merges |
| T1 self | Modül 2 migration keeps text/answers; 7 dialogs + 1 exam relabel expected | noted |
| T2-18 self | harita JSON copied per module; modules.json, sozluk, gloss-disi per module | sequential |
| module ends | controller walkthrough, opus gate, user stop | noted |

## Progress
Ruling: Task 1 is its own branch, so one opus review serves as task review and branch gate — no second seat on the same diff — cost if wrong: none beyond opus usage.
Task 1: minor (deferred): modul-raporu ` - ` ASCII separator (d13 strict 8 vs 9) and crash on missing part file; dialogue goethe rule checks first ___ line only; ipucuTekrari I/ı case; README "hiç geçmeyen" wording
Task 1: complete (commits b33bd74..d92b1be, opus APPROVE; mutation-tested guards in sandbox). Awaiting user approval to merge before Modül 3.
Task 1 merged to master; module branch feat/modul-3 cut (local only, not pushed)
Task 2: fix round 1/5 (all Important addressed by implementer; commits 7c77144..eee6682)
Ruling: Task 2 fix closed with tests only, no re-review ajan — user-approved efficient flow (plan "Verimli akış") — cost if wrong: an unreviewed new question in d14/d16 until the opus module gate.
Ruling: user approved efficient flow on 2026-11-06: new session per module; one writer per lesson; 15–16 questions; Important-only reviews; no re-review; short browser check.
Task 2: complete (commits 8cdb402..eee6682). Next: Task 3, lessons 17, 18, exam, in a new session.
Task 3: complete (commits 23eb3b9, 2df54fe). d17/d18/sınav: sonnet yazım + Important-only inceleme; 1 ipucu düzeltmesi d17-q15, d18-q14; sınav 4 bulgu (glossKapali q03/q04, sözlük Anfang/machen, q07 ipucu, q09 varyantlar).
Modül 3 opus kapısı: ilk REJECT (Important: sozluk ihr/Ihr küçük harf çakışması, baloncuk yanlış) → düzeltildi 2df54fe, testler/typecheck/build temiz. Yeniden opus yok (verimli akış), maliyet: düzeltme gözden geçirilmedi (tek satırlık sözlük birleştirme).
Modül 3 bitti; kullanıcı onayı bekleniyor (merge/push/Modül 4). Minor açık: sinav s-q10 "1." kabul etmiyor; d16-q06/d17-q06 komşu soruya ipucu; sozluk um glossu; d14 dreißig -zig notu.
Modül 4 (workflow modul-icerik, feat/modul-4): ders 19–25 + sınav yazıldı (commits d2517de..0dc7b95, c7db6c7). İnceleme bulguları: d19 2, d23 2, d24 1, diğerleri 0 (hepsi düzeltildi, tek düzeltmeyle). typecheck/test(533)/build temiz. Opus kapısı: APPROVE; Important m4-s-q03 (Schwestern öğretilmemiş) → Kind/Kinder'e çevrildi c7db6c7, yeniden opus yok. Tarayıcı: modül, d19 video+test, sınav (25 soru) açıldı, konsol temiz. Minor açık: sınav q05 odak zaman edatı, q06 ipucu cevabı fazla ele veriyor, d24-q03 kaynakCumle zayıf; sınav ekSorular'da 4/9 yazildi, d24 goethe %33. Merge/push/Modül 5 kullanıcı onayı bekliyor.
Modül 5 (workflow modul-icerik wf_60ccc04c-e93, feat/modul-5): ders 26–30 + sınav yazıldı (commits 08589ab..7996599, 6adcc40). İnceleme bulguları: d27 1 (q07 ipucu, düzeltildi), diğerleri 0. ogretilenler.mjs işe yaradı (sınav q05 öğretilmemiş sözcük yakalandı, d28 sözlük eksikleri testle). Opus kapısı: ilk REJECT (Orta: s-q03 ve s-q01 ders kopyası, s-q01 halb notu yanlış, kaynakCumle tutarsız q02/q07/q09) → düzeltildi de0934e, yeniden opus yok. typecheck/test(558)/build OK. Tarayıcı: tek browser_batch tarifi değişiklik gerekmeden çalıştı (preview_start + 1 batch + preview_stop), konsol temiz. Minor açık: s-q07 ve s-q09 artık yazildi etiketli; s-q05 ders-26 cümlesinin aynısı (dinleme); konu dengesi saatler ağır. Merge/push/Modül 6 kullanıcı onayı bekliyor.
Modül 6 (workflow modul-icerik wf_75ed38e7-657, feat/modul-6): ders 31–39 + sınav yazıldı (commits 6200df1..ee08eff), kapı düzeltmesi 0c797ea. İnceleme bulguları: d31 2, d34 1, d35 2, d37 1, d38 3, sınav 1, d32/33/36/39 0 (hepsi tek düzeltmeyle). typecheck/test(587)/build OK. Opus kapısı: 1. geçiş REJECT (Orta: s-q02 yönerge çelişkisi + d37-q10 kopyası; s-q08 d36-q11 ile aynı cümle; kaynakCumle ilgisiz q01/q03/q05; "anrufen'dır") → 0c797ea. 2. geçiş REJECT (Düşük: "eriltir"→"erildir" sinav.json:186, ders-35 satır 72/162/243, ders-36 satır 288) — talimat gereği düzeltilmedi, kullanıcıya bildirildi. Tarayıcı: modül, d31 video+test, sınav (25 soru) açıldı, konsol temiz. Minor açık: sınavda 6/10 ayrılabilen fiil; doğru şık konumları 331312; sınavda 1 goethe; s-q04 d39-q12'ye yakın; abholen sözlükte alfabetik sırada değil. Merge/push/Modül 7 kullanıcı onayı bekliyor.
- 'eriltir' yazım hatası düzeltildi, Modül 6 master'a birleştirildi (kullanıcı onayı).
Modül 7 (workflow modul-icerik wf_da13d8d1-719, feat/modul-7): ders 40–51 + sınav yazıldı (commits 8ad956d..34f97f9), kapı düzeltmesi d7c50b5. İnceleme bulguları: d40 1, d42 1, d44 1, d45 1, d50 1, d51 7, sınav 2, d41/43/46/47/48/49 0 (hepsi tek düzeltmeyle). typecheck/test(622)/build OK. Opus kapısı: 1. geçiş REJECT (Yüksek: sınavda glossKapali yok, s-q12 'Nehm' ve s-q08 'Doch' baloncuğu cevabı veriyor; q10/q07 not uyumsuzluğu) → d7c50b5. 2. geçiş APPROVE. Tarayıcı: modül, d40 video+test, sınav (25 soru) açıldı, konsol temiz. Minor açık: q07 notu uzun ("yalnızca" tekrarı); q01 sozlukEk morgen=sabah vs q02 morgen=yarın; sınav q03/q06/q09/q11 ders goethe cümlelerini aynen kullanıyor; q06/q10 baloncuğu açık (yalnızca Ich=ben); d51 dinleme Türkçe şıkları ogretilenler'de "cevap" olarak listeleniyor; sınav ekSorular'da möchten/mögen yok. Merge/push/Modül 8 kullanıcı onayı bekliyor.

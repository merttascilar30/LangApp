// Gloss alanlarında geçen ama sözlüğe girmeyecek, Almanca OLMAYAN normalize tokenlar:
// Türkçe kelimeler, tek harfler, harf adları/okunuş yazımları, harflenmiş biçimler ve ses grupları.
// Buraya gerçek bir Almanca kelime eklenmez. Anahtar: modül id'si.
export const GLOSS_DISI: Record<string, ReadonlySet<string>> = {
  'modul-1': new Set([
    'c', 'g', 'j', 'q', 'w', 'z', 'harfine', 'denir', 'harflerine', 'k', 'h', 'a', 'r', 'v', 'x',
    'y', 's', 'harfi', "almanca'da", 'ci', 'diye', 'okunur', 'fau', 've', 'dabıl', 'yu', 'çe',
    'zed', 'ze', 'tset', 'zi', 'harfleri', 'olarak', 'adlandırılır', 'harfinin', 'adı', 'b', 't',
    'e', 'tüm', 'isimler', 'büyük', 'harfle', 'başlar', 'bu', 'ne', 'kadar', 'bunu', 'nasıl',
    'yazarsınız', 'nereli', 'kim', 's-h-u-l-e', 's-k-u-l-e', 's-c-h-u-l-e', 'ş-u-l-e', 'telefonda',
    'isimleri', 'harflerken', 'gibi', 'kalıplar', 'kullanılabilir', 'tek', 'iki', 'tane', 'tt',
    'ile', 'd', 'hali', 'sorusuna', 'cevap', 'verilebilir', 'ş', 'ç', 'ay', 'i-e', 'ayrı', 'ses',
    'uzun', 'i', 'oy', 'ie', 'ünlü', 'sch', 'ei', 'eu', 'st', 'şt', 'sd', 'zt', 'kelime',
    'başındaki', 'sp', 'şp', 'ts', 'türkçe', 'ingilizce', 'f', 'u', 'aynı', 'sesi', 'verir',
    'qu', 'kv', 'kelimelerindeki', 'ch', 'vermez', '-ig', 'sesiyle', '-ik', '-iş', '-iç',
    "ich'teki", 'resmi', 'ortamlarda', 'kullanılan', 'en', 'saygılı', 'selamdır', 'güney',
    'almanya', "avusturya'da", 'bir', 'selamlaşma', 'sözüdür', 'sabah', 'saatlerinde', 'telefon',
    'görüşmesinin', 'sonunda', 'kullanılır', 'uygun', 'veda', 'gün', 'içinde', 'biriyle',
    'karşılaşınca', 'yarın', 'tekrar', 'görüşeceğin', 'birine', 'söylenir', 'durumda',
    'kelimesi', 'başta', 'değil',
  ]),
  'modul-2': new Set<string>([]),
  'modul-3': new Set<string>([]),
}

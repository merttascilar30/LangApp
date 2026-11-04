import { useEffect, useState, type ReactNode } from 'react'
import { useAppState } from '../state/AppState'

const TTS_UYARI =
  "Bilgisayarında Almanca ses yok. Windows Ayarlar > Saat ve dil > Dil ve bölge'den Almanca'yı ekle. Dinleme soruları şimdilik atlanacak."

/** Almanca ses yoksa bir kerelik uyarı gösterir (bayrak `update` ile kaydedilir). */
export function useTtsUyari(): ReactNode {
  const { ttsVar, progress, update } = useAppState()
  const [uyari, setUyari] = useState(false)

  useEffect(() => {
    if (ttsVar === false && !progress.ayarlar.ttsUyariGosterildi) {
      setUyari(true)
      update((s) => ({ ...s, ayarlar: { ...s.ayarlar, ttsUyariGosterildi: true } }))
    }
  }, [ttsVar, progress.ayarlar.ttsUyariGosterildi, update])

  if (!uyari) return null
  return (
    <div className="uyari" role="alert">
      <p>{TTS_UYARI}</p>
      <button type="button" onClick={() => setUyari(false)}>
        Kapat
      </button>
    </div>
  )
}

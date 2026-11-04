import { useState, type ChangeEvent } from 'react'
import { emptyProgress } from '../domain/progress'
import { useAppState } from '../state/AppState'
import { exportProgress, parseImport } from '../storage/storage'

function tarih(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function SettingsPage() {
  const { progress, replaceProgress } = useAppState()
  const [hata, setHata] = useState<string | null>(null)
  const [durum, setDurum] = useState<string | null>(null)

  const disaAktar = () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `langapp-ilerleme-${tarih()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const iceAktar = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    setHata(null)
    setDurum(null)
    const sonuc = parseImport(await file.text())
    if (!sonuc.ok) {
      setHata(sonuc.hata)
    } else if (window.confirm('Mevcut ilerlemenin üzerine yazılacak. Emin misin?')) {
      replaceProgress(sonuc.state)
      setDurum('İlerleme içe aktarıldı.')
    }
    input.value = ''
  }

  const sifirla = () => {
    if (!window.confirm('Tüm ilerleme silinecek. Emin misin?')) return
    setHata(null)
    replaceProgress(emptyProgress())
    setDurum('İlerleme sıfırlandı.')
  }

  return (
    <div>
      <h1>Ayarlar</h1>
      <p>
        <button type="button" onClick={disaAktar}>
          İlerlemeyi dışa aktar
        </button>
      </p>
      <p>
        <label>
          İlerlemeyi içe aktar:{' '}
          <input
            type="file"
            accept="application/json,.json"
            aria-label="İçe aktarılacak dosya"
            onChange={(e) => void iceAktar(e)}
          />
        </label>
      </p>
      <p>
        <button type="button" onClick={sifirla}>
          İlerlemeyi sıfırla
        </button>
      </p>
      {hata && <p role="alert">{hata}</p>}
      {durum && <p role="status">{durum}</p>}
    </div>
  )
}

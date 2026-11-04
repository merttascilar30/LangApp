import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { AppStateProvider } from '../../src/state/AppState'
import { makeFiles, makePart, makeStore, type FakeStore } from '../fixtures/content'

vi.mock('../../src/speech/speech', () => ({
  speak: vi.fn(),
  detectGermanVoice: () => Promise.resolve(true),
}))

function renderAt(path: string, files: Record<string, unknown>, store: FakeStore = makeStore()) {
  render(
    <AppStateProvider files={files} store={store} detectVoice={() => Promise.resolve(true)}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppStateProvider>,
  )
  return store
}

const TRICKLER = [
  { baslik: 'Artikel hilesi', metin: 'der die das' },
  { baslik: 'Fiil hilesi', metin: 'ikinci sırada' },
]

function trickliPart(n = 2) {
  return { ...makePart('m1-d1', n), trickler: TRICKLER }
}

function ipuculuPart() {
  const p = makePart('m1-d1', 1)
  ;(p.sorular[0] as Record<string, unknown>).ipucu = 'Bir ipucu metni'
  return p
}

describe('ipucu kaydı ve rozet', () => {
  it('ipucuyla doğru çözülen soru defterde ipucuyla işaretlenir ve rozet görünür', async () => {
    const files = makeFiles({ extra: { '/content/modul-1/ders-01.json': ipuculuPart() } })
    const store = renderAt('/modul/modul-1/part/m1-d1/test', files)
    expect(await screen.findByText('Soru 1 / 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '💡 İpucu' }))
    await userEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    await userEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    await userEvent.click(screen.getByRole('button', { name: 'Devam' }))
    const p = JSON.parse(store.raw()!)
    expect(p.defter['m1-d1-q0'].ipucuyla).toBe(true)

    document.body.innerHTML = ''
    renderAt('/defter', files, store)
    expect(await screen.findByText('💡 ipucuyla')).toBeInTheDocument()
  })

  it('ipucusuz kayıtta rozet yok', () => {
    const files = makeFiles()
    const store = makeStore({
      surum: 1,
      sinavlar: {},
      partlar: {},
      defter: { 'm1-d1-q0': { ardisikDogru: 0 } },
      kartlar: {},
      ayarlar: { ttsUyariGosterildi: false },
    })
    renderAt('/defter', files, store)
    expect(screen.queryByText('💡 ipucuyla')).toBeNull()
  })
})

describe('Trick kartları', () => {
  it('PartPage trick başlıklarını gösterir', () => {
    const files = makeFiles({ extra: { '/content/modul-1/ders-01.json': trickliPart() } })
    renderAt('/modul/modul-1/part/m1-d1', files)
    expect(screen.getByRole('heading', { name: '🎯 Trickler' })).toBeInTheDocument()
    expect(screen.getByText('🎯 Artikel hilesi')).toBeInTheDocument()
    expect(screen.getByText('🎯 Fiil hilesi')).toBeInTheDocument()
  })

  it('trick yoksa PartPage bölümü yok', () => {
    renderAt('/modul/modul-1/part/m1-d1', makeFiles())
    expect(screen.queryByText('🎯 Trickler')).toBeNull()
  })

  it('PartTestPage: Trickler paneli açılıp kapanınca test durumu korunur', async () => {
    const files = makeFiles({ extra: { '/content/modul-1/ders-01.json': trickliPart(2) } })
    renderAt('/modul/modul-1/part/m1-d1/test', files)
    expect(await screen.findByText('Soru 1 / 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Doğru' }))
    await userEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
    expect(screen.getByText(/açıklama/)).toBeInTheDocument()

    const dugme = screen.getByRole('button', { name: '🎯 Trickler' })
    expect(dugme).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(dugme)
    expect(dugme).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('🎯 Artikel hilesi')).toBeInTheDocument()
    expect(screen.getByText('Soru 1 / 2')).toBeInTheDocument()
    expect(screen.getByText(/açıklama/)).toBeInTheDocument()

    await userEvent.click(dugme)
    expect(dugme).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('🎯 Artikel hilesi')).toBeNull()
    expect(screen.getByText('Soru 1 / 2')).toBeInTheDocument()
    expect(screen.getByText(/açıklama/)).toBeInTheDocument()
  })

  it('ExamPage giriş ekranında trick var, Başla sonrası yok', async () => {
    const files = makeFiles({
      extra: {
        '/content/modul-1/ders-01.json': trickliPart(15),
        '/content/modul-1/sinav.json': { soruSayisi: 5, gecmeNotu: 80, ekSorular: [] },
      },
    })
    renderAt('/modul/modul-1/sinav', files)
    expect(screen.getByRole('heading', { name: 'Ders 1: Ders 1' })).toBeInTheDocument()
    expect(screen.getByText('🎯 Artikel hilesi')).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    expect(screen.queryByText('🎯 Artikel hilesi')).toBeNull()
  })
})

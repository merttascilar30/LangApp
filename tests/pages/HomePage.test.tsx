import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../src/App'
import { emptyProgress } from '../../src/domain/progress'
import { AppStateProvider, useAppState } from '../../src/state/AppState'
import { makeFiles, makeStore, type FakeStore } from '../fixtures/content'

function Probe() {
  const { update } = useAppState()
  return (
    <button onClick={() => update((s) => ({ ...s, ayarlar: { ttsUyariGosterildi: true } }))}>
      probe-update
    </button>
  )
}

function renderApp(opts: { files?: Record<string, unknown>; store?: FakeStore } = {}) {
  const store = opts.store ?? makeStore()
  render(
    <AppStateProvider
      files={opts.files ?? makeFiles()}
      store={store}
      detectVoice={() => Promise.resolve(true)}
    >
      <Probe />
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>
    </AppStateProvider>,
  )
  return store
}

const gecti = {
  ...emptyProgress(),
  sinavlar: { 'modul-1': { enIyi: 90, deneme: 1, gecti: true } },
}

describe('HomePage', () => {
  it('8 modülü listeler; Modül 1 link, Modül 2 kilitli ve link değil', () => {
    renderApp()
    expect(screen.getAllByText(/^Modül \d: /)).toHaveLength(8)
    expect(screen.getByRole('link', { name: /Modül 1: Başlık 1/ })).toHaveAttribute(
      'href',
      '/modul/modul-1',
    )
    expect(screen.queryByRole('link', { name: /Modül 2:/ })).toBeNull()
    const m2 = screen.getByText(/Modül 2: Başlık 2/).closest('li')!
    expect(within(m2).getByText('Kilitli')).toBeInTheDocument()
  })

  it('modul-1 geçildiyse Modül 2 link olur', () => {
    renderApp({ store: makeStore(gecti) })
    expect(screen.getByRole('link', { name: /Modül 2: Başlık 2/ })).toHaveAttribute(
      'href',
      '/modul/modul-2',
    )
  })

  it('içerik hataları panelini gösterir', () => {
    const files = makeFiles({ extra: { '/content/modul-1/ders-01.json': { bozuk: true } } })
    renderApp({ files })
    expect(screen.getByRole('heading', { name: 'İçerik hataları' })).toBeInTheDocument()
    expect(screen.getByText(/\/content\/modul-1\/ders-01\.json/)).toBeInTheDocument()
  })

  it('hata yoksa panel görünmez', () => {
    renderApp()
    expect(screen.queryByText('İçerik hataları')).toBeNull()
  })

  it('bozuk kayıt: uyarı, link, düğme; update kaydı ezmez; Sıfırdan başla temizler', async () => {
    const store = makeStore('{bozuk json')
    renderApp({ store })
    expect(screen.getByText(/Kayıtlı ilerleme okunamadı/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Ayarlar'dan yedek içe aktar" })).toHaveAttribute(
      'href',
      '/ayarlar',
    )

    await userEvent.click(screen.getByRole('button', { name: 'probe-update' }))
    expect(store.raw()).toBe('{bozuk json')

    await userEvent.click(screen.getByRole('button', { name: 'Sıfırdan başla' }))
    expect(screen.queryByText(/Kayıtlı ilerleme okunamadı/)).toBeNull()
    expect(JSON.parse(store.raw()!)).toEqual(emptyProgress())
  })

  it('erişilemez depolama uyarısı', () => {
    const store = makeStore()
    store.getItem = () => {
      throw new Error('denied')
    }
    renderApp({ store })
    expect(screen.getByText(/İlerleme bu tarayıcıda kaydedilemiyor/)).toBeInTheDocument()
  })

  it('kayıt başarısız olursa erişilemez uyarısı çıkar', async () => {
    const store = makeStore()
    store.setItem = () => {
      throw new Error('quota')
    }
    renderApp({ store })
    expect(screen.queryByText(/kaydedilemiyor/)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'probe-update' }))
    expect(screen.getByText(/İlerleme bu tarayıcıda kaydedilemiyor/)).toBeInTheDocument()
  })

  it('update normalde kaydeder', async () => {
    const store = renderApp()
    await userEvent.click(screen.getByRole('button', { name: 'probe-update' }))
    expect(JSON.parse(store.raw()!).ayarlar.ttsUyariGosterildi).toBe(true)
  })

  it('partı olmayan açık modülde "İçerik yakında"', () => {
    renderApp({ files: makeFiles({ modul1Partlar: 0 }) })
    const m1 = screen.getByText(/Modül 1: Başlık 1/).closest('li')!
    expect(within(m1).getByText('İçerik yakında')).toBeInTheDocument()
  })

  it('partı olan açık modülde "İçerik yakında" yok', () => {
    renderApp()
    expect(screen.queryByText('İçerik yakında')).toBeNull()
  })

  it('menü bağlantıları', () => {
    renderApp()
    const nav = screen.getByRole('navigation')
    for (const ad of ['Modüller', 'Hata Defteri', 'Kartlar', 'İlerleme', 'Ayarlar']) {
      expect(within(nav).getByRole('link', { name: ad })).toBeInTheDocument()
    }
  })
})

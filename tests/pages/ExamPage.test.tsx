import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { AppStateProvider } from '../../src/state/AppState'
import { makeFiles, makePart, makeQuestion, makeStore, type FakeStore } from '../fixtures/content'

vi.mock('../../src/speech/speech', () => ({
  speak: vi.fn(),
  detectGermanVoice: () => Promise.resolve(true),
}))

const SINAV = '/modul/modul-1/sinav'

const progressWithSinavlar = (sinavlar: Record<string, unknown>) => ({
  surum: 1,
  sinavlar,
  partlar: {},
  defter: {},
  kartlar: {},
  ayarlar: { ttsUyariGosterildi: false },
})

function sinavFiles(ek: unknown[] = [], partN = 15) {
  return makeFiles({
    extra: {
      '/content/modul-1/ders-01.json': makePart('m1-d1', partN),
      '/content/modul-1/sinav.json': { soruSayisi: 5, gecmeNotu: 80, ekSorular: ek },
    },
  })
}

function renderAt(
  path: string,
  opts: { files?: Record<string, unknown>; store?: FakeStore; voice?: Promise<boolean> } = {},
) {
  const store = opts.store ?? makeStore()
  const voice = opts.voice ?? Promise.resolve(true)
  render(
    <AppStateProvider files={opts.files ?? sinavFiles()} store={store} detectVoice={() => voice}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppStateProvider>,
  )
  return store
}

function deferred() {
  let resolve!: (v: boolean) => void
  const promise = new Promise<boolean>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

/** Tüm sorular "Doğru" ister; ilk `yanlis` soruya "Yanlış" verilir. */
async function coz(n: number, yanlis = 0) {
  for (let i = 0; i < n; i++) {
    await userEvent.click(screen.getByRole('button', { name: i < yanlis ? 'Yanlış' : 'Doğru' }))
    if (i < n - 1) await userEvent.click(screen.getByRole('button', { name: 'İleri' }))
  }
  await userEvent.click(screen.getByRole('button', { name: 'Bitir' }))
}

describe('ExamPage', () => {
  it('giriş ekranı sayıları sinavdan gösterir', async () => {
    renderAt(SINAV)
    expect(screen.getByRole('heading', { name: 'Modül 1 Sınavı' })).toBeInTheDocument()
    expect(
      await screen.findByText('5 soru, geçme notu %80, sonuçlar sınav sonunda gösterilir'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/En iyi skor/)).toBeNull()
  })

  it('önceki deneme varsa en iyi skor ve deneme sayısı', () => {
    const store = makeStore(
      progressWithSinavlar({ 'modul-1': { enIyi: 79.6, deneme: 2, gecti: false } }),
    )
    renderAt(SINAV, { store })
    expect(screen.getByText('En iyi skor: %79 · Deneme: 2')).toBeInTheDocument()
  })

  it('ttsVar null iken Başla disabled ve Hazırlanıyor', async () => {
    const d = deferred()
    renderAt(SINAV, { voice: d.promise })
    expect(screen.getByRole('button', { name: 'Başla' })).toBeDisabled()
    expect(screen.getByText('Hazırlanıyor…')).toBeInTheDocument()
    await act(async () => {
      d.resolve(true)
      await d.promise
    })
    expect(screen.getByRole('button', { name: 'Başla' })).toBeEnabled()
    expect(screen.queryByText('Hazırlanıyor…')).toBeNull()
  })

  it('tüm doğru: kaydedilir, Modül 2 açıldı', async () => {
    const store = renderAt(SINAV)
    await userEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    expect(screen.getByText('Soru 1 / 5')).toBeInTheDocument()
    await coz(5)
    expect(screen.getByText('Sınav sonucu')).toBeInTheDocument()
    expect(screen.getByText('Modül 2 açıldı!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sonraki modüle geç (Modül 2)' })).toHaveAttribute(
      'href',
      '/modul/modul-2',
    )
    expect(screen.getByRole('link', { name: 'Modüle dön' })).toHaveAttribute(
      'href',
      '/modul/modul-1',
    )
    const p = JSON.parse(store.raw()!)
    expect(p.sinavlar['modul-1']).toEqual({ enIyi: 100, deneme: 1, gecti: true })
  })

  it('3/5 doğru: Kaldı; Tekrar dene yeni sınavı başlatır, deneme 2', async () => {
    const store = renderAt(SINAV)
    await userEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    await coz(5, 2)
    expect(screen.getByText('Kaldı')).toBeInTheDocument()
    expect(screen.queryByText('Modül 2 açıldı!')).toBeNull()
    let p = JSON.parse(store.raw()!)
    expect(p.sinavlar['modul-1']).toEqual({ enIyi: 60, deneme: 1, gecti: false })
    expect(Object.keys(p.defter)).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(await screen.findByText('Soru 1 / 5')).toBeInTheDocument()
    await coz(5)
    p = JSON.parse(store.raw()!)
    expect(p.sinavlar['modul-1']).toEqual({ enIyi: 100, deneme: 2, gecti: true })
  })

  it('son modülü geçince A1 tamamlandı', async () => {
    const files = makeFiles({
      extra: {
        '/content/modul-8/sinav.json': {
          soruSayisi: 2,
          gecmeNotu: 80,
          ekSorular: [makeQuestion('e1'), makeQuestion('e2')],
        },
      },
    })
    const sinavlar = Object.fromEntries(
      Array.from({ length: 7 }, (_, i) => [
        `modul-${i + 1}`,
        { enIyi: 100, deneme: 1, gecti: true },
      ]),
    )
    renderAt('/modul/modul-8/sinav', { files, store: makeStore(progressWithSinavlar(sinavlar)) })
    await userEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    await coz(2)
    expect(screen.getByText('Tebrikler, A1 tamamlandı!')).toBeInTheDocument()
  })

  it('kilitli modülün sınavı', () => {
    renderAt('/modul/modul-2/sinav')
    expect(screen.getByText('Bu modül kilitli')).toBeInTheDocument()
  })

  it('sınavı olmayan modül', () => {
    renderAt(SINAV, { files: makeFiles() })
    expect(screen.getByText('Bu modülün sınavı henüz yok')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Modüle dön' })).toHaveAttribute(
      'href',
      '/modul/modul-1',
    )
  })

  it('boş seçimde mesaj', async () => {
    renderAt(SINAV, { files: sinavFiles([], 0) })
    await userEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    expect(screen.getByText('Bu sınavda gösterilecek soru yok.')).toBeInTheDocument()
  })

  it('ttsVar false: dinleme sorusu yok, uyarı bir kez', async () => {
    const dinleme = (i: number) => ({
      id: `dinle-${i}`,
      tip: 'dinleme',
      soru: 'Dinle',
      aciklama: 'a',
      okunacak: 'Hallo',
      mod: 'sec',
      secenekler: ['a', 'b'],
      dogruCevaplar: ['a'],
    })
    const ek = [0, 1, 2, 3, 4, 5, 6, 7].map(dinleme)
    const store = renderAt(SINAV, {
      files: sinavFiles(ek, 5),
      voice: Promise.resolve(false),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(JSON.parse(store.raw()!).ayarlar.ttsUyariGosterildi).toBe(true)
    expect(screen.getByText('Soru 1 / 5')).toBeInTheDocument()
    for (let i = 0; i < 5; i++) {
      expect(screen.queryByText('Dinle')).toBeNull()
      if (i < 4) await userEvent.click(screen.getByRole('button', { name: 'İleri' }))
    }
  })
})

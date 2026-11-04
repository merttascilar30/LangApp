import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { emptyProgress } from '../../src/domain/progress'
import { AppStateProvider } from '../../src/state/AppState'
import { makeFiles, makePart, makeStore, type FakeStore } from '../fixtures/content'

vi.mock('../../src/speech/speech', () => ({
  speak: vi.fn(),
  detectGermanVoice: () => Promise.resolve(true),
}))

function renderAt(
  path: string,
  opts: { files?: Record<string, unknown>; store?: FakeStore; voice?: Promise<boolean> } = {},
) {
  const store = opts.store ?? makeStore()
  const voice = opts.voice ?? Promise.resolve(true)
  render(
    <AppStateProvider files={opts.files ?? makeFiles()} store={store} detectVoice={() => voice}>
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

const progressWith = (partlar: Record<string, { enIyi?: number; izlendi: boolean }>) => ({
  ...emptyProgress(),
  partlar,
})

describe('kilitli / bilinmeyen', () => {
  it.each(['/modul/modul-2', '/modul/modul-2/part/x', '/modul/modul-2/part/x/test'])(
    '%s kilitli',
    (path) => {
      renderAt(path)
      expect(screen.getByText('Bu modül kilitli')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Modüllere dön' })).toHaveAttribute('href', '/')
      expect(screen.queryByRole('link', { name: /sınav/i })).toBeNull()
      expect(screen.queryByRole('link', { name: /^Ders/ })).toBeNull()
    },
  )

  it('bilinmeyen modül ve part: Bulunamadı', () => {
    renderAt('/modul/yok')
    expect(screen.getByText(/Bulunamadı/)).toBeInTheDocument()
  })

  it('bilinmeyen part: Bulunamadı', () => {
    renderAt('/modul/modul-1/part/yok')
    expect(screen.getByText(/Bulunamadı/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Modüllere dön|Ana sayfa/ })).toHaveAttribute('href', '/')
  })
})

describe('ModulePage', () => {
  it('partlar ders sırasıyla, en iyi skor, izlendi ve sınav linki', () => {
    const files = makeFiles({
      modul1Partlar: 2,
      extra: {
        '/content/modul-1/ders-01.json': makePart('m1-d1', 15, 2),
        '/content/modul-1/ders-02.json': makePart('m1-d2', 15, 1),
      },
    })
    renderAt('/modul/modul-1', {
      files,
      store: makeStore(progressWith({ 'm1-d1': { enIyi: 80, izlendi: true } })),
    })
    expect(screen.getByRole('heading', { name: 'Modül 1: Başlık 1' })).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /^Ders \d/ })
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/modul/modul-1/part/m1-d2',
      '/modul/modul-1/part/m1-d1',
    ])
    expect(screen.getByText(/%80/)).toBeInTheDocument()
    expect(screen.getByText(/✓ İzlendi/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Modül sınavına gir' })).toHaveAttribute(
      'href',
      '/modul/modul-1/sinav',
    )
  })

  it('yalnızca izlenmiş partta %0 gösterilmez', () => {
    renderAt('/modul/modul-1', {
      files: makeFiles({
        modul1Partlar: 1,
        extra: { '/content/modul-1/ders-01.json': makePart('m1-d1', 15, 1) },
      }),
      store: makeStore(progressWith({ 'm1-d1': { izlendi: true } })),
    })
    expect(screen.getByText(/✓ İzlendi/)).toBeInTheDocument()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('sınavsız modülde de sınav linki var', () => {
    renderAt('/modul/modul-1')
    expect(screen.getByRole('link', { name: 'Modül sınavına gir' })).toBeInTheDocument()
  })
})

describe('PartPage', () => {
  it('video, YouTube linki, özet', () => {
    renderAt('/modul/modul-1/part/m1-d1')
    expect(screen.getByRole('heading', { name: 'Ders 1: Ders 1' })).toBeInTheDocument()
    const frame = screen.getByTitle('Ders videosu')
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc')
    const yt = screen.getByRole('link', { name: "YouTube'da aç" })
    expect(yt).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abc')
    expect(yt).toHaveAttribute('target', '_blank')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Teste başla' })).toHaveAttribute(
      'href',
      '/modul/modul-1/part/m1-d1/test',
    )
    expect(screen.getByRole('link', { name: /Modüle dön/ })).toHaveAttribute('href', '/modul/modul-1')
  })

  it('İzledim kaydedilir', async () => {
    const store = renderAt('/modul/modul-1/part/m1-d1')
    await userEvent.click(screen.getByRole('checkbox', { name: 'İzledim' }))
    expect(JSON.parse(store.raw()!).partlar['m1-d1'].izlendi).toBe(true)
    expect(screen.getByRole('checkbox', { name: 'İzledim' })).toBeChecked()
  })
})

describe('PartTestPage', () => {
  const dinlemeFiles = () => {
    const part = makePart('m1-d1', 3)
    part.sorular.push({
      id: 'dinle-1',
      tip: 'dinleme',
      soru: 'Dinle',
      aciklama: 'a',
      okunacak: 'Hallo',
      mod: 'sec',
      secenekler: ['a', 'b'],
      dogruCevaplar: ['a'],
    } as never)
    return makeFiles({ extra: { '/content/modul-1/ders-01.json': part } })
  }

  it('ttsVar null iken Hazırlanıyor; false olunca uyarı bir kez, dinleme yok', async () => {
    const d = deferred()
    const store = makeStore()
    const files = dinlemeFiles()
    renderAt('/modul/modul-1/part/m1-d1/test', { files, store, voice: d.promise })
    expect(screen.getByText('Hazırlanıyor…')).toBeInTheDocument()
    expect(screen.queryByText(/Soru 1/)).toBeNull()
    await act(async () => {
      d.resolve(false)
      await d.promise
    })
    expect(screen.getByText('Soru 1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Bilgisayarında Almanca ses yok. Windows Ayarlar > Saat ve dil > Dil ve bölge'den Almanca'yı ekle. Dinleme soruları şimdilik atlanacak.",
    )
    expect(JSON.parse(store.raw()!).ayarlar.ttsUyariGosterildi).toBe(true)

    // ikinci giriş: bayrak kayıtlı
    const d2 = deferred()
    document.body.innerHTML = ''
    renderAt('/modul/modul-1/part/m1-d1/test', { files, store, voice: d2.promise })
    await act(async () => {
      d2.resolve(false)
      await d2.promise
    })
    expect(screen.getByText('Soru 1 / 3')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('boş seçimde mesaj', async () => {
    const part = makePart('m1-d1', 0)
    renderAt('/modul/modul-1/part/m1-d1/test', {
      files: makeFiles({ extra: { '/content/modul-1/ders-01.json': part } }),
    })
    expect(await screen.findByText('Bu derste gösterilecek soru yok.')).toBeInTheDocument()
  })

  it('12 sorudan 10 render; hepsi doğru -> %100; yanlış defter', async () => {
    const files = makeFiles({
      extra: { '/content/modul-1/ders-01.json': makePart('m1-d1', 12) },
    })
    const store = renderAt('/modul/modul-1/part/m1-d1/test', { files })
    expect(await screen.findByText('Soru 1 / 10')).toBeInTheDocument()
    for (let i = 0; i < 10; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Doğru' }))
      await userEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
      await userEvent.click(screen.getByRole('button', { name: 'Devam' }))
    }
    expect(screen.getByText('Test sonucu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tekrar çöz' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Parta dön' })).toHaveAttribute(
      'href',
      '/modul/modul-1/part/m1-d1',
    )
    const p = JSON.parse(store.raw()!)
    expect(p.partlar['m1-d1'].enIyi).toBe(100)
    expect(Object.keys(p.defter)).toHaveLength(0)
  })

  it('yanlış cevap deftere girer; Tekrar çöz yeniden başlatır', async () => {
    const files = makeFiles({
      extra: { '/content/modul-1/ders-01.json': makePart('m1-d1', 2) },
    })
    const store = renderAt('/modul/modul-1/part/m1-d1/test', { files })
    expect(await screen.findByText('Soru 1 / 2')).toBeInTheDocument()
    for (let i = 0; i < 2; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Yanlış' }))
      await userEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
      await userEvent.click(screen.getByRole('button', { name: 'Devam' }))
    }
    const p = JSON.parse(store.raw()!)
    expect(p.partlar['m1-d1'].enIyi).toBe(0)
    expect(Object.keys(p.defter).sort()).toEqual(['m1-d1-q0', 'm1-d1-q1'])
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar çöz' }))
    expect(await screen.findByText('Soru 1 / 2')).toBeInTheDocument()
  })
})

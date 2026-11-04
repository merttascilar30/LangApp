import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { emptyProgress } from '../../src/domain/progress'
import { speak } from '../../src/speech/speech'
import { AppStateProvider } from '../../src/state/AppState'
import { makeFiles, makePart, makeQuestion, makeStore, type FakeStore } from '../fixtures/content'

vi.mock('../../src/speech/speech', () => ({
  speak: vi.fn(),
  detectGermanVoice: () => Promise.resolve(true),
}))

function renderAt(
  path: string,
  opts: { files?: Record<string, unknown>; store?: FakeStore; voice?: boolean } = {},
) {
  const store = opts.store ?? makeStore()
  render(
    <AppStateProvider
      files={opts.files ?? makeFiles()}
      store={store}
      detectVoice={() => Promise.resolve(opts.voice ?? true)}
    >
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppStateProvider>,
  )
  return store
}

const withProgress = (p: Partial<ReturnType<typeof emptyProgress>>) => ({ ...emptyProgress(), ...p })

async function cevapla(dogruMu: 'Doğru' | 'Yanlış') {
  await userEvent.click(screen.getByRole('button', { name: dogruMu }))
  await userEvent.click(screen.getByRole('button', { name: 'Kontrol et' }))
  await userEvent.click(screen.getByRole('button', { name: 'Devam' }))
}

describe('MistakesPage', () => {
  const defter = { 'm1-d1-q0': { ardisikDogru: 0 }, 'm1-d1-q1': { ardisikDogru: 0 } }
  const files = () =>
    makeFiles({ extra: { '/content/modul-1/ders-01.json': makePart('m1-d1', 2) } })

  it('2 soru 2 satır, sayı, kaynak; bilinmeyen id gösterilmez', async () => {
    renderAt('/defter', {
      files: files(),
      store: makeStore(withProgress({ defter: { ...defter, yok: { ardisikDogru: 0 } } })),
    })
    expect(await screen.findByRole('heading', { name: 'Hata Defteri' })).toBeInTheDocument()
    expect(screen.getByText('2 soru')).toBeInTheDocument()
    expect(screen.getAllByText('Doğru mu?')).toHaveLength(2)
    expect(screen.getAllByText('Modül 1 · Ders 1')).toHaveLength(2)
    expect(
      within(screen.getByLabelText('Modül filtresi')).getAllByRole('option').map((o) => o.textContent),
    ).toEqual(['Tümü', 'Modül 1'])
  })

  it('tekrar çöz: doğru -> kalır (1), ikinci kez -> boş', async () => {
    const store = renderAt('/defter', { files: files(), store: makeStore(withProgress({ defter })) })
    const btn = await screen.findByRole('button', { name: 'Tekrar çöz' })
    await vi.waitFor(() => expect(btn).toBeEnabled())
    for (let round = 0; round < 2; round++) {
      await userEvent.click(screen.getByRole('button', { name: 'Tekrar çöz' }))
      expect(await screen.findByText('Soru 1 / 2')).toBeInTheDocument()
      await cevapla('Doğru')
      await cevapla('Doğru')
      expect(screen.getByText('Tekrar sonucu')).toBeInTheDocument()
      if (round === 0) {
        expect(JSON.parse(store.raw()!).defter['m1-d1-q0'].ardisikDogru).toBe(1)
        expect(Object.keys(JSON.parse(store.raw()!).defter)).toHaveLength(2)
      }
      await userEvent.click(screen.getByRole('button', { name: 'Deftere dön' }))
    }
    expect(Object.keys(JSON.parse(store.raw()!).defter)).toHaveLength(0)
    expect(screen.getByText('Hata defterin boş 🎉')).toBeInTheDocument()
  })

  it('boş defter', () => {
    renderAt('/defter')
    expect(screen.getByText('Hata defterin boş 🎉')).toBeInTheDocument()
  })

  it('ttsVar false: dinleme soruları çıkarılır', async () => {
    const part = makePart('m1-d1', 0)
    part.sorular.push(
      {
        id: 'dinle-1',
        tip: 'dinleme',
        soru: 'Dinle',
        aciklama: 'a',
        okunacak: 'Hallo',
        mod: 'sec',
        secenekler: ['a', 'b'],
        dogruCevaplar: ['a'],
      } as never,
      makeQuestion('mc-1', 'coktan-secmeli') as never,
    )
    renderAt('/defter', {
      files: makeFiles({ extra: { '/content/modul-1/ders-01.json': part } }),
      store: makeStore(
        withProgress({ defter: { 'dinle-1': { ardisikDogru: 0 }, 'mc-1': { ardisikDogru: 0 } } }),
      ),
      voice: false,
    })
    const btn = await screen.findByRole('button', { name: 'Tekrar çöz' })
    await vi.waitFor(() => expect(btn).toBeEnabled())
    await userEvent.click(btn)
    expect(await screen.findByText('Soru 1 / 1')).toBeInTheDocument()
    expect(screen.getByText('Hangisi?')).toBeInTheDocument()
  })
})

describe('FlashcardsPage', () => {
  const kelimeFiles = () => {
    const p1 = makePart('m1-d1', 1)
    p1.kelimeler = [{ de: 'der Tisch', tr: 'masa', artikel: 'der' }] as never
    const p2 = makePart('m2-d1', 1)
    p2.kelimeler = [{ de: 'die Lampe', tr: 'lamba', artikel: 'die' }] as never
    const moduller = Array.from({ length: 8 }, (_, i) => ({
      id: `modul-${i + 1}`,
      sira: i + 1,
      baslik: `Başlık ${i + 1}`,
      partlar: i < 2 ? ['ders-01'] : [],
    }))
    return makeFiles({
      extra: {
        '/content/modules.json': { moduller },
        '/content/modul-1/ders-01.json': p1,
        '/content/modul-2/ders-01.json': p2,
      },
    })
  }

  it('ön yüz artikel rengi, çevirme, Biliyorum kaydeder; kilitli modül yok', async () => {
    const store = renderAt('/kartlar', { files: kelimeFiles() })
    expect(await screen.findByRole('heading', { name: 'Kelime Kartları' })).toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Kapsam')).getAllByRole('option').map((o) => o.textContent),
    ).toEqual(['Tüm açık modüller', 'Modül 1'])
    const on = screen.getByText('der Tisch')
    expect(on).toHaveAttribute('data-artikel', 'der')
    expect(on).toHaveClass('artikel-der')
    expect(screen.getByText('Kart 1 / 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Kartı çevir' }))
    expect(screen.getByText('masa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Biliyorum' }))
    expect(JSON.parse(store.raw()!).kartlar['der Tisch']).toBe(2)
    expect(screen.getByText('Kart 2 / 3')).toBeInTheDocument()
    expect(screen.queryByText('masa')).toBeNull()
  })

  it('🔊 speak çağırır', async () => {
    renderAt('/kartlar', { files: kelimeFiles() })
    await userEvent.click(await screen.findByRole('button', { name: 'Dinle' }))
    expect(speak).toHaveBeenCalledWith('der Tisch')
  })

  it('deste bitince özet ve yeniden başla', async () => {
    renderAt('/kartlar', {
      files: kelimeFiles(),
      store: makeStore(withProgress({ kartlar: { 'der Tisch': 3 } })),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Biliyorum' }))
    expect(screen.getByText('Deste bitti')).toBeInTheDocument()
    expect(screen.getByText('1 kart öğrenildi')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Yeniden başla' }))
    expect(screen.getByText('Kart 1 / 1')).toBeInTheDocument()
  })

  it('kelime yoksa mesaj', () => {
    renderAt('/kartlar')
    expect(screen.getByText('Bu kapsamda kelime yok')).toBeInTheDocument()
  })
})

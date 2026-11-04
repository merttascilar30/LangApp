import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { emptyProgress } from '../../src/domain/progress'
import { exportProgress } from '../../src/storage/storage'
import { AppStateProvider } from '../../src/state/AppState'
import { makeFiles, makePart, makeStore, type FakeStore } from '../fixtures/content'

vi.mock('../../src/speech/speech', () => ({
  speak: vi.fn(),
  detectGermanVoice: () => Promise.resolve(true),
}))

function renderAt(path: string, opts: { files?: Record<string, unknown>; store?: FakeStore } = {}) {
  const store = opts.store ?? makeStore()
  render(
    <AppStateProvider
      files={opts.files ?? makeFiles()}
      store={store}
      detectVoice={() => Promise.resolve(true)}
    >
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppStateProvider>,
  )
  return store
}

const withProgress = (p: Partial<ReturnType<typeof emptyProgress>>) => ({ ...emptyProgress(), ...p })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProgressPage', () => {
  it('modül durumları ve genel özet', async () => {
    const files = makeFiles({ extra: { '/content/modul-1/ders-01.json': makePart('m1-d1', 2) } })
    renderAt('/ilerleme', {
      files,
      store: makeStore(
        withProgress({
          sinavlar: { 'modul-1': { enIyi: 85.7, deneme: 2, gecti: true } },
          partlar: { 'm1-d1': { enIyi: 90.4, izlendi: true } },
          defter: {
            'm1-d1-q0': { ardisikDogru: 0 },
            'm1-d1-q1': { ardisikDogru: 0 },
            silinmis: { ardisikDogru: 0 },
          },
          kartlar: { a: 3, b: 3, c: 2, d: 1 },
        }),
      ),
    })
    expect(await screen.findByRole('heading', { name: 'İlerleme' })).toBeInTheDocument()
    expect(screen.getByText('Geçilen modül 1/8')).toBeInTheDocument()
    expect(screen.getByText('Defterdeki soru 2')).toBeInTheDocument()
    expect(screen.getByText('Öğrenilen kart 2')).toBeInTheDocument()

    const satir = (n: number) => screen.getByText(`Modül ${n}: Başlık ${n}`).closest('details')!
    expect(within(satir(1)).getByText('Geçildi')).toBeInTheDocument()
    expect(within(satir(1)).getByText('Sınav: en iyi %85 · 2 deneme')).toBeInTheDocument()
    expect(within(satir(1)).getByText('Ders 1: Ders 1')).toBeInTheDocument()
    expect(within(satir(1)).getByText('%90')).toBeInTheDocument()
    expect(within(satir(1)).getByText('✓ İzlendi')).toBeInTheDocument()
    expect(within(satir(2)).getByText('Açık')).toBeInTheDocument()
    expect(within(satir(3)).getByText('Kilitli')).toBeInTheDocument()
  })
})

describe('SettingsPage', () => {
  const validProgress = withProgress({
    sinavlar: { 'modul-1': { enIyi: 80, deneme: 1, gecti: true } },
    kartlar: { x: 2 },
  })

  beforeEach(() => {
    if (!File.prototype.text) {
      File.prototype.text = function (this: File) {
        return new Promise<string>((res, rej) => {
          const r = new FileReader()
          r.onload = () => res(String(r.result))
          r.onerror = () => rej(r.error)
          r.readAsText(this)
        })
      }
    }
  })

  it('dışa aktar: indirme adı ve blob URL temizliği', async () => {
    const create = vi.fn(() => 'blob:x')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toMatch(/^langapp-ilerleme-\d{4}-\d{2}-\d{2}\.json$/)
    })
    renderAt('/ayarlar')
    await userEvent.click(await screen.findByRole('button', { name: 'İlerlemeyi dışa aktar' }))
    expect(create).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:x')
  })

  it('geçersiz dosya: hata mesajı, progress değişmez', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const store = makeStore(validProgress)
    const before = store.raw()
    renderAt('/ayarlar', { store })
    const input = await screen.findByLabelText('İçe aktarılacak dosya')
    await userEvent.upload(input, new File(['{bozuk'], 'x.json', { type: 'application/json' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Dosya geçerli bir JSON değil.')
    expect(confirm).not.toHaveBeenCalled()
    expect(store.raw()).toBe(before)
  })

  it('geçerli dosya + onay: progress dosyadakiyle eşit', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const store = renderAt('/ayarlar')
    const input = await screen.findByLabelText('İçe aktarılacak dosya')
    await userEvent.upload(
      input,
      new File([exportProgress(validProgress)], 'x.json', { type: 'application/json' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('İlerleme içe aktarıldı.')
    expect(confirm).toHaveBeenCalledWith('Mevcut ilerlemenin üzerine yazılacak. Emin misin?')
    expect(JSON.parse(store.raw()!)).toEqual(validProgress)
  })

  it('geçerli dosya + onay iptal: değişmez', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const store = makeStore(withProgress({ kartlar: { y: 1 } }))
    const before = store.raw()
    renderAt('/ayarlar', { store })
    const input = await screen.findByLabelText('İçe aktarılacak dosya')
    await userEvent.upload(
      input,
      new File([exportProgress(validProgress)], 'x.json', { type: 'application/json' }),
    )
    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    expect(screen.queryByRole('status')).toBeNull()
    expect(store.raw()).toBe(before)
  })

  it('sıfırla: iptal -> değişmez, onay -> emptyProgress', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const store = makeStore(validProgress)
    const before = store.raw()
    renderAt('/ayarlar', { store })
    const btn = await screen.findByRole('button', { name: 'İlerlemeyi sıfırla' })
    await userEvent.click(btn)
    expect(confirm).toHaveBeenCalledWith('Tüm ilerleme silinecek. Emin misin?')
    expect(store.raw()).toBe(before)
    await userEvent.click(btn)
    expect(screen.getByRole('status')).toHaveTextContent('İlerleme sıfırlandı.')
    expect(JSON.parse(store.raw()!)).toEqual(emptyProgress())
  })
})

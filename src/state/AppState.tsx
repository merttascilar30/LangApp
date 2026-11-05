import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { contentFiles } from '../content/files'
import { loadContent, type LoadResult } from '../content/loader'
import { type ProgressState } from '../domain/progress'
import { detectGermanVoice } from '../speech/speech'
import { SozlukContext } from './SozlukContext'
import { loadProgress, saveProgress, type LoadDurum } from '../storage/storage'

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type AppState = LoadResult & {
  progress: ProgressState
  depolamaDurumu: LoadDurum
  update(fn: (s: ProgressState) => ProgressState): void
  replaceProgress(s: ProgressState): void
  ttsVar: boolean | null
}

const AppStateContext = createContext<AppState | null>(null)

type Props = {
  files?: Record<string, unknown>
  store?: Store
  detectVoice?: () => Promise<boolean>
  children: ReactNode
}

export function AppStateProvider({
  files = contentFiles,
  store,
  detectVoice = detectGermanVoice,
  children,
}: Props) {
  const content = useMemo(() => loadContent(files), [files])

  const [initial] = useState(() => loadProgress(store))
  const [progress, setProgress] = useState<ProgressState>(initial.state)
  const [depolamaDurumu, setDepolamaDurumu] = useState<LoadDurum>(initial.durum)
  const [ttsVar, setTtsVar] = useState<boolean | null>(null)

  // Güncel değerler: art arda update çağrıları ve bozuk kontrolü için senkron okuma.
  const progressRef = useRef(progress)
  const durumRef = useRef(depolamaDurumu)

  const persist = useCallback(
    (next: ProgressState) => {
      if (durumRef.current === 'bozuk') return
      if (!saveProgress(next, store)) {
        durumRef.current = 'erisilemez'
        setDepolamaDurumu('erisilemez')
      }
    },
    [store],
  )

  const update = useCallback(
    (fn: (s: ProgressState) => ProgressState) => {
      const next = fn(progressRef.current)
      progressRef.current = next
      setProgress(next)
      persist(next)
    },
    [persist],
  )

  const replaceProgress = useCallback(
    (s: ProgressState) => {
      progressRef.current = s
      setProgress(s)
      durumRef.current = 'ok'
      setDepolamaDurumu('ok')
      persist(s)
    },
    [persist],
  )

  useEffect(() => {
    let aktif = true
    void detectVoice().then((v) => {
      if (aktif) setTtsVar(v)
    })
    return () => {
      aktif = false
    }
    // Algılama yalnızca bir kez çalışır.
  }, [])

  const value = useMemo<AppState>(
    () => ({ ...content, progress, depolamaDurumu, update, replaceProgress, ttsVar }),
    [content, progress, depolamaDurumu, update, replaceProgress, ttsVar],
  )

  const sozlukFor = useCallback(
    (soruId: string) =>
      content.moduller.find((m) => m.id === content.soruIndex.get(soruId)?.modulId)?.sozluk ?? {},
    [content],
  )

  return (
    <AppStateContext.Provider value={value}>
      <SozlukContext.Provider value={sozlukFor}>{children}</SozlukContext.Provider>
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState yalnızca AppStateProvider içinde kullanılabilir')
  return ctx
}

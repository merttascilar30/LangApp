import { createContext } from 'react'

export const SozlukContext = createContext<(soruId: string) => Record<string, string>>(() => ({}))

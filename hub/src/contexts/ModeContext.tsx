'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type AppMode = 'assist' | 'project'

interface ModeContextType {
  mode: AppMode
  setMode: (mode: AppMode) => void
  toggleMode: () => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('assist') // Default to AssistMode

  const toggleMode = () => {
    setMode(prev => prev === 'assist' ? 'project' : 'assist')
  }

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}


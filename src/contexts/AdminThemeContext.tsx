import { createContext, useContext, useEffect, useState } from 'react'

type AdminColorScheme = 'light' | 'dark'

interface AdminThemeContextValue {
  colorScheme: AdminColorScheme
  toggleColorScheme: () => void
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

const STORAGE_KEY = 'admin-color-scheme'

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<AdminColorScheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (colorScheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, colorScheme)
  }, [colorScheme])

  function toggleColorScheme() {
    setColorScheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <AdminThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) throw new Error('useAdminTheme must be used inside AdminThemeProvider')
  return ctx
}

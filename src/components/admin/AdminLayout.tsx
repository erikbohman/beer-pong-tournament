import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AdminThemeProvider } from '@/contexts/AdminThemeContext'

const PAGE_TITLES: Record<string, string> = {
  '/admin/tournaments': 'Tournaments',
  '/admin/tournaments/new': 'New Tournament',
  '/admin/themes': 'Themes',
}

export function AdminLayout() {
  const location = useLocation()
  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path) && (path === location.pathname || location.pathname.includes('/edit'))
  )?.[1] ?? 'Admin Panel'

  return (
    <AdminThemeProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-950">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar title={title} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  )
}

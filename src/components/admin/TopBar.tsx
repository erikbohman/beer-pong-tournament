import { Sun, Moon, LogOut } from 'lucide-react'
import { useAdminTheme } from '@/contexts/AdminThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const { colorScheme, toggleColorScheme } = useAdminTheme()
  const { signOut, user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-dark-700 dark:bg-dark-900">
      <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {title ?? 'Admin Panel'}
      </h1>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
          {user?.email}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleColorScheme}
          title={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          title="Sign out"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  )
}

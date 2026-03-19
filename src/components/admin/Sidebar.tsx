import { NavLink } from 'react-router-dom'
import { Trophy, Palette, Plus, List, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

function SidebarNavLink({ to, icon, label }: NavItem) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-gray-100'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-900">
      {/* Logo area */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-dark-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
          <Trophy size={16} />
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Beer Pong
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* Tournament Management */}
        <div className="mb-4">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Tournament Management
          </p>
          <div className="flex flex-col gap-0.5">
            <SidebarNavLink
              to="/admin/tournaments"
              icon={<List size={16} />}
              label="Tournaments"
            />
            <SidebarNavLink
              to="/admin/tournaments/new"
              icon={<Plus size={16} />}
              label="New Tournament"
            />
          </div>
        </div>

        {/* Tournament Themes */}
        <div className="mb-4">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Tournament Themes
          </p>
          <div className="flex flex-col gap-0.5">
            <SidebarNavLink
              to="/admin/themes"
              icon={<Palette size={16} />}
              label="Themes"
            />
          </div>
        </div>

        {/* Rules */}
        <div>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Rules
          </p>
          <div className="flex flex-col gap-0.5">
            <SidebarNavLink
              to="/admin/rules"
              icon={<BookOpen size={16} />}
              label="Rules"
            />
          </div>
        </div>
      </nav>
    </aside>
  )
}

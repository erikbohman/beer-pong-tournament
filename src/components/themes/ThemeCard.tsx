import { Pencil, Trash2 } from 'lucide-react'
import { ThemeMiniPreview } from './ThemeMiniPreview'
import { Button } from '@/components/ui/Button'
import type { Theme } from '@/lib/types'

interface ThemeCardProps {
  theme: Theme
  onEdit: (theme: Theme) => void
  onDelete: (theme: Theme) => void
}

export function ThemeCard({ theme, onEdit, onDelete }: ThemeCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
      <ThemeMiniPreview theme={theme} />
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{theme.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{theme.font_style}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(theme)} title="Edit">
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(theme)}
              title="Delete"
              className="hover:text-red-500"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex gap-1.5">
          {[theme.primary_color, theme.secondary_color, theme.accent_color, theme.background_color].map(
            (color, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full border border-gray-200 dark:border-dark-600"
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

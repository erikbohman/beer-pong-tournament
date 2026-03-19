import type { Theme } from '@/lib/types'

interface ThemeMiniPreviewProps {
  theme: Partial<Theme>
}

export function ThemeMiniPreview({ theme }: ThemeMiniPreviewProps) {
  const bg = theme.background_color ?? '#111827'
  const primary = theme.primary_color ?? '#f97316'
  const secondary = theme.secondary_color ?? '#fb923c'
  const accent = theme.accent_color ?? '#fbbf24'

  return (
    <div
      className="relative h-28 w-full overflow-hidden rounded-lg"
      style={{
        backgroundColor: bg,
        backgroundImage: theme.background_image_url
          ? `url(${theme.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Logo */}
      {theme.logo_url && (
        <img
          src={theme.logo_url}
          alt="Logo"
          className="absolute left-2 top-2 h-7 w-7 rounded object-contain"
        />
      )}

      {/* Sample bracket boxes */}
      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-3 flex-1 rounded"
            style={{ backgroundColor: i === 0 ? primary : i === 1 ? secondary : accent }}
          />
        ))}
      </div>

      {/* Font sample */}
      <div className="absolute left-2 top-2 right-2">
        <p
          className="truncate text-sm font-bold"
          style={{ color: primary, fontFamily: theme.font_style ?? 'inherit' }}
        >
          {theme.name ?? 'Preview'}
        </p>
      </div>
    </div>
  )
}

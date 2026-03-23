import { useEffect, useLayoutEffect } from 'react'
import type { Theme } from '@/lib/types'

interface TournamentThemeProviderProps {
  theme: Theme | null
  children: React.ReactNode
}

const GOOGLE_FONTS = ['Roboto', 'Oswald', 'Press Start 2P', 'Bebas Neue', 'Raleway']

export function TournamentThemeProvider({ theme, children }: TournamentThemeProviderProps) {
  useEffect(() => {
    if (!theme?.font_style) return
    const fontName = theme.font_style
    if (fontName === 'Inter' || fontName === 'Arial') return // System fonts

    if (GOOGLE_FONTS.includes(fontName)) {
      const linkId = `gfont-${fontName.replace(/\s+/g, '-')}`
      if (document.getElementById(linkId)) return
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`
      document.head.appendChild(link)
    }
  }, [theme?.font_style])

  const dark = !theme || theme.ui_mode !== 'light'
  const uiVars = dark
    ? {
        '--ui-card-bg': 'rgba(255,255,255,0.07)',
        '--ui-card-border': 'rgba(255,255,255,0.10)',
        '--ui-divider': 'rgba(255,255,255,0.06)',
        '--ui-text-primary': '#ffffff',
        '--ui-text-muted': 'rgba(255,255,255,0.50)',
        '--ui-text-faint': 'rgba(255,255,255,0.30)',
        '--ui-tab-bg': 'rgba(255,255,255,0.08)',
        '--ui-overlay-bg': 'rgba(0,0,0,0.40)',
        '--ui-modal-bg': 'rgba(20,20,30,0.97)',
        '--ui-modal-border': 'rgba(255,255,255,0.10)',
        '--ui-backdrop': 'rgba(0,0,0,0.60)',
        '--ui-button-bg': 'rgba(255,255,255,0.07)',
      }
    : {
        '--ui-card-bg': 'rgba(255,255,255,0.80)',
        '--ui-card-border': 'rgba(0,0,0,0.12)',
        '--ui-divider': 'rgba(0,0,0,0.10)',
        '--ui-text-primary': '#111827',
        '--ui-text-muted': 'rgba(0,0,0,0.55)',
        '--ui-text-faint': 'rgba(0,0,0,0.35)',
        '--ui-tab-bg': 'rgba(255,255,255,0.70)',
        '--ui-overlay-bg': 'rgba(255,255,255,0.70)',
        '--ui-modal-bg': 'rgba(250,250,252,0.98)',
        '--ui-modal-border': 'rgba(0,0,0,0.15)',
        '--ui-backdrop': 'rgba(0,0,0,0.40)',
        '--ui-button-bg': 'rgba(255,255,255,0.70)',
      }

  const style: React.CSSProperties = theme
    ? {
        '--color-primary': theme.primary_color,
        '--color-secondary': theme.secondary_color,
        '--color-accent': theme.accent_color,
        '--color-bg': theme.background_color,
        ...uiVars,
        fontFamily: theme.font_style ?? 'Inter, sans-serif',
      } as React.CSSProperties
    : uiVars as React.CSSProperties

  const bgStyle: React.CSSProperties = { minHeight: '100dvh' }

  return (
    <div style={{ ...style, ...bgStyle }}>
      {children}
    </div>
  )
}

// Applies the background image to the <html> element so it never moves
export function TournamentBgImage({ theme, children }: { theme: Theme | null; children: React.ReactNode }) {
  useLayoutEffect(() => {
    const el = document.documentElement
    // Prevent html/body from scrolling so the background image never shifts.
    // Scrolling is handled by the inner scroll container in TournamentPage.
    el.style.overflow = 'hidden'
    el.style.height = '100%'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100%'
    if (theme?.background_image_url) {
      const overlay = theme.background_color ? `${theme.background_color}8c` : '#11182780'
      el.style.backgroundImage = `linear-gradient(${overlay}, ${overlay}), url(${theme.background_image_url})`
      el.style.backgroundSize = 'cover'
      el.style.backgroundPosition = 'center'
      el.style.backgroundAttachment = 'fixed'
    }
    return () => {
      el.style.overflow = ''
      el.style.height = ''
      document.body.style.overflow = ''
      document.body.style.height = ''
      el.style.backgroundImage = ''
      el.style.backgroundSize = ''
      el.style.backgroundPosition = ''
      el.style.backgroundAttachment = ''
    }
  }, [theme?.background_image_url, theme?.background_color])

  return <div className="flex-1">{children}</div>
}

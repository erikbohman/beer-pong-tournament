import { Trophy } from 'lucide-react'
import type { Player } from '@/lib/types'

interface WinnerBannerProps {
  winnerName: string
  members: Player[]
  primaryColor: string
  accentColor: string
}

export function WinnerBanner({ winnerName, members, primaryColor, accentColor }: WinnerBannerProps) {
  return (
    <>
      <style>{`
        @keyframes wb-trophy {
          0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); }
          45%       { transform: translateY(-8px) rotate(5deg) scale(1.06); }
        }
        @keyframes wb-glow {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50%       { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes wb-fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wb-root   { animation: wb-fade-in 0.5s ease-out both; }
        .wb-trophy { animation: wb-trophy  2.4s ease-in-out infinite; display: inline-block; }
        .wb-glow   { animation: wb-glow    2.4s ease-in-out infinite; }
      `}</style>

      <div
        className="wb-root relative mb-6 overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: `1.5px solid ${primaryColor}55`, backgroundColor: 'var(--ui-card-bg)' }}
      >
        {/* Glow blob */}
        <div
          className="wb-glow pointer-events-none absolute -top-8 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: `${accentColor}33` }}
        />

        <div className="relative flex items-center gap-4">
          {/* Trophy */}
          <div className="wb-trophy flex-shrink-0">
            <Trophy size={44} strokeWidth={1.5} style={{ color: accentColor }} />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p
              className="mb-0.5 text-xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--ui-text-muted)' }}
            >
              🏆 Tournament Champion
            </p>
            <p className="truncate text-2xl font-bold" style={{ color: primaryColor }}>
              {winnerName}
            </p>
            {members.length > 0 && (
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ui-text-muted)' }}>
                {members.map(m => m.name).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

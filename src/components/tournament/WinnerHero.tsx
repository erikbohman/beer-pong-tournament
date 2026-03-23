import { X, Trophy } from 'lucide-react'
import type { Player } from '@/lib/types'

interface WinnerHeroProps {
  winnerName: string
  members: Player[]
  primaryColor: string
  accentColor: string
  onDismiss: () => void
}

const CONFETTI_COLORS = ['#f97316', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']

const confettiItems = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 13 + 7) % 100}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: `${((i * 0.18) % 1.8).toFixed(2)}s`,
  duration: `${(2.2 + (i % 5) * 0.3).toFixed(1)}s`,
  size: `${7 + (i % 4) * 2}px`,
  shape: i % 3 === 0 ? 'circle' : 'rect',
}))

export function WinnerHero({ winnerName, members, primaryColor, accentColor, onDismiss }: WinnerHeroProps) {
  return (
    <>
      <style>{`
        @keyframes wh-fade-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes wh-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wh-trophy {
          0%, 100% { transform: translateY(0)    rotate(-6deg) scale(1);    }
          40%      { transform: translateY(-14px) rotate( 6deg) scale(1.08); }
        }
        @keyframes wh-confetti {
          0%   { transform: translateY(-40px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(740deg); opacity: 0; }
        }
        @keyframes wh-shimmer {
          0%   { box-shadow: 0 0 0   8px transparent; }
          50%  { box-shadow: 0 0 32px 8px ${accentColor}55; }
          100% { box-shadow: 0 0 0   8px transparent; }
        }
        .wh-card    { animation: wh-fade-in  0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .wh-trophy  { animation: wh-trophy   2.2s ease-in-out infinite; display: inline-block; }
        .wh-name    { animation: wh-slide-up 0.5s 0.25s ease-out both; }
        .wh-members { animation: wh-slide-up 0.5s 0.45s ease-out both; }
        .wh-btn     { animation: wh-slide-up 0.5s 0.55s ease-out both; }
        .wh-ring    { animation: wh-shimmer  2.4s 0.5s ease-in-out infinite; }
        .wh-confetti-item { animation: wh-confetti linear forwards; position: fixed; top: 0; pointer-events: none; z-index: 60; border-radius: 2px; }
      `}</style>

      {/* Confetti */}
      {confettiItems.map(item => (
        <div
          key={item.id}
          className="wh-confetti-item"
          style={{
            left: item.left,
            width: item.size,
            height: item.shape === 'circle' ? item.size : `${parseInt(item.size) * 1.6}px`,
            backgroundColor: item.color,
            borderRadius: item.shape === 'circle' ? '50%' : '2px',
            animationDuration: item.duration,
            animationDelay: item.delay,
          }}
        />
      ))}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={onDismiss}
      >
        <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.72)' }} />

        {/* Card */}
        <div
          className="wh-card wh-ring relative z-10 flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl p-8 text-center"
          style={{
            backgroundColor: 'var(--ui-modal-bg)',
            border: `2px solid ${primaryColor}`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-full p-1 transition-opacity hover:opacity-100"
            style={{ color: 'var(--ui-text-faint)', opacity: 0.6 }}
          >
            <X size={18} />
          </button>

          {/* Trophy */}
          <div className="wh-trophy">
            <Trophy size={72} strokeWidth={1.5} style={{ color: accentColor }} />
          </div>

          {/* Label + Name */}
          <div className="wh-name flex flex-col gap-1.5">
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--ui-text-muted)' }}
            >
              🏆 Tournament Champion
            </p>
            <h2 className="text-3xl font-bold leading-tight" style={{ color: primaryColor }}>
              {winnerName}
            </h2>
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div
              className="wh-members w-full rounded-2xl px-4 py-3"
              style={{ backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
            >
              <div className="flex flex-col gap-1">
                {members.map(m => (
                  <span key={m.id} className="text-sm font-medium" style={{ color: 'var(--ui-text-primary)' }}>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onDismiss}
            className="wh-btn w-full rounded-xl py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            Congratulations! 🎉
          </button>
        </div>
      </div>
    </>
  )
}

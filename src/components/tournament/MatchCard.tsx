import type { Match } from '@/lib/types'

interface MatchCardProps {
  match: Match
  participant1Name: string
  participant2Name: string
  primaryColor: string
  onClick: () => void
}

export function MatchCard({ match, participant1Name, participant2Name, primaryColor, onClick }: MatchCardProps) {
  const isComplete = !!match.winner_id
  const p1Wins = match.winner_id === match.participant1_id
  const p2Wins = match.winner_id === match.participant2_id

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-xl text-left transition-transform active:scale-95"
      style={{ backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
    >
      {/* Participant 1 */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{
          backgroundColor: p1Wins ? `${primaryColor}30` : 'transparent',
          borderBottom: '1px solid var(--ui-divider)',
        }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: p1Wins ? primaryColor : p2Wins ? 'var(--ui-text-muted)' : 'var(--ui-text-primary)' }}
        >
          {participant1Name || 'TBD'}
        </span>
        {isComplete && (
          <span className="text-xs font-medium" style={{ color: p1Wins ? primaryColor : 'var(--ui-text-faint)' }}>
            {match.participant1_cups ?? 0}
          </span>
        )}
      </div>

      {/* Participant 2 */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ backgroundColor: p2Wins ? `${primaryColor}30` : 'transparent' }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: p2Wins ? primaryColor : p1Wins ? 'var(--ui-text-muted)' : 'var(--ui-text-primary)' }}
        >
          {participant2Name || 'TBD'}
        </span>
        {isComplete && (
          <span className="text-xs font-medium" style={{ color: p2Wins ? primaryColor : 'var(--ui-text-faint)' }}>
            {match.participant2_cups ?? 0}
          </span>
        )}
      </div>
    </button>
  )
}

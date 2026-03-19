import type { Team, Player } from '@/lib/types'

interface ParticipantsTabProps {
  participantType: 'players' | 'teams'
  players: Player[]
  teams: Team[]
  teamPlayers: Record<string, Player[]>
  primaryColor: string
}

export function ParticipantsTab({
  participantType,
  players,
  teams,
  teamPlayers,
  primaryColor,
}: ParticipantsTabProps) {
  if (participantType === 'players') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {players
          .sort((a, b) => a.seed_order - b.seed_order)
          .map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-2 rounded-xl p-3"
              style={{ backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {i + 1}
              </span>
              <span className="truncate text-sm font-medium" style={{ color: 'var(--ui-text-primary)' }}>
                {player.name}
              </span>
            </div>
          ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams
        .sort((a, b) => a.seed_order - b.seed_order)
        .map((team, i) => (
          <div
            key={team.id}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {i + 1}
              </span>
              <span className="font-medium" style={{ color: 'var(--ui-text-primary)' }}>{team.name}</span>
            </div>
            {(teamPlayers[team.id] ?? []).length > 0 && (
              <div className="flex flex-col gap-1 pl-9">
                {(teamPlayers[team.id] ?? []).map(player => (
                  <span key={player.id} className="text-sm" style={{ color: 'var(--ui-text-muted)' }}>
                    {player.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  )
}

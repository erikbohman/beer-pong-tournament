import { calculateStandings } from '@/lib/groupUtils'
import type { Match, Group } from '@/lib/types'

interface GroupStandingsProps {
  groups: Group[]
  participantIds: string[]
  participantNames: Record<string, string>
  groupParticipants: Record<string, string[]>
  matches: Match[]
  primaryColor: string
  accentColor: string
}

export function GroupStandings({
  groups,
  participantNames,
  groupParticipants,
  matches,
  primaryColor,
}: GroupStandingsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {groups
        .sort((a, b) => a.order_index - b.order_index)
        .map(group => {
          const ids = groupParticipants[group.id] ?? []
          const groupMatches = matches.filter(m => m.group_id === group.id)
          const standings = calculateStandings(ids, participantNames, groupMatches)

          return (
            <div key={group.id}>
              <div className="mb-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
                  style={{ color: primaryColor, backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
                >
                  {group.name}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl" style={{ backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ui-divider)' }}>
                      {['#', 'Name', 'P', 'W', 'L', 'CF', 'CA', '+/-'].map(h => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-medium"
                          style={{ color: 'var(--ui-text-muted)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr
                        key={s.participantId}
                        style={{ borderBottom: i < standings.length - 1 ? '1px solid var(--ui-divider)' : 'none' }}
                      >
                        <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--ui-text-muted)' }}>
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 font-medium" style={{ color: 'var(--ui-text-primary)' }}>{s.participantName}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--ui-text-muted)' }}>{s.played}</td>
                        <td className="px-3 py-2 font-medium" style={{ color: primaryColor }}>{s.wins}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--ui-text-muted)' }}>{s.losses}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--ui-text-muted)' }}>{s.cupsFor}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--ui-text-muted)' }}>{s.cupsAgainst}</td>
                        <td
                          className="px-3 py-2 font-medium"
                          style={{ color: s.diff >= 0 ? primaryColor : 'var(--ui-text-muted)' }}
                        >
                          {s.diff >= 0 ? `+${s.diff}` : s.diff}
                        </td>
                      </tr>
                    ))}
                    {standings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-4 text-center text-sm" style={{ color: 'var(--ui-text-faint)' }}>
                          No results yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
    </div>
  )
}

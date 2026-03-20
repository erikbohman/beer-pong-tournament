import type { Match, Standing } from './types'

/**
 * Calculates group standings from a list of completed group-stage matches.
 *
 * @param participantIds  All participant IDs in this group
 * @param participantNames  Map of participantId → display name
 * @param matches  All matches for this group (completed and pending)
 */
export function calculateStandings(
  participantIds: string[],
  participantNames: Record<string, string>,
  matches: Match[],
): Standing[] {
  const stats: Record<string, Standing> = {}

  for (const id of participantIds) {
    stats[id] = {
      participantId: id,
      participantName: participantNames[id] ?? id,
      played: 0,
      wins: 0,
      losses: 0,
      cupsFor: 0,
      cupsAgainst: 0,
      diff: 0,
    }
  }

  for (const match of matches) {
    if (!match.winner_id) continue
    const { participant1_id: p1, participant2_id: p2, winner_id, participant1_cups, participant2_cups } = match
    if (!p1 || !p2) continue

    const loserId = winner_id === p1 ? p2 : p1

    // loser's cups left = margin of victory
    const loserCupsLeft = winner_id === p1 ? (participant2_cups ?? 0) : (participant1_cups ?? 0)

    if (stats[winner_id]) {
      stats[winner_id].played++
      stats[winner_id].wins++
      stats[winner_id].cupsFor += loserCupsLeft
    }

    if (stats[loserId]) {
      stats[loserId].played++
      stats[loserId].losses++
      stats[loserId].cupsAgainst += loserCupsLeft
    }
  }

  // Calculate diff and sort
  return Object.values(stats)
    .map(s => ({ ...s, diff: s.cupsFor - s.cupsAgainst }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.diff !== a.diff) return b.diff - a.diff
      return b.cupsFor - a.cupsFor
    })
}

/**
 * Returns true if all matches in a group are completed.
 */
export function isGroupComplete(matches: Match[]): boolean {
  const groupMatches = matches.filter(m => m.stage === 'group')
  return groupMatches.length > 0 && groupMatches.every(m => m.winner_id !== null)
}

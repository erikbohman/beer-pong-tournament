import { useState, useEffect } from 'react'
import { MatchCard } from './MatchCard'
import { ScoreModal } from './ScoreModal'
import { getNextRoundMatchInfo } from '@/lib/bracketUtils'
import { supabase } from '@/lib/supabase'
import type { Match } from '@/lib/types'

interface KnockoutBracketProps {
  matches: Match[]
  participantNames: Record<string, string>
  primaryColor: string
  accentColor: string
  onMatchUpdated: (match: Match) => void
}

export function KnockoutBracket({
  matches,
  participantNames,
  primaryColor,
  accentColor,
  onMatchUpdated,
}: KnockoutBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Auto-advance BYE winners that haven't been forwarded yet (fixes existing brackets)
  useEffect(() => {
    const knockouts = matches.filter(m => m.stage === 'knockout')
    const byeMatches = knockouts.filter(m => m.winner_id && !m.participant2_id)

    for (const byeMatch of byeMatches) {
      const next = getNextRoundMatchInfo(byeMatch, matches)
      if (!next) continue

      // Check if the next-round slot is already filled
      const nextMatch = knockouts.find(m => m.id === next.matchId)
      if (!nextMatch) continue
      const alreadyFilled = next.slot === 1 ? nextMatch.participant1_id : nextMatch.participant2_id
      if (alreadyFilled) continue

      // Advance the BYE winner
      const winnerId = byeMatch.winner_id!
      const winnerType = byeMatch.winner_type
      const updatePayload = next.slot === 1
        ? { participant1_id: winnerId, participant1_type: winnerType }
        : { participant2_id: winnerId, participant2_type: winnerType }

      supabase
        .from('matches')
        .update(updatePayload)
        .eq('id', next.matchId)
        .select()
        .single()
        .then(({ data }) => {
          if (data) onMatchUpdated(data as Match)
        })
    }
  }, [matches])

  const knockoutMatches = matches
    .filter(m => m.stage === 'knockout')
    .sort((a, b) => a.round - b.round || a.match_number - b.match_number)

  const maxRound = knockoutMatches.reduce((max, m) => Math.max(max, m.round), 0)

  const rounds = Array.from({ length: maxRound }, (_, i) => ({
    round: i + 1,
    matches: knockoutMatches.filter(m => m.round === i + 1),
  }))

  const getRoundLabel = (round: number, total: number) => {
    if (round === total) return 'Final'
    if (round === total - 1) return 'Semi-Final'
    if (round === total - 2) return 'Quarter-Final'
    return `Round ${round}`
  }

  // Height of one R1 match slot (card ~80px + spacing)
  const SLOT_HEIGHT = 96
  const numR1Matches = rounds[0]?.matches.length ?? 1
  const bracketHeight = numR1Matches * SLOT_HEIGHT

  if (knockoutMatches.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ui-text-muted)' }}>
        Knockout bracket not yet available.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto pb-4 flex justify-center">
        <div className="flex flex-col min-w-max">

          {/* Round labels — shared row above all columns */}
          <div className="flex gap-6 mb-3">
            {rounds.map(({ round }) => (
              <div key={round} className="flex w-44 justify-center">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
                  style={{ color: primaryColor, backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
                >
                  {getRoundLabel(round, maxRound)}
                </span>
              </div>
            ))}
          </div>

          {/* Match columns — all same height so justify-around centers each round */}
          <div className="flex gap-6" style={{ height: `${bracketHeight}px` }}>
            {rounds.map(({ round, matches: roundMatches }) => (
              <div key={round} className="w-44 flex flex-col justify-around">
                {roundMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    participant1Name={
                      match.participant1_id
                        ? (participantNames[match.participant1_id] ?? 'Unknown')
                        : 'TBD'
                    }
                    participant2Name={
                      match.participant2_id
                        ? (participantNames[match.participant2_id] ?? 'Unknown')
                        : match.participant2_id === null && match.winner_id
                        ? 'BYE'
                        : 'TBD'
                    }
                    primaryColor={primaryColor}
                    onClick={() => {
                      // Don't allow editing byes
                      if (!match.participant1_id || !match.participant2_id) return
                      setSelectedMatch(match)
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>

      {selectedMatch && (
        <ScoreModal
          match={selectedMatch}
          participant1Name={
            selectedMatch.participant1_id
              ? (participantNames[selectedMatch.participant1_id] ?? 'Player 1')
              : 'Player 1'
          }
          participant2Name={
            selectedMatch.participant2_id
              ? (participantNames[selectedMatch.participant2_id] ?? 'Player 2')
              : 'Player 2'
          }
          primaryColor={primaryColor}
          accentColor={accentColor}
          onClose={() => setSelectedMatch(null)}
          onSaved={async (updatedMatch) => {
            onMatchUpdated(updatedMatch)
            setSelectedMatch(null)

            // Cascade: advance winner + clear stale downstream results
            let currentMatch = updatedMatch
            let latestMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m)

            while (true) {
              const next = getNextRoundMatchInfo(currentMatch, latestMatches)
              if (!next) break

              const winnerId = currentMatch.winner_id!
              const winnerType = currentMatch.winner_type

              const nextMatch = latestMatches.find(m => m.id === next.matchId)
              if (!nextMatch) break

              // Check if the participant in this slot actually changed
              const currentSlotValue = next.slot === 1 ? nextMatch.participant1_id : nextMatch.participant2_id
              const slotChanged = currentSlotValue !== winnerId

              // Build update: always set the participant slot
              const updatePayload: Record<string, unknown> = next.slot === 1
                ? { participant1_id: winnerId, participant1_type: winnerType }
                : { participant2_id: winnerId, participant2_type: winnerType }

              // If slot changed, also clear winner/scores (result is now invalid)
              if (slotChanged && nextMatch.winner_id) {
                updatePayload.winner_id = null
                updatePayload.winner_type = null
                updatePayload.participant1_cups = null
                updatePayload.participant2_cups = null
              }

              const { data } = await supabase
                .from('matches')
                .update(updatePayload)
                .eq('id', next.matchId)
                .select()
                .single()

              if (!data) break

              const updatedNext = data as Match
              onMatchUpdated(updatedNext)
              latestMatches = latestMatches.map(m => m.id === updatedNext.id ? updatedNext : m)

              // If we cleared the winner, cascade further to clear downstream
              if (slotChanged && nextMatch.winner_id) {
                currentMatch = updatedNext
                continue
              }

              break
            }
          }}
        />
      )}
    </>
  )
}

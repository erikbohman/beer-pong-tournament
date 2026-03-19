import { useState } from 'react'
import { KnockoutBracket } from './KnockoutBracket'
import { GroupStandings } from './GroupStandings'
import { MatchCard } from './MatchCard'
import { ScoreModal } from './ScoreModal'
import { supabase } from '@/lib/supabase'
import { calculateStandings, isGroupComplete } from '@/lib/groupUtils'
import { crossGroupSeedOrder, generateSingleEliminationMatches } from '@/lib/bracketUtils'
import type { Match, Group, Tournament } from '@/lib/types'

interface BracketViewProps {
  tournament: Tournament
  groups: Group[]
  matches: Match[]
  participantNames: Record<string, string>
  groupParticipants: Record<string, string[]>
  primaryColor: string
  accentColor: string
  onMatchUpdated: (match: Match) => void
  isOwner?: boolean
  onMatchesAdded?: (matches: Match[]) => void
}

export function BracketView({
  tournament,
  groups,
  matches,
  participantNames,
  groupParticipants,
  primaryColor,
  accentColor,
  onMatchUpdated,
  isOwner = false,
  onMatchesAdded,
}: BracketViewProps) {
  const [selectedGroupMatch, setSelectedGroupMatch] = useState<Match | null>(null)
  const [subTab, setSubTab] = useState<'groups' | 'knockout'>('groups')
  const [generatingKnockout, setGeneratingKnockout] = useState(false)
  const [knockoutError, setKnockoutError] = useState<string | null>(null)

  const groupMatches = matches.filter(m => m.stage === 'group')
  const knockoutMatches = matches.filter(m => m.stage === 'knockout')

  async function generateKnockout() {
    setGeneratingKnockout(true)
    setKnockoutError(null)

    try {
      const advancing = tournament.players_advancing_per_group ?? 1
      const participantType = tournament.participant_type === 'teams' ? 'team' : 'player'

      // Build ranked participant lists per group
      const sortedGroups = [...groups].sort((a, b) => a.order_index - b.order_index)
      const rankedGroups: string[][] = sortedGroups.map(group => {
        const ids = groupParticipants[group.id] ?? []
        const gMatches = matches.filter(m => m.group_id === group.id)
        const standings = calculateStandings(ids, participantNames, gMatches)
        return standings.slice(0, advancing).map(s => s.participantId)
      })

      // Cross-group seed order
      const seedOrder = crossGroupSeedOrder(rankedGroups, advancing)

      if (seedOrder.length === 0) {
        throw new Error('No participants to seed into the knockout bracket.')
      }

      // Generate match rows
      const matchInserts = generateSingleEliminationMatches(
        tournament.id,
        seedOrder,
        participantType as 'team' | 'player',
      )

      // Insert into Supabase
      const { data, error } = await supabase
        .from('matches')
        .insert(matchInserts)
        .select()

      if (error) throw new Error(error.message)

      onMatchesAdded?.(data as Match[])
      setSubTab('knockout')
    } catch (err) {
      setKnockoutError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGeneratingKnockout(false)
    }
  }

  if (tournament.type === 'single_elimination') {
    return (
      <KnockoutBracket
        matches={matches}
        participantNames={participantNames}
        primaryColor={primaryColor}
        accentColor={accentColor}
        onMatchUpdated={onMatchUpdated}
      />
    )
  }

  if (tournament.type === 'group_stage') {
    return (
      <div className="flex flex-col gap-8">
        <GroupStandings
          groups={groups}
          participantIds={[]}
          participantNames={participantNames}
          groupParticipants={groupParticipants}
          matches={matches}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />

        {groupMatches.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-max justify-center">
              {[...groups]
                .sort((a, b) => a.order_index - b.order_index)
                .map(group => {
                  const gMatches = groupMatches
                    .filter(m => m.group_id === group.id)
                    .sort((a, b) => a.round - b.round || a.match_number - b.match_number)
                  if (gMatches.length === 0) return null
                  return (
                    <div key={group.id} className="flex w-44 flex-col gap-3">
                      <div className="flex justify-center">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                          style={{ color: primaryColor, backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
                        >
                          {group.name}
                        </span>
                      </div>
                      {gMatches.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          participant1Name={match.participant1_id ? (participantNames[match.participant1_id] ?? 'Unknown') : 'TBD'}
                          participant2Name={match.participant2_id ? (participantNames[match.participant2_id] ?? 'Unknown') : 'TBD'}
                          primaryColor={primaryColor}
                          onClick={() => setSelectedGroupMatch(match)}
                        />
                      ))}
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {selectedGroupMatch && (
          <ScoreModal
            match={selectedGroupMatch}
            participant1Name={selectedGroupMatch.participant1_id ? (participantNames[selectedGroupMatch.participant1_id] ?? 'P1') : 'P1'}
            participant2Name={selectedGroupMatch.participant2_id ? (participantNames[selectedGroupMatch.participant2_id] ?? 'P2') : 'P2'}
            primaryColor={primaryColor}
            accentColor={accentColor}
            onClose={() => setSelectedGroupMatch(null)}
            onSaved={match => { onMatchUpdated(match); setSelectedGroupMatch(null) }}
          />
        )}
      </div>
    )
  }

  // ── Multi-stage: sub-tabs ─────────────────────────────────────────────────────

  const allGroupsDone = isGroupComplete(groupMatches)
  const hasKnockout = knockoutMatches.length > 0
  const showGenerateButton = isOwner && allGroupsDone && !hasKnockout

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--ui-tab-bg)', border: '1px solid var(--ui-card-border)' }}>
        {(['groups', 'knockout'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors"
            style={
              subTab === tab
                ? { backgroundColor: primaryColor, color: 'white' }
                : { color: 'var(--ui-text-muted)' }
            }
          >
            {tab === 'groups' ? 'Group Stage' : 'Knockout'}
          </button>
        ))}
      </div>

      {subTab === 'groups' && (
        <div className="flex flex-col gap-6">
          <GroupStandings
            groups={groups}
            participantIds={[]}
            participantNames={participantNames}
            groupParticipants={groupParticipants}
            matches={matches}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />

          {groupMatches.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max justify-center">
                {[...groups]
                  .sort((a, b) => a.order_index - b.order_index)
                  .map(group => {
                    const gMatches = groupMatches
                      .filter(m => m.group_id === group.id)
                      .sort((a, b) => a.round - b.round || a.match_number - b.match_number)
                    if (gMatches.length === 0) return null
                    return (
                      <div key={group.id} className="flex w-44 flex-col gap-3">
                        <div className="flex justify-center">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                            style={{ color: primaryColor, backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
                          >
                            {group.name}
                          </span>
                        </div>
                        {gMatches.map(match => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            participant1Name={match.participant1_id ? (participantNames[match.participant1_id] ?? 'Unknown') : 'TBD'}
                            participant2Name={match.participant2_id ? (participantNames[match.participant2_id] ?? 'Unknown') : 'TBD'}
                            primaryColor={primaryColor}
                            onClick={() => setSelectedGroupMatch(match)}
                          />
                        ))}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Generate Knockout — only shown to owner when all group matches are done */}
          {showGenerateButton && (
            <div
              className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-8 px-4 text-center"
              style={{ borderColor: `${primaryColor}60` }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--ui-text-primary)' }}>
                All group matches are complete!
              </p>
              <p className="text-xs" style={{ color: 'var(--ui-text-muted)' }}>
                Seed the knockout bracket from the group standings.
              </p>
              {knockoutError && (
                <p className="rounded-lg px-4 py-2 text-xs" style={{ backgroundColor: 'var(--ui-button-bg)', color: 'var(--ui-text-muted)' }}>
                  {knockoutError}
                </p>
              )}
              <button
                type="button"
                onClick={generateKnockout}
                disabled={generatingKnockout}
                className="mt-1 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {generatingKnockout ? 'Generating…' : 'Generate Knockout Bracket →'}
              </button>
            </div>
          )}
        </div>
      )}

      {subTab === 'knockout' && (
        <KnockoutBracket
          matches={matches}
          participantNames={participantNames}
          primaryColor={primaryColor}
          accentColor={accentColor}
          onMatchUpdated={onMatchUpdated}
        />
      )}

      {selectedGroupMatch && (
        <ScoreModal
          match={selectedGroupMatch}
          participant1Name={selectedGroupMatch.participant1_id ? (participantNames[selectedGroupMatch.participant1_id] ?? 'P1') : 'P1'}
          participant2Name={selectedGroupMatch.participant2_id ? (participantNames[selectedGroupMatch.participant2_id] ?? 'P2') : 'P2'}
          primaryColor={primaryColor}
          accentColor={accentColor}
          onClose={() => setSelectedGroupMatch(null)}
          onSaved={match => { onMatchUpdated(match); setSelectedGroupMatch(null) }}
        />
      )}
    </div>
  )
}

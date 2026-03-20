import { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Shuffle, Users, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ParticipantList } from './ParticipantList'
import { BracketPreview } from './BracketPreview'
import { GroupPreview } from './GroupPreview'
import { shuffleArray } from '@/lib/utils'
import type { WizardFormData, ParticipantEntry } from '@/lib/types'

export function WizardStep2() {
  const { watch, control } = useFormContext<WizardFormData>()
  const { replace, move } = useFieldArray({ control, name: 'participants' })

  const type = watch('type')
  const participantType = watch('participant_type')
  const participants = watch('participants') ?? []
  const numGroups = watch('num_groups')

  const isGroupBased = type === 'group_stage' || type === 'multi_stage'

  const [showFill, setShowFill] = useState(false)
  const [playerListText, setPlayerListText] = useState('')
  const [allExpanded, setAllExpanded] = useState(true)

  function handleShuffleTeams() {
    replace(shuffleArray<ParticipantEntry>(participants))
  }

  function handleShufflePlayers() {
    // Collect all non-empty player names across all teams, shuffle, redistribute evenly
    const allPlayers = participants.flatMap(t => (t.playerNames ?? []).filter(Boolean))
    const shuffled = shuffleArray<string>(allPlayers)
    // New IDs force React to remount SortableItems so uncontrolled inputs pick up new values
    const updated = participants.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      playerNames: ['', '', '', ''],
    }))
    shuffled.forEach((name, i) => {
      const teamIndex = i % updated.length
      const slot = updated[teamIndex].playerNames.findIndex(n => n === '')
      if (slot !== -1) updated[teamIndex].playerNames[slot] = name
    })
    replace(updated)
  }

  function handleFillPlayers() {
    const names = playerListText
      .split('\n')
      .map(n => n.trim())
      .filter(Boolean)

    if (names.length === 0 || participants.length === 0) {
      setShowFill(false)
      return
    }

    const updated = participants.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      playerNames: ['', '', '', ''],
    }))
    names.forEach((name, i) => {
      const teamIndex = i % updated.length
      const slot = updated[teamIndex].playerNames.findIndex(n => n === '')
      if (slot !== -1) updated[teamIndex].playerNames[slot] = name
    })

    replace(updated)
    setPlayerListText('')
    setShowFill(false)
  }

  const participantNames = participants.map(p => p.name)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {participantType === 'teams' ? 'Enter Teams & Players' : 'Enter Players'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag to reorder seeding. {participantType === 'teams' && 'Expand each team to add individual players.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {participantType === 'teams' ? (
            <>
              <Button variant="outline" size="sm" type="button" className="min-h-9" onClick={() => setAllExpanded(!allExpanded)}>
                {allExpanded ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                {allExpanded ? 'Collapse' : 'Expand'}
              </Button>
              <Button variant="outline" size="sm" type="button" className="min-h-9" onClick={() => setShowFill(true)}>
                <Users size={14} />
                Fill Players
              </Button>
              <Button variant="outline" size="sm" type="button" className="min-h-9" onClick={handleShufflePlayers}>
                <Shuffle size={14} />
                Shuffle Players
              </Button>
              <Button variant="outline" size="sm" type="button" className="min-h-9" onClick={handleShuffleTeams}>
                <Shuffle size={14} />
                Shuffle Teams
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" type="button" className="min-h-9" onClick={handleShuffleTeams}>
              <Shuffle size={14} />
              Shuffle
            </Button>
          )}
        </div>
      </div>

      {/* Fill Players modal */}
      {showFill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowFill(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-dark-600 dark:bg-dark-800"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Fill Players</h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              One player per line. They will be distributed evenly across {participants.length} teams.
            </p>
            <textarea
              autoFocus
              value={playerListText}
              onChange={e => setPlayerListText(e.target.value)}
              placeholder={'Alice\nBob\nCharlie\nDave'}
              rows={8}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowFill(false)}>
                Cancel
              </Button>
              <Button size="sm" type="button" onClick={handleFillPlayers}>
                Distribute
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Participant list */}
      <ParticipantList move={move} allExpanded={allExpanded} />

      {/* Live preview */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-dark-600">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Live Preview
        </p>
        {isGroupBased ? (
          <GroupPreview participants={participantNames} numGroups={numGroups ?? 2} />
        ) : (
          <BracketPreview participants={participantNames} />
        )}
      </div>
    </div>
  )
}

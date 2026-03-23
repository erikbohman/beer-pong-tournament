import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Match, ParticipantKind } from '@/lib/types'

interface ScoreModalProps {
  match: Match
  participant1Name: string
  participant2Name: string
  primaryColor: string
  accentColor: string
  skipCups?: boolean
  onClose: () => void
  onSaved: (updatedMatch: Match) => void
}

export function ScoreModal({
  match,
  participant1Name,
  participant2Name,
  primaryColor,
  accentColor,
  skipCups = false,
  onClose,
  onSaved,
}: ScoreModalProps) {
  const [winnerId, setWinnerId] = useState<string | null>(match.winner_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = !skipCups && winnerId ? 'cups' : 'winner'

  const loserName = winnerId === match.participant1_id ? participant2Name : participant1Name

  async function saveResult(selectedWinnerId: string, loserCups: number | null) {
    setSaving(true)
    setError(null)

    const winnerType: ParticipantKind | null = selectedWinnerId === match.participant1_id
      ? match.participant1_type
      : match.participant2_type

    const p1Cups = loserCups === null ? null : selectedWinnerId === match.participant1_id ? 0 : loserCups
    const p2Cups = loserCups === null ? null : selectedWinnerId === match.participant2_id ? 0 : loserCups

    const { data, error: updateErr } = await supabase
      .from('matches')
      .update({
        winner_id: selectedWinnerId,
        winner_type: winnerType,
        participant1_cups: p1Cups,
        participant2_cups: p2Cups,
      })
      .eq('id', match.id)
      .select()
      .single()

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    onSaved(data as Match)
    setSaving(false)
    onClose()
  }

  async function handleWinnerSelect(id: string) {
    if (skipCups) {
      await saveResult(id, null)
    } else {
      setWinnerId(id)
    }
  }

  async function handleCupsSelect(loserCups: number) {
    if (!winnerId) return
    await saveResult(winnerId, loserCups)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--ui-backdrop)' }} />
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl p-6 sm:rounded-2xl"
        style={{ backgroundColor: 'var(--ui-modal-bg)', border: '1px solid var(--ui-modal-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {step === 'winner' ? (
          <>
            <h3 className="mb-1 text-center text-lg font-medium" style={{ color: 'var(--ui-text-primary)' }}>Enter Result</h3>
            <p className="mb-5 text-center text-sm" style={{ color: 'var(--ui-text-muted)' }}>
              Tap the winner
            </p>

            <div className="mb-5 grid grid-cols-2 gap-3">
              {[
                { id: match.participant1_id, name: participant1Name },
                { id: match.participant2_id, name: participant2Name },
              ].map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleWinnerSelect(id)}
                  className="flex flex-col items-center justify-center rounded-xl p-5 transition-all active:scale-95"
                  style={{
                    backgroundColor: 'var(--ui-button-bg)',
                    border: '2px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = primaryColor)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <span className="text-center text-sm font-medium" style={{ color: 'var(--ui-text-primary)' }}>{name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--ui-button-bg)', color: 'var(--ui-text-muted)' }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setWinnerId(null); setError(null) }}
                className="rounded-lg p-1 transition-opacity hover:opacity-100"
                style={{ color: 'var(--ui-text-faint)', opacity: 0.7 }}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 text-center">
                <h3 className="text-lg font-medium" style={{ color: 'var(--ui-text-primary)' }}>Cups left</h3>
                <p className="text-sm" style={{ color: 'var(--ui-text-muted)' }}>
                  for {loserName}
                </p>
              </div>
              <div className="w-7" />
            </div>

            <div className="mb-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                const savedCups = winnerId === match.participant1_id
                  ? match.participant2_cups
                  : match.participant1_cups
                const isCurrent = savedCups === n
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={saving}
                    onClick={() => handleCupsSelect(n)}
                    className="flex h-14 items-center justify-center rounded-xl text-lg font-medium transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: isCurrent ? accentColor : 'var(--ui-button-bg)',
                      border: isCurrent ? `2px solid ${accentColor}` : '2px solid transparent',
                      color: isCurrent ? '#ffffff' : 'var(--ui-text-primary)',
                    }}
                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = `${accentColor}50` }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--ui-button-bg)' }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>

            {error && (
              <p className="mb-3 rounded-lg p-2 text-center text-sm" style={{ backgroundColor: 'var(--ui-button-bg)', color: 'var(--ui-text-muted)' }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--ui-button-bg)', color: 'var(--ui-text-muted)' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

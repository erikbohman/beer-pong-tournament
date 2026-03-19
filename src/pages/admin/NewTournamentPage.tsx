import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WizardStep1 } from '@/components/wizard/WizardStep1'
import { WizardStep2 } from '@/components/wizard/WizardStep2'
import { useThemes } from '@/hooks/useThemes'
import { useRules } from '@/hooks/useRules'
import { supabase } from '@/lib/supabase'
import { localId } from '@/lib/utils'
import {
  generateSingleEliminationMatches,
  generateRoundRobinMatches,
  distributeIntoGroups,
} from '@/lib/bracketUtils'
import type { WizardFormData, ParticipantEntry } from '@/lib/types'

// ─── Validation Schema ────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(1, 'Tournament name is required').max(80),
  participant_type: z.enum(['players', 'teams']),
  type: z.enum(['single_elimination', 'group_stage', 'multi_stage']),
  num_participants: z.number().int().min(2, 'At least 2 participants').max(128),
  num_groups: z.number().int().min(0).default(0),
  players_advancing_per_group: z.number().int().min(0).default(0),
  theme_id: z.string().default(''),
  rules_id: z.string().default(''),
  start_date: z.string().default(''),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    playerNames: z.array(z.string()).default([]),
  })).default([]),
}).refine(data => {
  if (data.type !== 'single_elimination') {
    return data.num_groups >= 2
  }
  return true
}, { message: 'At least 2 groups required', path: ['num_groups'] })

// ─── Component ────────────────────────────────────────────────────────────────

export function NewTournamentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { themes } = useThemes()
  const { rules } = useRules()
  const [step, setStep] = useState(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const methods = useForm<WizardFormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      participant_type: 'players',
      type: 'single_elimination',
      num_participants: 8,
      num_groups: 2,
      players_advancing_per_group: 2,
      theme_id: '',
      rules_id: '',
      start_date: '',
      participants: [],
    },
  })

  const { trigger, getValues, setValue } = methods

  async function handleNextStep() {
    const valid = await trigger(['name', 'participant_type', 'type', 'num_participants', 'num_groups'])
    if (!valid) return

    // Initialize participant slots if moving to step 2
    const count = getValues('num_participants')
    const existing = getValues('participants')
    if (existing.length !== count) {
      const slots: ParticipantEntry[] = Array.from({ length: count }, (_, i) => ({
        id: existing[i]?.id ?? localId(),
        name: existing[i]?.name ?? '',
        playerNames: existing[i]?.playerNames ?? [],
      }))
      setValue('participants', slots)
    }

    setStep(2)
  }

  async function handleSubmit() {
    setSubmitError(null)
    setSubmitting(true)

    const data = getValues()
    let tournamentId: string | null = null

    try {
      const participantKind = data.participant_type === 'teams' ? 'team' : 'player'

      // 1. Insert tournament
      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .insert({
          name: data.name,
          type: data.type,
          participant_type: data.participant_type,
          status: 'draft',
          theme_id: data.theme_id || null,
          rules_id: data.rules_id || null,
          start_date: data.start_date || null,
          num_participants: data.num_participants,
          num_groups: data.type !== 'single_elimination' ? data.num_groups : null,
          players_per_group: data.type !== 'single_elimination' && data.num_groups > 0
            ? Math.ceil(data.num_participants / data.num_groups)
            : null,
          players_advancing_per_group: data.type === 'multi_stage' ? data.players_advancing_per_group : null,
          created_by: user!.id,
        })
        .select()
        .single()

      if (tErr) throw new Error(tErr.message)
      tournamentId = tournament.id

      const isGroupBased = data.type === 'group_stage' || data.type === 'multi_stage'

      // 2. Insert groups if needed
      let groupIds: string[] = []
      if (isGroupBased && data.num_groups >= 2) {
        const groupInserts = Array.from({ length: data.num_groups }, (_, i) => ({
          tournament_id: tournamentId!,
          name: `Group ${String.fromCharCode(65 + i)}`,
          order_index: i,
        }))
        const { data: groups, error: gErr } = await supabase
          .from('groups')
          .insert(groupInserts)
          .select()
        if (gErr) throw new Error(gErr.message)
        groupIds = groups.map(g => g.id)
      }

      // 3. Distribute participants into groups
      const participantGroupMap: Record<number, string> = {}
      if (isGroupBased && groupIds.length > 0) {
        const distribution = distributeIntoGroups(
          data.participants.map((_, i) => String(i)),
          data.num_groups
        )
        distribution.forEach((indices, gi) => {
          indices.forEach(idx => {
            participantGroupMap[Number(idx)] = groupIds[gi]
          })
        })
      }

      // 4. Insert teams or players
      let participantIds: string[] = []

      if (data.participant_type === 'teams') {
        const teamInserts = data.participants.map((p, i) => ({
          tournament_id: tournamentId!,
          name: p.name || `Team ${i + 1}`,
          seed_order: i,
          group_id: participantGroupMap[i] ?? null,
        }))
        const { data: teams, error: teErr } = await supabase
          .from('teams')
          .insert(teamInserts)
          .select()
        if (teErr) throw new Error(teErr.message)

        participantIds = teams.map(t => t.id)

        // Insert players within teams
        const playerInserts = data.participants.flatMap((p, i) =>
          (p.playerNames ?? [])
            .filter(name => name.trim())
            .map(name => ({
              tournament_id: tournamentId!,
              team_id: teams[i].id,
              name,
              seed_order: 0,
              group_id: participantGroupMap[i] ?? null,
            }))
        )
        if (playerInserts.length > 0) {
          const { error: plErr } = await supabase.from('players').insert(playerInserts)
          if (plErr) throw new Error(plErr.message)
        }
      } else {
        const playerInserts = data.participants.map((p, i) => ({
          tournament_id: tournamentId!,
          name: p.name || `Player ${i + 1}`,
          seed_order: i,
          group_id: participantGroupMap[i] ?? null,
        }))
        const { data: players, error: plErr } = await supabase
          .from('players')
          .insert(playerInserts)
          .select()
        if (plErr) throw new Error(plErr.message)
        participantIds = players.map(p => p.id)
      }

      // 5. Generate matches
      let matchInserts: ReturnType<typeof generateSingleEliminationMatches> = []

      if (data.type === 'single_elimination') {
        matchInserts = generateSingleEliminationMatches(
          tournamentId!,
          participantIds,
          participantKind
        )
      } else {
        // Group stage: round-robin per group
        let matchNumOffset = 1
        const distribution = distributeIntoGroups(
          participantIds.map((_, i) => String(i)),
          data.num_groups
        )
        distribution.forEach((indices, gi) => {
          const groupParticipantIds = indices.map(idx => participantIds[Number(idx)])
          const groupMatches = generateRoundRobinMatches(
            tournamentId!,
            groupIds[gi],
            groupParticipantIds,
            participantKind,
            matchNumOffset
          )
          matchInserts.push(...groupMatches)
          matchNumOffset += groupMatches.length
        })

        // Multi-stage: placeholder knockout matches generated after group stage completes
      }

      if (matchInserts.length > 0) {
        const { error: mErr } = await supabase.from('matches').insert(matchInserts)
        if (mErr) throw new Error(mErr.message)
      }

      navigate('/admin/tournaments')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setSubmitError(message)

      // Rollback: delete tournament (cascade handles rest)
      if (tournamentId) {
        await supabase.from('tournaments').delete().eq('id', tournamentId)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-4">
        {[
          { n: 1, label: 'Tournament Setup' },
          { n: 2, label: 'Participants & Seeding' },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === n
                  ? 'bg-orange-500 text-white'
                  : step > n
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500 dark:bg-dark-600 dark:text-gray-400'
              }`}
            >
              {n}
            </div>
            <span
              className={`text-sm ${
                step === n
                  ? 'font-semibold text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label}
            </span>
            {n < 2 && (
              <div className="mx-2 h-px w-12 bg-gray-200 dark:bg-dark-600" />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-dark-600 dark:bg-dark-800">
        <FormProvider {...methods}>
          {step === 1 && <WizardStep1 themes={themes} rules={rules} />}
          {step === 2 && <WizardStep2 />}
        </FormProvider>

        {submitError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {submitError}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6 dark:border-dark-700">
          {step === 1 ? (
            <div />
          ) : (
            <Button variant="outline" onClick={() => setStep(1)} type="button">
              <ChevronLeft size={16} />
              Back
            </Button>
          )}

          {step === 1 ? (
            <Button onClick={handleNextStep} type="button">
              Next
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Tournament'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

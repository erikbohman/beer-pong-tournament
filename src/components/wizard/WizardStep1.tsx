import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { WizardFormData } from '@/lib/types'
import type { Theme } from '@/lib/types'

interface WizardStep1Props {
  themes: Theme[]
}

export function WizardStep1({ themes }: WizardStep1Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormData>()

  const type = watch('type')
  const numParticipants = watch('num_participants')
  const numGroups = watch('num_groups')
  const playersAdvancing = watch('players_advancing_per_group')

  const isGroupBased = type === 'group_stage' || type === 'multi_stage'
  const playersPerGroup = numGroups > 0 ? Math.ceil(numParticipants / numGroups) : 0
  const unevenWarning =
    isGroupBased && numGroups > 0 && numParticipants % numGroups !== 0
      ? `${numParticipants} participants doesn't divide evenly into ${numGroups} groups — some groups will have ${playersPerGroup - 1} participants.`
      : null

  const knockoutCount = type === 'multi_stage' && numGroups > 0 && playersAdvancing > 0
    ? numGroups * playersAdvancing
    : null

  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Tournament Name"
        placeholder="e.g. Summer Cup 2025"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Participant Type"
          error={errors.participant_type?.message}
          {...register('participant_type')}
        >
          <option value="players">Players (individuals)</option>
          <option value="teams">Teams</option>
        </Select>

        <Select
          label="Tournament Type"
          error={errors.type?.message}
          {...register('type')}
        >
          <option value="single_elimination">Single Elimination</option>
          <option value="group_stage">Group Stage</option>
          <option value="multi_stage">Multi-Stage</option>
        </Select>
      </div>

      <Input
        label="Total Participants"
        type="number"
        min={2}
        max={128}
        error={errors.num_participants?.message}
        hint={type === 'single_elimination' ? 'Will be padded to next power of 2 for the bracket.' : undefined}
        {...register('num_participants', { valueAsNumber: true })}
      />

      {isGroupBased && (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-dark-600">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Group Configuration</p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of Groups"
              type="number"
              min={2}
              max={32}
              error={errors.num_groups?.message}
              {...register('num_groups', { valueAsNumber: true })}
            />
            <div className="flex flex-col gap-1">
              <Label>Players per Group</Label>
              <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-400">
                {numGroups > 0 ? `~${playersPerGroup}` : '—'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Auto-calculated</p>
            </div>
          </div>

          {unevenWarning && (
            <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              {unevenWarning}
            </p>
          )}

          {type === 'multi_stage' && (
            <div>
              <Input
                label="Players Advancing per Group"
                type="number"
                min={1}
                hint={
                  knockoutCount
                    ? `→ ${knockoutCount} players enter the knockout stage`
                    : 'Enter number of groups first'
                }
                error={errors.players_advancing_per_group?.message}
                {...register('players_advancing_per_group', { valueAsNumber: true })}
              />
            </div>
          )}
        </div>
      )}

      <Select
        label="Theme (optional)"
        placeholder="No theme selected"
        {...register('theme_id')}
      >
        {themes.map(t => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>

      <Input
        label="Start Date (optional)"
        type="date"
        {...register('start_date')}
      />
    </div>
  )
}

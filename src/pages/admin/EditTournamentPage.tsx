import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useThemes } from '@/hooks/useThemes'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import type { Tournament } from '@/lib/types'

const schema = z.object({
  name: z.string().min(1, 'Name required').max(80),
  slug: z.string().max(60).regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers and hyphens').default(''),
  theme_id: z.string().default(''),
  start_date: z.string().default(''),
})

type FormData = z.infer<typeof schema>

export function EditTournamentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { themes } = useThemes()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const slugValue = useWatch({ control, name: 'slug' })

  useEffect(() => {
    if (!id) return
    supabase.from('tournaments').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data.created_by !== user?.id) {
        navigate('/admin/tournaments', { replace: true })
        return
      }
      setTournament(data)
      reset({
        name: data.name,
        slug: data.slug ?? '',
        theme_id: data.theme_id ?? '',
        start_date: data.start_date ?? '',
      })
      setLoading(false)
    })
  }, [id, reset, user, navigate])

  async function onSubmit(data: FormData) {
    if (!id) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('tournaments')
      .update({
        name: data.name,
        slug: data.slug || null,
        theme_id: data.theme_id || null,
        start_date: data.start_date || null,
      })
      .eq('id', id)

    if (error) setError(error.message)
    else navigate('/admin/tournaments')
    setSaving(false)
  }

  if (loading) return (
    <div className="flex h-48 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (!tournament) return (
    <p className="text-red-500">Tournament not found.</p>
  )

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Tournament</h2>
        {tournament.status === 'published' && (
          <Badge variant="warning">Published — changes are live</Badge>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-8 dark:border-dark-600 dark:bg-dark-800"
      >
        <Input label="Tournament Name" error={errors.name?.message} {...register('name')} />

        <Input
          label="Custom URL (optional)"
          placeholder="e.g. summer-cup-2025"
          hint={slugValue ? `beer-pong.se/tournament/${slugValue}` : `beer-pong.se/tournament/${tournament?.id}`}
          error={errors.slug?.message}
          {...register('slug')}
        />

        <Select label="Theme (optional)" placeholder="No theme" {...register('theme_id')}>
          {themes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>

        <Input label="Start Date (optional)" type="date" {...register('start_date')} />

        {/* Read-only info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-dark-700 dark:bg-dark-700/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Tournament Info (read-only)</p>
          <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
            <span>Type:</span>
            <span className="font-medium capitalize">{tournament.type.replace(/_/g, ' ')}</span>
            <span>Participants:</span>
            <span className="font-medium">{tournament.num_participants} {tournament.participant_type}</span>
            <span>Status:</span>
            <Badge variant={tournament.status === 'published' ? 'success' : 'default'} className="w-fit">
              {tournament.status}
            </Badge>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-dark-700">
          <Button variant="outline" type="button" onClick={() => navigate('/admin/tournaments')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

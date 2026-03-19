import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tournament } from '@/lib/types'

export function useTournaments(userId?: string) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournaments = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('created_by', userId)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setTournaments(data ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  async function deleteTournament(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) return { error: error.message }
    setTournaments(prev => prev.filter(t => t.id !== id))
    return { error: null }
  }

  async function togglePublish(id: string, currentStatus: string): Promise<{ error: string | null }> {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    const { error } = await supabase
      .from('tournaments')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) return { error: error.message }
    setTournaments(prev =>
      prev.map(t => t.id === id ? { ...t, status: newStatus as Tournament['status'] } : t)
    )
    return { error: null }
  }

  return { tournaments, loading, error, refetch: fetchTournaments, deleteTournament, togglePublish }
}

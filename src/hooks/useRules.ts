import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Rules } from '@/lib/types'

export function useRules() {
  const [rules, setRules] = useState<Rules[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setRules(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  async function deleteRules(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('rules').delete().eq('id', id)
    if (error) return { error: error.message }
    setRules(prev => prev.filter(r => r.id !== id))
    return { error: null }
  }

  async function upsertRules(item: Partial<Rules> & { name: string; content: string }): Promise<{ data: Rules | null; error: string | null }> {
    if (item.id) {
      const { id, ...fields } = item
      const { data, error } = await supabase
        .from('rules')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) return { data: null, error: error.message }
      await fetchRules()
      return { data, error: null }
    }

    const { data, error } = await supabase
      .from('rules')
      .insert(item)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    await fetchRules()
    return { data, error: null }
  }

  return { rules, loading, error, refetch: fetchRules, deleteRules, upsertRules }
}

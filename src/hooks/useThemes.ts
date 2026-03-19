import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Theme } from '@/lib/types'

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchThemes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setThemes(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchThemes()
  }, [fetchThemes])

  async function deleteTheme(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('themes').delete().eq('id', id)
    if (error) return { error: error.message }
    setThemes(prev => prev.filter(t => t.id !== id))
    return { error: null }
  }

  async function upsertTheme(theme: Partial<Theme> & { name: string }): Promise<{ data: Theme | null; error: string | null }> {
    if (theme.id) {
      const { id, ...fields } = theme
      const { data, error } = await supabase
        .from('themes')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) return { data: null, error: error.message }
      await fetchThemes()
      return { data, error: null }
    }

    const { data, error } = await supabase
      .from('themes')
      .insert(theme)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    await fetchThemes()
    return { data, error: null }
  }

  return { themes, loading, error, refetch: fetchThemes, deleteTheme, upsertTheme }
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { TournamentThemeProvider, TournamentBgImage } from '@/components/tournament/TournamentThemeProvider'
import { BracketView } from '@/components/tournament/BracketView'
import { ParticipantsTab } from '@/components/tournament/ParticipantsTab'
import { RulesTab } from '@/components/tournament/RulesTab'
import { Spinner } from '@/components/ui/Spinner'
import type { Tournament, Theme, Team, Player, Match, Group, Rules } from '@/lib/types'

type Tab = 'participants' | 'bracket' | 'rules'

export function TournamentPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [rules, setRules] = useState<Rules | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('bracket')

  useEffect(() => {
    if (!id) return
    loadTournament()
  }, [id])

  // Realtime subscription for match updates
  useEffect(() => {
    const tid = tournament?.id
    if (!tid) return
    const channel = supabase
      .channel(`tournament-matches:${tid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tid}` },
        payload => {
          setMatches(prev =>
            prev.map(m => (m.id === (payload.new as Match).id ? (payload.new as Match) : m))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournament?.id])

  // Realtime subscription for theme updates
  useEffect(() => {
    if (!tournament?.theme_id) return
    const channel = supabase
      .channel(`tournament-theme:${tournament.theme_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'themes', filter: `id=eq.${tournament.theme_id}` },
        payload => setTheme(payload.new as Theme)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournament?.theme_id])

  async function loadTournament() {
    setLoading(true)
    // Try slug first, fall back to UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!)
    const query = supabase.from('tournaments').select('*').eq('status', 'published')
    const { data: t } = isUuid
      ? await query.eq('id', id!).maybeSingle()
      : await query.eq('slug', id!).maybeSingle()

    if (!t) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setTournament(t)

    const tid = t.id // always the UUID, regardless of whether we loaded by slug or id

    // Load everything in parallel
    const [themeRes, rulesRes, teamsRes, playersRes, groupsRes, matchesRes] = await Promise.all([
      t.theme_id ? supabase.from('themes').select('*').eq('id', t.theme_id).single() : Promise.resolve({ data: null }),
      t.rules_id ? supabase.from('rules').select('*').eq('id', t.rules_id).single() : Promise.resolve({ data: null }),
      supabase.from('teams').select('*').eq('tournament_id', tid),
      supabase.from('players').select('*').eq('tournament_id', tid),
      supabase.from('groups').select('*').eq('tournament_id', tid).order('order_index'),
      supabase.from('matches').select('*').eq('tournament_id', tid).order('round').order('match_number'),
    ])

    setTheme(themeRes.data ?? null)
    setRules(rulesRes.data ?? null)
    setTeams(teamsRes.data ?? [])
    setPlayers(playersRes.data ?? [])
    setGroups(groupsRes.data ?? [])
    setMatches(matchesRes.data ?? [])
    setLoading(false)
  }

  function handleMatchUpdated(updated: Match) {
    setMatches(prev => prev.map(m => (m.id === updated.id ? updated : m)))
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const primaryColor = theme?.primary_color ?? '#f97316'
  const accentColor = theme?.accent_color ?? '#fbbf24'

  // Map participant IDs to names
  const participantNames: Record<string, string> = {}
  teams.forEach(t => { participantNames[t.id] = t.name })
  players.forEach(p => { participantNames[p.id] = p.name })

  // Team → players map
  const teamPlayers: Record<string, Player[]> = {}
  players.forEach(p => {
    if (p.team_id) {
      if (!teamPlayers[p.team_id]) teamPlayers[p.team_id] = []
      teamPlayers[p.team_id].push(p)
    }
  })

  // Group → participant IDs
  const groupParticipants: Record<string, string[]> = {}
  const allParticipants = tournament?.participant_type === 'teams' ? teams : players
  allParticipants.forEach(p => {
    if (p.group_id) {
      if (!groupParticipants[p.group_id]) groupParticipants[p.group_id] = []
      groupParticipants[p.group_id].push(p.id)
    }
  })

  const tabs: { key: Tab; label: string; mobileOnly?: boolean }[] = [
    { key: 'participants', label: 'Participants', mobileOnly: true },
    { key: 'bracket', label: 'Bracket & Scores' },
    ...(rules ? [{ key: 'rules' as Tab, label: 'Rules' }] : []),
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound || !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-2xl font-medium text-white">Tournament not found</p>
          <p className="mt-2 text-sm text-gray-400">This tournament may not be published yet.</p>
        </div>
      </div>
    )
  }

  return (
    <TournamentThemeProvider theme={theme}>
      <div className="flex min-h-dvh flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10" style={{ backgroundColor: theme?.background_color ?? '#111827', borderBottom: '1px solid var(--ui-divider)' }}>
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="flex items-center gap-3 justify-center">
              {theme?.logo_url && (
                <img src={theme.logo_url} alt="Logo" className="h-8 w-8 rounded object-contain" />
              )}
              <h1
                className="text-xl font-semibold truncate"
                style={{ color: primaryColor }}
              >
                {tournament.name}
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="mx-auto max-w-5xl px-4 pb-3">
            <div className="flex gap-1 rounded-xl p-1 w-fit mx-auto" style={{ backgroundColor: 'var(--ui-tab-bg)', border: '1px solid var(--ui-card-border)' }}>
              {tabs.map(({ key, label, mobileOnly }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors${mobileOnly ? ' sm:hidden' : ''}`}
                  style={
                    tab === key
                      ? { backgroundColor: primaryColor, color: 'white' }
                      : { color: 'var(--ui-text-muted)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content — background image starts here, below the header */}
        <TournamentBgImage theme={theme}>
          <main className="mx-auto max-w-5xl px-4 py-6">
            {tab === 'participants' && (
              <ParticipantsTab
                participantType={tournament.participant_type === 'teams' ? 'teams' : 'players'}
                players={players}
                teams={teams}
                teamPlayers={teamPlayers}
                primaryColor={primaryColor}
              />
            )}

            {tab === 'bracket' && (
              <BracketView
                tournament={tournament}
                groups={groups}
                matches={matches}
                participantNames={participantNames}
                groupParticipants={groupParticipants}
                primaryColor={primaryColor}
                accentColor={accentColor}
                onMatchUpdated={handleMatchUpdated}
                isOwner={!!user && user.id === tournament.created_by}
                onMatchesAdded={newMatches => setMatches(prev => [...prev, ...newMatches])}
                players={players}
                teams={teams}
              />
            )}

            {tab === 'rules' && rules && (
              <RulesTab rules={rules} primaryColor={primaryColor} />
            )}
          </main>
        </TournamentBgImage>
      </div>
    </TournamentThemeProvider>
  )
}

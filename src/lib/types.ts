// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type TournamentType = 'single_elimination' | 'group_stage' | 'multi_stage'
export type ParticipantType = 'players' | 'teams'
export type TournamentStatus = 'draft' | 'published'
export type MatchStage = 'group' | 'knockout'
export type ParticipantKind = 'team' | 'player'

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Rules {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface Theme {
  id: string
  name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  background_image_url: string | null
  logo_url: string | null
  font_style: string
  ui_mode: 'dark' | 'light'
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  type: TournamentType
  participant_type: ParticipantType
  status: TournamentStatus
  theme_id: string | null
  rules_id: string | null
  start_date: string | null
  num_participants: number
  num_groups: number | null
  players_per_group: number | null
  players_advancing_per_group: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  tournament_id: string
  name: string
  order_index: number
  created_at: string
}

export interface Team {
  id: string
  tournament_id: string
  name: string
  seed_order: number
  group_id: string | null
  created_at: string
}

export interface Player {
  id: string
  tournament_id: string
  team_id: string | null
  name: string
  seed_order: number
  group_id: string | null
  created_at: string
}

export interface Match {
  id: string
  tournament_id: string
  stage: MatchStage
  round: number
  match_number: number
  group_id: string | null
  participant1_id: string | null
  participant2_id: string | null
  participant1_type: ParticipantKind | null
  participant2_type: ParticipantKind | null
  winner_id: string | null
  winner_type: ParticipantKind | null
  participant1_cups: number | null
  participant2_cups: number | null
  created_at: string
  updated_at: string
}

// ─── Wizard / Form Types ──────────────────────────────────────────────────────

export interface ParticipantEntry {
  id: string           // local temp UUID for dnd-kit keying
  name: string
  playerNames: string[] // team player names; empty array when participant_type = 'players'
}

export interface WizardFormData {
  name: string
  participant_type: ParticipantType
  type: TournamentType
  num_participants: number
  num_groups: number
  players_advancing_per_group: number
  theme_id: string
  rules_id: string
  start_date: string

  participants: ParticipantEntry[]
}

// ─── Standings ────────────────────────────────────────────────────────────────

export interface Standing {
  participantId: string
  participantName: string
  played: number
  wins: number
  losses: number
  cupsFor: number
  cupsAgainst: number
  diff: number
}

// ─── Extended / Joined Types ──────────────────────────────────────────────────

export interface TournamentWithTheme extends Tournament {
  theme: Theme | null
}

export interface TeamWithPlayers extends Team {
  players: Player[]
}

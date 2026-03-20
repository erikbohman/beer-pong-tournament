import { nextPowerOf2 } from './utils'
import type { Match, ParticipantKind } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchInsert {
  tournament_id: string
  stage: 'group' | 'knockout'
  round: number
  match_number: number
  group_id: string | null
  participant1_id: string | null
  participant2_id: string | null
  participant1_type: ParticipantKind | null
  participant2_type: ParticipantKind | null
  winner_id: string | null
  winner_type: ParticipantKind | null
}

// ─── Seeding Helpers ──────────────────────────────────────────────────────────

/**
 * Builds interleaved bracket seed slots for a bracket of `size` (must be power of 2).
 * Returns pairs like [[1,8],[5,4],[3,6],[7,2]] for size=8.
 */
function buildSeedPairs(size: number): [number, number][] {
  let slots: number[] = [1, 2]
  while (slots.length < size) {
    const total = slots.length * 2 + 1
    slots = slots.flatMap(s => [s, total - s])
  }
  const pairs: [number, number][] = []
  for (let i = 0; i < slots.length; i += 2) {
    pairs.push([slots[i], slots[i + 1]])
  }
  return pairs
}

// ─── Single Elimination Match Generation ─────────────────────────────────────

/**
 * Generates all Round 1 matches for a single-elimination bracket.
 * Pads to next power of 2; extra slots are byes (winner = participant1).
 *
 * @param tournamentId  DB tournament ID
 * @param participantIds  Ordered array of participant IDs (index 0 = seed 1)
 * @param participantType  'team' | 'player'
 */
export function generateSingleEliminationMatches(
  tournamentId: string,
  participantIds: string[],
  participantType: ParticipantKind,
): MatchInsert[] {
  const n = participantIds.length
  const size = nextPowerOf2(n)
  const pairs = buildSeedPairs(size)

  const matches: MatchInsert[] = []

  pairs.forEach(([seed1, seed2], idx) => {
    const p1 = participantIds[seed1 - 1] ?? null
    const p2 = participantIds[seed2 - 1] ?? null
    const isBye = p2 === null

    matches.push({
      tournament_id: tournamentId,
      stage: 'knockout',
      round: 1,
      match_number: idx + 1,
      group_id: null,
      participant1_id: p1,
      participant2_id: isBye ? null : p2,
      participant1_type: p1 ? participantType : null,
      participant2_type: isBye ? null : participantType,
      // Auto-resolve byes
      winner_id: isBye ? p1 : null,
      winner_type: isBye ? participantType : null,
    })
  })

  // Generate empty placeholder matches for subsequent rounds
  const totalRounds = Math.log2(size)
  let matchNum = pairs.length + 1

  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = size / Math.pow(2, round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        tournament_id: tournamentId,
        stage: 'knockout',
        round,
        match_number: matchNum++,
        group_id: null,
        participant1_id: null,
        participant2_id: null,
        participant1_type: null,
        participant2_type: null,
        winner_id: null,
        winner_type: null,
      })
    }
  }

  // Auto-advance BYE winners into next-round slots
  const r1Matches = matches.filter(m => m.round === 1)
  const r2Matches = matches.filter(m => m.round === 2)

  r1Matches.forEach((m, idx) => {
    if (m.winner_id && !m.participant2_id) {
      // This is a BYE — advance the winner to round 2
      const nextMatchIndex = Math.floor(idx / 2)
      const slot = idx % 2 === 0 ? 1 : 2
      const nextMatch = r2Matches[nextMatchIndex]
      if (nextMatch) {
        if (slot === 1) {
          nextMatch.participant1_id = m.winner_id
          nextMatch.participant1_type = m.winner_type
        } else {
          nextMatch.participant2_id = m.winner_id
          nextMatch.participant2_type = m.winner_type
        }
      }
    }
  })

  return matches
}

// ─── Round-Robin Match Generation ────────────────────────────────────────────

/**
 * Generates all round-robin matches for a single group using the circle method.
 */
export function generateRoundRobinMatches(
  tournamentId: string,
  groupId: string,
  participantIds: string[],
  participantType: ParticipantKind,
  matchNumberOffset: number,
): MatchInsert[] {
  const ids = [...participantIds]
  if (ids.length % 2 !== 0) ids.push('__bye__')

  const half = ids.length / 2
  const matches: MatchInsert[] = []
  let matchNum = matchNumberOffset

  for (let round = 0; round < ids.length - 1; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = ids[i]
      const p2 = ids[ids.length - 1 - i]
      if (p1 !== '__bye__' && p2 !== '__bye__') {
        matches.push({
          tournament_id: tournamentId,
          stage: 'group',
          round: round + 1,
          match_number: matchNum++,
          group_id: groupId,
          participant1_id: p1,
          participant2_id: p2,
          participant1_type: participantType,
          participant2_type: participantType,
          winner_id: null,
          winner_type: null,
        })
      }
    }
    // Rotate: keep index 0 fixed, rotate the rest
    ids.splice(1, 0, ids.pop()!)
  }

  return matches
}

// ─── Auto-Advance Winner ──────────────────────────────────────────────────────

/**
 * After a knockout match is completed, finds the next-round match and
 * returns an update object: which match ID to update and which slot to fill.
 *
 * Match numbering scheme:
 *   Round 1: matches 1...(bracketSize/2)
 *   Round 2: next (bracketSize/4) matches, etc.
 *
 * The winner of match N in round R goes to the match in round R+1 that covers
 * the same "half" of the bracket. Index within round determines slot (odd = p1, even = p2).
 */
export function getNextRoundMatchInfo(
  completedMatch: Match,
  allMatches: Match[],
): { matchId: string; slot: 1 | 2 } | null {
  if (completedMatch.stage !== 'knockout') return null

  const round = completedMatch.round

  // Find all matches in the current round to determine offset
  const currentRoundMatches = allMatches
    .filter(m => m.stage === 'knockout' && m.round === round)
    .sort((a, b) => a.match_number - b.match_number)

  const indexInRound = currentRoundMatches.findIndex(m => m.id === completedMatch.id)
  if (indexInRound === -1) return null

  const nextRound = round + 1
  const nextRoundMatches = allMatches
    .filter(m => m.stage === 'knockout' && m.round === nextRound)
    .sort((a, b) => a.match_number - b.match_number)

  if (nextRoundMatches.length === 0) return null

  const nextMatchIndex = Math.floor(indexInRound / 2)
  const slot: 1 | 2 = indexInRound % 2 === 0 ? 1 : 2

  const nextMatch = nextRoundMatches[nextMatchIndex]
  if (!nextMatch) return null

  return { matchId: nextMatch.id, slot }
}

// ─── Cross-Group Seeding for Multi-Stage ─────────────────────────────────────

/**
 * Produces a snake-seeded knockout order from group results.
 * groups: array of arrays of participant IDs, already ranked (index 0 = rank 1).
 * advancingPerGroup: how many from each group advance.
 *
 * Pattern: [A1, B2, C1, D2, A2, B1, C2, D1] for 4 groups, 2 advancing each.
 * This ensures group-mates can only meet in the final.
 */
export function crossGroupSeedOrder(
  groups: string[][],
  advancingPerGroup: number,
): string[] {
  const result: string[] = []
  for (let rank = 0; rank < advancingPerGroup; rank++) {
    if (rank % 2 === 0) {
      // Forward pass: A, B, C, D...
      for (let g = 0; g < groups.length; g++) {
        if (groups[g][rank]) result.push(groups[g][rank])
      }
    } else {
      // Reverse pass: D, C, B, A...
      for (let g = groups.length - 1; g >= 0; g--) {
        if (groups[g][rank]) result.push(groups[g][rank])
      }
    }
  }
  return result
}

// ─── Group Distribution (snake draft) ────────────────────────────────────────

/**
 * Distributes participant IDs across groups using a snake draft.
 * Returns an array of groups, each group being an array of participant IDs.
 */
export function distributeIntoGroups(
  participantIds: string[],
  numGroups: number,
): string[][] {
  const groups: string[][] = Array.from({ length: numGroups }, () => [])
  participantIds.forEach((id, idx) => {
    const pass = Math.floor(idx / numGroups)
    const groupIdx = pass % 2 === 0 ? idx % numGroups : numGroups - 1 - (idx % numGroups)
    groups[groupIdx].push(id)
  })
  return groups
}

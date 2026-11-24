import type { Division, LeagueData, Team } from './types'

export type StandingRow = {
  team: Team
  wins: number
  losses: number
  rounds_for: number
  rounds_against: number
  round_diff: number
  forfeits: number
  inactive: boolean
  place: number | null
}

/** Same order the public.standings view uses: wins, round difference, rounds for, name. */
export function standingsFor(data: LeagueData, divisionId: string): StandingRow[] {
  const regs = data.registrations.filter(
    (r) => r.division_id === divisionId && r.status === 'approved',
  )
  const matches = data.matches.filter(
    (m) => m.division_id === divisionId && m.stage === 'regular' && (m.status === 'completed' || m.status === 'forfeit'),
  )
  const rows: StandingRow[] = regs.map((reg) => {
    const team = data.teams.find((t) => t.id === reg.team_id)
    if (!team) throw new Error('Registration points at a missing coven')
    let wins = 0
    let losses = 0
    let rounds_for = 0
    let rounds_against = 0
    for (const match of matches) {
      const side =
        match.home_team_id === team.id ? 'home' : match.away_team_id === team.id ? 'away' : null
      if (!side) continue
      if (match.winner_team_id === team.id) wins += 1
      else if (match.winner_team_id) losses += 1
      if (side === 'home') {
        rounds_for += match.home_rounds ?? 0
        rounds_against += match.away_rounds ?? 0
      } else {
        rounds_for += match.away_rounds ?? 0
        rounds_against += match.home_rounds ?? 0
      }
    }
    const forfeits = data.forfeit_events.filter((event) => {
      if (event.team_id !== team.id) return false
      const match = data.matches.find((m) => m.id === event.match_id)
      return match?.division_id === divisionId
    }).length
    return {
      team,
      wins,
      losses,
      rounds_for,
      rounds_against,
      round_diff: rounds_for - rounds_against,
      forfeits,
      inactive: forfeits >= 3,
      place: null,
    }
  })
  rows.sort((a, b) => {
    if (a.inactive !== b.inactive) return a.inactive ? 1 : -1
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.round_diff !== a.round_diff) return b.round_diff - a.round_diff
    if (b.rounds_for !== a.rounds_for) return b.rounds_for - a.rounds_for
    return a.team.name.localeCompare(b.team.name)
  })
  let place = 0
  for (const row of rows) {
    if (row.inactive) row.place = null
    else {
      place += 1
      row.place = place
    }
  }
  return rows
}

export function currentSeason(data: LeagueData) {
  return (
    data.seasons.find((s) => s.status === 'regular' || s.status === 'playoffs' || s.status === 'registration') ??
    data.seasons[0] ??
    null
  )
}

export function divisionsInOrder(data: LeagueData, seasonId: string) {
  return data.divisions
    .filter((d) => d.season_id === seasonId)
    .slice()
    .sort((a, b) => a.tier - b.tier)
}

export function playoffCut(division: Division) {
  return division.playoff_slots
}

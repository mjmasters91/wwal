import type { LeagueData, Profile, Team } from './types'

export function profileById(data: LeagueData, id: string | null | undefined) {
  if (!id) return null
  return data.profiles.find((p) => p.id === id) ?? null
}

export function profileByName(data: LeagueData, username: string) {
  return data.profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) ?? null
}

export function teamById(data: LeagueData, id: string | null | undefined): Team | null {
  if (!id) return null
  return data.teams.find((t) => t.id === id) ?? null
}

export function teamBySlug(data: LeagueData, slug: string) {
  return data.teams.find((t) => t.slug === slug) ?? null
}

export function membership(data: LeagueData, profileId: string | null | undefined) {
  if (!profileId) return null
  const member = data.team_members.find((m) => m.profile_id === profileId)
  if (!member) return null
  const team = teamById(data, member.team_id)
  if (!team) return null
  return { member, team }
}

export function isStaff(data: LeagueData, teamId: string, profileId: string | null | undefined) {
  if (!profileId) return false
  const member = data.team_members.find((m) => m.team_id === teamId && m.profile_id === profileId)
  return member?.role === 'captain' || member?.role === 'officer'
}

export function isMatchStaff(data: LeagueData, matchId: string, profile: Profile | null) {
  if (!profile) return false
  if (profile.is_admin) return true
  const match = data.matches.find((m) => m.id === matchId)
  if (!match) return false
  return [match.home_team_id, match.away_team_id].some(
    (teamId) => teamId && isStaff(data, teamId, profile.id),
  )
}

export function isRostered(data: LeagueData, matchId: string, profileId: string | null | undefined) {
  if (!profileId) return false
  const match = data.matches.find((m) => m.id === matchId)
  if (!match) return false
  return data.team_members.some(
    (m) =>
      m.profile_id === profileId &&
      (m.team_id === match.home_team_id || m.team_id === match.away_team_id),
  )
}

export function activeBan(data: LeagueData, profileId: string | null | undefined) {
  if (!profileId) return null
  const now = Date.now()
  return (
    data.bans.find((ban) => {
      if (ban.profile_id !== profileId || ban.lifted_at) return false
      if (!ban.ends_at) return true
      return new Date(ban.ends_at).getTime() > now
    }) ?? null
  )
}

export function roster(data: LeagueData, teamId: string) {
  const order = { captain: 0, officer: 1, player: 2 }
  return data.team_members
    .filter((m) => m.team_id === teamId)
    .slice()
    .sort((a, b) => order[a.role] - order[b.role] || a.joined_at.localeCompare(b.joined_at))
}

export function vetoBoard(data: LeagueData, matchId: string) {
  const match = data.matches.find((m) => m.id === matchId)
  const actions = data.map_actions
    .filter((a) => a.match_id === matchId)
    .slice()
    .sort((a, b) => a.step - b.step)
  const bans = actions.filter((a) => a.action === 'ban')
  const banned = new Set(bans.map((b) => b.map_name))
  const side = actions.find((a) => a.action === 'side') ?? null
  return { match, actions, bans, banned, side }
}

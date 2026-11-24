import { ACTIVE_DUTY, nid, nowIso, slugify, validMapScore } from './format'
import type { Bundle } from './mock'
import { activeBan, isStaff, membership, profileByName } from './select'
import { standingsFor } from './standings'
import type {
  LeagueData,
  Match,
  Profile,
  Result,
  Role,
  SeasonStatus,
} from './types'

export type Outcome = { bundle: Bundle; result: Result }

const ok = (bundle: Bundle): Outcome => ({ bundle, result: { ok: true } })
const fail = (bundle: Bundle, error: string): Outcome => ({ bundle, result: { ok: false, error } })

function me(bundle: Bundle): Profile | null {
  if (!bundle.meId) return null
  return bundle.data.profiles.find((p) => p.id === bundle.meId) ?? null
}

function requireUser(bundle: Bundle): Profile | Outcome {
  const profile = me(bundle)
  if (!profile) return fail(bundle, 'Sign in first.')
  if (activeBan(bundle.data, profile.id)) return fail(bundle, 'This account is suspended.')
  return profile
}

function isProfile(value: Profile | Outcome): value is Profile {
  return 'username' in value
}

function patchData(bundle: Bundle, data: LeagueData): Bundle {
  return { ...bundle, data }
}

export function demoSignIn(bundle: Bundle, email: string, password: string): Outcome {
  const entry = Object.entries(bundle.emails).find(([, value]) => value.toLowerCase() === email.trim().toLowerCase())
  if (!entry || bundle.passwords[entry[0]] !== password) {
    return fail(bundle, 'That email and password do not match a ledger account.')
  }
  return ok({ ...bundle, meId: entry[0] })
}

export function demoSignUp(
  bundle: Bundle,
  input: { email: string; password: string; username: string; displayName: string },
): Outcome {
  const email = input.email.trim().toLowerCase()
  const username = input.username.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(bundle, 'Use a real email shape.')
  if (input.password.length < 8) return fail(bundle, 'Use at least 8 characters.')
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return fail(bundle, 'Usernames are 3–20 letters, numbers, or underscores.')
  }
  if (Object.values(bundle.emails).some((value) => value === email)) return fail(bundle, 'That email is already on the ledger.')
  if (bundle.data.profiles.some((p) => p.username.toLowerCase() === username.toLowerCase())) {
    return fail(bundle, 'That username is taken.')
  }
  const id = nid()
  const stamp = nowIso()
  const profile: Profile = {
    id,
    username,
    display_name: input.displayName.trim() || username,
    bio: '',
    steam_name: '',
    region: 'NA',
    is_admin: false,
    created_at: stamp,
    updated_at: stamp,
  }
  return ok({
    data: { ...bundle.data, profiles: [...bundle.data.profiles, profile] },
    emails: { ...bundle.emails, [id]: email },
    passwords: { ...bundle.passwords, [id]: input.password },
    meId: id,
  })
}

export function demoSignOut(bundle: Bundle): Outcome {
  return ok({ ...bundle, meId: null })
}

export function demoUpdateProfile(
  bundle: Bundle,
  input: { display_name: string; bio: string; steam_name: string },
): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  return ok(
    patchData(bundle, {
      ...bundle.data,
      profiles: bundle.data.profiles.map((row) =>
        row.id === profile.id
          ? {
              ...row,
              display_name: input.display_name.trim() || row.username,
              bio: input.bio.trim(),
              steam_name: input.steam_name.trim(),
              updated_at: nowIso(),
            }
          : row,
      ),
    }),
  )
}

export function demoCreateTeam(
  bundle: Bundle,
  input: { name: string; tag: string; motto: string; about: string; accent: string },
): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  if (membership(bundle.data, profile.id)) return fail(bundle, 'You are already on a coven.')
  const name = input.name.trim()
  const tag = input.tag.trim().toUpperCase()
  if (name.length < 3 || name.length > 40) return fail(bundle, 'Coven names are 3–40 characters.')
  if (!/^[A-Z0-9]{2,5}$/.test(tag)) return fail(bundle, 'Tags are 2–5 letters or numbers.')
  if (bundle.data.teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    return fail(bundle, 'That coven name is taken.')
  }
  if (bundle.data.teams.some((t) => t.tag === tag)) return fail(bundle, 'That tag is taken.')
  const slugBase = slugify(name)
  if (!slugBase) return fail(bundle, 'Use a name that can become a link.')
  let slug = slugBase
  let n = 2
  while (bundle.data.teams.some((t) => t.slug === slug)) {
    slug = `${slugBase}-${n}`
    n += 1
  }
  const stamp = nowIso()
  const teamId = nid()
  return ok(
    patchData(bundle, {
      ...bundle.data,
      teams: [
        ...bundle.data.teams,
        {
          id: teamId,
          name,
          tag,
          slug,
          motto: input.motto.trim(),
          about: input.about.trim(),
          accent: /^#[0-9A-Fa-f]{6}$/.test(input.accent) ? input.accent : '#e6c56a',
          region: 'NA',
          created_by: profile.id,
          created_at: stamp,
          updated_at: stamp,
        },
      ],
      team_members: [
        ...bundle.data.team_members,
        { team_id: teamId, profile_id: profile.id, role: 'captain', joined_at: stamp },
      ],
    }),
  )
}

export function demoUpdateTeam(
  bundle: Bundle,
  teamId: string,
  input: { motto: string; about: string; accent: string },
): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  if (!profile.is_admin && !isStaff(bundle.data, teamId, profile.id)) {
    return fail(bundle, 'Only a captain or officer can edit the coven page.')
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      teams: bundle.data.teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              motto: input.motto.trim(),
              about: input.about.trim(),
              accent: /^#[0-9A-Fa-f]{6}$/.test(input.accent) ? input.accent : team.accent,
              updated_at: nowIso(),
            }
          : team,
      ),
    }),
  )
}

export function demoInvite(bundle: Bundle, teamId: string, username: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  if (!profile.is_admin && !isStaff(bundle.data, teamId, profile.id)) {
    return fail(bundle, 'Only a captain or officer can invite.')
  }
  const invitee = profileByName(bundle.data, username.trim())
  if (!invitee) return fail(bundle, 'No player by that username.')
  if (invitee.id === profile.id) return fail(bundle, 'You cannot invite yourself.')
  if (activeBan(bundle.data, invitee.id)) return fail(bundle, 'That player is suspended.')
  if (membership(bundle.data, invitee.id)) return fail(bundle, 'That player is already on a coven.')
  if (
    bundle.data.team_invites.some(
      (invite) => invite.team_id === teamId && invite.invitee_id === invitee.id && invite.status === 'pending',
    )
  ) {
    return fail(bundle, 'That invite is already waiting.')
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      team_invites: [
        ...bundle.data.team_invites,
        {
          id: nid(),
          team_id: teamId,
          inviter_id: profile.id,
          invitee_id: invitee.id,
          status: 'pending',
          created_at: nowIso(),
          responded_at: null,
        },
      ],
    }),
  )
}

export function demoAnswerInvite(bundle: Bundle, inviteId: string, accept: boolean): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const invite = bundle.data.team_invites.find((row) => row.id === inviteId)
  if (!invite || invite.status !== 'pending') return fail(bundle, 'That invite is no longer open.')
  if (invite.invitee_id !== profile.id && !profile.is_admin) return fail(bundle, 'Only the invited player can answer.')
  if (accept && membership(bundle.data, invite.invitee_id)) return fail(bundle, 'You are already on a coven.')
  const stamp = nowIso()
  let invites = bundle.data.team_invites.map((row) =>
    row.id === inviteId ? { ...row, status: accept ? 'accepted' as const : 'declined' as const, responded_at: stamp } : row,
  )
  let members = bundle.data.team_members
  if (accept) {
    members = [
      ...members,
      { team_id: invite.team_id, profile_id: invite.invitee_id, role: 'player', joined_at: stamp },
    ]
    invites = invites.map((row) =>
      row.invitee_id === invite.invitee_id && row.status === 'pending'
        ? { ...row, status: 'declined', responded_at: stamp }
        : row,
    )
  }
  return ok(patchData(bundle, { ...bundle.data, team_invites: invites, team_members: members }))
}

export function demoRevokeInvite(bundle: Bundle, inviteId: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const invite = bundle.data.team_invites.find((row) => row.id === inviteId)
  if (!invite || invite.status !== 'pending') return fail(bundle, 'That invite is no longer open.')
  if (!profile.is_admin && !isStaff(bundle.data, invite.team_id, profile.id)) {
    return fail(bundle, 'Only coven staff can revoke an invite.')
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      team_invites: bundle.data.team_invites.map((row) =>
        row.id === inviteId ? { ...row, status: 'revoked', responded_at: nowIso() } : row,
      ),
    }),
  )
}

export function demoSetRole(bundle: Bundle, teamId: string, profileId: string, role: Role): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const actor = bundle.data.team_members.find((m) => m.team_id === teamId && m.profile_id === profile.id)
  if (!profile.is_admin && actor?.role !== 'captain') return fail(bundle, 'Only the captain can change roles.')
  const target = bundle.data.team_members.find((m) => m.team_id === teamId && m.profile_id === profileId)
  if (!target) return fail(bundle, 'That player is not on this coven.')
  let members = bundle.data.team_members
  if (role === 'captain') {
    members = members.map((m) => {
      if (m.team_id !== teamId) return m
      if (m.profile_id === profileId) return { ...m, role: 'captain' }
      if (m.role === 'captain') return { ...m, role: 'officer' }
      return m
    })
  } else if (target.role === 'captain') {
    return fail(bundle, 'Name another captain first.')
  } else {
    members = members.map((m) => (m.team_id === teamId && m.profile_id === profileId ? { ...m, role } : m))
  }
  return ok(patchData(bundle, { ...bundle.data, team_members: members }))
}

export function demoRemoveMember(bundle: Bundle, teamId: string, profileId: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const target = bundle.data.team_members.find((m) => m.team_id === teamId && m.profile_id === profileId)
  if (!target) return fail(bundle, 'That player is not on this coven.')
  const captain = bundle.data.team_members.find((m) => m.team_id === teamId && m.role === 'captain')
  const self = profileId === profile.id
  if (target.role === 'captain' && !profile.is_admin) {
    return fail(bundle, 'A captain cannot walk off. Name another captain first.')
  }
  if (!self && !profile.is_admin && captain?.profile_id !== profile.id) {
    return fail(bundle, 'Only the captain can remove a player.')
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      team_members: bundle.data.team_members.filter((m) => !(m.team_id === teamId && m.profile_id === profileId)),
    }),
  )
}

export function demoRegister(bundle: Bundle, divisionId: string, note: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const mine = membership(bundle.data, profile.id)
  if (!mine || (mine.member.role === 'player' && !profile.is_admin)) {
    return fail(bundle, 'A captain or officer has to file the petition.')
  }
  const division = bundle.data.divisions.find((d) => d.id === divisionId)
  if (!division) return fail(bundle, 'That division is not on this season.')
  if (bundle.data.registrations.some((r) => r.season_id === division.season_id && r.team_id === mine.team.id)) {
    return fail(bundle, 'This coven already has a petition on the season.')
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      registrations: [
        ...bundle.data.registrations,
        {
          id: nid(),
          season_id: division.season_id,
          division_id: division.id,
          team_id: mine.team.id,
          status: 'pending',
          registered_by: profile.id,
          note: note.trim(),
          created_at: nowIso(),
        },
      ],
    }),
  )
}

function matchOf(data: LeagueData, matchId: string) {
  return data.matches.find((m) => m.id === matchId) ?? null
}

function staffTeamOnMatch(data: LeagueData, match: Match, profileId: string) {
  return data.team_members.find(
    (m) =>
      m.profile_id === profileId &&
      (m.role === 'captain' || m.role === 'officer') &&
      (m.team_id === match.home_team_id || m.team_id === match.away_team_id),
  )
}

export function demoPropose(bundle: Bundle, matchId: string, proposedTime: string, message: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match) return fail(bundle, 'Match not found.')
  if (!['scheduled', 'veto', 'reported'].includes(match.status)) {
    return fail(bundle, 'This match is no longer on the clock.')
  }
  const staff = staffTeamOnMatch(bundle.data, match, profile.id)
  if (!staff && !profile.is_admin) return fail(bundle, 'Only coven staff can propose a time.')
  const when = new Date(proposedTime)
  if (Number.isNaN(when.getTime())) return fail(bundle, 'Pick a date and time.')
  const teamId = staff?.team_id ?? match.home_team_id
  if (!teamId) return fail(bundle, 'This match has no coven to speak for yet.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      reschedule_proposals: [
        ...bundle.data.reschedule_proposals,
        {
          id: nid(),
          match_id: matchId,
          proposed_by: profile.id,
          proposed_by_team: teamId,
          proposed_time: when.toISOString(),
          message: message.trim(),
          status: 'pending',
          created_at: nowIso(),
        },
      ],
    }),
  )
}

export function demoAnswerProposal(bundle: Bundle, proposalId: string, accept: boolean): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const proposal = bundle.data.reschedule_proposals.find((row) => row.id === proposalId)
  if (!proposal || proposal.status !== 'pending') return fail(bundle, 'That proposal is already answered.')
  const match = matchOf(bundle.data, proposal.match_id)
  if (!match) return fail(bundle, 'Match not found.')
  const staff = staffTeamOnMatch(bundle.data, match, profile.id)
  const opposing = staff && staff.team_id !== proposal.proposed_by_team
  if (!profile.is_admin && !opposing) return fail(bundle, 'Only the other coven can answer.')
  let proposals = bundle.data.reschedule_proposals.map((row) =>
    row.id === proposalId ? { ...row, status: accept ? 'accepted' as const : 'declined' as const } : row,
  )
  let matches = bundle.data.matches
  if (accept) {
    proposals = proposals.map((row) =>
      row.match_id === proposal.match_id && row.id !== proposal.id && row.status === 'pending'
        ? { ...row, status: 'declined' }
        : row,
    )
    matches = matches.map((row) =>
      row.id === match.id ? { ...row, scheduled_at: proposal.proposed_time, updated_at: nowIso() } : row,
    )
  }
  return ok(patchData(bundle, { ...bundle.data, reschedule_proposals: proposals, matches }))
}

export function demoBanMap(bundle: Bundle, matchId: string, mapName: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match?.home_team_id || !match.away_team_id) return fail(bundle, 'Both covens have to be seated first.')
  if (!['scheduled', 'veto'].includes(match.status)) return fail(bundle, 'The veto is closed on this match.')
  if (!ACTIVE_DUTY.includes(mapName as (typeof ACTIVE_DUTY)[number])) {
    return fail(bundle, 'That map is not in the active pool.')
  }
  const bans = bundle.data.map_actions.filter((a) => a.match_id === matchId && a.action === 'ban')
  if (bans.length >= 6) return fail(bundle, 'All six bans are in.')
  if (bans.some((b) => b.map_name === mapName)) return fail(bundle, 'That map is already banned.')
  const expected = bans.length % 2 === 0 ? match.home_team_id : match.away_team_id
  const staff = staffTeamOnMatch(bundle.data, match, profile.id)
  if (!profile.is_admin && staff?.team_id !== expected) return fail(bundle, "It is not your coven's turn to ban.")
  const teamId = profile.is_admin && staff?.team_id !== expected ? expected : staff?.team_id ?? expected
  const step = bundle.data.map_actions.filter((a) => a.match_id === matchId).length + 1
  const actions = [
    ...bundle.data.map_actions,
    {
      id: nid(),
      match_id: matchId,
      team_id: teamId,
      actor_id: profile.id,
      step,
      action: 'ban' as const,
      map_name: mapName,
      side: null,
      created_at: nowIso(),
    },
  ]
  const banned = new Set(actions.filter((a) => a.match_id === matchId && a.action === 'ban').map((a) => a.map_name))
  const remaining = ACTIVE_DUTY.filter((map) => !banned.has(map))
  const matches = bundle.data.matches.map((row) => {
    if (row.id !== matchId) return row
    if (remaining.length === 1) {
      return { ...row, status: 'veto' as const, played_map: remaining[0], updated_at: nowIso() }
    }
    return { ...row, status: 'veto' as const, updated_at: nowIso() }
  })
  return ok(patchData(bundle, { ...bundle.data, map_actions: actions, matches }))
}

export function demoPickSide(bundle: Bundle, matchId: string, side: 'CT' | 'T'): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match?.home_team_id || !match.away_team_id) return fail(bundle, 'Both covens have to be seated first.')
  const bans = bundle.data.map_actions.filter((a) => a.match_id === matchId && a.action === 'ban')
  if (bans.length < 6 || !match.played_map) return fail(bundle, 'The map is not sealed yet.')
  if (bundle.data.map_actions.some((a) => a.match_id === matchId && a.action === 'side')) {
    return fail(bundle, 'Opening side is already chosen.')
  }
  const staff = staffTeamOnMatch(bundle.data, match, profile.id)
  if (!profile.is_admin && staff?.team_id !== match.home_team_id) {
    return fail(bundle, 'The home coven chooses the opening side.')
  }
  const ct = side === 'CT' ? match.home_team_id : match.away_team_id
  return ok(
    patchData(bundle, {
      ...bundle.data,
      map_actions: [
        ...bundle.data.map_actions,
        {
          id: nid(),
          match_id: matchId,
          team_id: match.home_team_id,
          actor_id: profile.id,
          step: bundle.data.map_actions.filter((a) => a.match_id === matchId).length + 1,
          action: 'side',
          map_name: null,
          side,
          created_at: nowIso(),
        },
      ],
      matches: bundle.data.matches.map((row) =>
        row.id === matchId ? { ...row, ct_team_id: ct, status: 'scheduled', updated_at: nowIso() } : row,
      ),
    }),
  )
}

export function demoServer(bundle: Bundle, matchId: string, serverInfo: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match) return fail(bundle, 'Match not found.')
  if (!profile.is_admin && !staffTeamOnMatch(bundle.data, match, profile.id)) {
    return fail(bundle, 'Only a captain or officer on this match can edit server info.')
  }
  if (serverInfo.length > 500) return fail(bundle, 'Keep the server note under 500 characters.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      matches: bundle.data.matches.map((row) =>
        row.id === matchId ? { ...row, server_info: serverInfo, updated_at: nowIso() } : row,
      ),
    }),
  )
}

export function demoReport(
  bundle: Bundle,
  matchId: string,
  homeRounds: number,
  awayRounds: number,
  screenshot: string,
  note: string,
): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match) return fail(bundle, 'Match not found.')
  if (!['scheduled', 'veto'].includes(match.status)) return fail(bundle, 'This match is not waiting on a score.')
  const scoreError = validMapScore(homeRounds, awayRounds)
  if (scoreError) return fail(bundle, scoreError)
  if (!screenshot) return fail(bundle, 'Attach a screenshot of the scoreboard.')
  const staff = staffTeamOnMatch(bundle.data, match, profile.id)
  if (!staff && !profile.is_admin) return fail(bundle, 'Only coven staff can file a score.')
  if (bundle.data.score_reports.some((r) => r.match_id === matchId && r.status === 'pending')) {
    return fail(bundle, 'A score is already waiting on the other coven.')
  }
  const teamId = staff?.team_id ?? match.home_team_id
  if (!teamId) return fail(bundle, 'This match has no coven to file for.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      score_reports: [
        ...bundle.data.score_reports,
        {
          id: nid(),
          match_id: matchId,
          reporter_id: profile.id,
          team_id: teamId,
          home_rounds: homeRounds,
          away_rounds: awayRounds,
          screenshot_path: screenshot,
          note: note.trim(),
          status: 'pending',
          created_at: nowIso(),
        },
      ],
      matches: bundle.data.matches.map((row) =>
        row.id === matchId ? { ...row, status: 'reported', updated_at: nowIso() } : row,
      ),
    }),
  )
}

export function demoAnswerReport(bundle: Bundle, reportId: string, accept: boolean): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const report = bundle.data.score_reports.find((row) => row.id === reportId)
  if (!report || report.status !== 'pending') return fail(bundle, 'That score is no longer waiting.')
  const match = matchOf(bundle.data, report.match_id)
  if (!match?.home_team_id || !match.away_team_id) return fail(bundle, 'Match not found.')
  const staff = staffTeamOnMatch(bundle.data, match, profile.id)
  if (!profile.is_admin && (!staff || staff.team_id === report.team_id)) {
    return fail(bundle, 'The reporting coven cannot confirm its own score.')
  }
  if (match.status === 'disputed' && !profile.is_admin) {
    return fail(bundle, 'A dispute is open. The stewards have the book.')
  }
  const winner = report.home_rounds > report.away_rounds ? match.home_team_id : match.away_team_id
  let matches = bundle.data.matches
  if (accept) {
    matches = advanceWinner(matches, {
      ...match,
      home_rounds: report.home_rounds,
      away_rounds: report.away_rounds,
      winner_team_id: winner,
      status: 'completed',
      updated_at: nowIso(),
    })
  } else if (match.status === 'reported') {
    matches = matches.map((row) => (row.id === match.id ? { ...row, status: 'scheduled', updated_at: nowIso() } : row))
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      matches,
      score_reports: bundle.data.score_reports.map((row) => {
        if (row.id === reportId) return { ...row, status: accept ? 'confirmed' : 'rejected' }
        if (accept && row.match_id === report.match_id && row.status === 'pending') {
          return { ...row, status: 'superseded' }
        }
        return row
      }),
    }),
  )
}

function advanceWinner(matches: Match[], updated: Match): Match[] {
  const next = matches.map((row) => (row.id === updated.id ? updated : row))
  if (!updated.advances_to || !updated.winner_team_id) return next
  if (updated.status !== 'completed' && updated.status !== 'forfeit') return next
  return next.map((row) => {
    if (row.id !== updated.advances_to) return row
    if (updated.advances_as === 'home') return { ...row, home_team_id: updated.winner_team_id, updated_at: nowIso() }
    return { ...row, away_team_id: updated.winner_team_id, updated_at: nowIso() }
  })
}

export function demoDispute(bundle: Bundle, matchId: string, reason: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match) return fail(bundle, 'Match not found.')
  if (!['reported', 'completed', 'disputed'].includes(match.status)) {
    return fail(bundle, 'There is no filed result to dispute yet.')
  }
  if (!profile.is_admin && !staffTeamOnMatch(bundle.data, match, profile.id)) {
    return fail(bundle, 'Only coven staff can open a dispute.')
  }
  const text = reason.trim()
  if (text.length < 10) return fail(bundle, 'Tell the stewards what happened, in at least a sentence.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      disputes: [
        ...bundle.data.disputes,
        {
          id: nid(),
          match_id: matchId,
          opened_by: profile.id,
          reason: text,
          status: 'open',
          resolution: '',
          resolved_by: null,
          created_at: nowIso(),
          resolved_at: null,
        },
      ],
      matches: bundle.data.matches.map((row) =>
        row.id === matchId ? { ...row, status: 'disputed', updated_at: nowIso() } : row,
      ),
    }),
  )
}

export function demoForfeit(bundle: Bundle, matchId: string, teamId: string, reason: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const match = matchOf(bundle.data, matchId)
  if (!match) return fail(bundle, 'Match not found.')
  if (match.status === 'completed' || match.status === 'forfeit') return fail(bundle, 'This match is already in the book.')
  if (teamId !== match.home_team_id && teamId !== match.away_team_id) {
    return fail(bundle, 'That coven is not in this match.')
  }
  if (!profile.is_admin && !isStaff(bundle.data, teamId, profile.id)) {
    return fail(bundle, "Only that coven's staff can forfeit.")
  }
  const winner = teamId === match.home_team_id ? match.away_team_id : match.home_team_id
  const updated: Match = {
    ...match,
    status: 'forfeit',
    forfeit_team_id: teamId,
    winner_team_id: winner,
    home_rounds: 0,
    away_rounds: 0,
    updated_at: nowIso(),
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      matches: advanceWinner(bundle.data.matches, updated),
      forfeit_events: [
        ...bundle.data.forfeit_events,
        {
          id: nid(),
          match_id: matchId,
          team_id: teamId,
          recorded_by: profile.id,
          reason: reason.trim() || 'Forfeit filed by coven staff.',
          created_at: nowIso(),
        },
      ],
    }),
  )
}

export function demoThread(bundle: Bundle, boardId: string, title: string, body: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  if (title.trim().length < 3) return fail(bundle, 'Give the thread a title.')
  if (!body.trim()) return fail(bundle, 'Write the post.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      forum_threads: [
        {
          id: nid(),
          board_id: boardId,
          author_id: profile.id,
          title: title.trim(),
          body: body.trim(),
          pinned: false,
          locked: false,
          created_at: nowIso(),
        },
        ...bundle.data.forum_threads,
      ],
    }),
  )
}

export function demoReply(bundle: Bundle, threadId: string, body: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const thread = bundle.data.forum_threads.find((row) => row.id === threadId)
  if (!thread) return fail(bundle, 'Thread not found.')
  if (thread.locked && !profile.is_admin) return fail(bundle, 'This thread is locked.')
  if (!body.trim()) return fail(bundle, 'Write a reply.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      forum_replies: [
        ...bundle.data.forum_replies,
        { id: nid(), thread_id: threadId, author_id: profile.id, body: body.trim(), created_at: nowIso() },
      ],
    }),
  )
}

export function demoTicket(bundle: Bundle, subject: string, body: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  if (subject.trim().length < 3) return fail(bundle, 'Give the ticket a subject.')
  if (!body.trim()) return fail(bundle, 'Tell the stewards what you need.')
  const ticketId = nid()
  const stamp = nowIso()
  return ok(
    patchData(bundle, {
      ...bundle.data,
      tickets: [
        { id: ticketId, author_id: profile.id, subject: subject.trim(), status: 'open', created_at: stamp, updated_at: stamp },
        ...bundle.data.tickets,
      ],
      ticket_messages: [
        ...bundle.data.ticket_messages,
        { id: nid(), ticket_id: ticketId, author_id: profile.id, body: body.trim(), created_at: stamp },
      ],
    }),
  )
}

export function demoTicketReply(bundle: Bundle, ticketId: string, body: string): Outcome {
  const profile = requireUser(bundle)
  if (!isProfile(profile)) return profile
  const ticket = bundle.data.tickets.find((row) => row.id === ticketId)
  if (!ticket) return fail(bundle, 'Ticket not found.')
  if (ticket.author_id !== profile.id && !profile.is_admin) return fail(bundle, 'That ticket is not yours.')
  if (!body.trim()) return fail(bundle, 'Write a message.')
  const stamp = nowIso()
  const nextStatus = profile.is_admin ? 'waiting' : ticket.status === 'resolved' ? 'open' : ticket.status
  return ok(
    patchData(bundle, {
      ...bundle.data,
      tickets: bundle.data.tickets.map((row) =>
        row.id === ticketId ? { ...row, status: profile.is_admin && row.status === 'open' ? 'waiting' : nextStatus, updated_at: stamp } : row,
      ),
      ticket_messages: [
        ...bundle.data.ticket_messages,
        { id: nid(), ticket_id: ticketId, author_id: profile.id, body: body.trim(), created_at: stamp },
      ],
    }),
  )
}

export function demoSeasonStatus(bundle: Bundle, seasonId: string, status: SeasonStatus): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      seasons: bundle.data.seasons.map((season) => (season.id === seasonId ? { ...season, status } : season)),
    }),
  )
}

export function demoRegistrationStatus(
  bundle: Bundle,
  registrationId: string,
  status: 'approved' | 'rejected' | 'pending',
): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      registrations: bundle.data.registrations.map((row) => (row.id === registrationId ? { ...row, status } : row)),
    }),
  )
}

export function demoCreateMatch(
  bundle: Bundle,
  input: {
    divisionId: string
    week: number
    homeTeamId: string
    awayTeamId: string
    scheduledAt: string
  },
): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  const division = bundle.data.divisions.find((d) => d.id === input.divisionId)
  if (!division) return fail(bundle, 'Pick a division.')
  if (input.homeTeamId === input.awayTeamId) return fail(bundle, 'A coven cannot play itself.')
  const weekMatches = bundle.data.matches.filter((m) => m.division_id === division.id && m.week === input.week)
  const slot = weekMatches.reduce((max, match) => Math.max(max, match.slot), 0) + 1
  const when = new Date(input.scheduledAt)
  if (Number.isNaN(when.getTime())) return fail(bundle, 'Pick a date and time.')
  const code = `${division.name.toLowerCase()}-${input.week}-${slot}-${nid().slice(0, 4)}`
  return ok(
    patchData(bundle, {
      ...bundle.data,
      matches: [
        ...bundle.data.matches,
        {
          id: nid(),
          code,
          season_id: division.season_id,
          division_id: division.id,
          stage: 'regular',
          week: input.week,
          slot,
          round_name: `Week ${input.week}`,
          home_team_id: input.homeTeamId,
          away_team_id: input.awayTeamId,
          scheduled_at: when.toISOString(),
          status: 'scheduled',
          server_info: '',
          played_map: null,
          ct_team_id: null,
          home_rounds: null,
          away_rounds: null,
          winner_team_id: null,
          forfeit_team_id: null,
          advances_to: null,
          advances_as: null,
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
    }),
  )
}

export function demoOverride(
  bundle: Bundle,
  matchId: string,
  homeRounds: number,
  awayRounds: number,
  resolution: string,
): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  const match = matchOf(bundle.data, matchId)
  if (!match?.home_team_id || !match.away_team_id) return fail(bundle, 'Both covens have to be seated.')
  const scoreError = validMapScore(homeRounds, awayRounds)
  if (scoreError) return fail(bundle, scoreError)
  const winner = homeRounds > awayRounds ? match.home_team_id : match.away_team_id
  const updated: Match = {
    ...match,
    home_rounds: homeRounds,
    away_rounds: awayRounds,
    winner_team_id: winner,
    forfeit_team_id: null,
    status: 'completed',
    updated_at: nowIso(),
  }
  const stamp = nowIso()
  return ok(
    patchData(bundle, {
      ...bundle.data,
      matches: advanceWinner(bundle.data.matches, updated),
      score_reports: bundle.data.score_reports.map((row) =>
        row.match_id === matchId && row.status === 'pending' ? { ...row, status: 'superseded' } : row,
      ),
      disputes: bundle.data.disputes.map((row) =>
        row.match_id === matchId && row.status === 'open'
          ? {
              ...row,
              status: 'resolved',
              resolution: resolution.trim() || 'Steward override.',
              resolved_by: profile.id,
              resolved_at: stamp,
            }
          : row,
      ),
    }),
  )
}

export function demoBanPlayer(
  bundle: Bundle,
  username: string,
  reason: string,
  endsAt: string | null,
): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  const target = profileByName(bundle.data, username.trim())
  if (!target) return fail(bundle, 'No player by that username.')
  if (target.is_admin) return fail(bundle, 'Stewards are not banned from this desk.')
  if (reason.trim().length < 3) return fail(bundle, 'Write the reason. It is public.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      bans: [
        {
          id: nid(),
          profile_id: target.id,
          issued_by: profile.id,
          reason: reason.trim(),
          ends_at: endsAt,
          created_at: nowIso(),
          lifted_at: null,
        },
        ...bundle.data.bans,
      ],
    }),
  )
}

export function demoLiftBan(bundle: Bundle, banId: string): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      bans: bundle.data.bans.map((ban) => (ban.id === banId ? { ...ban, lifted_at: nowIso() } : ban)),
    }),
  )
}

export function demoSaveNews(
  bundle: Bundle,
  input: { id?: string; title: string; excerpt: string; body: string; published: boolean },
): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  const title = input.title.trim()
  const body = input.body.trim()
  if (title.length < 3 || body.length < 3) return fail(bundle, 'A note needs a title and a body.')
  const stamp = nowIso()
  if (input.id) {
    return ok(
      patchData(bundle, {
        ...bundle.data,
        news_posts: bundle.data.news_posts.map((post) =>
          post.id === input.id
            ? {
                ...post,
                title,
                excerpt: input.excerpt.trim(),
                body,
                published: input.published,
                published_at: input.published ? post.published_at ?? stamp : null,
                updated_at: stamp,
              }
            : post,
        ),
      }),
    )
  }
  const base = slugify(title) || 'note'
  let slug = base
  let n = 2
  while (bundle.data.news_posts.some((post) => post.slug === slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  return ok(
    patchData(bundle, {
      ...bundle.data,
      news_posts: [
        {
          id: nid(),
          slug,
          title,
          excerpt: input.excerpt.trim(),
          body,
          author_id: profile.id,
          published: input.published,
          published_at: input.published ? stamp : null,
          created_at: stamp,
          updated_at: stamp,
        },
        ...bundle.data.news_posts,
      ],
    }),
  )
}

export function demoLockSeeds(bundle: Bundle, divisionId: string): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  const division = bundle.data.divisions.find((d) => d.id === divisionId)
  if (!division) return fail(bundle, 'Division not found.')
  const table = standingsFor(bundle.data, divisionId).filter((row) => row.place != null)
  const seeds = table.slice(0, division.playoff_slots).map((row) => row.team.id)
  if (seeds.length < 2) return fail(bundle, 'Not enough eligible covens to seed.')
  const playoff = bundle.data.matches.filter((m) => m.division_id === divisionId && m.stage === 'playoff')
  const semis = playoff.filter((m) => m.round_name === 'Semifinal').sort((a, b) => a.slot - b.slot)
  const final = playoff.find((m) => m.round_name === 'Final')
  let matches = bundle.data.matches
  if (semis.length >= 2 && seeds.length >= 4) {
    const pairs: [string, string, string][] = [
      [semis[0].id, seeds[0], seeds[3]],
      [semis[1].id, seeds[1], seeds[2]],
    ]
    matches = matches.map((match) => {
      const pair = pairs.find((item) => item[0] === match.id)
      if (!pair) return match
      return { ...match, home_team_id: pair[1], away_team_id: pair[2], updated_at: nowIso() }
    })
  } else if (final && seeds.length >= 2) {
    matches = matches.map((match) =>
      match.id === final.id
        ? { ...match, home_team_id: seeds[0], away_team_id: seeds[1], updated_at: nowIso() }
        : match,
    )
  }
  return ok(patchData(bundle, { ...bundle.data, matches }))
}

export function demoSetTicketStatus(
  bundle: Bundle,
  ticketId: string,
  status: 'open' | 'waiting' | 'resolved',
): Outcome {
  const profile = me(bundle)
  if (!profile?.is_admin) return fail(bundle, 'Stewards only.')
  return ok(
    patchData(bundle, {
      ...bundle.data,
      tickets: bundle.data.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status, updated_at: nowIso() } : ticket,
      ),
    }),
  )
}

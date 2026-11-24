import { slugify } from './format'
import { authRedirectUrl, supabase } from './supabase'
import type { LeagueData, Role, SeasonStatus } from './types'

const TABLES = [
  'profiles',
  'teams',
  'team_members',
  'team_invites',
  'seasons',
  'divisions',
  'registrations',
  'matches',
  'map_actions',
  'reschedule_proposals',
  'score_reports',
  'disputes',
  'forfeit_events',
  'news_posts',
  'forum_boards',
  'forum_threads',
  'forum_replies',
  'tickets',
  'ticket_messages',
  'bans',
] as const

function client() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function unwrap<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

export async function loadLeague(): Promise<{ data: LeagueData; meId: string | null }> {
  const sb = client()
  const userResult = await sb.auth.getUser()
  if (userResult.error) throw new Error(userResult.error.message)
  const entries = await Promise.all(
    TABLES.map(async (table) => {
      const result = await sb.from(table).select('*')
      if (result.error) throw new Error(`${table}: ${result.error.message}`)
      return [table, result.data ?? []] as const
    }),
  )
  return {
    data: Object.fromEntries(entries) as LeagueData,
    meId: userResult.data.user?.id ?? null,
  }
}

export async function liveSignIn(email: string, password: string) {
  const result = await client().auth.signInWithPassword({ email: email.trim(), password })
  if (result.error) throw new Error(result.error.message)
}

export async function liveSignUp(input: { email: string; password: string; username: string; displayName: string }) {
  const result = await client().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: authRedirectUrl,
      data: { username: input.username.trim(), display_name: input.displayName.trim() || input.username.trim() },
    },
  })
  if (result.error) throw new Error(result.error.message)
  if (!result.data.session) {
    throw new Error('Account created. Confirm the email if this project requires it, then sign in.')
  }
}

export async function liveSignOut() {
  const result = await client().auth.signOut()
  if (result.error) throw new Error(result.error.message)
}

async function uid() {
  const result = await client().auth.getUser()
  if (result.error || !result.data.user) throw new Error('Sign in first.')
  return result.data.user.id
}

export async function liveUpdateProfile(input: { display_name: string; bio: string; steam_name: string }) {
  const id = await uid()
  unwrap(
    await client()
      .from('profiles')
      .update({
        display_name: input.display_name.trim(),
        bio: input.bio.trim(),
        steam_name: input.steam_name.trim(),
      })
      .eq('id', id),
  )
}

export async function liveCreateTeam(input: { name: string; tag: string; motto: string; about: string; accent: string }) {
  const id = await uid()
  const name = input.name.trim()
  const base = slugify(name)
  unwrap(
    await client()
      .from('teams')
      .insert({
        name,
        tag: input.tag.trim().toUpperCase(),
        slug: base,
        motto: input.motto.trim(),
        about: input.about.trim(),
        accent: input.accent,
        region: 'NA',
        created_by: id,
      }),
  )
}

export async function liveUpdateTeam(teamId: string, input: { motto: string; about: string; accent: string }) {
  unwrap(
    await client().from('teams').update({ motto: input.motto.trim(), about: input.about.trim(), accent: input.accent }).eq('id', teamId),
  )
}

export async function liveInvite(teamId: string, inviteeId: string) {
  const id = await uid()
  unwrap(await client().from('team_invites').insert({ team_id: teamId, inviter_id: id, invitee_id: inviteeId, status: 'pending' }))
}

export async function liveAnswerInvite(inviteId: string, accept: boolean) {
  unwrap(await client().from('team_invites').update({ status: accept ? 'accepted' : 'declined' }).eq('id', inviteId))
}

export async function liveRevokeInvite(inviteId: string) {
  unwrap(await client().from('team_invites').update({ status: 'revoked' }).eq('id', inviteId))
}

export async function liveSetRole(teamId: string, profileId: string, role: Role) {
  unwrap(await client().from('team_members').update({ role }).eq('team_id', teamId).eq('profile_id', profileId))
}

export async function liveRemoveMember(teamId: string, profileId: string) {
  unwrap(await client().from('team_members').delete().eq('team_id', teamId).eq('profile_id', profileId))
}

export async function liveRegister(seasonId: string, divisionId: string, teamId: string, note: string) {
  const id = await uid()
  unwrap(
    await client().from('registrations').insert({
      season_id: seasonId,
      division_id: divisionId,
      team_id: teamId,
      status: 'pending',
      registered_by: id,
      note: note.trim(),
    }),
  )
}

export async function livePropose(matchId: string, teamId: string, proposedTime: string, message: string) {
  const id = await uid()
  unwrap(
    await client().from('reschedule_proposals').insert({
      match_id: matchId,
      proposed_by: id,
      proposed_by_team: teamId,
      proposed_time: new Date(proposedTime).toISOString(),
      message: message.trim(),
      status: 'pending',
    }),
  )
}

export async function liveAnswerProposal(proposalId: string, accept: boolean) {
  unwrap(
    await client()
      .from('reschedule_proposals')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', proposalId),
  )
}

export async function liveBanMap(matchId: string, teamId: string, mapName: string) {
  const id = await uid()
  unwrap(
    await client().from('map_actions').insert({
      match_id: matchId,
      team_id: teamId,
      actor_id: id,
      step: 1,
      action: 'ban',
      map_name: mapName,
    }),
  )
}

export async function livePickSide(matchId: string, teamId: string, side: 'CT' | 'T') {
  const id = await uid()
  unwrap(
    await client().from('map_actions').insert({
      match_id: matchId,
      team_id: teamId,
      actor_id: id,
      step: 1,
      action: 'side',
      side,
    }),
  )
}

export async function liveServer(matchId: string, serverInfo: string) {
  unwrap(await client().from('matches').update({ server_info: serverInfo }).eq('id', matchId))
}

export async function liveReport(
  matchId: string,
  teamId: string,
  homeRounds: number,
  awayRounds: number,
  file: File,
  note: string,
) {
  const id = await uid()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${matchId}/${id}/${crypto.randomUUID()}.${ext}`
  const upload = await client().storage.from('match-proof').upload(path, file, { contentType: file.type })
  if (upload.error) throw new Error(upload.error.message)
  unwrap(
    await client().from('score_reports').insert({
      match_id: matchId,
      reporter_id: id,
      team_id: teamId,
      home_rounds: homeRounds,
      away_rounds: awayRounds,
      screenshot_path: path,
      note: note.trim(),
      status: 'pending',
    }),
  )
}

export async function liveAnswerReport(reportId: string, accept: boolean) {
  unwrap(
    await client()
      .from('score_reports')
      .update({ status: accept ? 'confirmed' : 'rejected' })
      .eq('id', reportId),
  )
}

export async function liveDispute(matchId: string, reason: string) {
  const id = await uid()
  unwrap(await client().from('disputes').insert({ match_id: matchId, opened_by: id, reason: reason.trim(), status: 'open' }))
}

export async function liveForfeit(matchId: string, teamId: string, reason: string) {
  const id = await uid()
  unwrap(
    await client().from('forfeit_events').insert({
      match_id: matchId,
      team_id: teamId,
      recorded_by: id,
      reason: reason.trim() || 'Forfeit filed by coven staff.',
    }),
  )
}

export async function liveThread(boardId: string, title: string, body: string) {
  const id = await uid()
  unwrap(await client().from('forum_threads').insert({ board_id: boardId, author_id: id, title: title.trim(), body: body.trim() }))
}

export async function liveReply(threadId: string, body: string) {
  const id = await uid()
  unwrap(await client().from('forum_replies').insert({ thread_id: threadId, author_id: id, body: body.trim() }))
}

export async function liveTicket(subject: string, body: string) {
  const id = await uid()
  const inserted = unwrap(
    await client().from('tickets').insert({ author_id: id, subject: subject.trim(), status: 'open' }).select('id').single(),
  )
  const ticket = inserted as { id: string }
  unwrap(await client().from('ticket_messages').insert({ ticket_id: ticket.id, author_id: id, body: body.trim() }))
}

export async function liveTicketReply(ticketId: string, body: string) {
  const id = await uid()
  unwrap(await client().from('ticket_messages').insert({ ticket_id: ticketId, author_id: id, body: body.trim() }))
}

export async function liveSeasonStatus(seasonId: string, status: SeasonStatus) {
  unwrap(await client().from('seasons').update({ status }).eq('id', seasonId))
}

export async function liveRegistrationStatus(registrationId: string, status: 'approved' | 'rejected' | 'pending') {
  unwrap(await client().from('registrations').update({ status }).eq('id', registrationId))
}

export async function liveCreateMatch(input: {
  seasonId: string
  divisionId: string
  divisionName: string
  week: number
  slot: number
  homeTeamId: string
  awayTeamId: string
  scheduledAt: string
}) {
  const code = `${input.divisionName.toLowerCase()}-${input.week}-${input.slot}-${crypto.randomUUID().slice(0, 4)}`
  unwrap(
    await client().from('matches').insert({
      code,
      season_id: input.seasonId,
      division_id: input.divisionId,
      stage: 'regular',
      week: input.week,
      slot: input.slot,
      round_name: `Week ${input.week}`,
      home_team_id: input.homeTeamId,
      away_team_id: input.awayTeamId,
      scheduled_at: new Date(input.scheduledAt).toISOString(),
      status: 'scheduled',
    }),
  )
}

export async function liveOverride(matchId: string, homeRounds: number, awayRounds: number, winnerId: string, resolution: string) {
  const id = await uid()
  unwrap(
    await client()
      .from('matches')
      .update({
        home_rounds: homeRounds,
        away_rounds: awayRounds,
        winner_team_id: winnerId,
        forfeit_team_id: null,
        status: 'completed',
      })
      .eq('id', matchId),
  )
  await client().from('score_reports').update({ status: 'superseded' }).eq('match_id', matchId).eq('status', 'pending')
  await client()
    .from('disputes')
    .update({
      status: 'resolved',
      resolution: resolution.trim() || 'Steward override.',
      resolved_by: id,
      resolved_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('status', 'open')
}

export async function liveBan(profileId: string, reason: string, endsAt: string | null) {
  const id = await uid()
  unwrap(
    await client().from('bans').insert({
      profile_id: profileId,
      issued_by: id,
      reason: reason.trim(),
      ends_at: endsAt,
    }),
  )
}

export async function liveLiftBan(banId: string) {
  unwrap(await client().from('bans').update({ lifted_at: new Date().toISOString() }).eq('id', banId))
}

export async function liveSaveNews(input: {
  id?: string
  title: string
  excerpt: string
  body: string
  published: boolean
}) {
  const id = await uid()
  if (input.id) {
    unwrap(
      await client()
        .from('news_posts')
        .update({
          title: input.title.trim(),
          excerpt: input.excerpt.trim(),
          body: input.body.trim(),
          published: input.published,
          published_at: input.published ? new Date().toISOString() : null,
        })
        .eq('id', input.id),
    )
    return
  }
  unwrap(
    await client().from('news_posts').insert({
      slug: slugify(input.title) || `note-${crypto.randomUUID().slice(0, 6)}`,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      body: input.body.trim(),
      author_id: id,
      published: input.published,
      published_at: input.published ? new Date().toISOString() : null,
    }),
  )
}

export async function liveLockSeeds(
  divisionId: string,
  pairs: { id: string; home: string; away: string }[],
) {
  for (const pair of pairs) {
    unwrap(
      await client().from('matches').update({ home_team_id: pair.home, away_team_id: pair.away }).eq('id', pair.id),
    )
  }
  void divisionId
}

export async function liveTicketStatus(ticketId: string, status: 'open' | 'waiting' | 'resolved') {
  unwrap(await client().from('tickets').update({ status }).eq('id', ticketId))
}

export async function proofUrl(path: string | null) {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('http') || path.startsWith('blob:')) return path
  if (!supabase) return null
  const signed = await supabase.storage.from('match-proof').createSignedUrl(path, 60 * 30)
  return signed.data?.signedUrl ?? null
}

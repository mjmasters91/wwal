import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as demo from './demo'
import type { Bundle } from './mock'
import { DEMO_STORAGE_KEY, buildBundle, loadBundle } from './mock'
import * as live from './live'
import { standingsFor } from './standings'
import { configError, demoMode, supabase } from './supabase'
import { EMPTY_DATA, type LeagueData, type Profile, type Result, type Role, type SeasonStatus } from './types'

type NewsInput = { id?: string; title: string; excerpt: string; body: string; published: boolean }

type LeagueContextValue = {
  mode: 'demo' | 'live'
  ready: boolean
  error: string | null
  data: LeagueData
  me: Profile | null
  signIn: (email: string, password: string) => Promise<Result>
  signUp: (input: { email: string; password: string; username: string; displayName: string }) => Promise<Result>
  signOut: () => Promise<Result>
  updateProfile: (input: { display_name: string; bio: string; steam_name: string }) => Promise<Result>
  createTeam: (input: { name: string; tag: string; motto: string; about: string; accent: string }) => Promise<Result>
  updateTeam: (teamId: string, input: { motto: string; about: string; accent: string }) => Promise<Result>
  invite: (teamId: string, username: string) => Promise<Result>
  answerInvite: (inviteId: string, accept: boolean) => Promise<Result>
  revokeInvite: (inviteId: string) => Promise<Result>
  setRole: (teamId: string, profileId: string, role: Role) => Promise<Result>
  removeMember: (teamId: string, profileId: string) => Promise<Result>
  registerTeam: (divisionId: string, note: string) => Promise<Result>
  propose: (matchId: string, when: string, message: string) => Promise<Result>
  answerProposal: (proposalId: string, accept: boolean) => Promise<Result>
  banMap: (matchId: string, mapName: string) => Promise<Result>
  pickSide: (matchId: string, side: 'CT' | 'T') => Promise<Result>
  setServer: (matchId: string, info: string) => Promise<Result>
  reportScore: (matchId: string, home: number, away: number, file: File | null, note: string) => Promise<Result>
  answerReport: (reportId: string, accept: boolean) => Promise<Result>
  dispute: (matchId: string, reason: string) => Promise<Result>
  forfeit: (matchId: string, teamId: string, reason: string) => Promise<Result>
  postThread: (boardId: string, title: string, body: string) => Promise<Result>
  replyThread: (threadId: string, body: string) => Promise<Result>
  openTicket: (subject: string, body: string) => Promise<Result>
  replyTicket: (ticketId: string, body: string) => Promise<Result>
  setSeasonStatus: (seasonId: string, status: SeasonStatus) => Promise<Result>
  setRegistration: (registrationId: string, status: 'approved' | 'rejected' | 'pending') => Promise<Result>
  createMatch: (input: { divisionId: string; week: number; homeTeamId: string; awayTeamId: string; scheduledAt: string }) => Promise<Result>
  overrideResult: (matchId: string, home: number, away: number, resolution: string) => Promise<Result>
  banPlayer: (username: string, reason: string, endsAt: string | null) => Promise<Result>
  liftBan: (banId: string) => Promise<Result>
  saveNews: (input: NewsInput) => Promise<Result>
  lockSeeds: (divisionId: string) => Promise<Result>
  setTicketStatus: (ticketId: string, status: 'open' | 'waiting' | 'resolved') => Promise<Result>
  resetDemo: () => void
}

const LeagueContext = createContext<LeagueContextValue | null>(null)

function persist(bundle: Bundle) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(bundle))
  } catch {
    const slim: Bundle = {
      ...bundle,
      data: {
        ...bundle.data,
        score_reports: bundle.data.score_reports.map((report) =>
          report.screenshot_path?.startsWith('data:') ? { ...report, screenshot_path: null } : report,
        ),
      },
    }
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(slim))
    } catch {
      /* The ledger still works for this page view. */
    }
  }
}

async function readFile(file: File) {
  if (file.size > 1_500_000) throw new Error('Demo mode keeps proof under 1.5 MB.')
  const data = await file.arrayBuffer()
  const bytes = new Uint8Array(data)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  const type = file.type || 'image/png'
  return `data:${type};base64,${btoa(binary)}`
}

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<Bundle>(() => (demoMode ? loadBundle() : { data: EMPTY_DATA, emails: {}, passwords: {}, meId: null }))
  const [ready, setReady] = useState(demoMode && !configError)
  const [error, setError] = useState<string | null>(configError)

  const reload = async () => {
    const loaded = await live.loadLeague()
    setBundle({ data: loaded.data, emails: {}, passwords: {}, meId: loaded.meId })
    setReady(true)
    setError(null)
  }

  useEffect(() => {
    if (demoMode || !supabase) return
    let cancel = false
    void reload().catch((err: unknown) => {
      if (!cancel) {
        setError(err instanceof Error ? err.message : 'The ledger could not be opened.')
        setReady(true)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void reload().catch(() => undefined)
    })
    return () => {
      cancel = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const apply = (run: () => demo.Outcome): Result => {
    const outcome = run()
    if (outcome.result.ok) {
      setBundle(outcome.bundle)
      persist(outcome.bundle)
    }
    return outcome.result
  }

  const runLive = async (fn: () => Promise<void>): Promise<Result> => {
    try {
      await fn()
      await reload()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'The book refused that.' }
    }
  }

  const me = useMemo(
    () => bundle.data.profiles.find((profile) => profile.id === bundle.meId) ?? null,
    [bundle],
  )

  const value: LeagueContextValue = {
    mode: demoMode ? 'demo' : 'live',
    ready,
    error,
    data: bundle.data,
    me,
    signIn: (email, password) =>
      demoMode ? Promise.resolve(apply(() => demo.demoSignIn(bundle, email, password))) : runLive(() => live.liveSignIn(email, password)),
    signUp: (input) =>
      demoMode ? Promise.resolve(apply(() => demo.demoSignUp(bundle, input))) : runLive(() => live.liveSignUp(input)),
    signOut: () => (demoMode ? Promise.resolve(apply(() => demo.demoSignOut(bundle))) : runLive(() => live.liveSignOut())),
    updateProfile: (input) =>
      demoMode ? Promise.resolve(apply(() => demo.demoUpdateProfile(bundle, input))) : runLive(() => live.liveUpdateProfile(input)),
    createTeam: (input) =>
      demoMode ? Promise.resolve(apply(() => demo.demoCreateTeam(bundle, input))) : runLive(() => live.liveCreateTeam(input)),
    updateTeam: (teamId, input) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoUpdateTeam(bundle, teamId, input)))
        : runLive(() => live.liveUpdateTeam(teamId, input)),
    invite: async (teamId, username) => {
      if (demoMode) return apply(() => demo.demoInvite(bundle, teamId, username))
      const target = bundle.data.profiles.find((p) => p.username.toLowerCase() === username.trim().toLowerCase())
      if (!target) return { ok: false, error: 'No player by that username.' }
      return runLive(() => live.liveInvite(teamId, target.id))
    },
    answerInvite: (inviteId, accept) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoAnswerInvite(bundle, inviteId, accept)))
        : runLive(() => live.liveAnswerInvite(inviteId, accept)),
    revokeInvite: (inviteId) =>
      demoMode ? Promise.resolve(apply(() => demo.demoRevokeInvite(bundle, inviteId))) : runLive(() => live.liveRevokeInvite(inviteId)),
    setRole: (teamId, profileId, role) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoSetRole(bundle, teamId, profileId, role)))
        : runLive(() => live.liveSetRole(teamId, profileId, role)),
    removeMember: (teamId, profileId) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoRemoveMember(bundle, teamId, profileId)))
        : runLive(() => live.liveRemoveMember(teamId, profileId)),
    registerTeam: (divisionId, note) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoRegister(bundle, divisionId, note)))
      const division = bundle.data.divisions.find((d) => d.id === divisionId)
      const mine = bundle.data.team_members.find((m) => m.profile_id === bundle.meId)
      if (!division || !mine) return Promise.resolve({ ok: false as const, error: 'Pick a division from a coven you staff.' })
      return runLive(() => live.liveRegister(division.season_id, divisionId, mine.team_id, note))
    },
    propose: (matchId, when, message) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoPropose(bundle, matchId, when, message)))
      const match = bundle.data.matches.find((m) => m.id === matchId)
      const staff = bundle.data.team_members.find(
        (m) =>
          m.profile_id === bundle.meId &&
          (m.role === 'captain' || m.role === 'officer') &&
          (m.team_id === match?.home_team_id || m.team_id === match?.away_team_id),
      )
      if (!staff) return Promise.resolve({ ok: false as const, error: 'Only coven staff can propose a time.' })
      return runLive(() => live.livePropose(matchId, staff.team_id, when, message))
    },
    answerProposal: (proposalId, accept) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoAnswerProposal(bundle, proposalId, accept)))
        : runLive(() => live.liveAnswerProposal(proposalId, accept)),
    banMap: (matchId, mapName) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoBanMap(bundle, matchId, mapName)))
      const match = bundle.data.matches.find((m) => m.id === matchId)
      const bans = bundle.data.map_actions.filter((a) => a.match_id === matchId && a.action === 'ban')
      const expected = bans.length % 2 === 0 ? match?.home_team_id : match?.away_team_id
      if (!expected) return Promise.resolve({ ok: false as const, error: 'Both covens have to be seated first.' })
      return runLive(() => live.liveBanMap(matchId, expected, mapName))
    },
    pickSide: (matchId, side) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoPickSide(bundle, matchId, side)))
      const match = bundle.data.matches.find((m) => m.id === matchId)
      if (!match?.home_team_id) return Promise.resolve({ ok: false as const, error: 'Home coven is missing.' })
      return runLive(() => live.livePickSide(matchId, match.home_team_id!, side))
    },
    setServer: (matchId, info) =>
      demoMode ? Promise.resolve(apply(() => demo.demoServer(bundle, matchId, info))) : runLive(() => live.liveServer(matchId, info)),
    reportScore: async (matchId, home, away, file, note) => {
      if (!file) return { ok: false, error: 'Attach a screenshot of the scoreboard.' }
      if (demoMode) {
        try {
          const screenshot = await readFile(file)
          return apply(() => demo.demoReport(bundle, matchId, home, away, screenshot, note))
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Could not read that file.' }
        }
      }
      const match = bundle.data.matches.find((m) => m.id === matchId)
      const staff = bundle.data.team_members.find(
        (m) =>
          m.profile_id === bundle.meId &&
          (m.role === 'captain' || m.role === 'officer') &&
          (m.team_id === match?.home_team_id || m.team_id === match?.away_team_id),
      )
      if (!staff) return { ok: false, error: 'Only coven staff can file a score.' }
      return runLive(() => live.liveReport(matchId, staff.team_id, home, away, file, note))
    },
    answerReport: (reportId, accept) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoAnswerReport(bundle, reportId, accept)))
        : runLive(() => live.liveAnswerReport(reportId, accept)),
    dispute: (matchId, reason) =>
      demoMode ? Promise.resolve(apply(() => demo.demoDispute(bundle, matchId, reason))) : runLive(() => live.liveDispute(matchId, reason)),
    forfeit: (matchId, teamId, reason) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoForfeit(bundle, matchId, teamId, reason)))
        : runLive(() => live.liveForfeit(matchId, teamId, reason)),
    postThread: (boardId, title, body) =>
      demoMode ? Promise.resolve(apply(() => demo.demoThread(bundle, boardId, title, body))) : runLive(() => live.liveThread(boardId, title, body)),
    replyThread: (threadId, body) =>
      demoMode ? Promise.resolve(apply(() => demo.demoReply(bundle, threadId, body))) : runLive(() => live.liveReply(threadId, body)),
    openTicket: (subject, body) =>
      demoMode ? Promise.resolve(apply(() => demo.demoTicket(bundle, subject, body))) : runLive(() => live.liveTicket(subject, body)),
    replyTicket: (ticketId, body) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoTicketReply(bundle, ticketId, body)))
        : runLive(() => live.liveTicketReply(ticketId, body)),
    setSeasonStatus: (seasonId, status) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoSeasonStatus(bundle, seasonId, status)))
        : runLive(() => live.liveSeasonStatus(seasonId, status)),
    setRegistration: (registrationId, status) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoRegistrationStatus(bundle, registrationId, status)))
        : runLive(() => live.liveRegistrationStatus(registrationId, status)),
    createMatch: (input) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoCreateMatch(bundle, input)))
      const division = bundle.data.divisions.find((d) => d.id === input.divisionId)
      if (!division) return Promise.resolve({ ok: false as const, error: 'Pick a division.' })
      const slot =
        bundle.data.matches
          .filter((m) => m.division_id === division.id && m.week === input.week)
          .reduce((max, match) => Math.max(max, match.slot), 0) + 1
      return runLive(() =>
        live.liveCreateMatch({
          seasonId: division.season_id,
          divisionId: division.id,
          divisionName: division.name,
          week: input.week,
          slot,
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
          scheduledAt: input.scheduledAt,
        }),
      )
    },
    overrideResult: (matchId, home, away, resolution) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoOverride(bundle, matchId, home, away, resolution)))
      const match = bundle.data.matches.find((m) => m.id === matchId)
      if (!match?.home_team_id || !match.away_team_id) {
        return Promise.resolve({ ok: false as const, error: 'Both covens have to be seated.' })
      }
      const winner = home > away ? match.home_team_id : match.away_team_id
      return runLive(() => live.liveOverride(matchId, home, away, winner, resolution))
    },
    banPlayer: (username, reason, endsAt) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoBanPlayer(bundle, username, reason, endsAt)))
      const target = bundle.data.profiles.find((p) => p.username.toLowerCase() === username.trim().toLowerCase())
      if (!target) return Promise.resolve({ ok: false as const, error: 'No player by that username.' })
      return runLive(() => live.liveBan(target.id, reason, endsAt))
    },
    liftBan: (banId) =>
      demoMode ? Promise.resolve(apply(() => demo.demoLiftBan(bundle, banId))) : runLive(() => live.liveLiftBan(banId)),
    saveNews: (input) =>
      demoMode ? Promise.resolve(apply(() => demo.demoSaveNews(bundle, input))) : runLive(() => live.liveSaveNews(input)),
    lockSeeds: (divisionId) => {
      if (demoMode) return Promise.resolve(apply(() => demo.demoLockSeeds(bundle, divisionId)))
      return runLive(async () => {
        const division = bundle.data.divisions.find((d) => d.id === divisionId)
        if (!division) throw new Error('Division not found.')
        const seeds = standingsFor(bundle.data, divisionId)
          .filter((row) => row.place != null)
          .slice(0, division.playoff_slots)
        const playoff = bundle.data.matches.filter((m) => m.division_id === divisionId && m.stage === 'playoff')
        const semis = playoff.filter((m) => m.round_name === 'Semifinal').sort((a, b) => a.slot - b.slot)
        const final = playoff.find((m) => m.round_name === 'Final')
        const pairs: { id: string; home: string; away: string }[] = []
        if (semis.length >= 2 && seeds.length >= 4) {
          pairs.push({ id: semis[0].id, home: seeds[0].team.id, away: seeds[3].team.id })
          pairs.push({ id: semis[1].id, home: seeds[1].team.id, away: seeds[2].team.id })
        } else if (final && seeds.length >= 2) {
          pairs.push({ id: final.id, home: seeds[0].team.id, away: seeds[1].team.id })
        }
        await live.liveLockSeeds(divisionId, pairs)
      })
    },
    setTicketStatus: (ticketId, status) =>
      demoMode
        ? Promise.resolve(apply(() => demo.demoSetTicketStatus(bundle, ticketId, status)))
        : runLive(() => live.liveTicketStatus(ticketId, status)),
    resetDemo: () => {
      if (!demoMode) return
      localStorage.removeItem(DEMO_STORAGE_KEY)
      const next = buildBundle()
      setBundle(next)
    },
  }

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
}

export function useLeague() {
  const ctx = useContext(LeagueContext)
  if (!ctx) throw new Error('useLeague must be used inside LeagueProvider')
  return ctx
}

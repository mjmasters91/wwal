export type Role = 'captain' | 'officer' | 'player'
export type SeasonStatus = 'draft' | 'registration' | 'regular' | 'playoffs' | 'completed'
export type DivisionName = 'Apex' | 'Challenger' | 'Contender' | 'Open'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'
export type MatchStatus = 'scheduled' | 'veto' | 'reported' | 'disputed' | 'forfeit' | 'completed'
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked'
export type ProposalStatus = 'pending' | 'accepted' | 'declined'
export type ReportStatus = 'pending' | 'confirmed' | 'rejected' | 'superseded'
export type DisputeStatus = 'open' | 'resolved' | 'dismissed'
export type TicketStatus = 'open' | 'waiting' | 'resolved'

export type Profile = {
  id: string
  username: string
  display_name: string
  bio: string
  steam_name: string
  region: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  name: string
  tag: string
  slug: string
  motto: string
  about: string
  accent: string
  region: string
  created_by: string
  created_at: string
  updated_at: string
}

export type TeamMember = {
  team_id: string
  profile_id: string
  role: Role
  joined_at: string
}

export type TeamInvite = {
  id: string
  team_id: string
  inviter_id: string
  invitee_id: string
  status: InviteStatus
  created_at: string
  responded_at: string | null
}

export type Season = {
  id: string
  name: string
  slug: string
  region: 'NA'
  status: SeasonStatus
  starts_on: string
  weeks: number
  summary: string
  created_at: string
}

export type Division = {
  id: string
  season_id: string
  name: DivisionName
  tier: number
  playoff_slots: number
  blurb: string
}

export type Registration = {
  id: string
  season_id: string
  division_id: string
  team_id: string
  status: RegistrationStatus
  registered_by: string
  note: string
  created_at: string
}

export type Match = {
  id: string
  code: string
  season_id: string
  division_id: string
  stage: 'regular' | 'playoff'
  week: number | null
  slot: number
  round_name: string
  home_team_id: string | null
  away_team_id: string | null
  scheduled_at: string | null
  status: MatchStatus
  server_info: string
  played_map: string | null
  ct_team_id: string | null
  home_rounds: number | null
  away_rounds: number | null
  winner_team_id: string | null
  forfeit_team_id: string | null
  advances_to: string | null
  advances_as: 'home' | 'away' | null
  created_at: string
  updated_at: string
}

export type MapAction = {
  id: string
  match_id: string
  team_id: string
  actor_id: string
  step: number
  action: 'ban' | 'side'
  map_name: string | null
  side: 'CT' | 'T' | null
  created_at: string
}

export type RescheduleProposal = {
  id: string
  match_id: string
  proposed_by: string
  proposed_by_team: string
  proposed_time: string
  message: string
  status: ProposalStatus
  created_at: string
}

export type ScoreReport = {
  id: string
  match_id: string
  reporter_id: string
  team_id: string
  home_rounds: number
  away_rounds: number
  screenshot_path: string | null
  note: string
  status: ReportStatus
  created_at: string
}

export type Dispute = {
  id: string
  match_id: string
  opened_by: string
  reason: string
  status: DisputeStatus
  resolution: string
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}

export type ForfeitEvent = {
  id: string
  match_id: string
  team_id: string
  recorded_by: string
  reason: string
  created_at: string
}

export type NewsPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  author_id: string
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ForumBoard = {
  id: string
  slug: string
  name: string
  description: string
  sort_order: number
}

export type ForumThread = {
  id: string
  board_id: string
  author_id: string
  title: string
  body: string
  pinned: boolean
  locked: boolean
  created_at: string
}

export type ForumReply = {
  id: string
  thread_id: string
  author_id: string
  body: string
  created_at: string
}

export type Ticket = {
  id: string
  author_id: string
  subject: string
  status: TicketStatus
  created_at: string
  updated_at: string
}

export type TicketMessage = {
  id: string
  ticket_id: string
  author_id: string
  body: string
  created_at: string
}

export type Ban = {
  id: string
  profile_id: string
  issued_by: string
  reason: string
  ends_at: string | null
  created_at: string
  lifted_at: string | null
}

export type LeagueData = {
  profiles: Profile[]
  teams: Team[]
  team_members: TeamMember[]
  team_invites: TeamInvite[]
  seasons: Season[]
  divisions: Division[]
  registrations: Registration[]
  matches: Match[]
  map_actions: MapAction[]
  reschedule_proposals: RescheduleProposal[]
  score_reports: ScoreReport[]
  disputes: Dispute[]
  forfeit_events: ForfeitEvent[]
  news_posts: NewsPost[]
  forum_boards: ForumBoard[]
  forum_threads: ForumThread[]
  forum_replies: ForumReply[]
  tickets: Ticket[]
  ticket_messages: TicketMessage[]
  bans: Ban[]
}

export type Result = { ok: true } | { ok: false; error: string }

export const EMPTY_DATA: LeagueData = {
  profiles: [],
  teams: [],
  team_members: [],
  team_invites: [],
  seasons: [],
  divisions: [],
  registrations: [],
  matches: [],
  map_actions: [],
  reschedule_proposals: [],
  score_reports: [],
  disputes: [],
  forfeit_events: [],
  news_posts: [],
  forum_boards: [],
  forum_threads: [],
  forum_replies: [],
  tickets: [],
  ticket_messages: [],
  bans: [],
}

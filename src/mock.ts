import { ACTIVE_DUTY, scoreboardSvg } from './format'
import { standingsFor } from './standings'
import type {
  Ban,
  Dispute,
  Division,
  DivisionName,
  ForfeitEvent,
  ForumBoard,
  ForumReply,
  ForumThread,
  LeagueData,
  MapAction,
  Match,
  MatchStatus,
  NewsPost,
  Profile,
  Registration,
  RescheduleProposal,
  Role,
  ScoreReport,
  Team,
  TeamMember,
  Ticket,
  TicketMessage,
} from './types'

export const DEMO_PASSWORD = 'ashen-oath'
export const DEMO_STORAGE_KEY = 'wwal-demo-v1'
export const FEATURED_MATCH = 'apex-4-1'

export type DemoAccount = { email: string; username: string; note: string }

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'sender@wwal.league', username: 'Sender', note: 'Steward' },
  { email: 'marrow@wwal.league', username: 'Marrow', note: 'Captain, Coven of Ash' },
  { email: 'gilt@wwal.league', username: 'Gilt', note: 'Captain, Gilded Sigil' },
  { email: 'cinder@wwal.league', username: 'Cinder', note: 'Captain, Emberquill' },
  { email: 'pond@wwal.league', username: 'Pond', note: 'Captain, Pondwitch Union' },
]

type MemberSeed = [username: string, role: Role, bio: string]

type TeamSeed = {
  slug: string
  name: string
  tag: string
  accent: string
  motto: string
  about: string
  division: DivisionName
  members: MemberSeed[]
}

const TEAMS: TeamSeed[] = [
  {
    slug: 'coven-of-ash',
    name: 'Coven of Ash',
    tag: 'ASH',
    accent: '#d4655d',
    motto: 'We burn the clock, not the roster.',
    about: 'A four-stack from the river towns who treat defaults like liturgy and late rounds like a debt.',
    division: 'Apex',
    members: [
      ['Marrow', 'captain', 'Calls the slow round and means it. Keeps the Ash book in a real notebook.'],
      ['Quill', 'officer', 'Second voice. Writes the defaults down so nobody invents a new one on pistol.'],
      ['Sable', 'player', 'Holds the sites other covens give away, then pretends it was nothing.'],
      ['Ivy', 'player', 'Lurks less than the demos suggest. Trades on time.'],
    ],
  },
  {
    slug: 'gilded-sigil',
    name: 'Gilded Sigil',
    tag: 'GILD',
    accent: '#e6c56a',
    motto: 'Gold is just a color we answer to.',
    about: 'Showmatch manners and ladder patience. Their mid-round does not panic when the trade is late.',
    division: 'Apex',
    members: [
      ['Gilt', 'captain', 'Talks softly until the retake, then talks once.'],
      ['Lumen', 'officer', 'Utility caller. Counts smokes out loud so the rest of them do not have to.'],
      ['Cass', 'player', 'Opens sites and does not narrate them afterwards.'],
      ['Briony', 'player', 'Anchor who would rather save the rifle than the pride.'],
    ],
  },
  {
    slug: 'nightglass',
    name: 'Nightglass',
    tag: 'NG',
    accent: '#8eb4ff',
    motto: 'See it late. Call it once.',
    about: 'A late-round coven. They give map control on purpose and are annoying about being right.',
    division: 'Apex',
    members: [
      ['Vesper', 'captain', 'Prefers a 3v3 to a 5v4 if the rifles are the right ones.'],
      ['Nox', 'officer', 'Keeps the veto card. Does not romanticize Cache.'],
      ['Pell', 'player', 'Entry who waits for the actual flash.'],
      ['Orla', 'player', 'Closes rounds that were supposed to be lost.'],
    ],
  },
  {
    slug: 'thornhex',
    name: 'Thornhex',
    tag: 'THX',
    accent: '#5ee0cb',
    motto: 'Nothing pretty grows without a point.',
    about: 'Aggressive takes, short memories, and a captain who keeps both from becoming a habit.',
    division: 'Apex',
    members: [
      ['Briar', 'captain', 'Will take the fight and then explain why it was the default.'],
      ['Hexa', 'officer', 'Schedules the week. Answers tickets faster than the stewards some nights.'],
      ['Rue', 'player', 'Lives in the contact duel and is honest about the ones lost.'],
      ['Camber', 'player', 'Support who still has a rifle at the end of the half.'],
    ],
  },
  {
    slug: 'moonwell-vanguard',
    name: 'Moonwell Vanguard',
    tag: 'MWV',
    accent: '#d7c4ff',
    motto: 'Hold the well. Trade the rest.',
    about: 'Utility first, and stubborn about the retake they already practiced on Tuesday.',
    division: 'Apex',
    members: [
      ['Selune', 'captain', 'Draws the round before the freeze ends. Sometimes the drawing is right.'],
      ['Well', 'officer', 'Names the player, not the feeling.'],
      ['Arden', 'player', 'Holds angles that look empty until they are not.'],
      ['Pico', 'player', 'Fifth player who refuses to play like a substitute.'],
    ],
  },
  {
    slug: 'emberquill',
    name: 'Emberquill',
    tag: 'EQ',
    accent: '#ff8a4c',
    motto: 'Write it down before it goes out.',
    about: 'Young aim and older excuses. Two forfeits already, and the quiet list is not a rumor to them.',
    division: 'Apex',
    members: [
      ['Cinder', 'captain', 'Still showing up. That is the whole commendation and the whole warning.'],
      ['Quilla', 'officer', 'Sends the reschedule before the anger does.'],
      ['Ashen', 'player', 'Can win a duel and lose the round telling you about it.'],
      ['Moth', 'player', 'New to the roster. Learning which defaults are actually called.'],
    ],
  },
  {
    slug: 'starwell-circle',
    name: 'Starwell Circle',
    tag: 'STAR',
    accent: '#f0d9ff',
    motto: 'Five players, one orbit.',
    about: 'Challenger regulars who scrim more than they post and would like that noted.',
    division: 'Challenger',
    members: [
      ['Astra', 'captain', 'Keeps the circle on one plan for the whole half.'],
      ['Coil', 'officer', 'Veto partner. Bans Nuke without apologizing.'],
      ['Nyx', 'player', 'Late lurk, early trade.'],
      ['Pim', 'player', 'Support who remembers the second flash.'],
    ],
  },
  {
    slug: 'rune-and-ruin',
    name: 'Rune & Ruin',
    tag: 'RUIN',
    accent: '#c9b59a',
    motto: 'Old calls, new ruins.',
    about: 'A rebuilt roster with one caller and three players who have decided to trust the call.',
    division: 'Challenger',
    members: [
      ['Rune', 'captain', 'Rebuilt the coven in September and has not changed the name.'],
      ['Ruin', 'officer', 'The other half of the name. Plays like the first half is listening.'],
      ['Keel', 'player', 'Anchor. Does not chase.'],
      ['Dara', 'player', 'Entry who asks before the contact, which is rarer than it should be.'],
    ],
  },
  {
    slug: 'hexlantern',
    name: 'Hexlantern',
    tag: 'HEX',
    accent: '#ffd27a',
    motto: 'Light the angle, then the fight.',
    about: 'Fast defaults and slower tempers. They light the angle and then they wait.',
    division: 'Challenger',
    members: [
      ['Lantern', 'captain', 'Will not take a fight the flash did not pay for.'],
      ['Wick', 'officer', 'Handles the server sheet and the mood.'],
      ['Soot', 'player', 'Closes. Rarely first.'],
      ['Gale', 'player', 'Wide player who comes back when called, which is the job.'],
    ],
  },
  {
    slug: 'velvet-pyre',
    name: 'Velvet Pyre',
    tag: 'VEL',
    accent: '#e28bb8',
    motto: 'Soft hands, loud rounds.',
    about: 'Contact play, and a bad habit of winning the anti-eco too loudly in the thread afterwards.',
    division: 'Challenger',
    members: [
      ['Velvet', 'captain', 'Calls contact and then lives with it.'],
      ['Pyre', 'officer', 'The loud half. Posts the round, not the excuse.'],
      ['Moss', 'player', 'Lurk who is occasionally on time.'],
      ['Juniper', 'player', 'Rifle first. Pistol when the book says so.'],
    ],
  },
  {
    slug: 'saltcircle',
    name: 'Saltcircle',
    tag: 'SALT',
    accent: '#9fd7e8',
    motto: 'Draw the ring. Stay inside it.',
    about: 'A Contender coven that draws a ring around the bomb and then has the discipline to stay there.',
    division: 'Contender',
    members: [
      ['Salt', 'captain', 'Draws the ring. Gets cross when someone leaves it for a hero duel.'],
      ['Brine', 'officer', 'Schedules, bans, and does not editorialize.'],
      ['Kelp', 'player', 'Holds the close angle.'],
      ['Ness', 'player', 'Fifth. Reliable on Thursdays, which is when it counts.'],
    ],
  },
  {
    slug: 'iron-familiar',
    name: 'Iron Familiar',
    tag: 'IRON',
    accent: '#c5c1b8',
    motto: 'The pet does the trading.',
    about: 'Trades first, names second. The familiar is a joke. The crossfire is not.',
    division: 'Contender',
    members: [
      ['Iron', 'captain', 'Wants the trade before the frag.'],
      ['Familiar', 'officer', 'Answers to the joke and to the mid round.'],
      ['Anvil', 'player', 'Does not peek twice.'],
      ['Pip', 'player', 'Youngest on the roster. Already tired of being called young.'],
    ],
  },
  {
    slug: 'bramble-court',
    name: 'Bramble Court',
    tag: 'BRAM',
    accent: '#8fbf7a',
    motto: 'Let them push. The hedge holds.',
    about: 'Happy to give map control if the retake was the plan they wrote down.',
    division: 'Contender',
    members: [
      ['Bramble', 'captain', 'Gives space on purpose and says so before the round.'],
      ['Court', 'officer', 'Keeps the hedge, which is their word for the crossfire.'],
      ['Thorn', 'player', 'Punishes the player who forgot the crossfire.'],
      ['Liss', 'player', 'Support. Saves more rounds than the scoreboard admits.'],
    ],
  },
  {
    slug: 'low-lantern',
    name: 'Low Lantern',
    tag: 'LOW',
    accent: '#f0a36b',
    motto: 'We play under the light, not in it.',
    about: 'Evening scrims, morning jobs, and a Thursday night that is treated as sacred.',
    division: 'Contender',
    members: [
      ['Low', 'captain', 'Will reschedule once, politely, and not a second time.'],
      ['Wicklow', 'officer', 'Makes sure Thursday stays Thursday.'],
      ['Fern', 'player', 'Quiet entry.'],
      ['Hap', 'player', 'The one who remembers to ready up.'],
    ],
  },
  {
    slug: 'pondwitch-union',
    name: 'Pondwitch Union',
    tag: 'POND',
    accent: '#6fbfa8',
    motto: 'Three forfeits and the pond goes still.',
    about: 'Open division, and then the quiet list. The stewards pulled the rest of their slate after the third forfeit.',
    division: 'Open',
    members: [
      ['Pond', 'captain', 'Has the roster and not the calendar. The book noticed.'],
      ['Reed', 'officer', 'Tried to file the second forfeit as a disconnect. It was not.'],
      ['Toad', 'player', 'Still wants to play the weeks that were cancelled.'],
      ['Minnow', 'player', 'Newest player. Joined the week of the third forfeit.'],
    ],
  },
  {
    slug: 'glass-cat',
    name: 'Glass Cat',
    tag: 'GLAS',
    accent: '#d5e2ff',
    motto: 'Nine lives, thirteen rounds.',
    about: 'The cleanest Open roster, and they know the table says so without being asked.',
    division: 'Open',
    members: [
      ['Glass', 'captain', 'Plays the percentage and posts the demo without a speech.'],
      ['Catmint', 'officer', 'Veto is a hobby. Winning is the point.'],
      ['Shard', 'player', 'Entry with a short memory, which helps.'],
      ['Pounce', 'player', 'Closes rounds that Glass has already decided.'],
    ],
  },
  {
    slug: 'second-broom',
    name: 'Second Broom',
    tag: 'BRM',
    accent: '#e7d3a1',
    motto: 'Sweep mid, then the site.',
    about: 'They sweep mid and then argue, briefly, about who sweeps next. The argument ends before the buy.',
    division: 'Open',
    members: [
      ['Broom', 'captain', 'Sweeps mid. Lets someone else take the credit if the round works.'],
      ['Sweep', 'officer', 'The argument, usually. Also the flash.'],
      ['Dusty', 'player', 'Holds after the sweep.'],
      ['Cob', 'player', 'Fifth. On time, which in Open is a skill.'],
    ],
  },
  {
    slug: 'kitchen-hex',
    name: 'Kitchen Hex',
    tag: 'KIT',
    accent: '#f2b8a0',
    motto: 'Dinner can wait. The execute cannot.',
    about: 'A friends group that learned the veto by losing it, then learned the retake on purpose.',
    division: 'Open',
    members: [
      ['Kitchen', 'captain', 'Calls the execute at twenty seconds and not at five.'],
      ['Ladle', 'officer', 'Keeps the friends group from becoming five solo queues.'],
      ['Spoon', 'player', 'Trades Kitchen, which is the arrangement.'],
      ['Crumb', 'player', 'Lurk. Occasionally the reason the execute works.'],
    ],
  },
]

const STAMP = '2026-10-18T18:00:00-04:00'

function uid(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function at(date: string, hour: number, minute: number) {
  const month = Number(date.slice(5, 7))
  const offset = month < 11 ? '-04:00' : '-05:00'
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${date}T${hh}:${mm}:00${offset}`
}

const WEEK_TUESDAY = [
  '2026-10-27',
  '2026-11-03',
  '2026-11-10',
  '2026-11-24',
  '2026-12-01',
  '2026-12-08',
  '2026-12-15',
]

function kickoff(week: number, slot: number) {
  const base = new Date(`${WEEK_TUESDAY[week - 1]}T12:00:00Z`)
  const extra = slot <= 2 ? 0 : slot <= 4 ? 1 : 2
  base.setUTCDate(base.getUTCDate() + extra)
  const date = base.toISOString().slice(0, 10)
  const hour = slot % 2 === 1 ? 20 : 21
  const minute = slot % 2 === 1 ? 0 : 30
  return at(date, hour, minute)
}

type ApexSpec = {
  week: number
  slot: number
  home: number
  away: number
  status: MatchStatus
  hr?: number
  ar?: number
  map?: string
  forfeit?: 'home' | 'away'
  server?: string
}

const APEX: ApexSpec[] = [
  { week: 1, slot: 1, home: 0, away: 1, status: 'completed', hr: 13, ar: 7, map: 'Mirage' },
  { week: 1, slot: 2, home: 2, away: 3, status: 'completed', hr: 13, ar: 11, map: 'Inferno' },
  { week: 1, slot: 3, home: 4, away: 5, status: 'completed', hr: 13, ar: 9, map: 'Ancient' },
  { week: 1, slot: 4, home: 0, away: 2, status: 'completed', hr: 13, ar: 5, map: 'Nuke' },
  { week: 1, slot: 5, home: 1, away: 4, status: 'completed', hr: 13, ar: 10, map: 'Anubis' },
  { week: 1, slot: 6, home: 3, away: 5, status: 'completed', hr: 13, ar: 6, map: 'Dust II' },
  { week: 2, slot: 1, home: 0, away: 3, status: 'completed', hr: 13, ar: 8, map: 'Cache' },
  { week: 2, slot: 2, home: 1, away: 2, status: 'completed', hr: 13, ar: 11, map: 'Mirage' },
  { week: 2, slot: 3, home: 4, away: 5, status: 'completed', hr: 13, ar: 11, map: 'Inferno' },
  { week: 2, slot: 4, home: 0, away: 4, status: 'completed', hr: 13, ar: 9, map: 'Ancient' },
  { week: 2, slot: 5, home: 1, away: 5, status: 'forfeit', forfeit: 'away' },
  { week: 2, slot: 6, home: 2, away: 3, status: 'completed', hr: 13, ar: 10, map: 'Nuke' },
  { week: 3, slot: 1, home: 1, away: 0, status: 'completed', hr: 13, ar: 10, map: 'Dust II' },
  { week: 3, slot: 2, home: 2, away: 5, status: 'completed', hr: 13, ar: 7, map: 'Cache' },
  { week: 3, slot: 3, home: 3, away: 4, status: 'completed', hr: 13, ar: 11, map: 'Mirage' },
  { week: 3, slot: 4, home: 0, away: 5, status: 'forfeit', forfeit: 'away' },
  { week: 3, slot: 5, home: 1, away: 3, status: 'completed', hr: 13, ar: 8, map: 'Inferno' },
  { week: 3, slot: 6, home: 2, away: 4, status: 'completed', hr: 13, ar: 9, map: 'Anubis' },
  {
    week: 4,
    slot: 1,
    home: 0,
    away: 1,
    status: 'veto',
    server: 'connect 151.80.22.14:27015; password oath-week4\nGOTV 151.80.22.14:27020',
  },
  {
    week: 4,
    slot: 2,
    home: 2,
    away: 3,
    status: 'reported',
    map: 'Mirage',
    server: 'connect 151.80.22.18:27015; password nightglass\nGOTV 151.80.22.18:27020',
  },
  { week: 4, slot: 3, home: 4, away: 5, status: 'disputed', map: 'Inferno' },
  { week: 4, slot: 4, home: 0, away: 5, status: 'scheduled' },
  { week: 4, slot: 5, home: 1, away: 3, status: 'scheduled' },
  { week: 4, slot: 6, home: 2, away: 4, status: 'scheduled' },
  { week: 5, slot: 1, home: 0, away: 3, status: 'scheduled' },
  { week: 5, slot: 2, home: 1, away: 2, status: 'scheduled' },
  { week: 5, slot: 3, home: 4, away: 5, status: 'scheduled' },
  { week: 5, slot: 4, home: 0, away: 4, status: 'scheduled' },
  { week: 5, slot: 5, home: 1, away: 5, status: 'scheduled' },
  { week: 5, slot: 6, home: 2, away: 3, status: 'scheduled' },
  { week: 6, slot: 1, home: 0, away: 2, status: 'scheduled' },
  { week: 6, slot: 2, home: 1, away: 4, status: 'scheduled' },
  { week: 6, slot: 3, home: 3, away: 5, status: 'scheduled' },
  { week: 6, slot: 4, home: 0, away: 5, status: 'scheduled' },
  { week: 6, slot: 5, home: 1, away: 3, status: 'scheduled' },
  { week: 6, slot: 6, home: 2, away: 4, status: 'scheduled' },
  { week: 7, slot: 1, home: 0, away: 3, status: 'scheduled' },
  { week: 7, slot: 2, home: 1, away: 4, status: 'scheduled' },
  { week: 7, slot: 3, home: 2, away: 5, status: 'scheduled' },
  { week: 7, slot: 4, home: 0, away: 2, status: 'scheduled' },
  { week: 7, slot: 5, home: 1, away: 5, status: 'scheduled' },
  { week: 7, slot: 6, home: 3, away: 4, status: 'scheduled' },
]

const PAIRINGS: [number, number][][] = [
  [[0, 1], [2, 3], [0, 2], [1, 3]],
  [[0, 3], [1, 2], [0, 1], [2, 3]],
  [[0, 2], [1, 3], [0, 3], [1, 2]],
  [[1, 0], [3, 2], [2, 0], [3, 1]],
  [[0, 1], [2, 3], [1, 3], [0, 2]],
  [[0, 3], [1, 2], [2, 3], [0, 1]],
  [[0, 2], [1, 3], [3, 0], [2, 1]],
]

export type Bundle = {
  data: LeagueData
  emails: Record<string, string>
  passwords: Record<string, string>
  meId: string | null
}

export function buildBundle(): Bundle {
  let seq = 1000
  const id = () => uid(seq++)
  const profiles: Profile[] = []
  const emails: Record<string, string> = {}
  const passwords: Record<string, string> = {}

  const addProfile = (username: string, display: string, bio: string, admin = false) => {
    const pid = username === 'Sender' ? uid(1) : username === 'Sootfinger' ? uid(2) : id()
    const email = `${username.toLowerCase()}@wwal.league`
    const profile: Profile = {
      id: pid,
      username,
      display_name: display,
      bio,
      steam_name: username.toLowerCase(),
      region: 'NA',
      is_admin: admin,
      created_at: STAMP,
      updated_at: STAMP,
    }
    profiles.push(profile)
    emails[pid] = email
    passwords[pid] = DEMO_PASSWORD
    return profile
  }

  const sender = addProfile(
    'Sender',
    'Sender',
    'Steward of the Wizard & Witch Amateur League. Keeps the book, the bans, and the Tuesday server sheet. Does not play.',
    true,
  )
  addProfile(
    'Sootfinger',
    'Sootfinger',
    'Suspended from the Hall and from the queue. The ban is public on purpose.',
  )

  const teams: Team[] = []
  const members: TeamMember[] = []
  const bySlug = new Map<string, Team>()

  for (const seed of TEAMS) {
    const people = seed.members.map(([username, role, bio]) => ({
      role,
      profile: addProfile(username, username, bio),
    }))
    const captain = people[0].profile
    const team: Team = {
      id: id(),
      name: seed.name,
      tag: seed.tag,
      slug: seed.slug,
      motto: seed.motto,
      about: seed.about,
      accent: seed.accent,
      region: 'NA',
      created_by: captain.id,
      created_at: STAMP,
      updated_at: STAMP,
    }
    teams.push(team)
    bySlug.set(seed.slug, team)
    for (const person of people) {
      members.push({
        team_id: team.id,
        profile_id: person.profile.id,
        role: person.role,
        joined_at: STAMP,
      })
    }
  }

  const seasonId = uid(201)
  const divisionMeta: { name: DivisionName; tier: number; slots: number; blurb: string }[] = [
    { name: 'Apex', tier: 1, slots: 4, blurb: 'The sharpest six covens in the oath. Four of them advance.' },
    { name: 'Challenger', tier: 2, slots: 2, blurb: 'Proven lineups. The playoff line is two, and it is not a courtesy.' },
    { name: 'Contender', tier: 3, slots: 2, blurb: 'A full season for covens who already have a default and a fifth.' },
    { name: 'Open', tier: 4, slots: 2, blurb: 'New rosters, borrowed ideas, and no apology for either. Three forfeits and you go quiet.' },
  ]
  const divisions: Division[] = divisionMeta.map((meta, index) => ({
    id: uid(301 + index),
    season_id: seasonId,
    name: meta.name,
    tier: meta.tier,
    playoff_slots: meta.slots,
    blurb: meta.blurb,
  }))
  const divisionByName = new Map(divisions.map((d) => [d.name, d]))

  const registrations: Registration[] = teams.map((team) => {
    const seed = TEAMS.find((t) => t.slug === team.slug)!
    const division = divisionByName.get(seed.division)!
    return {
      id: id(),
      season_id: seasonId,
      division_id: division.id,
      team_id: team.id,
      status: 'approved',
      registered_by: team.created_by,
      note: '',
      created_at: '2026-10-20T15:00:00-04:00',
    }
  })

  const matches: Match[] = []
  const forfeits: ForfeitEvent[] = []
  const reports: ScoreReport[] = []
  const disputes: Dispute[] = []
  const actions: MapAction[] = []
  const proposals: RescheduleProposal[] = []

  const pushMatch = (partial: Omit<Match, 'created_at' | 'updated_at' | 'id'> & { id?: string }): Match => {
    const match: Match = {
      id: partial.id ?? id(),
      created_at: STAMP,
      updated_at: STAMP,
      ...partial,
    }
    matches.push(match)
    return match
  }

  const apexTeams = TEAMS.filter((t) => t.division === 'Apex').map((t) => bySlug.get(t.slug)!)
  const apex = divisionByName.get('Apex')!
  for (const spec of APEX) {
    const home = apexTeams[spec.home]
    const away = apexTeams[spec.away]
    const forfeited = spec.status === 'forfeit'
    const winner = forfeited
      ? spec.forfeit === 'home'
        ? away.id
        : home.id
      : spec.status === 'completed'
        ? (spec.hr ?? 0) > (spec.ar ?? 0)
          ? home.id
          : away.id
        : null
    const forfeitTeam = forfeited ? (spec.forfeit === 'home' ? home.id : away.id) : null
    const match = pushMatch({
      code: `apex-${spec.week}-${spec.slot}`,
      season_id: seasonId,
      division_id: apex.id,
      stage: 'regular',
      week: spec.week,
      slot: spec.slot,
      round_name: `Week ${spec.week}`,
      home_team_id: home.id,
      away_team_id: away.id,
      scheduled_at: kickoff(spec.week, spec.slot),
      status: spec.status,
      server_info: spec.server ?? '',
      played_map: spec.map ?? null,
      ct_team_id: spec.status === 'completed' ? home.id : null,
      home_rounds: forfeited ? 0 : (spec.hr ?? null),
      away_rounds: forfeited ? 0 : (spec.ar ?? null),
      winner_team_id: winner,
      forfeit_team_id: forfeitTeam,
      advances_to: null,
      advances_as: null,
    })
    if (forfeitTeam) {
      const captain = profiles.find((p) => p.id === (forfeitTeam === home.id ? home.created_by : away.created_by))!
      forfeits.push({
        id: id(),
        match_id: match.id,
        team_id: forfeitTeam,
        recorded_by: captain.id,
        reason: 'No five at the scheduled time. Booked as a forfeit, not a disconnect.',
        created_at: match.scheduled_at ?? STAMP,
      })
    }
    if (spec.status === 'completed' && spec.hr != null && spec.ar != null && spec.map) {
      reports.push({
        id: id(),
        match_id: match.id,
        reporter_id: home.created_by,
        team_id: home.id,
        home_rounds: spec.hr,
        away_rounds: spec.ar,
        screenshot_path: scoreboardSvg(home.tag, away.tag, spec.hr, spec.ar, spec.map),
        note: '',
        status: 'confirmed',
        created_at: match.scheduled_at ?? STAMP,
      })
    }
  }

  const lower = (name: DivisionName, prefix: string) => {
    const division = divisionByName.get(name)!
    const group = TEAMS.filter((t) => t.division === name).map((t) => bySlug.get(t.slug)!)
    for (let week = 1; week <= 7; week += 1) {
      PAIRINGS[week - 1].forEach(([homeIndex, awayIndex], slotIndex) => {
        const home = group[homeIndex]
        const away = group[awayIndex]
        const slot = slotIndex + 1
        const done = week <= 2
        const upset = (week + slot) % 5 === 0
        const winnerIsHome = upset ? homeIndex > awayIndex : homeIndex < awayIndex
        const loserRounds = 4 + ((week * 3 + slot * 2) % 8)
        const hr = done ? (winnerIsHome ? 13 : loserRounds) : null
        const ar = done ? (winnerIsHome ? loserRounds : 13) : null
        pushMatch({
          code: `${prefix}-${week}-${slot}`,
          season_id: seasonId,
          division_id: division.id,
          stage: 'regular',
          week,
          slot,
          round_name: `Week ${week}`,
          home_team_id: home.id,
          away_team_id: away.id,
          scheduled_at: kickoff(week, slot),
          status: done ? 'completed' : 'scheduled',
          server_info: '',
          played_map: done ? ACTIVE_DUTY[(week + slot) % ACTIVE_DUTY.length] : null,
          ct_team_id: done ? home.id : null,
          home_rounds: hr,
          away_rounds: ar,
          winner_team_id: done ? (winnerIsHome ? home.id : away.id) : null,
          forfeit_team_id: null,
          advances_to: null,
          advances_as: null,
        })
      })
    }
  }
  lower('Challenger', 'challenger')
  lower('Contender', 'contender')

  const open = divisionByName.get('Open')!
  const pond = bySlug.get('pondwitch-union')!
  const glass = bySlug.get('glass-cat')!
  const broom = bySlug.get('second-broom')!
  const kitchen = bySlug.get('kitchen-hex')!
  const openSpecs: ApexSpec[] = [
    { week: 1, slot: 1, home: 1, away: 0, status: 'forfeit', forfeit: 'away' },
    { week: 1, slot: 2, home: 2, away: 3, status: 'completed', hr: 13, ar: 8, map: 'Dust II' },
    { week: 1, slot: 3, home: 2, away: 0, status: 'forfeit', forfeit: 'away' },
    { week: 1, slot: 4, home: 1, away: 3, status: 'completed', hr: 13, ar: 10, map: 'Inferno' },
    { week: 2, slot: 1, home: 3, away: 0, status: 'forfeit', forfeit: 'away' },
    { week: 2, slot: 2, home: 1, away: 2, status: 'completed', hr: 13, ar: 7, map: 'Mirage' },
    { week: 2, slot: 3, home: 2, away: 3, status: 'completed', hr: 13, ar: 9, map: 'Ancient' },
    { week: 3, slot: 1, home: 1, away: 3, status: 'scheduled' },
    { week: 3, slot: 2, home: 2, away: 1, status: 'scheduled' },
    { week: 4, slot: 1, home: 3, away: 2, status: 'scheduled' },
    { week: 4, slot: 2, home: 1, away: 2, status: 'scheduled' },
  ]
  const openTeams = [pond, glass, broom, kitchen]
  for (const spec of openSpecs) {
    const home = openTeams[spec.home]
    const away = openTeams[spec.away]
    const forfeited = spec.status === 'forfeit'
    const match = pushMatch({
      code: `open-${spec.week}-${spec.slot}`,
      season_id: seasonId,
      division_id: open.id,
      stage: 'regular',
      week: spec.week,
      slot: spec.slot,
      round_name: `Week ${spec.week}`,
      home_team_id: home.id,
      away_team_id: away.id,
      scheduled_at: kickoff(spec.week, spec.slot),
      status: spec.status,
      server_info: '',
      played_map: spec.map ?? null,
      ct_team_id: spec.status === 'completed' ? home.id : null,
      home_rounds: forfeited ? 0 : (spec.hr ?? null),
      away_rounds: forfeited ? 0 : (spec.ar ?? null),
      winner_team_id: forfeited
        ? spec.forfeit === 'home'
          ? away.id
          : home.id
        : spec.status === 'completed'
          ? (spec.hr ?? 0) > (spec.ar ?? 0)
            ? home.id
            : away.id
          : null,
      forfeit_team_id: forfeited ? (spec.forfeit === 'home' ? home.id : away.id) : null,
      advances_to: null,
      advances_as: null,
    })
    if (forfeited) {
      forfeits.push({
        id: id(),
        match_id: match.id,
        team_id: pond.id,
        recorded_by: pond.created_by,
        reason: 'Pondwitch did not field five. Counted toward the quiet list.',
        created_at: match.scheduled_at ?? STAMP,
      })
    }
  }

  const bracketFor = (division: Division, prefix: string) => {
    if (division.playoff_slots >= 4) {
      const finalId = id()
      pushMatch({
        code: `${prefix}-sf-1`,
        season_id: seasonId,
        division_id: division.id,
        stage: 'playoff',
        week: null,
        slot: 1,
        round_name: 'Semifinal',
        home_team_id: null,
        away_team_id: null,
        scheduled_at: at('2026-12-22', 20, 0),
        status: 'scheduled',
        server_info: '',
        played_map: null,
        ct_team_id: null,
        home_rounds: null,
        away_rounds: null,
        winner_team_id: null,
        forfeit_team_id: null,
        advances_to: finalId,
        advances_as: 'home',
      })
      pushMatch({
        code: `${prefix}-sf-2`,
        season_id: seasonId,
        division_id: division.id,
        stage: 'playoff',
        week: null,
        slot: 2,
        round_name: 'Semifinal',
        home_team_id: null,
        away_team_id: null,
        scheduled_at: at('2026-12-22', 21, 30),
        status: 'scheduled',
        server_info: '',
        played_map: null,
        ct_team_id: null,
        home_rounds: null,
        away_rounds: null,
        winner_team_id: null,
        forfeit_team_id: null,
        advances_to: finalId,
        advances_as: 'away',
      })
      pushMatch({
        id: finalId,
        code: `${prefix}-final`,
        season_id: seasonId,
        division_id: division.id,
        stage: 'playoff',
        week: null,
        slot: 3,
        round_name: 'Final',
        home_team_id: null,
        away_team_id: null,
        scheduled_at: at('2026-12-23', 20, 0),
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
      })
    } else {
      pushMatch({
        code: `${prefix}-final`,
        season_id: seasonId,
        division_id: division.id,
        stage: 'playoff',
        week: null,
        slot: 1,
        round_name: 'Final',
        home_team_id: null,
        away_team_id: null,
        scheduled_at: at('2026-12-22', 20, 0),
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
      })
    }
  }
  bracketFor(apex, 'apex')
  bracketFor(divisionByName.get('Challenger')!, 'challenger')
  bracketFor(divisionByName.get('Contender')!, 'contender')
  bracketFor(open, 'open')

  const featured = matches.find((m) => m.code === FEATURED_MATCH)!
  const ash = bySlug.get('coven-of-ash')!
  const gild = bySlug.get('gilded-sigil')!
  const vetoBans: [string, string, string][] = [
    [ash.id, ash.created_by, 'Ancient'],
    [gild.id, gild.created_by, 'Nuke'],
    [ash.id, ash.created_by, 'Dust II'],
  ]
  vetoBans.forEach(([teamId, actorId, map], index) => {
    actions.push({
      id: id(),
      match_id: featured.id,
      team_id: teamId,
      actor_id: actorId,
      step: index + 1,
      action: 'ban',
      map_name: map,
      side: null,
      created_at: '2026-11-24T18:00:00-05:00',
    })
  })
  proposals.push({
    id: id(),
    match_id: featured.id,
    proposed_by: gild.created_by,
    proposed_by_team: gild.id,
    proposed_time: at('2026-11-27', 21, 0),
    message: 'Friday at 9pm ET. Our fifth is on a shift Thursday and we would rather play five than file a forfeit.',
    status: 'pending',
    created_at: '2026-11-23T22:10:00-05:00',
  })

  const reported = matches.find((m) => m.code === 'apex-4-2')!
  const night = bySlug.get('nightglass')!
  reports.push({
    id: id(),
    match_id: reported.id,
    reporter_id: night.created_by,
    team_id: night.id,
    home_rounds: 13,
    away_rounds: 11,
    screenshot_path: scoreboardSvg('NG', 'THX', 13, 11, 'Mirage'),
    note: 'Regulation. Last round was theirs on B, then we closed A.',
    status: 'pending',
    created_at: '2026-11-24T23:40:00-05:00',
  })

  const disputed = matches.find((m) => m.code === 'apex-4-3')!
  const moon = bySlug.get('moonwell-vanguard')!
  const ember = bySlug.get('emberquill')!
  reports.push({
    id: id(),
    match_id: disputed.id,
    reporter_id: moon.created_by,
    team_id: moon.id,
    home_rounds: 13,
    away_rounds: 6,
    screenshot_path: scoreboardSvg('MWV', 'EQ', 13, 6, 'Inferno'),
    note: 'They left after the second half pistol. We finished the map.',
    status: 'pending',
    created_at: '2026-11-24T22:05:00-05:00',
  })
  disputes.push({
    id: id(),
    match_id: disputed.id,
    opened_by: ember.created_by,
    reason:
      'Our fifth dropped at 7–3 and the other coven kept playing. We asked for a pause. The scoreboard they filed is not a match we agreed to finish.',
    status: 'open',
    resolution: '',
    resolved_by: null,
    created_at: '2026-11-24T22:20:00-05:00',
    resolved_at: null,
  })

  const news: NewsPost[] = [
    {
      id: id(),
      slug: 'ashen-oath-opens',
      title: 'The Ashen Oath is open',
      excerpt: 'Eighteen covens, four divisions, and a seven-week book. Season I starts in North America and stays there.',
      body: `The Wizard & Witch Amateur League is not a ladder you grind alone. It is a schedule, a veto, and a steward who answers the ticket.\n\nSeason I is called the Ashen Oath. Registration closed with eighteen covens across Open, Contender, Challenger, and Apex. Every coven plays two best-of-ones a week for seven weeks. Then the playoff line becomes a bracket.\n\nNorth America is the only region on the book. A second region will have to earn a steward of its own.\n\nIf your coven is in, the match room is the place. Server lines, the veto seal, and the score all live there. The Hall is for everything that is not a ruling.`,
      author_id: sender.id,
      published: true,
      published_at: '2026-10-20T12:00:00-04:00',
      created_at: '2026-10-20T12:00:00-04:00',
      updated_at: '2026-10-20T12:00:00-04:00',
    },
    {
      id: id(),
      slug: 'how-the-veto-seal-works',
      title: 'How the veto seal works',
      excerpt: 'Six bans, one map left standing, and the home coven chooses the side they open on.',
      body: `The active pool this season is Ancient, Anubis, Cache, Dust II, Inferno, Mirage, and Nuke. That is the whole list. Nothing else can be sealed.\n\nHome bans first. The covens alternate until six maps are gone. The map still standing is the map. Home then chooses the side they will open on, CT or T.\n\nYou do not discuss a gentleman's agreement in the ticket afterwards. If both captains want a different map, they can say so before the first ban. Once a ban is on the seal, it stays.`,
      author_id: sender.id,
      published: true,
      published_at: '2026-10-22T12:00:00-04:00',
      created_at: '2026-10-22T12:00:00-04:00',
      updated_at: '2026-10-22T12:00:00-04:00',
    },
    {
      id: id(),
      slug: 'quiet-list',
      title: 'The quiet list, explained',
      excerpt: 'Three forfeits and a coven is inactive. They stay on the table. They leave the playoff line.',
      body: `A forfeit is a loss with no rounds attached. It does not pad anyone's round difference, and it does count.\n\nThree forfeits in the regular season and the coven is marked inactive. Inactive covens stay visible. They are sorted under the playoff line and they cannot be seeded.\n\nPondwitch Union reached the list in week two. The rest of their Open slate was pulled. That is the rule working, not a scandal. If your fifth cannot make Thursdays, say so before the third time.`,
      author_id: sender.id,
      published: true,
      published_at: '2026-11-12T12:00:00-05:00',
      created_at: '2026-11-12T12:00:00-05:00',
      updated_at: '2026-11-12T12:00:00-05:00',
    },
    {
      id: id(),
      slug: 'week-four-note',
      title: 'Week four: Apex is a one-match room',
      excerpt: 'Coven of Ash and Gilded Sigil meet again with the veto still open. Both sit at five and one.',
      body: `After three weeks the top of Apex is a tie. Coven of Ash and Gilded Sigil are both five and one, and they play each other Tuesday with the seal still open.\n\nNightglass have a score in against Thornhex, waiting on confirmation. Moonwell and Emberquill are in a dispute. Stewards are on the ticket desk until midnight Eastern.\n\nThe playoff line in Apex is four. Nobody below it is eliminated. Everybody above it should stop reading the table like a trophy.`,
      author_id: sender.id,
      published: true,
      published_at: '2026-11-24T15:00:00-05:00',
      created_at: '2026-11-24T15:00:00-05:00',
      updated_at: '2026-11-24T15:00:00-05:00',
    },
  ]

  const hall: ForumBoard = {
    id: uid(401),
    slug: 'hall',
    name: 'The Hall',
    description: 'Schedule chatter, introductions, and anything a steward might need to see.',
    sort_order: 1,
  }
  const workshop: ForumBoard = {
    id: uid(402),
    slug: 'workshop',
    name: 'The Workshop',
    description: 'Defaults and veto talk. Keep the lineups your own.',
    sort_order: 2,
  }

  const threadServer: ForumThread = {
    id: id(),
    board_id: hall.id,
    author_id: sender.id,
    title: 'Week four server sheet',
    body: 'Apex Tuesday is on the 151.80.22.14 box. Passwords live in the match room, not in this thread. If the box dies, file a ticket. Do not pick a new server and hope.',
    pinned: true,
    locked: false,
    created_at: '2026-11-23T16:00:00-05:00',
  }
  const threadPond: ForumThread = {
    id: id(),
    board_id: hall.id,
    author_id: glass.created_by,
    title: 'Pondwitch and the quiet list',
    body: 'Asking here so it is not a private argument. Once a coven is inactive, do the wins we already took against them stay on our book? We are not trying to get them kicked further. We just want the table to mean one thing.',
    pinned: false,
    locked: false,
    created_at: '2026-11-13T19:12:00-05:00',
  }
  const threadAncient: ForumThread = {
    id: id(),
    board_id: workshop.id,
    author_id: ash.created_by,
    title: 'Defaulting Ancient when you are opening T',
    body: 'We stopped taking mid as a group of five. Two go, the other three wait for the call, and the call is either ramp or the donut contact. It is not clever. It is just the version we stop losing. If your coven opens Ancient differently I would like the shape, not a demo link with seventeen timestamps.',
    pinned: false,
    locked: false,
    created_at: '2026-11-18T21:04:00-05:00',
  }
  const replies: ForumReply[] = [
    {
      id: id(),
      thread_id: threadServer.id,
      author_id: gild.created_by,
      body: 'Got the password from the room. Fifth is a maybe for Thursday, proposal is in the match.',
      created_at: '2026-11-23T22:12:00-05:00',
    },
    {
      id: id(),
      thread_id: threadPond.id,
      author_id: sender.id,
      body: 'They stay. A forfeit is a loss for them and a win for you, with no rounds added. Inactive only changes seeding. It does not rewrite the weeks already played.',
      created_at: '2026-11-13T20:01:00-05:00',
    },
    {
      id: id(),
      thread_id: threadAncient.id,
      author_id: night.created_by,
      body: 'We do the opposite. Give mid, take the ramp contact late, and live with the save if the contact is bad. Your version sounds like more rifles at the end of the half, which is the part we are bad at.',
      created_at: '2026-11-19T00:40:00-05:00',
    },
  ]

  const ticket: Ticket = {
    id: id(),
    author_id: ash.created_by,
    subject: 'GOTV password on the Tuesday box',
    status: 'waiting',
    created_at: '2026-11-24T19:12:00-05:00',
    updated_at: '2026-11-24T19:40:00-05:00',
  }
  const ticketOld: Ticket = {
    id: id(),
    author_id: broom.created_by,
    subject: 'Open week one was listed twice',
    status: 'resolved',
    created_at: '2026-10-28T18:02:00-04:00',
    updated_at: '2026-10-28T19:15:00-04:00',
  }
  const messages: TicketMessage[] = [
    {
      id: id(),
      ticket_id: ticket.id,
      author_id: ash.created_by,
      body: 'The connect line in our match room works. GOTV asks for a password the room does not list. We have a coach who needs the feed, not a sixth player.',
      created_at: '2026-11-24T19:12:00-05:00',
    },
    {
      id: id(),
      ticket_id: ticket.id,
      author_id: sender.id,
      body: 'GOTV password is the same as the server password this week. I will add that line to the room so the next coven does not have to ask.',
      created_at: '2026-11-24T19:40:00-05:00',
    },
    {
      id: id(),
      ticket_id: ticketOld.id,
      author_id: broom.created_by,
      body: 'The schedule showed Second Broom against Kitchen Hex on Tuesday and again on Tuesday. We played it once.',
      created_at: '2026-10-28T18:02:00-04:00',
    },
    {
      id: id(),
      ticket_id: ticketOld.id,
      author_id: sender.id,
      body: 'Duplicate row removed. The played map stands. Sorry for the double listing.',
      created_at: '2026-10-28T19:15:00-04:00',
    },
  ]

  const soot = profiles.find((p) => p.username === 'Sootfinger')!
  const bans: Ban[] = [
    {
      id: id(),
      profile_id: soot.id,
      issued_by: sender.id,
      reason: 'Repeated slurs in the Hall after a warning. Suspended through the end of the regular season.',
      ends_at: '2026-12-20T23:59:00-05:00',
      created_at: '2026-11-02T15:00:00-05:00',
      lifted_at: null,
    },
  ]

  const data: LeagueData = {
    profiles,
    teams,
    team_members: members,
    team_invites: [],
    seasons: [
      {
        id: seasonId,
        name: 'Season I — The Ashen Oath',
        slug: 'ashen-oath',
        region: 'NA',
        status: 'regular',
        starts_on: '2026-10-27',
        weeks: 7,
        summary:
          'Seven weeks, two best-of-ones a week, then a bracket. North America only, until the stewards can keep a second region honest.',
        created_at: '2026-10-01T12:00:00-04:00',
      },
    ],
    divisions,
    registrations,
    matches,
    map_actions: actions,
    reschedule_proposals: proposals,
    score_reports: reports,
    disputes,
    forfeit_events: forfeits,
    news_posts: news,
    forum_boards: [hall, workshop],
    forum_threads: [threadServer, threadPond, threadAncient],
    forum_replies: replies,
    tickets: [ticket, ticketOld],
    ticket_messages: messages,
    bans,
  }

  audit(data)
  return { data, emails, passwords, meId: null }
}

function audit(data: LeagueData) {
  const apex = data.divisions.find((d) => d.name === 'Apex')
  if (!apex) throw new Error('Apex missing')
  const table = standingsFor(data, apex.id)
  const row = (tag: string) => {
    const found = table.find((r) => r.team.tag === tag)
    if (!found) throw new Error(`${tag} missing from Apex`)
    return found
  }
  const ash = row('ASH')
  const gild = row('GILD')
  const eq = row('EQ')
  if (ash.wins !== 5 || ash.losses !== 1) throw new Error(`ASH ${ash.wins}-${ash.losses}`)
  if (gild.wins !== 5 || gild.losses !== 1) throw new Error(`GILD ${gild.wins}-${gild.losses}`)
  if (eq.forfeits !== 2 || eq.wins !== 0) throw new Error(`EQ ${eq.wins}-${eq.losses} ff ${eq.forfeits}`)
  const open = data.divisions.find((d) => d.name === 'Open')
  if (!open) throw new Error('Open missing')
  const pond = standingsFor(data, open.id).find((r) => r.team.tag === 'POND')
  if (!pond?.inactive || pond.forfeits < 3) throw new Error('Pondwitch should be inactive')
  if (!data.matches.some((m) => m.code === FEATURED_MATCH && m.status === 'veto')) {
    throw new Error('Featured veto match missing')
  }
}

export function loadBundle(): Bundle {
  const fresh = () => buildBundle()
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) {
      const params = new URLSearchParams(window.location.search)
      const bundle = fresh()
      return applyAs(bundle, params.get('as'))
    }
    const parsed = JSON.parse(raw) as Bundle
    if (!parsed?.data?.seasons?.length || !parsed.passwords) return applyAs(fresh(), null)
    const params = new URLSearchParams(window.location.search)
    return applyAs(parsed, params.get('as'))
  } catch {
    return fresh()
  }
}

function applyAs(bundle: Bundle, as: string | null): Bundle {
  if (!as) return bundle
  const profile = bundle.data.profiles.find((p) => p.username.toLowerCase() === as.toLowerCase())
  if (!profile) return bundle
  return { ...bundle, meId: profile.id }
}

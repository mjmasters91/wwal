import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FormError, PageHead } from '../components/ui'
import { formatWhen } from '../format'
import { useLeague } from '../league'
import { DEMO_PASSWORD } from '../mock'
import { profileById, teamById } from '../select'
import { currentSeason, divisionsInOrder } from '../standings'
import type { SeasonStatus } from '../types'

const TABS = ['Season', 'Pairings', 'Results', 'Bans', 'News'] as const

export function Admin() {
  const league = useLeague()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Season')
  const [error, setError] = useState<string | null>(null)
  const season = currentSeason(league.data)

  if (!league.me?.is_admin) {
    return (
      <div className="wrap page narrow">
        <div className="sealed">
          <p className="kicker">Stewards</p>
          <h1>The desk is sealed</h1>
          <p>Admin power is the is_admin flag on a profile. The client cannot grant it. Sender keeps this desk.</p>
          {league.mode === 'demo' ? (
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                void league.signIn('sender@wwal.league', DEMO_PASSWORD)
              }}
            >
              Enter as Sender
            </button>
          ) : (
            <Link className="btn btn-gold" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </div>
    )
  }

  async function run(action: Promise<{ ok: boolean; error?: string }>) {
    const result = await action
    setError(result.ok ? null : result.error ?? 'Refused.')
  }

  return (
    <div className="wrap page">
      <PageHead kicker="Stewards" title={`Desk of ${league.me.display_name}`} lede="Seasons, pairings, overrides, bans, and the ledger. Every write is checked against the admin flag in the database." />
      <div className="tab-row" role="tablist">
        {TABS.map((item) => (
          <button key={item} type="button" className={item === tab ? 'active' : undefined} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      <FormError message={error} />
      {tab === 'Season' && season ? <SeasonDesk seasonId={season.id} onError={setError} run={run} /> : null}
      {tab === 'Pairings' ? <Pairings run={run} /> : null}
      {tab === 'Results' ? <Results run={run} /> : null}
      {tab === 'Bans' ? <Bans run={run} /> : null}
      {tab === 'News' ? <NewsDesk run={run} /> : null}
    </div>
  )
}

function SeasonDesk({
  seasonId,
  run,
}: {
  seasonId: string
  onError: (value: string | null) => void
  run: (action: Promise<{ ok: boolean; error?: string }>) => Promise<void>
}) {
  const { data, setSeasonStatus, setRegistration, lockSeeds } = useLeague()
  const season = data.seasons.find((item) => item.id === seasonId)!
  const divisions = divisionsInOrder(data, season.id)
  const pending = data.registrations.filter((row) => row.season_id === season.id && row.status === 'pending')
  return (
    <div className="admin-grid">
      <section className="panel">
        <h2>{season.name}</h2>
        <p>{season.summary}</p>
        <label className="field">
          Status
          <select
            value={season.status}
            onChange={(event) => void run(setSeasonStatus(season.id, event.target.value as SeasonStatus))}
          >
            {(['draft', 'registration', 'regular', 'playoffs', 'completed'] as SeasonStatus[]).map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <ul className="plain-list">
          {divisions.map((division) => (
            <li key={division.id}>
              <span>
                {division.name} · line {division.playoff_slots}
              </span>
              <button type="button" className="btn btn-tiny" onClick={() => void run(lockSeeds(division.id))}>
                Lock seeds
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2>Petitions</h2>
        {pending.length ? (
          pending.map((row) => (
            <div key={row.id} className="admin-row">
              <span>
                {teamById(data, row.team_id)?.name} → {data.divisions.find((d) => d.id === row.division_id)?.name}
              </span>
              <span className="row">
                <button type="button" className="btn btn-tiny btn-gold" onClick={() => void run(setRegistration(row.id, 'approved'))}>
                  Approve
                </button>
                <button type="button" className="btn btn-tiny" onClick={() => void run(setRegistration(row.id, 'rejected'))}>
                  Reject
                </button>
              </span>
            </div>
          ))
        ) : (
          <p className="note">No petitions waiting. Approved covens are already on the tables.</p>
        )}
      </section>
    </div>
  )
}

function Pairings({ run }: { run: (action: Promise<{ ok: boolean; error?: string }>) => Promise<void> }) {
  const { data, createMatch } = useLeague()
  const season = currentSeason(data)
  const divisions = season ? divisionsInOrder(data, season.id) : []
  const [divisionId, setDivisionId] = useState(divisions[0]?.id ?? '')
  const [week, setWeek] = useState(4)
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [when, setWhen] = useState('2026-11-26T20:00')
  const division = divisions.find((item) => item.id === divisionId)
  const teams = data.registrations
    .filter((row) => row.division_id === divisionId && row.status === 'approved')
    .map((row) => teamById(data, row.team_id))
    .filter((team): team is NonNullable<typeof team> => Boolean(team))
  const slate = data.matches
    .filter((match) => match.division_id === divisionId && match.week === week && match.stage === 'regular')
    .sort((a, b) => a.slot - b.slot)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void run(createMatch({ divisionId, week, homeTeamId: home, awayTeamId: away, scheduledAt: when }))
  }

  return (
    <div className="admin-grid">
      <form className="panel stack" onSubmit={onSubmit}>
        <h2>Add a pairing</h2>
        <label className="field">
          Division
          <select value={divisionId} onChange={(event) => setDivisionId(event.target.value)}>
            {divisions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Week
          <input type="number" min={1} max={7} value={week} onChange={(event) => setWeek(Number(event.target.value))} />
        </label>
        <label className="field">
          Home
          <select value={home} onChange={(event) => setHome(event.target.value)} required>
            <option value="">Choose</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Away
          <select value={away} onChange={(event) => setAway(event.target.value)} required>
            <option value="">Choose</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Time
          <input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} required />
        </label>
        <button className="btn btn-gold" type="submit">
          Write the pairing
        </button>
      </form>
      <section className="panel">
        <h2>
          {division?.name} · week {week}
        </h2>
        <ul className="plain-list">
          {slate.map((match) => (
            <li key={match.id}>
              <Link to={`/matches/${match.code}`}>
                {teamById(data, match.home_team_id)?.tag ?? 'TBD'} vs {teamById(data, match.away_team_id)?.tag ?? 'TBD'}
              </Link>
              <span>{formatWhen(match.scheduled_at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Results({ run }: { run: (action: Promise<{ ok: boolean; error?: string }>) => Promise<void> }) {
  const { data, overrideResult } = useLeague()
  const rows = data.matches
    .filter((match) => ['reported', 'disputed', 'completed', 'forfeit'].includes(match.status) && match.division_id)
    .slice()
    .sort((a, b) => (b.scheduled_at ?? '').localeCompare(a.scheduled_at ?? ''))
    .slice(0, 12)
  return (
    <div className="stack">
      {rows.map((match) => (
        <OverrideRow key={match.id} matchId={match.id} run={run} override={overrideResult} />
      ))}
    </div>
  )
}

function OverrideRow({
  matchId,
  run,
  override,
}: {
  matchId: string
  run: (action: Promise<{ ok: boolean; error?: string }>) => Promise<void>
  override: (matchId: string, home: number, away: number, resolution: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const { data } = useLeague()
  const match = data.matches.find((item) => item.id === matchId)!
  const [home, setHome] = useState(String(match.home_rounds ?? 13))
  const [away, setAway] = useState(String(match.away_rounds ?? 11))
  const [resolution, setResolution] = useState('Steward override from the desk.')
  return (
    <form
      className="panel admin-row"
      onSubmit={(event) => {
        event.preventDefault()
        void run(override(match.id, Number(home), Number(away), resolution))
      }}
    >
      <div>
        <Link to={`/matches/${match.code}`}>
          {teamById(data, match.home_team_id)?.tag} vs {teamById(data, match.away_team_id)?.tag}
        </Link>
        <p className="note">
          {match.round_name} · {match.status}
        </p>
      </div>
      <label className="field slim">
        Home
        <input value={home} onChange={(event) => setHome(event.target.value)} />
      </label>
      <label className="field slim">
        Away
        <input value={away} onChange={(event) => setAway(event.target.value)} />
      </label>
      <label className="field grow">
        Resolution
        <input value={resolution} onChange={(event) => setResolution(event.target.value)} />
      </label>
      <button className="btn btn-tiny btn-gold" type="submit">
        Override
      </button>
    </form>
  )
}

function Bans({ run }: { run: (action: Promise<{ ok: boolean; error?: string }>) => Promise<void> }) {
  const { data, banPlayer, liftBan } = useLeague()
  const [username, setUsername] = useState('')
  const [reason, setReason] = useState('')
  const [length, setLength] = useState('season')
  const active = data.bans.filter((ban) => !ban.lifted_at)
  return (
    <div className="admin-grid">
      <form
        className="panel stack"
        onSubmit={(event) => {
          event.preventDefault()
          const ends =
            length === 'indefinite'
              ? null
              : length === '7'
                ? new Date(Date.now() + 7 * 86400000).toISOString()
                : length === '30'
                  ? new Date(Date.now() + 30 * 86400000).toISOString()
                  : '2026-12-20T23:59:00-05:00'
          void run(banPlayer(username, reason, ends))
        }}
      >
        <h2>Suspend a player</h2>
        <label className="field">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label className="field">
          Reason, posted on the profile
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} required />
        </label>
        <label className="field">
          Length
          <select value={length} onChange={(event) => setLength(event.target.value)}>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="season">Through the oath</option>
            <option value="indefinite">Until lifted</option>
          </select>
        </label>
        <button className="btn btn-danger" type="submit">
          Post the ban
        </button>
      </form>
      <section className="panel">
        <h2>On the book</h2>
        <ul className="plain-list">
          {active.map((ban) => (
            <li key={ban.id}>
              <div>
                <strong>{profileById(data, ban.profile_id)?.username}</strong>
                <p>{ban.reason}</p>
              </div>
              <button type="button" className="btn btn-tiny" onClick={() => void run(liftBan(ban.id))}>
                Lift
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function NewsDesk({ run }: { run: (action: Promise<{ ok: boolean; error?: string }>) => Promise<void> }) {
  const { data, saveNews } = useLeague()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [published, setPublished] = useState(true)
  const [editing, setEditing] = useState<string | undefined>(undefined)
  return (
    <div className="admin-grid">
      <form
        className="panel stack"
        onSubmit={(event) => {
          event.preventDefault()
          void run(saveNews({ id: editing, title, excerpt, body, published })).then(() => {
            setEditing(undefined)
            setTitle('')
            setExcerpt('')
            setBody('')
          })
        }}
      >
        <h2>{editing ? 'Edit note' : 'New note'}</h2>
        <label className="field">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="field">
          Excerpt
          <input value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
        </label>
        <label className="field">
          Body
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} required />
        </label>
        <label className="check">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Publish
        </label>
        <button className="btn btn-gold" type="submit">
          Save note
        </button>
      </form>
      <ul className="thread-list">
        {data.news_posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => {
                setEditing(post.id)
                setTitle(post.title)
                setExcerpt(post.excerpt)
                setBody(post.body)
                setPublished(post.published)
              }}
            >
              {post.title}
            </button>
            <span>{post.published ? 'Published' : 'Draft'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

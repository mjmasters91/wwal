import { useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormError, MatchLine, PageHead, Pill, TeamMark } from '../components/ui'
import { useLeague } from '../league'
import { isStaff, membership, profileById, roster } from '../select'
import type { Role } from '../types'

export function Teams() {
  const { data } = useLeague()
  const teams = data.teams.slice().sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="wrap page">
      <div className="section-head">
        <PageHead kicker="Covens" title="Who is fielding five" lede="Tags, mottos, and the division they petitioned. A player stands on one coven." />
        <Link className="btn btn-gold" to="/teams/new">
          Found a coven
        </Link>
      </div>
      <div className="team-grid">
        {teams.map((team) => {
          const reg = data.registrations.find((item) => item.team_id === team.id && item.status === 'approved')
          const division = data.divisions.find((item) => item.id === reg?.division_id)
          return (
            <Link key={team.id} to={`/teams/${team.slug}`} className="team-card" style={{ '--accent': team.accent } as CSSProperties}>
              <TeamMark team={team} size={44} />
              <div>
                <h2>{team.name}</h2>
                <p>{team.motto}</p>
                <em>{division ? division.name : 'Unregistered'} · {team.tag}</em>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function NewTeam() {
  const league = useLeague()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [motto, setMotto] = useState('')
  const [about, setAbout] = useState('')
  const [accent, setAccent] = useState('#e6c56a')
  const [error, setError] = useState<string | null>(null)
  const mine = membership(league.data, league.me?.id)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await league.createTeam({ name, tag, motto, about, accent })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const slug = name
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    navigate(`/teams/${slug}`)
  }

  if (!league.me) {
    return (
      <div className="wrap page narrow">
        <PageHead title="Sign in to found a coven" lede="The captain is the account that creates the page." />
        <Link className="btn btn-gold" to="/login">
          Sign in
        </Link>
      </div>
    )
  }

  if (mine) {
    return (
      <div className="wrap page narrow">
        <PageHead title="You already have a coven" lede={`${mine.team.name} has you as ${mine.member.role}. Leave it before founding another.`} />
        <Link className="btn btn-ghost" to={`/teams/${mine.team.slug}`}>
          Back to {mine.team.name}
        </Link>
      </div>
    )
  }

  return (
    <div className="wrap page narrow">
      <PageHead kicker="New coven" title="Put a name on the book" lede="You become captain. Invite the other four from the coven page." />
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          Tag
          <input value={tag} onChange={(event) => setTag(event.target.value.toUpperCase())} maxLength={5} required />
        </label>
        <label className="field">
          Motto
          <input value={motto} onChange={(event) => setMotto(event.target.value)} />
        </label>
        <label className="field">
          About
          <textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={4} />
        </label>
        <label className="field">
          Accent
          <input value={accent} onChange={(event) => setAccent(event.target.value)} type="color" />
        </label>
        <FormError message={error} />
        <button className="btn btn-gold" type="submit">
          Found it
        </button>
      </form>
    </div>
  )
}

export function TeamPage() {
  const { slug } = useParams()
  const league = useLeague()
  const team = league.data.teams.find((item) => item.slug === slug)
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [motto, setMotto] = useState(team?.motto ?? '')
  const [about, setAbout] = useState(team?.about ?? '')
  if (!team) {
    return (
      <div className="wrap page">
        <PageHead title="No coven at that address" />
      </div>
    )
  }
  const reg = league.data.registrations.find((item) => item.team_id === team.id)
  const division = league.data.divisions.find((item) => item.id === reg?.division_id)
  const staff = isStaff(league.data, team.id, league.me?.id) || Boolean(league.me?.is_admin)
  const matches = league.data.matches
    .filter((match) => match.home_team_id === team.id || match.away_team_id === team.id)
    .slice()
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))
  const invites = league.data.team_invites.filter((invite) => invite.team_id === team.id && invite.status === 'pending')

  return (
    <div className="wrap page">
      <header className="team-banner" style={{ '--accent': team.accent } as CSSProperties}>
        <TeamMark team={team} size={72} />
        <div>
          <p className="kicker">{division ? `${division.name} · ${reg?.status}` : 'Not registered'}</p>
          <h1>{team.name}</h1>
          <p className="lede">{team.motto}</p>
        </div>
      </header>
      <p className="about-copy">{team.about}</p>
      <div className="split">
        <section>
          <h2>Roster</h2>
          <ul className="roster">
            {roster(league.data, team.id).map((member) => {
              const person = profileById(league.data, member.profile_id)
              return (
                <li key={member.profile_id}>
                  <div>
                    <Link to={`/players/${person?.username}`}>{person?.display_name}</Link>
                    <Pill tone={member.role === 'captain' ? 'gold' : 'muted'}>{member.role}</Pill>
                  </div>
                  {staff && league.me?.id !== member.profile_id ? (
                    <span className="row">
                      <select
                        value={member.role}
                        aria-label={`Role for ${person?.username}`}
                        onChange={(event) => void league.setRole(team.id, member.profile_id, event.target.value as Role)}
                      >
                        <option value="captain">captain</option>
                        <option value="officer">officer</option>
                        <option value="player">player</option>
                      </select>
                      <button type="button" className="btn btn-tiny btn-danger" onClick={() => void league.removeMember(team.id, member.profile_id)}>
                        Remove
                      </button>
                    </span>
                  ) : null}
                  {league.me?.id === member.profile_id && member.role !== 'captain' ? (
                    <button type="button" className="btn btn-tiny" onClick={() => void league.removeMember(team.id, member.profile_id)}>
                      Leave
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
          {staff ? (
            <form
              className="stack panel"
              onSubmit={(event) => {
                event.preventDefault()
                void league.invite(team.id, username).then((result) => {
                  if (result.ok) setUsername('')
                  setError(result.ok ? null : result.error)
                })
              }}
            >
              <h2>Invite</h2>
              <label className="field">
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} required />
              </label>
              <FormError message={error} />
              <button className="btn btn-gold" type="submit">
                Send invite
              </button>
              {invites.length ? (
                <ul className="plain-list">
                  {invites.map((invite) => {
                    const person = profileById(league.data, invite.invitee_id)
                    return (
                      <li key={invite.id}>
                        <span>Waiting on {person?.username}</span>
                        <button type="button" className="btn btn-tiny" onClick={() => void league.revokeInvite(invite.id)}>
                          Revoke
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </form>
          ) : null}
        </section>
        <section>
          <h2>Matches</h2>
          <div className="result-strip">
            {matches.map((match) => (
              <MatchLine key={match.id} match={match} />
            ))}
          </div>
          {staff ? (
            <form
              className="stack panel"
              onSubmit={(event) => {
                event.preventDefault()
                void league.updateTeam(team.id, { motto, about, accent: team.accent }).then((result) => setError(result.ok ? null : result.error))
              }}
            >
              <h2>Page</h2>
              <label className="field">
                Motto
                <input value={motto} onChange={(event) => setMotto(event.target.value)} />
              </label>
              <label className="field">
                About
                <textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={4} />
              </label>
              <button className="btn" type="submit">
                Save the page
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  )
}

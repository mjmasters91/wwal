import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormError, PageHead, Pill, TeamMark } from '../components/ui'
import { formatDay } from '../format'
import { useLeague } from '../league'
import { activeBan, membership, roster } from '../select'

export function Players() {
  const { data } = useLeague()
  const [query, setQuery] = useState('')
  const people = data.profiles
    .filter((profile) => {
      const hay = `${profile.username} ${profile.display_name}`.toLowerCase()
      return hay.includes(query.trim().toLowerCase())
    })
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
  return (
    <div className="wrap page">
      <PageHead kicker="Players" title="Names on the book" lede="Everyone who has taken a username. Suspensions are listed on the profile, not whispered." />
      <label className="field search">
        Search
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Username" />
      </label>
      <ul className="people-list">
        {people.map((profile) => {
          const spot = membership(data, profile.id)
          const ban = activeBan(data, profile.id)
          return (
            <li key={profile.id}>
              <Link to={`/players/${profile.username}`}>
                <strong>{profile.display_name}</strong>
                <span>@{profile.username}</span>
              </Link>
              <em>{spot ? `${spot.member.role} · ${spot.team.tag}` : profile.is_admin ? 'Steward' : 'Free agent'}</em>
              {ban ? <Pill tone="rose">Suspended</Pill> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Player() {
  const { username } = useParams()
  const league = useLeague()
  const profile = league.data.profiles.find((item) => item.username.toLowerCase() === (username ?? '').toLowerCase())
  const [display, setDisplay] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [steam, setSteam] = useState(profile?.steam_name ?? '')
  const [error, setError] = useState<string | null>(null)
  if (!profile) {
    return (
      <div className="wrap page">
        <PageHead title="No player by that name" />
      </div>
    )
  }
  const spot = membership(league.data, profile.id)
  const ban = activeBan(league.data, profile.id)
  const invites = league.data.team_invites.filter((invite) => invite.invitee_id === profile.id && invite.status === 'pending')
  const mine = league.me?.id === profile.id

  async function save(event: FormEvent) {
    event.preventDefault()
    const result = await league.updateProfile({ display_name: display, bio, steam_name: steam })
    setError(result.ok ? null : result.error)
  }

  return (
    <div className="wrap page">
      <PageHead
        kicker={profile.region}
        title={profile.display_name}
        lede={profile.bio || 'No bio yet.'}
      />
      <div className="meta-row">
        <span>@{profile.username}</span>
        {profile.steam_name ? <span>Steam name {profile.steam_name}</span> : null}
        {profile.is_admin ? <Pill tone="gold">Steward</Pill> : null}
        {ban ? <Pill tone="rose">Suspended until {ban.ends_at ? formatDay(ban.ends_at) : 'lifted'}</Pill> : null}
        {spot ? (
          <Link to={`/teams/${spot.team.slug}`} className="team-cell">
            <TeamMark team={spot.team} size={28} />
            {spot.member.role} of {spot.team.name}
          </Link>
        ) : (
          <span>No coven</span>
        )}
      </div>
      {ban ? <p className="note">Reason on the ban: {ban.reason}</p> : null}
      {mine && invites.length ? (
        <section className="panel">
          <h2>Invites waiting</h2>
          <ul className="plain-list">
            {invites.map((invite) => {
              const team = league.data.teams.find((item) => item.id === invite.team_id)
              return (
                <li key={invite.id}>
                  <span>{team?.name}</span>
                  <span className="row">
                    <button type="button" className="btn btn-tiny btn-gold" onClick={() => void league.answerInvite(invite.id, true)}>
                      Accept
                    </button>
                    <button type="button" className="btn btn-tiny" onClick={() => void league.answerInvite(invite.id, false)}>
                      Decline
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
      {spot ? (
        <section>
          <h2>Roster</h2>
          <ul className="plain-list">
            {roster(league.data, spot.team.id).map((member) => {
              const person = league.data.profiles.find((item) => item.id === member.profile_id)
              return (
                <li key={member.profile_id}>
                  <Link to={`/players/${person?.username}`}>{person?.display_name}</Link>
                  <em>{member.role}</em>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
      {mine ? (
        <form className="stack panel" onSubmit={save}>
          <h2>Your page</h2>
          <label className="field">
            Display name
            <input value={display} onChange={(event) => setDisplay(event.target.value)} />
          </label>
          <label className="field">
            Steam name
            <input value={steam} onChange={(event) => setSteam(event.target.value)} />
          </label>
          <label className="field">
            Bio
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} />
          </label>
          <FormError message={error} />
          <button className="btn btn-gold" type="submit">
            Save
          </button>
        </form>
      ) : null}
    </div>
  )
}

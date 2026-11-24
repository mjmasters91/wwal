import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FormError, PageHead, TeamMark } from '../components/ui'
import { useLeague } from '../league'
import { membership } from '../select'
import { currentSeason, divisionsInOrder, standingsFor } from '../standings'

export function Season() {
  const league = useLeague()
  const season = currentSeason(league.data)
  const [divisionId, setDivisionId] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  if (!season) {
    return (
      <div className="wrap page">
        <PageHead title="No season is on the book" />
      </div>
    )
  }
  const divisions = divisionsInOrder(league.data, season.id)
  const mine = membership(league.data, league.me?.id)
  const existing = mine
    ? league.data.registrations.find((row) => row.team_id === mine.team.id && row.season_id === season.id)
    : null

  async function petition(event: FormEvent) {
    event.preventDefault()
    const result = await league.registerTeam(divisionId, note)
    setError(result.ok ? null : result.error)
  }

  return (
    <div className="wrap page">
      <PageHead kicker={`${season.region} · starts ${season.starts_on}`} title={season.name} lede={season.summary} />
      <p className="note">Status: {season.status}. Two best-of-ones a week, seven weeks, then the bracket.</p>
      <div className="division-grid">
        {divisions.map((division) => {
          const regs = league.data.registrations.filter((row) => row.division_id === division.id && row.status === 'approved')
          const leaders = standingsFor(league.data, division.id).slice(0, 3)
          return (
            <article key={division.id} className="division-card static">
              <span className="tier">0{division.tier}</span>
              <h2>{division.name}</h2>
              <p>{division.blurb}</p>
              <ol className="mini-table">
                {leaders.map((row) => (
                  <li key={row.team.id}>
                    <TeamMark team={row.team} size={22} />
                    <span>{row.team.name}</span>
                    <em>
                      {row.wins}–{row.losses}
                    </em>
                  </li>
                ))}
              </ol>
              <Link to={`/standings?division=${division.name}`}>{regs.length} covens · open the table</Link>
            </article>
          )
        })}
      </div>
      <section className="panel">
        <h2>Petition a division</h2>
        {season.status !== 'registration' ? (
          <p className="note">Registration for the oath is closed. A late petition still lands as pending, and a steward can refuse it.</p>
        ) : null}
        {!league.me ? (
          <Link to="/login">Sign in as a captain or officer.</Link>
        ) : existing ? (
          <p>
            {mine?.team.name} is {existing.status} for{' '}
            {league.data.divisions.find((item) => item.id === existing.division_id)?.name}.
          </p>
        ) : (
          <form className="stack" onSubmit={petition}>
            <label className="field">
              Division
              <select value={divisionId} onChange={(event) => setDivisionId(event.target.value)} required>
                <option value="">Choose</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Note to the stewards
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
            </label>
            <FormError message={error} />
            <button className="btn btn-gold" type="submit">
              File the petition
            </button>
          </form>
        )}
      </section>
      <section>
        <h2>Bracket shells</h2>
        <p className="note">Seeds lock when a steward closes the regular season and writes the covens into these matches.</p>
        <div className="bracket-grid">
          {divisions.map((division) => {
            const matches = league.data.matches.filter((match) => match.division_id === division.id && match.stage === 'playoff')
            return (
              <article key={division.id}>
                <h3>{division.name}</h3>
                {matches
                  .slice()
                  .sort((a, b) => a.slot - b.slot)
                  .map((match) => {
                    const home = league.data.teams.find((team) => team.id === match.home_team_id)
                    const away = league.data.teams.find((team) => team.id === match.away_team_id)
                    return (
                      <Link key={match.id} to={`/matches/${match.code}`} className="bracket-slot">
                        <span>{match.round_name}</span>
                        <strong>
                          {home?.tag ?? 'TBD'} vs {away?.tag ?? 'TBD'}
                        </strong>
                      </Link>
                    )
                  })}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

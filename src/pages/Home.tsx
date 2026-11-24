import { Link } from 'react-router-dom'
import { MatchLine, Pill, StandingsTable, TeamMark } from '../components/ui'
import { formatWhen } from '../format'
import { useLeague } from '../league'
import { currentSeason, divisionsInOrder, standingsFor } from '../standings'
import { teamById } from '../select'

export function Home() {
  const { data } = useLeague()
  const season = currentSeason(data)
  const divisions = season ? divisionsInOrder(data, season.id) : []
  const apex = divisions.find((d) => d.name === 'Apex')
  const apexTable = apex ? standingsFor(data, apex.id).slice(0, 6) : []
  const featured = data.matches.find((m) => m.code === 'apex-4-1') ?? data.matches.find((m) => m.status === 'veto')
  const home = teamById(data, featured?.home_team_id)
  const away = teamById(data, featured?.away_team_id)
  const bans = featured
    ? data.map_actions.filter((a) => a.match_id === featured.id && a.action === 'ban')
    : []
  const recent = data.matches
    .filter((m) => m.status === 'completed' || m.status === 'forfeit')
    .slice()
    .sort((a, b) => (b.scheduled_at ?? '').localeCompare(a.scheduled_at ?? ''))
    .slice(0, 6)
  const news = data.news_posts
    .filter((post) => post.published)
    .slice()
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))

  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="kicker">North America · Season I</p>
          <h1>
            The Ashen
            <br />
            Oath is <em>live.</em>
          </h1>
          <p className="lede">
            Seven weeks. Two maps a week. Four divisions, and a book that does not care how loud the round was.
            This is the Wizard & Witch Amateur League.
          </p>
          <div className="row">
            <Link className="btn btn-gold" to="/standings">
              Read the table
            </Link>
            <Link className="btn btn-ghost" to="/rules">
              The rulebook
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>Week</dt>
              <dd>4 of 7</dd>
            </div>
            <div>
              <dt>Covens</dt>
              <dd>{data.teams.length}</dd>
            </div>
            <div>
              <dt>Divisions</dt>
              <dd>{divisions.length}</dd>
            </div>
          </dl>
        </div>
        {featured && home && away ? (
          <aside className="scry">
            <p className="kicker">Tuesday · veto still open</p>
            <div className="scry-teams">
              <div>
                <TeamMark team={home} size={48} />
                <strong>{home.name}</strong>
                <span>5–1</span>
              </div>
              <em>vs</em>
              <div>
                <TeamMark team={away} size={48} />
                <strong>{away.name}</strong>
                <span>5–1</span>
              </div>
            </div>
            <p className="scry-time">{formatWhen(featured.scheduled_at)}</p>
            <p className="note">
              {bans.length} bans on the seal. {bans.length % 2 === 0 ? home.name : away.name} to ban next.
            </p>
            <div className="ban-row">
              {bans.map((ban) => (
                <span key={ban.id}>{ban.map_name}</span>
              ))}
            </div>
            <Link to={`/matches/${featured.code}`} className="btn btn-teal">
              Open the match room
            </Link>
          </aside>
        ) : null}
      </section>

      <div className="week-rail wrap" aria-label="Season weeks">
        {Array.from({ length: 7 }, (_, index) => {
          const week = index + 1
          const state = week < 4 ? 'done' : week === 4 ? 'now' : 'ahead'
          return (
            <Link key={week} to={`/matches?week=${week}`} className={`week ${state}`}>
              <span>Week</span>
              <strong>{week}</strong>
            </Link>
          )
        })}
      </div>

      <section className="wrap section">
        <div className="section-head">
          <h2>Just booked</h2>
          <Link to="/matches">All matches</Link>
        </div>
        <div className="result-strip">
          {recent.map((match) => (
            <MatchLine key={match.id} match={match} />
          ))}
        </div>
      </section>

      <section className="wrap split">
        <div>
          <div className="section-head">
            <h2>Apex, through week three</h2>
            <Link to="/standings?division=Apex">Full table</Link>
          </div>
          {apex ? <StandingsTable rows={apexTable} slots={apex.playoff_slots} compact /> : null}
        </div>
        <div>
          <div className="section-head">
            <h2>From the ledger</h2>
            <Link to="/news">All notes</Link>
          </div>
          <div className="news-stack">
            {news.slice(0, 3).map((post, index) => (
              <Link key={post.id} to={`/news/${post.slug}`} className={index === 0 ? 'news-feature' : 'news-item'}>
                {index === 0 ? <Pill tone="gold">Steward note</Pill> : null}
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Four rooms, one region</h2>
          <Link to="/season">Season page</Link>
        </div>
        <div className="division-grid">
          {divisions.map((division) => {
            const count = data.registrations.filter((r) => r.division_id === division.id && r.status === 'approved').length
            return (
              <Link key={division.id} to={`/standings?division=${division.name}`} className="division-card">
                <span className="tier">0{division.tier}</span>
                <h3>{division.name}</h3>
                <p>{division.blurb}</p>
                <em>
                  {count} covens · playoff line {division.playoff_slots}
                </em>
              </Link>
            )
          })}
        </div>
      </section>
    </>
  )
}

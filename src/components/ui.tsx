import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatWhen, scoreLine, statusLabel } from '../format'
import { proofUrl } from '../live'
import { useLeague } from '../league'
import { profileById, teamById } from '../select'
import type { StandingRow } from '../standings'
import type { Match, Team } from '../types'

export function TeamMark({ team, size = 36 }: { team: Pick<Team, 'tag' | 'accent' | 'name'> | null; size?: number }) {
  const tag = team?.tag ?? '—'
  return (
    <span
      className="team-mark"
      style={{ width: size, height: size, borderColor: team?.accent ?? '#e6c56a', color: team?.accent ?? '#e6c56a' }}
      aria-hidden="true"
    >
      {tag.slice(0, 3)}
    </span>
  )
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'gold' | 'teal' | 'rose' | 'live' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

export function PageHead({ kicker, title, lede }: { kicker?: string; title: string; lede?: string }) {
  return (
    <header className="page-head">
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1>{title}</h1>
      {lede ? <p className="lede">{lede}</p> : null}
    </header>
  )
}

export function Prose({ text }: { text: string }) {
  return (
    <div className="prose">
      {text.split(/\n\n+/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="error" role="alert">
      {message}
    </p>
  )
}

export function Proof({ path, alt }: { path: string | null; alt: string }) {
  const { mode } = useLeague()
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancel = false
    if (!path) {
      setUrl(null)
      return
    }
    if (mode === 'demo' || path.startsWith('data:') || path.startsWith('http')) {
      setUrl(path)
      return
    }
    void proofUrl(path).then((next) => {
      if (!cancel) setUrl(next)
    })
    return () => {
      cancel = true
    }
  }, [path, mode])
  if (!url) return <p className="note">Proof is on file. Sign in on a roster to open it.</p>
  return <img className="proof" src={url} alt={alt} />
}

export function StandingsTable({
  rows,
  slots,
  compact = false,
}: {
  rows: StandingRow[]
  slots: number
  compact?: boolean
}) {
  let lineDrawn = false
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Place</th>
            <th>Coven</th>
            <th>W</th>
            <th>L</th>
            {!compact ? <th>RF</th> : null}
            {!compact ? <th>RA</th> : null}
            <th>RD</th>
            {!compact ? <th>FF</th> : null}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const next = rows[index + 1]
            const draw =
              !lineDrawn &&
              row.place != null &&
              (row.place === slots || (next == null || next.place == null) && row.place < slots)
            if (draw) lineDrawn = true
            return (
              <FragmentRow key={row.team.id} row={row} draw={draw} slots={slots} compact={compact} />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FragmentRow({
  row,
  draw,
  slots,
  compact,
}: {
  row: StandingRow
  draw: boolean
  slots: number
  compact: boolean
}) {
  const cols = compact ? 6 : 9
  return (
    <>
      <tr className={row.inactive ? 'quiet-row' : undefined}>
        <td className="place">{row.place ?? '—'}</td>
        <td>
          <Link to={`/teams/${row.team.slug}`} className="team-cell">
            <TeamMark team={row.team} size={28} />
            <span>
              <strong>{row.team.name}</strong>
              <em>{row.team.tag}</em>
            </span>
          </Link>
        </td>
        <td>{row.wins}</td>
        <td>{row.losses}</td>
        {!compact ? <td>{row.rounds_for}</td> : null}
        {!compact ? <td>{row.rounds_against}</td> : null}
        <td className={row.round_diff > 0 ? 'pos' : row.round_diff < 0 ? 'neg' : undefined}>
          {row.round_diff > 0 ? `+${row.round_diff}` : row.round_diff}
        </td>
        {!compact ? <td>{row.forfeits}</td> : null}
        <td>{row.inactive ? <Pill tone="rose">Quiet</Pill> : null}</td>
      </tr>
      {draw ? (
        <tr className="line-row">
          <td colSpan={cols}>Playoff line · {slots} {slots === 1 ? 'coven' : 'covens'}</td>
        </tr>
      ) : null}
    </>
  )
}

export function MatchLine({ match }: { match: Match }) {
  const { data } = useLeague()
  const home = teamById(data, match.home_team_id)
  const away = teamById(data, match.away_team_id)
  const forfeited = match.status === 'forfeit'
  return (
    <Link to={`/matches/${match.code}`} className="match-line">
      <div className="match-side">
        <TeamMark team={home} size={32} />
        <span>{home?.name ?? 'Seed open'}</span>
      </div>
      <div className="match-mid">
        <strong>{scoreLine(match.home_rounds, match.away_rounds, forfeited)}</strong>
        <em>
          {match.round_name}
          {match.played_map ? ` · ${match.played_map}` : ''} · {formatWhen(match.scheduled_at)}
        </em>
        <Pill tone={match.status === 'veto' || match.status === 'disputed' ? 'gold' : match.status === 'reported' ? 'teal' : 'muted'}>
          {statusLabel(match.status)}
        </Pill>
      </div>
      <div className="match-side away">
        <span>{away?.name ?? 'Seed open'}</span>
        <TeamMark team={away} size={32} />
      </div>
    </Link>
  )
}

export function PersonLink({ id }: { id: string | null }) {
  const { data } = useLeague()
  const profile = profileById(data, id)
  if (!profile) return <span>Unknown</span>
  return <Link to={`/players/${profile.username}`}>{profile.display_name}</Link>
}

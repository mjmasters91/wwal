import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FormError, MatchLine, PageHead, PersonLink, Pill, Proof, TeamMark } from '../components/ui'
import { ACTIVE_DUTY, formatWhen, scoreLine, statusLabel } from '../format'
import { useLeague } from '../league'
import { isRostered, isStaff, profileById, teamById, vetoBoard } from '../select'
import { currentSeason, divisionsInOrder } from '../standings'

export function MatchList() {
  const { data } = useLeague()
  const [params, setParams] = useSearchParams()
  const season = currentSeason(data)
  const divisions = season ? divisionsInOrder(data, season.id) : []
  const divisionName = params.get('division') ?? 'Apex'
  const week = params.get('week') ?? '4'
  const division = divisions.find((item) => item.name === divisionName) ?? divisions[0]
  const matches = data.matches
    .filter((match) => match.division_id === division?.id && match.stage === 'regular' && String(match.week) === week)
    .slice()
    .sort((a, b) => a.slot - b.slot)
  return (
    <div className="wrap page">
      <PageHead kicker="Matches" title="The week on the book" lede="Two best-of-ones a week. Open a room for the veto, the server line, and the score." />
      <div className="tab-row">
        {divisions.map((item) => (
          <button key={item.id} type="button" className={item.id === division?.id ? 'active' : undefined} onClick={() => setParams({ division: item.name, week })}>
            {item.name}
          </button>
        ))}
      </div>
      <div className="tab-row weeks">
        {Array.from({ length: 7 }, (_, index) => (
          <button
            key={index}
            type="button"
            className={String(index + 1) === week ? 'active' : undefined}
            onClick={() => setParams({ division: division?.name ?? 'Apex', week: String(index + 1) })}
          >
            W{index + 1}
          </button>
        ))}
      </div>
      <div className="result-strip">
        {matches.length ? matches.map((match) => <MatchLine key={match.id} match={match} />) : <p className="note">Nothing scheduled in that cell.</p>}
      </div>
    </div>
  )
}

export function MatchRoom() {
  const { code } = useParams()
  const league = useLeague()
  const match = league.data.matches.find((item) => item.code === code || item.id === code)
  const [server, setServer] = useState(match?.server_info ?? '')
  const [when, setWhen] = useState('')
  const [message, setMessage] = useState('')
  const [homeRounds, setHomeRounds] = useState('13')
  const [awayRounds, setAwayRounds] = useState('11')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const board = useMemo(() => (match ? vetoBoard(league.data, match.id) : null), [league.data, match])

  if (!match || !board) {
    return (
      <div className="wrap page">
        <PageHead title="That match is not on the book" />
      </div>
    )
  }

  const home = teamById(league.data, match.home_team_id)
  const away = teamById(league.data, match.away_team_id)
  const bans = board.bans
  const nextTeamId = bans.length >= 6 ? null : bans.length % 2 === 0 ? match.home_team_id : match.away_team_id
  const nextTeam = teamById(league.data, nextTeamId)
  const sideOpen = Boolean(match.played_map) && bans.length >= 6 && !board.side && (match.status === 'veto' || match.status === 'scheduled')
  const vetoOpen = match.status === 'scheduled' || match.status === 'veto'
  const staffHome = Boolean(match.home_team_id && isStaff(league.data, match.home_team_id, league.me?.id))
  const staffAway = Boolean(match.away_team_id && isStaff(league.data, match.away_team_id, league.me?.id))
  const staff = staffHome || staffAway || Boolean(league.me?.is_admin)
  const myTeamId = staffHome ? match.home_team_id : staffAway ? match.away_team_id : null
  const reports = league.data.score_reports.filter((report) => report.match_id === match.id)
  const pending = reports.find((report) => report.status === 'pending')
  const disputes = league.data.disputes.filter((dispute) => dispute.match_id === match.id)
  const proposals = league.data.reschedule_proposals.filter((proposal) => proposal.match_id === match.id)
  const canSeePending = Boolean(
    pending &&
      (pending.status === 'confirmed' ||
        league.me?.is_admin ||
        isRostered(league.data, match.id, league.me?.id)),
  )

  async function run(action: Promise<{ ok: boolean; error?: string }>) {
    const result = await action
    setError(result.ok ? null : result.error ?? 'Refused.')
  }

  function onReport(event: FormEvent) {
    event.preventDefault()
    void run(league.reportScore(match!.id, Number(homeRounds), Number(awayRounds), file, note))
  }

  return (
    <div className="wrap page">
      <p className="kicker">
        <Link to="/matches">Matches</Link> · {match.round_name} · {match.code}
      </p>
      <header className="room-head">
        <div className="room-team">
          {home ? <TeamMark team={home} size={56} /> : null}
          <div>
            {home ? <Link to={`/teams/${home.slug}`}>{home.name}</Link> : <span>Seed open</span>}
            <em>{home?.tag}</em>
          </div>
        </div>
        <div className="room-score">
          <strong>{scoreLine(match.home_rounds, match.away_rounds, match.status === 'forfeit')}</strong>
          <Pill tone={match.status === 'disputed' || match.status === 'veto' ? 'gold' : match.status === 'reported' ? 'teal' : 'muted'}>
            {statusLabel(match.status)}
          </Pill>
          <span>{formatWhen(match.scheduled_at)}</span>
          {match.played_map ? <span>Map {match.played_map}</span> : null}
          {match.ct_team_id ? <span>{teamById(league.data, match.ct_team_id)?.tag} open CT</span> : null}
        </div>
        <div className="room-team away">
          {away ? <TeamMark team={away} size={56} /> : null}
          <div>
            {away ? <Link to={`/teams/${away.slug}`}>{away.name}</Link> : <span>Seed open</span>}
            <em>{away?.tag}</em>
          </div>
        </div>
      </header>

      <section className="room-grid">
        <div>
          <div className="section-head">
            <h2>Veto seal</h2>
            {vetoOpen && !match.played_map ? <p>Next ban: {nextTeam?.name ?? '—'}</p> : null}
            {sideOpen ? <p>Home chooses the opening side.</p> : null}
          </div>
          <div className="veto-grid">
            {ACTIVE_DUTY.map((map) => {
              const ban = bans.find((item) => item.map_name === map)
              const banner = teamById(league.data, ban?.team_id)
              const remain = match.played_map === map
              const canBan = vetoOpen && !match.played_map && staff && (league.me?.is_admin || myTeamId === nextTeamId)
              return (
                <button
                  key={map}
                  type="button"
                  className={`map-tile${ban ? ' banned' : ''}${remain ? ' remain' : ''}`}
                  disabled={!canBan || Boolean(ban)}
                  onClick={() => void run(league.banMap(match.id, map))}
                >
                  <span>{map}</span>
                  <em>{ban ? `Banned · ${banner?.tag}` : remain ? 'Sealed' : canBan ? 'Ban' : 'Open'}</em>
                </button>
              )
            })}
          </div>
          {sideOpen && (staffHome || league.me?.is_admin) ? (
            <div className="row side-row">
              <button type="button" className="btn btn-gold" onClick={() => void run(league.pickSide(match.id, 'CT'))}>
                Home opens CT
              </button>
              <button type="button" className="btn" onClick={() => void run(league.pickSide(match.id, 'T'))}>
                Home opens T
              </button>
            </div>
          ) : null}
          {!staff ? <p className="note">Sign in as a captain or officer on this match to ban, propose a time, or file a score.</p> : null}
        </div>
        <aside className="room-side">
          <form
            className="panel stack"
            onSubmit={(event) => {
              event.preventDefault()
              void run(league.setServer(match.id, server))
            }}
          >
            <h2>Server</h2>
            <textarea value={server} onChange={(event) => setServer(event.target.value)} rows={4} readOnly={!staff} />
            {staff ? (
              <button className="btn btn-tiny" type="submit">
                Save the line
              </button>
            ) : null}
          </form>
          <section className="panel">
            <h2>Clock</h2>
            <ul className="plain-list">
              {proposals.map((proposal) => {
                const proposer = teamById(league.data, proposal.proposed_by_team)
                const opposing = myTeamId && myTeamId !== proposal.proposed_by_team
                return (
                  <li key={proposal.id}>
                    <div>
                      <strong>{proposer?.tag}</strong> · {formatWhen(proposal.proposed_time)}
                      <p>{proposal.message}</p>
                      <Pill>{proposal.status}</Pill>
                    </div>
                    {proposal.status === 'pending' && (opposing || league.me?.is_admin) ? (
                      <span className="row">
                        <button type="button" className="btn btn-tiny btn-gold" onClick={() => void run(league.answerProposal(proposal.id, true))}>
                          Accept
                        </button>
                        <button type="button" className="btn btn-tiny" onClick={() => void run(league.answerProposal(proposal.id, false))}>
                          Decline
                        </button>
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            {staff && ['scheduled', 'veto', 'reported'].includes(match.status) ? (
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault()
                  void run(league.propose(match.id, when, message))
                }}
              >
                <label className="field">
                  Propose a time
                  <input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} required />
                </label>
                <label className="field">
                  Note
                  <input value={message} onChange={(event) => setMessage(event.target.value)} />
                </label>
                <button className="btn btn-tiny" type="submit">
                  Send proposal
                </button>
              </form>
            ) : null}
          </section>
        </aside>
      </section>

      <section className="split">
        <div className="panel">
          <h2>Score</h2>
          {reports.length === 0 ? <p className="note">No score has been filed. The table does not move until the other coven confirms one.</p> : null}
          {reports
            .filter((report) => report.status === 'confirmed' || canSeePending || league.me?.is_admin || isRostered(league.data, match.id, league.me?.id))
            .map((report) => (
              <article key={report.id} className="report">
                <p>
                  {teamById(league.data, report.team_id)?.tag} filed {report.home_rounds}–{report.away_rounds}
                </p>
                <Pill tone={report.status === 'pending' ? 'teal' : 'muted'}>{report.status}</Pill>
                {report.note ? <p>{report.note}</p> : null}
                {(report.status === 'confirmed' || canSeePending || league.me?.is_admin) && report.screenshot_path ? (
                  <Proof path={report.screenshot_path} alt={`Scoreboard filed by ${teamById(league.data, report.team_id)?.name ?? 'a coven'}`} />
                ) : null}
                {report.status === 'pending' && match.status !== 'disputed' && staff && myTeamId !== report.team_id ? (
                  <div className="row">
                    <button type="button" className="btn btn-tiny btn-gold" onClick={() => void run(league.answerReport(report.id, true))}>
                      Confirm
                    </button>
                    <button type="button" className="btn btn-tiny btn-danger" onClick={() => void run(league.answerReport(report.id, false))}>
                      Reject
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          {staff && (match.status === 'scheduled' || match.status === 'veto') ? (
            <form className="stack" onSubmit={onReport}>
              <div className="form-grid">
                <label className="field">
                  {home?.tag ?? 'Home'} rounds
                  <input value={homeRounds} onChange={(event) => setHomeRounds(event.target.value)} inputMode="numeric" required />
                </label>
                <label className="field">
                  {away?.tag ?? 'Away'} rounds
                  <input value={awayRounds} onChange={(event) => setAwayRounds(event.target.value)} inputMode="numeric" required />
                </label>
              </div>
              <label className="field">
                Scoreboard screenshot
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required
                />
              </label>
              <label className="field">
                Note
                <input value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <button className="btn btn-gold" type="submit">
                File the score
              </button>
            </form>
          ) : null}
        </div>
        <div className="panel">
          <h2>Dispute and forfeit</h2>
          {disputes.length === 0 && !match.forfeit_team_id ? <p className="note">No dispute on this map.</p> : null}
          {disputes.map((dispute) => (
            <article key={dispute.id}>
              <p>
                <PersonLink id={dispute.opened_by} /> · {dispute.status}
              </p>
              {(league.me?.is_admin || isRostered(league.data, match.id, league.me?.id)) ? <p>{dispute.reason}</p> : <p className="note">A dispute is open. The text is for the two rosters and the stewards.</p>}
              {dispute.resolution ? <p>Resolution: {dispute.resolution}</p> : null}
            </article>
          ))}
          {match.forfeit_team_id ? (
            <p>
              Forfeit by {teamById(league.data, match.forfeit_team_id)?.name}.{' '}
              {league.data.forfeit_events.find((event) => event.match_id === match.id)?.reason}
            </p>
          ) : null}
          {staff && !['completed', 'forfeit'].includes(match.status) ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault()
                void run(league.dispute(match.id, reason))
              }}
            >
              <label className="field">
                Open a dispute
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} />
              </label>
              <button className="btn" type="submit">
                Send to the stewards
              </button>
            </form>
          ) : null}
          {myTeamId && !['completed', 'forfeit'].includes(match.status) ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Forfeit this map? It counts toward the quiet list.')) {
                  void run(league.forfeit(match.id, myTeamId, 'Forfeit filed from the match room.'))
                }
              }}
            >
              Forfeit as {teamById(league.data, myTeamId)?.tag}
            </button>
          ) : null}
          {league.me && !staff ? <p className="note">Signed in as {profileById(league.data, league.me.id)?.username}. This roster does not include you.</p> : null}
        </div>
      </section>
      <FormError message={error} />
    </div>
  )
}

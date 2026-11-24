import { PageHead } from '../components/ui'

const SECTIONS = [
  {
    id: 'league',
    title: 'The league',
    body: 'Wizard & Witch Amateur League is a North American Counter-Strike 2 competition for amateur covens. Season I is the Ashen Oath: seven weeks, two best-of-one maps a week, then a playoff bracket. The stewards keep the book. The match room is where a result becomes real.',
  },
  {
    id: 'players',
    title: 'Players',
    body: 'One account, one person. Usernames stay. A player may stand on one coven at a time. Suspensions are public and block invites, filings, vetoes, and new posts until a steward lifts them. The steward account for this league is Sender. Admin power is a flag on that profile, not a secret in the browser.',
  },
  {
    id: 'covens',
    title: 'Covens',
    body: 'A coven has one captain, any number of officers, and players. Captains and officers invite, register, veto, propose times, file scores, and forfeit. Players play. A captain cannot leave until another captain is named. Stewards can disband a coven that has stopped being a team.',
  },
  {
    id: 'divisions',
    title: 'Divisions',
    body: 'The season has four divisions, all in NA: Open, Contender, Challenger, and Apex. A coven petitions one division. The petition sits pending until a steward approves it. Movement between divisions is a conversation between seasons, not a button during the oath.',
  },
  {
    id: 'season',
    title: 'The seven weeks',
    body: 'The regular season is seven weeks. Each coven is scheduled for two best-of-ones each week. Maps are not a series. Win the map, take the match. After week seven the playoff line is locked into a bracket. Apex seeds four. The other divisions seed two, into a final.',
  },
  {
    id: 'clock',
    title: 'The clock',
    body: 'Default nights are Tuesday, Wednesday, and Thursday, evening Eastern. Either coven’s staff may propose a new time in the match room. Only the other coven can accept it. A proposal is not a ruling. If nobody can find a time before the week closes, file a ticket before you file a forfeit.',
  },
  {
    id: 'veto',
    title: 'The veto seal',
    body: 'The active pool is Ancient, Anubis, Cache, Dust II, Inferno, Mirage, and Nuke. Home bans first. The covens alternate until six maps are gone. The map still standing is the map. Home then chooses the side they will open on. Bans are not undone because someone disliked the last one.',
  },
  {
    id: 'server',
    title: 'The server',
    body: 'Connect information lives in the match room. Captains and officers of either coven, and the stewards, may edit that field. Passwords do not belong in the Hall. If the server dies, pause and open a ticket. Do not invent a new server and call the map played.',
  },
  {
    id: 'score',
    title: 'The score and the proof',
    body: 'Staff file the final round score with a screenshot of the scoreboard. Regulation is 13–11 or better. Overtime is accepted when both sides reached 12 and the winner leads by at least two. The other coven confirms or rejects. A coven cannot confirm its own filing. Until it is confirmed, the table does not move.',
  },
  {
    id: 'disputes',
    title: 'Disputes',
    body: 'If the filing is wrong, or the map was not finished under the rules, staff open a dispute and say what happened. The match leaves the confirmation queue. Stewards read the proof, write a resolution, and may override the score. An override is a completed result.',
  },
  {
    id: 'forfeit',
    title: 'Forfeits and the quiet list',
    body: 'A forfeit is a loss with zero rounds on both sides. It does not inflate round difference. Three forfeits in the regular season and the coven is inactive: still on the table, sorted beneath the playoff line, and ineligible to be seeded. The stewards may pull the rest of that coven’s slate. Showing up late once is a reschedule. Showing up never is a forfeit.',
  },
  {
    id: 'table',
    title: 'The table and the playoff line',
    body: 'Order is wins, then round difference, then rounds won, then coven name. The playoff line is drawn under the last seed that still advances. Ties on the line are broken by that same order, name last, so the line is a place and not a shrug. Inactive covens do not take a place.',
  },
  {
    id: 'conduct',
    title: 'Conduct',
    body: 'Play the map. Do not abuse the other coven, the server, or the Hall. Slurs after a warning are a suspension, and the reason is posted on the profile. Coaches may watch GOTV. They do not type in the server. If a rule on this page and a steward’s ticket disagree, the ticket is the ruling and this page gets corrected.',
  },
]

export function Rules() {
  return (
    <div className="wrap page">
      <PageHead
        kicker="Rulebook"
        title="How the oath is kept"
        lede="Short on purpose. If it is not here, it is not a rule until a steward writes it down."
      />
      <div className="rules-layout">
        <nav className="rules-nav" aria-label="Rulebook sections">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
        <div className="rules-body">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

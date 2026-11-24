import { Link, useSearchParams } from 'react-router-dom'
import { PageHead, StandingsTable } from '../components/ui'
import { useLeague } from '../league'
import { currentSeason, divisionsInOrder, standingsFor } from '../standings'

export function Standings() {
  const { data } = useLeague()
  const [params, setParams] = useSearchParams()
  const season = currentSeason(data)
  const divisions = season ? divisionsInOrder(data, season.id) : []
  const selected = params.get('division') ?? 'Apex'
  const division = divisions.find((item) => item.name === selected) ?? divisions[0]
  if (!division) {
    return (
      <div className="wrap page">
        <PageHead title="No table yet" />
      </div>
    )
  }
  const rows = standingsFor(data, division.id)
  return (
    <div className="wrap page">
      <PageHead
        kicker={season?.name}
        title={`${division.name} table`}
        lede="Wins, then round difference, then rounds won. Three forfeits and the coven goes quiet, under the line."
      />
      <div className="tab-row" role="tablist">
        {divisions.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === division.id ? 'active' : undefined}
            onClick={() => setParams({ division: item.name })}
          >
            {item.name}
          </button>
        ))}
      </div>
      <StandingsTable rows={rows} slots={division.playoff_slots} />
      <p className="note">
        Playoff line is {division.playoff_slots}. <Link to="/rules#table">Tiebreakers live in the rulebook.</Link>
      </p>
    </div>
  )
}

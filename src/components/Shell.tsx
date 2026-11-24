import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD } from '../mock'
import { useLeague } from '../league'
import { membership } from '../select'
import { Logo } from './Logo'

const LINKS = [
  ['/season', 'Season'],
  ['/standings', 'Standings'],
  ['/matches', 'Matches'],
  ['/teams', 'Covens'],
  ['/forum', 'Hall'],
  ['/rules', 'Rules'],
]

export function Shell() {
  const league = useLeague()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const invites = league.me
    ? league.data.team_invites.filter((invite) => invite.invitee_id === league.me?.id && invite.status === 'pending').length
    : 0
  const mine = membership(league.data, league.me?.id)

  return (
    <div className="app">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className="top-stack">
        {league.mode === 'demo' ? (
          <div className="demo-bar">
            <p>
              Demo ledger. No server is connected. Sample captains use the password <code>{DEMO_PASSWORD}</code>.
            </p>
            <button type="button" className="btn btn-tiny" onClick={league.resetDemo}>
              Reset the book
            </button>
          </div>
        ) : null}
        <header className="site-header">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <Logo />
            <span>
              <strong>Wizard & Witch</strong>
              <em>Amateur League</em>
            </span>
          </Link>
          <button type="button" className="nav-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? 'Close' : 'Menu'}
          </button>
          <nav className={open ? 'nav open' : 'nav'}>
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {label}
              </NavLink>
            ))}
            {league.me?.is_admin ? (
              <NavLink to="/admin" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Stewards
              </NavLink>
            ) : null}
          </nav>
          <div className="account">
            {league.me ? (
              <>
                <Link to={`/players/${league.me.username}`} className="who" onClick={() => setOpen(false)}>
                  {league.me.display_name}
                  {invites ? <span className="dot">{invites}</span> : null}
                </Link>
                {mine ? <span className="who-team">{mine.team.tag}</span> : null}
                <button
                  type="button"
                  className="btn btn-tiny"
                  onClick={() => {
                    void league.signOut().then(() => navigate('/'))
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-gold btn-tiny">
                Sign in
              </Link>
            )}
          </div>
        </header>
      </div>
      <main id="content">
        {!league.ready ? (
          <div className="wrap loading-block">
            <Logo size={64} />
            <p>Opening the ledger…</p>
          </div>
        ) : league.error ? (
          <div className="wrap">
            <div className="empty">
              <h2>The ledger did not open</h2>
              <p>{league.error}</p>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <Logo size={42} />
            <p>Wizard & Witch Amateur League. North America. A schedule, a veto, and a steward.</p>
          </div>
          <div>
            <p className="kicker">The book</p>
            <Link to="/news">Ledger</Link>
            <Link to="/players">Players</Link>
            <Link to="/support">Support</Link>
            <Link to="/admin">Stewards</Link>
          </div>
          <div>
            <p className="kicker">Season I</p>
            <Link to="/season">The Ashen Oath</Link>
            <Link to="/standings">Tables</Link>
            <Link to="/rules">Rulebook</Link>
            <Link to="/matches/apex-4-1">Tuesday veto</Link>
          </div>
        </div>
        <p className="legal">Not affiliated with any game publisher. Map names are the active pool, nothing else is borrowed.</p>
      </footer>
    </div>
  )
}

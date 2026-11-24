import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormError, PageHead } from '../components/ui'
import { useLeague } from '../league'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mock'

export function Login() {
  const league = useLeague()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    const result = await league.signIn(email, password)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/')
  }

  return (
    <div className="wrap page narrow">
      <PageHead kicker="Account" title="Sign in" lede="The book knows you by the email on the account, not by the name you shout in spawn." />
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required />
        </label>
        <label className="field">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
        </label>
        <FormError message={error} />
        <button className="btn btn-gold" type="submit" disabled={pending}>
          {pending ? 'Checking…' : 'Enter'}
        </button>
      </form>
      <p className="note">
        No account yet? <Link to="/signup">Create one</Link>.
      </p>
      {league.mode === 'demo' ? (
        <aside className="panel">
          <p className="kicker">Demo accounts</p>
          <p>Password for every seeded player: {DEMO_PASSWORD}</p>
          <ul className="account-list">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(DEMO_PASSWORD)
                  }}
                >
                  <strong>{account.username}</strong>
                  <span>{account.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : (
        <p className="note">If email confirmation is on for this project, confirm the letter before the sign-in will stick.</p>
      )}
    </div>
  )
}

export function Signup() {
  const league = useLeague()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    const result = await league.signUp({ email, password, username, displayName })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(`/players/${username}`)
  }

  return (
    <div className="wrap page narrow">
      <PageHead
        kicker="Account"
        title="Take a name"
        lede="Usernames are 3–20 letters, numbers, or underscores. The steward flag is not something you can grant yourself."
      />
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="field">
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required />
        </label>
        <label className="field">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="field">
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" />
        </label>
        <FormError message={error} />
        <button className="btn btn-gold" type="submit" disabled={pending}>
          {pending ? 'Writing…' : 'Create the account'}
        </button>
      </form>
      <p className="note">
        Already named? <Link to="/login">Sign in</Link>.
      </p>
    </div>
  )
}

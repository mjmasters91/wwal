import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormError, PageHead, PersonLink, Pill } from '../components/ui'
import { formatWhen } from '../format'
import { useLeague } from '../league'

export function Support() {
  const league = useLeague()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const tickets = league.data.tickets
    .filter((ticket) => league.me?.is_admin || ticket.author_id === league.me?.id)
    .slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  return (
    <div className="wrap page">
      <PageHead
        kicker="Support"
        title="Ask the stewards"
        lede="Server deaths, duplicate rows, and anything that should not be a forum argument. Rulings come back in the ticket."
      />
      {!league.me ? (
        <p className="note">
          <Link to="/login">Sign in</Link> to open a ticket. Stewards see every ticket. Everyone else sees their own.
        </p>
      ) : (
        <div className="split">
          <form
            className="stack panel"
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              void league.openTicket(subject, body).then((result) => {
                if (result.ok) {
                  setSubject('')
                  setBody('')
                }
                setError(result.ok ? null : result.error)
              })
            }}
          >
            <h2>New ticket</h2>
            <label className="field">
              Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
            </label>
            <label className="field">
              What happened
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} required />
            </label>
            <FormError message={error} />
            <button className="btn btn-gold" type="submit">
              File it
            </button>
          </form>
          <ul className="thread-list">
            {tickets.length ? (
              tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link to={`/support/${ticket.id}`}>{ticket.subject}</Link>
                  <Pill tone={ticket.status === 'resolved' ? 'muted' : 'teal'}>{ticket.status}</Pill>
                </li>
              ))
            ) : (
              <li>No tickets on your desk.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export function TicketPage() {
  const { id } = useParams()
  const league = useLeague()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const ticket = league.data.tickets.find((item) => item.id === id)
  if (!ticket || (ticket.author_id !== league.me?.id && !league.me?.is_admin)) {
    return (
      <div className="wrap page">
        <PageHead title="That ticket is sealed" lede="Sign in as the author, or as a steward." />
        <Link to="/login">Sign in</Link>
      </div>
    )
  }
  const messages = league.data.ticket_messages
    .filter((message) => message.ticket_id === ticket.id)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  return (
    <article className="wrap page narrow">
      <p className="kicker">
        <Link to="/support">Support</Link> · {ticket.status}
      </p>
      <h1>{ticket.subject}</h1>
      <p className="byline">
        Opened by <PersonLink id={ticket.author_id} />
      </p>
      <ul className="replies">
        {messages.map((message) => (
          <li key={message.id}>
            <PersonLink id={message.author_id} />
            <time>{formatWhen(message.created_at)}</time>
            <p>{message.body}</p>
          </li>
        ))}
      </ul>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          void league.replyTicket(ticket.id, body).then((result) => {
            if (result.ok) setBody('')
            setError(result.ok ? null : result.error)
          })
        }}
      >
        <label className="field">
          Reply
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} required />
        </label>
        <FormError message={error} />
        <div className="row">
          <button className="btn btn-gold" type="submit">
            Send
          </button>
          {league.me?.is_admin ? (
            <button type="button" className="btn" onClick={() => void league.setTicketStatus(ticket.id, 'resolved')}>
              Mark resolved
            </button>
          ) : null}
        </div>
      </form>
    </article>
  )
}

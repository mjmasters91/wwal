import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormError, PageHead, PersonLink } from '../components/ui'
import { formatWhen } from '../format'
import { useLeague } from '../league'

export function Forum() {
  const league = useLeague()
  const [boardId, setBoardId] = useState(league.data.forum_boards[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const threads = league.data.forum_threads
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at))
  return (
    <div className="wrap page">
      <PageHead kicker="The Hall" title="Talk that is not a ruling" lede="Schedule chatter and defaults. A steward can lock a thread. A score is still filed in the match room." />
      <div className="board-grid">
        {league.data.forum_boards
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((board) => (
            <article key={board.id} className="panel">
              <h2>{board.name}</h2>
              <p>{board.description}</p>
              <ul className="thread-list">
                {threads
                  .filter((thread) => thread.board_id === board.id)
                  .map((thread) => (
                    <li key={thread.id}>
                      <Link to={`/forum/${thread.id}`}>{thread.pinned ? 'Pinned · ' : ''}{thread.title}</Link>
                      <span>{formatWhen(thread.created_at)}</span>
                    </li>
                  ))}
              </ul>
            </article>
          ))}
      </div>
      {league.me ? (
        <form
          className="stack panel"
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            void league.postThread(boardId, title, body).then((result) => {
              if (result.ok) {
                setTitle('')
                setBody('')
              }
              setError(result.ok ? null : result.error)
            })
          }}
        >
          <h2>New thread</h2>
          <label className="field">
            Board
            <select value={boardId} onChange={(event) => setBoardId(event.target.value)}>
              {league.data.forum_boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="field">
            Post
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} required />
          </label>
          <FormError message={error} />
          <button className="btn btn-gold" type="submit">
            Post
          </button>
        </form>
      ) : (
        <p className="note">
          <Link to="/login">Sign in</Link> to post.
        </p>
      )}
    </div>
  )
}

export function Thread() {
  const { threadId } = useParams()
  const league = useLeague()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const thread = league.data.forum_threads.find((item) => item.id === threadId)
  if (!thread) {
    return (
      <div className="wrap page">
        <PageHead title="Thread not found" />
      </div>
    )
  }
  const replies = league.data.forum_replies
    .filter((reply) => reply.thread_id === thread.id)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  return (
    <article className="wrap page narrow">
      <p className="kicker">
        <Link to="/forum">The Hall</Link>
        {thread.locked ? ' · locked' : ''}
      </p>
      <h1>{thread.title}</h1>
      <p className="byline">
        <PersonLink id={thread.author_id} /> · {formatWhen(thread.created_at)}
      </p>
      <p className="prose-single">{thread.body}</p>
      <ul className="replies">
        {replies.map((reply) => (
          <li key={reply.id}>
            <PersonLink id={reply.author_id} />
            <time>{formatWhen(reply.created_at)}</time>
            <p>{reply.body}</p>
          </li>
        ))}
      </ul>
      {league.me && (!thread.locked || league.me.is_admin) ? (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            void league.replyThread(thread.id, body).then((result) => {
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
          <button className="btn" type="submit">
            Reply
          </button>
        </form>
      ) : null}
    </article>
  )
}

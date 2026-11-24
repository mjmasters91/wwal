import { Link, useParams } from 'react-router-dom'
import { PageHead, PersonLink, Prose } from '../components/ui'
import { formatDay } from '../format'
import { useLeague } from '../league'

export function NewsList() {
  const { data } = useLeague()
  const posts = data.news_posts
    .filter((post) => post.published || false)
    .slice()
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
  return (
    <div className="wrap page">
      <PageHead
        kicker="Ledger"
        title="Notes from the stewards"
        lede="Season news lives here. Rulings that change a score live in the match room, not in a post."
      />
      <div className="news-index">
        {posts.map((post) => (
          <article key={post.id}>
            <p className="kicker">{formatDay(post.published_at)}</p>
            <h2>
              <Link to={`/news/${post.slug}`}>{post.title}</Link>
            </h2>
            <p>{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export function NewsArticle() {
  const { slug } = useParams()
  const { data } = useLeague()
  const post = data.news_posts.find((item) => item.slug === slug && item.published)
  if (!post) {
    return (
      <div className="wrap page">
        <PageHead title="That note is not on the ledger" lede="It may be a draft, or the link is old." />
      </div>
    )
  }
  return (
    <article className="wrap page narrow">
      <PageHead kicker={formatDay(post.published_at)} title={post.title} lede={post.excerpt} />
      <p className="byline">
        Filed by <PersonLink id={post.author_id} />
      </p>
      <Prose text={post.body} />
    </article>
  )
}

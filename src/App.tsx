import { Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Admin } from './pages/Admin'
import { Login, Signup } from './pages/Auth'
import { Forum, Thread } from './pages/Forum'
import { Home } from './pages/Home'
import { MatchList, MatchRoom } from './pages/Matches'
import { NewsArticle, NewsList } from './pages/News'
import { Player, Players } from './pages/Players'
import { Rules } from './pages/Rules'
import { Season } from './pages/Season'
import { Standings } from './pages/Standings'
import { Support, TicketPage } from './pages/Support'
import { NewTeam, TeamPage, Teams } from './pages/Teams'
import { PageHead } from './components/ui'

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/:slug" element={<NewsArticle />} />
        <Route path="rules" element={<Rules />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:username" element={<Player />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/new" element={<NewTeam />} />
        <Route path="teams/:slug" element={<TeamPage />} />
        <Route path="season" element={<Season />} />
        <Route path="standings" element={<Standings />} />
        <Route path="matches" element={<MatchList />} />
        <Route path="matches/:code" element={<MatchRoom />} />
        <Route path="forum" element={<Forum />} />
        <Route path="forum/:threadId" element={<Thread />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:id" element={<TicketPage />} />
        <Route path="admin" element={<Admin />} />
        <Route
          path="*"
          element={
            <div className="wrap page">
              <PageHead title="That page is not in the book" lede="The link does not match a season, coven, match, or note." />
            </div>
          }
        />
      </Route>
    </Routes>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/cinzel/600.css'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/600-italic.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import { App } from './App'
import { LeagueProvider } from './league'
import './index.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LeagueProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </LeagueProvider>
  </StrictMode>,
)

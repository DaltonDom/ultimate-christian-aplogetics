import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useAppState, dueCardIds } from './store'
import Home from './pages/Home'
import Course from './pages/Course'
import ModulePage from './pages/ModulePage'
import LessonPage from './pages/LessonPage'
import Review from './pages/Review'
import Simulator from './pages/Simulator'
import { ReferenceHub, QuickAnswersPage, FallaciesPage, CheatSheetsPage, PresentationsPage, ResourcesPage } from './pages/Reference'
import Pocket from './pages/Pocket'
import Search from './pages/Search'
import Notes from './pages/Notes'
import Settings from './pages/Settings'

const NAV = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/course', label: 'Course', icon: '📖' },
  { to: '/review', label: 'Review', icon: '🧠' },
  { to: '/practice', label: 'Practice', icon: '💬' },
  { to: '/reference', label: 'Reference', icon: '📇' },
]

export default function App() {
  const state = useAppState()
  const due = dueCardIds(state).length
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', state.theme)
  }, [state.theme])

  // Scroll to top on page change, or to an in-page anchor like /reference/answers#who-made-god.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <img src="/icon.svg" alt="" width={28} height={28} />
          <span>Ready to Answer</span>
        </NavLink>
        <nav className="topnav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}{n.to === '/review' && due > 0 && <span className="badge">{due}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-tools">
          <NavLink to="/search" aria-label="Search" className="icon-btn">🔍</NavLink>
          <NavLink to="/notes" aria-label="My notes" className="icon-btn">📝</NavLink>
          <NavLink to="/settings" aria-label="Settings" className="icon-btn">⚙️</NavLink>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course" element={<Course />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/review" element={<Review />} />
          <Route path="/practice" element={<Simulator />} />
          <Route path="/reference" element={<ReferenceHub />} />
          <Route path="/reference/answers" element={<QuickAnswersPage />} />
          <Route path="/reference/fallacies" element={<FallaciesPage />} />
          <Route path="/reference/sheets" element={<CheatSheetsPage />} />
          <Route path="/reference/presentations" element={<PresentationsPage />} />
          <Route path="/reference/resources" element={<ResourcesPage />} />
          <Route path="/pocket/:kind/:id" element={<Pocket />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>

      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="tab-icon" aria-hidden>{n.icon}</span>
            <span>{n.label}</span>
            {n.to === '/review' && due > 0 && <span className="badge">{due}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { modules } from '../content'
import { useAppState } from '../store'
import { ProgressBar } from '../components/ui'

export default function Course() {
  const s = useAppState()
  return (
    <div className="page">
      <h1>Course</h1>
      <p className="lead">Seven modules, from the foundations to the hardest questions. Work through them in order, or jump to what you need.</p>
      {modules.map((m, i) => {
        const d = m.lessons.filter((l) => s.completed[l.id]).length
        return (
          <section key={m.id} className="card course-module">
            <Link to={`/module/${m.id}`} className="course-module-head">
              <span className="module-icon" aria-hidden>{m.icon}</span>
              <div>
                <span className="eyebrow">Module {i + 1} · {d}/{m.lessons.length} done</span>
                <h2>{m.title}</h2>
                <p className="muted">{m.summary}</p>
              </div>
            </Link>
            <ProgressBar value={m.lessons.length ? d / m.lessons.length : 0} />
            <ol className="lesson-list">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link to={`/lesson/${l.id}`} className={s.completed[l.id] ? 'done' : ''}>
                    <span className="check" aria-hidden>{s.completed[l.id] ? '✓' : l.order}</span>
                    <span className="lesson-title">{l.title}</span>
                    <span className="muted small">{l.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

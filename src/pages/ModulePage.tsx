import { Link, useParams } from 'react-router-dom'
import { moduleById, modules } from '../content'
import { useAppState } from '../store'
import { ProgressBar } from '../components/ui'

export default function ModulePage() {
  const { id = '' } = useParams()
  const s = useAppState()
  const m = moduleById.get(id)
  if (!m) return <p>Module not found.</p>
  const idx = modules.indexOf(m)
  const d = m.lessons.filter((l) => s.completed[l.id]).length
  return (
    <div className="page">
      <Link to="/course" className="back">← All modules</Link>
      <p className="eyebrow">Module {idx + 1}</p>
      <h1>{m.icon} {m.title}</h1>
      <p className="lead">{m.summary}</p>
      <ProgressBar value={m.lessons.length ? d / m.lessons.length : 0} />
      <p className="muted small">{d} of {m.lessons.length} lessons complete</p>
      <div className="lesson-cards">
        {m.lessons.map((l) => (
          <Link key={l.id} to={`/lesson/${l.id}`} className={`card lesson-card ${s.completed[l.id] ? 'done' : ''}`}>
            <span className="eyebrow">Lesson {l.order} · {l.minutes} min {s.completed[l.id] && '· ✓ Complete'}</span>
            <strong>{l.title}</strong>
            <p className="muted">{l.bigIdea}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

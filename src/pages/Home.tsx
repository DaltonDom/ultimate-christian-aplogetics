import { Link } from 'react-router-dom'
import { lessons, modules, lessonById, drillItems } from '../content'
import { useAppState, dueCardIds, streak } from '../store'
import { ProgressBar } from '../components/ui'

export default function Home() {
  const s = useAppState()
  const done = lessons.filter((l) => s.completed[l.id]).length
  const due = dueCardIds(s).length
  const next = lessons.find((l) => !s.completed[l.id])
  const last = s.lastLesson && !s.completed[s.lastLesson] ? lessonById.get(s.lastLesson) : undefined
  const resume = last ?? next
  const days = streak(s)
  // A different prompt each day, so there's always one quick rep waiting.
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  const daily = drillItems.length ? drillItems[dayIndex % drillItems.length] : undefined

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">1 Peter 3:15</p>
        <h1>Always be prepared to make a defense…</h1>
        <p className="hero-sub">…to anyone who asks you for a reason for the hope that is in you; yet do it with gentleness and respect.</p>
        <div className="hero-progress">
          <ProgressBar value={lessons.length ? done / lessons.length : 0} label="Course progress" />
          <span>{done} of {lessons.length} lessons complete{days > 0 && ` · 🔥 ${days}-day streak`}</span>
        </div>
      </section>

      <div className="grid-3">
        {resume ? (
          <Link to={`/lesson/${resume.id}`} className="card action-card primary">
            <span className="eyebrow">{last ? 'Pick up where you left off' : done ? 'Next lesson' : 'Start here'}</span>
            <strong>{resume.title}</strong>
            <span className="muted">{resume.minutes} min · {modules.find((m) => m.id === resume.module)?.title}</span>
          </Link>
        ) : (
          <div className="card action-card primary"><strong>Course complete 🎉</strong><span>Keep your review going to make it stick.</span></div>
        )}
        <Link to="/review" className="card action-card">
          <span className="eyebrow">Review</span>
          <strong>{due ? `${due} card${due === 1 ? '' : 's'} due` : 'All caught up'}</strong>
          <span className="muted">{due ? 'A few minutes of recall keeps it fresh.' : 'Complete lessons to add cards.'}</span>
        </Link>
        {daily && (
          <Link to={`/practice?id=${encodeURIComponent(daily.id)}`} className="card action-card">
            <span className="eyebrow">Today's skeptic</span>
            <strong className="clamp-2">{daily.prompt}</strong>
            <span className="muted">How would you answer?</span>
          </Link>
        )}
      </div>

      <h2 className="section-title">Your course</h2>
      <div className="module-list">
        {modules.map((m, i) => {
          const d = m.lessons.filter((l) => s.completed[l.id]).length
          return (
            <Link key={m.id} to={`/module/${m.id}`} className="card module-card">
              <span className="module-icon" aria-hidden>{m.icon}</span>
              <div className="module-body">
                <span className="eyebrow">Module {i + 1}</span>
                <strong>{m.title}</strong>
                <ProgressBar value={m.lessons.length ? d / m.lessons.length : 0} />
                <span className="muted small">{d}/{m.lessons.length} lessons</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="card how-to">
        <h3>How to get the most from this course</h3>
        <ol>
          <li><strong>Read the lesson</strong>, then close it and try to say the Big Idea out loud.</li>
          <li><strong>Take the quiz</strong>. Getting things wrong and retrying is how memory forms.</li>
          <li><strong>Practise the encounter</strong> in practice mode and answer before you reveal.</li>
          <li><strong>Review a few minutes a day.</strong> Cards come back just before you'd forget them.</li>
          <li><strong>Face the Skeptic Simulator</strong>. Answer out loud, like it's a real conversation.</li>
        </ol>
      </div>
    </div>
  )
}

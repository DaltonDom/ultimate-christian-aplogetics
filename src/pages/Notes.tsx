import { Link } from 'react-router-dom'
import { lessons } from '../content'
import { useAppState } from '../store'
import { NoteBox } from './LessonPage'
import { Empty } from '../components/ui'

export default function Notes() {
  const s = useAppState()
  const withNotes = lessons.filter((l) => s.notes[l.id])
  return (
    <div className="page">
      <h1>My Notes</h1>
      <h2 className="section-title">Journal</h2>
      <p className="muted">Prayer requests, people you're sharing with, conversations you've had, questions to research.</p>
      <NoteBox noteKey="journal" placeholder="Write anything here…" />
      <h2 className="section-title">Lesson notes</h2>
      {withNotes.length === 0 ? (
        <Empty><p className="muted">Notes you write at the end of each lesson will show up here.</p></Empty>
      ) : withNotes.map((l) => (
        <article key={l.id} className="card ref-item">
          <Link to={`/lesson/${l.id}#notes`}><strong>{l.title}</strong></Link>
          <p className="note-text">{s.notes[l.id].text}</p>
          <p className="muted small">{new Date(s.notes[l.id].updated).toLocaleDateString()}</p>
        </article>
      ))}
    </div>
  )
}

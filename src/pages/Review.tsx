import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cardById } from '../content'
import { actions, dueCardIds, previewInterval, useAppState, type Rating } from '../store'
import { Empty, Paragraphs } from '../components/ui'

const RATINGS: { r: Rating; label: string; cls: string }[] = [
  { r: 'again', label: 'Forgot', cls: 'again' },
  { r: 'hard', label: 'Hard', cls: 'hard' },
  { r: 'good', label: 'Got it', cls: 'good' },
  { r: 'easy', label: 'Easy', cls: 'easy' },
]

export default function Review() {
  const s = useAppState()
  // Fix the session's queue when the page opens, so answered cards drop out in order.
  const [queue] = useState(() => shuffle(dueCardIds(s).filter((id) => cardById.has(id))))
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const total = Object.keys(s.cards).length
  const upcoming = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(s.cards)) counts[c.due] = (counts[c.due] ?? 0) + 1
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).slice(0, 7)
  }, [s.cards])

  if (!total) {
    return (
      <div className="page">
        <h1>Review</h1>
        <Empty>
          <p>Your review deck is empty.</p>
          <p className="muted">When you complete a lesson, its memory verse, key sentence and flashcards are added here. You can also add Quick Answers and Fallacies from the Reference section.</p>
          <Link to="/course" className="btn primary">Go to the course</Link>
        </Empty>
      </div>
    )
  }

  const id = queue[pos]
  const card = id ? cardById.get(id) : undefined
  const srs = id ? s.cards[id] : undefined

  if (!card || !srs) {
    return (
      <div className="page">
        <h1>Review</h1>
        <Empty>
          <p><strong>{queue.length ? 'Session complete! 🎉' : 'Nothing due right now.'}</strong></p>
          <p className="muted">{total} cards in your deck. Come back tomorrow — spacing out your reviews is what makes them stick.</p>
          {upcoming.length > 0 && (
            <ul className="upcoming">
              {upcoming.map(([d, n]) => <li key={d}><span>{d}</span><span>{n} card{n === 1 ? '' : 's'}</span></li>)}
            </ul>
          )}
        </Empty>
      </div>
    )
  }

  const rate = (r: Rating) => { actions.reviewCard(card.id, r); setFlipped(false); setPos(pos + 1) }

  return (
    <div className="page review">
      <div className="review-top">
        <h1>Review</h1>
        <span className="muted">{pos + 1} / {queue.length}</span>
      </div>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
        <span className="eyebrow">{card.source}</span>
        <p className="fc-front">{card.front}</p>
        {flipped ? (
          <div className="fc-back"><Paragraphs text={card.back} /></div>
        ) : (
          <button className="btn primary" onClick={() => setFlipped(true)}>Show answer</button>
        )}
      </div>
      {flipped && (
        <div className="rating-row">
          {RATINGS.map(({ r, label, cls }) => (
            <button key={r} className={`rate ${cls}`} onClick={() => rate(r)}>
              <strong>{label}</strong>
              <span>{previewInterval(srs, r)}</span>
            </button>
          ))}
        </div>
      )}
      <p className="muted small center">Say the answer out loud before flipping. Be honest with your rating — it decides when you'll see the card again.</p>
      <p className="center"><Link to={card.link} className="small">Open the source →</Link></p>
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

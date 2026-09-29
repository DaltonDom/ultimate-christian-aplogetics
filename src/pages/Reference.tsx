import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { quickAnswers, fallacies, cheatSheets, presentations, resources, lessonById } from '../content'
import { actions, useAppState } from '../store'
import { Paragraphs } from '../components/ui'

const HUB = [
  { to: '/reference/answers', icon: '⚡', title: 'Quick Answers', desc: 'Short, clear responses to the toughest questions.', count: () => quickAnswers.length },
  { to: '/reference/presentations', icon: '✝️', title: 'Gospel Presentations', desc: 'Step-by-step ways to share the gospel, from 60 seconds to 10 minutes.', count: () => presentations.length },
  { to: '/reference/sheets', icon: '📜', title: 'Bible Cheat Sheets', desc: 'Key Scriptures by topic, with a line on each.', count: () => cheatSheets.length },
  { to: '/reference/fallacies', icon: '♟️', title: 'Logical Fallacies', desc: 'Spot bad reasoning, and point it out kindly.', count: () => fallacies.length },
  { to: '/reference/resources', icon: '🔗', title: 'Resources', desc: 'Videos, podcasts, courses and outreach materials.', count: () => resources.length },
]

export function ReferenceHub() {
  return (
    <div className="page">
      <h1>Reference</h1>
      <p className="lead">Your pocket library. It works offline. Tap <strong>Pocket card</strong> on any answer or presentation for big-text view in the middle of a conversation.</p>
      <p><Link to="/search" className="btn">🔍 Search everything</Link></p>
      <div className="grid-2">
        {HUB.map((h) => (
          <Link key={h.to} to={h.to} className="card hub-card">
            <span className="module-icon" aria-hidden>{h.icon}</span>
            <div>
              <strong>{h.title}</strong> <span className="muted small">({h.count()})</span>
              <p className="muted">{h.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function AddToReview({ id }: { id: string }) {
  const s = useAppState()
  const has = !!s.cards[id]
  return (
    <button className={`btn small-btn ${has ? 'subtle' : ''}`} onClick={() => (has ? actions.removeCard(id) : actions.addCards([id]))}>
      {has ? '✓ In review deck' : '+ Add to review'}
    </button>
  )
}

function Filter({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input className="filter-input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}

const matches = (q: string, ...fields: (string | undefined)[]) =>
  !q || q.toLowerCase().split(/\s+/).every((t) => fields.some((f) => f?.toLowerCase().includes(t)))

export function QuickAnswersPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const cats = useMemo(() => ['All', ...new Set(quickAnswers.map((a) => a.category))], [])
  const list = quickAnswers.filter((a) => (cat === 'All' || a.category === cat) && matches(q, a.question, a.short, a.answer))
  return (
    <div className="page">
      <Link to="/reference" className="back">← Reference</Link>
      <h1>⚡ Quick Answers</h1>
      <p className="lead">Lead with the short answer. Give the longer one if they want more. Then bring it back to the gospel.</p>
      <Filter value={q} onChange={setQ} placeholder="Filter questions…" />
      <div className="chips">
        {cats.map((c) => <button key={c} className={`chip ${c === cat ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {list.map((a) => (
        <article key={a.id} id={a.id} className="card ref-item">
          <span className="eyebrow">{a.category}</span>
          <h3>{a.question}</h3>
          <p className="short-answer">{a.short}</p>
          <details>
            <summary>Fuller answer</summary>
            <Paragraphs text={a.answer} />
            {a.verses?.length ? <p className="muted small">📜 {a.verses.join(' · ')}</p> : null}
            {a.related?.length ? (
              <p className="small">Go deeper: {a.related.map((r, i) => (
                <span key={r}>{i > 0 && ', '}<Link to={`/lesson/${r}`}>{lessonById.get(r)?.title ?? r}</Link></span>
              ))}</p>
            ) : null}
          </details>
          <div className="row">
            <Link to={`/pocket/answer/${a.id}`} className="btn small-btn">Pocket card</Link>
            <AddToReview id={`qa:${a.id}`} />
          </div>
        </article>
      ))}
    </div>
  )
}

export function FallaciesPage() {
  const [q, setQ] = useState('')
  const list = fallacies.filter((f) => matches(q, f.name, f.aka, f.definition, f.example))
  return (
    <div className="page">
      <Link to="/reference" className="back">← Reference</Link>
      <h1>♟️ Logical Fallacies</h1>
      <p className="lead">A fallacy is a mistake in reasoning. Name it rarely. Usually a gentle question does more good than a label.</p>
      <Filter value={q} onChange={setQ} placeholder="Filter fallacies…" />
      {list.map((f) => (
        <article key={f.id} id={f.id} className="card ref-item">
          <span className="eyebrow">{f.category}</span>
          <h3>{f.name}{f.aka && <span className="muted small"> · {f.aka}</span>}</h3>
          <p>{f.definition}</p>
          <p className="example"><strong>Example:</strong> {f.example}</p>
          <p><strong>How to respond:</strong> {f.response}</p>
          {f.christianTrap && <p className="trap"><strong>Christians fall into this when:</strong> {f.christianTrap}</p>}
          <AddToReview id={`fal:${f.id}`} />
        </article>
      ))}
    </div>
  )
}

export function CheatSheetsPage() {
  return (
    <div className="page">
      <Link to="/reference" className="back">← Reference</Link>
      <h1>📜 Bible Cheat Sheets</h1>
      <p className="lead">Key verses by topic. Quotations are from the ESV®.</p>
      <nav className="chips">
        {cheatSheets.map((s) => <a key={s.id} href={`#${s.id}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }) }}>{s.title}</a>)}
      </nav>
      {cheatSheets.map((s) => (
        <article key={s.id} id={s.id} className="card ref-item sheet">
          <h2>{s.title}</h2>
          <p className="muted">{s.summary}</p>
          {s.sections.map((sec) => (
            <div key={sec.heading} className="sheet-section">
              <h3>{sec.heading}</h3>
              <ul>
                {sec.items.map((it) => (
                  <li key={it.ref}>
                    <strong>{it.ref}</strong> — {it.note}
                    {it.text && <blockquote>{it.text}</blockquote>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link to={`/pocket/sheet/${s.id}`} className="btn small-btn">Pocket card</Link>
        </article>
      ))}
    </div>
  )
}

export function PresentationsPage() {
  return (
    <div className="page">
      <Link to="/reference" className="back">← Reference</Link>
      <h1>✝️ Gospel Presentations</h1>
      <p className="lead">Different ways to share the same good news. Learn one well first. The Good Person Test is a great place to start.</p>
      {presentations.map((p) => (
        <article key={p.id} id={p.id} className="card ref-item">
          <span className="eyebrow">{p.time} · Best for: {p.bestFor}</span>
          <h2>{p.title}</h2>
          <p>{p.summary}</p>
          <ol className="steps">
            {p.steps.map((st, i) => (
              <li key={i}>
                <strong>{st.title}</strong>
                <p className="say">“{st.say}”</p>
                {st.tip && <p className="muted small">💡 {st.tip}</p>}
              </li>
            ))}
          </ol>
          {p.verses?.length ? <p className="muted small">📜 {p.verses.join(' · ')}</p> : null}
          <Link to={`/pocket/presentation/${p.id}`} className="btn small-btn">Pocket card</Link>
        </article>
      ))}
    </div>
  )
}

export function ResourcesPage() {
  const cats = [...new Set(resources.map((r) => r.category))]
  return (
    <div className="page">
      <Link to="/reference" className="back">← Reference</Link>
      <h1>🔗 Resources</h1>
      <p className="lead">Media this app doesn't include: videos, podcasts, printables and the full courses it's modelled on. These links need an internet connection.</p>
      {cats.map((c) => (
        <section key={c}>
          <h2 className="section-title">{c}</h2>
          {resources.filter((r) => r.category === c).map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="card ref-item link-card">
              <strong>{r.title} ↗</strong>
              <p className="muted">{r.description}</p>
            </a>
          ))}
        </section>
      ))}
    </div>
  )
}

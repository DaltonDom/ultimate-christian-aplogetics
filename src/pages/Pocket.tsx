import { Link, useNavigate, useParams } from 'react-router-dom'
import { quickAnswers, presentations, cheatSheets } from '../content'

/** Big-text, distraction-free card for glancing at mid-conversation. */
export default function Pocket() {
  const { kind, id } = useParams()
  const nav = useNavigate()
  let body: React.ReactNode = <p>Not found.</p>

  if (kind === 'answer') {
    const a = quickAnswers.find((x) => x.id === id)
    if (a) body = (
      <>
        <p className="pocket-label">{a.question}</p>
        <p className="pocket-main">{a.short}</p>
        {a.verses?.length ? <p className="pocket-verses">📜 {a.verses.join(' · ')}</p> : null}
      </>
    )
  } else if (kind === 'presentation') {
    const p = presentations.find((x) => x.id === id)
    if (p) body = (
      <>
        <p className="pocket-label">{p.title}</p>
        <ol className="pocket-steps">
          {p.steps.map((s, i) => <li key={i}><strong>{s.title}</strong><span>{s.say}</span></li>)}
        </ol>
      </>
    )
  } else if (kind === 'sheet') {
    const s = cheatSheets.find((x) => x.id === id)
    if (s) body = (
      <>
        <p className="pocket-label">{s.title}</p>
        {s.sections.map((sec) => (
          <div key={sec.heading}>
            <p className="pocket-sub">{sec.heading}</p>
            <ul className="pocket-refs">{sec.items.map((it) => <li key={it.ref}><strong>{it.ref}</strong> {it.note}</li>)}</ul>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="pocket">
      <div className="pocket-bar">
        <button className="btn subtle" onClick={() => (history.length > 1 ? nav(-1) : nav('/reference'))}>← Back</button>
        <Link to="/reference" className="btn subtle">Reference</Link>
      </div>
      <div className="pocket-card">{body}</div>
    </div>
  )
}

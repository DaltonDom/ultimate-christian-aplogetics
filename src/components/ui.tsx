import { useState, type ReactNode } from 'react'

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** "Think first, then reveal" — retrieval practice for any Q&A pair. */
export function Reveal({ question, children, hint = 'Think of your answer, then tap to reveal' }: {
  question: ReactNode; children: ReactNode; hint?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`reveal ${open ? 'open' : ''}`}>
      <button className="reveal-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <span className="reveal-icon" aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="reveal-a">{children}</div> : <p className="reveal-hint">{hint}</p>}
    </div>
  )
}

export function Section({ id, title, icon, children, lead }: {
  id: string; title: string; icon?: string; children: ReactNode; lead?: string
}) {
  return (
    <section id={id} className="lesson-section">
      <h2>{icon && <span className="section-icon" aria-hidden>{icon}</span>}{title}</h2>
      {lead && <p className="section-lead">{lead}</p>}
      {children}
    </section>
  )
}

export function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

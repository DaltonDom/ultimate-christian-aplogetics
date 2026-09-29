import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { lessons, quickAnswers, fallacies, cheatSheets, presentations, moduleById } from '../content'

interface Hit { to: string; title: string; kind: string; snippet: string; score: number }

// Build a flat, searchable index once.
const INDEX = [
  ...lessons.map((l) => ({
    to: `/lesson/${l.id}`, title: l.title, kind: `Lesson · ${moduleById.get(l.module)?.title}`, snippet: l.bigIdea,
    text: [l.title, l.bigIdea, l.soundbite, l.body, ...l.objections.map((o) => `${o.q} ${o.a}`), ...l.keyVerses.map((v) => v.ref), l.memoryVerse.ref].join(' '),
  })),
  ...quickAnswers.map((a) => ({ to: `/reference/answers#${a.id}`, title: a.question, kind: 'Quick Answer', snippet: a.short, text: `${a.question} ${a.short} ${a.answer} ${(a.verses ?? []).join(' ')}` })),
  ...fallacies.map((f) => ({ to: `/reference/fallacies#${f.id}`, title: f.name, kind: 'Fallacy', snippet: f.definition, text: `${f.name} ${f.aka ?? ''} ${f.definition} ${f.example}` })),
  ...cheatSheets.map((s) => ({ to: `/reference/sheets#${s.id}`, title: s.title, kind: 'Cheat Sheet', snippet: s.summary, text: `${s.title} ${s.summary} ${s.sections.flatMap((x) => x.items.map((i) => `${i.ref} ${i.note} ${i.text ?? ''}`)).join(' ')}` })),
  ...presentations.map((p) => ({ to: `/reference/presentations#${p.id}`, title: p.title, kind: 'Gospel Presentation', snippet: p.summary, text: `${p.title} ${p.summary} ${p.steps.map((s) => `${s.title} ${s.say}`).join(' ')}` })),
].map((e) => ({ ...e, lower: e.text.toLowerCase(), titleLower: e.title.toLowerCase() }))

export default function Search() {
  const [q, setQ] = useState('')
  const hits = useMemo<Hit[]>(() => {
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1)
    if (!terms.length) return []
    return INDEX.map((e) => {
      let score = 0
      for (const t of terms) {
        if (!e.lower.includes(t)) return null
        score += (e.titleLower.includes(t) ? 10 : 0) + Math.min(5, e.lower.split(t).length - 1)
      }
      return { to: e.to, title: e.title, kind: e.kind, snippet: e.snippet, score }
    }).filter((h): h is Hit => !!h).sort((a, b) => b.score - a.score).slice(0, 40)
  }, [q])

  return (
    <div className="page">
      <h1>Search</h1>
      <input className="filter-input big" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Try “hell”, “who made God”, “Mormon”, “Romans 3”…" />
      {q && <p className="muted small">{hits.length} result{hits.length === 1 ? '' : 's'}</p>}
      <div className="search-results">
        {hits.map((h) => (
          <Link key={h.to} to={h.to} className="card ref-item">
            <span className="eyebrow">{h.kind}</span>
            <strong>{h.title}</strong>
            <p className="muted clamp-2">{h.snippet}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

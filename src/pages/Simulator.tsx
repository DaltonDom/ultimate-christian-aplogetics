import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { drillItems, modules, type DrillItem } from '../content'
import { actions, useAppState, type DrillRating, type AppState } from '../store'
import { Paragraphs } from '../components/ui'

/**
 * The Skeptic Simulator: random objections from across the course (interleaved practice).
 * Items you miss come back more often.
 */
export default function Simulator() {
  const s = useAppState()
  const [params, setParams] = useSearchParams()
  const scope = params.get('module') ?? 'all'
  const onlyDone = params.get('done') === '1'
  const pool = useMemo(() => drillItems.filter((d) =>
    (scope === 'all' || (scope === 'reference' ? !d.module : d.module === scope)) &&
    (!onlyDone || !d.module || s.completed[d.link.replace('/lesson/', '')])
  ), [scope, onlyDone, s.completed])

  const requested = params.get('id')
  const [current, setCurrent] = useState<DrillItem | undefined>(() =>
    drillItems.find((d) => d.id === requested) ?? pick(pool, s))
  const [answer, setAnswer] = useState('')
  const [shown, setShown] = useState(false)

  const nextItem = () => { setCurrent(pick(pool, s, current?.id)); setAnswer(''); setShown(false) }
  const rate = (r: DrillRating) => { if (current) actions.rateDrill(current.id, r); nextItem() }
  const setScope = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    p.delete('id')
    setParams(p, { replace: true })
    setCurrent(undefined); setAnswer(''); setShown(false)
  }
  // After a filter change, draw a fresh prompt from the new pool.
  useEffect(() => {
    if (!current || (!pool.some((d) => d.id === current.id) && current.id !== requested)) setCurrent(pick(pool, s))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool])
  const item = current
  const attempted = pool.filter((d) => s.drills[d.id]).length
  const nailed = pool.filter((d) => s.drills[d.id]?.rating === 'nailed').length

  return (
    <div className="page sim">
      <h1>Skeptic Simulator</h1>
      <p className="lead">Someone says this to you. What do you say? Answer out loud (or type it), then compare with a model answer.</p>
      <div className="filters">
        <select value={scope} onChange={(e) => setScope('module', e.target.value === 'all' ? null : e.target.value)} aria-label="Topic">
          <option value="all">All topics (mixed)</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          <option value="reference">Quick Answers</option>
        </select>
        <label className="switch">
          <input type="checkbox" checked={onlyDone} onChange={(e) => setScope('done', e.target.checked ? '1' : null)} />
          <span>Only lessons I've completed</span>
        </label>
        <span className="muted small">{attempted}/{pool.length} tried · {nailed} nailed</span>
      </div>

      {!item ? (
        <div className="empty"><p>No prompts match these filters yet.</p></div>
      ) : (
        <div className="card sim-card">
          <p className="eyebrow">{item.source}</p>
          <p className="sim-prompt">{item.prompt}</p>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4}
            placeholder="Your answer (optional — saying it out loud works too)" />
          {!shown ? (
            <div className="row">
              <button className="btn primary" onClick={() => setShown(true)}>Show model answer</button>
              <button className="btn subtle" onClick={nextItem}>Skip</button>
            </div>
          ) : (
            <>
              <div className="model-answer">
                <span className="label">A good answer</span>
                <Paragraphs text={item.model} />
                <Link to={item.link} className="small">Study this in context →</Link>
              </div>
              <p className="muted small">How did you do?</p>
              <div className="rating-row">
                <button className="rate again" onClick={() => rate('missed')}><strong>Missed it</strong><span>show again soon</span></button>
                <button className="rate hard" onClick={() => rate('close')}><strong>Close</strong><span>needs work</span></button>
                <button className="rate good" onClick={() => rate('nailed')}><strong>Nailed it</strong><span>show less</span></button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Weighted random pick: unseen and missed prompts are much more likely than mastered ones. */
function pick(pool: DrillItem[], s: AppState, exclude?: string): DrillItem | undefined {
  const options = pool.filter((d) => d.id !== exclude)
  if (!options.length) return pool[0]
  const weight = (d: DrillItem) => {
    const r = s.drills[d.id]?.rating
    return r === 'missed' ? 6 : r === 'close' ? 3 : r === 'nailed' ? 0.5 : 4
  }
  let roll = Math.random() * options.reduce((t, d) => t + weight(d), 0)
  for (const d of options) { roll -= weight(d); if (roll <= 0) return d }
  return options[options.length - 1]
}

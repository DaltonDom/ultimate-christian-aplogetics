import { useState } from 'react'
import type { Lesson } from '../content'

/** A scripted witness conversation. Practice mode hides your lines so you can answer first. */
export default function Encounter({ encounter }: { encounter: Lesson['encounter'] }) {
  const [practice, setPractice] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const toggle = (i: number) => setRevealed((r) => { const n = new Set(r); n.has(i) ? n.delete(i) : n.add(i); return n })
  return (
    <div className="encounter">
      <div className="encounter-head">
        <p className="muted"><em>{encounter.setting}</em></p>
        <label className="switch">
          <input type="checkbox" checked={practice} onChange={(e) => { setPractice(e.target.checked); setRevealed(new Set()) }} />
          <span>Practice mode — hide my lines</span>
        </label>
      </div>
      <div className="chat">
        {encounter.lines.map((l, i) => {
          if (l.who === 'note') return practice ? null : <div key={i} className="chat-note">💡 {l.say}</div>
          const hidden = practice && l.who === 'you' && !revealed.has(i)
          return (
            <div key={i} className={`bubble ${l.who}`}>
              <span className="who">{l.who === 'you' ? 'You' : 'Them'}</span>
              {hidden ? (
                <button className="bubble-hidden" onClick={() => toggle(i)}>What would you say? Tap to reveal</button>
              ) : (
                <span onClick={() => practice && l.who === 'you' && toggle(i)}>{l.say}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

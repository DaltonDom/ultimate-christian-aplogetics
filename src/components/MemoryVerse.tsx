import { useState } from 'react'
import type { Verse } from '../content'

type Mode = 'full' | 'letters' | 'hidden'

/**
 * Memorisation helper: read the verse, then practise with only the first letter
 * of each word, then recite it from memory.
 */
export default function MemoryVerse({ verse }: { verse: Verse }) {
  const [mode, setMode] = useState<Mode>('full')
  const text = verse.text ?? ''
  const shown =
    mode === 'full' ? text
    : mode === 'letters' ? text.replace(/([A-Za-z])[A-Za-z’']*/g, '$1')
    : text.replace(/[A-Za-z’']+/g, (w) => '_'.repeat(Math.min(w.length, 6)))
  return (
    <div className="memory-verse">
      <div className="mv-head">
        <strong>{verse.ref}</strong>
        <div className="segmented" role="group" aria-label="Practice mode">
          {(['full', 'letters', 'hidden'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m === 'full' ? 'Read' : m === 'letters' ? 'First letters' : 'Recite'}
            </button>
          ))}
        </div>
      </div>
      <blockquote className={`mv-text mode-${mode}`}>{shown}</blockquote>
      <p className="muted small">
        {mode === 'full' && 'Read it aloud three times, then switch to First letters.'}
        {mode === 'letters' && 'Say the whole verse using only the first letter of each word as your cue.'}
        {mode === 'hidden' && 'Recite it from memory — reference first, then the verse. Tap Read to check.'}
      </p>
    </div>
  )
}

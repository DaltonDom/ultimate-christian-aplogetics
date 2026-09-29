import { useRef, useState } from 'react'
import { actions, exportState, useAppState, type Theme } from '../store'

export default function Settings() {
  const s = useAppState()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ready-to-answer-backup-${new Date().toLocaleDateString('en-CA')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const upload = async (f: File) => {
    try { actions.importState(await f.text()); setMsg('Backup restored.') }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Could not read that file.') }
  }

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card settings-block">
        <h2>Appearance</h2>
        <div className="segmented" role="group" aria-label="Theme">
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <button key={t} className={s.theme === t ? 'active' : ''} onClick={() => actions.setTheme(t)}>
              {t === 'system' ? 'Match device' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-block">
        <h2>Your data</h2>
        <p className="muted">Your progress, notes and review schedule are saved in this browser only. Download a backup to move them to another device (for example, from your computer to your phone), or to keep them safe.</p>
        <div className="row">
          <button className="btn primary" onClick={download}>Download backup</button>
          <button className="btn" onClick={() => file.current?.click()}>Restore from backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>

      <section className="card settings-block">
        <h2>Start over</h2>
        <p className="muted">Erase all progress, quiz scores, notes and review cards.</p>
        <button className="btn danger" onClick={() => { if (confirm('Erase everything? Download a backup first if you might want it.')) actions.reset() }}>Erase all progress</button>
      </section>

      <section className="card settings-block">
        <h2>About</h2>
        <p className="muted small">
          Ready to Answer is a personal study course inspired by the evangelism training of Mark Spence, Ray Comfort and Living Waters.
          It is not produced or endorsed by Living Waters. Lesson text is original. Where Christians disagree, the lessons show the main views.
        </p>
        <p className="muted small">
          Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of
          Good News Publishers. Used by permission. All rights reserved.
        </p>
      </section>
    </div>
  )
}

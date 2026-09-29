import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { lessonById, moduleById, nextLesson, prevLesson, lessonCards } from '../content'
import { actions, useAppState } from '../store'
import Markdown from '../components/Markdown'
import MemoryVerse from '../components/MemoryVerse'
import Encounter from '../components/Encounter'
import Quiz from '../components/Quiz'
import { Paragraphs, Reveal, Section } from '../components/ui'

const SECTIONS = [
  ['learn', 'Learn'], ['verses', 'Verses'], ['objections', 'Objections'], ['encounter', 'Encounter'],
  ['quiz', 'Quiz'], ['practice', 'Practice'], ['notes', 'Notes'],
] as const

export default function LessonPage() {
  const { id = '' } = useParams()
  const s = useAppState()
  const lesson = lessonById.get(id)

  useEffect(() => { if (lesson) actions.visitLesson(lesson.id) }, [lesson])

  if (!lesson) return <p>Lesson not found.</p>
  const mod = moduleById.get(lesson.module)!
  const next = nextLesson(lesson.id)
  const prev = prevLesson(lesson.id)
  const done = !!s.completed[lesson.id]
  const cards = lessonCards(lesson)

  return (
    <article className="page lesson">
      <Link to={`/module/${mod.id}`} className="back">← {mod.icon} {mod.title}</Link>
      <header className="lesson-head">
        <p className="eyebrow">Lesson {lesson.order} · {lesson.minutes} min read {done && '· ✓ Complete'}</p>
        <h1>{lesson.title}</h1>
        <div className="big-idea">
          <span className="label">Big idea</span>
          <p>{lesson.bigIdea}</p>
        </div>
      </header>

      <nav className="section-nav" aria-label="Lesson sections">
        {SECTIONS.filter(([k]) => k !== 'objections' || lesson.objections.length).map(([k, label]) => (
          <a key={k} href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.scrollIntoView({ behavior: 'smooth' }) }}>
            {label}
          </a>
        ))}
      </nav>

      <Section id="learn" title="Learn" icon="📖">
        <Markdown>{lesson.body}</Markdown>
        <div className="soundbite">
          <span className="label">Say it in a sentence</span>
          <p>“{lesson.soundbite}”</p>
          <p className="muted small">Close your eyes and say this out loud until you can do it without looking.</p>
        </div>
      </Section>

      <Section id="verses" title="Scripture" icon="📜">
        <h3>Memory verse</h3>
        <MemoryVerse verse={lesson.memoryVerse} />
        <h3>Key verses</h3>
        <div className="verse-list">
          {lesson.keyVerses.map((v) => (
            <div key={v.ref} className="verse">
              <strong>{v.ref}</strong>
              {v.text && <blockquote>{v.text}</blockquote>}
              {v.note && <p className="muted">{v.note}</p>}
            </div>
          ))}
        </div>
      </Section>

      {lesson.differ && (
        <Section id="differ" title="Christians differ here" icon="⚖️" lead={lesson.differ.topic}>
          <div className="differ">
            {lesson.differ.views.map((v) => (
              <div key={v.name} className="differ-view">
                <strong>{v.name}</strong>
                <p>{v.summary}</p>
              </div>
            ))}
          </div>
          <p className="differ-takeaway"><strong>Takeaway:</strong> {lesson.differ.takeaway}</p>
        </Section>
      )}

      {lesson.objections.length > 0 && (
        <Section id="objections" title="Objections & answers" icon="🛡️" lead="Try to answer each one yourself before you reveal it.">
          {lesson.objections.map((o, i) => (
            <Reveal key={i} question={o.q}><Paragraphs text={o.a} /></Reveal>
          ))}
        </Section>
      )}

      <Section id="encounter" title="Witness encounter" icon="💬" lead="See the method in a real conversation. Then switch on practice mode and say your lines before revealing them.">
        <Encounter encounter={lesson.encounter} />
      </Section>

      <Section id="history" title="From church history" icon="🕯️">
        <figure className="history-quote">
          <blockquote>“{lesson.churchHistory.quote}”</blockquote>
          <figcaption>— {lesson.churchHistory.author}{lesson.churchHistory.source && `, ${lesson.churchHistory.source}`}</figcaption>
        </figure>
      </Section>

      {lesson.videos.length > 0 && (
        <Section id="videos" title="Watch" icon="▶️">
          <ul className="video-list">
            {lesson.videos.map((v) => (
              <li key={v.url}><a href={v.url} target="_blank" rel="noreferrer">{v.title}</a>{v.note && <span className="muted"> — {v.note}</span>}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="quiz" title="Quiz" icon="✅">
        <Quiz key={lesson.id} id={lesson.id} questions={lesson.quiz} best={s.quiz[lesson.id]} />
      </Section>

      <Section id="practice" title="Practice" icon="🎯" lead="Answer out loud as if the person were in front of you, then compare.">
        {lesson.drills.map((d, i) => (
          <Reveal key={i} question={d.prompt} hint="Say your answer out loud, then tap to compare"><Paragraphs text={d.model} /></Reveal>
        ))}
        <p><Link to={`/practice?module=${lesson.module}`} className="btn">More in the Skeptic Simulator →</Link></p>
        <h3>Flashcards in this lesson</h3>
        <p className="muted small">
          {done ? 'These are in your review deck.' : `These ${cards.length} cards join your review deck when you complete the lesson.`}
        </p>
        <div className="mini-cards">
          {cards.map((c) => (
            <Reveal key={c.id} question={c.front} hint="Recall, then reveal"><Paragraphs text={c.back} /></Reveal>
          ))}
        </div>
      </Section>

      <Section id="notes" title="My notes" icon="📝">
        <NoteBox key={lesson.id} noteKey={lesson.id} />
      </Section>

      <footer className="lesson-foot">
        {done ? (
          <div className="complete-banner">
            <span>✓ Completed {s.completed[lesson.id]}</span>
            <button className="btn subtle" onClick={() => actions.uncompleteLesson(lesson.id)}>Mark incomplete</button>
          </div>
        ) : (
          <button className="btn primary big" onClick={() => actions.completeLesson(lesson.id, cards.map((c) => c.id))}>
            Mark lesson complete
          </button>
        )}
        <div className="pager">
          {prev ? <Link to={`/lesson/${prev.id}`} className="btn">← {prev.title}</Link> : <span />}
          {next && <Link to={`/lesson/${next.id}`} className="btn primary-outline">{next.title} →</Link>}
        </div>
      </footer>
    </article>
  )
}

export function NoteBox({ noteKey, placeholder }: { noteKey: string; placeholder?: string }) {
  const s = useAppState()
  const [text, setText] = useState(s.notes[noteKey]?.text ?? '')
  // Save shortly after typing stops.
  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== (s.notes[noteKey]?.text ?? '')) actions.saveNote(noteKey, text)
    }, 500)
    return () => clearTimeout(t)
  }, [text, noteKey, s.notes])
  return (
    <div className="notebox">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
        placeholder={placeholder ?? 'What stood out? Who could you share this with? What questions do you still have?'} />
      <p className="muted small">{s.notes[noteKey] ? `Saved ${new Date(s.notes[noteKey].updated).toLocaleString()}` : 'Notes save automatically.'}</p>
    </div>
  )
}

import { useState } from 'react'
import type { QuizQuestion } from '../content'
import { actions } from '../store'

export default function Quiz({ id, questions, best }: { id: string; questions: QuizQuestion[]; best?: { best: number; total: number } }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)
  const score = picked.filter((p, i) => p === questions[i].answer).length
  const allAnswered = picked.every((p) => p !== null)

  const submit = () => { setSubmitted(true); actions.recordQuiz(id, score, questions.length) }
  const retry = () => { setPicked(questions.map(() => null)); setSubmitted(false) }

  return (
    <div className="quiz">
      {best && !submitted && <p className="muted small">Your best: {best.best}/{best.total}</p>}
      <ol className="quiz-list">
        {questions.map((q, qi) => (
          <li key={qi} className="quiz-q">
            <p className="quiz-prompt">{q.q}</p>
            <div className="quiz-options">
              {q.options.map((o, oi) => {
                const chosen = picked[qi] === oi
                const state = !submitted ? (chosen ? 'chosen' : '')
                  : oi === q.answer ? 'correct' : chosen ? 'wrong' : ''
                return (
                  <button key={oi} className={`quiz-opt ${state}`} disabled={submitted}
                    onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}>
                    {o}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <p className={`quiz-explain ${picked[qi] === q.answer ? 'ok' : 'miss'}`}>
                {picked[qi] === q.answer ? '✓ ' : '✗ '}{q.explain}
              </p>
            )}
          </li>
        ))}
      </ol>
      {!submitted ? (
        <button className="btn primary" disabled={!allAnswered} onClick={submit}>
          {allAnswered ? 'Check answers' : `Answer all ${questions.length} to check`}
        </button>
      ) : (
        <div className="quiz-result">
          <strong>{score}/{questions.length}</strong>
          <span>{score === questions.length ? 'Perfect — well done!' : score >= questions.length * 0.7 ? 'Solid. Review the ones you missed.' : 'Reread the lesson and try again — retrying is how it sticks.'}</span>
          <button className="btn" onClick={retry}>Try again</button>
        </div>
      )}
    </div>
  )
}

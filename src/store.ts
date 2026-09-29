// All personal progress lives in localStorage under one key. Export/import from Settings.
import { useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type Rating = 'again' | 'hard' | 'good' | 'easy'
export type DrillRating = 'missed' | 'close' | 'nailed'

/** Spaced-repetition state for one card (a simplified SM-2). */
export interface SrsCard {
  due: string      // ISO date (yyyy-mm-dd) the card is next due
  interval: number // days
  ease: number     // multiplier, starts at 2.5
  reps: number     // successful reviews in a row
  lapses: number
}

export interface AppState {
  version: 1
  completed: Record<string, string>                   // lessonId → date completed
  quiz: Record<string, { best: number; total: number }>
  notes: Record<string, { text: string; updated: string }>
  cards: Record<string, SrsCard>                       // cardId → schedule
  drills: Record<string, { rating: DrillRating; at: string; attempts: number }>
  lastLesson?: string
  theme: Theme
  activity: string[]                                   // distinct days (yyyy-mm-dd) with study activity
}

const KEY = 'ready-to-answer:v1'
const empty: AppState = { version: 1, completed: {}, quiz: {}, notes: {}, cards: {}, drills: {}, theme: 'system', activity: [] }

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function set(update: (s: AppState) => AppState) {
  state = update(state)
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
  listeners.forEach((l) => l())
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => state,
  )
}

export const today = () => new Date().toLocaleDateString('en-CA') // yyyy-mm-dd in local time
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}
const withActivity = (s: AppState): AppState =>
  s.activity.includes(today()) ? s : { ...s, activity: [...s.activity, today()].slice(-400) }

// ---- actions ----------------------------------------------------------------

export const actions = {
  completeLesson(id: string, cardIds: string[]) {
    set((s) => withActivity({
      ...s,
      completed: { ...s.completed, [id]: s.completed[id] ?? today() },
      cards: addCards(s.cards, cardIds),
    }))
  },
  uncompleteLesson(id: string) {
    set((s) => {
      const completed = { ...s.completed }
      delete completed[id]
      return { ...s, completed }
    })
  },
  visitLesson(id: string) {
    if (state.lastLesson !== id) set((s) => ({ ...s, lastLesson: id }))
  },
  recordQuiz(id: string, score: number, total: number) {
    set((s) => withActivity({
      ...s,
      quiz: { ...s.quiz, [id]: { best: Math.max(score, s.quiz[id]?.best ?? 0), total } },
    }))
  },
  saveNote(key: string, text: string) {
    set((s) => {
      const notes = { ...s.notes }
      if (text.trim()) notes[key] = { text, updated: new Date().toISOString() }
      else delete notes[key]
      return { ...s, notes }
    })
  },
  addCards(ids: string[]) {
    set((s) => ({ ...s, cards: addCards(s.cards, ids) }))
  },
  removeCard(id: string) {
    set((s) => {
      const cards = { ...s.cards }
      delete cards[id]
      return { ...s, cards }
    })
  },
  reviewCard(id: string, rating: Rating) {
    set((s) => {
      const c = s.cards[id]
      if (!c) return s
      return withActivity({ ...s, cards: { ...s.cards, [id]: schedule(c, rating) } })
    })
  },
  rateDrill(id: string, rating: DrillRating) {
    set((s) => withActivity({
      ...s,
      drills: { ...s.drills, [id]: { rating, at: today(), attempts: (s.drills[id]?.attempts ?? 0) + 1 } },
    }))
  },
  setTheme(theme: Theme) {
    set((s) => ({ ...s, theme }))
  },
  importState(json: string) {
    const parsed = JSON.parse(json)
    if (parsed?.version !== 1) throw new Error('This file is not a Ready to Answer backup.')
    set(() => ({ ...empty, ...parsed }))
  },
  reset() {
    set(() => ({ ...empty, theme: state.theme }))
  },
}

export const exportState = () => JSON.stringify(state, null, 2)

function addCards(cards: Record<string, SrsCard>, ids: string[]) {
  const next = { ...cards }
  for (const id of ids) if (!next[id]) next[id] = { due: today(), interval: 0, ease: 2.5, reps: 0, lapses: 0 }
  return next
}

/**
 * Spaced repetition: each successful review pushes the next one further out
 * (1 day → 3 days → ~a week → ~2–3 weeks …). Forgetting brings the card back tomorrow.
 */
export function schedule(c: SrsCard, rating: Rating): SrsCard {
  if (rating === 'again') {
    return { ...c, reps: 0, lapses: c.lapses + 1, interval: 1, ease: Math.max(1.3, c.ease - 0.2), due: addDays(today(), 1) }
  }
  const ease = Math.max(1.3, c.ease + (rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0))
  let interval: number
  if (c.reps === 0) interval = rating === 'easy' ? 3 : 1
  else if (c.reps === 1) interval = rating === 'hard' ? 2 : rating === 'easy' ? 5 : 3
  else interval = Math.round(c.interval * (rating === 'hard' ? 1.2 : rating === 'easy' ? ease * 1.3 : ease))
  interval = Math.max(1, Math.min(interval, 365))
  return { ...c, reps: c.reps + 1, interval, ease, due: addDays(today(), interval) }
}

/** Preview the next interval for a rating, for button labels. */
export function previewInterval(c: SrsCard, rating: Rating): string {
  const days = schedule(c, rating).interval
  return days === 1 ? '1 day' : days < 30 ? `${days} days` : `${Math.round(days / 30)} mo`
}

export function dueCardIds(s: AppState): string[] {
  const t = today()
  return Object.entries(s.cards).filter(([, c]) => c.due <= t).map(([id]) => id)
}

/** Consecutive days of activity ending today (or yesterday, so the streak isn't lost before you study). */
export function streak(s: AppState): number {
  const days = new Set(s.activity)
  let d = days.has(today()) ? today() : addDays(today(), -1)
  let n = 0
  while (days.has(d)) { n++; d = addDays(d, -1) }
  return n
}

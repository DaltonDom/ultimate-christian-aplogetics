// Loads every file in content/ at build time. See content/SCHEMA.md for the formats.
import { parse } from 'yaml'
import modulesRaw from '../content/modules.yaml?raw'
import quickAnswersRaw from '../content/reference/quick-answers.yaml?raw'
import fallaciesRaw from '../content/reference/fallacies.yaml?raw'
import cheatSheetsRaw from '../content/reference/cheat-sheets.yaml?raw'
import presentationsRaw from '../content/reference/gospel-presentations.yaml?raw'
import resourcesRaw from '../content/reference/resources.yaml?raw'

export interface Verse { ref: string; text?: string; note?: string }
export interface QuizQuestion { q: string; options: string[]; answer: number; explain: string }
export interface Flashcard { front: string; back: string }
export interface Drill { prompt: string; model: string }
export interface EncounterLine { who: 'you' | 'them' | 'note'; say: string }
export interface Video { title: string; url: string; note?: string }

export interface Lesson {
  id: string
  module: string
  order: number
  title: string
  minutes: number
  bigIdea: string
  soundbite: string
  memoryVerse: Verse
  keyVerses: Verse[]
  objections: { q: string; a: string }[]
  encounter: { setting: string; lines: EncounterLine[] }
  churchHistory: { quote: string; author: string; source?: string }
  differ?: { topic: string; views: { name: string; summary: string }[]; takeaway: string }
  quiz: QuizQuestion[]
  flashcards: Flashcard[]
  drills: Drill[]
  videos: Video[]
  body: string
}

export interface Module { id: string; title: string; icon: string; summary: string; lessons: Lesson[] }

export interface QuickAnswer {
  id: string; question: string; category: string; short: string; answer: string
  verses?: string[]; related?: string[]
}
export interface Fallacy {
  id: string; name: string; aka?: string; category: string; definition: string
  example: string; christianTrap?: string; response: string
}
export interface CheatSheet {
  id: string; title: string; summary: string
  sections: { heading: string; items: Verse[] }[]
}
export interface Presentation {
  id: string; title: string; time: string; bestFor: string; summary: string
  steps: { title: string; say: string; tip?: string }[]; verses?: string[]
}
export interface Resource { title: string; url: string; description: string; category: string }

const lessonFiles = import.meta.glob('../content/lessons/**/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

function parseLesson(path: string, raw: string): Lesson | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) { console.warn(`No frontmatter in ${path}`); return null }
  try {
    const fm = parse(m[1]) as Omit<Lesson, 'body'>
    return {
      ...fm,
      keyVerses: fm.keyVerses ?? [],
      objections: fm.objections ?? [],
      quiz: fm.quiz ?? [],
      flashcards: fm.flashcards ?? [],
      drills: fm.drills ?? [],
      videos: fm.videos ?? [],
      encounter: fm.encounter ?? { setting: '', lines: [] },
      body: m[2],
    }
  } catch (e) {
    console.warn(`Could not parse ${path}`, e)
    return null
  }
}

const allLessons = Object.entries(lessonFiles)
  .map(([p, raw]) => parseLesson(p, raw))
  .filter((l): l is Lesson => !!l)

export const modules: Module[] = (parse(modulesRaw).modules as Omit<Module, 'lessons'>[]).map((m) => ({
  ...m,
  lessons: allLessons.filter((l) => l.module === m.id).sort((a, b) => a.order - b.order),
}))

/** Every lesson in course order. */
export const lessons: Lesson[] = modules.flatMap((m) => m.lessons)
export const lessonById = new Map(lessons.map((l) => [l.id, l]))
export const moduleById = new Map(modules.map((m) => [m.id, m]))

export const quickAnswers: QuickAnswer[] = parse(quickAnswersRaw)?.answers ?? []
export const fallacies: Fallacy[] = parse(fallaciesRaw)?.fallacies ?? []
export const cheatSheets: CheatSheet[] = parse(cheatSheetsRaw)?.sheets ?? []
export const presentations: Presentation[] = parse(presentationsRaw)?.presentations ?? []
export const resources: Resource[] = parse(resourcesRaw)?.resources ?? []

export function nextLesson(id: string): Lesson | undefined {
  const i = lessons.findIndex((l) => l.id === id)
  return i >= 0 ? lessons[i + 1] : undefined
}
export function prevLesson(id: string): Lesson | undefined {
  const i = lessons.findIndex((l) => l.id === id)
  return i > 0 ? lessons[i - 1] : undefined
}

// ---- Review cards ----------------------------------------------------------
// Every flashcard-able item in the course gets a stable id. Lesson cards join your
// review deck when you complete the lesson; reference cards join when you add them.

export interface Card { id: string; front: string; back: string; source: string; link: string }

export function lessonCards(l: Lesson): Card[] {
  const link = `/lesson/${l.id}`
  return [
    { id: `${l.id}:mv`, front: `Memory verse — ${l.memoryVerse.ref}`, back: l.memoryVerse.text ?? '', source: l.title, link },
    { id: `${l.id}:sb`, front: `Say it in a sentence: ${l.title}`, back: l.soundbite, source: l.title, link },
    ...l.flashcards.map((c, i) => ({ id: `${l.id}:fc:${i}`, front: c.front, back: c.back, source: l.title, link })),
  ]
}

export const referenceCards: Card[] = [
  ...quickAnswers.map((q) => ({
    id: `qa:${q.id}`, front: q.question, back: q.short, source: 'Quick Answers', link: `/reference/answers#${q.id}`,
  })),
  ...fallacies.map((f) => ({
    id: `fal:${f.id}`, front: `Fallacy: ${f.name}`, back: `${f.definition}\n\nRespond: ${f.response}`,
    source: 'Fallacies', link: `/reference/fallacies#${f.id}`,
  })),
]

export const cardById = new Map<string, Card>([
  ...lessons.flatMap(lessonCards).map((c) => [c.id, c] as const),
  ...referenceCards.map((c) => [c.id, c] as const),
])

// ---- Skeptic Simulator prompts --------------------------------------------

export interface DrillItem { id: string; prompt: string; model: string; source: string; module?: string; link: string }

export const drillItems: DrillItem[] = [
  ...lessons.flatMap((l) => [
    ...l.drills.map((d, i) => ({
      id: `${l.id}:dr:${i}`, prompt: d.prompt, model: d.model, source: l.title, module: l.module, link: `/lesson/${l.id}`,
    })),
    ...l.objections.map((o, i) => ({
      id: `${l.id}:ob:${i}`, prompt: o.q, model: o.a, source: l.title, module: l.module, link: `/lesson/${l.id}`,
    })),
  ]),
  ...quickAnswers.map((q) => ({
    id: `qa:${q.id}`, prompt: q.question, model: `${q.short}\n\n${q.answer}`, source: 'Quick Answers',
    link: `/reference/answers#${q.id}`,
  })),
]

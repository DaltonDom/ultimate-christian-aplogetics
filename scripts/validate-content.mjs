#!/usr/bin/env node
// Validates everything in content/ against content/SCHEMA.md and reports the ESV verse budget.
// Usage: npm run validate   (exit code 1 on errors; warnings don't fail)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')
const ESV_BUDGET = 500
const LESSON_VERSE_LIMIT = 6
const SHEET_VERSE_LIMIT = 8

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)

// ---- verse counting ---------------------------------------------------------
// Counts the verses in a reference like "Romans 3:19-20", "John 3:16", "1 John 1:8-2:2".
// Cross-chapter ranges are estimated with 30 verses per chapter.
const SINGLE_CHAPTER = /^(Obadiah|Philemon|2 John|3 John|Jude)\s+(\d+)(?:[-–](\d+))?$/
function versesIn(ref) {
  const one = ref.trim().match(SINGLE_CHAPTER)
  if (one) ref = `${one[1]} 1:${one[2]}${one[3] ? `-${one[3]}` : ''}`
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:[-–](?:(\d+):)?(\d+))?/)
  if (!m) return []
  const [, book, ch, v1, ch2, v2] = m
  const out = []
  const start = Number(v1)
  if (!v2) return [`${book} ${ch}:${start}`]
  if (!ch2 || ch2 === ch) {
    for (let v = start; v <= Number(v2); v++) out.push(`${book} ${ch}:${v}`)
  } else {
    for (let c = Number(ch); c <= Number(ch2); c++) {
      const from = c === Number(ch) ? start : 1
      const to = c === Number(ch2) ? Number(v2) : 30
      for (let v = from; v <= to; v++) out.push(`${book} ${c}:${v}`)
    }
  }
  return out
}

const quoted = new Set()
function quote(file, ref, text) {
  if (!text) return 0
  const vs = versesIn(ref)
  if (!vs.length) warn(file, `could not parse verse reference "${ref}"`)
  vs.forEach((v) => quoted.add(v))
  return vs.length
}

// ---- helpers ----------------------------------------------------------------
const need = (file, obj, keys, where = '') => {
  for (const k of keys) {
    const v = obj?.[k]
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0))
      err(file, `${where}missing "${k}"`)
  }
}
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const words = (s) => (s.match(/\S+/g) || []).length

// ---- modules ----------------------------------------------------------------
const { modules } = parse(readFileSync(join(CONTENT, 'modules.yaml'), 'utf8'))
const moduleIds = new Set(modules.map((m) => m.id))

// ---- lessons ----------------------------------------------------------------
const lessonIds = new Set()
const perModule = {}
for (const path of walk(join(CONTENT, 'lessons')).filter((p) => p.endsWith('.md'))) {
  const file = relative(ROOT, path)
  const raw = readFileSync(path, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) { err(file, 'missing YAML frontmatter'); continue }
  let fm
  try { fm = parse(m[1]) } catch (e) { err(file, `YAML error: ${e.message.split('\n')[0]}`); continue }
  const body = m[2]

  need(file, fm, ['id', 'module', 'order', 'title', 'minutes', 'bigIdea', 'soundbite', 'memoryVerse',
    'keyVerses', 'objections', 'encounter', 'churchHistory', 'quiz', 'flashcards', 'drills'])
  if (!moduleIds.has(fm.module)) err(file, `unknown module "${fm.module}"`)
  if (fm.id !== `${fm.module}-${fm.order}`) err(file, `id should be "${fm.module}-${fm.order}"`)
  if (lessonIds.has(fm.id)) err(file, `duplicate lesson id ${fm.id}`)
  lessonIds.add(fm.id)
  perModule[fm.module] = (perModule[fm.module] || 0) + 1

  let count = 0
  if (fm.memoryVerse) { need(file, fm.memoryVerse, ['ref', 'text'], 'memoryVerse: '); count += quote(file, fm.memoryVerse.ref, fm.memoryVerse.text) }
  for (const [i, kv] of (fm.keyVerses || []).entries()) {
    need(file, kv, ['ref', 'note'], `keyVerses[${i}]: `)
    // Don't double-count the memory verse if repeated.
    if (kv.ref !== fm.memoryVerse?.ref) count += quote(file, kv.ref, kv.text)
  }
  if (count > LESSON_VERSE_LIMIT) warn(file, `quotes ${count} verses (limit ${LESSON_VERSE_LIMIT})`)

  ;(fm.objections || []).forEach((o, i) => need(file, o, ['q', 'a'], `objections[${i}]: `))
  if (fm.encounter) {
    need(file, fm.encounter, ['setting', 'lines'], 'encounter: ')
    ;(fm.encounter.lines || []).forEach((l, i) => {
      if (!['you', 'them', 'note'].includes(l.who)) err(file, `encounter.lines[${i}]: who must be you|them|note`)
      if (!l.say) err(file, `encounter.lines[${i}]: missing "say"`)
    })
  }
  if (fm.churchHistory) need(file, fm.churchHistory, ['quote', 'author'], 'churchHistory: ')
  if (fm.differ) {
    need(file, fm.differ, ['topic', 'views', 'takeaway'], 'differ: ')
    ;(fm.differ.views || []).forEach((v, i) => need(file, v, ['name', 'summary'], `differ.views[${i}]: `))
  }
  ;(fm.quiz || []).forEach((q, i) => {
    need(file, q, ['q', 'options', 'explain'], `quiz[${i}]: `)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length)
      err(file, `quiz[${i}]: answer index out of range`)
  })
  ;(fm.flashcards || []).forEach((c, i) => need(file, c, ['front', 'back'], `flashcards[${i}]: `))
  ;(fm.drills || []).forEach((d, i) => need(file, d, ['prompt', 'model'], `drills[${i}]: `))

  const w = words(body)
  if (w < 900) warn(file, `body is only ${w} words (target 1,200–1,800)`)
  if (!/##\s+Putting It Into Practice/.test(body)) warn(file, 'body missing "## Putting It Into Practice"')
}

// ---- reference --------------------------------------------------------------
const ref = (name) => {
  const p = join(CONTENT, 'reference', name)
  try { return parse(readFileSync(p, 'utf8')) || {} } catch (e) { err(`content/reference/${name}`, e.message.split('\n')[0]); return {} }
}
const uniq = (file, list) => {
  const seen = new Set()
  for (const x of list) { if (seen.has(x.id)) err(file, `duplicate id ${x.id}`); seen.add(x.id) }
}
const checkRelated = (file, item) =>
  (item.related || []).forEach((r) => lessonIds.has(r) || warn(file, `${item.id}: unknown related lesson "${r}"`))

{
  const f = 'content/reference/quick-answers.yaml'
  const { answers = [] } = ref('quick-answers.yaml')
  uniq(f, answers)
  answers.forEach((a) => { need(f, a, ['id', 'question', 'category', 'short', 'answer'], `${a.id}: `); checkRelated(f, a) })
}
{
  const f = 'content/reference/fallacies.yaml'
  const { fallacies = [] } = ref('fallacies.yaml')
  uniq(f, fallacies)
  fallacies.forEach((x) => need(f, x, ['id', 'name', 'category', 'definition', 'example', 'response'], `${x.id}: `))
}
{
  const f = 'content/reference/cheat-sheets.yaml'
  const { sheets = [] } = ref('cheat-sheets.yaml')
  uniq(f, sheets)
  for (const s of sheets) {
    need(f, s, ['id', 'title', 'summary', 'sections'], `${s.id}: `)
    let n = 0
    for (const sec of s.sections || []) for (const it of sec.items || []) {
      need(f, it, ['ref', 'note'], `${s.id}: `)
      n += quote(f, it.ref, it.text)
    }
    if (n > SHEET_VERSE_LIMIT) warn(f, `${s.id} quotes ${n} verses (limit ${SHEET_VERSE_LIMIT})`)
  }
}
{
  const f = 'content/reference/gospel-presentations.yaml'
  const { presentations = [] } = ref('gospel-presentations.yaml')
  uniq(f, presentations)
  presentations.forEach((p) => {
    need(f, p, ['id', 'title', 'time', 'bestFor', 'summary', 'steps'], `${p.id}: `)
    ;(p.steps || []).forEach((s, i) => need(f, s, ['title', 'say'], `${p.id}.steps[${i}]: `))
  })
}

// ---- report -----------------------------------------------------------------
console.log('Lessons per module:')
for (const m of modules) console.log(`  ${m.id.padEnd(12)} ${perModule[m.id] || 0}`)
console.log(`\nESV verses quoted (unique): ${quoted.size} / ${ESV_BUDGET}`)
if (quoted.size > ESV_BUDGET) err('content', `ESV budget exceeded (${quoted.size} > ${ESV_BUDGET})`)
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ` + warnings.join('\n  '))
if (errors.length) { console.log(`\n${errors.length} error(s):\n  ` + errors.join('\n  ')); process.exit(1) }
console.log('\n✓ Content is valid.')

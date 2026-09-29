# Content Guide

All course content lives in `content/`. The app reads these files at build time, so
editing a file and saving it updates the running app (`npm run dev`).

Run `npm run validate` after any edit — it checks every file against this schema and
reports the ESV verse budget.

## Lessons — `content/lessons/<module>/NN-slug.md`

A lesson is a Markdown file with YAML frontmatter. The frontmatter holds the structured
parts (verses, quiz, flashcards, drills…); the Markdown body is the teaching.

```yaml
---
id: gospel-1                 # <module>-<order>, unique
module: gospel               # must match an id in content/modules.yaml
order: 1
title: Why the Law Comes Before Grace
minutes: 12                  # honest reading time for the body + sections
bigIdea: >-                  # ONE sentence. The thing to remember if you forget everything else.
  ...
soundbite: >-                # A short line you could say out loud in a real conversation (≤ 25 words).
  ...
memoryVerse:
  ref: Galatians 3:24
  text: "..."                # ESV, exact
keyVerses:                   # 2–4 entries. `text` is optional — omit it to cite by reference only.
  - ref: Romans 3:19-20
    text: "..."              # ESV, exact (counts toward the verse budget)
    note: Why this verse matters here, in one sentence.
objections:                  # 3–5. What someone will actually say, and a clear, kind answer.
  - q: "..."
    a: >-
      ...
encounter:                   # A scripted Witness Encounter, 10–18 lines, showing THIS lesson's method.
  setting: Coffee shop, talking with a coworker named Jake.
  lines:
    - who: you               # "you" or "them"
      say: "..."
    - who: them
      say: "..."
    - who: note              # optional coaching aside shown in the margin
      say: Notice you asked a question instead of making a statement.
churchHistory:               # A real, well-attested quote from a public-domain Christian voice.
  quote: "..."
  author: Charles Spurgeon
  source: Sermon title or work, year if known
differ:                      # OPTIONAL. Where faithful Christians genuinely disagree.
  topic: The age of the earth
  views:
    - name: Young-earth creation
      summary: ...
    - name: Old-earth creation
      summary: ...
  takeaway: What they share, and how to handle this in conversation.
quiz:                        # 5–7 questions. Mix recall and application ("What would you say next?").
  - q: "..."
    options: ["...", "...", "...", "..."]
    answer: 1                # zero-based index into options
    explain: Why that answer is right (one or two sentences).
flashcards:                  # 3–6. Front = prompt, back = answer. Short enough to recall in 10 seconds.
  - front: "..."
    back: "..."
drills:                      # 2–4 Skeptic Simulator prompts: something a person says, and a model reply.
  - prompt: "\"...\""
    model: >-
      ...
videos: []                   # Filled in later from Mark Spence transcripts: [{title, url, note}]
---

Markdown body — the teaching.
```

### Body structure

Write the body in plain Markdown, using `##` headings. Aim for **1,200–1,800 words**.

1. Open with a short hook (a question, a real-life moment, or a one-paragraph story).
2. 3–5 `##` sections that build the idea step by step.
3. Use short paragraphs, bullet lists, and **bold** for key terms. Use a `>` blockquote
   for a key illustration.
4. End with `## Putting It Into Practice` — 3–5 concrete steps for this week.

Do not repeat the memory verse, objections, encounter, or quiz in the body — the app
renders those as their own sections.

## Style rules (important)

- **Easy to understand.** Write for a motivated beginner. Define every technical term the
  first time (e.g. "*contingent* — something that depends on something else to exist").
  Short sentences. Concrete examples. No academic throat-clearing.
- **Warm, confident, never smug.** Gentleness and respect (1 Pet 3:15) in every answer.
- **Original wording.** Write everything in your own words. You may describe well-known
  methods and credit them (e.g. "the Good Person Test popularised by Ray Comfort and the
  Living Waters team", "Greg Koukl's Columbo tactic", "Gary Habermas's minimal facts"),
  but never reproduce text from books, courses, or videos. Never invent a quote and
  attribute it to a living person.
- **Honest.** Don't overstate evidence. Where evangelicals disagree, add a `differ` block
  that presents each view fairly and charitably.
- **Gospel-centred.** Apologetics exists to clear the path to the cross. Where natural,
  show how the topic leads back to sin, the cross, and repentance and faith.
- **Church history quotes** must be real and well-attested (Spurgeon, Luther, Calvin,
  Wesley, Whitefield, Moody, Augustine, Pascal, Lewis, Bonhoeffer, etc). If you are not
  confident of the exact wording, choose a different, better-known quote.

## Scripture — ESV

Quote the **English Standard Version** exactly. Crossway allows up to 500 verses to be
quoted without permission, so the whole course has a budget:

- Lessons: **at most 6 quoted verses per lesson** (memory verse + keyVerses, counting
  every verse in a range). Cite additional passages by reference only (omit `text`).
- Reference sheets: see limits in each reference file.

Only quote a verse if you are confident of the exact ESV wording. If unsure, cite it
by reference only.

## Reference — `content/reference/*.yaml`

See the header comment in each file for its schema:

- `quick-answers.yaml` — concise answers to tough questions (reference-only Scripture).
- `fallacies.yaml` — logical fallacies with examples and how to respond.
- `cheat-sheets.yaml` — topical Scripture quick-reference (≤ 8 quoted verses per sheet).
- `gospel-presentations.yaml` — step-by-step ways to share the gospel.
- `resources.yaml` — links out to Living Waters media and other resources.

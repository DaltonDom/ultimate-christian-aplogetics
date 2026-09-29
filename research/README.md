# Research: Mark Spence transcripts → course improvements

This folder turns Mark Spence's public teaching into better lessons. It is **private
study material**, so keep this repository **private** once transcripts are committed.

```
research/
├── transcripts/   one Markdown file per video (from scripts/fetch_transcripts.py)
│   └── index.json every video found, with title, URL and duration
└── notes/         Claude's digest: one structured note per video + topic map
```

## Step 1: Download transcripts (on your computer)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements-transcripts.txt
python scripts/fetch_transcripts.py --list-only   # see how many videos / hours
python scripts/fetch_transcripts.py --limit 5     # try a few
python scripts/fetch_transcripts.py               # get the rest (resumable)
```

- If YouTube says "Sign in to confirm you're not a bot", add `--cookies-from-browser chrome`
  (or `firefox`, `safari`, `edge`) while you're logged in to YouTube in that browser.
- Videos without captions are listed in `transcripts/missing-captions.json`. To
  transcribe them locally: `pip install faster-whisper`, then run again with `--whisper`.

Then make the GitHub repo **private** (Settings → General → Danger Zone → Change
visibility) and commit + push `research/transcripts/`.

## Step 2: Digest (ask Claude)

Ask Claude: *"Run the transcript digest."* The process:

1. **Per-video notes.** Transcripts are split into batches and each one is summarised
   into `notes/videos/<id>.md` using the template below.
2. **Topic map.** The notes are merged into `notes/topic-map.md`, organised by course
   module and lesson, with each point linking back to the video and timestamp.
3. **Lesson updates.** Each lesson is revised from its slice of the topic map:
   - sharper illustrations and wording ideas,
   - objections he regularly faces,
   - new drills and quiz questions,
   - `videos:` links (with timestamps) so you can watch him teach it.

Lesson text stays in original wording. His exact phrasing lives in his videos, which
the lessons link to.

### Per-video note template

```markdown
---
id: <video id>
title: <title>
url: <url>
modules: [gospel, evangelism]          # which course modules it serves
lessons: [gospel-2, evangelism-3]      # best-matching lessons
type: teaching | street encounter | debate | Q&A | sermon | podcast
---
## Main point (1–2 sentences)
## Key arguments / steps (bullets, with [mm:ss])
## How he moves the conversation (openers, transitions, questions he asks)
## Objections raised and how he answered them
## Illustrations and analogies
## Scriptures used
## Best clip to watch (timestamp + why)
```

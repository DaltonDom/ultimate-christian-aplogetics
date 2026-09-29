# Ready to Answer

> "…always being prepared to make a defense to anyone who asks you for a reason for the
> hope that is in you; yet do it with gentleness and respect." (1 Peter 3:15, ESV)

A personal, self-paced course in **apologetics and evangelism**. It's inspired by the
training of Mark Spence, Ray Comfort and Living Waters (Law before grace, the Good Person
Test, conscience, Judgment Day, the cross, repentance and faith), and built for
understanding, remembering and **using** what you learn in real conversations.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

**On your phone:** while `npm run dev` is running, open the "Network" URL it prints
(for example http://192.168.1.20:5173) on a phone on the same Wi-Fi.

**Install it and use it offline:** run `npm run build && npm run preview`, open the
URL, and choose **Install app** (desktop Chrome/Edge) or **Share → Add to Home Screen**
(iPhone). Installing from a phone needs HTTPS, so the easiest route is free static
hosting of the `dist/` folder (Netlify Drop, Cloudflare Pages, or GitHub Pages on a
private repo). After the first load, everything works without signal.

## What's inside

| Section | What it does |
|---|---|
| **Course** | 7 modules, 39 lessons: Foundations, The Gospel, Evangelism Training, Debate Tactics & Fallacies, Apologetics, Questions for Every Worldview, Pro-Life |
| **Lessons** | Big idea → teaching → a one-sentence summary to memorise → ESV memory verse (with first-letter practice) → key verses → "Christians differ here" → objections (think first, then reveal) → scripted Witness Encounter (with practice mode) → church history quote → quiz → drills → notes |
| **Review** | Spaced-repetition flashcards. Finishing a lesson adds its cards, and each card comes back just before you'd forget it |
| **Practice** | The **Skeptic Simulator**: random objections from across the course. Answer out loud, compare with a model answer, and rate yourself. The ones you miss come back more often |
| **Reference** | Quick Answers (45), Logical Fallacies (30), Bible Cheat Sheets (12), Gospel Presentations (5), Resources. Tap **Pocket card** for a big-text view mid-conversation |
| **Search / Notes / Settings** | Search everything, keep a journal and lesson notes, switch light/dark mode, back up or restore your progress |

Progress is saved in your browser (localStorage). Use **Settings → Download backup**
to move it between devices.

## Why it's built this way

The design follows well-established learning research:

- **Retrieval practice.** Quizzes, "think first, then reveal" objections, and saying
  answers out loud beat rereading.
- **Spaced repetition.** Reviews are spread out over growing intervals.
- **Worked examples.** Every lesson shows the method in a realistic conversation.
- **Interleaving.** The Skeptic Simulator mixes topics, like real life does.
- **Short, sayable lines.** Each lesson boils down to a sentence you can say without notes.

## Editing content

All content is plain text in [`content/`](content/): Markdown lessons and YAML
reference files. See [`content/SCHEMA.md`](content/SCHEMA.md) for the format, then run:

```bash
npm run validate   # checks every file and the ESV verse budget
```

## Mark Spence transcripts

[`scripts/fetch_transcripts.py`](scripts/fetch_transcripts.py) downloads the
captions of Mark Spence's YouTube videos (his channel plus the Living Waters "Mark
Spence Videos" playlist) for private study. See [`research/README.md`](research/README.md)
for the full process. In short: run it on your computer, make this repo **private**,
commit the transcripts, and ask Claude to run the digest. That digest improves the
lessons and links each one to the matching videos.

## Credits & disclaimer

This is an independent personal study tool. It is **not** produced or endorsed by Living
Waters. Lesson text is original. For the real thing, see the
[School of Biblical Evangelism](https://biblicalevangelism.com/) and
[Mark Spence's Ultimate USB](https://livingwaters.com/usb/).

Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®),
© 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission.
All rights reserved.

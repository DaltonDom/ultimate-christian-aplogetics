#!/usr/bin/env python3
"""
Download transcripts of Mark Spence's YouTube videos into research/transcripts/.

Run this on YOUR computer (YouTube often blocks cloud servers). It:
  1. Lists every video on the sources below (Shorts are skipped) and removes duplicates.
  2. Shows you how many videos and hours that is, and asks before downloading.
  3. Saves YouTube's captions (human-made if available, otherwise auto-generated) as clean,
     timestamped Markdown — one file per video.
  4. Optionally (--whisper) transcribes videos that have no captions, using faster-whisper.

It's resumable: run it again and it only fetches what's missing.

Setup (once):
    python3 -m venv .venv
    source .venv/bin/activate            # Windows: .venv\\Scripts\\activate
    pip install -r scripts/requirements-transcripts.txt

Usage:
    python scripts/fetch_transcripts.py                  # list, confirm, download
    python scripts/fetch_transcripts.py --limit 5        # try a few first
    python scripts/fetch_transcripts.py --yes --whisper  # no prompt; transcribe caption-less videos
    python scripts/fetch_transcripts.py --cookies-from-browser chrome   # if YouTube asks you to sign in

Transcripts are for private study only. Keep this repository PRIVATE if you commit them.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

try:
    import yt_dlp
except ImportError:
    sys.exit("yt-dlp is not installed. Run: pip install -r scripts/requirements-transcripts.txt")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "research" / "transcripts"
CACHE = ROOT / "research" / ".cache"
AUDIO = ROOT / "research" / "audio"
INDEX = OUT / "index.json"

SOURCES = [
    "https://www.youtube.com/@MarkSpence/videos",
    # Living Waters — "Mark Spence Videos" playlist
    "https://www.youtube.com/playlist?list=PLIMAX6WHtnhAQzsgujbC9uESgIfVs_miw",
]
MIN_SECONDS = 70          # anything shorter is treated as a Short
PARAGRAPH_SECONDS = 60    # start a new timestamped paragraph about once a minute
LANGS = ["en", "en-US", "en-GB", "en-orig"]


# ---- listing -------------------------------------------------------------------------

def list_videos(sources: list[str], base_opts: dict) -> list[dict]:
    opts = {**base_opts, "extract_flat": "in_playlist", "skip_download": True}
    videos: dict[str, dict] = {}
    with yt_dlp.YoutubeDL(opts) as ydl:
        for src in sources:
            print(f"Listing {src} …")
            info = ydl.extract_info(src, download=False)
            for e in info.get("entries") or []:
                if not e or not e.get("id"):
                    continue
                url = e.get("url") or ""
                dur = e.get("duration")
                if "/shorts/" in url or (dur is not None and dur < MIN_SECONDS):
                    continue
                videos.setdefault(e["id"], {
                    "id": e["id"],
                    "title": e.get("title") or e["id"],
                    "duration": dur,
                    "url": f"https://www.youtube.com/watch?v={e['id']}",
                    "source": src,
                })
    return list(videos.values())


# ---- caption parsing -----------------------------------------------------------------

def parse_json3(data: dict) -> list[tuple[float, str]]:
    """YouTube's json3 caption format → [(start_seconds, text)]."""
    out = []
    for ev in data.get("events", []):
        segs = ev.get("segs")
        if not segs:
            continue
        text = "".join(s.get("utf8", "") for s in segs).replace("\n", " ").strip()
        if text:
            out.append((ev.get("tStartMs", 0) / 1000, text))
    return out


_TS = re.compile(r"(\d+):(\d{2}):(\d{2})[.,](\d{3})\s*-->")


def parse_vtt(raw: str) -> list[tuple[float, str]]:
    """WebVTT → [(start_seconds, text)], removing the repeated rolling lines in auto-captions."""
    out: list[tuple[float, str]] = []
    last_line = ""
    start = 0.0
    for block in re.split(r"\n\s*\n", raw):
        lines = block.strip().splitlines()
        ts = next((l for l in lines if "-->" in l), None)
        if not ts:
            continue
        m = _TS.search(ts)
        if m:
            h, mi, s, ms = map(int, m.groups())
            start = h * 3600 + mi * 60 + s + ms / 1000
        for line in lines[lines.index(ts) + 1:]:
            clean = re.sub(r"<[^>]+>", "", line).strip()
            if clean and clean != last_line:
                out.append((start, clean))
                last_line = clean
    return out


def to_paragraphs(cues: list[tuple[float, str]]) -> str:
    paras, current, para_start = [], [], None
    for start, text in cues:
        if para_start is None:
            para_start = start
        current.append(text)
        elapsed = start - para_start
        if (elapsed >= PARAGRAPH_SECONDS and text.rstrip().endswith((".", "?", "!"))) or elapsed >= PARAGRAPH_SECONDS * 2:
            paras.append((para_start, " ".join(current)))
            current, para_start = [], None
    if current:
        paras.append((para_start or 0, " ".join(current)))
    text = "\n\n".join("[" + stamp(t) + "] " + re.sub(r"\s+", " ", p).strip() for t, p in paras)
    return text.replace("[Music]", "").replace("[Applause]", "")


def stamp(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60] or "video"


# ---- download ------------------------------------------------------------------------

def existing_ids() -> set[str]:
    ids = set()
    for p in OUT.glob("*.md"):
        m = re.match(r"\d{8}_([A-Za-z0-9_-]{11})_", p.name)
        if m:
            ids.add(m.group(1))
    return ids


def fetch_captions(video: dict, base_opts: dict) -> tuple[dict, list[tuple[float, str]], str]:
    """Returns (full metadata, cues, kind) where kind is manual|auto|none."""
    CACHE.mkdir(parents=True, exist_ok=True)
    for f in CACHE.glob(f"{video['id']}*"):
        f.unlink()
    opts = {
        **base_opts,
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": LANGS,
        "subtitlesformat": "json3/vtt/best",
        "outtmpl": str(CACHE / "%(id)s.%(ext)s"),
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(video["url"], download=True)
    manual = set((info.get("subtitles") or {}).keys())
    for f in sorted(CACHE.glob(f"{video['id']}.*")):
        lang = f.suffixes[0].lstrip(".") if len(f.suffixes) > 1 else ""
        kind = "manual" if lang in manual else "auto"
        if f.suffix == ".json3":
            return info, parse_json3(json.loads(f.read_text(encoding="utf-8"))), kind
        if f.suffix == ".vtt":
            return info, parse_vtt(f.read_text(encoding="utf-8")), kind
    return info, [], "none"


_whisper_model = None


def whisper_transcribe(video: dict, base_opts: dict, model_name: str) -> list[tuple[float, str]]:
    global _whisper_model
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("--whisper needs faster-whisper: pip install faster-whisper")
    AUDIO.mkdir(parents=True, exist_ok=True)
    opts = {**base_opts, "format": "bestaudio/best", "outtmpl": str(AUDIO / "%(id)s.%(ext)s")}
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.extract_info(video["url"], download=True)
    audio = next(AUDIO.glob(f"{video['id']}.*"))
    if _whisper_model is None:
        print(f"  loading Whisper model '{model_name}' (first time downloads it)…")
        _whisper_model = WhisperModel(model_name, device="auto", compute_type="int8")
    segments, _ = _whisper_model.transcribe(str(audio), language="en", vad_filter=True)
    cues = [(s.start, s.text.strip()) for s in segments]
    audio.unlink(missing_ok=True)
    return cues


def write_transcript(video: dict, info: dict, cues: list[tuple[float, str]], kind: str) -> Path:
    date = info.get("upload_date") or "00000000"
    title = info.get("title") or video["title"]
    path = OUT / f"{date}_{video['id']}_{slugify(title)}.md"
    desc = (info.get("description") or "").strip()
    front = {
        "id": video["id"],
        "title": title,
        "url": video["url"],
        "channel": info.get("channel") or info.get("uploader"),
        "upload_date": f"{date[:4]}-{date[4:6]}-{date[6:]}",
        "duration": stamp(info.get("duration") or video.get("duration") or 0),
        "transcript": kind,
    }
    lines = ["---"] + [f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in front.items()] + ["---", ""]
    lines += [f"# {title}", ""]
    if desc:
        lines += ["## Description", "", desc, ""]
    lines += ["## Transcript", "", to_paragraphs(cues), ""]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


# ---- main ----------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", action="append", help="channel/playlist URL (repeatable; replaces the defaults)")
    ap.add_argument("--limit", type=int, help="only download this many new videos")
    ap.add_argument("--yes", "-y", action="store_true", help="don't ask for confirmation")
    ap.add_argument("--whisper", action="store_true", help="transcribe videos with no captions using faster-whisper")
    ap.add_argument("--whisper-model", default="small.en", help="faster-whisper model (tiny.en, base.en, small.en, medium.en)")
    ap.add_argument("--sleep", type=float, default=2.0, help="seconds to wait between videos (be polite)")
    ap.add_argument("--cookies-from-browser", help="e.g. chrome, firefox, safari — if YouTube asks you to sign in")
    ap.add_argument("--list-only", action="store_true", help="just list and write index.json")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    base_opts: dict = {"quiet": True, "no_warnings": True, "ignoreerrors": False}
    if args.cookies_from_browser:
        base_opts["cookiesfrombrowser"] = (args.cookies_from_browser,)

    videos = list_videos(args.source or SOURCES, base_opts)
    INDEX.write_text(json.dumps(videos, indent=2, ensure_ascii=False), encoding="utf-8")

    have = existing_ids()
    todo = [v for v in videos if v["id"] not in have]
    if args.limit:
        todo = todo[: args.limit]
    hours = sum(v.get("duration") or 0 for v in videos) / 3600
    todo_hours = sum(v.get("duration") or 0 for v in todo) / 3600
    print(f"\nFound {len(videos)} videos (~{hours:.0f} hours). Already have {len(have & {v['id'] for v in videos})}.")
    print(f"To download: {len(todo)} videos (~{todo_hours:.1f} hours of video).")
    print(f"Index written to {INDEX.relative_to(ROOT)}")
    if args.list_only or not todo:
        return
    if not args.yes and input("Continue? [y/N] ").strip().lower() not in ("y", "yes"):
        return

    stats = {"manual": 0, "auto": 0, "whisper": 0, "none": 0, "error": 0}
    missing: list[dict] = []
    for i, v in enumerate(todo, 1):
        print(f"[{i}/{len(todo)}] {v['title']}")
        try:
            info, cues, kind = fetch_captions(v, base_opts)
            if not cues and args.whisper:
                cues, kind = whisper_transcribe(v, base_opts, args.whisper_model), "whisper"
            if not cues:
                stats["none"] += 1
                missing.append(v)
                print("  no captions (use --whisper to transcribe)")
            else:
                path = write_transcript(v, info, cues, kind)
                stats[kind] += 1
                print(f"  ✓ {kind} → {path.name}")
        except yt_dlp.utils.DownloadError as e:
            stats["error"] += 1
            print(f"  ✗ {str(e).splitlines()[0]}")
            if "Sign in to confirm" in str(e):
                print("  YouTube wants a signed-in browser. Re-run with --cookies-from-browser chrome (or firefox/safari).")
                break
        time.sleep(args.sleep)

    if missing:
        (OUT / "missing-captions.json").write_text(json.dumps(missing, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone. {stats}")
    print("Next: commit research/transcripts (repo must be PRIVATE) and ask Claude to run the digest.")


if __name__ == "__main__":
    main()

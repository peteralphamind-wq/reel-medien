# final-edit.json — the EDL schema

The edit decision list is the single source of truth: candidate takes, in/out points, and the **written rationale for every pick**. ffmpeg executes it; humans review it; re-edits are diffs to it.

```json
{
  "project": "fable5-launch",
  "source_dir": "Fable-Full-Recording/",
  "target": { "width": 3840, "height": 2160, "fps": 24 },
  "scenes": [
    {
      "scene": 1,
      "title": "Part 1: Intro",
      "candidate_takes": ["C001", "C002", "C003", "C004", "C017 (re-shoot)"],
      "selection_rationale": "C017 is incomplete — 5.8s dead pause mid-sentence, disqualified. C003 is the cleanest complete take: zero ums, clean ending.",
      "clips": [
        {
          "clip": "A004C003",
          "start": 1.89,
          "end": 60.81,
          "first_words": "Hey everyone, it's Thariq...",
          "notes": "'Hey [name]' warm-up ends at 1.84; cut-in at 1.89 sits in the silent gap."
        }
      ]
    },
    {
      "scene": 2,
      "title": "Thought Partner",
      "candidate_takes": ["C005", "C006", "C007", "C008", "C009", "C010"],
      "selection_rationale": "C010 picked of 6 takes — only one fully on script.",
      "clips": [{ "clip": "A004C010", "start": 0.95, "end": 48.30, "first_words": "..." }]
    }
  ]
}
```

Rules:
- `start`/`end` are seconds in the **source take**, chosen from word timestamps; both must sit in silent gaps.
- A scene MAY have multiple clips (mid-scene cuts are allowed) — but prefer one clean clip per scene when takes allow.
- `selection_rationale` must explain the winner **and** the disqualified candidates, with timestamps. If a verifier rejected a pick, record the fix.
- After cutting, append a `"verification"` object per scene: `{ "retranscribed_ums": 0, "joined_cleanly": true }`.
- Keep the file under version control; every re-edit is a commit.

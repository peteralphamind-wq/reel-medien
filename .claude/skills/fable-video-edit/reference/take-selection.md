# Take selection — rubric and subagent prompts

## Scene casting (before selection)

Match each take's transcript text to the script sections (or cluster takes by shared phrases if there is no script). Output a map `scene → [takes]`. Things to catch:
- **Re-shoots**: a take recorded last can belong to scene 1. Match by content, never by file order alone.
- **False starts**: a 10-second clip that matches scene 2's opening line is an aborted take of scene 2, not its own scene.

## Selection rubric (apply per scene, in this order)

1. **Disqualify incomplete takes** — missing scripted lines, or a dead pause > ~3s mid-sentence (check gaps between consecutive word timestamps). Write the disqualification into the rationale (e.g. "C017 is incomplete — 5.8s dead pause mid-sentence, disqualified").
2. **Count fillers** from the transcript: um, uh, like-restarts, repeated sentence starts. Fewest wins. Later takes are *usually* cleaner — verify, don't assume.
3. **On-script fidelity** — diff the transcript against the script section. "Only one fully on script" is a valid sole reason to pick a take.
4. **Cut-point quality** — the chosen in/out must land in a silent gap:
   - In-point: after any warm-up ("Hey [name]…" → warm-up ends at its last word's `end`; set in-point ~0.05s into the gap, e.g. warm-up ends 66.40 → cut-in 66.45).
   - Out-point: after the final word's `end`, before the next sound. Leave ~0.2–0.4s of breathing room when available.
   - Confirm borderline gaps with: `ffmpeg -i take.wav -af silencedetect=noise=-35dB:d=0.2 -f null - 2>&1 | grep silence`

## Orchestration pattern (from the original edit)

One **selector subagent per scene**, then **verifier subagents** double-checking each pick. Run selectors in parallel; every cut must land in silence.

Selector prompt template:

> You are selecting the best take for Scene {N}: "{scene title}". Script for this scene: {script text}. Candidate takes with word-timestamp transcripts: {paths}. Apply this rubric: (1) disqualify incomplete takes or takes with >3s mid-sentence pauses, (2) fewest ums/restarts, (3) closest to script, (4) in/out points must sit in silent gaps between words — cut any "Hey [name]" warm-up. Return JSON: { "scene": N, "title": "...", "candidate_takes": [...], "selection_rationale": "why the winner won AND why each loser lost, with timestamps", "clips": [{ "clip": "...", "start": <sec>, "end": <sec>, "first_words": "..." }] }

Verifier prompt template:

> Verify this take selection for Scene {N}: {selector JSON}. Check against the transcripts at {paths}: (a) is the chosen take really complete and the cleanest? (b) does start={s} fall in a silent gap after any warm-up words? (c) does end={e} fall after the last scripted word with no clipped speech? (d) is the rationale's um-count accurate? Try to refute the pick. Return JSON: { "verdict": "approve" | "reject", "issues": [...], "suggested_fix": {...} }

On reject: fix and re-verify. Only verified picks enter `final-edit.json`.

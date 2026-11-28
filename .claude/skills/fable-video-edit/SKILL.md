---
name: fable-video-edit
description: Produce or edit videos from raw takes and scripts into a finished, graded, motion-graphics video with code (Whisper + ffmpeg + Remotion), no video editor. Use when the user wants to cut takes into a final video, select best takes, transcribe footage, color grade, add animated overlays, or edit in the style of the Fable video editing workflow. Input is a folder of takes and optionally a script and design assets.
---

# Video Edit - takes in, finished video out

Turn a folder of raw camera takes into a verified final cut: transcribe → select best takes → EDL (JSON) → ffmpeg cut → color grade → Remotion graphics → render → verify. The whole edit is text (JSON, .cube LUTs, React components), so every step can be read, diffed, and re-rendered. Based on the workflow Thariq Shihipar / Anthropic used to edit the Fable 5 launch video.

**Operating principle: don't stop until there is a final, verified video.** Orchestrate with workflows/subagents where parallelism helps (one selector per scene + verifiers). Never ask the user to scrub a timeline — every decision comes from transcripts and timestamps.

## Repo workflow

When invoked from a repo, first inspect its README and any relevant script, outline, or video-planning files for the angle, notes, and intended visual direction. Keep durable planning files, EDLs, transcript summaries, cue sheets, LUTs, and production notes in a project folder that can be committed back to the repo when useful. If raw footage lives outside the repo, keep large media files out of git and store only paths, metadata, generated text artifacts, and small review stills unless the user asks otherwise.

## Phase 0 — Prerequisites & intake

1. Run `scripts/check-prereqs.sh` (in this skill's directory). It verifies ffmpeg (with lut3d/concat/silencedetect/loudnorm), Whisper, Node/npx, and disk space. If something is missing it prints the exact install command — install it (ask user only if it needs sudo or a large download).
2. Intake from the user (ask only what's missing):
   - **Takes folder** — the raw clips (any of .mp4/.mov/.MP4/.MXF…).
   - **Script** (optional but highly valuable) — markdown of what each scene should say. Used to cast takes into scenes and judge "on-script".
   - **Design assets** (optional) — PNGs/frames for overlays and interlude cards.
   - **Target**: duration, resolution, fps, aspect (default: source resolution, source fps, full piece).
3. Create the project workspace next to the footage, or under a repo-local production folder when the work starts from `videos/`:
   ```
   work/
     audio/         # extracted wavs
     transcripts/   # whisper word-timestamp JSONs
     cuts/          # per-scene segments
     stills/        # grade/graphics review frames
   luts/            # hand-written .cube files
   final-edit.json  # the EDL — single source of truth
   ```
4. Inventory the footage: `ffprobe` every clip (duration, resolution, fps, codec, audio). Record in `work/inventory.json`. If clips have mixed fps/resolution, note it now — the cut step must normalize.

## Phase 1 — Transcribe every take (word-level timestamps)

Run `scripts/transcribe.sh <takes-folder> <work-dir>` — it extracts mono 16 kHz audio and runs Whisper with `--word_timestamps True --output_format json`, one JSON per take in `work/transcripts/`.

- Model: `medium` if cached/feasible, else `small`. Misheard proper nouns are fine ("Thariq" → "Sark") — **the timestamps still land**, and that's what matters.
- Every later decision — take selection, cut points, overlay cues — is **grepped out of these JSONs, never scrubbed**.

## Phase 2 — Cast scenes & pick the best takes

Group takes into scenes by matching transcript text against the script (or by content similarity if no script). Then select the best take per scene. Parallelize: **one subagent per scene, plus a verifier pass** (see `reference/take-selection.md` for the full rubric and subagent prompts).

Selection rubric (in priority order):
1. **Complete** — disqualify takes with missing lines or long dead pauses mid-sentence.
2. **Fewest ums/uhs/restarts** — count them from the transcript. Later takes are usually cleaner, but verify, don't assume.
3. **On-script** — closest to the intended lines.
4. **Clean cut points** — the in-point and out-point must sit in a silent gap between words (use word timestamps; confirm with `silencedetect` if borderline). Cut warm-ups (e.g. the speaker starting with "Hey [name]" to warm the sentence) by setting the in-point in the gap after the warm-up's last word.
5. Watch for **re-shoots** — a scene re-shot later in the session belongs to its original scene slot.

## Phase 3 — Write the EDL: `final-edit.json`

The edit is a JSON file with the **written rationale for every pick** (schema + example in `reference/final-edit-schema.md`). Per scene: `candidate_takes`, `selection_rationale`, and `clips` with `{ clip, start, end, first_words }`. Show it to the user before cutting — this is the natural review checkpoint.

## Phase 4 — ffmpeg cuts the first assembly

Execute the EDL (exact commands in `reference/ffmpeg-recipes.md`):
1. One frame-accurate cut per pick: `ffmpeg -ss <start> -to <end> -i <take> …` **re-encoding to a uniform mezzanine** (same codec/fps/resolution) so concat is safe.
2. Join with the concat demuxer + `-c copy`.
3. **Verify the cut like code**: re-transcribe the assembled video and check — zero ums, no clipped words at the joins, scene order matches the EDL, duration ≈ sum of clips. If any check fails, adjust the EDL and re-cut. Do not advance with a broken assembly.

## Phase 5 — Color grade (write LUTs from scratch)

If footage is log (S-Log3, V-Log, C-Log…) or the user wants a look:
1. Hand-write 4–7 candidate `.cube` LUTs as plain text (e.g. `neutral709`, `warm_filmic`, `punchy`, `teal_orange`) — no preset packs. Math and a starter S-Log3→Rec.709 LUT generator in `reference/color-grading.md`.
2. Extract 2–3 representative stills, apply every LUT to each (`-vf lut3d=luts/<name>.cube`), and present a labeled comparison grid for the user to choose.
3. Apply the chosen LUT **exactly once, always via ffmpeg**: at final encode if there are no Remotion graphics, or onto the assembly *before* it enters Remotion (Remotion cannot apply .cube LUTs). The grade is plain text — iterate it by editing numbers and re-rendering the same stills after each tweak.

## Phase 6 — Graphics with Remotion (optional, when there are overlays/cards)

Rebuild each design PNG as a React component so **every word, color, and beat is a parameter you can prompt** (project setup, component patterns, and the cue-sheet pattern in `reference/remotion-graphics.md`). The three load-bearing ideas:
- **One file sets the feel**: a global `TIMING` object (reveal, stagger, overlayIn/Out, emphasisDelay) + one easing curve. "Make it snappier" must be a one-line change.
- **The edit is a cue sheet timed by the transcript**: `CUES = [{ id, at, dur }]` where `at` comes from grepping the final cut's word timestamps for the spoken phrase. Overlays land on the spoken word.
- **Verify still-by-still**: render single frames at each cue's start/peak/end (`npx remotion still`) and review them *before* any full render.

## Phase 7 — Final render & verification (twice)

1. Render: `npx remotion render` at target resolution/fps (or plain ffmpeg encode if no graphics). Normalize loudness: `-af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000` (the `-ar` matters — loudnorm resamples internally).
2. **Verification pass 1 (automated)**: ffprobe the output — exact resolution, exact fps, expected duration, audio present. Re-transcribe and diff against the EDL's expected text: zero ums, no missing/duplicated lines.
3. **Verification pass 2 (eyes on)**: extract stills at every scene boundary and every graphics cue; review each for grade consistency, overlay timing, and clean joins. Fix anything off and re-render — ~10 re-renders in a night is normal and cheap.
4. Deliver: final file + the repo of artifacts (transcripts, final-edit.json, luts/, src/). The user should be able to ask for any change in plain language and get a re-render.

## Optional — Figma round-trip

If the user has the Figma MCP connected: export the Remotion components/grade as a Figma file for the design team; later, "the design has been updated in this Figma — update the video to match" re-imports their pass back into code.

## Reference files

- `reference/thariq-prompts.md` — the full prompt reference from the source deck.
- `reference/take-selection.md` — selection rubric, subagent + verifier prompts.
- `reference/final-edit-schema.md` — EDL schema and a real example.
- `reference/ffmpeg-recipes.md` — exact cut/concat/verify/loudness commands.
- `reference/color-grading.md` — .cube format, S-Log3→Rec.709 math, candidate looks.
- `reference/remotion-graphics.md` — project setup, TIMING knobs, cue sheet, still-by-still review.

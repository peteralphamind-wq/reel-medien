# The original prompts - verbatim

From "How Fable Edited Its Own Video" (Thariq Shihipar, Claude Code team, June 2026 - thariqs.github.io/cc-video-editing-deck). These are the actual prompts that produced the Fable 5 launch video. Use them as templates: same structure, swap in the user's paths and notes.

## 1. The kickoff prompt - one message drives the whole edit

> I'm processing the recording of a bunch of videos in @Fable-Full-Recording/ the script for them is in @Fable-Full-Recording/fable5script.md. I want you to run the eleven labs transcription service on them. Then stitch together the best shots, into one final clip. A few notes: there are multiple take per scene, the best takes are usually the ones at the end with the fewest ums, but that can change. I also re-shot the first scene at the end. They should all be organized by timeline. For a few of them I start the video saying "Hey [name]" as a way of starting the sentence warm, we should cut that out. Create a JSON file for the video that shows per scene, each clip we're using and the time ranges from them. Then, create a final scene using ffmpeg. Orchestrate this all using workflows.
>
> /goal dont stop until you have a final video

Notes: in practice the transcription ran on **local Whisper**, not ElevenLabs - word-level timestamps are the requirement, the engine is fungible. The structure to copy: footage path + script path -> transcribe -> select (with human "taste notes": which takes tend to be best, re-shoots, warm-ups to cut) -> EDL JSON -> ffmpeg -> don't stop until done.

## 2. Color grading

> the color grading feels a bit too muted, can you fix that? make some examples of how we might regrade and let me choose one

Result: 7 hand-written .cube LUTs (neutral709, warm_filmic, punchy, teal_orange, ...), S-Log3 -> Rec.709, no preset packs. Pattern: ask for **multiple candidate looks and a side-by-side choice**, not one grade.

## 3. Graphics / Remotion

> I've added a bunch of design files for interludes in @Fable-Full-Recording/fable5-assets/ - I want to use remotion to sttich these all together into a final clip that smoothly animates in the assets... please do a first pass.

Input was just PNGs - no animation spec, no timings. Claude rebuilt each PNG as a React component and timed the cues from the transcript.

## 4. Figma export (design-team handoff)

> I want my design team to be able to make tweaks to these components...
> great now can you also export it to a figma file

## 5. Figma import (after the design team's pass)

> the design has been updated in this Figma... can you update the video to match?

## The numbers (what "done" looked like)

17 takes / 25 GB raw -> verified 2:50 first cut in ~7 minutes; 7 LUTs; 11 graphics as components; ~10 re-renders in one night; 2 code<->Figma round trips; 4 days total; 0 video editors opened. Final: 3840x2160 @ exactly 24 fps, 4,334 frames, verified still-by-still before each full render.

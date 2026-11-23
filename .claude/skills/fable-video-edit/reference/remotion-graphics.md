# Remotion graphics — PNGs become code, cues come from the transcript

Remotion renders React components to video frames. Each design PNG is **rebuilt as a component** (not embedded as an image) so every word, color, and beat is a prop you can prompt.

## Project setup

```bash
npx create-video@latest graphics --blank   # inside the edit repo (no `--` separator with npx)
cd graphics && npm i
# staticFile() only serves from graphics/public/ — link the (graded) assembly in:
mkdir -p public && ln -s ../../work/assembly-graded.mp4 public/assembly.mp4
```

Layout:
```
graphics/src/
  anim.tsx        # global timing knobs + easing — ONE file sets the feel
  FinalEdit.tsx   # root composition: footage + cue sheet
  cards/          # full-screen interlude cards (one component per design)
  overlays/       # lower thirds, keypoint panels, etc.
```

Root composition composites the assembled footage with overlays:

```tsx
// FinalEdit.tsx
import { OffthreadVideo, Sequence, useVideoConfig } from 'remotion';

export const CUES = [
  // "…it's Thariq from the Claude Code team"
  { id: 'lower-third', at: 1.2,  dur: 4.5 },
  // "Is Claude doing the right work?"
  { id: 'keypoint',    at: 12.2, dur: 25.6 },
  { id: 'three-ways',  at: 43.0, dur: 15.8 },
];

export const FinalEdit = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      <OffthreadVideo src={staticFile('assembly.mp4')} />
      {CUES.map((c) => (
        <Sequence key={c.id} from={Math.round(c.at * fps)} durationInFrames={Math.round(c.dur * fps)}>
          {componentFor(c.id)}
        </Sequence>
      ))}
    </>
  );
};
```

## The two load-bearing patterns

**1. One file sets the feel** — every animation reads from a single TIMING object; "make it snappier" is a one-line change:

```tsx
// anim.tsx — global timing knobs (frames @ 24fps)
export const TIMING = {
  reveal: 13,        // element entrance
  stagger: 4,        // gap between siblings
  overlayIn: 10,     // panel slide-in (~430ms)
  overlayOut: 8,     // fade-out
  emphasisDelay: 3,  // key words tick in late
};
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
```

**2. The cue sheet is timed by the transcript** — never scrub. To place an overlay on a spoken phrase, grep the final cut's word-timestamp JSON for the phrase and use its `start`. Multi-beat components take beat frames as props, also derived from word timestamps:

```tsx
// Beat 2: right column lights up, left grays + strikes through
const beat2 = interpolate(frame, [beat2At, beat2At + 12], [0, 1], { easing: EASE_OUT });
<div style={{ ...text, color: cream, opacity: 1 - beat2 }}>“Is Claude doing the work right?”</div>
<div style={{ ...text, opacity: beat2, textDecoration: 'line-through' }}>…</div>

// usage: frame 295 is the word "right" in the final cut's transcript
<KeypointLedger beat2At={295} />
```

If the EDL changes, re-transcribe the new assembly and re-grep — the cues follow the words automatically.

## Rebuilding a PNG as a component

For each design frame: read the PNG, reproduce layout/typography/colors as JSX with absolute positioning, expose the text strings and colors as props, then render a still at the same size and visually diff against the original PNG until it matches. Only then add animation (entrance per TIMING, beats per transcript).

## Verify still-by-still, then render

```bash
# stills at each cue's start / peak / end — review BEFORE any full render
npx remotion still src/index.ts FinalEdit out/check-295.png --frame=295

# full render (4K @ exact fps)
npx remotion render src/index.ts FinalEdit out/final.mp4 \
  --width=3840 --height=2160 --fps=24 --codec=h264 --crf=17
```

Review the stills (Read the PNGs) for: overlay legibility over footage, correct beat alignment, grade consistency. Fix, re-still, then full render. ~10 re-renders in a night is normal; stills make each iteration cheap.

Audio note: if Remotion's render drops/changes audio handling, mux the verified assembly audio back in and loudnorm it (filtering and `-c:a copy` cannot be combined):

```bash
ffmpeg -y -i out/final.mp4 -i work/assembly-graded.mp4 \
  -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 256k -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 \
  final.mp4
```

Color note: Remotion has no .cube LUT support — grade the assembly with ffmpeg (Phase 5) **before** linking it into `public/`; never try to apply the LUT inside Remotion.

# ffmpeg recipes — cut, concat, verify, finish

## 1. Frame-accurate segment cuts (one per EDL clip)

Re-encode to a uniform mezzanine so the later concat is lossless-safe. `-ss` before `-i` + re-encode = fast seek AND frame-accurate output.

```bash
# per clip in final-edit.json (4K example; match the target fps/resolution)
ffmpeg -y -ss 1.89 -to 60.81 -i A004C003.MP4 \
  -vf "fps=24,scale=3840:2160:flags=lanczos" \
  -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 256k -ar 48000 \
  work/cuts/seg01.mp4
```

- Cut **ungraded** — the LUT is only chosen in Phase 5, from stills of this assembly. The grade is applied exactly once, later (see §6 / the Remotion path).
- Mixed-fps/resolution sources MUST be normalized here — concat `-c copy` requires identical streams.
- For a true master-quality mezzanine use ProRes instead: `-c:v prores_ks -profile:v 3 -c:a pcm_s16le` (≈10x larger files).

## 2. Join the segments

```bash
cd work/cuts
printf "file 'seg%02d.mp4'\n" 1 2 3 4 > concat.txt   # or list explicitly, in EDL order
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy ../assembly.mp4
```

## 3. Verify the assembly (do not skip)

```bash
# container checks
ffprobe -v quiet -show_format -show_streams -of json ../assembly.mp4
# duration must ≈ sum of (end-start) per clip; fps and resolution must match target

# re-transcribe the cut and check the words
ffmpeg -y -v error -i ../assembly.mp4 -vn -ar 16000 -ac 1 ../assembly.wav
whisper ../assembly.wav --model small --language en --word_timestamps True --output_format json --output_dir ..
# then check: zero "um"/"uh"; first_words of each scene appear in order;
# no half-words at the joins (a word whose timestamps straddle a segment boundary).
```

## 4. Silence checks for borderline cut points

```bash
ffmpeg -i take.wav -af silencedetect=noise=-35dB:d=0.2 -f null - 2>&1 | grep silence_
```

## 5. Stills for grade / review

```bash
ffmpeg -y -ss 12.5 -i assembly.mp4 -frames:v 1 work/stills/scene2-raw.png
ffmpeg -y -ss 12.5 -i assembly.mp4 -vf lut3d=luts/warm_filmic.cube -frames:v 1 work/stills/scene2-warm_filmic.png
```

## 6. Apply the grade — exactly once

The LUT is applied at exactly ONE point, depending on the path:

**No Remotion graphics** → grade at final encode:
```bash
ffmpeg -y -i assembly.mp4 \
  -vf "lut3d=luts/<chosen>.cube" \
  -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 256k -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 \
  -movflags +faststart \
  final.mp4
```
(`-ar 48000` is required: loudnorm internally resamples and would otherwise output 96 kHz audio.)

**With Remotion graphics** → grade the assembly *before* it enters Remotion (Remotion cannot apply .cube LUTs), then do NOT apply the LUT again afterward:
```bash
ffmpeg -y -i assembly.mp4 -vf "lut3d=luts/<chosen>.cube" \
  -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -c:a copy \
  work/assembly-graded.mp4
```

`-movflags +faststart` makes the deliverable stream-ready for upload. For platforms that re-encode anyway (YouTube/X), crf 17–18 is plenty.

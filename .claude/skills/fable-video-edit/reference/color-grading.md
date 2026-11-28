# Color grading — hand-written .cube LUTs

The grade is plain text: 3D LUTs written from scratch (no preset packs), applied by ffmpeg (`-vf lut3d=luts/name.cube`) — never inside Remotion, which has no .cube support. Iterating the grade = editing numbers and re-rendering the same stills.

## .cube format

```
TITLE "warm_filmic"
LUT_3D_SIZE 33
# 33^3 lines of "R G B" in [0,1], red fastest, then green, then blue:
# for b: for g: for r: print(f(r/32, g/32, b/32))
0.0000 0.0000 0.0000
...
```

Generate LUTs with a small Python script — define a per-channel transfer function and write 33³ lines:

```python
import numpy as np

def slog3_to_linear(x):  # Sony S-Log3 EOTF (official Sony formula)
    x = np.asarray(x, dtype=np.float64)
    return np.where(
        x >= 171.2102946929 / 1023.0,
        ((10.0 ** ((x * 1023.0 - 420.0) / 261.5)) * (0.18 + 0.01) - 0.01),
        (x * 1023.0 - 95.0) * 0.01125000 / (171.2102946929 - 95.0),
    )

def linear_to_rec709(x):  # BT.709 OETF
    x = np.clip(x, 0.0, 1.0)
    return np.where(x < 0.018, 4.5 * x, 1.099 * np.power(x, 0.45) - 0.099)

def look(rgb):           # the "taste" layer — this is what you iterate on
    r, g, b = rgb
    # examples: warmth = lift r gamma, cool shadows = +b in lows,
    # punchy = s-curve, desat = lerp toward luma
    return r, g, b

N = 33
with open("luts/neutral709.cube", "w") as f:
    f.write(f'TITLE "neutral709"\nLUT_3D_SIZE {N}\n')
    for bi in range(N):
        for gi in range(N):
            for ri in range(N):
                rgb = [slog3_to_linear(v / (N - 1)) for v in (ri, gi, bi)]
                # exposure normalization: S-Log3 mid-grey 0.18 → display
                rgb = [linear_to_rec709(min(max(v, 0.0), 1.0)) for v in look(rgb)]
                f.write(f"{rgb[0]:.6f} {rgb[1]:.6f} {rgb[2]:.6f}\n")
```

(For V-Log, C-Log3, LOG-format GoPro etc., swap in that camera's published EOTF. For footage that is already Rec.709, skip the log step — the LUT is pure look.)

## The candidate-looks workflow

1. Write 4–7 looks as separate .cube files. The original set: `neutral709`, `warm_filmic`, `punchy`, `teal_orange`, plus variants like `neutral_cool_desat` (the final pick).
2. Pick 2–3 representative stills (a face, a wide, a high-contrast frame). Render every (still × LUT) combination into `work/stills/` with labeled filenames.
3. Montage them for one-glance comparison:
   ```bash
   ffmpeg -y -i s1-neutral709.png -i s1-warm_filmic.png -i s1-punchy.png -i s1-teal_orange.png \
     -filter_complex "[0][1][2][3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" grid.png
   ```
4. Show the grid, let the user choose, then iterate that one look by editing the `look()` numbers ("a bit too muted" → raise saturation/contrast slightly) and re-rendering the same stills until approved.

## Sanity checks

- Skin tones first: if faces look right, most of the grade is right.
- Check black/white clipping: `ffmpeg -i graded.png -vf waveform -frames:v 1 wave.png` or just verify min/max pixel values of the stills.
- Apply the final LUT exactly once (see ffmpeg-recipes §6 for both paths) — never bake a LUT into the mezzanine *and* the final encode.

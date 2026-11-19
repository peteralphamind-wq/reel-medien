"""Hintergrund eines Videos mit RobustVideoMatting austauschen.

Aufruf:
  python3 swap_bg.py INPUT_VIDEO HINTERGRUND OUTPUT [--seconds N] [--model mobilenetv3|resnet50]

HINTERGRUND darf ein Bild, ein Video oder eine Farbe wie '#1a1a1a' sein.
"""
import argparse, os, subprocess, sys, json
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "repo"))
from model import MattingNetwork  # noqa: E402


def probe(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate:stream_side_data=rotation",
        "-of", "json", path])
    s = json.loads(out)["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return s["width"], s["height"], float(num) / float(den)


def reader(path, w, h, seconds=None, loop=False):
    cmd = ["ffmpeg", "-v", "error"]
    if loop:
        cmd += ["-stream_loop", "-1"]
    cmd += ["-i", path]
    if seconds:
        cmd += ["-t", str(seconds)]
    # Hintergrund auf Videogroesse fuellend zuschneiden (wie "cover")
    cmd += ["-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = w * h * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input"); ap.add_argument("background"); ap.add_argument("output")
    ap.add_argument("--seconds", type=float)
    ap.add_argument("--model", default="resnet50", choices=["mobilenetv3", "resnet50"])
    ap.add_argument("--downsample", type=float)
    a = ap.parse_args()

    torch.set_num_threads(os.cpu_count())
    model = MattingNetwork(a.model).eval()
    model.load_state_dict(torch.load(os.path.join(HERE, f"rvm_{a.model}.pth"), map_location="cpu"))

    w, h, fps = probe(a.input)  # ffmpeg dreht Handyvideos schon richtig
    frames = reader(a.input, w, h, a.seconds)
    # erste Frame bestimmt die echte Ausrichtung
    first = next(frames)
    h, w = first.shape[:2]
    ds = a.downsample or min(1.0, 512 / max(h, w))

    bg = a.background
    if bg.startswith("#"):
        col = np.array([int(bg[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
        bg_iter = None
    else:
        is_img = bg.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        bg_iter = reader(bg, w, h, loop=not is_img)
        if is_img:
            still = next(bg_iter)
            bg_iter = None
            col = still.astype(np.float32) / 255

    tmp = a.output + ".noaudio.mp4"
    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
        "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", tmp],
        stdin=subprocess.PIPE)

    rec = [None] * 4
    n = 0
    def all_frames():
        yield first
        yield from frames
    with torch.no_grad():
        for fr in all_frames():
            src = torch.from_numpy(fr.copy()).permute(2, 0, 1).float().div(255).unsqueeze(0)
            fgr, pha, *rec = model(src, *rec, downsample_ratio=ds)
            fgr = fgr[0].permute(1, 2, 0).numpy(); pha = pha[0].permute(1, 2, 0).numpy()
            b = (next(bg_iter).astype(np.float32) / 255) if bg_iter is not None else col
            out = fgr * pha + b * (1 - pha)
            enc.stdin.write((out.clip(0, 1) * 255).astype(np.uint8).tobytes())
            n += 1
            if n % 30 == 0:
                print(f"{n} Frames", flush=True)
    enc.stdin.close(); enc.wait()

    # Originalton wieder anhaengen (falls vorhanden)
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", a.input,
           "-map", "0:v", "-map", "1:a?", "-c:v", "copy", "-c:a", "aac", "-shortest", a.output]
    subprocess.check_call(cmd); os.remove(tmp)
    print(f"Fertig: {a.output} ({n} Frames)")


if __name__ == "__main__":
    main()

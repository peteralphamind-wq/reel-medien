# Hintergrund tauschen (RobustVideoMatting)

Stellt dich im Video frei und setzt dich auf einen neuen Hintergrund (Bild, Video oder Farbe). Der Originalton bleibt dabei.

## Einrichten

```bash
pip install torch torchvision av tqdm
git clone https://github.com/PeterL1n/RobustVideoMatting.git repo
curl -L -o rvm_resnet50.pth https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50.pth
```

`repo/` und die `.pth`-Datei müssen im selben Ordner wie `swap_bg.py` liegen.

## Benutzen

```bash
# 4K-Handyvideo zuerst auf Reel-Grösse bringen (viel schneller)
ffmpeg -i IMG_1234.mov -map 0:v:0 -map 0:a:0 -vf scale=1080:1920 -c:v libx264 -crf 14 -c:a copy in.mp4

python3 swap_bg.py in.mp4 hintergrund.jpg out.mp4      # Foto
python3 swap_bg.py in.mp4 hintergrund.mp4 out.mp4      # Video (läuft in Schlaufe)
python3 swap_bg.py in.mp4 "#1c1c1e" out.mp4            # Farbe
python3 swap_bg.py in.mp4 bg.jpg out.mp4 --seconds 5   # nur Testhäppchen
```

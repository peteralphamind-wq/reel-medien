#!/bin/bash
# Batch-transcribe every take with word-level timestamps.
# Usage: transcribe.sh <takes-folder> <work-dir> [model]
# Output: <work-dir>/audio/<take>.wav and <work-dir>/transcripts/<take>.json
set -euo pipefail

TAKES="${1:?usage: transcribe.sh <takes-folder> <work-dir> [model]}"
WORK="${2:?usage: transcribe.sh <takes-folder> <work-dir> [model]}"
MODEL="${3:-medium}"

mkdir -p "$WORK/audio" "$WORK/transcripts"

shopt -s nullglob nocaseglob
for f in "$TAKES"/*.{mp4,mov,mxf,m4v,avi}; do
  base="$(basename "${f%.*}")"
  wav="$WORK/audio/$base.wav"
  json="$WORK/transcripts/$base.json"
  if [[ -s "$json" ]]; then echo "skip (done): $base"; continue; fi
  echo "audio: $base"
  ffmpeg -y -v error -i "$f" -vn -ar 16000 -ac 1 "$wav"
  echo "whisper ($MODEL): $base"
  whisper "$wav" --model "$MODEL" --language en \
    --word_timestamps True --output_format json \
    --output_dir "$WORK/transcripts" --verbose False
done
echo "done: $(ls "$WORK/transcripts"/*.json 2>/dev/null | wc -l | tr -d ' ') transcripts in $WORK/transcripts/"

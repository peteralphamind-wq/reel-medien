#!/bin/bash
# Prerequisite check for the video-edit skill.
# Prints PASS/FAIL per tool with the exact install command for anything missing.
# Exit code 0 = everything required is present.

fail=0

check() { # name, test-command, install-hint
  if eval "$2" >/dev/null 2>&1; then
    echo "PASS  $1"
  else
    echo "FAIL  $1 — install with: $3"
    fail=1
  fi
}

echo "== Required =="
check "ffmpeg" "command -v ffmpeg" "brew install ffmpeg"
check "ffprobe" "command -v ffprobe" "brew install ffmpeg"
check "whisper (openai-whisper CLI)" "command -v whisper" "pip install -U openai-whisper  (needs Python 3.9+; or: pipx install openai-whisper)"
check "node >= 18" "node -e 'process.exit(parseInt(process.versions.node)>=18?0:1)'" "brew install node"
check "npx" "command -v npx" "brew install node"

if command -v ffmpeg >/dev/null 2>&1; then
  echo "== ffmpeg capabilities =="
  for f in lut3d silencedetect loudnorm; do
    check "ffmpeg filter: $f" "ffmpeg -hide_banner -filters 2>/dev/null | grep -qw $f" "brew reinstall ffmpeg (default brew build includes these)"
  done
  check "ffmpeg concat demuxer" "ffmpeg -hide_banner -formats 2>/dev/null | grep -qw concat" "brew reinstall ffmpeg"
fi

echo "== Whisper models cached (downloaded on first use otherwise) =="
models=$(ls ~/.cache/whisper/*.pt 2>/dev/null)
if [ -n "$models" ]; then
  echo "$models" | sed 's/.*\//  /'
else
  echo "  none cached — first run downloads the model (base ~140MB, small ~460MB, medium ~1.5GB)"
fi

echo "== Disk space (raw footage + mezzanine cuts need ~3x footage size) =="
df -h . | tail -1 | awk '{print "  available: " $4}'

echo "== Optional =="
check "git (versioning the edit repo)" "command -v git" "xcode-select --install"

exit $fail

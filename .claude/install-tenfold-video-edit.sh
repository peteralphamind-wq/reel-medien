#!/usr/bin/env bash
# Holt tenfoldmarc/video-edit-skill lokal nach .claude/skills/tenfold-video-edit.
# Das Repo hat keine Lizenz, darum liegt der Code nicht in diesem (öffentlichen) Repo,
# sondern wird hier auf einen geprüften Stand festgenagelt und nur lokal abgelegt.
set -euo pipefail
PIN=3f01f2ebad12e1c6916eb66e32d6b816a3c7b41d
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HERE/skills/tenfold-video-edit"
rm -rf "$DEST"
git init -q "$DEST"
git -C "$DEST" fetch -q --depth 1 https://github.com/tenfoldmarc/video-edit-skill.git "$PIN"
git -C "$DEST" checkout -q FETCH_HEAD
rm -rf "$DEST/.git"
# Der Skill heisst im Original "video-edit", genau wie der von yerinsabraham. Darum umbenennen.
sed -i.bak 's/^name: video-edit$/name: tenfold-video-edit/' "$DEST/SKILL.md" && rm -f "$DEST/SKILL.md.bak"
echo "installiert: $DEST (Aufruf: /tenfold-video-edit)"

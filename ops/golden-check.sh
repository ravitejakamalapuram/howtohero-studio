#!/usr/bin/env bash
# Golden check for the v1 look: rebuild the worked example v17 (Rajasaurus) from git and snapshot nine frames.
# Open the contact sheet it prints and compare it with ops/golden/v1-look-reference.jpg: same indigo background,
# Anton headline with one yellow word, a drawn picture on every beat, caption below, mascot end card.
# Needs ops/bootstrap.sh to have run once. Takes about 3 minutes and writes nothing into the repo.
set -euo pipefail
cd "$(dirname "$0")/.."
. ops/env.sh
SKILL=.claude/skills/how-to-hero-video
W=$(mktemp -d)
cp -r "$SKILL/pipeline" "$W/hth"
cd "$W/hth" && mkdir -p work out && cp -r base-skeleton work/_base
node build.mjs v17
cd work/v17
npx --yes hyperframes@0.9.33 check
npx --yes hyperframes@0.9.33 snapshot --frames=9 -o "$W/frames"
echo "Compare $W/frames/contact-sheet.jpg with ops/golden/v1-look-reference.jpg"

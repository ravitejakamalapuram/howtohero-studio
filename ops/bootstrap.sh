#!/usr/bin/env bash
# Sets up a fresh Linux machine (Debian/Ubuntu) to build How To Hero videos. Safe to run again.
#   ops/bootstrap.sh            video build (Kokoro, Edge voice, sound effects, render, verify)
#   ops/bootstrap.sh --anaadi   also the Telugu Indic-TTS voice (CPU torch, large download)
# It installs tools only. It never commits, uploads or writes a secret. Then run ops/doctor.sh.
set -euo pipefail
cd "$(dirname "$0")"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

if command -v apt-get >/dev/null; then
  $SUDO apt-get update -qq
  # ffmpeg: encode/probe. fonts: Chromium draws captions, Telugu needs noto-telugu, emoji needs noto-color-emoji.
  $SUDO apt-get install -y -qq --no-install-recommends ffmpeg python3-venv python3-pip curl git ca-certificates \
    fonts-noto-core fonts-noto-color-emoji fonts-telu fonts-noto-ui-core espeak-ng
else
  echo "no apt-get: install ffmpeg, python3-venv, espeak-ng and Noto fonts (core, Telugu, color emoji) yourself" >&2
fi

command -v node >/dev/null || { echo "Node 22 is needed (https://nodejs.org); install it and run again" >&2; exit 1; }

python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

# render.cjs does require('playwright'): install it where node finds it, with its Chromium (skipped if one is already set up)
npm ls -g playwright@1.63.0 >/dev/null 2>&1 || $SUDO npm i -g playwright@1.63.0
if [ ! -d "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}" ] && ! ls ~/.cache/ms-playwright/chromium-* >/dev/null 2>&1; then
  $SUDO npx --yes playwright@1.63.0 install --with-deps chromium
fi

# warm hyperframes (pinned in pipeline2/build.mjs) so the first build does not stall
npx --yes hyperframes@0.9.33 --version >/dev/null 2>&1 || true

if [ "${1:-}" = "--anaadi" ]; then
  .venv/bin/pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
  .venv/bin/pip install -q -r requirements-anaadi.txt
  echo "Indic-TTS code installed. The Telugu checkpoint is a separate download, see ops/ASSETS.md."
fi
echo "done. Next: source ops/env.sh && ops/doctor.sh"

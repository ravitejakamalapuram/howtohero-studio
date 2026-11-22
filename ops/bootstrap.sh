#!/usr/bin/env bash
# Sets up a fresh Linux machine (Debian/Ubuntu) to build How To Hero videos. Safe to run again.
#   ops/bootstrap.sh            video build (Kokoro, Edge voice, sound effects, render, verify)
#   ops/bootstrap.sh --anaadi   also the Telugu Indic-TTS voice (CPU torch, large download)
# Needs network: apt mirrors, pypi.org, download.pytorch.org (--anaadi), github.com (earshot), registry.npmjs.org, Playwright's CDN.
# It installs tools only. It never commits, uploads or writes a secret. Then run ops/doctor.sh.
set -euo pipefail
cd "$(dirname "$0")"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

if command -v apt-get >/dev/null; then
  $SUDO apt-get update -qq
  # ffmpeg: encode/probe. fonts: Chromium draws captions, Telugu needs noto-telugu, emoji needs noto-color-emoji.
  $SUDO apt-get install -y -qq --no-install-recommends ffmpeg python3-venv python3-pip curl git ca-certificates \
    fontconfig fonts-noto-core fonts-noto-color-emoji fonts-telu fonts-noto-ui-core espeak-ng
else
  echo "no apt-get: install ffmpeg, python3-venv, espeak-ng and Noto fonts (core, Telugu, color emoji) yourself" >&2
fi

command -v node >/dev/null || { echo "Node 22 is needed (https://nodejs.org); install it and run again" >&2; exit 1; }

# the Python tools were tested on 3.13; newer ones may have no wheels yet (onnxruntime), older ones fail on the pins
PY=$(for c in python3.13 python3; do command -v "$c" >/dev/null && "$c" -c 'import sys; sys.exit(0 if sys.version_info[:2] == (3, 13) else 1)' && { command -v "$c"; break; }; done || true)
[ -n "$PY" ] || { echo "Python 3.13 is needed (apt install python3.13 python3.13-venv, or uv python install 3.13) and none was found" >&2; exit 1; }
"$PY" -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

# render.cjs does require('playwright'): install it for this user (no sudo, so it lands in the active Node's global folder),
# with its Chromium. sudo is only for the system libraries Chromium needs.
export NODE_PATH="$(npm root -g)${NODE_PATH:+:$NODE_PATH}"
node -e "require('playwright')" 2>/dev/null || npm i -g playwright@1.63.0
node -e "require('playwright')" || { echo "playwright installed but node cannot load it (npm root -g = $(npm root -g))" >&2; exit 1; }
if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ] || [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
  npx --yes playwright@1.63.0 install chromium
fi
$SUDO env "PATH=$PATH" npx --yes playwright@1.63.0 install-deps chromium

# warm hyperframes (pinned in pipeline2/build.mjs) so the first build does not stall
npx --yes hyperframes@0.9.33 --version >/dev/null 2>&1 || true

if [ "${1:-}" = "--anaadi" ]; then
  .venv/bin/pip install -q "torch==2.*" "torchaudio==2.*" --index-url https://download.pytorch.org/whl/cpu
  .venv/bin/pip install -q -r requirements-anaadi.txt
  echo "Indic-TTS code installed. The Telugu checkpoint is a separate download, see ops/ASSETS.md."
fi
echo "done. Next: source ops/env.sh && ops/doctor.sh"

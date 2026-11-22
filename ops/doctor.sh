#!/usr/bin/env bash
# Checks this machine can run the pipeline. Prints what is missing, never a secret value. Exit 1 if anything required fails.
#   ops/doctor.sh            tools + env var names + Inbox reachability (if the keys are set)
#   ops/doctor.sh --no-keys  tools only (CI)
cd "$(dirname "$0")"; . ./env.sh
bad=0; ok(){ echo "ok   $1"; }; no(){ echo "MISS $1"; bad=1; }; warn(){ echo "warn $1"; }
for c in node npx python3 ffmpeg ffprobe; do command -v $c >/dev/null && ok $c || no "$c not installed"; done
python3 -c 'import kokoro_onnx, soundfile, edge_tts, PIL, anthropic' 2>/dev/null && ok "python packages (venv)" || no "python packages: run ops/bootstrap.sh"
command -v earshot >/dev/null && ok earshot || warn "earshot missing: builds keep the plain voice (not a failure)"
node -e "require('playwright')" 2>/dev/null && ok "playwright module" || no "playwright module (npm i -g playwright@1.63.0)"
fc-list 2>/dev/null | grep -qi "telugu" && ok "Telugu font" || no "Telugu font (fonts-noto-core / fonts-telu): captions would be boxes"
fc-list 2>/dev/null | grep -qi "emoji" && ok "emoji font" || warn "no emoji font"
if [ "${1:-}" != "--no-keys" ]; then
  # names only; see .env.example for what each one is for
  for v in INBOX_URL INBOX_TOKEN; do [ -n "${!v:-}" ] && ok "$v is set" || no "$v is not set"; done
  for v in HTH_ADVISOR_KEY; do [ -n "${!v:-}" ] && ok "$v is set" || warn "$v not set: the advisor falls back to a Fable subagent"; done
  [ -n "${INBOX_URL:-}" ] && [ -n "${INBOX_TOKEN:-}" ] && { ../.claude/skills/how-to-hero-video/inbox.sh call '{"action":"list","status":"none-such","limit":1}' >/dev/null 2>&1 && ok "Inbox answers" || no "Inbox refused or unreachable"; }
fi
[ -d "${ANAADI_ASSET_ROOT:-/mnt/project-files/anaadi}" ] && ok "Anaadi art folder" || warn "Anaadi art folder missing (only needed for Anaadi): see ops/ASSETS.md"
exit $bad

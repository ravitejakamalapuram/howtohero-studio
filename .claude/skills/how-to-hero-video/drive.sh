#!/usr/bin/env bash
# Google Drive storage for finished videos, through the user's Apps Script uploader
# (the Drive connector caps uploads at ~3 MB, too small for an MP4).
# Needs DRIVE_UPLOAD_URL and DRIVE_UPLOAD_TOKEN from the task prompt. Never commit them.
#   drive.sh up <file.mp4> [review|ready|posted]  -> {"id","url","size"}
#   drive.sh move <fileId> <review|ready|posted>   -> {"id","status"}
#   drive.sh thumb <file.mp4>                      -> data:image/jpeg;base64,... (216x384, for the card's `thumb`)
set -euo pipefail
: "${DRIVE_UPLOAD_URL:?set DRIVE_UPLOAD_URL}" "${DRIVE_UPLOAD_TOKEN:?set DRIVE_UPLOAD_TOKEN}"
U="$DRIVE_UPLOAD_URL?token=$DRIVE_UPLOAD_TOKEN"
q() { python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$1"; }
case "$1" in
  up)
    # curl -L turns the POST into a GET after Apps Script's 302, which is what it expects; don't add -X POST.
    base64 -w0 "$2" | curl -sSL --fail --retry 3 -m 600 -H 'Content-Type: text/plain' \
      --data-binary @- "$U&status=${3:-review}&name=$(q "$(basename "$2")")" ;;
  move)
    curl -sSL --fail --retry 3 -m 120 -d "" "$U&action=move&id=$2&status=$3" ;;
  thumb)
    t=$(mktemp --suffix .jpg)
    ffmpeg -loglevel error -y -ss 0.5 -i "$2" -frames:v 1 -vf scale=216:384 -q:v 7 "$t"
    printf 'data:image/jpeg;base64,%s' "$(base64 -w0 "$t")"; rm -f "$t" ;;
  *) echo "usage: drive.sh up|move|thumb ..." >&2; exit 2 ;;
esac

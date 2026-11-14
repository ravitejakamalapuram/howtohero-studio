#!/usr/bin/env bash
# Calls the user's Inbox (approvals app, see the inbox repo's docs/FAQ.md).
# Needs INBOX_URL and INBOX_TOKEN in the environment. Never print, log or commit them,
# and never print an upload link (anyone holding it can write the file).
#   inbox.sh call '<json without token>'  -> the API reply; exits 1 when "ok" is false
#   inbox.sh up <file> <itemId> [folder]   -> uploads to Drive (default folder review), attaches it to the item,
#                                             prints the attach reply ({"item":{...,"driveId","link"}})
set -euo pipefail
: "${INBOX_URL:?set INBOX_URL}" "${INBOX_TOKEN:?set INBOX_TOKEN}"

call() {
  local body out
  body=$(python3 -c 'import json,os,sys; d=json.loads(sys.argv[1]); d["token"]=os.environ["INBOX_TOKEN"]; print(json.dumps(d))' "$1")
  # -L follows Apps Script's redirect; don't add -X POST, it breaks the redirect.
  out=$(curl -sSL --retry 3 -m 120 --data-binary "$body" "$INBOX_URL")
  printf '%s\n' "$out"
  python3 -c 'import json,sys; sys.exit(0 if json.loads(sys.argv[1]).get("ok") else 1)' "$out"
}

up() {
  local file=$1 id=$2 folder=${3:-review} req session put fid
  req=$(python3 -c 'import json,os,sys; print(json.dumps({"action":"uploadUrl","id":sys.argv[2],"folder":sys.argv[3],"name":os.path.basename(sys.argv[1]),"size":os.path.getsize(sys.argv[1]),"replaceExisting":True}))' "$file" "$id" "$folder")
  session=$(call "$req" 2>/dev/null) || { echo "uploadUrl failed" >&2; exit 1; }
  put=$(curl -sS --fail --retry 3 -m 900 -X PUT --data-binary @"$file" \
    "$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["uploadUrl"])' "$session")")
  fid=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["id"])' "$put")
  call "$(python3 -c 'import json,sys; print(json.dumps({"action":"attach","id":sys.argv[1],"driveId":sys.argv[2]}))' "$id" "$fid")"
}

case "${1:-}" in
  call) call "$2" ;;
  up) up "$2" "$3" "${4:-review}" ;;
  *) echo "usage: inbox.sh call '<json>' | up <file> <itemId> [folder]" >&2; exit 2 ;;
esac

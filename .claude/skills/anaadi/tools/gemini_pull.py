#!/usr/bin/env python3
"""Bring a file (Veo clip, image) from the Gemini web app into the cloud build, with no public link.
  step 1:  gemini_pull.py link NAME        -> prints a one-time upload link (a secret: never log, commit or post it)
  (browser, in the Gemini tab: fetch the media as a blob, then
     fetch(LINK,{method:'POST',mode:'no-cors',body:new Blob([blob],{type:'text/plain'})}) )
  step 2:  gemini_pull.py get NAME OUT     -> finds the uploaded file, attaches it to a 'done' asset item, downloads it (<=30 MB)
Needs INBOX_URL and INBOX_TOKEN in the environment."""
import base64, json, os, sys, urllib.request
STATE = os.path.expanduser('~/.gemini_pull.json')
def api(d):
    d['token'] = os.environ['INBOX_TOKEN']
    r = urllib.request.urlopen(urllib.request.Request(os.environ['INBOX_URL'], data=json.dumps(d).encode(), headers={'Content-Type': 'application/json'}), timeout=300)
    d = json.loads(r.read())
    if not d.get('ok'): sys.exit('inbox error: %s' % d.get('error'))
    return d
st = json.load(open(STATE)) if os.path.exists(STATE) else {}
cmd, name = sys.argv[1], sys.argv[2]
if cmd == 'link':
    u = api({'action': 'uploadUrl', 'name': name})['uploadUrl']
    st[name] = u; json.dump(st, open(STATE, 'w')); os.chmod(STATE, 0o600); print(u)
elif cmd == 'get':
    req = urllib.request.Request(st[name], data=b'', method='PUT', headers={'Content-Range': 'bytes */*'})
    try: info = json.loads(urllib.request.urlopen(req, timeout=60).read())
    except urllib.error.HTTPError as e: sys.exit('upload not finished yet (HTTP %s)' % e.code)
    item = api({'action': 'add', 'type': 'asset', 'status': 'done', 'title': 'Anaadi asset ' + name, 'summary': 'File moved from Gemini to the build.', 'data': {'app': 'Anaadi', 'icon': '🪔', 'channel': 'anaadi'}})['item']['id']
    api({'action': 'attach', 'id': item, 'driveId': info['id']})
    d = api({'action': 'download', 'id': item})
    open(sys.argv[3], 'wb').write(base64.b64decode(d['base64'])); print('saved', sys.argv[3], d['size'], d['mime'], 'item', item)

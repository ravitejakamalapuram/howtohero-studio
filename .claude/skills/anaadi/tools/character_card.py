"""Adds one character approval to the Inbox: uploads the sheets, then adds a pending item of type "character".

Usage: character_card.py NAME TITLE SUMMARY FIRST_EPISODE SHEET.png [SHEET.png ...]
Sheets are named <name>-<n>-<label>.png; the label becomes the link's name. Needs INBOX_URL and INBOX_TOKEN.
The upload links are secrets and are never printed.
"""
import json, os, sys, urllib.request, subprocess
U=os.environ['INBOX_URL']; T=os.environ['INBOX_TOKEN']
def call(d):
    """One Inbox call; retried when the Inbox is busy or answers with something that is not JSON."""
    import time
    d['token']=T
    for i in range(6):
        out=subprocess.run(['curl','-sS','-L',U,'-H','Content-Type: application/json','-d',json.dumps(d)],capture_output=True,text=True).stdout
        try: r=json.loads(out)
        except ValueError: r={'ok':False,'error':{'code':'busy'}}
        if r.get('ok') or (r.get('error') or {}).get('code')!='busy': return r
        time.sleep(10)
    return r
name, title, summary, usedby = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
files = sys.argv[5:]
links={}; first=None
for f in files:
    label=os.path.basename(f).split('-',2)[2].rsplit('.',1)[0].capitalize()
    u=call({'action':'uploadUrl','name':os.path.basename(f)})
    url=u.get('uploadUrl') or (u.get('result') or {}).get('uploadUrl')
    p=subprocess.run(['curl','-sS','-X','PUT','--data-binary','@'+f,url],capture_output=True,text=True).stdout
    fid=json.loads(p)['id']
    links[label]='https://drive.google.com/file/d/%s/view'%fid
    first=first or fid
    print('uploaded', label)
r=call({'action':'add','type':'character','status':'pending','title':title,'summary':summary,'driveId':first,
        'link':'https://drive.google.com/file/d/%s/view'%first,
        'data':{'app':'Anaadi','icon':'🪔','channel':'anaadi','character':name,'usedBy':usedby,'links':links}})
print('add', r.get('ok'), r.get('error'))
it=r.get('item') or r.get('result') or r
print('id', it.get('id'), it.get('status'), it.get('tag'), [l.get('label') for l in it.get('links',[])])

#!/usr/bin/env python3
"""Asset gate: exit 1 and list what is missing if any image an arc needs is not on disk.
usage: check_assets.py assets/arc-1-creation.json [episode]"""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
root = json.load(open(os.path.join(here, '..', 'flow.json')))['art']['assetRoot']
m = json.load(open(sys.argv[1]))
groups = {**m['characters'], **m['scenery'], **m['props']}
need = m['usedBy'][sys.argv[2]] if len(sys.argv) > 2 else list(groups)
missing = []
for name in need:
    files = groups[name] if isinstance(groups[name], list) else [groups[name]]
    missing += [f for f in files if not os.path.isfile(os.path.join(root, f))]
if missing:
    print('Missing %d image(s):\n  %s' % (len(missing), '\n  '.join(missing))); sys.exit(1)
print('All %d asset group(s) are on disk.' % len(need))

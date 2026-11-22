# Fix what the person rejected

The Inbox makes the person give a reason for every rejection. The reason is the item's `note`, and each one is also kept in `data.rejections` (`[{reason, at}]`, newest last). Every job reads these before it makes anything new, fixes the item, and sends it back for review. This file is the one procedure; SCOUT.md, SKILL.md "Build run" and the Anaadi SKILL.md point here.

## Find them

`fixlist.py --max <fix.maxFixes> --limit <fix.maxPerRun> --types <types> [--channel <c> | --not-channel anaadi]` (both numbers are in the channel's `flow.json`; if the channel's `build.paused` is true, fix nothing). The time spent fixing counts against `build.budgetMinutes`. It prints the rejected items that carry a reason and are still under the cap, oldest first. Anything else rejected (the job's own "duplicate of ..." and "build failed" notes, items past the cap, items whose newest rejection was already fixed) is not listed and stays rejected. An item a crashed fix left in `building` with `data.fixing` true is listed again once its claim has expired. Mention the "left for you" count in the final reply.

## Fix one

1. Reopen and claim it, in two calls back to back (a rejected item is closed, so it cannot be claimed first): `{"action":"update","id":ID,"set":{"status":"building","data":<its data with "fixing":true>}}`, then `{"action":"claim","id":ID,"by":WORKER,"ttlMinutes":N}`.
2. Read `reason` (the newest) and `reasons` (all of them: do not bring back what an earlier one asked to remove). Change what the reason says, and only that.
   - `story`/`idea` card: rewrite `title`, `summary` and the `data` fields the reason is about (angle, hook, sources). Run `dupcheck.py` again with `--skip <id>`; a DUPLICATE is not fixable, so leave it rejected with `note` "duplicate of <id>" and `data.rejections` untouched.
   - `video`: rebuild from its script with the change (new script lines, new scenes, new voice), as "Build one video" says, upload with `inbox.sh up` (it replaces the file), and redo the thumbnail and platform versions if the change touches what they show.
   - Anaadi episode or `character`: redo exactly the frames, lines or sheets the reason names, then the episode checklist or the art checks.
3. Send it back: `{"action":"release","id":ID,"by":WORKER,"set":{"status":"pending", ...changed fields}}`. Do not touch `note` or `data.rejections`. A `data` in `set` replaces all of `data`, so copy the existing one, remove `fixing` and `fixFailures`, set `fixedCount` to its number of rejections, and change nothing else you need not: the card shows "Sent back after N rejections. Last reason: ..." and the person sees what was meant to change. Put a one-line `data.fixed` ("what I changed") in `data` so the card says so.
4. If you cannot fix it (the reason needs something you cannot do, or the build fails twice): `release` it with status `rejected`, `data.fixFailures` plus one, `fixing` removed, and the rest of `data` unchanged. After 2 failures it is left for the person. Never loop on the same item in one run.

A build-run card in `building` with `data.fixing` true is never built from: skip it. The cap `fix.maxFixes` counts rejections: an item rejected more times than the cap is left alone, because three tries that failed to please the person is a sign the idea is wrong, not the wording.

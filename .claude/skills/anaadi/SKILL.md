---
name: anaadi
description: Make one Anaadi episode (Indian mythology told in story order, vertical 9:16, 45-60 s, Telugu first) from the series bible. Character and scenery art comes first and is reused across the series; an episode is built only when its art set is complete. Use for Anaadi builds or when asked to make an Anaadi episode or character sheet.
---

# Anaadi episodes

Anaadi (@AnaadiKatha) tells Indian mythology in story order as linked Shorts. It is a second channel in this repo: it reuses `how-to-hero-video/pipeline2/` (render, verify), `publisher/` and `platforms/*.json`, and keeps its own settings in `flow.json`. YouTube only. Nothing is posted without an approved Inbox card.

The one rule that shapes everything: **art first, episodes second**. Characters and places are designed once as sheets, checked, and reused in every episode. An episode never invents a character or a place on the fly.

## Order of work

1. **Pick the arc.** The series bible lists the episodes. An arc is a run of episodes that share a cast (arc 1 is episodes 1 to 4).
2. **List the art.** Write `assets/arc-<n>-<name>.json`: every character, animal, place and prop the arc needs, and which episode uses which (`usedBy`). Animals and serpents are characters too.
3. **Make the art set** by the rules in [ASSETS.md](ASSETS.md): three sheets for each character, one background for each place, one sheet for each prop.
4. **Gate.** Run `python3 tools/check_assets.py assets/arc-<n>-<name>.json`. It must pass, and every image must have been looked at (ASSETS.md, "Checking"). If anything is missing or wrong, make it again. Do not start an episode before this passes. Do not stop to ask between images; keep going until the set is complete. Then send every new character's sheets to the person in the thread and wait for their approval of each character: no story frames, clips or episodes that use a character may be made before the person has approved that character. A rejected character is redesigned and sent again. While waiting, do work that needs no new character (stories, scripts, voice, scenery, episodes whose cast is already approved).
5. **Story.** For each episode write `story.md` (logline, sources, version note, beats, shot list) and `script.json` (Telugu lines). Sources and the version note come from the series bible and stay on screen for one line.
6. **Voice.** Record each line with the voice in `flow.json` (`voice.default`). The line lengths set the shot lengths.
7. **Scene frames.** For each shot, make one 9:16 start frame in Gemini with the character's sheet (or an earlier approved frame of the same character) attached, so the frame shows our designs and not new ones. Start a new chat for each frame and paste the reference in: a long chat starts to answer with errors. A place with no characters needs no new frame; its background is the start frame.
8. **Clips.** Turn each start frame into a clip with Gemini video (image to video), with the style lock and timed beats in the prompt (ASSETS.md, "Video prompt"). Each clip comes back 10 s long at 720x1280. Look at three frames of every clip before using it.
9. **Assemble.** Write `build.json` in the episode folder (which clip carries which lines, the source tags, the line that shows the channel name) and run `python3 tools/build_episode.py <episode folder>`. It scales to 1080x1920, fits each clip to its lines (trim, slow down by up to 1.4, or play a no-character clip backwards then forwards), cross-fades, changes captions at the real pauses in the voice, draws Telugu text with the browser (fonts in `tools/fonts/`), adds the source tags and a quiet code-made drone, and drops the sound that comes with the clips. If the episode title card covers a face in the first shot, move it with `episode.top`. A line longer than a clip can cover needs its own clip, or an earlier episode's clip reused. Look at a sheet of frames from the result before sending it. When the last line is long, set `brandSecs` (for example 3) so the closing card shows only for the final seconds.
10. **Review.** Put the MP4 in `/mnt/project-files/anaadi/ep<NN>/`, upload it to Drive (Inbox `uploadUrl`) and add an Inbox card: type `video`, status `pending`, `driveId` set to the Drive file, and `data` with `"channel": "anaadi"`, `"episode": <number>` and `meta.youtube.title` (ending in `#shorts`) and `meta.youtube.text` (the description with the sources). The person approves the card on Telegram. A card without `data.channel` set to `anaadi` would be posted to the How To Hero channels, so check the card after adding it.
11. **Post.** Nothing to do by hand: the next publish run (`publisher/publish.py`, `run_series`) uploads the approved card to the account `anaadi`, scheduled on YouTube for the day after the last scheduled episode at 19:30 IST, strictly in episode order (settings in `platforms/youtube.json`, `channels.anaadi`). Episodes 1 to 4 were posted by hand before this existed.

Steps 7 to 9 are proven for single shots only; update this file when the first full episode has passed review.

## Moving files out of Gemini

Gemini runs in the browser and the build runs in the cloud. `tools/gemini_pull.py` moves an image or clip across without a download on the person's computer and without a public link: `link NAME` gives a one-time upload link, the Gemini tab posts the file to it, and `get NAME OUT` saves it. The link is a secret: never log, commit or post it. Needs `INBOX_URL` and `INBOX_TOKEN` in the environment.

## Limits to plan around

- The Gemini web app needs the person's browser open. A build with missing art waits on an Inbox to-do; it does not guess.
- Free image limits are per account and per day. Use the accounts in `flow.json` (`art.accounts`) in order, and when all are used up, do the text work (stories, scripts, voice) until the reset.
- Video is limited too: an account may give only two clips a day, and says so when the limit is reached. Plan about four clips an episode across the accounts.
- An account may show a terms box on its first upload. Only the person may accept it.

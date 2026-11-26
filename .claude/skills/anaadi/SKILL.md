---
name: anaadi
description: Make one Anaadi episode (Indian mythology told in story order, vertical 9:16, 55-65 s, Telugu first) from the series bible. Character and scenery art comes first and is reused across the series; an episode is built only when its art set is complete. Use for Anaadi builds or when asked to make an Anaadi episode or character sheet.
---

# Anaadi episodes

Anaadi (@AnaadiKatha) tells Indian mythology in story order as linked Shorts. It is a second channel in this repo: it reuses `how-to-hero-video/pipeline2/` (render, verify), `publisher/` and `platforms/*.json`, and keeps its own settings in `flow.json`. YouTube first; each episode then goes to Instagram @anaadikatha once it is live on YouTube, oldest first, at most one per time in `platforms/instagram.json` channels.anaadi (publisher account `anaadi`). Its caption is `meta.instagram.text` when the card has one, else the YouTube title and description (5 hashtags at most, so put the best 5 first). Nothing is posted without an approved Inbox card.

The one rule that shapes everything: **art first, episodes second**. Characters and places are designed once as sheets, checked, and reused in every episode. An episode never invents a character or a place on the fly.

## Order of work

1. **Pick the arc.** The series bible lists the episodes. An arc is a run of episodes that share a cast (arc 1 is episodes 1 to 4).
2. **List the art.** Write `assets/arc-<n>-<name>.json`: every character, animal, place and prop the arc needs, and which episode uses which (`usedBy`). Animals and serpents are characters too.
3. **Make the art set** by the rules in [ASSETS.md](ASSETS.md): three sheets for each character, one background for each place, one sheet for each prop.
4. **Gate.** Run `python3 tools/check_assets.py assets/arc-<n>-<name>.json`. It must pass, and every image must have been looked at (ASSETS.md, "Checking"). If anything is missing or wrong, make it again. Do not start an episode before this passes. Do not stop to ask between images; keep going until the set is complete. Then send every new character's sheets to the person as an Inbox approval, one item per character (`python3 tools/character_card.py`: type `character`, `data.app` "Anaadi", `data.channel` "anaadi", the sheets in `data.links`), and wait for their approval of each character. Read the decision and the note from the Inbox item, and set an approved item to `done` once its design is in use: no story frames, clips or episodes that use a character may be made before the person has approved that character. A rejected character is redesigned and sent again. While waiting, do work that needs no new character (stories, scripts, voice, scenery, episodes whose cast is already approved).
5. **Story.** For each episode write `story.md` (logline, sources, version note, beats, shot list) and `script.json` (Telugu lines). Sources and the version note come from the series bible and stay on screen for one line. Every episode runs 60 seconds, give or take 5 (the person's rule, 2026-11-22): write eight to nine lines, about 55 seconds of voice, and count the recorded lengths before making clips. If it comes out short, add story lines (never padding or slower speech) and cover them with reused clips or stills moved in code (ffmpeg `zoompan` on a start frame or scenery), not with extra Gemini clips.
6. **Voice.** Record each line with the voice in `flow.json` (`voice.default`). The line lengths set the shot lengths.
7. **Scene frames.** For each shot, make one 9:16 start frame in Gemini with the character's sheet (or an earlier approved frame of the same character) attached, so the frame shows our designs and not new ones. Start a new chat for each frame and paste the reference in: a long chat starts to answer with errors. A place with no characters needs no new frame; its background is the start frame.
8. **Clips.** Turn each start frame into a clip with Gemini video (image to video), with the style lock and timed beats in the prompt (ASSETS.md, "Video prompt"). Each clip comes back 10 s long at 720x1280. Look at three frames of every clip before using it.
9. **Assemble.** Write `build.json` in the episode folder (which clip carries which lines, the source tags, the line that shows the channel name) and run `python3 tools/build_episode.py <episode folder>`. It scales to 1080x1920, fits each clip to its lines (trim, slow down by up to 1.4, or play a no-character clip backwards then forwards), cross-fades, changes captions at the real pauses in the voice, draws Telugu text with the browser (fonts in `tools/fonts/`), adds the source tags and a quiet code-made drone, and drops the sound that comes with the clips. Give each segment a fitting scene sound with `"sfx"` (a request in words, rendered in code by earshot: `pip install "earshot @ git+https://github.com/Leonxlnx/earshot"`; for example "fire crackle", "night crickets", "thunder roll"; `earshot sounds` lists them). Keep it under the voice (`sfxVol`, default 0.3) and leave quiet scenes quiet. If the episode title card covers a face in the first shot, move it with `episode.top`. A line longer than a clip can cover needs its own clip, or an earlier episode's clip reused. Look at a sheet of frames from the result before sending it. When the last line is long, set `brandSecs` (for example 3) so the closing card shows only for the final seconds.
10. **Review.** Put the MP4 in `/mnt/project-files/anaadi/ep<NN>/`, upload it to Drive (Inbox `uploadUrl`) and add an Inbox card: type `video`, status `pending`, title `Ep <N> · <Telugu title>`, `driveId` set to the Drive file, `link` set to `https://drive.google.com/file/d/<id>/view` (and the same under `data.links.Video`) in the same `add` call, because the Telegram message is sent once and a card added without the link arrives with no way to watch it, and `data` with `"app": "Anaadi"`, `"channel": "anaadi"`, `"episode": <number>` and `meta.youtube.title` (ending in `#shorts`) and `meta.youtube.text` (the description with the sources, within `titleMax` and `descriptionMaxBytes` in `platforms/youtube.json`: YouTube counts the description in bytes and a Telugu letter takes 3, so keep it under about 1,600 Telugu letters). Also make the episode's YouTube thumbnail with `tools/thumb.py` (see "Thumbnails" below), upload it (same `uploadUrl`) and put its Drive id in `data.thumb`: the publisher sends it to YouTube as the custom thumbnail, and the Inbox and Telegram show it on the card. A plain still from the video is not enough. The person approves the card on Telegram. A card without `data.channel` set to `anaadi` would be posted to the How To Hero channels, so check the card after adding it.
11. **Post.** Nothing to do by hand: the next publish run (`publisher/publish.py`, `run_series`) uploads the approved card to the account `anaadi`, scheduled on YouTube for the day after the last scheduled episode at 19:30 IST, strictly in episode order (settings in `platforms/youtube.json`, `channels.anaadi`). Episodes 1 to 4 were posted by hand before this existed.

The Inbox dashboard has an Anaadi group with a Video pipeline page. The text on it is `assets/pipeline-about.txt`; after changing the pipeline, update that file and send it again with the Inbox `channelAbout` action (`app` "Anaadi").

## Fix what was rejected

The person gives a reason for every rejection, in the Inbox note. At the start of every Anaadi run, before making anything new: `how-to-hero-video/fixlist.py --max <fix.maxFixes> --limit <fix.maxPerRun> --channel anaadi` (nothing when `build.paused` is true) and fix each item as `how-to-hero-video/FIXES.md` says. A `character` item is redone with the sheet rules in ASSETS.md; an episode card is rebuilt from the step the reason points at and passes the checklist below again, then goes back to `pending` with its video link replaced. Send nothing back that was not looked at again.

## Checklist for every episode

Every build follows this file from step 1, whoever runs it and however many episodes they have made. Before adding the review card, tick each line; a line that fails sends the episode back to its step. When a mistake teaches a new rule, add it here in the same change, so the next build cannot miss it.

1. Every character on screen has an approved `character` item in the Inbox, and its frames were made from that sheet or from an approved earlier frame. For Brahma use an approved frame as the reference: the sheet alone has given the wrong number of faces.
2. Every frame was looked at and counted: the number of figures, faces and arms matches the story (seven sages means seven). The image tool miscounts; ask it for an edit until the count is right.
3. Three frames of every clip were looked at: no new characters, no text, no change of style.
4. The script has sources and a version note, and the source tag shows on screen for one line.
5. The voice is the one in `flow.json`, every line of the episode was recorded with one model, and no take is far longer than its text. The voice tool sends only the Telugu text, because the voice service reads any instruction aloud (found 2026-11-22). Transcribe the sound of the finished MP4 and compare it with the script: the voice must say the script and nothing else.
6. `build.json` gives each scene a fitting sound (`sfx`), has the episode label and title, and the closing line shows the channel name.
7. The build printed a length of 55 to 65 seconds and did not exit with an error.
8. A sheet of frames from the finished MP4 was looked at: captions readable and inside the frame, the title card not over a face, cuts at the right lines.
9. If this was a fix, the reason was followed and nothing an earlier reason asked to remove came back. The review card was added in one call with the video link, `data.channel` "anaadi", the right `data.episode`, `meta.youtube` and `data.thumb`, then read back to confirm.
10. The thumbnail was made with `tools/thumb.py` from a clear frame of the episode, its words follow the rules in "Thumbnails", and it was looked at 160 px wide: the words read, the main face is not covered and not cut off.
11. Files for the person are given as Drive links in the message, and the episode's state is saved to project memory.

## Thumbnails

Most Shorts views come from the feed, which plays the video and never shows the thumbnail. The thumbnail is what people see in search, on the channel's Shorts tab and in suggested videos, so a dark or plain still there costs clicks. Every episode gets a designed one before upload.

`python3 tools/thumb.py FRAME.png OUT.jpg EPISODE "LINE 1|LINE 2" ACCENT [--focus 0.45] [--zoom 1.15] [--top]` draws it at 1080x1920, under the 2 MB YouTube limit: the frame with stronger colour, the gold "అనాది · భాగం N" chip, and big white Telugu words with one word in gold.

1. Pick the frame with the clearest single face or moment of the episode, from the frames folder (no captions on it).
2. Write two to four Telugu words that make people curious and add to the title rather than repeat it, on two lines. Mark one word as the accent (a number, a surprise, the key name).
3. Move the picture with `--focus` (0 top, 1 bottom) and `--zoom` so the face fills the frame; use `--top` when the face sits low and the words would cover it.
4. Look at the result at 160 px wide, the size it shows in search. Redo it when the words do not read or a face is covered or cut off.

To change the thumbnail of a video already on YouTube, upload the new file and send Social Media Publisher `publish` with `"platform": "youtube"`, `"account": "anaadi"`, the `videoId` and `thumbnail` only, then set the card's `data.thumb` to the same file.

Custom thumbnails need the channel's "intermediate features" (YouTube Studio, Settings, Channel, Feature eligibility, which asks for a phone number once). Without them YouTube answers 403 "doesn't have permissions to upload and set custom video thumbnails"; the video still posts, and the job only carries a warning, so read the job's `warnings` after the first upload of a new channel (found 2026-11-25 on Anaadi).

## Moving files out of Gemini

Gemini runs in the browser and the build runs in the cloud. `tools/gemini_pull.py` moves an image or clip across without a download on the person's computer and without a public link: `link NAME` gives a one-time upload link, the Gemini tab posts the file to it, and `get NAME OUT` saves it. The link is a secret: never log, commit or post it. Needs `INBOX_URL` and `INBOX_TOKEN` in the environment.

## Limits to plan around

- The Gemini web app needs the person's browser open. A build with missing art waits on an Inbox to-do; it does not guess.
- Free image limits are per account and per day. Use the accounts in `flow.json` (`art.accounts`) in order, and when all are used up, do the text work (stories, scripts, voice) until the reset.
- Video is limited too: an account may give only two clips a day, and says so when the limit is reached. Plan about four clips an episode across the accounts.
- An account may show a terms box on its first upload. Only the person may accept it.

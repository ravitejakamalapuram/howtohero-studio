# Thumbnails

Every video gets a custom thumbnail, drawn in code from one of its own frames by `pipeline2/thumb.mjs` (no AI images
unless the user asks). The build makes it; the publisher sends it to each platform that takes one.

## Where a thumbnail shows (why it matters, and how much)

- **YouTube Shorts:** the Shorts feed autoplays the video, so the thumbnail is not seen there (about 80% of our views).
  It shows in search, the channel's Shorts tab, subscriptions and suggested videos (about 15-25% of our views, and the
  part that grows with the library). `thumbnails.set` works on Shorts (tested 19 Nov 2026, see platforms/youtube.json).
- **YouTube long-form (documentaries):** the thumbnail is most of the click decision. Give every doc one.
- **Instagram Reels:** the cover shows on the profile grid (cropped to 3:4) and the Reels tab: sent as `coverUrl`.
- **Facebook Reels:** no thumbnail in the Reels API; Facebook picks a frame.
- The first frame still matters more for Shorts and Reels: it is what the feed shows. Thumbnails don't replace the hook.

## What works (study, 19 Nov 2026)

There is no study of science-explainer thumbnails alone; these are cross-niche findings, so treat them as a start and
let our own numbers (stats.py, search CTR in YouTube Studio) correct them:
- vidIQ, 500 breakout videos (2026): high contrast, overlay text (median about 5 words), often a face.
  https://vidiq.com/research/youtube-thumbnail-study/
- Eden, 507,478 videos (Aug 2025-Aug 2026): shocked faces are a big-channel habit; smiling faces did slightly worse.
  https://eden.so/blog/what-makes-a-good-youtube-thumbnail/
- Bright, saturated backgrounds (blue, orange, red) beat muted ones; text needs strong contrast (7:1 or more).
- YouTube ranks by watch time, not clicks: a thumbnail that promises more than the video loses.

## Rules for our thumbnails

1. **2-5 words**, all caps, that add to the title instead of repeating it. Title "NASA Can't Explain These Mars Rocks"
   → thumbnail "NASA IS STUMPED". Use a curiosity gap, a number or a contrast; never a question mark.
2. **One object**: pick the frame (`--at`) whose drawing is the clearest single thing (sheet.py's contact sheet shows
   one frame per beat). Avoid frames full of text; use `--focus` to leave the hook text out of the picture.
3. **One yellow word** (`--accent`): the surprising one.
4. Optional `--tag` (2-3 words in a red chip): the topic, like "MARS MYSTERY" or "SPACE NEWS".
5. Must read at phone-list size (about 160 px wide): look at it scaled down before uploading.
6. Telugu videos (Anaadi): the same layout with Telugu words once a Telugu display font is added; until then English.

## Commands

```
node pipeline2/thumb.mjs out/<file>.mp4 out/<stem>.thumb.jpg --text "NASA IS|STUMPED" --accent STUMPED --at 1.5 --focus 0.4 --tag "Mars mystery"
inbox.sh upload out/<stem>.thumb.jpg <item id>     # prints the Drive file id -> data.thumb
```

`|` breaks the line. A Short gives 1080x1920; a 16:9 video gives 1280x720 (`--format` overrides). The file stays under
YouTube's 2 MB limit.

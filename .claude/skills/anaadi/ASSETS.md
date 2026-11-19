# Anaadi art rules

## What a complete set is

For every **character** (gods, asuras, sages, animals, serpents), three sheets on a plain light grey background, 16:9, no text:

1. **Turnaround**: full body, head to feet, front, three-quarter and side views. This is the master design. When sheets disagree, the turnaround wins.
2. **Expressions**: six to eight head-and-shoulder faces. Never calm only. Cover what the story needs: calm, smile, anger, gambhiram (stern majesty), wonder, fear, sorrow, joy, sleep or meditation where it applies.
3. **Poses**: six action poses the arc needs (sitting, fighting, blessing, falling and so on).

Two brothers or a pair that always appear together may share sheets. A creature whose poses fit on the turnaround may use two sheets.

For every **place**, one 9:16 background with no characters and an empty centre. For every **prop** that changes state (a lotus that opens), one sheet with its states.

## Look

Richly detailed flat vector illustration: defined facial anatomy, detailed eyes with iris and highlights, hair and beard strands as clean shapes, ornament detail, cloth folds, soft gradients. Not a simple cartoon. Designs are our own: never copy another creator's characters.

## Keeping designs the same

- Make all sheets for one character in the same chat, and say "this exact same character, same design and colours".
- In a new chat or account, attach the turnaround sheet and say it is our own design.
- Describe weapons and ornaments in every prompt; they drift first.

## Checking

Look at every image at full size before saving it. Redo it when: a figure is cropped, a hand or weapon is doubled, the design differs from the turnaround, there is text in the image, or a face asked for is missing. Save full-size files (1376x768 or 768x1376), not the 1024 preview.

## Where files go

Under `art.assetRoot` in `flow.json`: `characters/<name>/<name>-<n>-<kind>.png`, `scenery/<nn>-<place>.png`, `props/<prop>-sheet.png`. The arc file in `assets/` is the list a build is checked against.

## Video prompt

Attach the start frame and write: use this exact image as the first frame; keep the same flat vector style, colours and character design for the whole clip (style lock); no new characters, no text; then the beats with times ("0-3 s: ...", "3-7 s: ...", "7-10 s: ...") and one slow camera move.

## Location maps

Two master maps show where a scene happens, following the Bhagavata Purana, canto 5: `maps/fourteen-lokas.png` (the fourteen worlds stacked, Shesha below) and `maps/bhu-mandala.png` (the earth disc from above: Meru, the ring islands and the seven oceans). A scene may open with a zoom from a map into its place and dissolve into the scene. Rules: the zoom is done in our own render (ffmpeg zoompan or the pipeline2 camera), not with Gemini video; it lasts two to three seconds at most; small deities on a map are our own character cutouts placed in code; the worlds do not exist before episode 4, so the maps are not used in episodes 1 to 3; say on screen once that the layout follows the Bhagavata.

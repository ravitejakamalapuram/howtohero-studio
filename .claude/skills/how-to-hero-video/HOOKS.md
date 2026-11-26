# Hooks, openings and end cards

Three parts of a video decide most of its reach, and each has a few named shapes. Every video uses one shape of each, and records which, so the weekly report can say which shapes keep viewers.

Why these three (checked on the platforms' own pages, 26 Nov 2026):

- **YouTube** counts only "engaged" Shorts views toward monetisation: a view that is swiped away counts for nothing. Studio shows it as "stayed to watch". Our stats keep it per video as `engagedViews`.
- **Instagram** reports, per Reel, the share of first views that left in the first 3 seconds (`skipRate`), plus shares and saves. Our stats keep all three.
- Our own numbers: the heat-shield Short (a big capsule with a flame under a plain claim) kept 33% of viewers; news Shorts with a label and a small abstract icon kept 8 to 16%.

So the first 2 to 3 seconds are the hook's words plus the opening picture, and the last second is the end card.

## How a video gets its parts

1. Run `node pipeline2/pickparts.mjs <item id>` from the skill folder. It prints `hookPattern`, `opening` and `endCard`. About half the videos get all three defaults; the other half try a trial shape for exactly one part, the hook twice as often as the others (`flow.json` "parts"). One trial part a video keeps the comparison clean.
2. Write the video with those shapes. If the story can't carry one honestly (see "Use when" below), use that part's default instead. Never bend a fact to fit a shape.
3. Put the three values you actually used in the card's `data` at hand-in: `hookPattern`, `opening`, `endCard`.

A card's `note` that asks for a shape wins over the pick.

## Hook: the two headline lines and the first spoken line

The rules in `SKILL.md` hold for every shape: a statement, never a question; never the topic restated; the first spoken line says the same thing in at most 12 words.

| `hookPattern` | What it is | Example | Use when |
| --- | --- | --- | --- |
| `claim` (default) | One bold, true statement that sounds wrong. | GPS NEVER SENDS ANYTHING | Always possible. |
| `open-loop` | The surprising result, with the reason held back until later. The suspense is "how can that be?". | THIS BRIDGE IS BUILT TO BREAK | The video really answers it, and the answer comes in the last third. Never tease something the video does not deliver: that is a misleading title under YouTube's rules. |
| `number` | Led by one number the viewer can picture. | 400 TONNES HANG FROM ONE BOLT | The number has a named source. Never round it into something more dramatic. |
| `contrast` | "X, but Y": two facts that should not both be true. | HOTTER THAN LAVA, YET IT FLOATS | Both halves are sourced. |

`how` ("how X does Y") is kept only for old videos. It restates the topic, so don't use it.

For `open-loop`, the first spoken line states the result ("This bridge is designed to snap."), the middle beats build to the reason, and the last spoken line is the reason. Do not add filler to delay it: a shorter video that pays off is better.

## Opening: the picture at 0 seconds

Every shape keeps the cover rule: the picture and headline are fully drawn at frame 0, and something moves within the first second.

| `opening` | What it is | Use when |
| --- | --- | --- |
| `big-subject` (default) | One big drawing of the subject (500 px or more across) doing the surprising thing. | Always possible. |
| `in-motion` | The subject is already mid-action at frame 0 and keeps moving for the whole first beat (falling, spinning, breaking, flowing), not a still that starts moving. | The surprising thing is a movement. |
| `before-after` | The frame is split: the expected state on the left, the real one on the right, both drawn at frame 0, each about 400 px across (this shape replaces the one-big-drawing rule in `SKILL.md`). The right half is the surprise. | The hook is a change or a comparison (usually with `contrast`). |

## End card: the silent last beat

The last spoken line is always the payoff. The end card is the silent beat after it (`{ "hold": 1.6 }`), two lines, at most 22 characters a line.

| `endCard` | `card.lines` | Why |
| --- | --- | --- |
| `follow` (default) | `["FOLLOW FOR MORE", "HOW TO HERO"]` | Asks for the follow. |
| `send` | `["SEND THIS TO", "A CURIOUS FRIEND"]` | Asks for a share. Shares are measured per Reel, so this one can be judged. |
| `question` | `["<the question, at most 22 chars>", "TELL US BELOW"]` | Asks for a comment. Use the card's `pin` question, shortened. The publisher posts `pin` as the first comment, so the viewer finds it there. |

Asking for a follow, a share or a comment is allowed on every platform. Never offer anything in return for it and never ask viewers to follow each other: that is fake engagement under YouTube's and Instagram's rules.

## How a shape wins

The weekly report (`publisher/learn.py`, Mondays) ranks `hookPattern` and `opening` by the share of viewers who left in the first 3 seconds on Instagram and by the share of engaged views on YouTube, and `endCard` by Instagram shares per 1,000 views. A shape needs 8 videos before it is ranked; at 3 videos a day a hook shape gets there in about a month, an opening or end card shape in about two. When a trial shape has clearly beaten the default for 3 weeks running, swap the two names in `flow.json` "parts" (the flow check runs on the change). Lower `parts.trialShare` once the defaults have settled.

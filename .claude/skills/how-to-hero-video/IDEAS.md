# Idea rules: what the scout proposes and how good it must be

The single source of truth for which ideas How To Hero makes. The scout (`SCOUT.md`) follows it every run; the build run reads a card's `data.kind` and uses the build notes below. Change the rules here and the numbers in `flow.json` (`scout`), never in a task prompt.

## The kinds

Every card has one `data.kind`. Pick the kind from the idea, not the other way round.

| kind | what it is | timely or evergreen | length (`data.maxSeconds`) |
|---|---|---|---|
| `news` | Something that happened in the last 48 hours. A `story` card, found and written with `NEWS.md`. | Timely: goes stale in a day or two. | 60 |
| `explainer` | How a machine, a natural process or a famous piece of engineering works ("A heat shield works by burning itself away"). | Evergreen. | 60 |
| `fact` | One surprising, checkable fact or myth-buster that needs no long setup ("Mauna Kea is taller than Everest"). | Evergreen. | 37 |
| `curiosity` | A big, relatable question about people, told as a story with evidence (see below). | Evergreen. | 75 |
| `doc` | A 16:9 YouTube documentary, 8 minutes or more, built by hand, not by the build run (`series` "DOC"). | Evergreen. | 480 |

Lengths come from `platforms/*.json`: a `fact` fits Instagram's `versionSeconds` (37), so one render goes everywhere. Anything longer than Instagram's `maxSeconds` (40) costs a second render for its Instagram version, so only give a card more time when the story needs it, and never more than Facebook's `versionSeconds` (87). Re-read the platform files each run; if a limit there changes, these lengths follow it.

### Curiosity stories (the new kind)

Model: "What Did Ancient Humans Actually Do All Day?" (Ink Explainer, 18.9 million views). Why it works:
- **A question everyone has wondered about, about people like us.** Daily life in the past, the human body, why we do everyday things, where ordinary things came from. No expertise is needed to care about the answer.
- **The answer overturns what most people assume.** We picture hunter-gatherers starving and toiling; Richard Lee's 1960s stopwatch count of the Ju/'hoansi found about 17 hours a week spent getting food.
- **It is a story with people in it.** A researcher with a notebook in the Kalahari, a 40,000-year-old bone flute, stories told around the fire. Concrete scenes beat abstract facts.
- **Every claim has a named source.** The video lists the study, the year and the journal for each point. We do the same; it is also what keeps it trustworthy.

Good curiosity questions follow the patterns "What did people actually do / eat / believe ...", "How did people ... before ...", "Why do we ...", "What happens to your body when ...", "Where did ... come from". Find your own subjects each run; never reuse an example from this file.

Keep out: anything that needs footage of real people, gore, medical advice, politics or religion as a debate, and "ancient aliens" style speculation. A curiosity story is still fact-checked (`fact` "K"), and a contested finding is said as "researchers think" (`fact` "C").

## The quality bar (every kind)

Propose a card only if all of these hold. When in doubt, leave it out: fewer, better cards beat a full quota.
1. **Hook strength.** The `hook` is a surprising claim or a contradiction in at most 2 lines of 22 characters, never a question and never the topic restated. Test: cover the topic; the hook must still tell a viewer something they did not know. Weak: "How do volcanoes work?". Strong: "THIS VOLCANO IS TALLER THAN EVEREST".
2. **One idea.** It can be said in one sentence (`summary`), and the payoff is a line a viewer would repeat to a friend.
3. **Source.** You opened at least one credible page (agency, university, journal, museum, a named book or study) that states the key claim, and put it in `data.sources`. No source, no card.
4. **Drawable.** It works as simple code-drawn shapes and diagrams (no AI images, no real footage, no logos, no famous faces).
5. **New.** `dupcheck.py "<topic>"` shows no DUPLICATE and no CHECK item on the same subject. A new angle on an old subject only counts when the claim is clearly different.
6. **Safe for the channel.** No politics, war, crime, tragedy with victims, health scares, celebrity or market news.

Rank the cards that pass by how likely a stranger is to stop scrolling and share: hook strength first, then how many people care about the subject, then a timely bump (an anniversary this week, a film or event people are talking about). Write that reason in one line as `data.why`.

## The daily mix

Numbers live in `flow.json` under `scout`:
- `news`: `newsMin` to `newsMax` story cards, never padded with weak stories (`NEWS.md`).
- `mix`: how many idea cards of each kind per run (for example 4 curiosity, 3 explainer, 3 fact). If a kind has no card that passes the bar, propose fewer; don't fill the gap with another kind.
- `doc`: at most `docsPerWeek` documentary cards a week, only when fewer than `maxOpenDocs` `doc-` cards are pending or approved. Propose one only on the weekday in `docDay`.
- Backlog: before proposing ideas, count idea cards that are `pending` or `approved` (approved but not yet built). If pending alone reaches `maxPendingIdeas`, propose none. If pending plus approved reaches `maxIdeaBacklog`, propose only the best `ideasWhenBacklogged` across all kinds: the build run makes about 2 videos a day, so a long queue only delays new ideas.

## Card fields (ideas)

`data`: `kind`, `topic`, `angle`, `hook`, `why`, `sources` (URLs), `fact` ("K" when any number or date must be checked, "C" when contested), `maxSeconds` (from the table), `rank`. For `doc` also `series` "DOC" and the card id `doc-<slug>`. Leave out `series` for the other kinds.

## Build notes per kind (read by the build run)

- `explainer`: SKILL.md "Build one video" as written.
- `fact`: 4 to 6 spoken beats; the first line is the fact, then the one piece of evidence, then the payoff. No background section.
- `curiosity`: tell it as a story: the common assumption first, then the evidence scene by scene (who found it, where, when), then the payoff. Name the study or researcher on screen as a small caption, and list every source in `ig`.
- `news`: `NEWS.md` "Build a story".
- `doc`: not built by the build run (SKILL.md "Documentaries").

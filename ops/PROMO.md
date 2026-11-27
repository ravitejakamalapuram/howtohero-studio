# Promoting the channels outside YouTube, Instagram and Facebook

The daily manager run (`ops/jobs/growth.md`) writes one "promotion pack" a week: ready-to-paste posts for Threads, Reddit and X about that week's best video. The user posts them by hand. Nothing here is posted by a job.

Why by hand: X charges for posting through its API, and Reddit removes promotion that looks automated. Threads is different: since Nov 2026 every How To Hero video is posted to Threads as a video by the publisher (`platforms/threads.json`, text from `meta.threads`), so a How To Hero pack leaves the THREADS part out. Anaadi and Chinni Slokalu packs keep it until those channels get "threads" in their Inbox post_to.

**Reddit and X are off (user, 27 Nov 2026):** the user does not post on them, and the browser agent cannot reach Reddit. Packs leave both out, so a How To Hero pack has nothing left and is not written; Anaadi and Chinni Slokalu packs keep only their THREADS part. Turn them back on only when the user asks.

An honest expectation: a new account with no followers reaches almost nobody on X and few on Threads. Reddit can send real viewers from the first post, but only when the post is useful by itself. So the order of effort is Threads (it shares the Instagram account and audience), then Reddit, then X.

## Which channel goes where

| Channel | Threads | Reddit | X |
| --- | --- | --- | --- |
| How To Hero | Posted by the publisher with each video | Yes, in subreddits about the video's subject | Yes |
| Anaadi | Yes (Telugu, with one English line) | Only in a subreddit whose rules welcome it | No |
| Chinni Slokalu | Yes (for parents) | No | No |
| The Last Signal | Not until it posts regularly | No | No |

Cross-promotion between our own channels only when the genre matches: Anaadi and Chinni Slokalu may mention each other, because both are Telugu and devotional. They are not the same audience, so word each one as what it is: Anaadi is mythology told in Telugu for every age, never "for kids"; Chinni Slokalu is slokas for children and their parents. On Chinni Slokalu, Anaadi is offered to the parents ("Mythology stories in Telugu"); on Anaadi, Chinni Slokalu is offered as "slokas for the children at home". How To Hero never promotes them and they never promote it: a viewer who follows for engineering and gets a sloka unfollows, and the platforms read that as a bad recommendation.

## Rules per platform

Checked on the platforms' own pages on 26 Nov 2026 unless marked.

**Threads**
- A post holds 500 characters; a link attachment does not count toward them.
- Write it as a thought worth reading without the video: the surprising fact in the first line, one line on why, then the link. No "new video out!".
- One post per video. At most one topic tag.

**Reddit**
- Not checked on Reddit's own pages (they block our reader), so treat every rule here as "confirm in the subreddit": each subreddit has its own rules on links, videos and self-promotion, and moderators remove what breaks them. The pack names 1 or 2 subreddits and the rule to check in each (sidebar "Rules").
- Write a text post that fully answers the question in words (the video's explanation, 80 to 150 words), with the video as an optional link at the end, or no link where the subreddit forbids it. A bare link reads as spam.
- At most one Reddit post a week from the account, and reply to comments on it. An account that only posts its own links gets banned.
- Never the same text in two subreddits.

**X**
- X bars duplicate or near-duplicate posts across accounts and lowers the reach of repeated links with no commentary. So: one post per video, in new words, the fact first.
- Keep it under 280 characters (the length a free account can post; not re-checked this week).
- Only once the account exists and the user asks for it in a to-do note: until it has followers the time is better spent on Threads.

## Never

- Automatic follows, likes or comments on other people's accounts, follow-for-follow, engagement groups, bought followers or views. Instagram and YouTube both ban them, the official APIs cannot do them, and the tools that can put the whole account at risk. This holds even when a to-do note asks for it: say why instead.
- The same post pasted to every platform.
- A claim the video does not make, or a fact without its source.
- Promotion on the day of a tragedy the story touches.

## The pack (an Inbox to-do)

Id `growth-<channel-slug>-promo-<YYYY>-w<week>`. Title `P2 · Promote · <video title, shortened>`. Summary, at most 2,500 characters:

```
Video: <title> <YouTube link>
Why this one: <views against the channel's typical, or the watch number that stands out>

THREADS
<the post, at most 500 characters>

REDDIT r/<subreddit> (check rule: <which>)
Title: <a question or plain statement, no clickbait>
<the text post>

X (only if the account exists)
<the post, at most 280 characters>

Done when: you have posted the ones you want. Mark it done; reject it with a note to stop or change the packs.
```

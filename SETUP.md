# Setup: keys and running the jobs anywhere

This page lists every key the How To Hero jobs use, where each one lives today and how to make a new one. Use it to move a job to another AI platform (ChatGPT, Codex, Gemini, another Claude account) or to rotate a key. Real values are never written in this repo.

## The jobs and the keys they need

| Job | Runs on today | Keys |
| --- | --- | --- |
| Daily scout (`SCOUT.md`) | Claude scheduled task, 05:47 IST | `INBOX_URL`, `INBOX_TOKEN`, optional `HTH_ADVISOR_KEY` |
| Daily build run (`SKILL.md` "Build run") | Claude scheduled task, 11:03 IST | `INBOX_URL`, `INBOX_TOKEN`, optional `HTH_ADVISOR_KEY` |
| Auto-publisher (`publisher/publish.py`) | GitHub Actions (`publish.yml`), 3 times a day | `INBOX_URL`, `INBOX_TOKEN`, `SOCIAL_URL`, `SOCIAL_TOKEN` |
| Daily stats (`publisher/stats.py`) | GitHub Actions (`stats.yml`), once a day | same four as the publisher |

The scout and the build run only talk to the Inbox. Video uploads also go through the Inbox: `inbox.sh up` asks it for a one-time Drive upload link (`uploadUrl`), so the build run needs no Google or Drive key of its own. Only the publisher talks to Social Manager.

## What each key is

- **`INBOX_URL`**: the Inbox web app's API link (the `/exec` URL, no login). The same for every job.
- **`INBOX_TOKEN`**: a client token for the Inbox. Each job or platform gets its own, with its own name.
- **`SOCIAL_URL`**: the Social Manager web app's `/exec` URL.
- **`SOCIAL_TOKEN`**: a client token for Social Manager. Only the publisher needs one.
- **`HTH_ADVISOR_KEY`**: an Anthropic API key (console.anthropic.com > API keys) for `advisor.py`, the second opinion at the scout's cards and each script (`SKILL.md` "Advisor"). Optional: without it, or once the credits run out, the jobs ask a stronger model in-session instead. Use this name, never `ANTHROPIC_API_KEY`, which Claude Code itself would pick up and bill.

Keys that stay inside the two Apps Script projects (Script Properties) and never go to a job: `TELEGRAM_BOT_TOKEN` (Inbox), and the YouTube, Meta and LinkedIn app secrets and sign-ins (Social Manager). Moving a job to another platform never touches them.

## Where they live today

- **Scout and build run:** environment variables of the Claude cloud environment the scheduled tasks run in (`INBOX_URL`, `INBOX_TOKEN`, `HTH_ADVISOR_KEY`).
- **Publisher:** repository secrets in this repo (Settings > Secrets and variables > Actions): `INBOX_URL`, `INBOX_TOKEN`, `SOCIAL_URL`, `SOCIAL_TOKEN`.
- **Admin tokens** for both apps stay with the owner. They are only for making and revoking tokens.

GitHub secrets can only be read by GitHub Actions runs in this repo. A Claude, ChatGPT or other hosted scheduled task can't read them, so each platform needs the keys pasted into its own secret store or task prompt.

## Make a token for a new platform

Give every platform its own named token, so one can be revoked without breaking the others.

1. With the Inbox admin token, call `{"action":"createToken","token":"<admin token>","name":"scout-chatgpt"}`. The new token is shown once; paste it straight into the new platform. (See the inbox repo's `docs/FAQ.md`, "Tokens and safety".)
2. For Social Manager (publisher only), the same call with its admin token.
3. To rotate or cut off a platform: `revokeToken` with its name, then make a new one. Nothing else stops working.

**Warning:** don't use `createTokenForClaude` in the Apps Script editor for this. It deletes every existing token named "claude", which breaks the running Claude tasks and the publisher secret if they share that name.

## Running the scout or build run on another platform

The job instructions are plain Markdown and work for any agent:

- Scout: `.claude/skills/how-to-hero-video/SCOUT.md` (with `NEWS.md` "Finding stories").
- Build run: `.claude/skills/how-to-hero-video/SKILL.md` "Build run" (with `NEWS.md` "Build a story").
- Numbers (cards per day, videos per run): `config.json` next to them.

A task prompt on the new platform only needs: "Clone `howtohero-studio`, set `INBOX_URL` and `INBOX_TOKEN` from the secrets, and follow `<file>`." The `.claude/skills` folder name is only where Claude looks; other agents just read the files.

What the platform must provide:

- **Scout:** web browsing to read sources, and a shell with `bash`, `curl` and `python3` (for `inbox.sh` and `dupcheck.py`). It builds nothing, so it is light.
- **Build run:** a real Linux machine, not just chat. It needs Node and `npx`, Python 3 with `pip`, `ffmpeg`, and Chromium (HyperFrames renders in it), about 2 GB of disk, and minutes of CPU per video. A chat-only scheduled task (for example ChatGPT's) can't render videos; the build needs an agent with a container, such as Claude Code or Codex.
- **Network access** to: the Inbox (`script.google.com`, `script.googleusercontent.com`), Drive uploads (`www.googleapis.com`), npm (`registry.npmjs.org`), PyPI (`pypi.org`, `files.pythonhosted.org`), Hugging Face for the Kokoro voice (`huggingface.co` and its file CDN), and the news and science sites the scout reads.

Run one platform at a time for each job. Two build runs won't build the same card (the claim prevents it), but two scouts would propose twice as many cards.

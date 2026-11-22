# What lives outside git, and how to get it back

Git holds code, prompts, settings, docs and small text sources. These things are not in git on purpose.

| Thing | Where it lives today | Needed for | Can it be remade? | How to restore |
| --- | --- | --- | --- | --- |
| Anaadi art (characters, scenery, props, branding, about 85 MB) | `/mnt/project-files/anaadi/{characters,scenery,props}` and `anaadi-branding/` | Every Anaadi episode (`tools/check_assets.py` blocks a build without it) | Yes, but each sheet was approved by the user and made in Gemini's browser app; remaking changes the look | `ops/assets.sh verify` checks a copy against `ops/anaadi-art.sha256`. `ops/assets.sh pack` makes a tarball to back up. Put the folder anywhere and set `ANAADI_ASSET_ROOT` |
| Anaadi episodes, clips, WAVs (`anaadi/epNN/`, about 400 MB) | `/mnt/project-files/anaadi/epNN/` | Nothing to rebuild; finished MP4s are also on Drive through the Inbox | Yes: script + `build.json` + art | Rebuild with `tools/build_episode.py` |
| Telugu voice checkpoint `te.zip` (1.5 GB) | GitHub release AI4Bharat/Indic-TTS `v1-checkpoints-release` | Anaadi voice (`indic-te`) | Download again | See "Indic-TTS" below |
| Style samples (`video-styles/`, 61 MB of MP4) | `/mnt/project-files/video-styles/` | Reference only. Styles themselves are code in `pipeline2/styles/` | Yes | Not needed to build |
| Finished videos | Drive folder "How To Hero videos", reached through the Inbox | Publishing | No | The Inbox item's `driveId` |
| Queue, history, stats | The Inbox Google Sheet | Everything | No: it is state, not code | Back up the Sheet (File, Make a copy) before moving |
| `credentials.md` (web app links, tokens) | `/mnt/project-files/social-manager/credentials.md` | Setting up keys | Tokens can be re-issued | Keep the only copy in a password manager. Never commit it |

Backups live in the user's Google Drive folder **How To Hero backups**, one versioned file each: `anaadi-art-v1-2026-11-22.tar.gz` (sha256 `26786526d16bc2a979193705eaf65fee79329948dfc0744a0d55cab1516a388d`; unpack it into the folder that holds `anaadi/` and `anaadi-branding/`, then `ops/assets.sh verify`). When the art changes, run `ops/assets.sh pack`, upload as a new version (v2, ...) and keep the old one. Not yet backed up: the 1.5 GB Telugu voice checkpoint. Do not use a GitHub release for the art if the repo is public.

## Indic-TTS (Anaadi Telugu voice)

Source: github.com/AI4Bharat/Indic-TTS (MIT). Steps, tested 2026-11-16 on CPU, Python 3.13:

1. `ops/bootstrap.sh --anaadi` (CPU torch and `coqui-tts[codec]`, `six`).
2. Download `te.zip` from the release `v1-checkpoints-release`, unzip so `model/te/fastpitch/` and `model/te/hifigan/` exist.
3. In the fastpitch `config.json`, set `speakers_file` to the local `model/te/fastpitch/speakers.pth`, and copy that config to `fp.json`.
4. From the folder that holds `model/` and `fp.json`, after `. ops/env.sh`: `python3 <repo>/.claude/skills/anaadi/tools/indic_tts_syn.py <lines.json> <outdir> male` (lines are `[{"id","te"}]`). About 4 times faster than real time. Telugu script only: spell English words and numbers in Telugu.

The 1.5 GB zip has no copy of its own yet; mirror it to the backup destination so a deleted upstream release cannot block a rebuild.

## Not in git and not reproducible from this repo

- Claude environment settings: env vars, the network allowlist, the proxy-injected `GEMINI_API_KEY`, the two routines' schedule. `ops/jobs/*.md` says what they must be.
- Google-side state of the Inbox and Social Manager (Script Properties, time triggers, Sheet, OAuth consents). Each repo's FAQ has a "start from scratch" answer.
- Browser-only steps: Gemini art and Veo clips for Anaadi, YouTube/Meta consent screens.

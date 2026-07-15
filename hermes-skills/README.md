# Hermes Agent skills

Two [Hermes Agent](https://github.com/) skills that let you generate videos through
`hermes` chat instead of Claude Code. They mirror the
[`.claude/skills/create-template-video`](../.claude/skills/create-template-video/SKILL.md)
skill, split into two steps so the render step is reusable on its own:

| Skill                       | Does                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `create-video-from-content`  | Takes a URL or raw text, writes `script.json`, then calls the skill below |
| `auto-generate-video`        | Runs `npm run pipeline` on an existing `script.json`                  |

## Install

1. Clone this repo and finish its [Setup](../README.md#-setup) (Node, ffmpeg, Chrome,
   `npm install`, OmniVoice server reachable at `OMNIVOICE_ENDPOINT`).
2. Copy both skill folders into your Hermes skills directory:
   ```bash
   cp -r hermes-skills/create-video-from-content hermes-skills/auto-generate-video \
     ~/.hermes/skills/
   ```
3. Both `SKILL.md` files use a `<REPO_PATH>` placeholder wherever they need this repo's
   absolute path. Replace it with your actual clone path:
   ```bash
   REPO_PATH="$(pwd)"
   sed -i "s#<REPO_PATH>#$REPO_PATH#g" \
     ~/.hermes/skills/create-video-from-content/SKILL.md \
     ~/.hermes/skills/auto-generate-video/SKILL.md
   ```
4. Make sure your OmniVoice-compatible TTS server is running before rendering — see the
   main README's OmniVoice note. `auto-generate-video` checks
   `curl $OMNIVOICE_ENDPOINT/health` before every render and tells you if it's down.

## Use

Just talk to `hermes` normally:

```
hermes
> Tạo video từ bài báo https://example.com/some-article, dùng brand default
```

Hermes picks up `create-video-from-content` from the skill description and takes it from
there — fetches the content, writes `script.json` (template choices + Vietnamese TTS
number-spelling rules baked into the skill), and renders through `auto-generate-video`.

## Keeping in sync

These are plain copies, not a live symlink — if you edit the installed copies under
`~/.hermes/skills/` (e.g. your own Hermes agent tunes them from real usage, the way this
project's did), consider porting useful fixes back into `hermes-skills/` here so a fresh
clone starts from the improved version.

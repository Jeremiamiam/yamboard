# GET BRANDON

> A brand strategy workflow tool for Claude Code — inspired by [Get Shit Done](https://github.com/...)

**GET BRANDON** turns client briefs into structured brand strategy documents through an AI-assisted co-creation process. It's built on top of Claude Code and works entirely through slash commands.

---

## What it does

You drop a client's raw materials (briefs, emails, call transcriptions) into a folder. GET BRANDON reads everything, proposes strategic angles, challenges generic positioning, and helps you build:

- **Contre-brief** — strategic decisions locked in JSON
- **Brand Platform** — 10-page platform ready to present
- **Campaign** — big idea, copy, messages by persona
- **Site** — architecture + audacious copywriting
- **Wiki** — human-readable HTML deliverable with TL;DR for every section

---

## Commands

```
/gbd:start <client>      Start a project — read dossier, co-build brief
/gbd:platform <client>   Generate 10-page brand platform
/gbd:campaign <client>   Generate campaign concept + billboard copy
/gbd:site <client>       Generate site architecture + copywriting
/gbd:wiki <client>       Regenerate HTML wiki from all available JSONs
```

---

## Install

```bash
# 1. Clone the repo
git clone https://github.com/[your-username]/get-brandon.git

# 2. Run install
bash install.sh
```

---

## How it works

Every command is a markdown file that Claude Code reads and executes as a workflow. The intelligence is in the prompts — not in the code. `gbd-tools.cjs` (553 lines) handles file management. Everything else is strategy.

```
get-brandon/
  workflows/    ← the brains (markdown)
  commands/     ← Claude Code slash commands
  bin/          ← gbd-tools.cjs utility script
  references/   ← brand methodology docs
```

---

## Philosophy

Brand strategy has no right answer — only defensible ones. Two agencies reading the same brief will propose different platforms, and both can be right. GET BRANDON doesn't decide for you. It challenges generic directions, proposes 2-3 contrasted angles, and helps you find the position that's both true and impossible for competitors to claim.

Built by a creative director, for creative directors.

---

*GET BRANDON is a standalone tool. It does not require Get Shit Done.*

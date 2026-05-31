# AGENTS.md

## Project Overview
- Purpose: Battle Soccer is a small React/Vite browser-game fixture for testing AI SDLC workflows.
- Primary users: SDLC pilot agents and humans reviewing workflow behavior.
- Current phase: fixture app for implementation, review, verification, rendered-review, and Git-handoff cycles.

## Repository Layout
- Source: `src/`
- UI components: `src/components/`
- Game logic and tests: `src/game/`
- Build output: `dist/` (generated, ignored)
- Local AI scratch: `.ai-local/` (ignored)

## Commands
```bash
npm run dev
npm run test
npm run build
```

## Verification Guidance
- Narrow check for small logic edits: `npm run test`
- Broader check before completion: `npm run test`, `npm run build`, and `git diff --check`
- Rendered UI/app review path: run `npm run dev`, open the Vite localhost URL, and inspect the changed user workflow.
- Committed diff hygiene: use `git show --check --stat --oneline HEAD`.
- Protected evidence surfaces: tests, verification commands, generated baselines, and build config. Change them only when the task legitimately changes behavior or tooling, and explain why.

## AI SDLC Workflow
- Keep fixture tasks bounded to Battle Soccer unless explicitly instructed otherwise.
- Do not inspect or edit `.agents` from a fixture-worker role.
- Do not use Battle Soccer feature work to choose product direction for the SDLC pilot.
- Keep `.ai-local/` prompt packets, run logs, and scratch notes out of commits.
- For UI or user-facing workflow changes, rendered browser review is required when available.
- If a required verification tool is unavailable, report an evidence cap instead of claiming the check passed.

## Branch, Commit, and PR Guidance
- Main branch: `main`
- Commit only scoped, intentional fixture changes.
- Before public push, verify author/committer identity with `git log --format=fuller -1`.
- Do not stage `.ai-local/`, generated `dist/`, dependencies, or unrelated files.

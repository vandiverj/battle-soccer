# Battle Soccer

Battle Soccer is a small React/Vite browser-game fixture used for AI SDLC workflow testing.

The game has two boards:

- the player board, where the player's hidden soccer formations are shown and computer shots land,
- the opponent board, where the player shoots to find hidden fictional clubs.

The fixture is intentionally lightweight. It is useful for testing implementation planning, unit tests, rendered browser review, evidence packets, review-only passes, and final Git handoff behavior.

## Commands

```bash
npm run dev
npm run test
npm run build
```

Use `npm run dev` for local rendered review. The app normally runs at a Vite localhost URL such as `http://127.0.0.1:5173/`.

## Project Layout

```text
src/
  components/       React UI components for the boards, status, and target list
  game/             Game state, placement, targets, types, and unit tests
```

## Verification

For code changes, run:

```bash
npm run test
npm run build
git diff --check
```

For UI or user-facing behavior, also inspect the rendered app in a browser and record what was checked. If browser review is unavailable, mark the rendered experience as capped rather than claiming it passed.

## Local Notes

`.ai-local/` is local scratch space for prompt packets, run logs, handoff notes, and pilot evidence. It is ignored and should not be committed.

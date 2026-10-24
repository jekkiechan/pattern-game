# Pattern Arcade — agent instructions

## Scope and reading order

This is the canonical entry point for shared project memory and instructions.
Read this file first, then the relevant scoped guide before changing that area.
Scoped guides add local detail; they do not replace these shared principles.

| Work area | Read before editing |
| --- | --- |
| Beybattle mechanics, UI, rendering or Trainer Journey | [src/beybattle/AGENTS.md](src/beybattle/AGENTS.md) |
| Skybound stages, physics or controls | [js/climber/AGENTS.md](js/climber/AGENTS.md) |
| Tests, balance, browser checks or CI | [tests/AGENTS.md](tests/AGENTS.md) |
| Shared trainer accounts, arcade entry or game saves | [src/shared/AGENTS.md](src/shared/AGENTS.md) |

Read these links explicitly when starting at the repository root; do not assume
your tool automatically loads every nested guide. For shared HTML, CSS or assets,
also read the guide for each game affected. [README.md](README.md) documents the
current player experience, controls and detailed validation results.

## Quick start

- Serve the repository: `python -m http.server 8000`.
- Install build tools: `npm ci` (Node 20+; CI uses Node 22).
- Build Beybattle: `npm run build`.
- Run the core checks: `npm test`.
- Browser setup and change-specific checks: [tests/AGENTS.md](tests/AGENTS.md).
- No build or install is needed to play the committed site. GitHub Pages serves
  the repository root of `main`; keep direct links and relative asset paths working.
- Entry points: `index.html` (arcade), `beybattle.html`,
  `beyblade-climber.html` (Skybound), `how-to-play.html` (field guide).

## Product principles

- Build for ages 9–12. Use clear choices, short prompts, visible selection states
  and a quick path into play. Teach through visual demonstrations and guided
  practice; keep detailed rules as optional reference.
- Make skill understandable: show what an action does, when it is ready, what
  hit or blocked, and why a round ended. Keep tutorials, descriptions, keyboard
  hints and touch controls aligned with the mechanics.
- Preserve the coherent sports-league identity, detailed blades and shared
  ink/ivory/brass typography system. Give blades, rivals, worlds and specials
  distinct identities within that direction.
- Complete the player flow: entry, selection, learning, play, results, retry/replay
  and saved progress. Story work needs meaningful callbacks and a complete ending.
- Reward timing, positioning and tactical choices. Rarity and names must not
  secretly multiply stats; difficulty changes AI decisions/reaction time, not
  hidden health or damage. Visual polish must not silently change combat rules.

## Experience and technical boundaries

- Support phone portrait, phone landscape and desktop. Keep touch controls
  reachable and the arena, dialogue and warnings unobscured.
- Effects must communicate actual events, including blocked and finishing hits.
  Keep simultaneous effects readable and clear temporary effects between rounds.
- Respect pause, focus loss, reduced motion and performance settings. Freeze
  gameplay effects with simulation; provide static feedback for reduced motion.
- Preserve fixed-step simulation and interpolated rendering. Bound caches, pools
  and pixel density; reuse and cull artwork/geometry to keep frame work bounded.
- Keep Canvas fallback playable. Self-host runtime assets, fonts and dependencies;
  retain licenses and attribution. Do not introduce runtime CDN dependencies.
- Preserve earned unlocks, best results and achievements on losses/replays.
  Migrate existing saves when necessary. Blocked storage must leave play working
  for the visit with a clear persistence notice.
- In-game destructive resets require explicit confirmation and affect only the
  intended save. Keep mode saves and settings isolated as designed.
- Edit Beybattle source, then rebuild and commit `assets/beybattle.js` with it.
  Shared account source also rebuilds `assets/accounts.js`; commit both bundles.
  Never hand-edit that generated bundle. Update affected asset cache versions
  so returning players receive fixes. Shared typography is `css/premium.css`;
  self-hosted font licenses are in `assets/fonts/`.

## Working and delivery agreements

- Inspect the affected code and guides first; keep changes focused and follow
  existing module boundaries. Fix root causes and verify the actual player path.
- Use the change-specific checks in [tests/AGENTS.md](tests/AGENTS.md). Gameplay
  and rendering need browser verification as well as simulation checks.
- Update player-facing explanations and documentation when behavior changes.
  Treat code on `main` as shipped; an open PR is not evidence of a released feature.
- Use the existing CI-gated PR workflow for code changes. Preserve merge-policy,
  current-head checks, branch rules and the explicit Pages rebuild after merging.
  Failed/skipped jobs and stale-head protection must not be bypassed. A draft PR
  prevents automatic merging.
- Report the concrete result, checks run and remaining limitations. Desktop
  emulation and automated balance do not establish phone performance or child usability.

## Maintaining project memory

- Store durable decisions, repeated corrections and non-obvious pitfalls in the
  nearest applicable `AGENTS.md`; keep shared rules here. Update an existing rule
  instead of appending a second version. Keep each guide short and scannable.
- Keep transient plans and run logs in issues/PRs. Keep detailed player/reference
  documentation in `README.md`; link to it instead of copying whole sections.
- Remove obsolete instructions as behavior changes. Preserve the reason for a
  surprising constraint, preferably beside the rule it explains.
- Use plain Markdown links and directory-scoped guides for portability. Do not
  recreate a parallel `CLAUDE.md` or tool-specific copy of this memory.
- Structure references: [Codex project instructions](https://developers.openai.com/codex/guides/agents-md/)
  and [Claude Code memory](https://code.claude.com/docs/en/memory).
  Claude Code direct discovery requires v2.1.277+ and enabled AGENTS.md support;
  check loaded instructions when configuring a client.

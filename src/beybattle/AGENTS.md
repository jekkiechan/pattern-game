# Beybattle and Trainer Journey

Applies to `src/beybattle/`. Read [the root guide](../../AGENTS.md) first.
Also read this guide for Beybattle HTML, CSS, assets or integration changes.

## Architecture

| Module | Responsibility |
| --- | --- |
| `engine.js` | Deterministic simulation; no DOM or Three.js dependency |
| `roster.js` | Blade roles, visual motifs, normalized specials and arena rules |
| `app.js` | Screens, input, persistence and battle integration |
| `../shared/accounts.js` | Arcade-wide trainer UI, isolated saves, cloud queue and conflict resolution |
| `progression.js` | League unlocks, skill goals and saved best stars |
| `models.js`, `renderer.js` | Detailed blade models; shared preview/battle rendering |
| `fallback.js` | Playable Canvas 2D rendering |
| `audio.js` | Synthesized sounds |
| `special-effects.js` | Shared projected combat effects for WebGL and Canvas |
| `journey.js` | Authored story data and pure validated save transitions |
| `journey-ui.js` | Starter selection, map, dialogue and journal |

The responsive interface lives in `css/league.css`; story styling also uses
`css/journey.css`. The build entry is `app.js`; generated output is
`assets/beybattle.js`. Run `npm run build` and commit the output after source edits.

## Mechanics and progression

- Preserve all 33 playable blades and historical collection tiers. The nine-tier
  League Run progresses through rivals, stadiums and tactics, with optional skill
  stars. Practice, first-to-two Duel and three-duel Championship remain available.
- Keep special descriptions in sync with normalized strengths and actual input.
  Specials should have distinct utility and readable counterplay.
- Difficulty changes AI choices/reaction time. Collection rarity is independent
  of combat power; do not add hidden health, damage or tier multipliers.
- Preserve the 120 Hz simulation and exported `STEP`. Balance comparisons use
  seeded, mirrored pairings and identical bot policies with the existing 40–60%
  win-rate gate. See [test guidance](../../tests/AGENTS.md) before tuning.
- Preserve trophy/settings migrations, best stars and earned league unlocks.
- Route Beybattle and journey persistence through the account storage interface.
  Guest keys must never become another trainer's defaults. Cloud writes carry
  the expected trainer ID and revision; preserve both checks. Account switching
  reloads the game. Server auth and database setup are documented in README.md.
- Await the shared `patternAccountsReady` instance; do not create a second account
  client inside the Beybattle bundle. The same trainer also owns Skybound progress.

## Trainer Journey — The Wind Road

- Keep the six authored chapters, three starter choices, remembered dialogue,
  regional battles, journal and complete ending coherent.
- The chosen starter remains the trainer's companion. Losses, retries and replays
  preserve earned seals. Confirmed restart resets only the journey.
- Journey autosave is independent of league/settings and Skybound progress.
  Validate save transitions; blocked storage still permits the current visit.
- Portraits track the current speaker, including reply-speaker changes. Use
  self-hosted lightweight artwork without adding live 3D rendering cost.

## Rendering and validation

- Reuse blade models for previews and battle, with bounded live caches, pooled
  effects and capped pixel density. Do not build the whole roster each browse.
- Keep WebGL and Canvas behavior usable; effects reflect real combat events and
  respect pause, reduced motion, performance mode and round cleanup.
- Follow [tests/AGENTS.md](../../tests/AGENTS.md): build, core checks, affected
  tactics/balance checks and Beybattle browser coverage. Special-effect changes
  also need `python tests/special_effects_check.py`. Story changes also need
  `node tests/journey.mjs` and `python tests/journey_check.py`.

# Project guide

Read README.md for commands, controls, architecture and validation.

The product target is ages 9–12. Prioritize clear choices, readable battle feedback and usable mobile controls. The user's current direction is a coherent sports-league theme, detailed blades, fair balance, and smooth play. Historical blade tiers are restored. The nine-tier League Run provides progression through changing rivals, arenas and tactics; blade rarity does not silently multiply stats.

Beybattle source is in `src/beybattle/`; run `npm run build` after changes. Do not hand-edit the generated `assets/beybattle.js`. Keep simulation in `engine.js` independent of Three.js and DOM. All balance tests must use the exported `STEP`, identical bot policies and mirrored pairings. New mechanics need readable in-game descriptions and usable touch controls. Runtime assets must remain self-hosted.

The existing modes are League Run (nine saved tiers), Practice, Duel (first to two), and Championship (three duels). Do not hide advantages in character names or difficulty: difficulty changes AI choices/reaction time, not health or damage. Keep special descriptions in sync with normalized strengths.

Climber remains classic JavaScript under `js/climber/`. It has ten authored stages, three flight styles, burst charge, checkpoints, optional star/clean-run medals and saved tiers. Preserve fixed-step timing and touch controls. Its browser gameplay checks are in tests/climber_check.py. Site entry is `index.html`; field guide is `how-to-play.html`. GitHub Pages publishes the repository root; built assets must be committed.

Trainer Journey (The Wind Road) is an additional six-chapter mode. Keep its story data and pure save transitions in `journey.js`, rendering in `journey-ui.js`, and battle integration in `app.js`. Its browser save is independent of league settings. Replays/losses must preserve seals; dialogue choices carry forward; the starter remains the trainer’s companion. Run `node tests/journey.mjs` and `python tests/journey_check.py` for story changes. Shared typography lives in `css/premium.css`; keep fonts self-hosted with their licenses.

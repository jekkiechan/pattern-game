# Project guide

Read README.md for commands, controls, architecture and validation.

The product target is ages 9–12. Prioritize clear choices, readable battle feedback and usable mobile controls. The user's current direction is a coherent sports-league theme, detailed blades, fair balance, and smooth play. Old rarity-based power tiers are intentionally removed.

Beybattle source is in `src/beybattle/`; run `npm run build` after changes. Do not hand-edit the generated `assets/beybattle.js`. Keep simulation in `engine.js` independent of Three.js and DOM. All balance tests must use the exported `STEP`, identical bot policies and mirrored pairings. New mechanics need readable in-game descriptions and usable touch controls. Runtime assets must remain self-hosted.

The three modes are Practice, Duel (first to two), and Championship (three duels). Do not hide advantages in character names or difficulty: difficulty changes AI choices/reaction time, not health or damage. Keep special descriptions in sync with normalized strengths.

Climber remains classic JavaScript under `js/climber/`. It has ten stages; preserve fixed-step timing and touch controls. Site entry is `index.html`; field guide is `how-to-play.html`. GitHub Pages publishes the repository root; built assets must be committed.

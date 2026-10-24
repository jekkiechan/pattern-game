# Pattern Spin League

[Play Beybattle](https://jekkiechan.github.io/pattern-game/beybattle.html) · [Pattern Arcade](https://jekkiechan.github.io/pattern-game/) · [Beyblade Climber](https://jekkiechan.github.io/pattern-game/beyblade-climber.html)

Beybattle is a 3D spinning-top game for ages 9–12. The new League Run restores nine tiers, from Novice to God, with named rivals, changing stadiums and increasingly tactical AI. Win a first-to-two duel to unlock the next tier; earn two optional skill stars and replay without losing your best result. Original blade tiers are shown in the collection and can be filtered. All 33 blades remain playable, and rarity does not secretly multiply stats. Quick Duel, three-duel Championship and guided Practice remain available.

Beyblade Climber is now **Skybound**: ten authored stages across five sky worlds, three flight styles, an earned midair burst and checkpoint rescues. Reach a portal to unlock the next stage. Optional medals reward collecting every star and finishing without a rescue. Medals and stage progress save on this device; clearing all ten stages earns God tier. Missed jumps keep the stars already collected in the current attempt.

## Run and build

Serve this directory with `python -m http.server 8000`. The committed bundle runs without installing packages or contacting a CDN. To change Beybattle source, run `npm ci` and `npm run build` (Node 20+). Commit the rebuilt `assets/beybattle.js` alongside source changes. GitHub Pages publishes the repository root of `main`.

## Controls and mobile

- Launch: press Launch in the blue zone / Space for 14 starting energy, or skip timing for a standard launch.
- Dash: button / Q. Guard: button / E. A guard timed within 0.35 seconds of an incoming rush or special blocks 90% and opens a 1.8-second counter-dash window; a landed counter adds 3 damage. Special: one tap / Space when energy is full.
- Blades move automatically. Optionally hold the stadium or use arrows / WASD to steer.
- Pause: button / P / Escape. Losing focus or switching tabs pauses the battle.
- Portrait and landscape layouts keep controls outside the central action. Settings include sound, reduced motion and performance mode. Settings and trophies save on this device; previous trophies migrate.
- Climber: arrows / A and D, arena touch steering, or left/right touch buttons. Bounce automatically; Space / Burst adds an air jump at full charge. New centered landings add 35 charge; stars add 45. Hold Down / S / Drop to pass through platforms. Pause with P / Escape or the button. Sound and reduced motion are available. The map offers unlocked stage replays and Comet, Nimbus or Volt flight styles.

## Architecture and rendering

`src/beybattle/engine.js` is a deterministic simulation independent of the UI and renderer. `roster.js` contains blade roles, visual motifs, normalized special strengths and arena rules. `app.js` owns screens, input and persistence; `progression.js` owns tier unlocks, skill goals and saved best stars. `models.js` builds layered metal/resin blades with cutouts, gear teeth, bolts and crest textures. `renderer.js` renders the same Three.js models in previews and battle; `fallback.js` provides playable Canvas 2D compatibility. `audio.js` synthesizes short sounds. `css/league.css` owns the responsive interface.

Simulation runs at 120 Hz with interpolated rendering. Rendering caps device pixel ratio at 1.7 (1 in performance mode), limits live model cache to eight, merges repeated geometry, uses instanced stadium details, and pools 128 sparks / ten rings. The collection uses compact pre-rendered images of the actual models, avoiding 33 model builds while browsing. Menus render at half display rate. Sustained slow frames enable performance mode. Launch ripples, dash trails, impact sparks, special pulses and finish celebrations communicate the action. Reduced motion disables optional movement effects. No downloaded model or texture packages are needed. The Three.js bundle is self-hosted; its MIT notice is in `THIRD_PARTY_NOTICES.txt`.

Climber uses classic scripts under `js/climber/`, with fixed 60 Hz timing, interpolated rendering, cached blade art, offscreen culling and capped pixel density. Stage routes are authored, moving-platform travel is bounded, and crumbled platforms return after three seconds. Wind is telegraphed before it affects later stages. Saved progress is stored as earned medal bits, so replays cannot remove achievements. If browser storage is blocked, play continues for the current visit.

## Validation

`npm test` runs engine regressions and a mirrored round robin. `node tests/balance.mjs --seeds=32 --seed=98765 --gate` reproduces the standard-arena holdout. Other stadiums use `--arena=rail|glacier|volcano|cyber|void --seeds=32 --seed=145 --gate`. Detailed results: `tests/balance-report.json`.

The tier update passed 118,272 mirrored matches at the actual 120 Hz game step: all six arenas plus an independent standard-arena holdout, using 32 seeds per blade pair. Individual blade win rates across all reports ranged from 40.2–57.5%, within the 40–60% gate. Standard arena: 40.8–56.3%; holdout: 40.6–57.5%. `tests/tactics.mjs` also verifies that timed defensive play outperforms mashing in a fixed 80-seed God-tier matchup. These are automated comparisons, not a substitute for playtesting with children.

With Python Playwright and Chromium installed, run `python tests/browser_check.py` and `python tests/climber_check.py` against the local server (`GAME_URL` and `QA_OUTPUT` are optional). Beybattle checks roster/tier filtering, keyboard/touch input, pause, first-to-two progression, rematches, championship, guided practice, saved league unlocks, model-cache bounds, portrait/landscape layout and Canvas fallback. Climber checks all 30 stage/flight-style combinations using actual steering inputs and unchanged physics, 30/60/120 Hz display timing, star-preserving rescues, saved medals/tiers, keyboard/touch burst, mobile layouts and blocked storage. Physical-phone performance and child playtesting have not been measured.

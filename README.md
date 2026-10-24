# Pattern Spin League

[Play Beybattle](https://jekkiechan.github.io/pattern-game/beybattle.html) · [Pattern Arcade](https://jekkiechan.github.io/pattern-game/) · [Beyblade Climber](https://jekkiechan.github.io/pattern-game/beyblade-climber.html)

Beybattle is a 3D spinning-top game for ages 9–12. Pick one of 33 blades, time your launch, and win two rounds against one rival. Practice teaches Dash, Guard, and Special. Championship connects three duels with fresh spin between rounds. Six stadiums offer different movement and positioning opportunities. All blades are unlocked; legendary names confer no hidden stat advantage.

## Run and build

Serve this directory with `python -m http.server 8000`. The committed bundle runs without installing packages or contacting a CDN. To change Beybattle source, run `npm ci` and `npm run build` (Node 20+). Commit the rebuilt `assets/beybattle.js` alongside source changes. GitHub Pages publishes the repository root of `main`.

## Controls and mobile

- Launch: press Launch in the blue zone, Space, or skip timing for a standard launch.
- Dash: button / Q. Guard: button / E. Special: one tap / Space when energy is full.
- Blades move automatically. Optionally hold the stadium or use arrows / WASD to steer.
- Pause: button / P / Escape. Losing focus or switching tabs pauses the battle.
- Portrait and landscape layouts keep controls outside the central action. Settings include sound, reduced motion and performance mode. Settings and trophies save on this device; previous trophies migrate.
- Climber: arrows / A and D, or left/right touch buttons; jump automatically. Space or the action button starts/retries. Ten stages retained.

## Architecture and rendering

`src/beybattle/engine.js` is a deterministic simulation independent of the UI and renderer. `roster.js` contains blade roles, visual motifs, normalized special strengths and arena rules. `app.js` owns screens, input, progression and persistence. `models.js` builds layered metal/resin blades with cutouts, gear teeth, bolts and crest textures. `renderer.js` renders the same Three.js models in previews and battle; `fallback.js` provides playable Canvas 2D compatibility. `audio.js` synthesizes short sounds. `css/league.css` owns the responsive interface.

Simulation runs at 120 Hz with interpolated rendering. Rendering caps device pixel ratio at 1.7 (1 in performance mode), limits live model cache to eight, merges repeated geometry, uses instanced stadium details, and pools 128 sparks / ten rings. The collection uses compact pre-rendered images of the actual models, avoiding 33 model builds while browsing. Menus render at half display rate. Sustained slow frames enable performance mode. Launch ripples, dash trails, impact sparks, special pulses and finish celebrations communicate the action. Reduced motion disables optional movement effects. No downloaded model or texture packages are needed. The Three.js bundle is self-hosted; its MIT notice is in `THIRD_PARTY_NOTICES.txt`.

Climber uses classic scripts under `js/climber/`, with fixed-step timing, cached sprites, offscreen culling and capped pixel density.

## Validation

`npm test` runs engine regressions and a mirrored round robin. `node tests/balance.mjs --seeds=32 --seed=98765 --gate` reproduces the standard-arena holdout. Other stadiums use `--arena=rail|glacier|volcano|cyber|void --seeds=32 --seed=145 --gate`. Detailed results: `tests/balance-report.json`.

The final 118,272-match simulation uses the actual 120 Hz game step. Standard-arena blade win rates: 44.2–57.9%; four role averages: 47.9–54.9%. Across all six stadiums, individual arena/blade rates range from 43.1% to 57.9%, within the 40–60% regression gate. Draws count as half a win. The fresh-seed standard holdout ranges from 43.5–57.3%. These are identical-policy bot comparisons, not a guarantee of every matchup or a replacement for playtesting with children.

With Python Playwright and Chromium installed, run `python tests/browser_check.py` against the local server (`GAME_URL` and `QA_OUTPUT` are optional). It checks roster/search, keyboard/touch controls, pause, first-to-two progression, rematches, championship trophies, practice, model-cache bounds, portrait/landscape layout, WebGL fallback, and Climber timing/stages. Physical-phone frame rates have not been measured.

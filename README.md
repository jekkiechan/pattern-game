# Pattern Arcade

Two dependency-free browser games for ages 9–12: [Beybattle](https://jekkiechan.github.io/pattern-game/beybattle.html) and [Beyblade Climber](https://jekkiechan.github.io/pattern-game/beyblade-climber.html).

Run `python -m http.server 8000` from this folder, then open `http://localhost:8000`. GitHub Pages publishes the root of `main`; no build or package installation is required. Keep script order in the HTML: these are classic scripts with shared globals.

## Arena edition

- Redesigned arcade home, battle lobby, roster, arena selection, HUD and mobile controls. Artwork comes from the games' procedural renderers.
- All 33 characters retained. Six shared-shape characters now have distinct silhouettes, colors and engraved emblems. Kerbecs/Nemesis renderer names now match their designs.
- Six arenas, including Neon Rail: dash above 72% of the arena radius to gain 30% dash speed and 8 stamina, with a four-second rail cooldown.
- Play Now starts a matched battle. Custom Battle offers automatic opponents within one tier where possible, with unrestricted manual selection. Existing tournament progress storage is preserved.
- Launch: drag/release or Space. Dash: tap the arena, D, or Dash. Special: hold Space or the special button for two seconds, then release. Pause: P / Escape / Pause. Switching tabs or losing focus pauses play.
- Cached blade and stadium textures, capped device pixel ratio, bounded particles, 10 Hz HUD updates, fixed-step simulation with interpolated drawing, and static menu rendering. Inward launches no longer bounce away from the arena; separating overlaps no longer repeatedly inflict damage.
- Climber retains all ten stages and gains fixed-step timing, interpolated movement, sprite caching, offscreen culling, high-density rendering and pause. Stars follow moving platforms; stage transitions use simulation time so pause also pauses transitions.

## Validation

With Python Playwright and Chromium installed, run a local server and `python tests/browser_check.py`. `GAME_URL` and `QA_OUTPUT` optionally select the server and screenshot/report folder. Test dependencies are development-only.

The browser regression covers all 33 specials over 11,880 simulation steps, six arenas, launch/collision fixes, rail cooldown, tournament advancement/victory/elimination, restart, keyboard/touch controls, mobile resizing, pause, and Climber timing at 30/60/120 Hz. Screenshots and reports are written outside the served project by default.

A same-scene desktop headless Chromium microbenchmark measured about 0.58 ms/render before and 0.14–0.18 ms/render (median across repeated batches) after texture caching. This measures JavaScript rendering submission time, not total GPU cost. Physical-device frame rates have not been measured.

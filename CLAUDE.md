# pattern-game

A Beyblade-themed browser game suite: two standalone games built with vanilla HTML5, CSS3, and JavaScript. No build tools, no dependencies — open any `.html` file in a browser to run.

## Project Structure

```
index.html              # Landing page / game selector
beybattle.html          # 1v3 battle arena game (thin shell — loads js/beybattle/*)
beyblade-climber.html   # Vertical platformer (thin shell — loads js/climber/*)

css/
  beybattle.css         # All styles for the battle game
  climber.css           # All styles for the platformer

js/
  beybattle/
    audio.js            # Procedural Web Audio API sounds
    config.js           # Canvas setup, physics constants, CONFIGS (characters), ARENAS
    entities.js         # Particle class, Beyblade class
    state.js            # Global G object, background stars, resize()
    spawn.js            # startRound(), buildHUD(), refreshHUD(), particle helpers
    physics.js          # wallCheck(), bladeCollide()
    specials.js         # activateSpecial() + helpers (nearestAlive, endSpecial, …)
    ai.js               # tickAI()
    update.js           # update() — per-frame game simulation
    render.js           # All draw*() functions + render() + hexAlpha()
    game.js             # Game loop, input handlers, selection UI, init

  climber/
    config.js           # Canvas setup, GL pixel-font, STAGES, PLAT_W
    state.js            # State variables, bgStars, keyboard/touch input handlers
    engine.js           # buildStage(), sprite drawers (blade/platform/star),
                        #   particle spawners, startStage(), update()
    render.js           # Scene draw functions (drawBg, drawWorld, drawHUD,
                        #   title/clear/dead/victory screens), main loop
```

Scripts are plain `<script src="...">` tags — **no bundler, no ES modules**. All declarations are global; load order in the HTML matters.

## Running the Games

Open any `.html` file directly in a browser. No server or build step required.

## Key Architecture

Both games share the same pattern:

```
requestAnimationFrame(loop) → update(dt) → render() → loop()
```

State is controlled by a `state` variable (e.g. `'title'`, `'playing'`, `'battle'`, `'result'`). Configuration data drives content — adding a character or stage is a matter of adding an entry to the relevant array.

## Game Philosophy — Beybattle

These principles should guide every design decision:

- **Hype first, strategy second.** Every clash should feel cinematic — big hits, dramatic reversals, screen shake. Strategy (type matchups, special timing) should add depth without removing the spectacle.
- **Tiers are real.** MYTHICAL reliably beats NOVICE. A skilled player can upset *one tier down* with good play; beating two tiers requires a miracle. Don't over-correct — the tier list should mean something.
- **Specials are game-changers.** A well-timed special should be able to flip a losing fight. Timing the charge and the release is the highest-skill expression in the game.
- **Respect the source.** Characters come from the Beyblade anime/toy line. Visuals, move names, and personalities should match or be inspired by the real thing — Impact Drake looks like a Drake-type blade, Storm Pegasis fights aggressively.

## Beybattle Quick Reference

| Concept | File | Key symbol |
|---|---|---|
| Physics constants (friction, restitution, edge drain) | `js/beybattle/config.js` | `FRICTION`, `RESTITUTION`, `EDGE_DRAIN` … |
| All 22 character definitions | `js/beybattle/config.js` | `CONFIGS` array |
| Arena definitions | `js/beybattle/config.js` | `ARENAS` array |
| Special move logic | `js/beybattle/specials.js` | `activateSpecial()` — switch on `b.id` |
| AI decision-making | `js/beybattle/ai.js` | `tickAI()` |
| Collision / physics | `js/beybattle/physics.js` | `bladeCollide()`, `wallCheck()` |
| Per-character draw functions | `js/beybattle/render.js` | `draw*Blade()` / `draw*Hub()` |
| Global game state | `js/beybattle/state.js` | Object `G` |
| Audio | `js/beybattle/audio.js` | `playHit()`, `playLaunch()`, `playSpinOut()`, `playWhoosh()` |

Character tiers (ascending): NOVICE → APPRENTICE → ADVANCED → ELITE → CHAMPION → LEGENDARY → MYTHICAL

Character types: ATTACK · DEFENSE · STAMINA · BALANCE · ??? (affects arena modifiers and AI behavior)

## Beyblade Climber Quick Reference

| Concept | File | Key symbol |
|---|---|---|
| All 10 stage configs | `js/climber/config.js` | `STAGES` array |
| Platform generation | `js/climber/engine.js` | `buildStage()` |
| Collision detection | `js/climber/engine.js` | Circle-rectangle block inside `update()` |
| Pixel-font renderer | `js/climber/config.js` | `GL` object + `pixText()` |
| Player physics constants | `js/climber/engine.js` | `moveForce`, `friction`, `gravity` near top |

Platform types: `normal` · `fragile` (breaks on first jump) · `moving` · `boost` (high bounce) · `finish`

## Adding Content

**New Beyblade character:** Add an entry to `CONFIGS` in `js/beybattle/config.js`, add a branch to `activateSpecial()` in `js/beybattle/specials.js`, and add `draw*Blade()` / `draw*Hub()` functions in `js/beybattle/render.js`.

**New Climber stage:** Add an entry to `STAGES` in `js/climber/config.js`. The generator uses `platCount`, `fragile`, `moving`, `boost`, `moveSpd`, and `spacing` to build the level procedurally.

## Graphics

All visuals are drawn with the Canvas 2D API — no image assets. Beyblades are rendered procedurally (gradients, arcs, custom paths). The pixel-font system (`GL`) in the Climber handles all UI text.

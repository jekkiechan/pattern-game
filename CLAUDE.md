# pattern-game

A Beyblade-themed browser game suite: two standalone games built with vanilla HTML5, CSS3, and JavaScript. No build tools, no dependencies — open any `.html` file in a browser to run.

## Project Structure

```
index.html            # Landing page / game selector
beybattle.html        # 1v3 battle arena game (~4 200 lines)
beyblade-climber.html # Vertical platformer (~810 lines)
```

All game code lives inside `<script>` and `<style>` tags within each HTML file.

## Running the Games

Open any `.html` file directly in a browser. No server or build step required.

## Key Architecture

Both games share the same pattern:

```
requestAnimationFrame(loop) → update(dt) → render() → loop()
```

State is controlled by a `state` variable (e.g. `'title'`, `'playing'`, `'battle'`, `'result'`). Configuration data drives content — adding a character or stage is a matter of adding an entry to the relevant array.

### beybattle.html

| Concept | Where to look |
|---|---|
| Physics constants (friction, restitution, edge drain) | Top of `<script>`, constants block |
| All 22 character definitions | `CONFIGS` array |
| Arena definitions | `ARENAS` array |
| Special move logic | `activateSpecial()` — large switch on `b.id` |
| AI decision-making | `tickAI()` |
| Collision / physics | `bladeCollide()` |
| Per-character draw functions | `draw*Blade()` / `draw*Hub()` functions |
| Global game state | Object `G` (300+ properties) |
| Audio (procedural, Web Audio API) | `playHit()`, `playLaunch()`, `playSpinOut()`, `playWhoosh()` |

Character tiers (ascending): NOVICE → APPRENTICE → ADVANCED → ELITE → CHAMPION → LEGENDARY → MYTHICAL

Character types: ATTACK · DEFENSE · STAMINA · BALANCE · ??? (affects arena modifiers and AI behavior)

### beyblade-climber.html

| Concept | Where to look |
|---|---|
| All 10 stage configs | `STAGES` array |
| Platform generation | `buildStage()` |
| Collision detection | Circle-rectangle, ~10 lines after `buildStage` |
| Pixel-font renderer | `GL` object + `pixText()` |
| Player physics constants | `moveForce`, `friction`, `gravity` near top of script |

Platform types: `normal` · `fragile` (breaks on first jump) · `moving` · `boost` (high bounce) · `finish`

## Adding Content

**New Beyblade character:** Add an entry to `CONFIGS` in `beybattle.html`, then add a branch to `activateSpecial()` for its special move and a `draw*Blade()` / `draw*Hub()` function for its visuals.

**New Climber stage:** Add an entry to `STAGES` in `beyblade-climber.html`. The generator uses `platCount`, `fragile`, `moving`, `boost`, `moveSpd`, and `spacing` to build the level procedurally.

## Graphics

All visuals are drawn with the Canvas 2D API — no image assets. Beyblades are rendered procedurally (gradients, arcs, custom paths). The pixel-font system (`GL`) in the Climber handles all UI text.

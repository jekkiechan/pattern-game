# Skybound — Beyblade Climber

Applies to `js/climber/`. Read [the root guide](../../AGENTS.md) first.
Also read this guide for `beyblade-climber.html`, `css/climber.css` or stage assets.

## Architecture and game rules

- Keep classic JavaScript under `js/climber/`: configuration in `config.js`,
  state/input/progress in `state.js`, simulation in `engine.js`, drawing in
  `render.js`, and cached blade artwork in `art.js`.
- Preserve fixed 60 Hz simulation with interpolated rendering, cached art,
  offscreen culling and capped pixel density.
- Preserve ten authored stages across five worlds, three flight styles (Comet,
  Nimbus and Volt), earned midair burst, checkpoints and optional star/clean-run
  medals. Progression reaches God tier after all ten stages.
- Stage portals unlock the next stage; unlocked stages remain replayable.
  Rescues preserve stars already collected in the current attempt.
- Keep earned medal bits and stage progress monotonic on replay. Storage failure
  permits play for the visit; respect sound, pause and reduced-motion settings.
- Keep touch steering, left/right buttons, keyboard steering, burst and drop
  usable. Telegraph wind before it affects play; bound moving-platform travel
  and preserve returning crumbled platforms.

## Regression lesson: render every route

Stages 5–10 once defined more platforms than horizontal positions. Missing
coordinates produced NaN portal geometry; Canvas gradients threw and stopped the
animation loop even though physics-only tests passed.

- Validate finite platform, star and portal geometry before relying on a route.
- Render gameplay throughout all affected stage/style combinations using actual
  steering and unchanged physics. Do not skip drawing, inject successful routes
  or change physics merely to make a check pass.
- Run `python tests/climber_check.py` after stage, physics, input or rendering
  changes. It covers all 30 stage/style combinations, display timing, checkpoints,
  saved medals/tiers, touch burst, responsive layouts and blocked storage.
- See [tests/AGENTS.md](../../tests/AGENTS.md) for browser setup. Update affected
  classic-script cache versions when publishing a fix.

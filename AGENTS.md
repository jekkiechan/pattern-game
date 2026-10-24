# Agent guide

Read `README.md` for the current commands, controls, architecture and validation.
This guide captures the development principles reflected in the recent game work
and PRs. Apply them to both Beybattle (Pattern Spin League) and Skybound
(Beyblade Climber). Keep `CLAUDE.md` consistent when changing shared guidance.

## Build for the player

- Design for ages 9–12: clear choices, short prompts, visible selection states
  and a quick path into play. Teach actions with visual demonstrations and guided
  practice; keep detailed rules available as optional reference.
- Make skill understandable. Show what an action does, when it is available,
  what hit or blocked, and why a round ended. Keep descriptions, tutorials,
  keyboard hints and touch controls aligned with the actual mechanics.
- Give blades, rivals, worlds and special moves distinct identities within a
  coherent visual direction. Preserve the established sports-league theme and
  shared ink/ivory/brass typography system. New art should strengthen that identity.
- Finish the whole experience: entry, selection, learning, play, result,
  retry/replay and saved progress. Story work must have coherent choices,
  callbacks and an ending, rather than isolated screens.

## Fairness and earned progression

- Preserve the full playable roster and historical collection tiers. Rarity and
  dramatic names communicate identity; they must not secretly multiply stats.
- Difficulty changes AI decisions and reaction time, not hidden health or damage.
  Reward timing, positioning and tactical choices instead of button mashing.
- Keep specials distinct through useful mechanics and readable counterplay.
  Visual polish must not silently change damage, collision or combat timing.
- Validate balance with the exported simulation `STEP`, identical bot policies,
  seeded runs and mirrored pairings. Keep the existing 40–60% win-rate gate;
  do not weaken it to accommodate a favored character.
- Preserve earned unlocks, best stars, medals, trophies and wind seals on losses
  and replays. Keep journey saves separate from other modes and settings; retain
  the chosen starter and remembered dialogue choices. Destructive resets require
  an explicit in-game confirmation and affect only the intended save.
- Storage failures must leave the game playable for the visit and explain the
  persistence limitation. Preserve or migrate existing saves when formats change.

## Readable, smooth and accessible play

- Treat phone portrait, phone landscape and desktop as supported layouts.
  Keep controls reachable and the arena, dialogue and warnings unobscured.
  Verify actual touch input as well as keyboard input.
- Effects communicate real game events: telegraph danger, show activation and
  connect impact feedback to the actual outcome. Keep simultaneous effects and
  finishing hits readable; clear temporary effects between rounds.
- Respect pause, focus loss, reduced motion and performance settings. Pause
  gameplay effects with the simulation; provide useful static feedback when
  optional motion is disabled.
- Preserve fixed-step simulation with interpolated rendering. Bound particle
  pools, model caches and pixel density; reuse/cull artwork and geometry instead
  of adding unbounded work to a frame.
- Keep Canvas fallback playable and visually understandable. Prefer self-hosted,
  lightweight assets, including fonts and portraits, and retain their licenses.
  Do not add runtime CDN dependencies.

## Keep the code and published game aligned

- Beybattle source lives in `src/beybattle/`. Keep deterministic mechanics in
  `engine.js` independent of Three.js and the DOM; keep rendering, audio, input
  and persistence in their existing modules.
- Keep journey data and pure save transitions in `journey.js`, story rendering in
  `journey-ui.js`, and battle integration in `app.js`.
- Skybound uses classic scripts in `js/climber/`. Preserve its ten authored
  stages, three flight styles, checkpoints, earned burst and fixed-step timing.
- Change source, then run `npm run build`. Never hand-edit the generated
  `assets/beybattle.js`; commit the rebuilt bundle alongside source changes.
  Update affected asset cache versions so returning players receive fixes.
- GitHub Pages serves the repository root. Keep relative asset paths, direct
  game links and the committed build functional without a package install.
- Keep changes focused. Update player-facing explanations and project guidance
  when behavior changes; distinguish released features from work in open PRs.

## Verify what the player actually experiences

Choose checks that cover the change. For gameplay or rendering work, a passing
syntax check or simulation alone is insufficient.

- Setup/build: `npm ci`, then `npm run build`. Check that the committed bundle
  matches source. `npm test` runs engine, journey, merge-policy and balance checks.
- For tactics changes, also run `node tests/tactics.mjs`. For balance changes,
  use the holdout and affected-arena commands in `README.md` as well as the gate.
- Serve locally with `python -m http.server 8000`. Install browser dependencies
  with `python -m pip install -r tests/requirements.txt` and
  `python -m playwright install chromium`.
- Run the affected browser suites: `python tests/browser_check.py`,
  `python tests/climber_check.py` and/or `python tests/journey_check.py`.
  Follow the current CI configuration for any additional suites.
- Exercise real input, transitions, pause, retry and reload. Check narrow and
  landscape layouts, blocked storage and Canvas fallback where relevant.
  Review screenshots for visual changes; inspect console errors and failed assets.
- For stage changes, validate finite platform/star/portal geometry and render
  actual gameplay across all affected stage/style combinations. The stages 5–10
  freeze showed that physics-only checks can pass while a renderer throws and
  stops the game loop. Do not bypass rendering or alter physics to make a route pass.
- Add a regression for an observed failure that exercises its real failure path.
  Keep simulation tests for mechanics and browser tests for integration; forced
  story outcomes verify progression, not combat balance.
- Report what passed and any unverified parts. Automated balance and desktop
  browser emulation do not establish physical-phone performance or child usability.

## Delivery

Use the existing CI-gated PR workflow for code changes. Keep CI, merge-policy and
Pages rebuild safeguards intact; do not bypass failed/skipped checks or stale-head
protection. Document the concrete player-visible result, relevant validation and
remaining limitations. Keep a PR in draft when it must not auto-merge.

## Evidence behind these principles

The current `README.md` and `CLAUDE.md` establish the product and architecture.
Recent history reinforces the practices above:

- PR #15: render actual stage routes to catch the invalid-geometry freeze.
- PR #16: complete trainer progression, shared UI and CI-gated delivery.
- PR #17: expressive, self-hosted trainer art without extra live rendering cost.
- Open PR #18: distinct special effects tied to combat events, with unchanged balance.
- Open PR #19: visual teaching, short prompts and accessible playback controls.

The open PRs are design evidence, not a claim that those features have shipped.

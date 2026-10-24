# Validation and CI

Applies to `tests/`. Read [the root guide](../AGENTS.md) first.
Also read this guide when selecting validation or editing `.github/`.

## Commands and change coverage

Run commands from the repository root. Choose checks for the changed behavior;
follow the current workflow for additional suites as the project evolves.

| Change | Required relevant checks |
| --- | --- |
| Beybattle source | `npm run build`, `npm test`, `python tests/browser_check.py` |
| Special animations/effects | Beybattle source checks, plus `python tests/special_effects_check.py` |
| Combat tactics | Above, plus `node tests/tactics.mjs` |
| Balance/roster/arena rules | Above, plus holdout and affected-arena balance gates |
| Trainer Journey | `node tests/journey.mjs`, `python tests/journey_check.py`; rebuild if source changed |
| Skybound | `python tests/climber_check.py` |
| Shared HTML/CSS/assets | Browser suites for every affected game/mode; review screenshots |
| CI or merge policy | `node tests/auto-merge.mjs` and affected workflow checks |
| Instruction-only documentation | Check paths, commands, scope and consistency; gameplay tests are unnecessary |

`npm test` runs engine, journey, auto-merge policy and the default balance gate.
Install dependencies with `npm ci`. CI checks that rebuilding leaves
`assets/beybattle.js` unchanged relative to the committed bundle.

## Browser setup and acceptance

1. Install `python -m pip install -r tests/requirements.txt`.
2. Install `python -m playwright install chromium`.
3. Run `python -m http.server 8000` in another terminal.
4. Run the relevant Python suites from the table above.

Optional settings: `GAME_URL`, `QA_OUTPUT` and `CHROMIUM_PATH`. Browser checks use
the configured Chromium, system Chromium when available, or Playwright's download.

- Verify the committed game through actual keyboard/touch input, screens,
  transitions, pause/focus loss, retry and reload. Check console errors and failed
  resources as well as assertions.
- Check narrow portrait, landscape and desktop layouts. Review screenshots for
  visual work; verify reduced motion, performance mode, Canvas fallback and
  blocked storage wherever the change can affect them.
- Beybattle coverage includes roster/tier selection, rematches, Championship,
  Practice, league progression, controls and model-cache bounds.
- Special-effects coverage includes every move type in WebGL and Canvas, pause,
  expiry/cleanup, simultaneous specials, mobile layouts, reduced motion,
  performance mode and finishing hits.
- Journey coverage includes all six chapters and the ending, portraits/speakers,
  choices, losses/retries, locked routes, journal, reload and confirmed reset.
  Forced battle outcomes test story progression; they do not validate combat.
- Skybound coverage must render all 30 stage/style routes with actual steering,
  unchanged physics and finite geometry. Include 30/60/120 Hz display timing,
  star-preserving rescues, medals/tiers, touch burst and blocked storage.
- Reproduce observed bugs and add focused regressions through their real failure
  paths. Syntax and physics-only success cannot establish rendering correctness.

## Balance

- Use the engine's exported `STEP` (120 Hz), seeded runs, identical bot policies
  and mirrored pairings. Preserve the 40–60% per-blade gate.
- Standard-arena holdout:
  `node tests/balance.mjs --seeds=32 --seed=98765 --gate`.
- For each affected alternate arena, run
  `node tests/balance.mjs --arena=rail --seeds=32 --seed=145 --gate`,
  replacing `rail` with `glacier`, `volcano`, `cyber` or `void` as appropriate.
- `npm run test:balance` produces the default report. Reference results live in
  `tests/balance-report.json`; detailed historical results are in `README.md`.
- Do not weaken tests, alter bot parity or bypass rendering to produce a pass.
  Report unverified areas; these checks do not replace child playtesting or
  measurements on physical phones.

## CI and merge safeguards

- Keep reproducible-bundle, core gameplay, balance and browser jobs in CI.
  `CI passed` succeeds only when every required job succeeds.
- Auto-merge uses trusted code from `main`, rechecks all jobs for the current PR
  head, and requires eligible same-repository authors, a non-draft PR and a clean,
  mergeable state. Preserve branch rules, race checks and fork/stale-run rejection.
- Never execute PR-controlled merge code or download PR artifacts in the
  privileged merge workflow. Preserve the explicit Pages rebuild after a
  token-based merge; normal branch publication is not triggered by that merge.

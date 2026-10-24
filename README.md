# Pattern Spin League

[Play Beybattle](https://jekkiechan.github.io/pattern-game/beybattle.html) · [Pattern Arcade](https://jekkiechan.github.io/pattern-game/) · [Beyblade Climber](https://jekkiechan.github.io/pattern-game/beyblade-climber.html)

Beybattle is a 3D spinning-top game for ages 9–12. The new League Run restores nine tiers, from Novice to God, with named rivals, changing stadiums and increasingly tactical AI. Win a first-to-two duel to unlock the next tier; earn two optional skill stars and replay without losing your best result. Original blade tiers are shown in the collection and can be filtered. All 33 blades remain playable, and rarity does not secretly multiply stats. Quick Duel, three-duel Championship and guided Practice remain available.

Beyblade Climber is now **Skybound**: ten authored stages across five sky worlds, three flight styles, an earned midair burst and checkpoint rescues. Reach a portal to unlock the next stage. Optional medals reward collecting every star and finishing without a rescue. Medals and stage progress save on this device; clearing all ten stages earns God tier. Missed jumps keep the stars already collected in the current attempt.

## Trainer journey · The Wind Road

Choose **A trainer’s journey** on the Beybattle home screen. Name your trainer and choose Impact Drake (attack), Knight Shield (defense), or Wizard Arrow (stamina). Keep that companion across six authored chapters, from Hoshimi Village to the Sky Spire. Meet Sora, Ren and four regional guardians; make dialogue choices that are remembered in later conversations and your travel journal. Each first-to-two battle earns a wind seal and opens the next region. The sixth chapter has a complete ending, and cleared regions remain replayable.

The story cast has original, self-hosted 3D-style illustrated portraits: Sora, Ren, Mio, Aki, Yuki, Kaede and your trainer. The featured portrait follows the current speaker (including Ren’s reply in Ember Pass); narration introduces the regional rival. Portraits also appear beside dialogue, in region cards and in your trainer strip. The shared WebP atlas in `assets/trainers/` works with the Canvas fallback and adds no live 3D rendering cost.

Story progress and dialogue position autosave on this browser/device separately from League Run and Skybound. Losses and replays preserve earned seals. Starting over asks for confirmation and resets only the trainer journey. If storage is unavailable, a notice explains that progress lasts only for the visit. The journey uses the existing battle rules and balanced blade stats; opponents become more tactical along the route. This is a chapter/map adventure, with dialogue and arena battles rather than free-roaming exploration.

Both games and the arcade share self-hosted Noto Sans/Noto Serif typography, an ink/ivory/brass palette, visible selection states, and responsive menus. Font licenses are in `assets/fonts/`.

## Trainer accounts on Vercel

The arcade home page is the starting point for both games: choose **Create trainer**,
**Sign in**, or **Play as a guest for now**. Signup asks only for a trainer name
(used to sign in) and password (8–128 characters). No email is needed. Existing
accounts keep their usernames and display names. Each trainer keeps separate
Beybattle stars, wins, trophies and Wind Road progress, plus Skybound stages,
medals, flight style and settings. The active trainer appears in each game header;
the signed-in arcade shows progress in both games. Guest play remains available,
including on GitHub Pages.

After signup choose **Download my code** and ask a grown-up to keep the recovery
code safe: it can reset the password without email. Recovery codes are stored only as
hashes, work once, and are replaced after a reset. Password resets invalidate old
sessions. A signed-in trainer can generate a replacement code using their current
password. Switching trainers signs out and reloads the game; it also switches
other open game tabs. Pending saves stay in that trainer's local storage.

Account saves sync automatically and restore on another signed-in device. Offline
play queues saves locally; keep the device's browser data until syncing finishes.
The status below the home menu shows whether saves reached the cloud. Concurrent
device edits require choosing **this device** or **cloud save** in Trainer before
sync resumes. League, story and Skybound saves resolve separately; keeping one version
replaces the other. A session that expires must sign in again to upload pending
progress. Storage-blocked browsers can still play, but should keep the tab open
until cloud saving succeeds.

On a returning visit, the arcade home shows the last saved trainer and progress
from this device while it checks the session and fetches the latest cloud saves.
The home updates if the trainer or progress changed. Games wait for that check
before loading or writing trainer saves.
Vercel lets browsers reuse the home page's versioned scripts and styles for a day;
account API responses remain uncached. Bump a changed asset's `?v=` value when
publishing it.

Guest progress is never assigned automatically. After signing in, choose
**Import guest progress**, review the summary, select individual saves and confirm. This
affects only the current trainer. The guest save remains available. Browser saves
belong to their original host: to import an existing GitHub Pages save into the
Vercel version, open Trainer on GitHub Pages and choose **Download guest progress**. On
Vercel, sign in, open Trainer and choose **Import a progress file**, review the
summary, choose the saves to bring, and confirm. Existing account progress is
not selected for replacement by default. The signed-in arcade offers to bring
guest progress from this device. Older progress files with only League and story
saves remain compatible. Signing in alone cannot read another site's localStorage.

### Production setup

1. Import `jekkiechan/pattern-game` into Vercel. `vercel.json` builds playable
   assets into `public/` and explicitly rewrites `/api/:path*` to the account Node
   Function (`api/trainer.js`). No framework
   conversion is needed. The repository root remains playable on GitHub Pages.
2. Connect a Neon Postgres database through Vercel Marketplace (or an existing
   Postgres database) and supply `DATABASE_URL`. Use the provider's TLS-enabled
   pooled connection string. Never put it in browser code.
3. Set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters and
   `BETTER_AUTH_URL` to the exact site's origin, e.g. `https://your-game.vercel.app`.
   Auth uses Better Auth's username plugin, password hashing, session cookies and
   database-backed rate limits. The library requires an internal email identifier;
   the server generates a random `@trainer.invalid` value and never sends email.
4. Run the included migration with server-side variables securely supplied. For
   local development, link the project and pull Development variables into
   `.env.local`, then run `npm run db:migrate`. Vercel does not return Production
   Secret values from `env pull`; run a reviewed one-time migration in a trusted
   server environment for production instead of printing or copying credentials.
   The migration creates the
   Better Auth schema plus progress, hashed recovery-code and rate-limit tables.
   Run migrations again when changing auth plugins/schema. Do not run migrations
   during the public build.
5. Deploy and verify sign-up → code saved → battle → sign-out → another account →
   sign-in on a separate device. Preview deployments need their own database and
   exact `BETTER_AUTH_URL`; do not point previews at production account data.

Without the server variables/schema, guest play still works and account actions
explain that the service is unavailable. Only `build:site` enables the account
client on every published page; the committed Pages HTML does not probe an API that
Pages cannot serve. The client loads the current trainer and all three save slots
with one `/api/trainer/bootstrap` request before starting a game. API responses
are never cached. Progress endpoints use the
authenticated session, expected trainer ID, parameterized SQL and optimistic
revisions; another user's ID in the payload cannot select their save.

### Account validation

`npm run test:accounts` uses a real Postgres engine in WASM (PGlite), the production
`pg` driver and Better Auth to check account isolation, revision conflicts,
cross-origin rejection, single-use recovery, session revocation and rate limits.
`node tests/account-server.mjs` starts an isolated in-memory account test server
on port 8000; then run `python tests/accounts_check.py` for real browser flows,
cross-device restoration in both games, offline conflicts, selective guest imports,
two-field signup and mobile arcade/dialog layouts. These test tools
never connect to production. CI requires both suites alongside existing checks.

## Run and build

Serve this directory with `python -m http.server 8000`. The committed bundles run without installing packages or contacting a CDN. To change game or shared account source, run `npm ci` and `npm run build` (Node 20+). Commit the rebuilt `assets/beybattle.js` and `assets/accounts.js` alongside source changes. GitHub Pages publishes the repository root of `main`.

## Visual learning

Choose **Learn in 3 moves** on the home screen (or **?** anywhere) for short Dash, Guard and Special demonstrations using the blade artwork. Switch moves at your own pace or replay an animation; detailed controls and counter timing are under **Controls & timing tips**. **Try it in practice** opens the safe arena, where a miniature demonstration, three-step progress indicator and highlighted action teach each move. Guard advances only after an actual blocked hit. Finishing practice returns you to your duel or league setup.

Demonstrations play once per selection, use no extra 3D renderer, and become static diagrams with reduced motion or performance mode. Practice demonstrations pause with the battle. The home screen prioritizes play and learning; story, practice and championship stay available. Blade descriptions and signature mechanics are under **Blade details** in the loadout. The launch target shows where to time your tap for the energy bonus.

## Controls and mobile

- Launch: press Launch in the blue zone / Space for 14 starting energy, or skip timing for a standard launch.
- Dash: button / Q. Guard: button / E. A guard timed within 0.35 seconds of an incoming rush or special blocks 90% and opens a 1.8-second counter-dash window; a landed counter adds 3 damage. Special: one tap / Space when energy is full.
- Blades move automatically. Optionally hold the stadium or use arrows / WASD to steer.
- Pause: button / P / Escape. Losing focus or switching tabs pauses the battle.
- Portrait and landscape layouts keep controls outside the central action. Settings include sound, reduced motion and performance mode. Settings and trophies save on this device; previous trophies migrate.
- Climber: arrows / A and D, arena touch steering, or left/right touch buttons. Bounce automatically; Space / Burst adds an air jump at full charge. New centered landings add 35 charge; stars add 45. Hold Down / S / Drop to pass through platforms. Pause with P / Escape or the button. Sound and reduced motion are available. The map offers unlocked stage replays and Comet, Nimbus or Volt flight styles.

## Architecture and rendering

`src/beybattle/engine.js` is a deterministic simulation independent of the UI and renderer. `roster.js` contains blade roles, visual motifs, normalized special strengths and arena rules. `tutorial.js` owns the visual help demonstrations; `app.js` owns screens, input and persistence; `progression.js` owns tier unlocks, skill goals and saved best stars. `models.js` builds layered metal/resin blades with cutouts, gear teeth, bolts and crest textures. `renderer.js` renders the same Three.js models in previews and battle; `fallback.js` provides playable Canvas 2D compatibility. `audio.js` synthesizes short sounds. `css/league.css` owns the responsive interface.

Simulation runs at 120 Hz with interpolated rendering. Rendering caps device pixel ratio at 1.7 (1 in performance mode), limits live model cache to eight, merges repeated geometry, uses instanced stadium details, and pools 128 sparks / ten rings. The collection uses compact pre-rendered images of the actual models, avoiding 33 model builds while browsing. Menus render at half display rate. Sustained slow frames enable performance mode. Launch ripples, dash trails, impact sparks, special pulses and finish celebrations communicate the action. Reduced motion disables optional movement effects. No downloaded model or texture packages are needed. The Three.js bundle is self-hosted; its MIT notice is in `THIRD_PARTY_NOTICES.txt`.

Signature moves use a shared projected effects layer (`special-effects.js`) in both WebGL and Canvas: comet rush trails, expanding shockwaves, shield domes, recovery spirals, spin-steal tethers and orbiting counter blades. Each activation shows its name and move type, with separate player/rival banners. Special impacts follow actual damage events, including blocked hits and reflected counters; visuals do not change combat timing or balance. Pause freezes effects, new rounds clear them, and reduced motion uses stationary rings/symbols instead of moving effects or camera shake. Performance mode reduces effect detail and pixel density; trails and impact bursts are capped.

`python tests/special_effects_check.py` checks every move type in WebGL and Canvas, pause, expiry, simultaneous specials, mobile layouts, reduced motion, performance mode and finishing hits. It runs as a separate browser job in CI, required by the merge gate.

Climber uses classic scripts under `js/climber/`, with fixed 60 Hz timing, interpolated rendering, cached blade art, offscreen culling and capped pixel density. Stage routes are authored, moving-platform travel is bounded, and crumbled platforms return after three seconds. Wind is telegraphed before it affects later stages. Saved progress is stored as earned medal bits, so replays cannot remove achievements. If browser storage is blocked, play continues for the current visit.

## Validation

`npm test` runs engine and story-state regressions plus a mirrored round robin. `node tests/balance.mjs --seeds=32 --seed=98765 --gate` reproduces the standard-arena holdout. Other stadiums use `--arena=rail|glacier|volcano|cyber|void --seeds=32 --seed=145 --gate`. Detailed results: `tests/balance-report.json`.

The tier update passed 118,272 mirrored matches at the actual 120 Hz game step: all six arenas plus an independent standard-arena holdout, using 32 seeds per blade pair. Individual blade win rates across all reports ranged from 40.2–57.5%, within the 40–60% gate. Standard arena: 40.8–56.3%; holdout: 40.6–57.5%. `tests/tactics.mjs` also verifies that timed defensive play outperforms mashing in a fixed 80-seed God-tier matchup. These are automated comparisons, not a substitute for playtesting with children.

With Python Playwright and Chromium installed, run `python tests/browser_check.py` and `python tests/climber_check.py` against the local server (`GAME_URL` and `QA_OUTPUT` are optional). Beybattle checks roster/tier filtering, keyboard/touch input, pause, first-to-two progression, rematches, championship, guided practice, saved league unlocks, model-cache bounds, portrait/landscape layout and Canvas fallback. Climber checks all 30 stage/flight-style combinations using actual steering inputs and unchanged physics, 30/60/120 Hz display timing, star-preserving rescues, saved medals/tiers, keyboard/touch burst, mobile layouts and blocked storage. Physical-phone performance and child playtesting have not been measured.

`src/beybattle/journey.js` owns the authored chapters and validated save transitions; `journey-ui.js` renders the starter selection, region map, dialogue and journal. `app.js` connects story encounters to the existing battle engine. `python tests/journey_check.py` checks the six-chapter ending, losses/retries, choices, reloads, locked routes, journal, confirmed reset, four responsive layouts, local fonts, and blocked storage with Canvas fallback. Its battle outcomes are forced through the existing inspection surface to test progression; engine/tactics tests cover battle mechanics.

## CI and automatic merging

GitHub Actions runs on PRs to `main`, pushes to `main`, and manual dispatch. CI verifies a clean rebuild of the committed bundle, engine/story/auto-merge regressions, the 32-seed balance gate, and three Chromium browser suites (Beybattle, Skybound and Trainer Journey). Browser screenshots and reports are retained as workflow artifacts for 14 days. The **CI passed** job succeeds only when every build and browser job succeeds.

After successful PR CI, a separate **Auto-merge after CI** workflow squash-merges open, non-draft PRs from branches in this repository, authored by owners, members or collaborators. It rechecks every job, the current PR head SHA, branch, and GitHub mergeability. Forks, stale runs, failed/skipped jobs and blocked reviews do not merge. The privileged workflow executes its script from `main`, never from the PR branch, and does not download PR artifacts. GitHub’s existing branch rules still apply. This workflow performs the CI-gated merge directly; it does not depend on GitHub’s repository-level auto-merge setting.

Token-based merges do not automatically start the usual branch-based Pages build, so the workflow explicitly requests that build after merging. The initial PR that installs these workflows must be merged after its checks pass; subsequent PRs use the automation. Keep a PR in draft to prevent automatic merging.

To run browser checks locally, install `python -m pip install -r tests/requirements.txt` and `python -m playwright install chromium`. Tests use `CHROMIUM_PATH` if set, otherwise system Chromium when available, otherwise Playwright’s downloaded Chromium.

# Pattern Arcade accounts

Read the root and server guides before changing account behavior. This shared
layer is loaded on the arcade, both games and the field guide. `entry.js` exposes
`patternAccountsReady` and the resolved `patternAccounts` storage instance.
Games must await it before reading progress; Skybound's boot loader then loads
its classic scripts in order so the existing global simulation stays intact.

Keep signup to trainer name + password, optional guest play, downloadable recovery
codes, and a visible active trainer in each game. Account switching reloads the
page. Preserve existing usernames, cookies, guest keys and per-account local keys.
Guest imports select individual saves and never automatically replace a trainer.

`save-data.js` validates League, story and Skybound slots on client and server.
Changing the allowed slots also needs the SQL constraint migration, applied
before production deployment. Preserve session/expected-user/revision checks.
Never put credentials in browser assets. Build and commit both generated bundles;
run account API/browser checks plus all affected game suites and review phone UI.

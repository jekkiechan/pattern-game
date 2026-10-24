# Trainer account service

Read the root guide before editing. `api/trainer.js` is the single Vercel Node
Function; `vercel.json` explicitly rewrites all nested API paths to it using
`__trainer_route`. Preserve the original route/query via `requestURL` and keep
the account API/browser tests exercising that rewritten path. A Next.js-style
`api/[...path].js` does not capture nested paths in this plain static project.

Never log credentials or include server files in `public/`. The database chooses
the user from the session; preserve expected-trainer and save-revision checks.

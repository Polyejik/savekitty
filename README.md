# Save Kitty / Спаси Пушка

Educational long-division game, RU/EN. The readable `index.html` is the single game entrypoint for local development and GitHub Pages.

Build: `python3 scripts/build_site.py`. Serve the generated `public/` directory. GitHub Actions runs this exact build, adding content hashes to active scripts. Historical `_parts/` and older script versions are not shipped.

A full game writes one result to `savekitty_analytics_v1` in localStorage after the ninth lock. `supabase-sync-v2.js` sends pending results to the Worker with a persistent `completion_id`, so retries are idempotent. The Hall of Fame reads local results. The sponsor dashboard reads actual aggregate data from the Worker; it never substitutes demo values on failure.

Worker: `worker/src/index.js`, deployment configuration: `worker/wrangler.jsonc`. Pages and Worker are separate deployments; changing only Pages cannot fix API code.

Regression checks: `npm ci --prefix tests`, then `QA_MODULES="$PWD/tests/node_modules" node tests/regression.cjs` and `QA_MODULES="$PWD/tests/node_modules" node tests/dashboard-sql.cjs`. Tests mock outbound requests; no test completions are submitted to production.

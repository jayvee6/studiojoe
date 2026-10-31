# Tests

The site has no npm and no build step, so the test dependency lives outside the repo.

One-time setup (macOS, needs Google Chrome installed):

```bash
npm i --prefix ~/.cache/studiojoe-tests playwright-core@1.49.1
```

Run:

```bash
node tests/site.test.cjs                 # all browser tests
node tests/site.test.cjs --only wall     # one group: smoke, structure, wall, play, head, pages
bash tests/media.test.sh                 # clip-wall media checks (needs ffprobe)
```

Set `SJ_TEST_MODULES` to use a different `node_modules` path. `tests/` is excluded from the Vercel deploy by `.vercelignore`.

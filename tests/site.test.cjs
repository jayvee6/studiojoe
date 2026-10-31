// Browser tests for studiojoe.dev. Run: node tests/site.test.cjs [--only <group>]
'use strict';
const { withSite, check, done } = require('./harness.cjs');

const only = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const groups = {};

groups.smoke = async ({ base, browser }) => {
  const page = await browser.newPage();
  await page.goto(base + '/index.html');
  check('smoke: page title', (await page.title()).length > 0);
  await page.close();
};

withSite(async (ctx) => {
  for (const [name, run] of Object.entries(groups)) {
    if (only && name !== only) continue;
    await run(ctx);
  }
}).then(done);

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

const SLUGS = ['shabang', 'lucia-bob', 'frozone', 'luigi', 'fried-chicken-hour', 'so-good'];
const TIKTOK = 'https://www.tiktok.com/@studio_joe';

// WCAG contrast of an rgba() text color composited over an opaque hex background.
function contrast(rgba, bgHex) {
  const m = rgba.match(/[\d.]+/g).map(Number);
  const [r, g, b, a = 1] = m;
  const bg = bgHex.match(/\w\w/g).map(h => parseInt(h, 16));
  const mix = [r, g, b].map((c, i) => c * a + bg[i] * (1 - a));
  const lum = c => { const s = c.map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]; };
  const [L1, L2] = [lum(mix), lum(bg)].sort((x, y) => y - x);
  return (L1 + 0.05) / (L2 + 0.05);
}

groups.structure = async ({ base, browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const res = await page.goto(base + '/index.html');
  const src = await res.text();

  const nav = await page.$$eval('header nav a', as => as.map(a => [a.textContent.trim(), a.getAttribute('href')]));
  check('structure: nav labels', JSON.stringify(nav.map(n => n[0])) === JSON.stringify(['Watch', 'Play', 'About', '@studio_joe ↗']), nav);
  check('structure: nav tiktok href', nav.length && nav[nav.length - 1][1] === TIKTOK, nav);

  const tiles = await page.$$eval('#watch .wall .tile', ts => ts.map(t => ({
    slug: t.dataset.slug,
    href: t.querySelector('.tile-link')?.getAttribute('href') || '',
    target: t.querySelector('.tile-link')?.getAttribute('target'),
    credit: t.querySelector('.tile-credit')?.textContent.trim() || '',
    top: t.offsetTop,
  })));
  check('structure: six tiles in order', JSON.stringify(tiles.map(t => t.slug)) === JSON.stringify(SLUGS), tiles.map(t => t.slug));
  check('structure: tiles link to tiktok in new tab', tiles.length === 6 && tiles.every(t => t.href.startsWith(TIKTOK + '/video/') && t.target === '_blank'), tiles);
  check('structure: every tile credited', tiles.length === 6 && tiles.every(t => t.credit.length > 0), tiles.map(t => t.credit));
  check('structure: one row desktop', tiles.length === 6 && tiles.every(t => t.top === tiles[0].top), tiles.map(t => t.top));

  const videoTags = src.match(/<video[^>]*class="tile-video"[^>]*>/g) || [];
  check('structure: video attrs in served HTML', videoTags.length === 6 && videoTags.every(v => /\smuted[\s>]/.test(v) && /\splaysinline[\s>]/.test(v) && /\sloop[\s>]/.test(v)), videoTags.length);

  const body = await page.$eval('body', b => b.innerText);
  check('structure: copy has Apple and Adobe', body.includes('Apple and Adobe'));
  check('structure: copy has email', body.includes('jvilla@studiojoe.dev'));
  check('structure: copy has resume on request', body.includes('Resume available on request'));
  check('structure: no current-employer wording', !/\b(currently|now at|present)\b/i.test(body), body.match(/\b(currently|now at|present)\b/i));
  check('structure: no dead-end copy', !/coming|soon|store/i.test(body), body.match(/coming|soon|store/i));
  check('structure: no linkedin', !/linkedin/i.test(src));
  check('structure: no resume links', (await page.$$('a[href*="resume"]')).length === 0);

  const views = await page.$eval('.tile-views', e => getComputedStyle(e).color).catch(() => null);
  const ratio = views ? contrast(views, '060608') : 0;
  check('structure: tile views contrast >= 4.5', ratio >= 4.5, { views, ratio });
  const label3 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--label-3').trim());
  check('structure: --label-3 contrast >= 4.5', label3 && contrast(label3, '060608') >= 4.5, label3);

  const small = await page.$$eval('header a, header button, #about a, #about button, footer a, footer button',
    els => els.map(e => [e.textContent.trim(), Math.round(e.getBoundingClientRect().height)]).filter(x => x[1] < 44));
  check('structure: targets >= 44px', small.length === 0, small);

  const footer = await page.$eval('footer', f => ({ text: f.innerText, hrefs: [...f.querySelectorAll('a')].map(a => a.href) })).catch(() => ({ text: '', hrefs: [] }));
  check('structure: footer contact', footer.text.includes('jvilla@studiojoe.dev') && footer.hrefs.includes(TIKTOK) && footer.hrefs.includes('https://github.com/jayvee6'), footer);

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement.classList.contains('tile-link'))) break;
  }
  const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a);
    return { cls: a.className, w: parseFloat(cs.outlineWidth), style: cs.outlineStyle }; });
  check('structure: focus ring on tile', ring.cls.includes('tile-link') && ring.w >= 2 && ring.style !== 'none', ring);
  await page.close();

  const narrow = await browser.newPage({ viewport: { width: 320, height: 640 } });
  await narrow.goto(base + '/index.html');
  const fit = await narrow.evaluate(() => ({ sw: document.documentElement.scrollWidth,
    clipped: [...document.querySelectorAll('.tile-title')].filter(t => t.scrollWidth > t.clientWidth).map(t => t.textContent) }));
  check('structure: narrow 320 no h-scroll', fit.sw === 320, fit.sw);
  check('structure: narrow 320 titles not clipped', fit.clipped.length === 0, fit.clipped);
  await narrow.close();
};

withSite(async (ctx) => {
  for (const [name, run] of Object.entries(groups)) {
    if (only && name !== only) continue;
    await run(ctx);
  }
}).then(done);

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

async function waitFor(page, fn, ms) {
  const end = Date.now() + ms;
  let v;
  while (Date.now() < end) { v = await page.evaluate(fn).catch(() => undefined); if (v) return v; await page.waitForTimeout(150); }
  return v;
}

groups.wall = async ({ base, browser }) => {
  const playing = () => window.__wall && window.__wall.playing();

  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/index.html');
  const n = await waitFor(page, () => window.__wall && window.__wall.playing() === 6 && 6, 3000);
  check('wall: autoplay all six', n === 6, await page.evaluate(playing).catch(() => null));

  await page.$eval('#about', e => e.scrollIntoView());
  const paused = await waitFor(page, () => window.__wall && window.__wall.playing() === 0 && 'ok', 1500);
  check('wall: offscreen pause', paused === 'ok', await page.evaluate(playing).catch(() => null));
  await page.close();

  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page = await rctx.newPage();
  await page.goto(base + '/index.html');
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => ({ p: window.__wall ? window.__wall.playing() : null,
    srcs: [...document.querySelectorAll('.tile-video')].filter(v => v.hasAttribute('src')).length }));
  check('wall: reduced motion keeps posters', r.p === 0 && r.srcs === 0, r);
  await rctx.close();

  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/media/wall/*.mp4', route => route.abort());
  await page.goto(base + '/index.html');
  await page.waitForTimeout(2000);
  const blocked = await page.$$eval('.tile', ts => ts.map(t => {
    const v = t.querySelector('video'), title = t.querySelector('.tile-title');
    return !!v.getAttribute('poster') && getComputedStyle(v).visibility !== 'hidden' && title.getBoundingClientRect().height > 0;
  }));
  check('wall: video blocked keeps poster + title', blocked.length === 6 && blocked.every(Boolean) && errors.length === 0, { blocked, errors });
  await page.close();

  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs2 = [];
  page.on('pageerror', e => errs2.push(e.message));
  await page.route('https://cdnjs.cloudflare.com/**', route => route.abort());
  await page.goto(base + '/index.html');
  const n2 = await waitFor(page, () => window.__wall && window.__wall.playing() === 6 && 6, 3000);
  check('wall: no gsap dependency', n2 === 6 && errs2.length === 0, { n2, errs2 });
  await page.close();
};

groups.play = async ({ base, browser }) => {
  const want = { arcade: 'https://emojiarcade.io', musicnerd: 'https://musicnerd.studiojoe.dev/',
    ripple: 'https://ripplebreath.app', starspeller: 'https://starspeller.app' };
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/index.html');
  const cards = await page.$$eval('.play-card', cs => cs.map(c => ({ app: c.dataset.app,
    links: [...c.querySelectorAll('a')].map(a => [a.getAttribute('href'), a.getAttribute('target')]) })));
  const linksOk = cards.length === 4 && cards.every(c => c.links.length > 0 && c.links.every(([h, t]) => h === want[c.app] && t === '_blank'));
  check('play: four card links', linksOk, cards);

  const tops = await page.$$eval('.play-card', cs => cs.map(c => Math.round(c.getBoundingClientRect().top)));
  check('play: four cards on one row at desktop', tops.length === 4 && tops.every(t => t === tops[0]), tops);

  await page.click('header nav a[href="#play"]');
  await page.waitForTimeout(600);
  const cover = await page.evaluate(() => ({ eyebrow: document.querySelector('#play .eyebrow').getBoundingClientRect().top,
    header: document.querySelector('header').getBoundingClientRect().bottom }));
  check('play: nav jump clears the sticky header', cover.eyebrow >= cover.header, cover);

  await page.$eval('#play', e => e.scrollIntoView());
  const r = await waitFor(page, () => window.__fireworks && window.__fireworks.rockets() >= 1 && window.__fireworks.rockets(), 3000);
  check('play: fireworks auto-launch on screen', r >= 1, r);

  const url = page.url();
  const before = await page.evaluate(() => window.__fireworks ? window.__fireworks.rockets() : -1);
  const box = await page.$eval('#fwCanvas', c => { const b = c.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height * 0.8 }; });
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => window.__fireworks ? window.__fireworks.rockets() : -1);
  check('play: tap launches without navigating', before >= 0 && after >= before + 1 && page.url() === url, { before, after });
  await page.close();

  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page = await rctx.newPage();
  await page.goto(base + '/index.html');
  await page.$eval('#play', e => e.scrollIntoView());
  await page.waitForTimeout(3000);
  const rr = await page.evaluate(() => window.__fireworks ? window.__fireworks.rockets() : null);
  check('play: reduced motion launches nothing', rr === 0, rr);
  await rctx.close();
};

groups.head = async ({ base, browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  page.on('console', m => { if (m.type() === 'error') bad.push('console: ' + m.text()); });
  await page.goto(base + '/index.html');
  await page.waitForTimeout(800);
  const meta = await page.evaluate(() => {
    const q = s => document.querySelector(s)?.getAttribute('content') || null;
    return { title: document.title, desc: q('meta[name=description]'), ogt: q('meta[property="og:title"]'),
      ogd: q('meta[property="og:description"]'), ogi: q('meta[property="og:image"]'), tw: q('meta[name="twitter:card"]'),
      icon: document.querySelector('link[rel=icon]')?.getAttribute('href') || null,
      apple: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href') || null };
  });
  check('head: title', meta.title === 'Studio Joe', meta.title);
  check('head: description mentions AI video', /AI video/.test(meta.desc || ''), meta.desc);
  check('head: og + twitter tags', !!meta.ogt && !!meta.ogd && meta.ogi === 'https://studiojoe.dev/media/og.jpg' && meta.tw === 'summary_large_image', meta);
  check('head: icon links', meta.icon === '/favicon.svg' && meta.apple === '/apple-touch-icon.png', meta);
  for (const p of ['/favicon.svg', '/apple-touch-icon.png', '/media/og.jpg']) {
    const r = await page.request.get(base + p);
    check('head: serves ' + p, r.status() === 200, r.status());
  }
  check('head: no 4xx or console errors on load', bad.length === 0, bad);
  const og = await page.evaluate(() => new Promise(res => { const i = new Image();
    i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = '/media/og.jpg'; }));
  check('head: og image 1200x630', og && og[0] === 1200 && og[1] === 630, og);
  await page.close();
};

groups.pages = async ({ base, browser }) => {
  const fs = require('fs'), path = require('path');
  const root = path.resolve(__dirname, '..');
  const pages = [...fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => '/' + f),
    ...fs.readdirSync(path.join(root, 'savers')).filter(f => f.endsWith('.html')).map(f => '/savers/' + f)];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(base + '/index.html');
  const homeNav = await page.$$eval('header nav a', as => as.map(a => [a.textContent.trim(), a.getAttribute('href')]));
  await page.goto(base + '/savers.html');
  const saversNav = await page.$$eval('header nav a', as => as.map(a => [a.textContent.trim(), a.getAttribute('href')]));
  const norm = nav => nav.map(([t, h]) => [t, h.replace(/^\/?(index\.html)?#/, '#')]);
  const want = norm(homeNav).map(([t, h]) => [t, h.startsWith('#') ? '/' + h : h]);
  check('pages: savers header matches homepage', JSON.stringify(saversNav) === JSON.stringify(want), { saversNav, want });
  const sFoot = await page.$eval('footer', f => [...f.querySelectorAll('a')].map(a => a.getAttribute('href')));
  const saversAll = await page.$$eval('a', as => as.map(a => a.getAttribute('href') || ''));
  check('pages: savers links no private repo', !saversAll.some(h => /studiojoe-savers-web/.test(h)), saversAll);
  check('pages: savers footer matches homepage', sFoot.includes('mailto:jvilla@studiojoe.dev') && sFoot.includes('https://www.tiktok.com/@studio_joe'), sFoot);

  const offenders = [];
  for (const p of pages) {
    if (p === '/resume.html') continue;
    await page.goto(base + p);
    const bad = await page.$$eval('a', as => as.map(a => a.getAttribute('href') || '').filter(h => /linkedin|resume/i.test(h)));
    if (bad.length) offenders.push([p, bad]);
  }
  check('pages: no linkedin or resume links anywhere', offenders.length === 0, offenders);

  const r = await page.goto(base + '/resume.html');
  const robots = await page.$eval('meta[name=robots]', m => m.content).catch(() => null);
  check('pages: resume unlisted (200 + noindex)', r.status() === 200 && /noindex/.test(robots || ''), { status: r.status(), robots });
  await page.close();
};

withSite(async (ctx) => {
  for (const [name, run] of Object.entries(groups)) {
    if (only && name !== only) continue;
    await run(ctx);
  }
}).then(done);

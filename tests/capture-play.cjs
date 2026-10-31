// Re-records the Play card previews from the live apps: node tests/capture-play.cjs [segment]
// Then encode with ffmpeg (fps=30, 640x400, h264, no audio) into media/play/ — see PR #25.
// Records real app footage through CDP screencast (headed Chrome, real GPU).
// Writes frames/<seg>/NNNNN.jpg + frames/<seg>/list.txt (ffmpeg concat with true durations).
const fs = require('fs'), path = require('path');
const { chromium } = require(require('os').homedir() + '/.cache/studiojoe-tests/node_modules/playwright-core');
const only = process.argv[2];

async function record(page, seg, secs, act) {
  const dir = path.join('frames', seg); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', f => { frames.push({ data: f.data, t: f.metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 960, maxHeight: 600 });
  const t0 = Date.now(); let stop = false;
  const acting = act ? act(() => stop || Date.now() - t0 > secs * 1000) : null;
  await page.waitForTimeout(secs * 1000); stop = true;
  await cdp.send('Page.stopScreencast'); if (acting) await acting.catch(() => {});
  let list = '';
  frames.forEach((f, i) => {
    const n = String(i).padStart(5, '0') + '.jpg'; fs.writeFileSync(path.join(dir, n), Buffer.from(f.data, 'base64'));
    const d = i + 1 < frames.length ? frames[i + 1].t - f.t : 1 / 30;
    list += `file '${n}'\nduration ${d.toFixed(4)}\n`;
  });
  fs.writeFileSync(path.join(dir, 'list.txt'), list);
  const span = frames.length ? frames[frames.length - 1].t - frames[0].t : 0;
  console.log(seg, frames.length, 'frames', span.toFixed(2) + 's', (frames.length / Math.max(span, 0.01)).toFixed(1) + 'fps');
}
const hold = async (page, key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };

const SEGS = {
  'arcade-slopes': async p => { await p.goto('https://emojiarcade.io/?game=slopes'); await p.waitForTimeout(3500);
    await record(p, 'arcade-slopes', 2.4, async done => { let k = 0; while (!done()) await hold(p, k++ % 2 ? 'ArrowLeft' : 'ArrowRight', 420); }); },
  'arcade-squadron': async p => { await p.goto('https://emojiarcade.io/?game=squadron'); await p.waitForTimeout(4200);
    await record(p, 'arcade-squadron', 2.4, async done => { let k = 0; while (!done()) await hold(p, ['a', 'w', 'd', 's'][k++ % 4], 350); }); },
  'arcade-survivors': async p => { await p.goto('https://emojiarcade.io/?game=survivors'); await p.waitForTimeout(2000);
    await p.keyboard.press('Enter'); await p.waitForTimeout(9000);
    await record(p, 'arcade-survivors', 2.4, async done => { let k = 0; while (!done()) await hold(p, ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'][k++ % 4], 450); }); },
  'arcade-bubbles': async p => { await p.goto('https://emojiarcade.io/?game=bubbles'); await p.waitForTimeout(2500);
    await record(p, 'arcade-bubbles', 2.4, async done => { let k = 0; while (!done()) {
      const x = 480 + (k++ % 2 ? -1 : 1) * (90 + 45 * (k % 3));
      await p.mouse.move(480, 570); await p.mouse.down(); await p.mouse.move(x, 225, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(500); } }); },
  'musicnerd': async p => { for (const v of [0, 12, 54, 102]) { await p.goto('https://musicnerd.studiojoe.dev/?v=' + v); await p.mouse.move(959, 10); await p.waitForTimeout(4000); await record(p, 'musicnerd-' + v, 2.4); } },
  'ripple': async p => { await p.goto('https://ripplebreath.app'); await p.waitForTimeout(1500); await p.getByText('Coherent', { exact: true }).click(); await p.mouse.move(959, 590);
    await p.waitForTimeout(800); await record(p, "ripple", 11.0); },
  'starspeller': async p => { await p.goto('https://starspeller.app'); await p.waitForTimeout(1500); await p.getByText('Short A Asteroids').click(); await p.mouse.move(959, 10); await p.waitForTimeout(2000);
    await record(p, 'starspeller', 8.5, async done => { while (!done()) {
      const k = await p.$eval('.osk-key.next', e => e.textContent.trim()).catch(() => null);
      if (k) await p.keyboard.press(k); await p.waitForTimeout(380); } }); },
};

(async () => {
  const b = await chromium.launch({ headless: false, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--window-size=960,680', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 960, height: 600 } });
  for (const [k, fn] of Object.entries(SEGS)) if (!only || k.startsWith(only)) await fn(p);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
